/**
 * GET /api/crm/relationships/clusters?minScore=70&limit=20
 *
 * Returns the top-N highest-risk clusters across the entire client base.
 * Reads from `ClientRelationshipScore` — a materialised cache populated
 * by the relationship-engine batch job. Until the cache exists this
 * endpoint returns an empty list with `success: true` so the UI can
 * still render the placeholder state.
 *
 * Each cluster summary includes: cluster id, member preview (top-3
 * names + total count), composite score, evidence counters, and the
 * representative top-edge from that cluster.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { mapUserToClient } from "@/lib/crm/clients/mapper";

const ROLES_READ = [
  "admin", "compliance_officer", "support_agent",
  "risk_manager", "finance_officer", "viewer",
] as const;

interface ClusterSummary {
  id: string;
  memberIds: string[];
  preview: { id: string; name: string; uid: string; riskScore: number }[];
  memberCount: number;
  score: number;
  hardCount: number;
  mediumCount: number;
  softCount: number;
  kinds: string[];
  lastSeenAt: string;
}

export const GET = requireRole([...ROLES_READ], async (req: NextRequest) => {
  const url = req.nextUrl;
  const minScore = Number(url.searchParams.get("minScore") ?? "60");
  const limit = Math.min(100, Number(url.searchParams.get("limit") ?? "20"));

  try {
    const rows = await safeFindRelationshipScores(minScore, limit);
    if (rows.length === 0) {
      return NextResponse.json({ success: true, clusters: [] });
    }

    // Union-find to cluster pairs that share a member.
    const parent = new Map<string, string>();
    const find = (x: string): string => {
      const p = parent.get(x);
      if (!p || p === x) return x;
      const root = find(p);
      parent.set(x, root);
      return root;
    };
    const union = (a: string, b: string) => {
      const ra = find(a), rb = find(b);
      if (ra !== rb) parent.set(ra, rb);
    };

    for (const r of rows) {
      if (!parent.has(r.userIdA)) parent.set(r.userIdA, r.userIdA);
      if (!parent.has(r.userIdB)) parent.set(r.userIdB, r.userIdB);
      union(r.userIdA, r.userIdB);
    }

    // Group pairs into clusters by representative.
    const groups = new Map<string, {
      memberIds: Set<string>;
      score: number;
      hard: number; medium: number; soft: number;
      kinds: Set<string>;
      lastSeen: string;
    }>();

    for (const r of rows) {
      const root = find(r.userIdA);
      let g = groups.get(root);
      if (!g) {
        g = { memberIds: new Set(), score: 0, hard: 0, medium: 0, soft: 0, kinds: new Set(), lastSeen: r.calculatedAt };
        groups.set(root, g);
      }
      g.memberIds.add(r.userIdA);
      g.memberIds.add(r.userIdB);
      g.score = Math.max(g.score, r.totalScore);
      g.hard += r.hardCount;
      g.medium += r.mediumCount;
      g.soft += r.softCount;
      for (const k of r.edgeKinds.split(",").filter(Boolean)) g.kinds.add(k);
      if (r.calculatedAt > g.lastSeen) g.lastSeen = r.calculatedAt;
    }

    // Resolve preview users for top groups.
    const allMemberIds = new Set<string>();
    for (const g of groups.values()) for (const m of g.memberIds) allMemberIds.add(m);

    const users = await prisma.user.findMany({
      where: { id: { in: [...allMemberIds] } },
      include: {
        wallets: { select: { balance: true, frozen: true, currency: true } },
        mtAccounts: { select: { equity: true, balance: true } },
        kycRecord: { select: { amlRiskScore: true, kycLevel: true, status: true } },
      },
    });
    const userMap = new Map(users.map((u) => [u.id, mapUserToClient(u)] as const));

    const clusters: ClusterSummary[] = [...groups.entries()].map(([root, g]) => {
      const memberIds = [...g.memberIds];
      // 3 highest-risk previews
      const preview = memberIds
        .map((id) => userMap.get(id))
        .filter((u): u is NonNullable<typeof u> => Boolean(u))
        .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
        .slice(0, 3)
        .map((u) => ({
          id: u.id, name: u.name, uid: u.uid, riskScore: u.riskScore ?? 0,
        }));
      return {
        id: `cluster_${root.slice(0, 12)}`,
        memberIds,
        memberCount: memberIds.length,
        preview,
        score: g.score,
        hardCount: g.hard,
        mediumCount: g.medium,
        softCount: g.soft,
        kinds: [...g.kinds],
        lastSeenAt: g.lastSeen,
      };
    });

    clusters.sort((a, b) => b.score - a.score);

    return NextResponse.json({ success: true, clusters });
  } catch (error) {
    console.error("GET /api/crm/relationships/clusters failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load clusters", clusters: [] },
      { status: 500 }
    );
  }
});

/* --------------------------------------------------------------------- */
/* Safe wrapper — table may not exist yet                                */
/* --------------------------------------------------------------------- */

async function safeFindRelationshipScores(minScore: number, limit: number) {
  try {
    const client = prisma as unknown as {
      clientRelationshipScore: {
        findMany: (args: unknown) => Promise<{
          userIdA: string; userIdB: string; totalScore: number;
          hardCount: number; mediumCount: number; softCount: number;
          edgeKinds: string; calculatedAt: string;
        }[]>;
      };
    };
    return await client.clientRelationshipScore.findMany({
      where: { totalScore: { gte: minScore } },
      orderBy: { totalScore: "desc" },
      take: limit,
      select: {
        userIdA: true, userIdB: true, totalScore: true,
        hardCount: true, mediumCount: true, softCount: true,
        edgeKinds: true, calculatedAt: true,
      },
    });
  } catch {
    return [];
  }
}
