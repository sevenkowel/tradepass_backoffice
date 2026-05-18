import type { Prisma } from "@prisma/client";
import type {
  BackofficeUser,
  ClientRole,
  KYCStatus,
  LifecycleStage,
  RiskLevel,
  UserLevel,
  UserStatus,
} from "@/types/backoffice/user";

type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    wallets: { select: { balance: true; frozen: true; currency: true } };
    mtAccounts: { select: { equity: true; balance: true } };
    kycRecord: { select: { amlRiskScore: true; kycLevel: true; status: true } };
  };
}>;

const STATUS_MAP: Record<string, UserStatus> = {
  active: "active",
  suspended: "frozen",
  frozen: "frozen",
  closed: "closed",
  pending: "pending",
  pending_verification: "pending",
};

/**
 * Mock 标签派生 — 给特定 mock 用户加角色 / IB 等级标签。
 * 标签语义：
 *   - "partner" / "ib"  → IB 合作伙伴
 *   - "senior"          → 高级合作伙伴（与 partner 配合）
 *   - "junior"          → 初级 IB（与 partner 配合）
 *   - "affiliate"       → 推广联盟客户
 * Sidebar 的 deriveRole / partnerTier 会读取这些 tag。
 * 真实 API 接入后，tags 应该从 user record 字段读取。
 */
const TAG_FIXTURES: Record<string, string[]> = {
  "user-006": ["partner", "ib", "senior"],   // Anna Müller — 高级合作伙伴
  "user-007": ["partner", "ib", "junior"],   // 田中 健 — 初级 IB
  "user-009": ["affiliate"],                 // James O'Brien — 推广联盟
};

function deriveTagsForMock(userId: string): string[] {
  return TAG_FIXTURES[userId] ?? [];
}

const KYC_MAP: Record<string, KYCStatus> = {
  not_started: "not_submitted",
  not_submitted: "not_submitted",
  pending: "pending",
  in_review: "pending",
  approved: "verified",
  verified: "verified",
  rejected: "rejected",
};

export function deriveLevel(balance: number, kycLevel?: string | null): UserLevel {
  if (kycLevel === "enterprise") return "enterprise";
  if (balance >= 100_000) return "enterprise";
  if (balance >= 25_000) return "premium";
  if (balance >= 5_000) return "vip";
  return "standard";
}

export function deriveRisk(amlScore?: number | null): {
  level: RiskLevel;
  score: number;
} {
  const score = amlScore == null ? 0 : Math.round(amlScore);
  if (score >= 80) return { level: "critical", score };
  if (score >= 60) return { level: "high", score };
  if (score >= 30) return { level: "medium", score };
  return { level: "low", score };
}

export function deriveLifecycle(args: {
  kycStatus: KYCStatus;
  status: UserStatus;
  hasFtd: boolean;
  lastLoginAt: Date | null;
}): LifecycleStage {
  const { kycStatus, status, hasFtd, lastLoginAt } = args;
  if (status === "closed") return "churn";
  const inactiveCutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  if (lastLoginAt && lastLoginAt.getTime() < inactiveCutoff) return "inactive";
  if (hasFtd) return "active";
  if (kycStatus === "verified") return "verified";
  return "registered";
}

export function buildUid(id: string): string {
  return `USR${id.slice(-6).toUpperCase()}`;
}

/* --------------------------------------------------------------------- */
/* Mock fallbacks for v3 display columns                                  */
/*                                                                       */
/* The dev-only mock proxy (`src/lib/mock/prisma-proxy.ts`) ships a thin */
/* User shape without `country / registrationSource / registrationDevice` */
/* fields and with no MT accounts. To keep the Clients list looking      */
/* realistic in mock mode we synthesise these deterministically from     */
/* `user.id` — same id always returns the same value (screenshot-safe).  */
/* When the real DB has values, the real values take precedence (see     */
/* `mapUserToClient`).                                                   */
/* --------------------------------------------------------------------- */

function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h ^ s.charCodeAt(i)) >>> 0) * 16777619;
  }
  return Math.abs(h | 0);
}

// Weighted country pool — forex-broker realistic distribution
// (CN/HK/AE/SG/JP heavy, others lighter).
const MOCK_COUNTRIES = [
  "CN", "CN", "CN", "CN", "CN",
  "HK", "HK", "HK",
  "SG", "SG",
  "JP", "JP",
  "AE", "AE", "SA",
  "KR", "TW",
  "VN", "TH", "MY", "ID", "PH",
  "US", "US", "GB", "GB",
  "AU", "DE", "FR", "ES", "IT", "BR", "MX", "ZA", "IN",
];

