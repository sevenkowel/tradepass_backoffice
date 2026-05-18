/**
 * Mock 数据：跟进任务 / 工作分配 / 团队活动.
 *
 * 注意：每个生成器都使用一个本地的、固定 seed 的 PRNG，并以模块顶部
 *      `EPOCH` 常量作为时间基准 — 这样无论 SSR 还是客户端 hydration
 *      调用，输出都是完全相同的，避免 React hydration mismatch。
 */

/* ─────────────────────────────────────────────────────────────────────────── */
/* Follow-ups                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

export type FollowupPriority = "low" | "medium" | "high" | "urgent";
export type FollowupStatus = "open" | "in_progress" | "done" | "overdue";

export interface FollowupTask {
  id: string;
  clientId: string;
  clientName: string;
  clientUid: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  priority: FollowupPriority;
  status: FollowupStatus;
  dueAt: string;
  createdAt: string;
  /** 来源（哪个规则 / 哪个人创建的） */
  source: "manual" | "rule" | "system";
  sourceName?: string;
  category: "kyc" | "deposit" | "withdrawal" | "retention" | "risk" | "vip" | "support";
}

const TASK_TEMPLATES = [
  { title: "联系客户确认入金状态",     category: "deposit" as const,    priority: "medium" as const },
  { title: "30 天未交易 — 留存沟通",   category: "retention" as const,  priority: "medium" as const },
  { title: "KYC 资料即将过期提醒",     category: "kyc" as const,        priority: "low" as const },
  { title: "出金审核延迟跟进",         category: "withdrawal" as const, priority: "high" as const },
  { title: "高风险客户人工复核",       category: "risk" as const,       priority: "urgent" as const },
  { title: "VIP 客户月度回访",         category: "vip" as const,        priority: "medium" as const },
  { title: "客户投诉处理",             category: "support" as const,    priority: "high" as const },
  { title: "保证金不足提醒电话",       category: "risk" as const,       priority: "high" as const },
  { title: "推广活动跟进",             category: "retention" as const,  priority: "low" as const },
  { title: "新客户首次入金引导",       category: "deposit" as const,    priority: "medium" as const },
  { title: "客户经理转交",             category: "support" as const,    priority: "low" as const },
  { title: "IB 合作意向洽谈",          category: "vip" as const,        priority: "medium" as const },
];

const STAFF = [
  { id: "staff-001", name: "Alice Chen" },
  { id: "staff-002", name: "Bob Martin" },
  { id: "staff-003", name: "Carol Wong" },
  { id: "staff-004", name: "David Liu" },
  { id: "staff-005", name: "Emma Park" },
];

const CLIENTS = [
  { id: "user-001", name: "Anna Müller",   uid: "USR000001" },
  { id: "user-002", name: "Tanaka Yuki",   uid: "USR000002" },
  { id: "user-003", name: "Liu Wei",       uid: "USR000003" },
  { id: "user-004", name: "Park Min-jun",  uid: "USR000004" },
  { id: "user-005", name: "Hassan Khalid", uid: "USR000005" },
  { id: "user-006", name: "Lee Wong",      uid: "USR000006" },
  { id: "user-007", name: "Sophie Martin", uid: "USR000007" },
  { id: "user-008", name: "Marco Rossi",   uid: "USR000008" },
];

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Frozen "now" used as the anchor for all relative timestamps in this
 * file. Mock generators MUST NOT call `Date.now()` directly — that
 * would let SSR and client hydration disagree on numbers like "days
 * ago" / dueAt, producing React hydration mismatches (next.js error
 * #418). Bump the constant when refreshing the mock dataset for a
 * demo. */
const EPOCH = Date.parse("2026-05-18T12:00:00Z");

/** Build a self-contained random helper bound to a fixed seed.
 *  Each generator must call `rng(seed)` at the top of its body so it
 *  stays idempotent — no shared mutable state across calls or modules. */
