/**
 * Mock Prisma client — no SQLite needed.
 * Used when MOCK_DB=true. All API routes work transparently.
 */

import { mockClientSegments as crmMockSegments } from "@/lib/crm/mock-clients";

// ─── Mock DB rows (Prisma shape) ────────────────────────────────────────────

const now = new Date();
const d = (s: string) => new Date(s);

/**
 * Build an array of N MT accounts with the same total equity / balance
 * shape the mapper expects (`{ equity, balance }`). Used to fake a
 * realistic "trading-account count" distribution per user.
 */
function mkAccounts(n: number, totalBalance: number, pnlPct = 0.02): { equity: number; balance: number }[] {
  if (n <= 0) return [];
  const per = totalBalance / n;
  return Array.from({ length: n }, (_, i) => ({
    balance: Math.round(per),
    // Slight P/L variation between accounts so total equity != total balance.
    equity: Math.round(per * (1 + ((i % 3) - 1) * pnlPct)),
  }));
}

const mockUsers = [
  {
    id: "user-001", email: "zhangwei@example.com", passwordHash: "mock",
    name: "张伟", phone: "+86 138 **** 8888", status: "active",
    kycStatus: "approved", emailVerifiedAt: d("2024-01-15"), phoneVerified: true,
    twoFactorSecret: null, twoFactorEnabled: false,
    lastLoginAt: d("2026-05-08T14:20:00Z"), onboardingCompletedAt: d("2024-01-16"),
    onboardingLocked: false, createdAt: d("2024-01-15T08:30:00Z"), updatedAt: now,
    wallets: [{ balance: 52840.5, frozen: 0, currency: "USD" }],
    mtAccounts: mkAccounts(3, 52840.5),
    kycRecord: { amlRiskScore: 15, kycLevel: "enhanced", status: "approved" },
  },
  {
    id: "user-002", email: "liming@example.com", passwordHash: "mock",
    name: "李明", phone: "+86 139 **** 1234", status: "active",
    kycStatus: "pending", emailVerifiedAt: d("2026-03-10"), phoneVerified: false,
    twoFactorSecret: null, twoFactorEnabled: false,
    lastLoginAt: d("2026-05-07T18:30:00Z"), onboardingCompletedAt: null,
    onboardingLocked: false, createdAt: d("2026-03-10T09:15:00Z"), updatedAt: now,
    wallets: [{ balance: 3250, frozen: 0, currency: "USD" }],
    mtAccounts: mkAccounts(1, 3250),
    kycRecord: { amlRiskScore: 45, kycLevel: "standard", status: "pending" },
  },
  {
    id: "user-003", email: "wangfang@example.com", passwordHash: "mock",
    name: "王芳", phone: "+86 137 **** 5678", status: "suspended",
    kycStatus: "rejected", emailVerifiedAt: d("2025-08-20"), phoneVerified: true,
    twoFactorSecret: null, twoFactorEnabled: false,
    lastLoginAt: d("2025-09-01T10:00:00Z"), onboardingCompletedAt: null,
    onboardingLocked: false, createdAt: d("2025-08-20T11:00:00Z"), updatedAt: now,
    wallets: [{ balance: 0, frozen: 0, currency: "USD" }],
    mtAccounts: [],  // none — mapper falls back to mockAccountCountFor
    kycRecord: { amlRiskScore: 72, kycLevel: "basic", status: "rejected" },
  },
  {
    id: "user-004", email: "david.nguyen@example.com", passwordHash: "mock",
    name: "David Nguyen", phone: "+84 912 345 678", status: "active",
    kycStatus: "approved", emailVerifiedAt: d("2025-11-01"), phoneVerified: true,
    twoFactorSecret: null, twoFactorEnabled: true,
    lastLoginAt: d("2026-05-09T09:00:00Z"), onboardingCompletedAt: d("2025-11-02"),
    onboardingLocked: false, createdAt: d("2025-11-01T07:00:00Z"), updatedAt: now,
    wallets: [{ balance: 128000, frozen: 5000, currency: "USD" }],
    mtAccounts: mkAccounts(8, 128000),
    kycRecord: { amlRiskScore: 8, kycLevel: "enterprise", status: "approved" },
  },
  {
    id: "user-005", email: "sarah.lim@example.com", passwordHash: "mock",
    name: "Sarah Lim", phone: "+65 9123 4567", status: "active",
    kycStatus: "approved", emailVerifiedAt: d("2025-06-15"), phoneVerified: true,
    twoFactorSecret: null, twoFactorEnabled: false,
    lastLoginAt: d("2026-05-06T11:00:00Z"), onboardingCompletedAt: d("2025-06-16"),
    onboardingLocked: false, createdAt: d("2025-06-15T08:00:00Z"), updatedAt: now,
    wallets: [{ balance: 18500, frozen: 0, currency: "USD" }],
    mtAccounts: mkAccounts(2, 18500),
    kycRecord: { amlRiskScore: 12, kycLevel: "standard", status: "approved" },
  },
  {
    id: "user-006", email: "anna.mueller@example.com", passwordHash: "mock",
    name: "Anna Müller", phone: "+49 175 234 5678", status: "active",
    kycStatus: "approved", emailVerifiedAt: d("2025-07-10"), phoneVerified: true,
    twoFactorSecret: null, twoFactorEnabled: true,
    lastLoginAt: d("2026-05-10T16:00:00Z"), onboardingCompletedAt: d("2025-07-11"),
    onboardingLocked: false, createdAt: d("2025-07-10T10:00:00Z"), updatedAt: now,
    wallets: [{ balance: 42000, frozen: 0, currency: "USD" }],
    mtAccounts: mkAccounts(5, 42000),
    kycRecord: { amlRiskScore: 18, kycLevel: "enhanced", status: "approved" },
  },
  {
    id: "user-007", email: "tanaka.ken@example.com", passwordHash: "mock",
    name: "田中 健", phone: "+81 90 1234 5678", status: "pending",
    kycStatus: "in_review", emailVerifiedAt: d("2026-04-25"), phoneVerified: true,
    twoFactorSecret: null, twoFactorEnabled: false,
    lastLoginAt: d("2026-05-11T03:20:00Z"), onboardingCompletedAt: null,
    onboardingLocked: false, createdAt: d("2026-04-25T05:45:00Z"), updatedAt: now,
    wallets: [{ balance: 1200, frozen: 0, currency: "USD" }],
    mtAccounts: mkAccounts(1, 1200),
    kycRecord: { amlRiskScore: 32, kycLevel: "basic", status: "pending" },
  },
  {
    id: "user-008", email: "mohammed.alhassan@example.com", passwordHash: "mock",
    name: "Mohammed Al-Hassan", phone: "+971 50 123 4567", status: "active",
    kycStatus: "approved", emailVerifiedAt: d("2024-09-12"), phoneVerified: true,
    twoFactorSecret: null, twoFactorEnabled: true,
    lastLoginAt: d("2026-05-12T09:30:00Z"), onboardingCompletedAt: d("2024-09-13"),
    onboardingLocked: false, createdAt: d("2024-09-12T06:00:00Z"), updatedAt: now,
    wallets: [{ balance: 320000, frozen: 15000, currency: "USD" }],
    mtAccounts: mkAccounts(12, 320000),
    kycRecord: { amlRiskScore: 22, kycLevel: "enterprise", status: "approved" },
  },
  {
    id: "user-009", email: "james.obrien@example.com", passwordHash: "mock",
    name: "James O'Brien", phone: "+44 7700 900123", status: "active",
    kycStatus: "approved", emailVerifiedAt: d("2025-03-22"), phoneVerified: true,
    twoFactorSecret: null, twoFactorEnabled: true,
    lastLoginAt: d("2026-05-09T20:10:00Z"), onboardingCompletedAt: d("2025-03-23"),
    onboardingLocked: false, createdAt: d("2025-03-22T09:00:00Z"), updatedAt: now,
    wallets: [{ balance: 87500, frozen: 0, currency: "USD" }],
    mtAccounts: mkAccounts(6, 87500),
    kycRecord: { amlRiskScore: 10, kycLevel: "enhanced", status: "approved" },
  },
  {
    id: "user-010", email: "lin.wei@example.com", passwordHash: "mock",
    name: "林 偉", phone: "+886 912 345 678", status: "active",
    kycStatus: "approved", emailVerifiedAt: d("2023-12-05"), phoneVerified: true,
    twoFactorSecret: null, twoFactorEnabled: true,
    lastLoginAt: d("2026-05-12T14:50:00Z"), onboardingCompletedAt: d("2023-12-06"),
    onboardingLocked: false, createdAt: d("2023-12-05T10:00:00Z"), updatedAt: now,
    wallets: [{ balance: 1_250_000, frozen: 0, currency: "USD" }],
    mtAccounts: mkAccounts(18, 1_250_000),  // institutional / VIP — max-tier
    kycRecord: { amlRiskScore: 5, kycLevel: "enterprise", status: "approved" },
  },
];

