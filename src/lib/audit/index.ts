/**
 * Cross-domain audit aggregator.
 *
 * Public surface:
 *   - `globalAuditService` — single read interface (`list` / `listForClient` / `listForCase`)
 *   - adapter helpers     — for any caller that still has a legacy log on hand
 *
 * Mock-backed today; will swap to an HTTP-backed implementation when the
 * Audit Service lands without UI changes.
 */
export {
  globalAuditService,
  type PaginatedAudit,
  _resetAuditPool,
} from "./service";
export {
  clmAuditToGlobal,
  clientAuditToGlobal,
  globalToClientAudit,
  severityFor,
} from "./adapters";
