/**
 * CLM Audit Log Types
 * Compliance-grade audit trail
 */

export type CLMAuditAction =
  | "case_created"
  | "case_assigned"
  | "case_reviewed"
  | "case_approved"
  | "case_rejected"
  | "case_resubmission_requested"
  | "case_escalated"
  | "case_cancelled"
  | "case_comment_added"
  | "policy_updated"
  | "policy_published"
  | "agreement_published"
  | "workflow_changed"
  | "customer_level_changed"
  | "customer_frozen"
  | "customer_unfrozen";

export type CLMAuditTargetType =
  | "case"
  | "customer"
  | "policy"
  | "workflow"
  | "agreement"
  | "level"
  | "template";

export interface CLMAuditLog {
  id: string;
  auditId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: CLMAuditAction;
  targetType: CLMAuditTargetType;
  targetId: string;
  targetName?: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  reason?: string;
  ipAddress?: string;
  device?: string;
  createdAt: string;
}

export interface AuditListParams {
  actorId?: string;
  action?: CLMAuditAction;
  targetType?: CLMAuditTargetType;
  targetId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}
