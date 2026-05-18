/**
 * Shared service interfaces.
 *
 * The CLM module ships two implementations of these interfaces:
 *   1. Mock — backed by in-memory arrays in `lib/clm/mock`
 *   2. API  — backed by HTTP fetch against `CLM_API_BASE`
 *
 * The factory in `services/index.ts` picks one at module load based
 * on `USE_MOCK_API` from `lib/clm/config.ts`. **Pages and components
 * always import the abstract instance** (`caseService`, `auditService`,
 * `workspaceService`) — they never know which backend is wired up.
 */

import type {
  CLMCase,
  CLMCaseStatus,
  CaseListParams,
  PaginatedResult,
  CaseComment,
  CaseDetail,
  CLMAuditLog,
  AuditListParams,
  WorkspaceData,
  WorkspaceKPI,
  QueueSummaryItem,
  RiskAlert,
  CaseActivity,
} from "@/types/clm";

export interface ICaseService {
  list(params?: CaseListParams): Promise<PaginatedResult<CLMCase>>;
  getById(id: string): Promise<(CLMCase & Partial<CaseDetail>) | null>;
  getMyTasks(userId: string): Promise<CLMCase[]>;
  approve(id: string, reviewerId: string, notes?: string): Promise<void>;
  reject(id: string, reviewerId: string, reason: string): Promise<void>;
  requestResubmission(id: string, reviewerId: string, reason: string): Promise<void>;
  escalate(id: string, reviewerId: string, reason: string): Promise<void>;
  assign(id: string, assigneeId: string, assignedBy: string): Promise<void>;
  addComment(id: string, comment: CaseComment): Promise<void>;
  batchApprove(ids: string[], reviewerId: string): Promise<void>;
  batchAssign(ids: string[], assigneeId: string, assignedBy: string): Promise<void>;
}

export interface IWorkspaceService {
  getDashboard(): Promise<WorkspaceData>;
  getKPI(): Promise<WorkspaceKPI>;
  getQueueSummary(): Promise<QueueSummaryItem[]>;
  getRiskAlerts(): Promise<RiskAlert[]>;
  getRecentActivity(): Promise<CaseActivity[]>;
}

export interface IAuditService {
  list(params?: AuditListParams): Promise<PaginatedResult<CLMAuditLog>>;
  getByCaseId(caseId: string): Promise<CLMAuditLog[]>;
  /** Push a new audit log entry. ID / auditId / createdAt are generated. */
  log(entry: Omit<CLMAuditLog, "id" | "auditId" | "createdAt">): Promise<void>;
}

/** Re-export for convenience so consumers only import from one place. */
export type {
  CLMCase,
  CLMCaseStatus,
  CaseListParams,
  PaginatedResult,
  CaseComment,
  CaseDetail,
  CLMAuditLog,
  AuditListParams,
  WorkspaceData,
  WorkspaceKPI,
  QueueSummaryItem,
  RiskAlert,
  CaseActivity,
};
