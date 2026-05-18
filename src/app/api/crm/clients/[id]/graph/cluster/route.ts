/**
 * GET /api/crm/clients/[id]/graph/cluster?depth=2
 *
 * Expand the relationship graph rooted at the given client by N hops
 * (default depth=2, max depth=3) and return the resulting connected
 * component as a `ClientCluster`.
 *
 * Strategy: BFS over the per-pair edges. At each hop, we call back into
 * the same detection logic the 1-hop endpoint uses (via an internal fetch
 * to keep the detection rules in one place) — for now we re-use the
 * lighter `findRelatedUserIds` helper to discover neighbours without
 * materialising every node, then we run the full 1-hop detection on the
 * boundary set to assemble edges.
 *
 * The cluster score combines `pairScore()` for each edge with a cluster-
 * size boost via `clusterScore()`.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { mapUserToClient } from "@/lib/crm/clients/mapper";
import { clusterScore, pairScore } from "@/lib/risk-engine/graph";
import type {
  ClientCluster, ClientGraphEdge, ClientGraphEdgeKind, ClientGraphNode,
} from "@/types/core";

const ROLES_READ = [
  "admin", "compliance_officer", "support_agent",
  "risk_manager", "finance_officer", "viewer",
] as const;

const MAX_DEPTH = 3;
const MAX_NODES = 80; // safety cap

function clientIdFromPath(req: NextRequest): string | null {
  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  // .../clients/[id]/graph/cluster
  return parts[parts.length - 3] ?? null;
}

interface ClusterResponse {
  success: boolean;
  cluster?: ClientCluster;
  nodes?: ClientGraphNode[];
  error?: string;
}

export const GET = requireRole([...ROLES_READ], async (req: NextRequest) => {
  const id = clientIdFromPath(req);
  if (!id) {
    return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
  }
  const depthParam = Number(req.nextUrl.searchParams.get("depth") ?? "2");
  const depth = Math.max(1, Math.min(MAX_DEPTH, depthParam));

  try {
    // Discover the connected component via BFS through the 1-hop API.
    const visited = new Set<string>([id]);
    const frontier = new Set<string>([id]);
    const allEdges: ClientGraphEdge[] = [];

    for (let hop = 0; hop < depth; hop++) {
      const nextFrontier = new Set<string>();
      for (const userId of frontier) {
        if (visited.size > MAX_NODES) break;
        const graph = await fetchInternalGraph(req, userId);
        if (!graph) continue;
        for (const e of graph.edges) {
          // Canonicalise edge ordering (source < target) for de-dup.
          const a = e.source < e.target ? e.source : e.target;
          const b = e.source < e.target ? e.target : e.source;
          // Skip if we already have an edge of this kind between this pair.
          if (!allEdges.some((x) => {
            const xA = x.source < x.target ? x.source : x.target;
            const xB = x.source < x.target ? x.target : x.source;
            return xA === a && xB === b && x.kind === e.kind;
          })) {
            allEdges.push(e);
          }
        }
        for (const n of graph.nodes) {
          if (!visited.has(n.id)) {
            visited.add(n.id);
            nextFrontier.add(n.id);
          }
        }
      }
      if (nextFrontier.size === 0) break;
      frontier.clear();
      for (const v of nextFrontier) frontier.add(v);
    }

    const memberIds = [...visited];

    // Load full node data for every cluster member.
    const userRows = await prisma.user.findMany({
      where: { id: { in: memberIds } },
      include: {
        wallets: { select: { balance: true, frozen: true, currency: true } },
        mtAccounts: { select: { equity: true, balance: true } },
        kycRecord: { select: { amlRiskScore: true, kycLevel: true, status: true } },
      },
    });
    const memberNodes: ClientGraphNode[] = userRows.map((u) => {
      const mapped = mapUserToClient(u);
      return {
        id: mapped.id, uid: mapped.uid, name: mapped.name,
        email: mapped.email, phone: mapped.phone, country: mapped.country,
        kycStatus: mapped.kycStatus,
        riskLevel: (mapped.riskLevel ?? "low") as ClientGraphNode["riskLevel"],
        riskScore: mapped.riskScore ?? 0,
        lastLoginAt: mapped.lastLoginAt,
        createdAt: mapped.createdAt,
        kind: u.id === id ? "center" : "mixed",
      };
    });

    // Group edges by canonicalised pair, then compute per-pair score.
    const pairBuckets = new Map<string, ClientGraphEdge[]>();
    for (const e of allEdges) {
      const a = e.source < e.target ? e.source : e.target;
      const b = e.source < e.target ? e.target : e.source;
      const key = `${a}|${b}`;
      const list = pairBuckets.get(key) ?? [];
      list.push(e);
      pairBuckets.set(key, list);
    }

    const pairScores: number[] = [];
    let hardCount = 0, mediumCount = 0, softCount = 0;
    const kindsInCluster = new Set<ClientGraphEdgeKind>();
    let firstSeen: string | undefined, lastSeen: string | undefined;
    for (const edges of pairBuckets.values()) {
      pairScores.push(pairScore(edges));
      for (const e of edges) {
        kindsInCluster.add(e.kind);
        const s = e.strength ?? "soft";
        if (s === "hard") hardCount++;
        else if (s === "medium") mediumCount++;
        else if (s === "soft") softCount++;
        if (e.detectedAt && (!firstSeen || e.detectedAt < firstSeen)) firstSeen = e.detectedAt;
        if (e.lastSeenAt && (!lastSeen || e.lastSeenAt > lastSeen)) lastSeen = e.lastSeenAt;
      }
    }

    const cluster: ClientCluster = {
      id: clusterIdFromMembers(memberIds),
      memberIds,
      edges: allEdges,
      score: clusterScore(pairScores, memberIds.length),
      hardCount, mediumCount, softCount,
      kinds: [...kindsInCluster],
      firstSeenAt: firstSeen ?? new Date().toISOString(),
      lastSeenAt: lastSeen ?? new Date().toISOString(),
    };

    const body: ClusterResponse = { success: true, cluster, nodes: memberNodes };
    return NextResponse.json(body);
  } catch (error) {
    console.error("GET /api/crm/clients/[id]/graph/cluster failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to compute cluster" },
      { status: 500 }
    );
  }
});

/* --------------------------------------------------------------------- */
/* Helpers                                                               */
/* --------------------------------------------------------------------- */

