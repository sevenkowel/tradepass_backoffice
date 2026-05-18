/**
 * Approval Center - Mock Data
 * 用于开发和演示的模拟数据
 */

import type {
  ApprovalTask,
  Reviewer,
  AuditEntry,
  WorkflowStatus,
  TaskType,
  BusinessModule,
  RiskLevel,
  ApprovalRole,
  SlaConfig,
} from "@/types/approval";
import { SlaEngine } from "./slaEngine";

// ============================================
// 生成器辅助函数
// ============================================

let taskIdCounter = 1000;

export function generateTaskId(): string {
  return `TASK-${++taskIdCounter}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

const COUNTRIES = ["ID", "TH", "VN", "MY", "SG", "PH", "CN", "HK"];
const NAMES = [
  "Budi Santoso", "Siti Rahayu", "Ahmad Wijaya", "Dewi Kusuma",
  "Somchai Jaidee", "Nattapong Srisai", "Nguyen Van A", "Tran Thi B",
  "Lim Wei Ming", "Tan Mei Ling", "Rizal Abdullah", "Putri Maharani",
  "Chen Wei", "Li Na", "Wong Ka Ming", "Lau Siu Man",
];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBool(chance = 0.5): boolean {
  return Math.random() < chance;
}

function minutesAgo(minutes: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutes);
  return d.toISOString();
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================
// SLA Configs (同步自 slaEngine)
// ============================================

export const DEFAULT_SLA_CONFIGS: SlaConfig[] = [
  { id: "sla-kyc-normal", name: "KYC Normal", taskType: "kyc", priority: "normal", timeoutMinutes: 240, warningThresholdMinutes: 60, escalationThresholdMinutes: 30, escalateTo: "senior_reviewer", escalationStrategy: "skill_based" },
  { id: "sla-kyc-vip", name: "KYC VIP", taskType: "kyc", priority: "vip", timeoutMinutes: 60, warningThresholdMinutes: 15, escalationThresholdMinutes: 15, escalateTo: "senior_reviewer", escalationStrategy: "manual" },
  { id: "sla-kyc-high-risk", name: "KYC High Risk", taskType: "kyc", priority: "high_risk", timeoutMinutes: 120, warningThresholdMinutes: 30, escalationThresholdMinutes: 30, escalateTo: "compliance_officer", escalationStrategy: "skill_based" },
  { id: "sla-withdrawal-normal", name: "Withdrawal Normal", taskType: "withdrawal", priority: "normal", timeoutMinutes: 120, warningThresholdMinutes: 30, escalationThresholdMinutes: 30, escalateTo: "senior_reviewer", escalationStrategy: "round_robin" },
  { id: "sla-withdrawal-large", name: "Withdrawal Large", taskType: "withdrawal", priority: "high_risk", timeoutMinutes: 60, warningThresholdMinutes: 15, escalationThresholdMinutes: 15, escalateTo: "compliance_officer", escalationStrategy: "manual" },
  { id: "sla-deposit", name: "Deposit", taskType: "deposit", priority: "normal", timeoutMinutes: 60, warningThresholdMinutes: 15, escalationThresholdMinutes: 30, escalateTo: "senior_reviewer", escalationStrategy: "round_robin" },
  { id: "sla-leverage", name: "Leverage", taskType: "leverage", priority: "normal", timeoutMinutes: 30, warningThresholdMinutes: 10, escalationThresholdMinutes: 15, escalateTo: "senior_reviewer", escalationStrategy: "round_robin" },
  { id: "sla-reward", name: "Reward", taskType: "reward", priority: "normal", timeoutMinutes: 120, warningThresholdMinutes: 30, escalationThresholdMinutes: 30, escalateTo: "senior_reviewer", escalationStrategy: "round_robin" },
  { id: "sla-partner", name: "Partner", taskType: "partner", priority: "normal", timeoutMinutes: 480, warningThresholdMinutes: 120, escalationThresholdMinutes: 60, escalateTo: "supervisor", escalationStrategy: "skill_based" },
  { id: "sla-profile-change", name: "Profile Change", taskType: "profile_change", priority: "normal", timeoutMinutes: 240, warningThresholdMinutes: 60, escalationThresholdMinutes: 30, escalateTo: "senior_reviewer", escalationStrategy: "round_robin" },
  { id: "sla-aml-review", name: "AML Review", taskType: "aml_review", priority: "high_risk", timeoutMinutes: 180, warningThresholdMinutes: 45, escalationThresholdMinutes: 30, escalateTo: "compliance_officer", escalationStrategy: "skill_based" },
  { id: "sla-large-withdrawal", name: "Large Withdrawal", taskType: "large_withdrawal", priority: "high_risk", timeoutMinutes: 60, warningThresholdMinutes: 15, escalationThresholdMinutes: 15, escalateTo: "compliance_officer", escalationStrategy: "manual" },
  { id: "sla-re-verification", name: "Re-Verification", taskType: "re_verification", priority: "normal", timeoutMinutes: 480, warningThresholdMinutes: 120, escalationThresholdMinutes: 60, escalateTo: "senior_reviewer", escalationStrategy: "round_robin" },
];

// ============================================
// 生成 Mock Task
// ============================================

const MODULE_MAP: Record<TaskType, BusinessModule> = {
  kyc:              "clm_kyc",
  withdrawal:       "wallet_withdrawal",
  deposit:          "wallet_deposit",
  leverage:         "trading_leverage",
  reward:           "promotions_reward",
  partner:          "ib_partner",
  profile_change:   "crm_profile_change",
  aml_review:       "risk_aml_review",
  large_withdrawal: "finance_large_withdrawal",
  re_verification:  "clm_kyc",
};

export function generateMockTask(partial?: Partial<ApprovalTask>): ApprovalTask {
  const type = partial?.type ?? randomPick<TaskType>([
    "kyc", "withdrawal", "deposit", "leverage", "reward", "partner", "profile_change", "aml_review", "large_withdrawal", "re_verification",
  ]);

  const country = partial?.userCountry ?? randomPick(COUNTRIES);
  const riskLevel = partial?.riskLevel ?? randomPick<RiskLevel>(["low", "low", "low", "medium", "medium", "high", "critical"]);
  const riskScore = partial?.riskScore ?? (
    riskLevel === "low" ? randomInt(10, 30) :
    riskLevel === "medium" ? randomInt(30, 60) :
    riskLevel === "high" ? randomInt(60, 85) :
    randomInt(85, 100)
  );

  const hasAmount = ["withdrawal", "deposit", "leverage", "reward", "large_withdrawal"].includes(type);
  const amount = partial?.amount ?? (hasAmount ? randomInt(100, 100000) : undefined);
  const currency = partial?.currency ?? (hasAmount ? randomPick(["USD", "IDR", "THB", "SGD"]) : undefined);

  /* v2 status enum — only 4 values. Legacy generators that picked
   * "in_review" / "escalated" / etc. are migrated below. */
  const status: WorkflowStatus = partial?.status ?? randomPick<WorkflowStatus>([
    "pending", "pending", "pending", "pending", "on_hold", "approved", "rejected",
  ]);

  const createdAt = partial?.createdAt ?? minutesAgo(randomInt(5, 2880));
  const slaConfig = DEFAULT_SLA_CONFIGS.find((c) => c.taskType === type);
  const timeoutMinutes = slaConfig?.timeoutMinutes ?? 240;
  const dueAt = SlaEngine.calculateDueAt(createdAt, timeoutMinutes);

  const flags: string[] = partial?.riskFlags ? [...partial.riskFlags] : [];
  if (!partial?.riskFlags) {
    if (randomBool(0.1)) flags.push("vpn");
    if (randomBool(0.05)) flags.push("duplicate_device");
    if (randomBool(0.03)) flags.push("sanction_hit");
    if (randomBool(0.08)) flags.push("high_risk_country");
  }

  const name = partial?.userName ?? randomPick(NAMES);
  const uid = partial?.userUid ?? `UID${randomInt(100000, 999999)}`;

  /* Tags derive from status + assignee unless the caller supplied them
   * explicitly. `claimed` is set whenever an `assigneeId` exists. */
  const baseTags = partial?.tags ? [...partial.tags] : [];
  const assigneeId = partial?.assigneeId ?? (status !== "pending" || randomBool(0.3) ? randomPick(["reviewer-1", "reviewer-2", "reviewer-3", undefined]) : undefined);
  if (assigneeId && !baseTags.includes("claimed")) baseTags.push("claimed");

  return {
    id: partial?.id ?? generateTaskId(),
    type,
    module: MODULE_MAP[type],
    sourceId: partial?.sourceId ?? `SRC-${randomInt(1000, 9999)}`,
    detailUrl: partial?.detailUrl ?? `/crm/${type}/${randomInt(1000, 9999)}`,

    userId:      partial?.userId      ?? `user-${randomInt(1, 999)}`,
    userUid:     uid,
    userName:    name,
    userEmail:   partial?.userEmail   ?? `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    userCountry: country,
    userTier:    partial?.userTier    ?? randomPick(["standard", "standard", "standard", "vip", "platinum"]),

    subject:     partial?.subject     ?? `${type.toUpperCase()} - ${name}`,
    description: partial?.description ?? `Approval request for ${type}`,
    amount,
    currency,

    riskLevel,
    riskScore,
    riskFlags: flags.length > 0 ? flags : undefined,

    status,
    previousStatus: partial?.previousStatus,
    tags: baseTags.length > 0 ? baseTags : undefined,

    assigneeId,
    assigneeName: partial?.assigneeName,
    assigneeRole: partial?.assigneeRole,

    slaConfigId: slaConfig?.id ?? "sla-default",
    slaDueAt:    partial?.slaDueAt ?? dueAt,
    slaStatus:   "normal",

    createdAt,
    updatedAt:    partial?.updatedAt    ?? createdAt,
    claimedAt:    partial?.claimedAt    ?? (assigneeId ? minutesAgo(randomInt(1, 60)) : undefined),
    heldAt:       partial?.heldAt       ?? (status === "on_hold" ? minutesAgo(randomInt(1, 30)) : undefined),
    escalatedAt:  partial?.escalatedAt  ?? (baseTags.includes("escalated") ? minutesAgo(randomInt(1, 20)) : undefined),
    resolvedAt:   partial?.resolvedAt   ?? (["approved", "rejected"].includes(status) ? minutesAgo(randomInt(1, 120)) : undefined),
    resolvedBy:   partial?.resolvedBy,
    resolutionNote: partial?.resolutionNote,

    canInlineApprove:
      partial?.canInlineApprove ??
      (riskLevel === "low" && (!flags || flags.length === 0) &&
        ["deposit", "withdrawal", "reward", "profile_change", "leverage"].includes(type)),

    payload: partial?.payload,
  };
}