const mockTenants = [
  {
    id: "tenant-demo", name: "Demo Broker", slug: "demo", logoUrl: null,
    status: "active", region: "ap-southeast-1", timezone: "Asia/Shanghai",
    locale: "zh-CN", domainWhitelist: null, trialEndsAt: null,
    ownerId: "user-001", brandName: "Demo Broker", slogan: null,
    faviconUrl: null, primaryColor: "#2563eb", subdomain: "demo",
    customDomain: null, customDomainVerified: false,
    plan: "professional", maxUsers: 100, maxAccounts: 50,
    createdAt: d("2024-01-01"), updatedAt: now,
  },
  {
    id: "tenant-acme", name: "Acme FX", slug: "acme", logoUrl: null,
    status: "trial", region: "ap-southeast-1", timezone: "Asia/Bangkok",
    locale: "th-TH", domainWhitelist: null, trialEndsAt: d("2026-06-01"),
    ownerId: "user-004", brandName: "Acme FX", slogan: null,
    faviconUrl: null, primaryColor: "#dc2626", subdomain: "acme",
    customDomain: null, customDomainVerified: false,
    plan: "starter", maxUsers: 20, maxAccounts: 10,
    createdAt: d("2026-03-01"), updatedAt: now,
  },
];

const mockLicenses = [
  { id: "lic-001", tenantId: "tenant-demo", type: "MT5", status: "active", serverId: "server-1", createdAt: d("2024-01-05"), updatedAt: now },
  { id: "lic-002", tenantId: "tenant-demo", type: "MT4", status: "active", serverId: "server-2", createdAt: d("2024-02-01"), updatedAt: now },
  { id: "lic-003", tenantId: "tenant-acme", type: "MT5", status: "trial", serverId: "server-3", createdAt: d("2026-03-05"), updatedAt: now },
];

