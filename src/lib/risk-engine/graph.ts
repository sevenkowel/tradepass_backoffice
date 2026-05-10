/**
 * Client-graph helpers — colour, label, and severity utilities so every
 * page that renders a `ClientGraph` agrees on what each edge / node looks
 * like.
 *
 * Pure functions. No data fetching here — the graph data itself comes
 * from `/api/crm/clients/[id]/graph` (Prisma) or, in mock mode, from
 * `mockClientGraph` below.
 */
import type {
  ClientGraph,
  ClientGraphEdge,
  ClientGraphEdgeKind,
  ClientGraphNode,
  ClientGraphNodeKind,
} from "@/types/core";

/* ------------------------------------------------------------------------- */
/* Display tokens                                                            */
/* ------------------------------------------------------------------------- */

/** Hex colour applied to a node fill on the canvas. Aligned with the
 *  `slate / amber / emerald / red / violet / blue` palette in the design
 *  system rather than ad-hoc tints. */
export const NODE_COLOR: Record<ClientGraphNodeKind, string> = {
  center: "#3B82F6",         // blue-500 — distinct as the focus
  shared_ip: "#F59E0B",      // amber-500
  shared_device: "#10B981",  // emerald-500
  same_id: "#EF4444",        // red-500
  shared_payment: "#8B5CF6", // violet-500
  ib_relation: "#0EA5E9",    // sky-500
  mixed: "#A855F7",          // purple-500
};

/** Hex colour for the link line, keyed by edge kind. */
export const EDGE_COLOR: Record<ClientGraphEdgeKind, string> = {
  shared_ip: "#F59E0B",
  shared_device: "#10B981",
  same_id: "#EF4444",
  shared_payment: "#8B5CF6",
  ib_invited: "#0EA5E9",
};

/** Optional dash pattern for an edge — empty array → solid. */
export const EDGE_DASH: Record<ClientGraphEdgeKind, number[] | null> = {
  shared_ip: [5, 5],
  shared_device: null,
  same_id: [2, 3],
  shared_payment: [3, 3],
  ib_invited: null,
};

/* ------------------------------------------------------------------------- */
/* Labels                                                                    */
/* ------------------------------------------------------------------------- */

const NODE_LABEL: Record<ClientGraphNodeKind, string> = {
  center: "Center",
  shared_ip: "Shared IP",
  shared_device: "Shared Device",
  same_id: "Same Identity",
  shared_payment: "Shared Payment",
  ib_relation: "IB Relation",
  mixed: "Multiple Links",
};

const EDGE_LABEL: Record<ClientGraphEdgeKind, string> = {
  shared_ip: "Shared IP",
  shared_device: "Shared Device",
  same_id: "Same Identity",
  shared_payment: "Shared Payment Method",
  ib_invited: "IB Invitation",
};

export function nodeKindLabel(kind: ClientGraphNodeKind): string {
  return NODE_LABEL[kind];
}

export function edgeKindLabel(kind: ClientGraphEdgeKind): string {
  return EDGE_LABEL[kind];
}

/* ------------------------------------------------------------------------- */
/* Pure helpers                                                              */
/* ------------------------------------------------------------------------- */

/**
 * Reduce a node's incoming edge kinds into a single visual category.
 * Used by the API and any client-side aggregator to set `node.kind`.
 */
export function deriveNodeKind(edgeKinds: ClientGraphEdgeKind[]): ClientGraphNodeKind {
  const unique = [...new Set(edgeKinds)];
  if (unique.length === 0) return "center";
  if (unique.length > 1) return "mixed";
  switch (unique[0]) {
    case "shared_ip":
      return "shared_ip";
    case "shared_device":
      return "shared_device";
    case "same_id":
      return "same_id";
    case "shared_payment":
      return "shared_payment";
    case "ib_invited":
      return "ib_relation";
    default:
      return "mixed";
  }
}

/**
 * Bucket counts by edge kind, deduped per (target, kind) pair so a node
 * connected by 4 IPs counts as one shared_ip relation, not four.
 */
export function countEdgesByKind(
  edges: ClientGraphEdge[]
): Record<ClientGraphEdgeKind, number> {
  const seen: Record<ClientGraphEdgeKind, Set<string>> = {
    shared_ip: new Set(),
    shared_device: new Set(),
    same_id: new Set(),
    shared_payment: new Set(),
    ib_invited: new Set(),
  };
  for (const e of edges) seen[e.kind].add(e.target);
  return {
    shared_ip: seen.shared_ip.size,
    shared_device: seen.shared_device.size,
    same_id: seen.same_id.size,
    shared_payment: seen.shared_payment.size,
    ib_invited: seen.ib_invited.size,
  };
}

/**
 * Coarse "how risky is this graph?" score in 0..100. Adds a fixed amount
 * per edge kind, capped. Used to badge the relationship surface as soon as
 * the graph loads, ahead of operator inspection.
 *
 *   - same_id           → 30 each (max 60)
 *   - shared_payment    → 20 each (max 40)
 *   - shared_device     → 10 each (max 30)
 *   - shared_ip         →  5 each (max 25)
 *   - ib_invited        →  0 (informational only)
 */
export function graphRiskScore(graph: ClientGraph): number {
  const c = countEdgesByKind(graph.edges);
  const score =
    Math.min(60, c.same_id * 30) +
    Math.min(40, c.shared_payment * 20) +
    Math.min(30, c.shared_device * 10) +
    Math.min(25, c.shared_ip * 5);
  return Math.min(100, score);
}

/**
 * Sort the related-clients list so the most concerning targets come first.
 *
 * Order: `same_id` > `shared_payment` > `shared_device` > `shared_ip` > `ib_invited`,
 * tie-break by node `riskScore` desc.
 */
const KIND_PRIORITY: Record<ClientGraphEdgeKind, number> = {
  same_id: 5,
  shared_payment: 4,
  shared_device: 3,
  shared_ip: 2,
  ib_invited: 1,
};

export function rankedRelatedNodes(graph: ClientGraph): ClientGraphNode[] {
  const edgesByTarget = new Map<string, ClientGraphEdge[]>();
  for (const e of graph.edges) {
    const list = edgesByTarget.get(e.target) ?? [];
    list.push(e);
    edgesByTarget.set(e.target, list);
  }
  const score = (id: string): number => {
    const list = edgesByTarget.get(id) ?? [];
    return Math.max(0, ...list.map((e) => KIND_PRIORITY[e.kind] ?? 0));
  };
  return [...graph.nodes].sort((a, b) => {
    const diff = score(b.id) - score(a.id);
    if (diff !== 0) return diff;
    return (b.riskScore ?? 0) - (a.riskScore ?? 0);
  });
}

/* ------------------------------------------------------------------------- */
/* Mock                                                                      */
/* ------------------------------------------------------------------------- */

/** Mock fallback for when the API isn't reachable (storybook, tests). */
export function buildEmptyGraph(center: ClientGraphNode): ClientGraph {
  return { center, nodes: [], edges: [] };
}
