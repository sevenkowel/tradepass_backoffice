/**
 * Adapters that lift legacy audit shapes into the unified GlobalAuditLog.
 *
 * Each function takes one of the old shapes and returns a GlobalAuditLog so
 * that the Audit Trail page, Client Detail Logs tab, and Case Detail history
 * strip can all read a single contract.
 *
 * When a producer is migrated to write GlobalAuditLog directly, its adapter
 * here can be deleted.
 */

import type {
  AuditChange,
  AuditDomain,
  AuditSeverity,
  GlobalAuditLog,
} from "@/types/core";
import type { CLMAuditLog, CLMAuditAction } from "@/types/clm";
import type { AuditLog as ClientAuditLog } from "@/types/backoffice/client-detail";

/* ------------------------------------------------------------------------- */
/* CLM → Global                                                              */
/* ------------------------------------------------------------------------- */

const CLM_ACTION_LABELS: Record<CLMAuditAction, string> = {
  case_created: "Case Created",
  case_assigned: "Case Assigned",
  case_reviewed: "Case Reviewed",
  case_approved: "Case Approved",
  case_rejected: "Case Rejected",
  case_resubmission_requested: "Resubmission Requested",
  case_escalated: "Case Escalated",
  case_released: "Case Released",
  case_cancelled: "Case Cancelled",
  case_comment_added: "Comment Added",
  policy_updated: "Policy Updated",
  policy_published: "Policy Published",
  agreement_published: "Agreement Published",
  workflow_changed: "Workflow Changed",
  customer_level_changed: "Customer Level Changed",
  customer_frozen: "Account Frozen",
  customer_unfrozen: "Account Unfrozen",
  case_batch_approved: "Batch Approved",
};

/** Coarse severity map: rejections / escalations / freezes are at least
 *  warnings; AML / blacklist actions are critical. */
const CLM_ACTION_SEVERITY: Record<CLMAuditAction, AuditSeverity> = {
  case_created: "info",
  case_assigned: "info",
  case_reviewed: "info",
  case_approved: "info",
  case_rejected: "warning",
  case_resubmission_requested: "warning",
  case_escalated: "warning",
  case_released: "info",
  case_cancelled: "info",
  case_comment_added: "info",
  policy_updated: "info",
  policy_published: "info",
  agreement_published: "info",
  workflow_changed: "info",
  customer_level_changed: "info",
  customer_frozen: "critical",
  customer_unfrozen: "warning",
  case_batch_approved: "info",
};

function diffFromValues(
  prev?: Record<string, unknown>,
  next?: Record<string, unknown>
): AuditChange[] {
  if (!prev && !next) return [];
  const fields = new Set<string>([
    ...Object.keys(prev ?? {}),
    ...Object.keys(next ?? {}),
  ]);
  return [...fields].map((field) => ({
    field,
    oldValue: prev?.[field],
    newValue: next?.[field],
  }));
}

export function clmAuditToGlobal(log: CLMAuditLog): GlobalAuditLog {
  return {
    id: log.id,
    auditId: log.auditId,
    domain: "clm",
    severity: CLM_ACTION_SEVERITY[log.action] ?? "info",
    action: log.action,
    actionLabel: CLM_ACTION_LABELS[log.action] ?? log.action,
    actor: {
      id: log.actorId,
      name: log.actorName,
      role: log.actorRole,
    },
    target: {
      kind: log.targetType,
      id: log.targetId,
      name: log.targetName,
    },
    // CLM cases carry customer info inside the case; the page that needs
    // per-customer filtering should hydrate `clientId` from the case.
    description: log.reason,
    reason: log.reason,
    changes: diffFromValues(log.previousValue, log.newValue),
    ipAddress: log.ipAddress,
    device: log.device,
    createdAt: log.createdAt,
  };
}

/* ------------------------------------------------------------------------- */
/* Client Detail single-field log → Global                                   */
/* ------------------------------------------------------------------------- */

/** Lookup table for known client-scope action keys. Falls back to the raw
 *  action string for unknown legacy entries. */
const CLIENT_ACTION_LABELS: Record<string, string> = {
  修改杠杆: "Leverage Updated",
  添加标签: "Tag Added",
  "KYC 审核通过": "KYC Approved",
  "KYC 审核拒绝": "KYC Rejected",
  冻结账户: "Account Frozen",
  解冻账户: "Account Unfrozen",
};

/** Severity for client-scope actions — be lenient and default to info. */
function inferClientSeverity(action: string): AuditSeverity {
  const lc = action.toLowerCase();
  if (lc.includes("freez") || lc.includes("冻结") || lc.includes("blacklist")) return "critical";
  if (lc.includes("reject") || lc.includes("拒绝") || lc.includes("revoke")) return "warning";
  return "info";
}

export function clientAuditToGlobal(log: ClientAuditLog): GlobalAuditLog {
  const change: AuditChange = {
    field: log.targetField,
    oldValue: log.oldValue,
    newValue: log.newValue,
  };
  return {
    id: log.id,
    domain: "clients",
    severity: inferClientSeverity(log.action),
    action: log.action,
    actionLabel: CLIENT_ACTION_LABELS[log.action] ?? log.action,
    actor: { id: log.operator, name: log.operator },
    target: { kind: "customer", id: log.clientId },
    clientId: log.clientId,
    changes: log.targetField || log.oldValue || log.newValue ? [change] : [],
    ipAddress: log.ipAddress,
    createdAt: log.timestamp,
  };
}

/* ------------------------------------------------------------------------- */
/* Helpers                                                                   */
/* ------------------------------------------------------------------------- */

/** Project a list of GlobalAuditLog back into the legacy client-scope shape
 *  so existing tabs that haven't migrated keep rendering. */
export function globalToClientAudit(log: GlobalAuditLog): ClientAuditLog {
  const change = log.changes[0];
  return {
    id: log.id,
    clientId: log.clientId ?? log.target.id,
    operator: log.actor.name,
    action: log.actionLabel,
    targetField: change?.field ?? "",
    oldValue: change?.oldValue == null ? undefined : String(change.oldValue),
    newValue: change?.newValue == null ? undefined : String(change.newValue),
    timestamp: log.createdAt,
    ipAddress: log.ipAddress ?? "—",
  };
}

/** Stable severity for arbitrary domains. Used by the few mock generators
 *  that don't produce a CLM/Client log directly. */
export function severityFor(domain: AuditDomain, action: string): AuditSeverity {
  if (domain === "compliance" && /blacklist|freeze|aml/i.test(action)) return "critical";
  if (domain === "funds" && /reject|withhold|freeze/i.test(action)) return "warning";
  if (domain === "risk" && /critical|hit/i.test(action)) return "critical";
  if (domain === "staff" && /lock|reset/i.test(action)) return "warning";
  return "info";
}