const mockInvoices = [
  { id: "inv-001", tenantId: "tenant-demo", amount: 2999, status: "paid", currency: "USD", createdAt: d("2026-01-01"), updatedAt: now },
  { id: "inv-002", tenantId: "tenant-demo", amount: 2999, status: "paid", currency: "USD", createdAt: d("2026-02-01"), updatedAt: now },
  { id: "inv-003", tenantId: "tenant-demo", amount: 2999, status: "paid", currency: "USD", createdAt: d("2026-03-01"), updatedAt: now },
  { id: "inv-004", tenantId: "tenant-demo", amount: 2999, status: "pending", currency: "USD", createdAt: d("2026-04-01"), updatedAt: now },
  { id: "inv-005", tenantId: "tenant-acme", amount: 499, status: "pending", currency: "USD", createdAt: d("2026-03-15"), updatedAt: now },
];

const mockTransactions = [
  { id: "tx-001", userId: "user-001", walletId: "w-001", type: "deposit", amount: 10000, status: "completed", currency: "USD", createdAt: d("2026-04-10"), updatedAt: now, user: mockUsers[0] },
  { id: "tx-002", userId: "user-001", walletId: "w-001", type: "withdrawal", amount: 5000, status: "completed", currency: "USD", createdAt: d("2026-04-15"), updatedAt: now, user: mockUsers[0] },
  { id: "tx-003", userId: "user-002", walletId: "w-002", type: "deposit", amount: 3000, status: "completed", currency: "USD", createdAt: d("2026-05-01"), updatedAt: now, user: mockUsers[1] },
  { id: "tx-004", userId: "user-004", walletId: "w-004", type: "deposit", amount: 50000, status: "completed", currency: "USD", createdAt: d("2026-05-05"), updatedAt: now, user: mockUsers[3] },
  { id: "tx-005", userId: "user-005", walletId: "w-005", type: "withdrawal", amount: 2000, status: "pending", currency: "USD", createdAt: d("2026-05-10"), updatedAt: now, user: mockUsers[4] },
];

