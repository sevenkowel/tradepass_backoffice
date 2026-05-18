/**
 * Client-graph helpers — colour, label, and severity utilities so every
 * page that renders a `ClientGraph` agrees on what each edge / node looks
 * like.
 *
 * v2 — Supports the 15 sub-kinds × 4 strength tiers introduced for the
 * 6-category factor model. New helpers:
 *   - `EDGE_STRENGTH` / `EDGE_CATEGORY` — pure metadata tables.
 *   - `pairScore()` — strength-layered, combination-amplified composite
 *     score for a pair of clients given their shared edges.
 *   - `clusterScore()` — boosts pair scores by cluster size to surface
 *     coordinated rings rather than isolated dupes.
 *
 * Pure functions. No data fetching here.
 */
import type {
  ClientGraph,
  ClientGraphEdge,
  ClientGraphEdgeKind,
  ClientGraphNode,
  ClientGraphNodeKind,
  EdgeCategory,
  EvidenceStrength,
} from "@/types/core";

/* ------------------------------------------------------------------------- */
/* Display tokens                                                            */
/* ------------------------------------------------------------------------- */

/** Hex colour applied to a node fill on the canvas. */
export const NODE_COLOR: Record<ClientGraphNodeKind, string> = {
  center:         "#3B82F6", // blue-500
  shared_ip:      "#F59E0B", // amber-500
  shared_device:  "#10B981", // emerald-500
  same_id:        "#EF4444", // red-500
  shared_payment: "#8B5CF6", // violet-500
  ib_relation:    "#0EA5E9", // sky-500
  mixed:          "#A855F7", // purple-500
};

/** Hex colour for the link line, keyed by edge kind. */
export const EDGE_COLOR: Record<ClientGraphEdgeKind, string> = {
  // Identity
  same_id_document:    "#DC2626", // red-600 — HARD
  same_passport:       "#DC2626",
  same_tax_id:         "#DC2626",
  same_name_dob:       "#F97316", // orange-500 — MEDIUM
  same_id:             "#DC2626", // legacy alias
  // Contact
  same_email:          "#EA580C", // orange-600 — MEDIUM
  same_phone:          "#EA580C",
  email_pattern_sim:   "#FDBA74", // orange-300 — SOFT
  // Network
  shared_ip:           "#F59E0B", // amber-500 — MEDIUM
  same_ip_subnet:      "#FCD34D", // amber-300 — SOFT
  same_isp_geo:        "#FDE68A", // amber-200 — SOFT
  // Device
  shared_device:       "#10B981", // emerald-500 — HARD
  shared_browser_fp:   "#34D399", // emerald-400 — MEDIUM
  shared_mobile_id:    "#059669", // emerald-600 — HARD
  // Payment
  shared_payment:      "#8B5CF6", // violet-500 — legacy alias
  shared_bank_account: "#7C3AED", // violet-600 — HARD
  shared_crypto_wallet:"#6D28D9", // violet-700 — HARD
  shared_e_wallet:     "#A78BFA", // violet-400 — HARD
  fund_flow_link:      "#C4B5FD", // violet-300 — MEDIUM
  // Business
  ib_invited:          "#0EA5E9", // sky-500
  referral_chain:      "#7DD3FC", // sky-300 — SOFT
  copy_trading:        "#0284C7", // sky-600
};

/** Optional dash pattern for an edge — empty array → solid. */
export const EDGE_DASH: Record<ClientGraphEdgeKind, number[] | null> = {
  // HARD: solid
  same_id_document: null,
  same_passport: null,
  same_tax_id: null,
  shared_device: null,
  shared_mobile_id: null,
  shared_bank_account: null,
  shared_crypto_wallet: null,
  shared_e_wallet: null,
  // MEDIUM: short dash
  same_name_dob: [4, 2],
  same_email: [4, 2],
  same_phone: [4, 2],
  shared_ip: [4, 2],
  shared_browser_fp: [4, 2],
  fund_flow_link: [4, 2],
  // SOFT: long dash
  email_pattern_sim: [2, 4],
  same_ip_subnet: [2, 4],
  same_isp_geo: [2, 4],
  referral_chain: [2, 4],
  // INFO/business: solid
  ib_invited: null,
  copy_trading: null,
  // Legacy aliases
  same_id: null,
  shared_payment: null,
};