// ============================================
// Mock Reviewers
// ============================================

export const mockReviewers: Reviewer[] = [
  {
    id: "reviewer-1",
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "senior_reviewer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
    permissions: ["kyc", "withdrawal", "deposit", "leverage", "reward", "profile_change", "aml_review", "large_withdrawal", "re_verification"],
    countries: ["ID", "TH", "VN", "MY", "SG", "PH"],
    languages: ["en", "id", "th"],
    activeTaskCount: 5,
    todayCompletedCount: 12,
    isOnline: true,
    workStatus: "available",
  },
  {
    id: "reviewer-2",
    name: "Bob Smith",
    email: "bob@example.com",
    role: "reviewer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
    permissions: ["kyc", "withdrawal", "deposit", "reward", "profile_change"],
    countries: ["ID", "MY"],
    languages: ["en", "id"],
    activeTaskCount: 3,
    todayCompletedCount: 8,
    isOnline: true,
    workStatus: "busy",
  },
  {
    id: "reviewer-3",
    name: "Carol Lee",
    email: "carol@example.com",
    role: "compliance_officer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carol",
    permissions: ["aml_review", "large_withdrawal", "kyc", "partner"],
    countries: ["SG", "HK", "CN"],
    languages: ["en", "zh"],
    activeTaskCount: 2,
    todayCompletedCount: 6,
    isOnline: true,
    workStatus: "available",
  },
  {
    id: "reviewer-4",
    name: "David Kim",
    email: "david@example.com",
    role: "supervisor",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
    permissions: ["kyc", "withdrawal", "deposit", "leverage", "reward", "partner", "profile_change", "aml_review", "large_withdrawal", "re_verification"],
    countries: ["ID", "TH", "VN", "MY", "SG", "PH", "CN", "HK"],
    languages: ["en", "id", "th", "zh"],
    activeTaskCount: 1,
    todayCompletedCount: 4,
    isOnline: false,
    workStatus: "offline",
  },
  {
    id: "reviewer-5",
    name: "Eva Martinez",
    email: "eva@example.com",
    role: "reviewer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=eva",
    permissions: ["kyc", "withdrawal", "reward", "re_verification"],
    countries: ["TH", "VN"],
    languages: ["en", "th"],
    activeTaskCount: 7,
    todayCompletedCount: 15,
    isOnline: true,
    workStatus: "busy",
  },
];