const mockPositions = [
  { id: "pos-001", accountId: "acc-001", symbol: "EURUSD", direction: "buy", volume: 1.5, openPrice: 1.0823, currentPrice: 1.0851, pnl: 420, openAt: d("2026-05-08"), account: { login: "10001", user: mockUsers[0] } },
  { id: "pos-002", accountId: "acc-001", symbol: "XAUUSD", direction: "sell", volume: 0.5, openPrice: 2345.5, currentPrice: 2338.2, pnl: 365, openAt: d("2026-05-09"), account: { login: "10001", user: mockUsers[0] } },
  { id: "pos-003", accountId: "acc-004", symbol: "GBPUSD", direction: "buy", volume: 2.0, openPrice: 1.2654, currentPrice: 1.2698, pnl: 880, openAt: d("2026-05-07"), account: { login: "10004", user: mockUsers[3] } },
];

const mockOrders = [
  { id: "ord-001", accountId: "acc-001", symbol: "EURUSD", type: "market", direction: "buy", volume: 1.5, price: 1.0823, status: "filled", createdAt: d("2026-05-08"), account: { login: "10001", user: mockUsers[0] } },
  { id: "ord-002", accountId: "acc-002", symbol: "BTCUSD", type: "limit", direction: "buy", volume: 0.1, price: 60000, status: "pending", createdAt: d("2026-05-09"), account: { login: "10002", user: mockUsers[1] } },
];

const mockKycRecords = [
  { id: "kyc-001", userId: "user-002", status: "pending", kycLevel: "standard", amlRiskScore: 45, submittedAt: d("2026-05-05"), reviewedAt: null, reviewedBy: null, rejectionReason: null, createdAt: d("2026-05-05"), updatedAt: now, user: mockUsers[1] },
  { id: "kyc-002", userId: "user-003", status: "rejected", kycLevel: "basic", amlRiskScore: 72, submittedAt: d("2025-09-01"), reviewedAt: d("2025-09-02"), reviewedBy: "admin", rejectionReason: "Document quality too low", createdAt: d("2025-09-01"), updatedAt: now, user: mockUsers[2] },
];

const mockRiskEvents = [
  { id: "re-001", userId: "user-003", type: "unusual_login", severity: "high", description: "Login from new country", resolvedAt: null, createdAt: d("2026-05-01"), updatedAt: now },
  { id: "re-002", userId: "user-002", type: "large_withdrawal", severity: "medium", description: "Withdrawal above threshold", resolvedAt: d("2026-05-03"), createdAt: d("2026-05-02"), updatedAt: now },
];

const mockIbPartners = [
  { id: "ib-001", userId: "user-001", code: "IB001", status: "active", commissionRate: 0.3, totalClients: 12, totalCommission: 4200, createdAt: d("2024-02-01"), updatedAt: now, user: mockUsers[0] },
];

const mockCommissions = [
  { id: "com-001", ibPartnerId: "ib-001", amount: 350, currency: "USD", period: "2026-04", status: "paid", createdAt: d("2026-05-01"), updatedAt: now, ibPartner: mockIbPartners[0] },
  { id: "com-002", ibPartnerId: "ib-001", amount: 420, currency: "USD", period: "2026-03", status: "paid", createdAt: d("2026-04-01"), updatedAt: now, ibPartner: mockIbPartners[0] },
];

const mockTags = [
  { id: "tag-001", name: "高净值", color: "#f59e0b", isSystem: false, tenantId: "tenant-demo", createdAt: d("2024-01-01"), updatedAt: now, _count: { assignments: 2 } },
  { id: "tag-002", name: "高频交易", color: "#3b82f6", isSystem: false, tenantId: "tenant-demo", createdAt: d("2024-01-01"), updatedAt: now, _count: { assignments: 1 } },
  { id: "tag-003", name: "高风险", color: "#ef4444", isSystem: true, tenantId: "tenant-demo", createdAt: d("2024-01-01"), updatedAt: now, _count: { assignments: 1 } },
  { id: "tag-004", name: "新客户", color: "#10b981", isSystem: false, tenantId: "tenant-demo", createdAt: d("2024-01-01"), updatedAt: now, _count: { assignments: 1 } },
];