/* ------------------------------------------------------------------------- */
/* Strength + category metadata                                              */
/* ------------------------------------------------------------------------- */

/** Default evidence strength for each edge kind. */
export const EDGE_STRENGTH: Record<ClientGraphEdgeKind, EvidenceStrength> = {
  // Identity
  same_id_document:    "hard",
  same_passport:       "hard",
  same_tax_id:         "hard",
  same_name_dob:       "medium",
  same_id:             "hard",     // legacy — treat as HARD for back-compat
  // Contact
  same_email:          "medium",
  same_phone:          "medium",
  email_pattern_sim:   "soft",
  // Network
  shared_ip:           "medium",
  same_ip_subnet:      "soft",
  same_isp_geo:        "soft",
  // Device
  shared_device:       "hard",
  shared_browser_fp:   "medium",
  shared_mobile_id:    "hard",
  // Payment
  shared_payment:      "hard",     // legacy alias — treat as HARD
  shared_bank_account: "hard",
  shared_crypto_wallet:"hard",
  shared_e_wallet:     "hard",
  fund_flow_link:      "medium",
  // Business
  ib_invited:          "info",
  referral_chain:      "soft",
  copy_trading:        "info",
};

/** Top-level category each edge kind belongs to. */
export const EDGE_CATEGORY: Record<ClientGraphEdgeKind, EdgeCategory> = {
  // Identity
  same_id_document:    "identity",
  same_passport:       "identity",
  same_tax_id:         "identity",
  same_name_dob:       "identity",
  same_id:             "identity",
  // Contact
  same_email:          "contact",
  same_phone:          "contact",
  email_pattern_sim:   "contact",
  // Network
  shared_ip:           "network",
  same_ip_subnet:      "network",
  same_isp_geo:        "network",
  // Device
  shared_device:       "device",
  shared_browser_fp:   "device",
  shared_mobile_id:    "device",
  // Payment
  shared_payment:      "payment",
  shared_bank_account: "payment",
  shared_crypto_wallet:"payment",
  shared_e_wallet:     "payment",
  fund_flow_link:      "payment",
  // Business
  ib_invited:          "business",
  referral_chain:      "business",
  copy_trading:        "business",
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
  // Identity
  same_id_document: "Same ID Document",
  same_passport: "Same Passport",
  same_tax_id: "Same Tax ID",
  same_name_dob: "Same Name & DOB",
  same_id: "Same Identity",
  // Contact
  same_email: "Same Email",
  same_phone: "Same Phone",
  email_pattern_sim: "Email Pattern Similar",
  // Network
  shared_ip: "Shared IP",
  same_ip_subnet: "Same Subnet",
  same_isp_geo: "Same ISP & City",
  // Device
  shared_device: "Shared Device",
  shared_browser_fp: "Shared Browser Fingerprint",
  shared_mobile_id: "Shared Mobile Ad ID",
  // Payment
  shared_payment: "Shared Payment Method",
  shared_bank_account: "Shared Bank Account",
  shared_crypto_wallet: "Shared Crypto Wallet",
  shared_e_wallet: "Shared E-Wallet",
  fund_flow_link: "Fund Flow Link",
  // Business
  ib_invited: "IB Invitation",
  referral_chain: "Referral Chain",
  copy_trading: "Copy Trading",
};

const CATEGORY_LABEL: Record<EdgeCategory, string> = {
  identity: "Identity",
  contact:  "Contact",
  network:  "Network",
  device:   "Device",
  payment:  "Payment",
  business: "Business",
};

const STRENGTH_LABEL: Record<EvidenceStrength, string> = {
  hard:   "Hard Evidence",
  medium: "Medium Evidence",
  soft:   "Soft Signal",
  info:   "Informational",
};

export function nodeKindLabel(kind: ClientGraphNodeKind): string {
  return NODE_LABEL[kind];
}

export function edgeKindLabel(kind: ClientGraphEdgeKind): string {
  return EDGE_LABEL[kind] ?? kind;
}

export function categoryLabel(cat: EdgeCategory): string {
  return CATEGORY_LABEL[cat];
}

export function strengthLabel(s: EvidenceStrength): string {
  return STRENGTH_LABEL[s];
}

/* ------------------------------------------------------------------------- */
/* Scoring model — strength layering + combination amplification             */
/* ------------------------------------------------------------------------- */

