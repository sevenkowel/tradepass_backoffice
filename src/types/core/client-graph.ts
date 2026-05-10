/**
 * ClientGraph — unified relationship model used by every page that draws a
 * "this client is linked to those" picture.
 *
 * Before this type the CRM had at least three implicit graph models:
 *   - `RiskTab` — `{ targetClientId, relationshipType: "shared_ip" | "shared_device" | "shared_bank" | "shared_crypto_wallet" | "same_name", strength, details, detectedAt }[]`
 *     rendered as an echarts force layout.
 *   - `/api/crm/clients/[id]/graph` — `GraphNode` / `GraphEdge` with five
 *     edge kinds and a `type` discriminator on each node.
 *   - `/crm/risk/graph` placeholder — would need the same shape eventually.
 *
 * `ClientGraph` is the canonical contract. The risk-engine helper
 * `@/lib/risk-engine/graph.ts` exposes builders / scorers; UI components
 * import the type and the helpers, never reinvent.
 *
 * Edge kinds explicitly cover only the relationships the engine *infers*
 * from data — IB invitation trees and explicit "manager assigned to client"
 * links are modeled separately when the use case appears.
 */

/** Visual category of a node — drives colour/size on the canvas. */
export type ClientGraphNodeKind =
  | "center"          // The client the graph is rooted at (always exactly one)
  | "shared_ip"       // Linked only via shared IP address
  | "shared_device"   // Linked only via shared device fingerprint
  | "same_id"         // Linked via duplicate identity / name match
  | "shared_payment"  // Linked via shared bank account / crypto wallet
  | "ib_relation"     // Connected through the IB invitation tree
  | "mixed";          // Multiple edge kinds simultaneously

/** Type of evidence for a relationship between two nodes. */
export type ClientGraphEdgeKind =
  | "shared_ip"
  | "shared_device"
  | "same_id"
  | "shared_payment"
  | "ib_invited";     // Direct IB → client invitation edge

/** Risk bucket carried into the graph for colouring. Mirrors `RiskLevel`
 *  in `@/types/clm` but is duplicated here to avoid a cross-module import
 *  for what is essentially a UI hint. */
type GraphRiskLevel = "low" | "medium" | "high" | "critical";

/** A node on the client graph. Always corresponds to a real `BackofficeUser`. */
export interface ClientGraphNode {
  /** Internal user id (same as `BackofficeUser.id`). */
  id: string;
  /** Display UID (e.g. "U10024"). */
  uid: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  /** KYC status keyword, free-form for forward compatibility. */
  kycStatus: string;
  riskLevel: GraphRiskLevel;
  /** 0–100 composite from the Risk Engine (denormalised so the canvas
   *  can size/colour without an extra fetch per node). */
  riskScore: number;
  lastLoginAt: string;
  createdAt: string;

  /** Visual category. The center node is always `"center"`. */
  kind: ClientGraphNodeKind;
}

/** A relationship between two nodes. Always 1-hop; multi-hop expansion is
 *  a UI concern, not a data shape. */
export interface ClientGraphEdge {
  /** The source node ID — always the center for graphs returned by the
   *  current API, but the type allows arbitrary edges for future use. */
  source: string;
  target: string;
  kind: ClientGraphEdgeKind;
  /** Human-readable label rendered on hover (e.g. "Shared IP: 1.2.3.4"). */
  label: string;
  /**
   * Strength 0..1 — used to weight line width / sort related-list rows.
   * Default `1` if unknown.
   */
  strength?: number;
  /** ISO timestamp the relationship was first detected. */
  detectedAt?: string;
}

/** A 1-hop graph rooted at a single client. */
export interface ClientGraph {
  center: ClientGraphNode;
  /** Excludes the center node — UI re-adds it. */
  nodes: ClientGraphNode[];
  edges: ClientGraphEdge[];
}