/* ─── Notes mock — 80+ 条多样化备注（覆盖 4 种类型 / 多个客户 / @mention）─── */

const NOTE_AUTHORS = [
  { id: "staff-001", name: "Alice Chen",  email: "alice.chen@demo.com" },
  { id: "staff-002", name: "Bob Martin",  email: "bob.martin@demo.com" },
  { id: "staff-003", name: "Carol Wong",  email: "carol.wong@demo.com" },
  { id: "staff-004", name: "David Liu",   email: "david.liu@demo.com" },
  { id: "staff-005", name: "Emma Park",   email: "emma.park@demo.com" },
  { id: "admin",     name: "Admin",       email: "admin@demo.com" },
];

const NOTE_TEMPLATES: { type: "general" | "risk" | "sales" | "followup"; templates: string[] }[] = [
  {
    type: "sales",
    templates: [
      "客户表示有意向增加仓位 — 计划下周完成第二笔入金",
      "VIP 客户经理回访 — 客户对 ECN 账户类型很满意，建议推介 PRO",
      "客户咨询信用卡入金通道，已发送 Stripe 链接",
      "讨论了高杠杆开通，客户需先升级 KYC L2",
      "客户对 XAUUSD 点差敏感，已申请 spread 优化",
      "邀请客户参加亚太 webinar，已确认出席",
      "推荐了我们的 IB 项目，客户有意向引荐 2-3 个朋友",
      "客户咨询 MAM/PAMM 账户，约下周一详谈",
    ],
  },
  {
    type: "risk",
    templates: [
      "保证金水平连续 3 天 < 200%，触发风控审查",
      "AML 名单复查 — 名字相似但生日不符，已确认非 PEP",
      "短时间内多笔大额入金，疑似洗钱，已上报合规组",
      "客户从高风险国家登录，要求二次验证",
      "异常 VPN 流量检测 — 客户使用 Tor 出口节点",
      "同设备登录的另一账户已被冻结，建议关联监控",
      "客户提交 KYC 时填写的地址与 IP 地理位置严重不符",
      "高频交易 + scalping 行为，已加入风控观察名单",
      "夜间大额出金尝试，已暂停审核等人工复审",
      "客户共享 IP 与其他 3 个账户，需要关系网络复核",
    ],
  },
  {
    type: "followup",
    templates: [
      "等待 KYC 补充材料 — 地址证明",
      "出金审核通过后回访客户，确认到账时效",
      "下周一拨打客户跟进 30 天未交易情况",
      "客户答应明天补充护照背面照片",
      "证件即将过期，已发送续期提醒邮件，5 天后跟进",
      "客户反馈出金延迟，已升级到风控组，预计 2 天内回复",
      "VIP 升级流程进行中，等客户经理分配确认",
      "首次交易奖金已发放，需电话回访确认满意度",
      "客户投诉 spread 异常，已申请技术组日志分析",
      "周五约客户做风险测评问卷",
    ],
  },
  {
    type: "general",
    templates: [
      "客户来电询问账户余额查询方式 — 已发送指南链接",
      "记录客户偏好交易时段：UTC 02:00-06:00（亚洲早盘）",
      "客户对中文客服满意度高，建议保留同一客户经理",
      "客户使用 macOS + Chrome，无需考虑 Windows 兼容性问题",
      "更新客户联系方式 — 新电话号码 +86 138-****-6789",
      "客户希望邮件通知改为每周摘要而非每日",
      "客户已加入官方 Telegram 群，活跃度高",
      "推荐了 IOS 移动 App，客户反馈界面流畅",
      "客户对 demo 账户的过期时间询问，已说明 90 天自动续期",
      "记录：客户对资金安全很看重，反复确认账户分隔",
      "客户咨询了平台是否支持 Apple Pay，已说明暂不支持",
      "更新客户的固定 IP 白名单（出于安全考虑）",
    ],
  },
];