/**
 * Base score (0-100) contributed by a single evidence item of the given
 * strength. Within a category, multiple HARD items don't stack linearly
 * (handled in `pairScore`).
 */
const STRENGTH_BASE: Record<EvidenceStrength, number> = {
  hard:   60,
  medium: 25,
  soft:    8,
  info:    0,
};

/**
 * Per-pair composite score for a set of edges between two clients.
 *
 * Algorithm:
 *   1. Group edges by category (identity / contact / ... 6 categories).
 *   2. Within each category, take the *strongest* strength tier present
 *      → score for that category = STRENGTH_BASE[bestStrength].
 *      Additional edges in the same category contribute 30% of their
 *      strength base (diminishing returns — two IPs ≠ twice the signal).
 *   3. Cross-category: HARD edges combine non-linearly to surface rings.
 *      Per HARD category present (max 5 counted): apply ×1 / ×1.15 / ×1.3
 *      / ×1.4 / ×1.5 multiplier on the running total.
 *   4. Hard cap at 100.
 *
 * The cap-then-amplify shape ensures one HARD edge alone yields ~60 (high
 * but not critical), while two HARD categories yield 90+ (definitive ring).
 */
export function pairScore(edges: ClientGraphEdge[]): number {
  if (edges.length === 0) return 0;

  // Group edges by category and find best strength per category.
  const byCategory: Record<EdgeCategory, ClientGraphEdge[]> = {
    identity: [], contact: [], network: [], device: [], payment: [], business: [],
  };
  for (const e of edges) {
    const cat = EDGE_CATEGORY[e.kind];
    if (!byCategory[cat]) continue;
    byCategory[cat].push(e);
  }

  let total = 0;
  let hardCategories = 0;
  for (const cat of Object.keys(byCategory) as EdgeCategory[]) {
    const catEdges = byCategory[cat];
    if (catEdges.length === 0) continue;

    // Best strength contributes full base; rest contribute 30%.
    const strengths = catEdges.map((e) => e.strength ?? EDGE_STRENGTH[e.kind]);
    const bestStrength = strengths.reduce<EvidenceStrength>((best, s) => {
      return strengthRank(s) > strengthRank(best) ? s : best;
    }, "info");
    const catScore =
      STRENGTH_BASE[bestStrength] +
      (catEdges.length - 1) * STRENGTH_BASE[bestStrength] * 0.3;

    total += catScore;
    if (bestStrength === "hard") hardCategories += 1;
  }

  // HARD-category combination amplifier.
  const HARD_AMPLIFIER = [1.0, 1.15, 1.3, 1.4, 1.5];
  const amp = HARD_AMPLIFIER[Math.min(hardCategories, HARD_AMPLIFIER.length - 1)];
  total *= amp;

  return Math.min(100, Math.round(total));
}

function strengthRank(s: EvidenceStrength): number {
  return s === "hard" ? 3 : s === "medium" ? 2 : s === "soft" ? 1 : 0;
}

/**
 * Cluster score = max pairwise score + size boost.
 * 3-member cluster → +5, 5-member → +10, 10+ → +20. Capped at 100.
 */
export function clusterScore(
  pairScores: number[],
  clusterSize: number
): number {
  if (pairScores.length === 0) return 0;
  const maxPair = Math.max(...pairScores);
  const sizeBoost =
    clusterSize >= 10 ? 20 :
    clusterSize >= 5  ? 10 :
    clusterSize >= 3  ?  5 : 0;
  return Math.min(100, maxPair + sizeBoost);
}

/* ------------------------------------------------------------------------- */
/* Pure helpers                                                              */
/* ------------------------------------------------------------------------- */

/**
 * Reduce a node's incoming edge kinds into a single visual category.
 */
export function deriveNodeKind(edgeKinds: ClientGraphEdgeKind[]): ClientGraphNodeKind {
  const cats = new Set(edgeKinds.map((k) => EDGE_CATEGORY[k]).filter(Boolean));
  if (cats.size === 0) return "center";
  if (cats.size > 1) return "mixed";
  const onlyCat = [...cats][0];
  switch (onlyCat) {
    case "identity": return "same_id";
    case "network":  return "shared_ip";
    case "device":   return "shared_device";
    case "payment":  return "shared_payment";
    case "business": return "ib_relation";
    default:         return "mixed";  // contact-only → no dedicated node kind yet
  }
}

