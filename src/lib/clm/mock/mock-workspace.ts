/**
 * CLM Workspace Mock Data
 */
import type { WorkspaceKPI, QueueSummaryItem, RiskAlert, CaseActivity } from "@/types/clm";
import { mockCases } from "./mock-cases";

export const mockWorkspaceKPI: WorkspaceKPI = {
  pendingReviews: 132,
  timeoutCases: 18,
  amlHits: 6,
  approvalRateToday: 82,
  avgReviewTimeMinutes: 4,
  autoReviewRate: 67,
};

export const mockQueueSummary: QueueSummaryItem[] = [
  { queue: "New KYC", caseType: "kyc", count: 80, priority: "medium" },
  { queue: "Resubmission", caseType: "kyc", count: 30, priority: "high" },
  { queue: "AML Review", caseType: "manual_review", count: 12, priority: "critical" },
  { queue: "Video Verification", caseType: "video_verification", count: 5, priority: "high" },
  { queue: "Withdrawal Review", caseType: "withdrawal_review", count: 8, priority: "high" },
  { queue: "EDD", caseType: "edd", count: 3, priority: "critical" },
  { queue: "POA", caseType: "poa", count: 15, priority: "medium" },
  { queue: "Liveness", caseType: "liveness", count: 10, priority: "medium" },
];

export const mockRiskAlerts: RiskAlert[] = [
  {
    id: "alert-001",
    type: "aml_hit",
    title: "AML Watchlist Match",
    description: "Customer Nguyen Van A (UID 10028391) name matched AML watchlist",
    caseId: "case-001",
    customerName: "Nguyen Van A",
    severity: "critical",
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: "alert-002",
    type: "multiple_accounts",
    title: "Multiple Accounts Detected",
    description: "3 accounts sharing same device ID: dev-abc-123",
    caseId: "case-001",
    customerName: "Nguyen Van A",
    severity: "warning",
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
  },
  {
    id: "alert-003",
    type: "large_deposit",
    title: "Large Deposit Alert",
    description: "Customer Silva Carlos deposited $50,000 exceeding threshold",
    caseId: "case-011",
    customerName: "Silva Carlos",
    severity: "critical",
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "alert-004",
    type: "vpn_proxy",
    title: "VPN/Proxy Detected",
    description: "Customer Sato Yuki login from known VPN IP",
    caseId: "case-009",
    customerName: "Sato Yuki",
    severity: "warning",
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: "alert-005",
    type: "high_risk_country",
    title: "High-Risk Country",
    description: "Customer Al-Rashid Fahad from UAE flagged as high-risk jurisdiction",
    caseId: "case-013",
    customerName: "Al-Rashid Fahad",
    severity: "critical",
    createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
  },
];

export const mockRecentActivity: CaseActivity[] = [
  {
    id: "act-001",
    actor: "Admin A",
    action: "approved",
    caseNo: "KYC-00104",
    customerName: "Le Van C",
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "act-002",
    actor: "Senior Reviewer",
    action: "rejected",
    caseNo: "KYC-00105",
    customerName: "Pham Thi D",
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "act-003",
    actor: "Admin B",
    action: "requested resubmission",
    caseNo: "KYC-00103",
    customerName: "Tran Thi B",
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: "act-004",
    actor: "System",
    action: "auto-approved",
    caseNo: "KYC-00119",
    customerName: "Oliveira Joao",
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: "act-005",
    actor: "Admin A",
    action: "assigned",
    caseNo: "WDR-00112",
    customerName: "Wong Mei Lin",
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
  },
];

// My tasks = cases assigned to current user (staff-001 = Admin A)
export const mockMyTasks = mockCases.filter(
  (c) => c.assigneeId === "staff-001" && ["pending", "reviewing", "escalated", "resubmission"].includes(c.status)
);