// ============================================
// 预生成 Mock Tasks — v2 narrative seed
//
// Replaces the v1 random-60 generator with a hand-crafted morning
// workload. The operator opening the Inbox sees a realistic mix:
// urgent KYC critical cases, a batch of low-risk inline-approvable
// deposits, two near-threshold withdrawals, a handful of others.
// Plus some already-resolved tasks for the All view + Audit Trail.
//
// Goal: ~24 active + ~6 terminal = readable in a single screen
// scroll, demos cleanly without needing to filter.
// ============================================

type TaskSeed = Partial<ApprovalTask>;

const NARRATIVE_SEED: TaskSeed[] = [
  /* ── Three urgent KYC critical cases (hand-off to CLM) ────── */
  { id: "TASK-1001", type: "kyc",              riskLevel: "critical", riskScore: 92, riskFlags: ["sanction_hit"], userName: "Rajesh Kumar",   userCountry: "IN", userTier: "vip",      subject: "KYC — sanction watchlist hit", status: "pending", createdAt: minutesAgo(210), assigneeId: "reviewer-1", tags: ["escalated"] },
  { id: "TASK-1002", type: "kyc",              riskLevel: "critical", riskScore: 88, riskFlags: ["high_risk_country", "duplicate_device"], userName: "Elena Petrova",  userCountry: "RU", userTier: "platinum", subject: "KYC — high-risk jurisdiction",  status: "pending", createdAt: minutesAgo(180), assigneeId: undefined },
  { id: "TASK-1003", type: "re_verification",  riskLevel: "high",     riskScore: 78, userName: "Wei Zhang",      userCountry: "CN", userTier: "vip",      subject: "Re-verification — annual review", status: "pending", createdAt: minutesAgo(150), assigneeId: "reviewer-3" },

  /* ── AML review — escalated ────────────────────────────────── */
  { id: "TASK-1004", type: "aml_review",  riskLevel: "high",   riskScore: 82, riskFlags: ["sanction_hit"], userName: "Ivan Volkov",     userCountry: "RU", subject: "AML — large pattern of structured deposits", status: "pending", createdAt: minutesAgo(95),  assigneeId: "reviewer-3", tags: ["escalated"] },

  /* ── Two large withdrawals near threshold ──────────────────── */
  { id: "TASK-1005", type: "large_withdrawal", riskLevel: "high",   riskScore: 71, amount: 72000, currency: "USD", userName: "Carlos Romero",   userCountry: "MX", userTier: "vip", subject: "Withdrawal · 72,000 USD",  status: "pending", createdAt: minutesAgo(120), assigneeId: "reviewer-2" },
  { id: "TASK-1006", type: "withdrawal",       riskLevel: "medium", riskScore: 55, amount: 15000, currency: "USD", userName: "Oliver Chen",     userCountry: "SG",                  subject: "Withdrawal · 15,000 USD",  status: "pending", createdAt: minutesAgo(90),  assigneeId: undefined },

  /* ── Five inline-approvable deposits ───────────────────────── */
  { id: "TASK-1007", type: "deposit", riskLevel: "low", riskScore: 18, amount: 3500,  currency: "USD",  userName: "Maria Garcia",    userCountry: "ES", subject: "Card deposit · 3,500 USD",  status: "pending", createdAt: minutesAgo(60),  assigneeId: undefined, canInlineApprove: true },
  { id: "TASK-1008", type: "deposit", riskLevel: "low", riskScore: 14, amount: 8200,  currency: "USD",  userName: "James Okafor",    userCountry: "NG", subject: "Bank transfer · 8,200 USD", status: "pending", createdAt: minutesAgo(55),  assigneeId: undefined, canInlineApprove: true },
  { id: "TASK-1009", type: "deposit", riskLevel: "low", riskScore: 22, amount: 1800,  currency: "USD",  userName: "Amira Hassan",    userCountry: "EG", subject: "E-wallet · 1,800 USD",      status: "pending", createdAt: minutesAgo(45),  assigneeId: undefined, canInlineApprove: true },
  { id: "TASK-1010", type: "deposit", riskLevel: "low", riskScore: 19, amount: 12400, currency: "USDT", userName: "Yuki Tanaka",     userCountry: "JP", subject: "Crypto · 12,400 USDT",      status: "pending", createdAt: minutesAgo(40),  assigneeId: undefined, canInlineApprove: true },
  { id: "TASK-1011", type: "deposit", riskLevel: "low", riskScore: 12, amount: 950,   currency: "USD",  userName: "Sophie Martin",   userCountry: "FR", subject: "Card deposit · 950 USD",    status: "pending", createdAt: minutesAgo(35),  assigneeId: "reviewer-2", canInlineApprove: true, tags: ["claimed"] },

  /* ── Two partner / IB applications ─────────────────────────── */
  { id: "TASK-1012", type: "partner", riskLevel: "medium", riskScore: 45, userName: "Lucas Silva",      userCountry: "BR", subject: "IB tier upgrade — Lucas Silva",  status: "pending", createdAt: minutesAgo(70),  assigneeId: undefined },
  { id: "TASK-1013", type: "partner", riskLevel: "medium", riskScore: 48, userName: "Priya Sharma",     userCountry: "IN", subject: "New IB application — Priya Sharma", status: "pending", createdAt: minutesAgo(50), assigneeId: undefined },

  /* ── Inline-approvable: profile change ─────────────────────── */
  { id: "TASK-1014", type: "profile_change", riskLevel: "low", riskScore: 11, userName: "Thomas Müller",   userCountry: "DE", subject: "Address update", status: "pending", createdAt: minutesAgo(30), assigneeId: undefined, canInlineApprove: true },

  /* ── Leverage request on hold (awaiting risk team) ─────────── */
  { id: "TASK-1015", type: "leverage", riskLevel: "medium", riskScore: 58, amount: 50000, currency: "USD", userName: "Fatima Al-Zahra", userCountry: "MA", subject: "Leverage 1:500 — Fatima Al-Zahra", status: "on_hold", createdAt: minutesAgo(180), assigneeId: "reviewer-2", tags: ["claimed", "awaiting_user"] },

  /* ── Reward / promo ────────────────────────────────────────── */
  { id: "TASK-1016", type: "reward", riskLevel: "low", riskScore: 16, amount: 200, currency: "USD", userName: "Ahmed Al-Rashid", userCountry: "AE", subject: "Welcome bonus · 200 USD", status: "pending", createdAt: minutesAgo(20), assigneeId: undefined, canInlineApprove: true },

  /* ── Awaiting user (docs requested) ────────────────────────── */
  { id: "TASK-1017", type: "kyc", riskLevel: "medium", riskScore: 52, userName: "Dmitri Volkov", userCountry: "RU", subject: "KYC — proof of address requested", status: "on_hold", createdAt: minutesAgo(330), assigneeId: "reviewer-1", tags: ["claimed", "awaiting_user", "docs_requested"] },

  /* ── Already resolved (history) ────────────────────────────── */
  { id: "TASK-0901", type: "deposit",    status: "approved", riskLevel: "low",      userName: "Nguyen Van A",    userCountry: "VN", subject: "Card deposit · 4,200 USD", createdAt: minutesAgo(720),  resolvedAt: minutesAgo(700),  resolvedBy: "reviewer-2", assigneeId: "reviewer-2", resolutionNote: "Auto-approved by low-risk policy" },
  { id: "TASK-0902", type: "kyc",        status: "approved", riskLevel: "low",      userName: "Tan Mei Ling",    userCountry: "MY", subject: "KYC — passport verified",  createdAt: minutesAgo(900),  resolvedAt: minutesAgo(810),  resolvedBy: "reviewer-1", assigneeId: "reviewer-1", resolutionNote: "All documents verified" },
  { id: "TASK-0903", type: "withdrawal", status: "rejected", riskLevel: "high",     userName: "Anonymous User",  userCountry: "RU", subject: "Withdrawal · 4,800 USD",   createdAt: minutesAgo(1100), resolvedAt: minutesAgo(960),  resolvedBy: "reviewer-3", assigneeId: "reviewer-3", resolutionNote: "AML hit — funds frozen pending investigation", tags: ["blacklist_flagged"] },
  { id: "TASK-0904", type: "kyc",        status: "rejected", riskLevel: "critical", userName: "Suspect Account", userCountry: "—", subject: "KYC — fraudulent document",  createdAt: minutesAgo(1400), resolvedAt: minutesAgo(1200), resolvedBy: "reviewer-1", assigneeId: "reviewer-1", resolutionNote: "ID document appears forged", tags: ["blacklist_flagged"] },
  { id: "TASK-0905", type: "leverage",   status: "approved", riskLevel: "medium",   userName: "Sarah Lim",       userCountry: "SG", subject: "Leverage 1:200 — Sarah Lim", createdAt: minutesAgo(1500), resolvedAt: minutesAgo(1380), resolvedBy: "reviewer-4", assigneeId: "reviewer-4", resolutionNote: "Approved per risk team's exposure check" },
];

