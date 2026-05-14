/**
 * Mock Prisma client — no SQLite needed.
 * Used when MOCK_DB=true. All API routes work transparently.
 */

// ─── Mock DB rows (Prisma shape) ────────────────────────────────────────────

const now = new Date();
const d = (s: string) => new Date(s);

const mockUsers = [
  {
    id: "user-001", email: "zhangwei@example.com", passwordHash: "mock",
    name: "张伟", phone: "+86 138 **** 8888", status: "active",
    kycStatus: "approved", emailVerifiedAt: d("2024-01-15"), phoneVerified: true,
    twoFactorSecret: null, twoFactorEnabled: false,
    lastLoginAt: d("2026-05-08T14:20:00Z"), onboardingCompletedAt: d("2024-01-16"),
    onboardingLocked: false, createdAt: d("2024-01-15T08:30:00Z"), updatedAt: now,
    wallets: [{ balance: 52840.5, frozen: 0, currency: "USD" }],
    mtAccounts: [{ equity: 53120.3, balance: 52840.5 }],
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
    mtAccounts: [{ equity: 3200, balance: 3250 }],
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
    mtAccounts: [],
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
    mtAccounts: [{ equity: 135000, balance: 128000 }],
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
    mtAccounts: [{ equity: 19200, balance: 18500 }],
    kycRecord: { amlRiskScore: 12, kycLevel: "standard", status: "approved" },
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

const mockNotes = [
  { id: "note-001", userId: "user-001", authorId: "admin", content: "客户表示有意向增加仓位", createdAt: d("2026-05-08"), updatedAt: now, author: { name: "Admin", email: "admin@demo.com" } },
  { id: "note-002", userId: "user-002", authorId: "admin", content: "等待KYC补充材料", createdAt: d("2026-05-07"), updatedAt: now, author: { name: "Admin", email: "admin@demo.com" } },
];

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
  clientSegment: createModelMock([]),
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
