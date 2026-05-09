import type { Prisma } from "@prisma/client";
import type {
  BackofficeUser,
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

  return {
    id: u.id,
    uid: buildUid(u.id),
    name: u.name ?? u.email.split("@")[0],
    email: u.email,
    phone: u.phone ?? "-",
    status,
    kycStatus,
    level: deriveLevel(balance, u.kycRecord?.kycLevel),
    balance,
    equity,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt?.toISOString() ?? u.createdAt.toISOString(),
    tags: [],
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

  return where;
}

export function statusToPrisma(s: UserStatus): string {
  return REVERSE_STATUS[s];
}