/** Bucket counts by edge kind, deduped per (target, kind) pair. */
export function countEdgesByKind(
  edges: ClientGraphEdge[]
): Partial<Record<ClientGraphEdgeKind, number>> {
  const seen = new Map<ClientGraphEdgeKind, Set<string>>();
  for (const e of edges) {
    if (!seen.has(e.kind)) seen.set(e.kind, new Set());
    seen.get(e.kind)!.add(e.target);
  }
  const result: Partial<Record<ClientGraphEdgeKind, number>> = {};
  for (const [k, set] of seen.entries()) {
    result[k] = set.size;
  }
  return result;
}

/**
 * Coarse "how risky is this graph?" score in 0..100.
 * v2 uses the new strength-layered model — summing pairScore across all
 * targets, capped at 100.
 */
export function graphRiskScore(graph: ClientGraph): number {
  const edgesByTarget = new Map<string, ClientGraphEdge[]>();
  for (const e of graph.edges) {
    const list = edgesByTarget.get(e.target) ?? [];
    list.push(e);
    edgesByTarget.set(e.target, list);
  }
  let total = 0;
  for (const list of edgesByTarget.values()) {
    total += pairScore(list);
  }
  return Math.min(100, total);
}

/**
 * Sort the related-clients list so the most concerning targets come first.
 * v2 ranks by computed pairScore (descending), tie-break by node risk.
 */
export function rankedRelatedNodes(graph: ClientGraph): ClientGraphNode[] {
  const edgesByTarget = new Map<string, ClientGraphEdge[]>();
  for (const e of graph.edges) {
    const list = edgesByTarget.get(e.target) ?? [];
    list.push(e);
    edgesByTarget.set(e.target, list);
  }
  const scoreFor = (id: string): number => pairScore(edgesByTarget.get(id) ?? []);
  return [...graph.nodes].sort((a, b) => {
    const diff = scoreFor(b.id) - scoreFor(a.id);
    if (diff !== 0) return diff;
    return (b.riskScore ?? 0) - (a.riskScore ?? 0);
  });
}

/* ------------------------------------------------------------------------- */
/* Mock                                                                      */
/* ------------------------------------------------------------------------- */

export function buildEmptyGraph(center: ClientGraphNode): ClientGraph {
  return { center, nodes: [], edges: [] };
}

/**
 * Build a rich mock graph for demo / UI preview.
 * v2 — Covers all 15 sub-kinds across the 6 categories so the new
 * factor-grouped Kanban has data for every column.
 */
