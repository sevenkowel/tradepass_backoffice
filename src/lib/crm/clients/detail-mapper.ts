/**
 * Aggregator that turns Prisma rows into the `ClientDetailData` shape that
 * the /crm/clients/[id] tabs expect.
 *
 * Some fields are still derived heuristically (riskFactors,
 * lifecycleStages, riskRelationships) — see TODO markers.
 */
import type { Prisma } from "@prisma/client";
import type {
  AuditLog,
  CaseItem,
  ClientAgreement,
  ClientDetailData,
  ClientDevice,
  ClientNote,
  ClientPermission,
  FundRecord,
  KYCDocument,
  KYCRiskIndicator,
  LifecycleStageInfo,
  RiskFactor,
  RiskRelationship,
  Ticket,
  TimelineEvent,
  TradeRecord,
  TradingAccount,
  TradingStats,
  UserValueMetrics,
} from "@/types/backoffice/client-detail";
import { mapUserToClient } from "./mapper";

type FullUser = Prisma.UserGetPayload<{
  include: {
    wallets: true;
    mtAccounts: { include: { orders: true; positions: true } };
    kycRecord: { include: { reviewLogs: true } };
    transactions: true;
  };
}>;

interface AggregateInput {
  user: FullUser;
  notes: Prisma.ClientNoteGetPayload<true>[];
  devices: Prisma.ClientDeviceGetPayload<true>[];
  agreements: Prisma.ClientAgreementGetPayload<true>[];
  cases: Prisma.CrmCaseGetPayload<true>[];
  tickets: Prisma.CrmTicketGetPayload<true>[];
  timeline: Prisma.CrmTimelineEventGetPayload<true>[];
  auditLogs: Prisma.CrmAuditLogGetPayload<true>[];
  tagNames: string[];
  riskEvents: Prisma.RiskEventGetPayload<true>[];
}

const FUND_TYPE: Record<string, FundRecord["type"] | undefined> = {
  deposit: "deposit",
  withdrawal: "withdrawal",
};

const FUND_STATUS_MAP: Record<string, FundRecord["status"]> = {
  pending: "pending",
  processing: "manual_review",
  completed: "completed",
  failed: "rejected",
  cancelled: "rejected",
};

const FUND_METHOD_MAP: Record<string, FundRecord["method"]> = {
  bank_transfer: "bank_transfer",
  usdt_trc20: "crypto",
  usdt_erc20: "crypto",
  crypto: "crypto",
  stripe: "credit_card",
  credit_card: "credit_card",
  e_wallet: "e_wallet",
  wire_transfer: "wire_transfer",
};

function mapTradingAccount(a: FullUser["mtAccounts"][number]): TradingAccount {
  const marginLevel =
    a.margin > 0 ? `${((a.equity / a.margin) * 100).toFixed(2)}%` : "—";
  const accountType: TradingAccount["accountType"] =
    a.group?.toUpperCase().includes("VIP") ? "VIP"
    : a.group?.toUpperCase().includes("ECN") ? "ECN"
    : a.group?.toUpperCase().includes("PRO") ? "PRO"
    : "Standard";
  const status: TradingAccount["status"] =
    a.status === "active" ? "active" : a.status === "restricted" ? "restricted" : "disabled";
  return {
    id: a.id,
    mtAccount: a.mtLogin,
    accountType,
    leverage: `1:${a.leverage}`,
    status,
    balance: a.balance,
    equity: a.equity,
    margin: a.margin,
    marginLevel,
    group: a.group,
    createdAt: a.createdAt.toISOString(),
  };
}