function rng(seed: number) {
  const r = mulberry32(seed);
  return {
    r,
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(r() * arr.length)],
  };
}

export function generateFollowups(): FollowupTask[] {
  const { r, pick } = rng(12345);
  const out: FollowupTask[] = [];
  for (let i = 0; i < 36; i++) {
    const tpl = pick(TASK_TEMPLATES);
    const client = pick(CLIENTS);
    const assignee = pick(STAFF);
    // 70% open, 20% done, 10% overdue
    const rand = r();
    const status: FollowupStatus = rand < 0.7 ? (rand < 0.4 ? "open" : "in_progress")
      : rand < 0.9 ? "done"
      : "overdue";
    // 未来 / 过去随机
    const dueAtOffset = (r() - 0.4) * 14 * 86400_000;
    out.push({
      id: `fu-${String(i + 1).padStart(3, "0")}`,
      clientId: client.id,
      clientName: client.name,
      clientUid: client.uid,
      title: tpl.title,
      description: `自动派生 — ${tpl.title}`,
      assigneeId: assignee.id,
      assigneeName: assignee.name,
      priority: tpl.priority,
      status,
      dueAt: new Date(EPOCH + dueAtOffset).toISOString(),
      createdAt: new Date(EPOCH - Math.floor(r() * 30) * 86400_000).toISOString(),
      source: r() < 0.5 ? "rule" : r() < 0.7 ? "manual" : "system",
      sourceName: r() < 0.5 ? "90 天沉默规则" : undefined,
      category: tpl.category,
    });
  }
  return out.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Assignments                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

export interface StaffWorkload {
  staffId: string;
  staffName: string;
  role: string;
  team: string;
  /** 服务的客户列表 */
  clientCount: number;
  /** 高净值客户数 */
  vipClientCount: number;
  /** 当月触达客户数 */
  monthlyTouches: number;
  /** 客户列表（精简） */
  clients: { id: string; name: string; level: string; lastTouch: string }[];
}

export function generateAssignments(): StaffWorkload[] {
  const { r, pick } = rng(22222);
  return STAFF.map((s, i) => {
    const clientCount = 8 + i * 4 + Math.floor(r() * 6);
    const clients = [];
    for (let j = 0; j < Math.min(clientCount, CLIENTS.length); j++) {
      const c = CLIENTS[(i + j) % CLIENTS.length];
      clients.push({
        id: c.id,
        name: c.name,
        level: pick(["standard", "vip", "premium", "enterprise"] as const),
        lastTouch: new Date(EPOCH - Math.floor(r() * 30) * 86400_000).toISOString(),
      });
    }
    return {
      staffId: s.id,
      staffName: s.name,
      role: i === 0 ? "VIP 客户经理" : i === 1 ? "销售主管" : i === 2 ? "留存专员" : i === 3 ? "新客户经理" : "客户成功",
      team: i < 2 ? "VIP & Premium" : i < 4 ? "活跃客户" : "新客户",
      clientCount,
      vipClientCount: clients.filter((c) => c.level === "vip" || c.level === "premium" || c.level === "enterprise").length,
      monthlyTouches: 15 + Math.floor(r() * 50),
      clients,
    };
  });
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Team Activities                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

export type ActivityType =
  | "client_created" | "kyc_approved" | "kyc_rejected" | "kyc_resubmit"
  | "deposit_approved" | "withdrawal_approved" | "withdrawal_rejected"
  | "account_frozen" | "account_unfrozen" | "tag_added"
  | "note_added" | "followup_done" | "case_resolved";

export interface TeamActivityItem {
  id: string;
  staffId: string;
  staffName: string;
  type: ActivityType;
  clientId: string;
  clientName: string;
  summary: string;
  metadata?: string;
  timestamp: string;
}

const ACTIVITY_TEMPLATES: Record<ActivityType, { label: string; tone: string; icon: string }> = {
  client_created:        { label: "新建客户",          tone: "text-blue-700",     icon: "user-plus" },
  kyc_approved:          { label: "KYC 通过",          tone: "text-emerald-700",  icon: "shield-check" },
  kyc_rejected:          { label: "KYC 拒绝",          tone: "text-red-700",      icon: "shield-x" },
  kyc_resubmit:          { label: "要求重交",          tone: "text-amber-700",    icon: "shield" },
  deposit_approved:      { label: "入金通过",          tone: "text-emerald-700",  icon: "arrow-down" },
  withdrawal_approved:   { label: "出金通过",          tone: "text-emerald-700",  icon: "arrow-up" },
  withdrawal_rejected:   { label: "出金拒绝",          tone: "text-red-700",      icon: "arrow-up" },
  account_frozen:        { label: "冻结账户",          tone: "text-red-700",      icon: "ban" },
  account_unfrozen:      { label: "解冻账户",          tone: "text-emerald-700",  icon: "unlock" },
  tag_added:             { label: "加标签",            tone: "text-blue-700",     icon: "tag" },
  note_added:            { label: "添加备注",          tone: "text-slate-700",    icon: "message-square" },
  followup_done:         { label: "完成跟进",          tone: "text-emerald-700",  icon: "check-circle" },
  case_resolved:         { label: "申请已处理",        tone: "text-emerald-700",  icon: "file-check" },
};

export const ACTIVITY_META = ACTIVITY_TEMPLATES;

export function generateTeamActivities(): TeamActivityItem[] {
  const { r, pick } = rng(33333);
  const out: TeamActivityItem[] = [];
  const types = Object.keys(ACTIVITY_TEMPLATES) as ActivityType[];
  // 过去 7 天 100+ 条
  for (let i = 0; i < 120; i++) {
    const type = pick(types);
    const staff = pick(STAFF);
    const client = pick(CLIENTS);
    const ts = EPOCH - Math.floor(r() * 7 * 86400_000);
    out.push({
      id: `act-${String(i + 1).padStart(3, "0")}`,
      staffId: staff.id,
      staffName: staff.name,
      type,
      clientId: client.id,
      clientName: client.name,
      summary: `${staff.name} ${ACTIVITY_TEMPLATES[type].label} 客户 ${client.name}`,
      metadata: type === "deposit_approved" || type === "withdrawal_approved"
        ? `$${Math.floor(r() * 50000 + 100)}`
        : type === "tag_added" ? `+${pick(["VIP", "High Risk", "Active", "New"])}`
        : undefined,
      timestamp: new Date(ts).toISOString(),
    });
  }
  return out.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Device clusters / Shared accounts / Linked identities                       */
/* ─────────────────────────────────────────────────────────────────────────── */

export interface DeviceCluster {
  id: string;
  deviceHash: string;
  deviceLabel: string;
  os: string;
  browser: string;
  memberIds: string[];
  members: { id: string; name: string; uid: string; country: string; riskScore: number }[];
  lastSeenAt: string;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export function generateDeviceClusters(): DeviceCluster[] {
  const { r, pick } = rng(44444);
  const out: DeviceCluster[] = [];
  for (let i = 0; i < 8; i++) {
    const memberCount = 2 + Math.floor(r() * 5);
    const members = [];
    for (let j = 0; j < memberCount; j++) {
      const c = CLIENTS[(i * 2 + j) % CLIENTS.length];
      members.push({
        id: c.id,
        name: c.name,
        uid: c.uid,
        country: pick(["CN", "HK", "SG", "JP", "AE"] as const),
        riskScore: 30 + Math.floor(r() * 60),
      });
    }
    const avg = members.reduce((s, m) => s + m.riskScore, 0) / members.length;
    out.push({
      id: `dev-cluster-${i}`,
      deviceHash: `fp_${Math.abs(Math.floor(r() * 1e10)).toString(16)}`,
      deviceLabel: pick(["Chrome 124 / Win11", "Safari 17 / macOS", "Chrome Mobile / Android", "Safari Mobile / iOS"]),
      os: pick(["Windows 11", "macOS 14", "iOS 17", "Android 14"]),
      browser: pick(["Chrome 124", "Safari 17", "Firefox 125", "Edge 124"]),
      memberIds: members.map((m) => m.id),
      members,
      lastSeenAt: new Date(EPOCH - Math.floor(r() * 7 * 86400_000)).toISOString(),
      riskLevel: avg >= 80 ? "critical" : avg >= 60 ? "high" : avg >= 30 ? "medium" : "low",
    });
  }
  return out.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.riskLevel] - order[b.riskLevel];
  });
}

export interface SharedAccount {
  id: string;
  /** 共享的支付方式（hash / mask） */
  paymentMethod: string;
  type: "bank" | "crypto_wallet" | "credit_card" | "e_wallet";
  members: { id: string; name: string; uid: string; usageCount: number }[];
  totalFlow: number;
  lastUsedAt: string;
}

const PAYMENT_LABELS = ["HSBC ****1234", "Bank of China ****5678", "USDT-TRC20 TQabc...xyz", "BTC bc1q...abcd", "VISA ****9999", "Skrill john.doe@", "Mastercard ****1111"];

export function generateSharedAccounts(): SharedAccount[] {
  const { r, pick } = rng(55555);
  const out: SharedAccount[] = [];
  for (let i = 0; i < 10; i++) {
    const memberCount = 2 + Math.floor(r() * 4);
    const members = [];
    for (let j = 0; j < memberCount; j++) {
      const c = CLIENTS[(i + j * 2) % CLIENTS.length];
      members.push({
        id: c.id,
        name: c.name,
        uid: c.uid,
        usageCount: 1 + Math.floor(r() * 20),
      });
    }
    out.push({
      id: `shared-${i}`,
      paymentMethod: PAYMENT_LABELS[i % PAYMENT_LABELS.length],
      type: pick(["bank", "crypto_wallet", "credit_card", "e_wallet"] as const),
      members,
      totalFlow: 10_000 + Math.floor(r() * 500_000),
      lastUsedAt: new Date(EPOCH - Math.floor(r() * 30 * 86400_000)).toISOString(),
    });
  }
  return out;
}

export interface LinkedIdentity {
  id: string;
  signal: "same_name" | "same_dob" | "same_id_number" | "email_alias";
  signalLabel: string;
  members: { id: string; name: string; uid: string; country: string }[];
  confidence: number;
  detectedAt: string;
}

export function generateLinkedIdentities(): LinkedIdentity[] {
  const { r, pick } = rng(66666);
  const out: LinkedIdentity[] = [];
  const signals: { type: LinkedIdentity["signal"]; label: string }[] = [
    { type: "same_name",      label: "同名 + 同生日" },
    { type: "same_dob",       label: "同生日 + 同国籍" },
    { type: "same_id_number", label: "证件号一致" },
    { type: "email_alias",    label: "邮箱前缀相似 (+1/+2)" },
  ];
  for (let i = 0; i < 6; i++) {
    const sig = signals[i % signals.length];
    const members = [];
    const memberCount = 2 + Math.floor(r() * 2);
    for (let j = 0; j < memberCount; j++) {
      const c = CLIENTS[(i * 3 + j) % CLIENTS.length];
      members.push({
        id: c.id,
        name: c.name,
        uid: c.uid,
        country: pick(["CN", "HK", "SG", "JP", "DE"] as const),
      });
    }
    out.push({
      id: `linked-${i}`,
      signal: sig.type,
      signalLabel: sig.label,
      members,
      confidence: 0.6 + r() * 0.4,
      detectedAt: new Date(EPOCH - Math.floor(r() * 90 * 86400_000)).toISOString(),
    });
  }
  return out.sort((a, b) => b.confidence - a.confidence);
}
