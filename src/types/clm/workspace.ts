/**
 * CLM Workspace Types
 * Dashboard and monitoring data
 */

import type { CLMCase, CLMCaseType, RiskLevel } from "./case";

export interface WorkspaceKPI {
  pendingReviews: number;
  timeoutCases: number;
  amlHits: number;
  approvalRateToday: number;
  avgReviewTimeMinutes: number;
  autoReviewRate: number;
}

export interface QueueSummaryItem {
  queue: string;
  caseType: CLMCaseType;
  count: number;
  priority: "low" | "medium" | "high" | "critical";
}

export interface RiskAlert {
  id: string;
  type: "high_risk_country" | "aml_hit" | "multiple_accounts" | "large_deposit" | "vpn_proxy" | "device_mismatch";
  title: string;
  description: string;
  caseId: string;
  customerName: string;
  severity: "warning" | "critical";
  createdAt: string;
}

export interface MyTaskFilters {
  tab: "pending" | "in_progress" | "near_timeout" | "escalated" | "returned";
}

export interface WorkspaceData {
  kpi: WorkspaceKPI;
  queueSummary: QueueSummaryItem[];
  riskAlerts: RiskAlert[];
  myTasks: CLMCase[];
  recentActivity: CaseActivity[];
}

export interface CaseActivity {
  id: string;
  actor: string;
  action: string;
  caseNo: string;
  customerName: string;
  timestamp: string;
}