/** Stable cluster id — sorted joined member-id hash. */
function clusterIdFromMembers(ids: string[]): string {
  const sorted = [...ids].sort().join(",");
  let h = 0;
  for (let i = 0; i < sorted.length; i++) h = (h * 31 + sorted.charCodeAt(i)) | 0;
  return `cluster_${Math.abs(h).toString(36)}`;
}

interface GraphPayload {
  success: boolean;
  nodes: { id: string }[];
  edges: ClientGraphEdge[];
}

/** Internal fetch — calls the 1-hop graph endpoint to reuse detection. */
async function fetchInternalGraph(
  req: NextRequest,
  userId: string
): Promise<{ nodes: { id: string }[]; edges: ClientGraphEdge[] } | null> {
  const url = new URL(`/api/crm/clients/${encodeURIComponent(userId)}/graph`, req.url);
  try {
    const res = await fetch(url.toString(), {
      headers: {
        // Forward auth cookie so requireRole accepts the call.
        cookie: req.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    interface ApiEdgeWire {
      source: string;
      target: string;
      kind?: ClientGraphEdgeKind;
      type?: ClientGraphEdgeKind;
      label: string;
      strength?: ClientGraphEdge["strength"];
      detectedAt?: string;
      lastSeenAt?: string;
    }
    const data = (await res.json()) as Omit<GraphPayload, "edges"> & {
      edges: ApiEdgeWire[];
    };
    if (!data.success) return null;
    // The 1-hop endpoint emits `type` instead of `kind` on the wire.
    const edges: ClientGraphEdge[] = data.edges.map((e) => ({
      source: e.source,
      target: e.target,
      kind: (e.kind ?? e.type) as ClientGraphEdgeKind,
      label: e.label,
      strength: e.strength,
      detectedAt: e.detectedAt,
      lastSeenAt: e.lastSeenAt,
    }));
    return { nodes: data.nodes, edges };
  } catch {
    return null;
  }
}
