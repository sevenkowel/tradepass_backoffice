/**
 * `@/types/core` — barrel for the cross-module data contracts that
 * Clients / CLM Center / Risk Center all read from.
 *
 * If a type is *only* needed inside one module, keep it in that
 * module's own types directory; promote it to `core` once a second
 * module needs the same shape.
 */

export type { RiskFactorKey, RiskFactor, RiskProfile } from "./risk-profile";
export type { IPGeoInfo } from "./ip-geo";
export type { IBTier, IBStatus, IBSummary } from "./ib-summary";
export type {
  VerificationProvider,
  VerificationStatus,
  ThirdPartyVerification,
} from "./third-party-verification";
export type {
  AuditDomain,
  AuditSeverity,
  AuditActor,
  AuditTarget,
  AuditChange,
  GlobalAuditLog,
  GlobalAuditListParams,
} from "./audit";
export type {
  ClientGraphNodeKind,
  ClientGraphEdgeKind,
  ClientGraphNode,
  ClientGraphEdge,
  ClientGraph,
} from "./client-graph";