function buildMockNotes() {
  const result: Array<{
    id: string; userId: string; authorId: string; authorName: string;
    content: string; noteType: string; isPinned: boolean;
    mentions: string;
    createdAt: Date; updatedAt: Date;
    author: { name: string; email: string };
  }> = [];

  const userIds = ["user-001", "user-002", "user-003", "user-004", "user-005", "user-006", "user-007", "user-008"];
  const now = Date.now();
  let id = 1;

  // 用 deterministic 派生避免每次刷新洗牌
  let seed = 12345;
  const rng = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];

  // 每种类型生成对应数量
  const typeQuotas: Record<string, number> = {
    sales: 22,
    risk: 18,
    followup: 28,
    general: 20,
  };

  for (const tpl of NOTE_TEMPLATES) {
    const quota = typeQuotas[tpl.type] ?? 10;
    for (let i = 0; i < quota; i++) {
      const author = pick(NOTE_AUTHORS);
      const userId = pick(userIds);
      const content = pick(tpl.templates);
      const daysAgo = Math.floor(rng() * 90); // 过去 90 天
      const isPinned = rng() < 0.1; // 10% pinned
      const hasMention = rng() < 0.3; // 30% with @mention
      const mentionTarget = hasMention ? pick(NOTE_AUTHORS.filter((a) => a.id !== author.id)) : null;

      result.push({
        id: `note-${String(id).padStart(3, "0")}`,
        userId,
        authorId: author.id,
        authorName: author.name,
        content: mentionTarget ? `@${mentionTarget.name} ${content}` : content,
        noteType: tpl.type,
        isPinned,
        mentions: mentionTarget ? JSON.stringify([mentionTarget.id]) : "[]",
        createdAt: new Date(now - daysAgo * 86400_000 - Math.floor(rng() * 86400_000)),
        updatedAt: new Date(now),
        author: { name: author.name, email: author.email },
      });
      id++;
    }
  }

  // 按时间倒序
  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

const mockNotes = buildMockNotes();

/* Segments — pulled from mock-clients.ts. The route handler stores
 * `filter` as a JSON string, so we serialise here on seed and the
 * handler parses it back out via `safeJSON`. Keeping a single source
 * of truth (mock-clients) avoids drift between the front-end's
 * directly-imported list and the API-routed list. */
const mockSegments = crmMockSegments.map((s) => ({
  id: s.id,
  name: s.name,
  description: s.description ?? null,
  filter: JSON.stringify(s.filter ?? {}),
  userCount: s.userCount,
  isDynamic: s.isDynamic,
  createdAt: d(s.createdAt),
  updatedAt: now,
}));

// ─── Model mock factory ───────────────────────────────────────────────────────

type AnyRecord = Record<string, unknown>;

function createModelMock(rows: AnyRecord[]) {
  const findById = (where: AnyRecord) => {
    const id = where?.id as string | undefined;
    if (id) return rows.find((r) => r.id === id) ?? null;
    const email = where?.email as string | undefined;
    if (email) return rows.find((r) => r.email === email) ?? null;
    return rows[0] ?? null;
  };

  return {
    findMany: async (_args?: unknown) => rows,
    findFirst: async (_args?: unknown) => rows[0] ?? null,
    findUnique: async (args?: { where?: AnyRecord }) => findById(args?.where ?? {}),
    count: async (_args?: unknown) => rows.length,
    create: async (args?: { data?: AnyRecord }) => ({
      id: `mock-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(args?.data ?? {}),
    }),
    update: async (args?: { where?: AnyRecord; data?: AnyRecord }) => ({
      ...(findById(args?.where ?? {}) ?? rows[0] ?? {}),
      ...(args?.data ?? {}),
      updatedAt: new Date(),
    }),
    upsert: async (args?: { create?: AnyRecord; update?: AnyRecord }) => ({
      id: `mock-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(args?.create ?? {}),
    }),
    delete: async (args?: { where?: AnyRecord }) => findById(args?.where ?? {}) ?? rows[0] ?? {},
    deleteMany: async (_args?: unknown) => ({ count: 0 }),
    updateMany: async (_args?: unknown) => ({ count: 0 }),
    aggregate: async (args?: { _sum?: AnyRecord }) => {
      const result: AnyRecord = {};
      if (args?._sum) {
        result._sum = Object.fromEntries(
          Object.keys(args._sum).map((k) => [k, 8997])
        );
      }
      result._count = { _all: rows.length };
      result._avg = {};
      result._min = {};
      result._max = {};
      return result;
    },
    groupBy: async (_args?: unknown) => [],
  };
}

