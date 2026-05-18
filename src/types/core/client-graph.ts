/**
 * ClientGraph — unified relationship model used by every page that draws a
 * "this client is linked to those" picture.
 *
 * v2 — 6 factor categories × 15 sub-kinds × 3 evidence strengths.
 *
 * Before v2 the schema had only 5 edge kinds, with `same_id` actually
 * matching the legacy `user.name` column (heuristic, not a real
 * identity match). v2 splits identity into proper document-hash matching
 * (HARD) and same-name/same-DOB heuristics (MEDIUM), and introduces email
 * / phone / mobileAdId / browserFingerprint / subnet factors that were
 * previously missing.
 *
 * Compatibility shim — code that hasn't migrated yet may still pass the
 * legacy 5-kind set ("shared_ip" / "shared_device" / "same_id" /
 * "shared_payment" / "ib_invited"). These are still part of the union
 * and are accepted by all renderers; v2 simply adds new entries on top.
 */

/** Visual category of a node — drives colour/size on the canvas. */
export type ClientGraphNodeKind =
  | "center"          // The client the graph is rooted at (always exactly one)
  | "shared_ip"
  | "shared_device"
  | "same_id"
  | "shared_payment"
  | "ib_relation"
  | "mixed";          // Multiple edge kinds simultaneously

/* ------------------------------------------------------------------------- */
/* Edge kinds — grouped by factor category                                   */
/* ------------------------------------------------------------------------- */

/** 1️⃣ Identity Evidence — typically HARD strength. */
export type IdentityEdgeKind =
  | "same_id_document"   // Same hashed document number (passport / id_card / tax_id / driver_license)
  | "same_passport"      // Same passport number specifically
  | "same_tax_id"        // Same tax ID specifically
  | "same_name_dob";     // Same legal name + same date of birth (MEDIUM)

/** 2️⃣ Contact factors. */
export type ContactEdgeKind =
  | "same_email"         // Same canonical email after normalisation
  | "same_phone"         // Same normalised phone number
  | "email_pattern_sim"; // Email pattern similarity (e.g. liu.yang.1@ / liu.yang.2@)

/** 3️⃣ Network factors. */
export type NetworkEdgeKind =
  | "shared_ip"          // Exact IP match
  | "same_ip_subnet"     // Same /24 subnet
  | "same_isp_geo";      // Same ISP + same city (SOFT)

/** 4️⃣ Device factors. */
export type DeviceEdgeKind =
  | "shared_device"      // Same device fingerprint
  | "shared_browser_fp"  // Same browser fingerprint (UA + screen + TZ + plugins)
  | "shared_mobile_id";  // Same mobile advertising ID (IDFA / AAID)

/** 5️⃣ Payment factors. */
export type PaymentEdgeKind =
  | "shared_payment"     // Legacy alias — keep for back-compat
  | "shared_bank_account"
  | "shared_crypto_wallet"
  | "shared_e_wallet"
  | "fund_flow_link";    // A's withdrawal funded B's deposit (or vice versa)

/** 6️⃣ Business relationship factors. */
export type BusinessEdgeKind =
  | "ib_invited"         // Direct IB → client invitation edge (INFO)
  | "referral_chain"     // 2-3-hop referral relation (SOFT)
  | "copy_trading";      // Copy-trading subscription relation (INFO)

/** Aggregate of every edge kind known to the relationship engine. */
export type ClientGraphEdgeKind =
  | IdentityEdgeKind
  | ContactEdgeKind
  | NetworkEdgeKind
  | DeviceEdgeKind
  | PaymentEdgeKind
  | BusinessEdgeKind
  // Legacy aliases — kept so back-compat callers still typecheck.
  | "same_id";           // Legacy alias for same_id_document / same_name_dob

/** The 6 top-level factor categories — used in UI grouping. */
export type EdgeCategory =
  | "identity"
  | "contact"
  | "network"
  | "device"
  | "payment"
  | "business";

/** Evidence strength — drives both colour and scoring weight. */
export type EvidenceStrength =
  | "hard"     // Direct PII match — definitive on its own
  | "medium"   // Strong signal but needs corroboration
  | "soft"     // Weak signal, used for cluster discovery
  | "info";    // Informational only, no risk contribution

/** Risk bucket carried into the graph for colouring. */
type GraphRiskLevel = "low" | "medium" | "high" | "critical";

/** A node on the client graph. Always corresponds to a real `BackofficeUser`. */
export interface ClientGraphNode {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  kycStatus: string;
  riskLevel: GraphRiskLevel;
  riskScore: number;
  lastLoginAt: string;
  createdAt: string;
  kind: ClientGraphNodeKind;
}

/** A relationship between two nodes. */
export interface ClientGraphEdge {
  source: string;
  target: string;
  kind: ClientGraphEdgeKind;
  /** Human-readable label rendered on hover (e.g. "Shared IP: 1.2.3.4"). */
  label: string;
  /** New in v2 — evidence strength. Defaults inferred from `kind` if absent. */
  strength?: EvidenceStrength;
  /** Strength 0..1 — used to weight line width / sort related-list rows. */
  weight?: number;
  /** ISO timestamp the relationship was first detected. */
  detectedAt?: string;
  /** ISO timestamp the relationship was last observed. */
  lastSeenAt?: string;
}

/** A 1-hop graph rooted at a single client. */
export interface ClientGraph {
  center: ClientGraphNode;
  /** Excludes the center node — UI re-adds it. */
  nodes: ClientGraphNode[];
  edges: ClientGraphEdge[];
}

/* ------------------------------------------------------------------------- */
/* Cluster — connected component for N-hop analysis                          */
/* ------------------------------------------------------------------------- */

/** A discovered cluster (connected component) of related clients. */
export interface ClientCluster {
  /** Stable ID derived from member IDs (sorted, hashed). */
  id: string;
  /** Member node IDs — typically 3+ users. */
  memberIds: string[];
  /** Edges making up the cluster (may include intra-cluster edges, not just spokes from a center). */
  edges: ClientGraphEdge[];
  /** Composite cluster score 0-100 — max of pairwise scores, with cluster-size boost. */
  score: number;
  /** Counts of evidence by strength across the whole cluster. */
  hardCount: number;
  mediumCount: number;
  softCount: number;
  /** Distinct edge kinds present in the cluster. */
  kinds: ClientGraphEdgeKind[];
  /** First and last detection across the cluster. */
  firstSeenAt: string;
  lastSeenAt: string;
}