function mapFunds(user: FullUser): FundRecord[] {
  return user.transactions
    .filter((t) => FUND_TYPE[t.type])
    .map((t) => ({
      id: t.id,
      clientId: user.id,
      type: FUND_TYPE[t.type]!,
      amount: t.amount,
      method: FUND_METHOD_MAP[t.method ?? "bank_transfer"] ?? "bank_transfer",
      status: FUND_STATUS_MAP[t.status] ?? "pending",
      createdAt: t.createdAt.toISOString(),
      reviewedBy: undefined,
      reviewedAt: t.processedAt?.toISOString(),
      riskFlags: [],
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function mapTrades(user: FullUser): TradeRecord[] {
  return user.mtAccounts.flatMap((acc) =>
    acc.orders.map((o) => ({
      id: o.id,
      clientId: user.id,
      symbol: o.symbol,
      type: (o.type === "buy" ? "buy" : "sell") as TradeRecord["type"],
      volume: o.volume,
      openPrice: o.openPrice,
      closePrice: o.closePrice ?? undefined,
      profit: o.profit ?? undefined,
      openTime: o.openTime.toISOString(),
      closeTime: o.closeTime?.toISOString(),
      isEATrading: false,
    }))
  );
}

function computeTradingStats(trades: TradeRecord[]): TradingStats {
  const totalLots = trades.reduce((sum, t) => sum + t.volume, 0);
  const closed = trades.filter((t) => t.closePrice != null && t.profit != null);
  const wins = closed.filter((t) => (t.profit ?? 0) > 0).length;
  const winRate = closed.length === 0 ? 0 : Math.round((wins / closed.length) * 100);
  return {
    totalLots: Number(totalLots.toFixed(2)),
    winRate,
    isEATrading: false,
    isHighFrequency: trades.length > 100,
    riskBehaviors: [],
  };
}

function mapKYCDocuments(user: FullUser): KYCDocument[] {
  const r = user.kycRecord;
  if (!r) return [];
  const personalInfo = r.personalInfo ? safeJSON<Record<string, string>>(r.personalInfo) : {};
  return [
    {
      id: r.id,
      clientId: user.id,
      type: ((r.documentType as KYCDocument["type"]) || "id_card"),
      documentNumber: personalInfo?.documentNumber ?? "—",
      fullName: personalInfo?.fullName ?? user.name ?? "—",
      nationality: personalInfo?.nationality ?? r.regionCode ?? "—",
      dateOfBirth: personalInfo?.dateOfBirth ?? "—",
      expiryDate: personalInfo?.expiryDate ?? "—",
      status:
        r.status === "approved" || r.status === "verified" ? "verified"
        : r.status === "pending" || r.status === "in_review" ? "pending"
        : r.status === "rejected" ? "rejected"
        : "not_submitted",
      imageUrl: r.documentFrontUrl ?? "",
      submittedAt: r.submittedAt?.toISOString() ?? r.createdAt.toISOString(),
      reviewedAt: r.reviewedAt?.toISOString(),
      reviewedBy: r.reviewedBy ?? undefined,
      rejectionReason: r.rejectionReason ?? undefined,
    },
  ];
}

function deriveKYCRiskIndicators(user: FullUser): KYCRiskIndicator[] {
  const r = user.kycRecord;
  if (!r) return [];
  const out: KYCRiskIndicator[] = [];
  if (r.amlPassed === false) {
    out.push({
      type: "blacklist_match",
      level: (r.amlRiskScore ?? 0) >= 60 ? "high" : "medium",
      description: `AML check flagged (score ${r.amlRiskScore ?? "?"})`,
    });
  }
  if (r.ocrConfidence != null && r.ocrConfidence < 0.7) {
    out.push({
      type: "ocr_mismatch",
      level: r.ocrConfidence < 0.4 ? "high" : "medium",
      description: `OCR confidence ${(r.ocrConfidence * 100).toFixed(0)}%`,
    });
  }
  return out;
}

function mapDevices(devices: AggregateInput["devices"]): ClientDevice[] {
  return devices.map((d) => ({
    id: d.id,
    clientId: d.userId,
    ipAddress: d.ipAddress,
    country: d.country ?? "—",
    city: d.city ?? undefined,
    deviceId: d.deviceId,
    browser: d.browser ?? "—",
    os: d.os ?? "—",
    timezone: d.timezone ?? "UTC",
    lastUsedAt: d.lastUsedAt.toISOString(),
    isRisky: d.isRisky,
    isCurrent: d.isCurrent,
  }));
}

function mapCases(cases: AggregateInput["cases"]): CaseItem[] {
  return cases.map((c) => ({
    id: c.id,
    caseId: c.caseId,
    clientId: c.userId,
    type: c.type as CaseItem["type"],
    status: c.status as CaseItem["status"],
    priority: c.priority as CaseItem["priority"],
    sla: c.sla ?? "—",
    reviewer: c.reviewerId ?? undefined,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    comments: safeJSON<CaseItem["comments"]>(c.comments) ?? [],
  }));
}

function mapTickets(tickets: AggregateInput["tickets"]): Ticket[] {
  return tickets.map((t) => ({
    id: t.id,
    ticketId: t.ticketId,
    clientId: t.userId,
    type: t.type as Ticket["type"],
    status: t.status as Ticket["status"],
    priority: t.priority as Ticket["priority"],
    subject: t.subject,
    assignedTo: t.assignedToId ?? undefined,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    messages: safeJSON<Ticket["messages"]>(t.messages) ?? [],
  }));
}

function mapNotes(notes: AggregateInput["notes"]): ClientNote[] {
  return notes.map((n) => ({
    id: n.id,
    clientId: n.userId,
    content: n.content,
    author: n.authorId,
    authorName: n.authorName,
    mentions: safeJSON<string[]>(n.mentions) ?? [],
    isPinned: n.isPinned,
    noteType: n.noteType as ClientNote["noteType"],
    createdAt: n.createdAt.toISOString(),
  }));
}

function mapAgreements(rows: AggregateInput["agreements"]): ClientAgreement[] {
  return rows.map((a) => ({
    id: a.id,
    clientId: a.userId,
    agreementType: a.agreementType,
    version: a.version,
    signedAt: a.signedAt.toISOString(),
    signedIp: a.signedIp,
    pdfUrl: a.pdfUrl ?? "",
    status: a.status as ClientAgreement["status"],
  }));
}

function mapTimeline(rows: AggregateInput["timeline"]): TimelineEvent[] {
  return rows.map((e) => ({
    id: e.id,
    clientId: e.userId,
    type: e.type as TimelineEvent["type"],
    title: e.title,
    description: e.description ?? "",
    metadata: e.metadata ? safeJSON<Record<string, unknown>>(e.metadata) ?? undefined : undefined,
    operator: e.operatorId ?? undefined,
    timestamp: e.createdAt.toISOString(),
  }));
}

function mapAuditLogs(rows: AggregateInput["auditLogs"]): AuditLog[] {
  return rows.map((l) => ({
    id: l.id,
    clientId: l.userId,
    operator: l.operatorName,
    action: l.action,
    targetField: l.targetField ?? "",
    oldValue: l.oldValue ?? undefined,
    newValue: l.newValue ?? undefined,
    timestamp: l.createdAt.toISOString(),
    ipAddress: l.ipAddress ?? "—",
  }));
}

function deriveRiskFactors(user: FullUser, riskEvents: AggregateInput["riskEvents"]): RiskFactor[] {
  const aml = user.kycRecord?.amlRiskScore ?? 0;
  const events = riskEvents.length;
  const factors: RiskFactor[] = [
    {
      name: "AML score",
      score: Math.round(aml),
      maxScore: 100,
      level: aml >= 60 ? "high" : aml >= 30 ? "medium" : "low",
      description: "Anti-money-laundering screening score",
    },
    {
      name: "Risk events (90d)",
      score: Math.min(events, 20),
      maxScore: 20,
      level: events >= 10 ? "high" : events >= 3 ? "medium" : "low",
      description: `${events} risk events in the past 90 days`,
    },
  ];
  return factors;
}

function deriveLifecycleStages(user: FullUser): LifecycleStageInfo[] {
  const reg = user.createdAt.toISOString();
  const verifiedAt = user.kycRecord?.reviewedAt?.toISOString();
  const ftdAt = user.transactions
    .filter((t) => t.type === "deposit" && t.status === "completed")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0]
    ?.createdAt.toISOString();
  const lastTradeAt = user.mtAccounts
    .flatMap((a) => a.orders.map((o) => o.openTime))
    .sort((a, b) => b.getTime() - a.getTime())[0]
    ?.toISOString();

  const stages: LifecycleStageInfo[] = [
    { stage: "registered", label: "Registered", reachedAt: reg, isCurrent: false },
    { stage: "verified", label: "Verified", reachedAt: verifiedAt, isCurrent: false },
    { stage: "ftd", label: "First deposit", reachedAt: ftdAt, isCurrent: false },
    { stage: "active_trader", label: "Active trader", reachedAt: lastTradeAt, isCurrent: false },
    { stage: "inactive", label: "Inactive", isCurrent: false },
    { stage: "churn", label: "Churned", isCurrent: false },
  ];
  // Mark the latest reached stage as current.
  let currentIdx = -1;
  for (let i = stages.length - 1; i >= 0; i--) {
    if (stages[i].reachedAt) {
      currentIdx = i;
      break;
    }
  }
  if (currentIdx >= 0) stages[currentIdx].isCurrent = true;
  return stages;
}

function computeValueMetrics(user: FullUser): UserValueMetrics {
  const deposits = user.transactions
    .filter((t) => t.type === "deposit" && t.status === "completed")
    .reduce((s, t) => s + t.amount, 0);
  const withdrawals = user.transactions
    .filter((t) => t.type === "withdrawal" && t.status === "completed")
    .reduce((s, t) => s + t.amount, 0);
  const balance = user.wallets.reduce((s, w) => s + w.balance, 0);
  const equity = user.mtAccounts.reduce((s, a) => s + (a.equity ?? a.balance), 0) || balance;
  const totalLots = user.mtAccounts
    .flatMap((a) => a.orders)
    .reduce((s, o) => s + o.volume, 0);
  const openPositions = user.mtAccounts.flatMap((a) => a.positions).length;
  const totalProfit = user.mtAccounts
    .flatMap((a) => a.orders)
    .reduce((s, o) => s + (o.profit ?? 0), 0);
  const netDeposit = deposits - withdrawals;
  const totalProfitPercent = netDeposit > 0 ? Number(((totalProfit / netDeposit) * 100).toFixed(2)) : 0;
  return {
    netDeposit,
    currentBalance: balance,
    equity,
    totalLots: Number(totalLots.toFixed(2)),
    openPositions,
    totalProfit: Number(totalProfit.toFixed(2)),
    totalProfitPercent,
  };
}

function defaultPermissions(user: FullUser): ClientPermission[] {
  return [
    { key: "trading_enabled", label: "Trading enabled", value: user.status === "active", type: "toggle", category: "Trading" },
    { key: "withdrawal_enabled", label: "Withdrawal enabled", value: user.status === "active", type: "toggle", category: "Funds" },
    { key: "max_leverage", label: "Max leverage", value: user.mtAccounts[0]?.leverage ?? 100, type: "number", category: "Trading" },
    { key: "kyc_level", label: "KYC level", value: user.kycRecord?.kycLevel ?? "basic", type: "select", category: "Compliance",
      options: [
        { label: "Basic", value: "basic" },
        { label: "Advanced", value: "advanced" },
        { label: "Enterprise", value: "enterprise" },
      ] },
  ];
}

// TODO(Phase D): real graph derived from shared IPs/devices/banks.
function deriveRiskRelationships(_user: FullUser): RiskRelationship[] {
  return [];
}

function safeJSON<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function aggregateClientDetail(input: AggregateInput): ClientDetailData {
  const user = mapUserToClient({
    ...input.user,
    wallets: input.user.wallets.map((w) => ({ balance: w.balance, frozen: w.frozen, currency: w.currency })),
    mtAccounts: input.user.mtAccounts.map((a) => ({ balance: a.balance, equity: a.equity })),
    kycRecord: input.user.kycRecord
      ? {
          amlRiskScore: input.user.kycRecord.amlRiskScore,
          kycLevel: input.user.kycRecord.kycLevel,
          status: input.user.kycRecord.status,
        }
      : null,
  });
  user.tags = input.tagNames;

  const accounts = input.user.mtAccounts.map(mapTradingAccount);
  const funds = mapFunds(input.user);
  const trades = mapTrades(input.user);
  const tradingStats = computeTradingStats(trades);
  const kycDocuments = mapKYCDocuments(input.user);
  const kycRiskIndicators = deriveKYCRiskIndicators(input.user);
  const devices = mapDevices(input.devices);
  const cases = mapCases(input.cases);
  const tickets = mapTickets(input.tickets);
  const permissions = defaultPermissions(input.user);
  const agreements = mapAgreements(input.agreements);
  const timeline = mapTimeline(input.timeline)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const notes = mapNotes(input.notes)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const auditLogs = mapAuditLogs(input.auditLogs)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const riskRelationships = deriveRiskRelationships(input.user);
  const riskFactors = deriveRiskFactors(input.user, input.riskEvents);
  const lifecycleStages = deriveLifecycleStages(input.user);
  const valueMetrics = computeValueMetrics(input.user);

  return {
    user,
    accounts,
    funds,
    trades,
    tradingStats,
    kycDocuments,
    kycRiskIndicators,
    devices,
    cases,
    tickets,
    permissions,
    agreements,
    timeline,
    notes,
    auditLogs,
    riskRelationships,
    riskFactors,
    lifecycleStages,
    valueMetrics,
  };
}

export const detailIncludeShape = {
  wallets: true,
  mtAccounts: { include: { orders: true, positions: true } },
  kycRecord: { include: { reviewLogs: true } },
  transactions: true,
} as const;
