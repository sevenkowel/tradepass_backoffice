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
import {
  mockFunds, mockTrades, mockDevices, mockWallets, mockApplications,
  mockMilestones, mockAgreements, mockRiskRelationships, deriveTradingStatsMock,
  mockTickets, mockTimelineEvents, mockAuditLogs,
  mockTradingAccountFull,
} from "./mock-detail-data";

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

function mapTradingAccount(
  a: FullUser["mtAccounts"][number],
  userId: string,
  index: number,
  userCreatedAt: Date | string,
): TradingAccount {
  /* The mock proxy ships only `{ balance, equity }` per account, so we
   * start from a full mock and let any real Prisma field override.
   * This keeps the type's 19 fields populated for every account, while
   * preserving real data when present. */
  const createdAtBase = userCreatedAt instanceof Date
    ? userCreatedAt
    : new Date(userCreatedAt);
  const baseBalance = a.balance ?? 0;
  const mock = mockTradingAccountFull(userId, index, baseBalance, createdAtBase);

  // Apply real-data overrides only when set.
  const realBalance = a.balance;
  const realEquity  = a.equity;
  const realMargin  = a.margin;
  const realStatus = a.status === "active" || a.status === "restricted" || a.status === "disabled"
    ? a.status as TradingAccount["status"]
    : mock.status;
  const realCreatedAt = a.createdAt
    ? (a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt))
    : mock.createdAt;
  const realLeverage = a.leverage ? `1:${a.leverage}` : mock.leverage;
  const realGroup = a.group ?? mock.group;
  const accountType: TradingAccount["accountType"] =
    realGroup?.toUpperCase().includes("VIP") ? "VIP"
    : realGroup?.toUpperCase().includes("ECN") ? "ECN"
    : realGroup?.toUpperCase().includes("PRO") ? "PRO"
    : mock.accountType;

  const balance = realBalance ?? mock.balance;
  const equity  = realEquity  ?? mock.equity;
  const margin  = realMargin  ?? mock.margin;
  const marginLevel = margin > 0
    ? `${((equity / margin) * 100).toFixed(2)}%`
    : "—";
  const freeMargin = Math.max(0, equity - margin);

  return {
    ...mock,
    id: a.id ?? mock.id,
    mtAccount: a.mtLogin ?? mock.mtAccount,
    accountType,
    leverage: realLeverage,
    status: realStatus,
    balance,
    equity,
    margin,
    freeMargin,
    marginLevel,
    group: realGroup,
    createdAt: realCreatedAt,
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
  return user.mtAccounts.flatMap((acc) => {
    /* v1.0 mock-proxy hardening — `orders` is missing on the slim
     * mtAccount shape returned by the proxy. */
    const orders = (acc as { orders?: FullUser["mtAccounts"][number]["orders"] }).orders ?? [];
    // Pull the MT login as a string. The Prisma column is numeric so we
    // String() it so the trade table can render it directly.
    const mtLogin = String(
      (acc as { mtLogin?: number | string }).mtLogin ?? acc.id,
    );
    return orders.map((o) => ({
      id: o.id,
      clientId: user.id,
      accountId: acc.id,
      mtAccount: mtLogin,
      symbol: o.symbol,
      type: (o.type === "buy" ? "buy" : "sell") as TradeRecord["type"],
      volume: o.volume,
      openPrice: o.openPrice,
      closePrice: o.closePrice ?? undefined,
      profit: o.profit ?? undefined,
      openTime: o.openTime instanceof Date ? o.openTime.toISOString() : String(o.openTime ?? new Date().toISOString()),
      closeTime: o.closeTime instanceof Date ? o.closeTime.toISOString() : (o.closeTime ? String(o.closeTime) : undefined),
      isEATrading: false,
    }));
  });
}

function computeTradingStats(userId: string, trades: TradeRecord[]): TradingStats {
  const totalLots = trades.reduce((sum, t) => sum + t.volume, 0);
  const closed = trades.filter((t) => t.closePrice != null && t.profit != null);
  const wins = closed.filter((t) => (t.profit ?? 0) > 0).length;
  const winRate = closed.length === 0 ? 0 : Math.round((wins / closed.length) * 100);
  // EA / 高频 / detected behaviors 走 mock 派生（基于 userId + trades 行为）
  const { isEATrading, isHighFrequency, behaviors } = deriveTradingStatsMock(userId, trades);
  return {
    totalLots: Number(totalLots.toFixed(2)),
    winRate,
    isEATrading,
    isHighFrequency,
    riskBehaviors: behaviors,
  };
}