export function buildMockGraph(center: ClientGraphNode): ClientGraph {
  const nodes: ClientGraphNode[] = [
    // Identity — HARD: same document, same passport, etc.
    mkNode("u-doc-1", "U10134", "刘洋", "liu.yang.alt@example.com", "critical", 95, "same_id"),
    mkNode("u-doc-2", "U10156", "刘洋", "liu.yang.dup@example.com", "critical", 88, "same_id"),
    // Contact
    mkNode("u-eml-1", "U10301", "Z. Liang", "z.liang@example.com",     "high",     72, "mixed"),
    mkNode("u-phn-1", "U10312", "K. Wong",  "k.wong@example.com",      "medium",   58, "mixed"),
    // Network
    mkNode("u-ip-1",  "U10023", "张伟",     "zhang.wei@example.com",   "medium",   45, "shared_ip"),
    mkNode("u-ip-2",  "U10045", "李娜",     "li.na@example.com",       "low",      22, "shared_ip"),
    mkNode("u-net-1", "U10067", "王强",     "wang.qiang@example.com",  "low",      18, "shared_ip"),
    // Device
    mkNode("u-dev-1", "U10089", "赵敏",     "zhao.min@example.com",    "medium",   38, "shared_device"),
    mkNode("u-dev-2", "U10112", "孙杰",     "sun.jie@example.com",     "high",     72, "shared_device"),
    mkNode("u-mob-1", "U10133", "周林",     "zhou.lin@example.com",    "high",     80, "shared_device"),
    // Payment
    mkNode("u-bnk-1", "U10178", "周涛",     "zhou.tao@example.com",    "high",     65, "shared_payment"),
    mkNode("u-cry-1", "U10200", "吴倩",     "wu.qian@example.com",     "medium",   42, "shared_payment"),
    mkNode("u-flw-1", "U10211", "Y. Tan",   "y.tan@example.com",       "high",     68, "shared_payment"),
    // Business
    mkNode("u-ib-1",  "U10222", "郑华",     "zheng.hua@example.com",   "low",      15, "ib_relation"),
    // Mixed multi-evidence
    mkNode("u-mix-1", "U10244", "陈静",     "chen.jing@example.com",   "high",     70, "mixed"),
    mkNode("u-mix-2", "U10266", "黄磊",     "huang.lei@example.com",   "medium",   55, "mixed"),
  ];

  const edges: ClientGraphEdge[] = [
    // Identity — HARD
    edge(center.id, "u-doc-1", "same_id_document",  "Same ID: 3101151985****1234"),
    edge(center.id, "u-doc-2", "same_id_document",  "Same ID: 3101151985****5678"),
    edge(center.id, "u-doc-2", "same_passport",     "Same passport: G****91234"),
    // Contact
    edge(center.id, "u-eml-1", "same_email",        "Same email: l.y@example.com (canonical)"),
    edge(center.id, "u-phn-1", "same_phone",        "Same phone: +86 138-****-1234"),
    edge(center.id, "u-eml-1", "email_pattern_sim", "Email pattern: liu.yang.{n}@"),
    // Network
    edge(center.id, "u-ip-1",  "shared_ip",         "Shared IP: 103.45.67.89 · 32 sessions"),
    edge(center.id, "u-ip-2",  "shared_ip",         "Shared IP: 103.45.67.89 · 12 sessions"),
    edge(center.id, "u-net-1", "same_ip_subnet",    "Same /24: 203.112.44.0/24"),
    // Device
    edge(center.id, "u-dev-1", "shared_device",     "Shared device: fp_a1b2c3d4"),
    edge(center.id, "u-dev-2", "shared_device",     "Shared device: fp_e5f6g7h8"),
    edge(center.id, "u-dev-2", "shared_browser_fp", "Shared browser fp"),
    edge(center.id, "u-mob-1", "shared_mobile_id",  "Shared IDFA: 7A8B-****-9012"),
    // Payment
    edge(center.id, "u-bnk-1", "shared_bank_account",  "Shared bank: 6222 **** **** 3344"),
    edge(center.id, "u-cry-1", "shared_crypto_wallet", "Shared wallet: 0x3f5...8a2b"),
    edge(center.id, "u-flw-1", "fund_flow_link",       "Fund flow: $48,300 over 14 tx"),
    // Business
    edge(center.id, "u-ib-1",  "ib_invited",        "IB code: IB2025001"),
    // Mixed — chen.jing has 4 categories
    edge(center.id, "u-mix-1", "shared_ip",         "Shared IP: 103.45.67.89"),
    edge(center.id, "u-mix-1", "shared_device",     "Shared device: fp_a1b2c3d4"),
    edge(center.id, "u-mix-1", "shared_bank_account", "Shared bank: 6222 **** **** 3344"),
    edge(center.id, "u-mix-1", "same_email",        "Same email after normalisation"),
    // Mixed — huang.lei has subnet + same_id
    edge(center.id, "u-mix-2", "same_ip_subnet",    "Same /24: 203.112.44.0/24"),
    edge(center.id, "u-mix-2", "same_id_document",  "Same ID: 3101151985****9012"),
  ];

  return { center, nodes, edges };
}

/** Internal: build a graph node with sensible defaults. */
function mkNode(
  id: string,
  uid: string,
  name: string,
  email: string,
  riskLevel: GraphRiskLevel,
  riskScore: number,
  kind: ClientGraphNodeKind,
): ClientGraphNode {
  return {
    id, uid, name, email,
    phone: "+86 138-0000-0000",
    country: "CN",
    kycStatus: "verified",
    riskLevel, riskScore,
    lastLoginAt: "2026-05-10T10:00:00Z",
    createdAt: "2025-06-15T00:00:00Z",
    kind,
  };
}

/** Internal: build an edge with default strength inferred from kind. */
function edge(
  source: string,
  target: string,
  kind: ClientGraphEdgeKind,
  label: string,
): ClientGraphEdge {
  return {
    source, target, kind, label,
    strength: EDGE_STRENGTH[kind],
    detectedAt: "2025-09-01T00:00:00Z",
    lastSeenAt: "2026-05-10T10:00:00Z",
  };
}

type GraphRiskLevel = "low" | "medium" | "high" | "critical";