const MOCK_SOURCES = [
  "web", "web", "web", "web",          // ~40%
  "mobile_ios", "mobile_ios",          // ~20%
  "mobile_android", "mobile_android", "mobile_android", // ~30%
  "affiliate",                         // ~5%
  "import",                            // ~5%
];

const MOCK_DEVICES = [
  "Chrome 124 on macOS",
  "Chrome 124 on Windows 11",
  "Safari 17 on macOS",
  "Safari Mobile on iOS 17",
  "Chrome Mobile on Android 14",
  "Edge 124 on Windows 11",
  "Firefox 125 on Linux",
];

export function mockCountryFor(userId: string): string {
  return MOCK_COUNTRIES[hashSeed(`${userId}:country`) % MOCK_COUNTRIES.length];
}

export function mockSourceFor(userId: string): string {
  return MOCK_SOURCES[hashSeed(`${userId}:source`) % MOCK_SOURCES.length];
}

export function mockDeviceFor(userId: string): string {
  return MOCK_DEVICES[hashSeed(`${userId}:device`) % MOCK_DEVICES.length];
}

/**
 * Mock fallback when the upstream user has no `mtAccounts` rows.
 * Uniformly 1..20 — wide enough to demonstrate the column doesn't
 * cap at 1/2/3, narrow enough to stay realistic (>20 accounts is rare).
 */
export function mockAccountCountFor(userId: string): number {
  return 1 + (hashSeed(`${userId}:accountCount`) % 20);
}

export function mapUserToClient(u: UserWithRelations): BackofficeUser {
  const status = STATUS_MAP[u.status] ?? "pending";
  const kycStatus = KYC_MAP[u.kycStatus ?? "not_started"] ?? "not_submitted";

  const usdWallet = u.wallets.find((w) => w.currency === "USD");
  const balance = usdWallet?.balance ?? u.wallets[0]?.balance ?? 0;
  const equity = u.mtAccounts.reduce((sum, a) => sum + (a.equity ?? a.balance ?? 0), 0) || balance;

  const risk = deriveRisk(u.kycRecord?.amlRiskScore);
  const hasFtd = u.mtAccounts.some((a) => (a.balance ?? 0) > 0);
  const lifecycleStage = deriveLifecycle({
    kycStatus,
    status,
    hasFtd,
    lastLoginAt: u.lastLoginAt,
  });

  // Narrow access to the v3 fields without a hard `as Prisma.User` cast.
  // After `prisma db push` + `prisma generate` these are fully typed; the
  // shim keeps the mapper compilable when run against an older client.
  const v3 = u as unknown as {
    country?: string | null;
    registrationSource?: string | null;
    registrationDevice?: string | null;
    role?: string | null;
  };
  const role = (v3.role ?? "client") as ClientRole;

  // v3b — derived KPIs (mock until backend hooks land).
  //  - commissionEarned: only meaningful for partners/affiliates; deterministic
  //    pseudo-amount seeded by id so VIP / large IBs naturally show bigger numbers.
  //  - negBalanceProtected: ~5% of users have any history of negative-balance
  //    bailouts, scaled by current balance.
  let commissionSeed = 2166136261 >>> 0;
  for (let i = 0; i < u.id.length; i++) {
    commissionSeed = (commissionSeed ^ u.id.charCodeAt(i)) >>> 0;
    commissionSeed = Math.imul(commissionSeed, 16777619) >>> 0;
  }
  const commissionEarned = role === "partner"
    ? Math.round((commissionSeed % 50000) + 1000)
    : role === "affiliate"
      ? Math.round((commissionSeed % 8000) + 100)
      : 0;
  const negBalanceProtected =
    (commissionSeed >>> 8) % 100 < 5
      ? Math.round(((commissionSeed >>> 16) % 2000) + 50)
      : 0;

  // Mock fallback for missing-from-DB fields. Same `user.id` always
  // returns the same value, so screenshots/tests stay stable.
  const country  = v3.country            ?? mockCountryFor(u.id);
  const regSrc   = v3.registrationSource ?? mockSourceFor(u.id);
  const regDev   = v3.registrationDevice ?? mockDeviceFor(u.id);
  const realAccts = u.mtAccounts.length;
  const accountCount = realAccts > 0 ? realAccts : mockAccountCountFor(u.id);

  return {
    id: u.id,
    uid: buildUid(u.id),
    name: u.name ?? u.email.split("@")[0],
    email: u.email,
    phone: u.phone ?? "-",
    country,
    registrationSource: regSrc,
    registrationDevice: regDev,
    accountCount,
    role,
    commissionEarned,
    negBalanceProtected,
    status,
    kycStatus,
    level: deriveLevel(balance, u.kycRecord?.kycLevel),
    balance,
    equity,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt?.toISOString() ?? u.createdAt.toISOString(),
    tags: deriveTagsForMock(u.id),
    riskLevel: risk.level,
    riskScore: risk.score,
    lifecycleStage,
    ftdDate: hasFtd ? u.createdAt.toISOString() : undefined,
    totalDeposit: 0,
    totalWithdrawal: 0,
    netDeposit: 0,
    tradingVolume: 0,
  };
}