export const mockTasks: ApprovalTask[] = NARRATIVE_SEED.map((seed) => {
  const task = generateMockTask(seed);
  if (task.assigneeId) {
    const r = mockReviewers.find((rev) => rev.id === task.assigneeId);
    if (r) {
      task.assigneeName = r.name;
      task.assigneeRole = r.role;
    }
  }
  return task;
});

// ============================================
// Mock Audit Trail — v2 with new status enum
// ============================================

export const mockAuditTrail: AuditEntry[] = [
  /* TASK-0902 KYC — claimed → approved (yesterday) */
  { id: "audit-001", taskId: "TASK-0902", taskType: "kyc",        operatorId: "reviewer-1", operatorName: "Alice Johnson", operatorRole: "senior_reviewer",   action: "claim",   actionLabel: "Claim",   oldStatus: "pending", newStatus: "pending",  timestamp: minutesAgo(900) },
  { id: "audit-002", taskId: "TASK-0902", taskType: "kyc",        operatorId: "reviewer-1", operatorName: "Alice Johnson", operatorRole: "senior_reviewer",   action: "approve", actionLabel: "Approve", oldStatus: "pending", newStatus: "approved", note: "All documents verified", timestamp: minutesAgo(810) },

  /* TASK-1017 KYC — claimed, then docs requested (on_hold) */
  { id: "audit-003", taskId: "TASK-1017", taskType: "kyc",        operatorId: "reviewer-1", operatorName: "Alice Johnson", operatorRole: "senior_reviewer",   action: "claim",                   actionLabel: "Claim",         oldStatus: "pending", newStatus: "pending", timestamp: minutesAgo(330) },
  { id: "audit-004", taskId: "TASK-1017", taskType: "kyc",        operatorId: "reviewer-1", operatorName: "Alice Johnson", operatorRole: "senior_reviewer",   action: "request_additional_docs", actionLabel: "Request Docs", oldStatus: "pending", newStatus: "on_hold", note: "Please provide proof of address dated within the last 90 days.", timestamp: minutesAgo(300) },

  /* TASK-1004 AML — escalated */
  { id: "audit-005", taskId: "TASK-1004", taskType: "aml_review", operatorId: "reviewer-3", operatorName: "Carol Lee",     operatorRole: "compliance_officer", action: "claim",    actionLabel: "Claim",    oldStatus: "pending", newStatus: "pending", timestamp: minutesAgo(95) },
  { id: "audit-006", taskId: "TASK-1004", taskType: "aml_review", operatorId: "reviewer-3", operatorName: "Carol Lee",     operatorRole: "compliance_officer", action: "escalate", actionLabel: "Escalate", oldStatus: "pending", newStatus: "pending", note: "Structured deposit pattern crosses SAR threshold — supervisor review required.", timestamp: minutesAgo(60) },

  /* TASK-0904 KYC — rejected with blacklist */
  { id: "audit-007", taskId: "TASK-0904", taskType: "kyc",        operatorId: "reviewer-1", operatorName: "Alice Johnson", operatorRole: "senior_reviewer",   action: "reject",   actionLabel: "Reject",   oldStatus: "pending", newStatus: "rejected", note: "BLACKLIST: ID document appears forged", reason: "fraudulent_document", timestamp: minutesAgo(1200) },

  /* TASK-0903 Withdrawal — rejected */
  { id: "audit-008", taskId: "TASK-0903", taskType: "withdrawal", operatorId: "reviewer-3", operatorName: "Carol Lee",     operatorRole: "compliance_officer", action: "reject",   actionLabel: "Reject",   oldStatus: "pending", newStatus: "rejected", note: "AML hit — funds frozen pending investigation",  reason: "aml_hit", timestamp: minutesAgo(960) },

  /* TASK-1015 Leverage — claim then hold (waiting on risk team) */
  { id: "audit-009", taskId: "TASK-1015", taskType: "leverage",   operatorId: "reviewer-2", operatorName: "Bob Smith",     operatorRole: "reviewer",          action: "claim",  actionLabel: "Claim", oldStatus: "pending", newStatus: "pending", timestamp: minutesAgo(170) },
  { id: "audit-010", taskId: "TASK-1015", taskType: "leverage",   operatorId: "reviewer-2", operatorName: "Bob Smith",     operatorRole: "reviewer",          action: "hold",   actionLabel: "Hold",  oldStatus: "pending", newStatus: "on_hold", note: "Pinging risk team on the exposure model.", timestamp: minutesAgo(140) },
];