// ─── Assembled mock client ────────────────────────────────────────────────────

const models: Record<string, ReturnType<typeof createModelMock>> = {
  user: createModelMock(mockUsers as unknown as AnyRecord[]),
  tenant: createModelMock(mockTenants as unknown as AnyRecord[]),
  license: createModelMock(mockLicenses as unknown as AnyRecord[]),
  invoice: createModelMock(mockInvoices as unknown as AnyRecord[]),
  transaction: createModelMock(mockTransactions as unknown as AnyRecord[]),
  position: createModelMock(mockPositions as unknown as AnyRecord[]),
  order: createModelMock(mockOrders as unknown as AnyRecord[]),
  kYCRecord: createModelMock(mockKycRecords as unknown as AnyRecord[]),
  riskEvent: createModelMock(mockRiskEvents as unknown as AnyRecord[]),
  iBPartner: createModelMock(mockIbPartners as unknown as AnyRecord[]),
  commission: createModelMock(mockCommissions as unknown as AnyRecord[]),
  clientTag: createModelMock(mockTags as unknown as AnyRecord[]),
  clientNote: createModelMock(mockNotes as unknown as AnyRecord[]),
  wallet: createModelMock([
    { id: "w-001", userId: "user-001", balance: 52840.5, frozen: 0, currency: "USD" },
    { id: "w-002", userId: "user-002", balance: 3250, frozen: 0, currency: "USD" },
    { id: "w-004", userId: "user-004", balance: 128000, frozen: 5000, currency: "USD" },
    { id: "w-005", userId: "user-005", balance: 18500, frozen: 0, currency: "USD" },
  ]),
  mTAccount: createModelMock([
    { id: "acc-001", userId: "user-001", login: "10001", balance: 52840.5, equity: 53120.3, status: "active" },
    { id: "acc-002", userId: "user-002", login: "10002", balance: 3250, equity: 3200, status: "active" },
    { id: "acc-004", userId: "user-004", login: "10004", balance: 128000, equity: 135000, status: "active" },
  ]),
  tenantMember: createModelMock([
    { id: "tm-001", tenantId: "tenant-demo", userId: "user-001", role: "admin", joinedAt: d("2024-01-01") },
  ]),
  tenantConfig: createModelMock([
    { id: "tc-001", tenantId: "tenant-demo", key: "theme", value: "{}", createdAt: d("2024-01-01"), updatedAt: now },
  ]),
  tenantApp: createModelMock([
    { id: "ta-001", tenantId: "tenant-demo", appId: "crm", status: "active", installedAt: d("2024-01-01") },
    { id: "ta-002", tenantId: "tenant-demo", appId: "mt5", status: "active", installedAt: d("2024-01-01") },
  ]),
  blacklistEntry: createModelMock([]),
  clientTagAssignment: createModelMock([]),
  clientSegment: createModelMock(mockSegments as unknown as AnyRecord[]),
  crmAuditLog: createModelMock([]),
  crmTimelineEvent: createModelMock([]),
  emailVerification: createModelMock([]),
  auditLog: createModelMock([]),
  paymentMethod: createModelMock([]),
  deviceFingerprint: createModelMock([]),
};

// Proxy catches any model not explicitly listed above
const baseClient = {
  ...models,
  $connect: async () => {},
  $disconnect: async () => {},
  $transaction: async (fnOrOps: unknown) => {
    if (typeof fnOrOps === "function") {
      return (fnOrOps as (tx: unknown) => unknown)(mockPrismaProxy);
    }
    return Promise.all(fnOrOps as Promise<unknown>[]);
  },
  $executeRaw: async () => 0,
  $queryRaw: async () => [],
};

export const mockPrismaProxy = new Proxy(baseClient, {
  get(target, prop: string) {
    if (prop in target) return target[prop as keyof typeof target];
    // Unknown model → return empty mock so nothing crashes
    return createModelMock([]);
  },
});