const REVERSE_STATUS: Record<UserStatus, string> = {
  active: "active",
  frozen: "suspended",
  pending: "pending_verification",
  closed: "closed",
};

const REVERSE_KYC: Record<KYCStatus, string[]> = {
  not_submitted: ["not_started", "not_submitted"],
  pending: ["pending", "in_review"],
  verified: ["approved", "verified"],
  rejected: ["rejected"],
};

interface WhereInput {
  search?: string;
  status?: string;
  kycStatus?: string;
  startDate?: string;
  endDate?: string;
  /** v3 — multi-select filter on User.country (ISO-3166 alpha-2, uppercase). */
  country?: string[];
  /** v3 — direct filter on User.role (client/partner/affiliate). */
  role?: string;
  /** v3 — inclusive lower bound on MT account count. */
  minAccountCount?: number;
  /** v3 — inclusive upper bound on MT account count. */
  maxAccountCount?: number;
}

export function buildUserWhere(input: WhereInput): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (input.search) {
    const q = input.search;
    // SQLite has no `mode: "insensitive"` — `contains` is already case-insensitive for ASCII
    // when the column has no COLLATE BINARY. Keep it simple and portable.
    where.OR = [
      { email: { contains: q } },
      { name: { contains: q } },
      { phone: { contains: q } },
      { id: { contains: q.toLowerCase().replace(/^usr/, "") } },
    ];
  }

  if (input.status && input.status in REVERSE_STATUS) {
    where.status = REVERSE_STATUS[input.status as UserStatus];
  }

  if (input.kycStatus && input.kycStatus in REVERSE_KYC) {
    where.kycStatus = { in: REVERSE_KYC[input.kycStatus as KYCStatus] };
  }

  if (input.startDate || input.endDate) {
    where.createdAt = {};
    if (input.startDate) (where.createdAt as Prisma.DateTimeFilter).gte = new Date(input.startDate);
    if (input.endDate) (where.createdAt as Prisma.DateTimeFilter).lte = new Date(input.endDate);
  }

  // v3 — country / role / account count
  // These keys land on Prisma.User after the v3 schema push. Cast through
  // `unknown` so this file still compiles before the client is regenerated.
  const ext = where as Prisma.UserWhereInput & {
    country?: string | { in: string[] };
    role?: string;
    mtAccounts?: unknown;
  };
  if (input.country && input.country.length > 0) {
    // Multi-select — Prisma `in` clause. Single-element arrays work fine here.
    ext.country = { in: input.country.map((c) => c.toUpperCase()) };
  }
  if (input.role) {
    ext.role = input.role;
  }
  if (input.minAccountCount != null || input.maxAccountCount != null) {
    // Filter via Prisma `mtAccounts.some/none` semantics — implemented by
    // using the relation count helper added in Prisma 5: `mtAccounts._count`.
    // To stay compatible, we instead push the constraint into a where on the
    // raw relation: use `some/none` heuristics for boundary cases.
    // For exact range, the call site post-filters; here we narrow:
    if (input.minAccountCount && input.minAccountCount > 0) {
      ext.mtAccounts = { some: {} };
    }
    if (input.maxAccountCount === 0) {
      ext.mtAccounts = { none: {} };
    }
  }

  return where;
}

export function statusToPrisma(s: UserStatus): string {
  return REVERSE_STATUS[s];
}