function mapKYCDocuments(user: FullUser): KYCDocument[] {
  const r = user.kycRecord;
  if (!r) return [];

  /* The v1 mock proxy ships a partial KYCRecord shape ({ amlRiskScore,
   * kycLevel, status }) with no `id` / `documentType` / dates. Render-time
   * code keys docs by `id`, so synthesize a stable id derived from the
   * owning user when the upstream value is missing. Every Date read is
   * also wrapped so a `string` or `null` from the mock doesn't crash
   * `.toISOString()`. */
  const id = r.id || `kyc-${user.id}`;
  const personalInfo = r.personalInfo ? safeJSON<Record<string, string>>(r.personalInfo) : {};

  const iso = (d: Date | string | null | undefined): string | undefined => {
    if (!d) return undefined;
    if (d instanceof Date) return d.toISOString();
    return String(d);
  };
  const userCreatedIso = iso(user.createdAt) ?? new Date().toISOString();

  return [
    {
      id,
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
      submittedAt: iso(r.submittedAt) ?? iso(r.createdAt) ?? userCreatedIso,
      reviewedAt: iso(r.reviewedAt),
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
  return rows.map((a) => {
    // 兼容老数据（缺 name / language / signatureType / forceResign）
    const ext = a as typeof a & {
      name?: string;
      language?: string;
      signatureType?: "handwritten" | "text";
      forceResign?: boolean;
    };
    return {
      id: a.id,
      clientId: a.userId,
      agreementType: a.agreementType,
      name: ext.name ?? agreementTypeToName(a.agreementType),
      version: a.version,
      signedAt: a.signedAt.toISOString(),
      signedIp: a.signedIp,
      language: ext.language ?? "English",
      signatureType: ext.signatureType ?? "text",
      pdfUrl: a.pdfUrl ?? undefined,
      forceResign: ext.forceResign ?? false,
      status: a.status as ClientAgreement["status"],
    };
  });
}

function agreementTypeToName(t: string): string {
  switch (t) {
    case "client_agreement":    return "Client Agreement";
    case "risk_disclosure":     return "Risk Disclosure";
    case "privacy_policy":      return "Privacy Policy";
    case "terms_of_service":    return "Terms of Service";
    case "margin_trading":      return "Margin Trading Agreement";
    case "aml_declaration":     return "AML Declaration";
    case "fatca_declaration":   return "FATCA Declaration";
    default: return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
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
  /* v1.0 mock-proxy hardening — `orders` and `positions` are missing
   * on the slim mtAccount shape, so guard the flat-map sources. */
  const totalLots = user.mtAccounts
    .flatMap((a) => (a as { orders?: { volume: number }[] }).orders ?? [])
    .reduce((s, o) => s + o.volume, 0);
  const openPositions = user.mtAccounts
    .flatMap((a) => (a as { positions?: unknown[] }).positions ?? []).length;
  const totalProfit = user.mtAccounts
    .flatMap((a) => (a as { orders?: { profit?: number }[] }).orders ?? [])
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
  /* v1.0 mock-proxy hardening — the slim user object returned by the
   * in-memory mock omits a bunch of fields the mapper iterates over.
   * Backfill missing collections and missing Date fields so the rest
   * of the mapper can stay terse. When real Prisma is back, these
   * defaults stay no-ops because the rich include shape populates
   * everything. */
  const u = input.user as Record<string, unknown> & typeof input.user;
  const fallbackDate = (u.createdAt instanceof Date ? u.createdAt : new Date()) as Date;
  u.transactions ??= [] as never;
  u.orders       ??= [] as never;
  u.positions    ??= [] as never;
  u.kycLogs      ??= [] as never;
  u.agreements   ??= [] as never;
  u.devices      ??= [] as never;
  u.riskEvents   ??= [] as never;
  u.mtAccounts   ??= [] as never;
  u.wallets      ??= [] as never;

  // Deep-normalise nested Date fields the mapper later .toISOString()s.
  if (u.kycRecord) {
    const k = u.kycRecord as Record<string, unknown>;
    k.createdAt   ??= fallbackDate;
    k.updatedAt   ??= fallbackDate;
    k.submittedAt ??= fallbackDate;
  }
  for (const acc of (u.mtAccounts as Record<string, unknown>[])) {
    acc.createdAt ??= fallbackDate;
    acc.orders    ??= [];
    acc.positions ??= [];
  }

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

  const accounts = input.user.mtAccounts.map((a, i) =>
    mapTradingAccount(a, input.user.id, i, input.user.createdAt));

  // Real data first; if a table is empty for this user we fall back to
  // deterministic mocks so the detail page is never visually empty.
  // Removing the fallback is a one-line change when the real data lands.
  const realFunds = mapFunds(input.user);
  const funds = realFunds.length > 0
    ? realFunds
    : mockFunds(input.user.id, user.level, input.user.createdAt);

  const realTrades = mapTrades(input.user);
  const trades = realTrades.length > 0
    ? realTrades
    : mockTrades(input.user.id, user.level, accounts, input.user.createdAt);

  const tradingStats = computeTradingStats(input.user.id, trades);

  // CRM 平台钱包（v1 仅 USD）— 派生自 funds + 账户 balance；
  // mockWallets 已经处理了空数据兜底，永远返回 1 张钱包。
  const wallets = mockWallets(input.user.id, funds, accounts);

  const kycDocuments = mapKYCDocuments(input.user);
  const kycRiskIndicators = deriveKYCRiskIndicators(input.user);

  const realDevices = mapDevices(input.devices);
  const devices = realDevices.length > 0
    ? realDevices
    : mockDevices(input.user.id, user.country, user.level, input.user.createdAt);

  // "申请" 模块 — 客户发起的所有申请记录（合规/资金/账户/业务/营销/服务）。
  // 真实 DB 优先，为空时回落到 mockApplications（产生 ~6-15 条混合状态的
  // 历史数据，便于在演示 / 截图时看到完整的"未处理 / 已处理"视图）。
  const realCases = mapCases(input.cases);
  const cases = realCases.length > 0
    ? realCases
    : mockApplications(input.user.id, user.name, user.level, input.user.createdAt);

  const realTickets = mapTickets(input.tickets);
  const tickets = realTickets.length > 0
    ? realTickets
    : mockTickets(input.user.id, user.name, user.level, input.user.createdAt);

  const permissions = defaultPermissions(input.user);

  // Agreements — 真实表为空时回落到 mock（与 CLM 字段一致）
  const realAgreements = mapAgreements(input.agreements);
  const agreements = realAgreements.length > 0
    ? realAgreements
    : mockAgreements(input.user.id, input.user.createdAt, user.country, user.kycStatus);

  const realTimeline = mapTimeline(input.timeline);
  const timeline = (realTimeline.length > 0
    ? realTimeline
    : mockTimelineEvents(input.user.id, user.level, input.user.createdAt, user.kycStatus))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const notes = mapNotes(input.notes)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const realAuditLogs = mapAuditLogs(input.auditLogs);
  const auditLogs = (realAuditLogs.length > 0
    ? realAuditLogs
    : mockAuditLogs(input.user.id, user.level, input.user.createdAt))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Risk relationships — 真实派生（目前永远空）+ mock 兜底
  const derivedRelationships = deriveRiskRelationships(input.user);
  const riskRelationships = derivedRelationships.length > 0
    ? derivedRelationships
    : mockRiskRelationships(input.user.id, user.level);
  const riskFactors = deriveRiskFactors(input.user, input.riskEvents);
  const lifecycleStages = deriveLifecycleStages(input.user);
  const valueMetrics = computeValueMetrics(input.user);

  // 客户里程碑 — 派生自 level + 注册时间 + 状态，可作为审计 Tab 的「客户旅程」呈现
  const milestones = mockMilestones(
    input.user.id,
    user.level,
    input.user.createdAt,
    user.status,
  );

  return {
    user,
    accounts,
    wallets,
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
    milestones,
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
