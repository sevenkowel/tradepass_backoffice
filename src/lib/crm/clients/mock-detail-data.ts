/**
 * Mock generators for the per-client Detail page tabs (Funds / Trading /
 * Devices / Tickets / Timeline / Audit Logs).
 *
 * Used by `detail-mapper.ts` as a **fallback** when the corresponding DB
 * table is empty for the client being viewed — gives the operator a
 * meaningful view to interact with for every user, not just the 2 demo
 * users we seeded.
 *
 * Design rules:
 *   - All output is **deterministic** from `(userId, kind)` — same client,
 *     same screenshot, every reload. Stable demos.
 *   - Quantities scale by `level` so VIP / Enterprise look richer than a
 *     freshly-registered standard client.
 *   - Date ranges respect `registeredAt..now` — no records before the
 *     user existed.
 *   - Field distributions roughly mirror real forex-broker data:
 *       Fund status  → 80% completed, 10% pending, …
 *       Trade symbols→ EURUSD (25%) > GBPUSD > USDJPY > XAUUSD > BTCUSD …
 *       Ticket types → financial/withdrawal heavy
 *
 * Swap with the real service later by removing the fallback branch in
 * `detail-mapper.ts` — these generators stay around for tests / storybook.
 */
import type {
  AuditLog, CaseItem, CaseStatus, CaseType,
  ClientAgreement, ClientDevice, ClientMilestone, ClientWallet, FundRecord,
  RiskBehavior, RiskRelationship, Ticket, TicketMessage,
  TimelineEvent, TradeRecord, TradingAccount,
  AccountFlowEntry, AccountFlowKind,
  OpenPosition, PendingOrder, PendingOrderKind,
  AccountStatusBadge, AccountFlag,
  RiskMetrics, RiskAlert,
  FinancialMetrics, TradingPerformance, BehavioralSignals,
  AccountControls, AccountControlLog, ControlToggle, ControlValue,
  AccountActivityEntry,
  AccountPermissions, AccountSecurity,
} from "@/types/backoffice/client-detail";
import type { UserLevel } from "@/types/backoffice/user";

/* --------------------------------------------------------------------- */
/* PRNG — mulberry32, seeded by FNV-1a hash of `${userId}:${kind}`.      */
/* --------------------------------------------------------------------- */

function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = (h ^ str.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function mulberry32(seed: number): () => number {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rngFor(userId: string, kind: string): () => number {
  return mulberry32(hashSeed(`${userId}:${kind}`));
}

const intFn = (r: () => number) => (min: number, max: number) =>
  Math.floor(r() * (max - min + 1)) + min;
const floatFn = (r: () => number) => (min: number, max: number) =>
  r() * (max - min) + min;

/** Generic random-pick. Inline so TS infers `T` at the call site rather
 *  than at the factory site (which would always collapse to `unknown`). */
function rpick<T>(r: () => number, arr: readonly T[]): T {
  return arr[Math.floor(r() * arr.length)];
}

/** Sample from a weighted distribution. Weights need not sum to 1. */
function weightedPick<T>(r: () => number, weighted: readonly [T, number][]): T {
  const total = weighted.reduce((s, [, w]) => s + w, 0);
  let pick = r() * total;
  for (const [v, w] of weighted) {
    pick -= w;
    if (pick <= 0) return v;
  }
  return weighted[weighted.length - 1][0];
}

/* --------------------------------------------------------------------- */
/* Quantity by user level — keeps richer accounts looking richer.        */
/* --------------------------------------------------------------------- */

const COUNTS: Record<
  UserLevel,
  { funds: number; trades: number; devices: number; tickets: number; timeline: number; audits: number }
> = {
  standard:   { funds: 12, trades: 25,  devices: 2, tickets: 1, timeline: 10, audits: 3  },
  vip:        { funds: 35, trades: 70,  devices: 3, tickets: 2, timeline: 22, audits: 6  },
  premium:    { funds: 55, trades: 110, devices: 3, tickets: 3, timeline: 32, audits: 10 },
  enterprise: { funds: 90, trades: 180, devices: 4, tickets: 5, timeline: 50, audits: 15 },
};

/** Pick the count for a level, with a small ±20% jitter seeded from userId. */
function countFor(userId: string, level: UserLevel, key: keyof (typeof COUNTS)["standard"]): number {
  const base = COUNTS[level][key];
  const r = rngFor(userId, `count:${key}`)();
  return Math.max(0, Math.round(base * (0.8 + r * 0.4)));
}

/* --------------------------------------------------------------------- */
/* Funds                                                                 */
/* --------------------------------------------------------------------- */

const FUND_METHODS: readonly [FundRecord["method"], number][] = [
  ["bank_transfer", 45],
  ["crypto",        30],
  ["e_wallet",      15],
  ["credit_card",    8],
  ["wire_transfer",  2],
];
const FUND_STATUSES: readonly [FundRecord["status"], number][] = [
  ["completed",     80],
  ["pending",       10],
  ["manual_review",  5],
  ["rejected",       3],
  ["frozen",         2],
];
const RISK_FLAG_VOCAB = [
  "amount_unusual", "first_time_method", "high_value", "rapid_in_out", "country_mismatch",
];

export function mockFunds(
  userId: string,
  level: UserLevel = "standard",
  registeredAt: Date = new Date(Date.now() - 365 * 24 * 3600_000),
): FundRecord[] {
  const r = rngFor(userId, "funds");
  const ri = intFn(r), rf = floatFn(r);
  const count = countFor(userId, level, "funds");
  const from = registeredAt.getTime();
  const to = Date.now();
  const out: FundRecord[] = [];

  for (let i = 0; i < count; i++) {
    const isDeposit = r() < 0.7; // 70% deposits, 30% withdrawals (retail forex)
    // Heavy-tailed amount distribution: most small, tail to large.
    const tier = r();
    const amount = Math.round(
      tier < 0.6 ? rf(50, 1500)
        : tier < 0.9 ? rf(1500, 8000)
        : tier < 0.98 ? rf(8000, 30000)
        : rf(30000, 100000),
    );
    const createdAt = new Date(from + (to - from) * r());
    const status = weightedPick(r, FUND_STATUSES);
    const flags = r() < 0.08 ? [rpick(r, RISK_FLAG_VOCAB)] : undefined;
    const reviewed = status === "completed" || status === "rejected" ? createdAt.getTime() + ri(60_000, 3 * 3600_000) : undefined;

    out.push({
      id: `mock_fund_${userId.slice(-6)}_${i}`,
      clientId: userId,
      type: isDeposit ? "deposit" : "withdrawal",
      amount: isDeposit ? amount : -amount,
      method: weightedPick(r, FUND_METHODS),
      status,
      createdAt: createdAt.toISOString(),
      reviewedBy: reviewed ? "ops-bot" : undefined,
      reviewedAt: reviewed ? new Date(reviewed).toISOString() : undefined,
      riskFlags: flags,
    });
  }

  return out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/* --------------------------------------------------------------------- */
/* Wallets — v1 仅 USD 单币种                                            */
/* --------------------------------------------------------------------- */

/**
 * Build the (only, in v1) USD wallet for a client.
 *
 * 钱包余额 = 累计入金 − 累计出金 − 已下注到 MT 账户的资金（粗算等于
 * 当前账户 balance 之和）。这是「平台内部钱包」语义：入金先进钱包，
 * 客户再自己划转到具体 MT 账户。
 *
 * 当 funds / accounts 都为空时，给一个保底的小额钱包（避免空状态）。
 */
export function mockWallets(
  userId: string,
  funds: FundRecord[],
  accounts: TradingAccount[],
): ClientWallet[] {
  const r = rngFor(userId, "wallets");
  const rf = floatFn(r);

  const totalDeposit = funds
    .filter((f) => f.type === "deposit" && f.status === "completed")
    .reduce((s, f) => s + f.amount, 0);
  const totalWithdrawal = funds
    .filter((f) => f.type === "withdrawal" && f.status === "completed")
    .reduce((s, f) => s + Math.abs(f.amount), 0);
  const inAccounts = accounts.reduce((s, a) => s + a.balance, 0);

  // Wallet balance is whatever money is "sitting in the wallet" — i.e.
  // deposited - withdrawn - currently parked in MT accounts.
  // Clamp to a small positive floor so the wallet card never reads $0
  // for users who have funded accounts (which would look weird).
  let balance = Math.max(50, totalDeposit - totalWithdrawal - inAccounts);
  // If the user has zero history at all, give them a small mock balance
  // so the empty state still looks realistic.
  if (totalDeposit === 0 && accounts.length === 0) {
    balance = Math.round(rf(200, 2000));
  }

  // Pending withdrawals freeze part of the wallet. Sum the absolute
  // amounts of any withdrawal in pending/manual_review.
  const pendingWithdrawals = funds
    .filter(
      (f) =>
        f.type === "withdrawal" &&
        (f.status === "pending" || f.status === "manual_review"),
    )
    .reduce((s, f) => s + Math.abs(f.amount), 0);
  // Cap frozen ≤ balance so available is never negative.
  const frozen = Math.min(pendingWithdrawals, balance);

  // 24h net flow: sum signed amounts of completed transactions in the last day.
  const cutoff = Date.now() - 24 * 3600_000;
  const flow24h = funds
    .filter(
      (f) => f.status === "completed" && new Date(f.createdAt).getTime() > cutoff,
    )
    .reduce((s, f) => s + f.amount, 0);

  // Most recent fund movement timestamp.
  const lastTx = funds[0]?.createdAt;

  return [
    {
      id: `wallet_${userId.slice(-6)}_usd`,
      clientId: userId,
      currency: "USD",
      balance: Number(balance.toFixed(2)),
      frozen: Number(frozen.toFixed(2)),
      available: Number((balance - frozen).toFixed(2)),
      lastTransactionAt: lastTx,
      flow24h: Number(flow24h.toFixed(2)),
      status: "active",
    },
  ];
}

/* --------------------------------------------------------------------- */
/* Trades                                                                */
/* --------------------------------------------------------------------- */

const TRADE_SYMBOLS: readonly [string, number][] = [
  ["EURUSD", 25], ["GBPUSD", 15], ["USDJPY", 15], ["XAUUSD", 12],
  ["BTCUSD", 10], ["ETHUSD", 8],  ["AUDUSD", 5],  ["USDCAD", 5], ["USDCHF", 5],
];
const SYMBOL_PRICE_RANGE: Record<string, [number, number]> = {
  EURUSD: [1.05, 1.12], GBPUSD: [1.22, 1.30], USDJPY: [148, 158],
  XAUUSD: [1900, 2050], BTCUSD: [55000, 75000], ETHUSD: [2400, 3800],
  AUDUSD: [0.62, 0.70], USDCAD: [1.33, 1.42], USDCHF: [0.87, 0.93],
};

export function mockTrades(
  userId: string,
  level: UserLevel = "standard",
  accounts: TradingAccount[],
  registeredAt: Date = new Date(Date.now() - 365 * 24 * 3600_000),
): TradeRecord[] {
  const r = rngFor(userId, "trades");
  const ri = intFn(r), rf = floatFn(r);
  const count = countFor(userId, level, "trades");
  if (count === 0 || accounts.length === 0) return [];

  const from = registeredAt.getTime();
  const to = Date.now();
  const out: TradeRecord[] = [];

  for (let i = 0; i < count; i++) {
    const symbol = weightedPick(r, TRADE_SYMBOLS);
    const [pLow, pHigh] = SYMBOL_PRICE_RANGE[symbol] ?? [1, 1.5];
    const decimals = symbol.startsWith("BTC") ? 0 : symbol.startsWith("XAU") ? 2 : 5;
    const openPrice = Number(rf(pLow, pHigh).toFixed(decimals));
    // ~88% of trades are CLOSED — leaves a meaningful number of live
    // positions (5-15 typical) for the Positions tab to render.
    const isClosed = r() < 0.88;
    const isProfitable = r() < 0.48; // slight house bias
    const pip = openPrice * (rf(0.001, 0.015));
    const direction = isProfitable ? 1 : -1;
    const closePrice = isClosed
      ? Number((openPrice + direction * pip).toFixed(decimals))
      : undefined;
    // For OPEN positions: mock a live "current price" near the open price
    // so the positions table can show realistic floating PnL.
    const currentPrice = !isClosed
      ? Number((openPrice + (r() - 0.5) * 2 * pip).toFixed(decimals))
      : undefined;
    const volumeTier = r();
    const volume = Number((
      volumeTier < 0.6 ? rf(0.01, 0.5)
        : volumeTier < 0.9 ? rf(0.5, 2)
        : rf(2, 5)
    ).toFixed(2));
    const profit = isClosed && closePrice != null
      ? Number(((closePrice - openPrice) * volume * 100000 / openPrice).toFixed(2))
      : !isClosed && currentPrice != null
        ? Number(((currentPrice - openPrice) * volume * 100000 / openPrice).toFixed(2))
        : undefined;
    // SL/TP set on ~40% of trades — realistic; many retail clients trade naked
    const hasSL = r() < 0.4;
    const hasTP = r() < 0.4;
    const stopLoss = hasSL
      ? Number((openPrice - direction * pip * rf(1.2, 2.5)).toFixed(decimals))
      : undefined;
    const takeProfit = hasTP
      ? Number((openPrice + direction * pip * rf(1.2, 3.0)).toFixed(decimals))
      : undefined;
    const openTime = new Date(from + (to - from) * r());
    const closeTime = isClosed
      ? new Date(openTime.getTime() + ri(60_000, 48 * 3600_000))
      : undefined;

    // Distribute trades evenly across the user's accounts. Stable assignment
    // (deterministic from i + accounts.length) so screenshots stay stable.
    const acct = accounts[i % accounts.length];

    out.push({
      id: `mock_trade_${userId.slice(-6)}_${i}`,
      clientId: userId,
      accountId: acct.id,
      mtAccount: acct.mtAccount,
      symbol,
      type: r() < 0.5 ? "buy" : "sell",
      volume,
      openPrice,
      closePrice,
      currentPrice,
      profit,
      stopLoss,
      takeProfit,
      openTime: openTime.toISOString(),
      closeTime: closeTime?.toISOString(),
      isEATrading: r() < 0.15, // 15% EA users
    });
  }

  return out.sort((a, b) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime());
}

/* --------------------------------------------------------------------- */
/* Devices                                                               */
/* --------------------------------------------------------------------- */

const BROWSER_OS: readonly [string, string, number][] = [
  ["Chrome 124",       "macOS 14",       18],
  ["Chrome 124",       "Windows 11",     22],
  ["Chrome Mobile",    "Android 14",     16],
  ["Safari 17",        "macOS 14",       10],
  ["Safari Mobile",    "iOS 17",         14],
  ["Edge 124",         "Windows 11",      8],
  ["Firefox 125",      "Windows 11",      4],
  ["Firefox 125",      "Linux",           2],
];
const CITY_TZ_BY_COUNTRY: Record<string, [string, string]> = {
  CN: ["Shenzhen", "Asia/Shanghai"],
  HK: ["Hong Kong", "Asia/Hong_Kong"],
  SG: ["Singapore", "Asia/Singapore"],
  JP: ["Tokyo", "Asia/Tokyo"],
  KR: ["Seoul", "Asia/Seoul"],
  TW: ["Taipei", "Asia/Taipei"],
  VN: ["Hanoi", "Asia/Bangkok"],
  TH: ["Bangkok", "Asia/Bangkok"],
  MY: ["Kuala Lumpur", "Asia/Kuala_Lumpur"],
  ID: ["Jakarta", "Asia/Jakarta"],
  PH: ["Manila", "Asia/Manila"],
  IN: ["Mumbai", "Asia/Kolkata"],
  AE: ["Dubai", "Asia/Dubai"],
  US: ["New York", "America/New_York"],
  GB: ["London", "Europe/London"],
  DE: ["Berlin", "Europe/Berlin"],
  FR: ["Paris", "Europe/Paris"],
  ES: ["Madrid", "Europe/Madrid"],
  IT: ["Rome", "Europe/Rome"],
  AU: ["Sydney", "Australia/Sydney"],
  BR: ["São Paulo", "America/Sao_Paulo"],
  MX: ["Mexico City", "America/Mexico_City"],
  ZA: ["Johannesburg", "Africa/Johannesburg"],
};

export function mockDevices(
  userId: string,
  country: string | undefined,
  level: UserLevel = "standard",
  registeredAt: Date = new Date(Date.now() - 365 * 24 * 3600_000),
): ClientDevice[] {
  const r = rngFor(userId, "devices");
  const ri = intFn(r);
  const count = countFor(userId, level, "devices");
  const from = registeredAt.getTime();
  const to = Date.now();
  const out: ClientDevice[] = [];

  for (let i = 0; i < count; i++) {
    const [browser, os] = weightedPick(r, BROWSER_OS.map(([b, o, w]) => [[b, o], w] as [[string, string], number]));
    const cc = country ?? "US";
    const [city, tz] = CITY_TZ_BY_COUNTRY[cc] ?? ["Unknown", "UTC"];
    const lastUsedAt = new Date(to - r() * (to - from));
    out.push({
      id: `mock_dev_${userId.slice(-6)}_${i}`,
      clientId: userId,
      ipAddress: `${ri(1, 223)}.${ri(0, 255)}.${ri(0, 255)}.${ri(1, 254)}`,
      country: cc,
      city,
      deviceId: `fp_${hashSeed(`${userId}:dev:${i}`).toString(36).slice(0, 12)}`,
      browser,
      os,
      timezone: tz,
      lastUsedAt: lastUsedAt.toISOString(),
      isRisky: i > 0 && r() < 0.1,
      isCurrent: false, // assign below
    });
  }

  // Most-recently used device gets isCurrent = true
  if (out.length > 0) {
    out.sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime());
    out[0].isCurrent = true;
  }
  return out;
}

/* --------------------------------------------------------------------- */
/* Tickets                                                               */
/* --------------------------------------------------------------------- */

const TICKET_TYPES: readonly [Ticket["type"], number][] = [
  ["financial",    30], ["withdrawal",   25], ["kyc",        15],
  ["technical",    15], ["complaint",    10], ["risk_appeal", 5],
];
const TICKET_STATUSES: readonly [Ticket["status"], number][] = [
  ["open",              25], ["in_progress",       30], ["waiting_customer", 15],
  ["resolved",          20], ["closed",            10],
];
const TICKET_PRIORITIES: readonly [Ticket["priority"], number][] = [
  ["low", 30], ["medium", 45], ["high", 18], ["urgent", 7],
];
const TICKET_SUBJECTS: Record<Ticket["type"], string[]> = {
  financial:   ["Cannot see my deposit in balance", "Deposit credited late", "Refund request"],
  withdrawal:  ["Withdrawal not received in bank account", "Withdrawal pending too long", "Wrong wallet address used"],
  kyc:         ["KYC document rejected, need clarification", "Passport expiry document upload", "Address proof not accepted"],
  technical:   ["Cannot login to MT5 terminal", "Mobile app crashes on order", "2FA reset request"],
  complaint:   ["Spread looks unusual at market open", "Slippage on EURUSD orders", "Slow customer support response"],
  risk_appeal: ["Account flagged incorrectly", "Restriction appeal", "Group reclassification request"],
};
const STAFF_NAMES = ["Alice Chen", "Bob Martin", "Carol Wong", "David Liu", "Emma Park"];

export function mockTickets(
  userId: string,
  userName: string,
  level: UserLevel = "standard",
  registeredAt: Date = new Date(Date.now() - 365 * 24 * 3600_000),
): Ticket[] {
  const r = rngFor(userId, "tickets");
  const ri = intFn(r);
  const count = countFor(userId, level, "tickets");
  const from = registeredAt.getTime();
  const to = Date.now();
  const out: Ticket[] = [];

  for (let i = 0; i < count; i++) {
    const type = weightedPick(r, TICKET_TYPES);
    const status = weightedPick(r, TICKET_STATUSES);
    const priority = weightedPick(r, TICKET_PRIORITIES);
    const subject = rpick(r, TICKET_SUBJECTS[type]);
    const createdAt = new Date(from + (to - from) * r());
    const updatedAt = new Date(createdAt.getTime() + ri(0, Math.max(1, to - createdAt.getTime())));
    const assignee = status !== "open" ? rpick(r, STAFF_NAMES) : undefined;

    const messageCount = ri(2, 5);
    const messages: TicketMessage[] = [];
    let cursor = createdAt.getTime();
    for (let m = 0; m < messageCount; m++) {
      const isStaff = m % 2 === 1; // alternate
      cursor += ri(30 * 60_000, 24 * 3600_000);
      messages.push({
        id: `mock_msg_${userId.slice(-6)}_${i}_${m}`,
        author: isStaff ? (assignee ?? rpick(r, STAFF_NAMES)) : userName,
        isStaff,
        content: m === 0
          ? subject
          : isStaff
            ? "Looking into this — will get back to you within 24 hours."
            : "Could you please follow up? It's been a while.",
        createdAt: new Date(Math.min(cursor, to)).toISOString(),
      });
    }

    out.push({
      id: `mock_ticket_${userId.slice(-6)}_${i}`,
      ticketId: `T-${createdAt.getFullYear()}-${String(i + 1).padStart(4, "0")}`,
      clientId: userId,
      type,
      status,
      priority,
      subject,
      assignedTo: assignee,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      messages,
    });
  }
  return out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/* --------------------------------------------------------------------- */
/* Applications (formerly "Cases") — 客户发起的所有申请记录              */
/* --------------------------------------------------------------------- */

/**
 * Weighted distribution of application types. Tunes towards what real
 * forex CRMs see most: financial actions dominate (deposit/withdrawal),
 * compliance is second, business-config (leverage / unfreeze) is third,
 * promo/complaint are rare.
 */
const APPLICATION_TYPES: readonly [CaseType, number][] = [
  // 资金类（最常见）
  ["deposit_request",          22],
  ["withdrawal_review",        20],
  // 合规类
  ["kyc_review",               10],
  ["resubmission_review",       6],
  ["video_verification",        4],
  ["kyc_upgrade",               5],
  // 账户类
  ["leverage_change",           8],
  ["account_unfreeze",          4],
  ["account_close",             2],
  // 业务类
  ["copy_trading_apply",        5],
  ["signal_provider_apply",     2],
  ["ib_apply",                  3],
  // 营销类
  ["bonus_claim",               4],
  ["promo_claim",               2],
  // 服务类
  ["complaint",                 2],
  ["refund_request",            1],
];

const APPLICATION_STATUSES: readonly [CaseStatus, number][] = [
  // ~60% 已处理，~40% 未处理 — 真实分布偏向已处理（历史积累）
  ["approved",   45],
  ["rejected",   15],
  ["pending",    18],
  ["in_review",  17],
  ["escalated",   5],
];

const APPLICATION_PRIORITIES: readonly [CaseItem["priority"], number][] = [
  ["low", 25], ["medium", 50], ["high", 20], ["urgent", 5],
];

const REVIEWERS = ["Ops Bot", "Alice Chen", "Bob Martin", "Carol Wong", "David Liu"];

/** 用户视角下的请求文案（客户提交申请时填写的 note）。 */
const REQUEST_NOTES: Partial<Record<CaseType, string[]>> = {
  deposit_request:        ["银行转账已发起，预计 24h 内到账", "信用卡入金", "USDT TRC20 转入"],
  withdrawal_review:      ["申请提款到原入金银行账户", "USDT 提款，钱包地址已验证", "提取盈利部分"],
  kyc_review:             ["首次提交 KYC 资料", "提交身份证 + 地址证明"],
  resubmission_review:    ["地址证明被拒，重新上传水电费账单", "身份证模糊，重新拍摄"],
  video_verification:     ["申请视频认证以解锁 L2 等级"],
  kyc_upgrade:            ["申请从 L1 升级到 L2", "需要更高交易限额"],
  leverage_change:        ["希望将杠杆从 1:100 调整到 1:200", "降低杠杆到 1:50 以控制风险"],
  account_unfreeze:       ["账户被风控冻结，申请解冻", "误触发风控规则，请求解锁"],
  account_close:          ["申请永久关闭交易账户"],
  copy_trading_apply:     ["申请开通跟单服务", "希望跟随 Top Trader"],
  signal_provider_apply:  ["申请成为信号提供者"],
  ib_apply:               ["申请成为 IB 合作伙伴"],
  bonus_claim:            ["申请新客户欢迎奖金", "领取交易返佣"],
  promo_claim:            ["参与节日活动奖励", "VIP 升级礼包"],
  complaint:              ["客服响应慢", "对最近一笔订单滑点有异议"],
  refund_request:         ["请求退还误扣手续费"],
};

/** 处理结论文案（已处理时显示）— 按 status 区分。 */
const RESOLUTIONS: Record<CaseStatus, string[]> = {
  approved:  ["已通过审核", "已批准并完成处理", "符合要求，已放行"],
  rejected:  ["资料不齐全已拒绝", "不符合当前等级要求", "风险评估未通过"],
  pending:   [],
  in_review: [],
  escalated: ["已上报至合规组复核", "需主管二次审批"],
};

/** SLA 文案，按申请类型差异化。 */
function slaForType(type: CaseType): string {
  switch (type) {
    case "withdrawal_review":   return "24h";
    case "deposit_request":     return "1h";
    case "kyc_review":          return "48h";
    case "resubmission_review": return "24h";
    case "video_verification":  return "72h";
    case "leverage_change":     return "12h";
    case "account_unfreeze":    return "4h";
    case "complaint":           return "24h";
    default:                    return "24h";
  }
}

/** 金额仅对资金 / 退款 / 奖励类申请有意义。 */
function maybeAmount(r: () => number, type: CaseType): number | undefined {
  const rf = floatFn(r);
  if (type === "deposit_request" || type === "withdrawal_review") {
    const tier = r();
    return Math.round(
      tier < 0.6 ? rf(100, 2000)
        : tier < 0.9 ? rf(2000, 10000)
        : rf(10000, 50000),
    );
  }
  if (type === "refund_request" || type === "bonus_claim" || type === "promo_claim") {
    return Math.round(rf(20, 500));
  }
  return undefined;
}

/**
 * Mock fallback for the per-client applications list. Quantity scales with
 * level (richer clients have more history). Deterministic from userId so
 * screenshots are stable.
 */
export function mockApplications(
  userId: string,
  userName: string,
  level: UserLevel = "standard",
  registeredAt: Date = new Date(Date.now() - 365 * 24 * 3600_000),
): CaseItem[] {
  const r = rngFor(userId, "applications");
  const ri = intFn(r);
  // Roughly 1.5× the ticket count — applications are more frequent than
  // support tickets (every deposit + withdraw + config tweak counts).
  const base = COUNTS[level].tickets;
  const count = Math.max(
    3,
    Math.round(base * 1.5 * (0.8 + r() * 0.4)),
  );
  const from = registeredAt.getTime();
  const to = Date.now();
  const out: CaseItem[] = [];

  for (let i = 0; i < count; i++) {
    const type = weightedPick(r, APPLICATION_TYPES);
    const status = weightedPick(r, APPLICATION_STATUSES);
    const priority = weightedPick(r, APPLICATION_PRIORITIES);
    const createdAt = new Date(from + (to - from) * r());

    // closedAt 只在 approved/rejected 时填，处于"已结案"语义
    const isClosed = status === "approved" || status === "rejected";
    const closedAt = isClosed
      ? new Date(createdAt.getTime() + ri(10 * 60_000, 72 * 3600_000))
      : undefined;
    const updatedAt = closedAt ?? new Date(createdAt.getTime() + ri(60_000, 24 * 3600_000));

    // 有处理人：除了 pending 状态外都已分配
    const reviewer = status !== "pending" ? rpick(r, REVIEWERS) : undefined;

    const requestNotes = REQUEST_NOTES[type];
    const requestNote = requestNotes ? rpick(r, requestNotes) : undefined;
    const resolution = isClosed || status === "escalated"
      ? rpick(r, RESOLUTIONS[status])
      : undefined;

    // ~50% 申请会有运营留言
    const hasComment = r() < 0.5;
    const comments = hasComment
      ? [
          {
            id: `mock_app_cm_${userId.slice(-6)}_${i}`,
            author: reviewer ?? rpick(r, REVIEWERS),
            content: status === "rejected"
              ? "请补充更清晰的证明材料后重新提交"
              : status === "approved"
                ? "已核验完成，处理完毕"
                : "正在核对资料，请稍候",
            createdAt: new Date(createdAt.getTime() + ri(30 * 60_000, 6 * 3600_000)).toISOString(),
          },
        ]
      : [];

    out.push({
      id: `mock_app_${userId.slice(-6)}_${i}`,
      caseId: `APP-${createdAt.getFullYear()}-${String(i + 1).padStart(4, "0")}`,
      clientId: userId,
      type,
      status,
      priority,
      sla: slaForType(type),
      reviewer,
      resolution,
      amount: maybeAmount(r, type),
      requestNote,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      closedAt: closedAt?.toISOString(),
      comments,
    });
    // 让 lint 满意 — userName 没用到，但 signature 与 mockTickets 保持一致
    void userName;
  }

  return out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/* --------------------------------------------------------------------- */
/* Milestones (lifecycle) — 客户生命周期里程碑                            */
/* --------------------------------------------------------------------- */

/**
 * 根据客户的等级 + 注册时间 + 标签等"已知事实"派生一份里程碑列表。
 *
 * 规则：
 *   - 注册 / 邮箱验证 / 首次登录 几乎所有人都达成 (achieved)
 *   - 后续节点按 level 决定：
 *       standard   = KYC L1 + FTD + 首次交易 + 首次出金
 *       vip        = + KYC L2
 *       premium    = + 升 VIP
 *       enterprise = + 推荐 5+ 个客户 + 一周年
 *   - 部分节点保留 pending / in_progress 状态展示「客户还差什么」
 *   - 时间戳基于 registeredAt 递推：registered → 邮箱(+1h) → 首次登录(+1d)
 *     → KYC 提交(+3d) → KYC 通过(+5d) → FTD(+7d) → 首次交易(+8d) →
 *     首次出金(+40d) → KYC L2(+90d) → ...
 */
export function mockMilestones(
  userId: string,
  level: UserLevel = "standard",
  registeredAt: Date = new Date(Date.now() - 365 * 24 * 3600_000),
  status: "active" | "frozen" | "pending" | "closed" = "active",
): ClientMilestone[] {
  const r = rngFor(userId, "milestones");
  const rf = floatFn(r);
  const reg = registeredAt.getTime();
  const dayMs = 86400_000;
  const now = Date.now();

  // 每个节点的"达成时间"（如果该 level 应该达成）
  const t = {
    registered:       reg,
    emailVerified:    reg + 1 * 3600_000,
    firstLogin:       reg + 1 * dayMs,
    kycSubmitted:     reg + 3 * dayMs,
    kycL1Verified:    reg + 5 * dayMs,
    agreementSigned:  reg + 5 * dayMs + 2 * 3600_000,
    ftd:              reg + 7 * dayMs,
    firstTrade:       reg + 8 * dayMs,
    firstWithdrawal:  reg + 40 * dayMs,
    kycL2Verified:    reg + 90 * dayMs,
    vipPromoted:      reg + 180 * dayMs,
    referralFirst:    reg + 100 * dayMs,
    oneYearAnniv:     reg + 365 * dayMs,
  };

  const isPast = (ms: number) => ms <= now;
  const iso = (ms: number) => new Date(ms).toISOString();

  const list: ClientMilestone[] = [];
  const id = (key: string) => `ms_${userId.slice(-6)}_${key}`;

  // —— 1. 注册（所有人都有） ——
  list.push({
    id: id("registered"),
    key: "registered",
    title: "账户注册",
    description: "客户在平台完成注册",
    status: "achieved",
    achievedAt: iso(t.registered),
    icon: "user-plus",
    weight: "high",
  });

  // —— 2. 邮箱验证 —— 95% 已完成
  const emailDone = r() < 0.95;
  list.push({
    id: id("email_verified"),
    key: "email_verified",
    title: "邮箱验证",
    description: emailDone ? "客户验证了注册邮箱" : "未验证邮箱（影响通知触达）",
    status: emailDone ? "achieved" : "missed",
    achievedAt: emailDone ? iso(t.emailVerified) : undefined,
    icon: "mail-check",
    weight: "medium",
  });

  // —— 3. 首次登录 —— 几乎所有人
  list.push({
    id: id("first_login"),
    key: "first_login",
    title: "首次登录",
    description: "客户首次成功登录平台",
    status: "achieved",
    achievedAt: iso(t.firstLogin),
    icon: "log-in",
    weight: "medium",
  });

  // —— 4. KYC 提交 ——
  const kycSubmittedYes = isPast(t.kycSubmitted) && r() > 0.05;
  list.push({
    id: id("kyc_submitted"),
    key: "kyc_submitted",
    title: "KYC 资料提交",
    description: "客户上传身份证 + 自拍",
    status: kycSubmittedYes ? "achieved" : "pending",
    achievedAt: kycSubmittedYes ? iso(t.kycSubmitted) : undefined,
    icon: "id-card",
    weight: "high",
    href: "?tab=profile&sub=kyc",
  });

  // —— 5. KYC L1 通过 ——
  if (kycSubmittedYes) {
    const kycPassed = isPast(t.kycL1Verified) && r() < 0.92;
    list.push({
      id: id("kyc_l1_verified"),
      key: "kyc_l1_verified",
      title: "KYC Level 1 通过",
      description: kycPassed ? "合规审核通过 · 基础交易权限解锁" : "KYC 审核未通过 / 仍在审核中",
      status: kycPassed ? "achieved" : "in_progress",
      achievedAt: kycPassed ? iso(t.kycL1Verified) : undefined,
      icon: kycPassed ? "shield-check" : "shield-x",
      weight: "high",
      href: "?tab=profile&sub=kyc",
    });
  }

  // —— 6. 协议签署 ——
  if (kycSubmittedYes && isPast(t.agreementSigned)) {
    list.push({
      id: id("agreement_signed"),
      key: "agreement_signed",
      title: "协议签署",
      description: "客户签署用户协议 + 风险披露书",
      status: "achieved",
      achievedAt: iso(t.agreementSigned),
      icon: "file-signature",
      weight: "low",
    });
  }

  // —— 7. FTD 首次入金 ——
  const ftdDone = isPast(t.ftd) && r() < 0.85;
  const ftdAmount = Math.round(rf(200, 5000));
  list.push({
    id: id("ftd"),
    key: "ftd",
    title: "首次入金 (FTD)",
    description: ftdDone ? `客户完成首笔入金，正式转化为付费用户` : "客户尚未完成首笔入金",
    status: ftdDone ? "achieved" : "pending",
    achievedAt: ftdDone ? iso(t.ftd) : undefined,
    icon: "arrow-down",
    weight: "high",
    highlight: ftdDone ? `$${ftdAmount.toLocaleString()}` : undefined,
    href: "?tab=funds&sub=transactions",
    progress: ftdDone ? undefined : {
      current: 0,
      target: 100,
      unit: "USD",
      label: "最低首存 $100",
    },
  });

  // —— 8. 首次交易 ——
  if (ftdDone) {
    const tradeDone = isPast(t.firstTrade) && r() < 0.9;
    list.push({
      id: id("first_trade"),
      key: "first_trade",
      title: "首次交易",
      description: tradeDone ? "客户在 MT 终端完成首笔交易" : "客户尚未开始交易",
      status: tradeDone ? "achieved" : "pending",
      achievedAt: tradeDone ? iso(t.firstTrade) : undefined,
      icon: "trending-up",
      weight: "high",
      highlight: tradeDone ? "EURUSD · 0.1 lots" : undefined,
      href: "?tab=trading",
    });
  }

  // —— 9. 首次出金 —— 出现率较低
  if (ftdDone && isPast(t.firstWithdrawal)) {
    const wdDone = r() < 0.45;
    if (wdDone) {
      list.push({
        id: id("first_withdrawal"),
        key: "first_withdrawal",
        title: "首次出金",
        description: "客户完成首笔出金，资金可以正常退出",
        status: "achieved",
        achievedAt: iso(t.firstWithdrawal),
        icon: "arrow-up",
        weight: "medium",
        highlight: `$${Math.round(rf(50, 2000)).toLocaleString()}`,
        href: "?tab=funds&sub=transactions",
      });
    }
  }

  // —— 10. KYC L2 升级 ——
  if (level === "vip" || level === "premium" || level === "enterprise") {
    if (isPast(t.kycL2Verified)) {
      list.push({
        id: id("kyc_l2_verified"),
        key: "kyc_l2_verified",
        title: "KYC Level 2 升级",
        description: "客户上传地址证明 + 视频认证，解锁高级交易权限",
        status: "achieved",
        achievedAt: iso(t.kycL2Verified),
        icon: "shield-check",
        weight: "high",
        href: "?tab=profile&sub=kyc",
      });
    }
  } else if (kycSubmittedYes) {
    // standard 级别给一个 pending 的 L2 节点，提示"还差什么"
    list.push({
      id: id("kyc_l2_upgrade"),
      key: "kyc_l2_upgrade",
      title: "KYC Level 2 升级",
      description: "上传地址证明 + 视频认证可解锁更高交易限额",
      status: "pending",
      icon: "id-card",
      weight: "medium",
      href: "?tab=profile&sub=kyc",
    });
  }

  // —— 11. 升 VIP ——
  if (level === "premium" || level === "enterprise") {
    list.push({
      id: id("vip_promoted"),
      key: "vip_promoted",
      title: "升级 VIP",
      description: "累计入金达到 VIP 门槛，解锁专属客户经理 + 低点差",
      status: "achieved",
      achievedAt: iso(t.vipPromoted),
      icon: "crown",
      weight: "high",
    });
  } else if (level === "vip") {
    // VIP 用户：展示距离 Premium 的进度
    const currentDeposit = Math.round(rf(5000, 24000));
    list.push({
      id: id("premium_promote"),
      key: "premium_promote",
      title: "升级 Premium",
      description: "累计入金达到 $25,000 可升级 Premium",
      status: "in_progress",
      icon: "rocket",
      weight: "medium",
      progress: {
        current: currentDeposit,
        target: 25000,
        unit: "USD",
        label: "累计入金",
      },
    });
  }

  // —— 12. IB 推荐第一个客户 —— 仅对 IB 客户展示
  if (level === "enterprise" || (level === "premium" && r() < 0.5)) {
    if (isPast(t.referralFirst)) {
      list.push({
        id: id("referral_first"),
        key: "referral_first",
        title: "首位被推荐客户 FTD",
        description: "客户作为 IB 邀请的第一位用户完成首存",
        status: "achieved",
        achievedAt: iso(t.referralFirst),
        icon: "users",
        weight: "medium",
        highlight: `+${Math.round(rf(20, 200))} 客户`,
      });
    }
  }

  // —— 13. 风控干预 —— 仅对 frozen 状态显示
  if (status === "frozen") {
    list.push({
      id: id("account_frozen"),
      key: "account_frozen",
      title: "账户被冻结",
      description: "风控触发账户冻结",
      status: "achieved",
      achievedAt: iso(now - rf(1, 30) * dayMs),
      icon: "ban",
      weight: "high",
    });
  }

  // —— 14. 一周年纪念 ——
  if (isPast(t.oneYearAnniv)) {
    list.push({
      id: id("one_year_anniv"),
      key: "one_year_anniv",
      title: "注册一周年",
      description: "客户在平台已满 1 年",
      status: "achieved",
      achievedAt: iso(t.oneYearAnniv),
      icon: "calendar-clock",
      weight: "low",
    });
  } else if (now - reg > 300 * dayMs) {
    // 还差几天到一周年，给个 in_progress
    const daysToGo = Math.ceil((t.oneYearAnniv - now) / dayMs);
    list.push({
      id: id("one_year_anniv"),
      key: "one_year_anniv",
      title: "注册一周年",
      description: `还有 ${daysToGo} 天达成一周年纪念`,
      status: "in_progress",
      icon: "calendar-clock",
      weight: "low",
      progress: {
        current: 365 - daysToGo,
        target: 365,
        unit: "天",
        label: "注册天数",
      },
    });
  }

  // 按时间顺序（已达成的先放）+ 未达成的按 status 优先级排在末尾
  const STATUS_ORDER: Record<ClientMilestone["status"], number> = {
    achieved: 0, in_progress: 1, pending: 2, missed: 3,
  };
  return list.sort((a, b) => {
    // 都已达成 → 按时间正序（早的在前）
    if (a.status === "achieved" && b.status === "achieved") {
      return new Date(a.achievedAt!).getTime() - new Date(b.achievedAt!).getTime();
    }
    return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  });
}

/* --------------------------------------------------------------------- */
/* Timeline                                                              */
/* --------------------------------------------------------------------- */

const TIMELINE_TEMPLATES: { type: TimelineEvent["type"]; title: string; description: string; weight: number }[] = [
  { type: "deposit",        title: "Deposit completed",       description: "Deposit credited to wallet.",          weight: 30 },
  { type: "withdrawal",     title: "Withdrawal completed",    description: "Funds released to bank.",              weight: 10 },
  { type: "trade",          title: "Trade closed",            description: "Position closed on EURUSD.",           weight: 25 },
  { type: "login",          title: "Login from new IP",       description: "Successful login from a new location.", weight: 18 },
  { type: "note_added",     title: "Internal note added",     description: "Reviewer added a follow-up note.",      weight: 6 },
  { type: "ticket_created", title: "Support ticket opened",   description: "Customer raised a ticket.",             weight: 5 },
  { type: "permission_updated", title: "Permission updated",  description: "Trading permission scope changed.",     weight: 3 },
  { type: "device_added",   title: "New device registered",   description: "First-time use of this device.",        weight: 3 },
];

export function mockTimelineEvents(
  userId: string,
  level: UserLevel = "standard",
  registeredAt: Date = new Date(Date.now() - 365 * 24 * 3600_000),
  kycStatus?: string,
): TimelineEvent[] {
  const r = rngFor(userId, "timeline");
  const count = countFor(userId, level, "timeline");
  const from = registeredAt.getTime();
  const to = Date.now();
  const out: TimelineEvent[] = [];

  // Always start with the registration event itself.
  out.push({
    id: `mock_tl_${userId.slice(-6)}_reg`,
    clientId: userId,
    type: "registered",
    title: "Account registered",
    description: "Client signed up via web portal.",
    timestamp: registeredAt.toISOString(),
  });

  // KYC milestones — only if KYC has progressed.
  if (kycStatus === "verified" || kycStatus === "pending" || kycStatus === "rejected") {
    out.push({
      id: `mock_tl_${userId.slice(-6)}_kycs`,
      clientId: userId,
      type: "kyc_submitted",
      title: "KYC documents submitted",
      description: "Passport + selfie uploaded for review.",
      timestamp: new Date(from + 2 * 86400_000).toISOString(),
    });
    if (kycStatus === "verified") {
      out.push({
        id: `mock_tl_${userId.slice(-6)}_kycv`,
        clientId: userId,
        type: "kyc_approved",
        title: "KYC verified",
        description: "Documents passed compliance review.",
        timestamp: new Date(from + 4 * 86400_000).toISOString(),
        operator: "Alice Chen",
      });
    } else if (kycStatus === "rejected") {
      out.push({
        id: `mock_tl_${userId.slice(-6)}_kycr`,
        clientId: userId,
        type: "kyc_rejected",
        title: "KYC rejected",
        description: "Document quality insufficient — re-submission required.",
        timestamp: new Date(from + 4 * 86400_000).toISOString(),
        operator: "Bob Martin",
      });
    }
  }

  // Fill the rest with a mix of recurring events.
  const remaining = Math.max(0, count - out.length);
  for (let i = 0; i < remaining; i++) {
    const tpl = weightedPick(r, TIMELINE_TEMPLATES.map((t) => [t, t.weight] as const));
    const ts = new Date(from + (to - from) * (i + 1) / (remaining + 1) + (r() - 0.5) * 86400_000);
    out.push({
      id: `mock_tl_${userId.slice(-6)}_${i}`,
      clientId: userId,
      type: tpl.type,
      title: tpl.title,
      description: tpl.description,
      timestamp: ts.toISOString(),
    });
  }

  return out.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/* --------------------------------------------------------------------- */
/* Agreements — 协议文档（与 CLM AgreementRecord 字段对齐）              */
/* --------------------------------------------------------------------- */

/** 标准协议模板 — 经纪商常见协议清单。 */
const AGREEMENT_TEMPLATES: { type: string; name: string; required: boolean }[] = [
  { type: "client_agreement",   name: "Client Agreement",          required: true },
  { type: "risk_disclosure",    name: "Risk Disclosure",           required: true },
  { type: "privacy_policy",     name: "Privacy Policy",            required: true },
  { type: "terms_of_service",   name: "Terms of Service",          required: true },
  { type: "margin_trading",     name: "Margin Trading Agreement",  required: false },
  { type: "aml_declaration",    name: "AML & KYC Declaration",     required: true },
  { type: "fatca_declaration",  name: "FATCA / W-8BEN Declaration", required: false },
];

const LANGUAGE_BY_COUNTRY: Record<string, string> = {
  CN: "中文 (简体)", HK: "繁體中文", TW: "繁體中文",
  JP: "日本語", KR: "한국어",
  SG: "English", MY: "English", PH: "English", IN: "English",
  AE: "العربية", SA: "العربية",
  DE: "Deutsch", FR: "Français", ES: "Español", IT: "Italiano",
  BR: "Português", MX: "Español",
};

export function mockAgreements(
  userId: string,
  registeredAt: Date,
  country: string | undefined,
  kycStatus: string,
): ClientAgreement[] {
  const r = rngFor(userId, "agreements");
  const ri = intFn(r);
  const language = (country && LANGUAGE_BY_COUNTRY[country]) || "English";
  const signedIp = `${ri(1, 223)}.${ri(0, 255)}.${ri(0, 255)}.${ri(1, 254)}`;

  // 注册当天签的必签协议（4 条）+ 后续偶尔签的扩展协议（2-3 条）
  const required = AGREEMENT_TEMPLATES.filter((t) => t.required);
  const optional = AGREEMENT_TEMPLATES.filter((t) => !t.required);

  const out: ClientAgreement[] = [];
  const baseTime = registeredAt.getTime();

  // 必签协议 — 注册时一并签署
  for (let i = 0; i < required.length; i++) {
    const tpl = required[i];
    // KYC 还没提交的客户协议状态为 pending
    const isUnsigned = kycStatus === "not_submitted" && r() < 0.3;
    const isExpired = r() < 0.05; // 5% 概率过期（旧版本协议）
    const status: ClientAgreement["status"] = isUnsigned ? "pending" : isExpired ? "expired" : "signed";
    out.push({
      id: `agr_${userId.slice(-6)}_${i}`,
      clientId: userId,
      agreementType: tpl.type,
      name: tpl.name,
      version: `v${ri(1, 3)}.${ri(0, 9)}`,
      signedAt: new Date(baseTime + i * 30_000 + ri(0, 5 * 60_000)).toISOString(),
      signedIp,
      language,
      signatureType: r() < 0.3 ? "handwritten" : "text",
      pdfUrl: `/mock/agreements/${tpl.type}.pdf`,
      forceResign: isExpired || (r() < 0.08),
      status,
    });
  }

  // 扩展协议 — 部分客户后续签署（如开通保证金交易、KYC 升级时签 FATCA）
  for (const tpl of optional) {
    if (r() < 0.5) continue; // 50% 客户没签
    const signedDays = ri(30, 300);
    const signedTime = baseTime + signedDays * 86400_000;
    out.push({
      id: `agr_${userId.slice(-6)}_${tpl.type}`,
      clientId: userId,
      agreementType: tpl.type,
      name: tpl.name,
      version: `v${ri(1, 2)}.${ri(0, 9)}`,
      signedAt: new Date(signedTime).toISOString(),
      signedIp,
      language,
      signatureType: r() < 0.3 ? "handwritten" : "text",
      pdfUrl: `/mock/agreements/${tpl.type}.pdf`,
      forceResign: r() < 0.05,
      status: "signed",
    });
  }

  return out.sort((a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime());
}

/* --------------------------------------------------------------------- */
/* Risk behaviors — 交易行为风控判定                                     */
/* --------------------------------------------------------------------- */

const RISK_BEHAVIOR_TEMPLATES: { type: RiskBehavior["type"]; level: RiskBehavior["level"]; desc: string }[] = [
  { type: "arbitrage",            level: "medium", desc: "检测到与对冲账户的开仓时间高度同步（误差 < 200ms）" },
  { type: "arbitrage",            level: "high",   desc: "多账户协同开仓 + 反向平仓，疑似两腿套利" },
  { type: "tick_scalping",        level: "high",   desc: "近 7 日内 38 笔订单持仓时长 < 30 秒，疑似 tick scalping" },
  { type: "tick_scalping",        level: "medium", desc: "持仓平均时长 1.2 分钟，远低于同等级客户均值" },
  { type: "latency_arbitrage",    level: "high",   desc: "下单延迟显著优于市场平均，疑似抢报价行为" },
  { type: "latency_arbitrage",    level: "medium", desc: "下单 IP 距 LD4 机房 < 5ms，建议监控滑点" },
  { type: "high_frequency_abuse", level: "high",   desc: "5 分钟内连续开仓 24 笔，触发 high-freq 阈值" },
  { type: "high_frequency_abuse", level: "medium", desc: "日均订单 > 80 笔，长期高频" },
  { type: "high_frequency_abuse", level: "low",    desc: "短时间内集中开仓，但未持续 > 1 天" },
];

/**
 * 派生交易风控信号 — 综合 trades 数据 + 派生 0-3 条 detected behavior。
 * 通过派生而非随机：scalping 的判定来自实际持仓时长，高频来自交易频率等。
 */
export function deriveTradingStatsMock(
  userId: string,
  trades: TradeRecord[],
): { isEATrading: boolean; isHighFrequency: boolean; behaviors: RiskBehavior[] } {
  const r = rngFor(userId, "tradingBehavior");
  const ri = intFn(r);

  // EA 标识 — 25% 客户使用 EA（也尊重 trades 里的 isEATrading 真值）
  const realEa = trades.some((t) => t.isEATrading);
  const isEATrading = realEa || r() < 0.25;

  // 高频判定 — trades > 80 一定算；50-80 之间按 50% 算；用 ratio of close time < 30s
  const closed = trades.filter((t) => t.closeTime);
  const shortHoldRatio = closed.length === 0 ? 0
    : closed.filter((t) => {
        const ms = new Date(t.closeTime!).getTime() - new Date(t.openTime).getTime();
        return ms < 30_000;
      }).length / closed.length;
  const isHighFrequency = trades.length > 80 || (trades.length > 50 && r() < 0.5);

  // detected behaviors — 0~3 条
  const behaviorCount = Math.min(3, Math.max(0, Math.floor(r() * 4)));
  const used = new Set<RiskBehavior["type"]>();
  const behaviors: RiskBehavior[] = [];

  // 派生型：shortHoldRatio 高 → 倾向 tick_scalping；isHighFrequency → 倾向 high_frequency_abuse
  if (shortHoldRatio > 0.4) {
    const tpl = RISK_BEHAVIOR_TEMPLATES.find((t) => t.type === "tick_scalping" && t.level === "high")!;
    behaviors.push(makeBehavior(userId, behaviors.length, tpl, ri));
    used.add("tick_scalping");
  }
  if (isHighFrequency && !used.has("high_frequency_abuse")) {
    const tpl = RISK_BEHAVIOR_TEMPLATES.find((t) => t.type === "high_frequency_abuse" && t.level === "medium")!;
    behaviors.push(makeBehavior(userId, behaviors.length, tpl, ri));
    used.add("high_frequency_abuse");
  }
  if (isEATrading && behaviors.length < behaviorCount && !used.has("latency_arbitrage")) {
    const tpl = RISK_BEHAVIOR_TEMPLATES.find((t) => t.type === "latency_arbitrage" && t.level === "medium")!;
    behaviors.push(makeBehavior(userId, behaviors.length, tpl, ri));
    used.add("latency_arbitrage");
  }
  // 兜底：少于 behaviorCount 时随机补
  while (behaviors.length < behaviorCount) {
    const tpl = rpick(r, RISK_BEHAVIOR_TEMPLATES);
    if (used.has(tpl.type)) continue;
    behaviors.push(makeBehavior(userId, behaviors.length, tpl, ri));
    used.add(tpl.type);
  }

  return { isEATrading, isHighFrequency, behaviors };
}

function makeBehavior(
  userId: string,
  idx: number,
  tpl: { type: RiskBehavior["type"]; level: RiskBehavior["level"]; desc: string },
  ri: (a: number, b: number) => number,
): RiskBehavior {
  return {
    type: tpl.type,
    level: tpl.level,
    description: tpl.desc,
    detectedAt: new Date(Date.now() - ri(1, 30) * 86400_000).toISOString(),
  };
}

/* --------------------------------------------------------------------- */
/* Risk relationships — 关联客户（精简列表视图，配合图谱页）             */
/* --------------------------------------------------------------------- */

const REL_TARGET_NAMES = [
  "Liu Wei",  "Zhang Min",  "Chen Hao",  "Wang Lei",  "Yang Jing",
  "Tanaka Yuki", "Sato Kenji", "Park Min-jun", "Kim Soo-yeon",
  "Lee Wong", "Hassan Khalid", "Aisha Rahman",
  "Aleksandr Volkov", "Marco Rossi", "Sophie Martin",
];

/** 关联关系模板 — 描述文案 + 默认强度区间。 */
const REL_TEMPLATES: {
  kind: RiskRelationship["relationshipType"];
  details: string[];
  strengthRange: [number, number];
}[] = [
  {
    kind: "shared_ip",
    details: [
      "共享公网 IP 1.2.3.4 · 最近 12 次登录",
      "最近 30 天内 6 次同 IP 登录",
      "共用同一公司网关 IP（疑似办公室同事）",
    ],
    strengthRange: [0.3, 0.7],
  },
  {
    kind: "shared_device",
    details: [
      "共用同一设备指纹 (Chrome on Win11 · 设备 hash 一致)",
      "Mobile Ad ID 一致（同一台手机）",
      "Browser fingerprint + 屏幕分辨率 + 时区 完全一致",
    ],
    strengthRange: [0.6, 0.9],
  },
  {
    kind: "shared_bank",
    details: [
      "出入金使用同一银行账户（HSBC ****1234）",
      "USDT 钱包地址完全一致 (TRC20)",
      "A 的出金记录 → 1 小时内 B 的入金 (fund flow link)",
    ],
    strengthRange: [0.7, 0.95],
  },
  {
    kind: "shared_crypto_wallet",
    details: [
      "USDT-TRC20 钱包地址重复",
      "BTC 钱包共用同一充值地址",
      "签名链路径有 1 跳重合",
    ],
    strengthRange: [0.75, 0.95],
  },
  {
    kind: "same_name",
    details: [
      "同名 + 同 DOB",
      "证件号完全一致（疑似同一人多账号）",
      "Email pattern 强相似（li.wei.1@ / li.wei.2@）",
    ],
    strengthRange: [0.5, 0.85],
  },
];

export function mockRiskRelationships(
  userId: string,
  level: UserLevel = "standard",
): RiskRelationship[] {
  const r = rngFor(userId, "riskRelationships");
  const ri = intFn(r), rf = floatFn(r);

  // 约 20% 客户独立（无关联），80% 客户至少 1-6 条关联。
  // 阈值调小是为了演示友好——真实数据里多账户嫌疑通常占 5-15%，
  // 后端接入后这里可以删除整个 fallback。
  if (r() < 0.2) return [];

  // VIP/Enterprise 倾向更多关联（业务网络复杂）
  const max = level === "enterprise" ? 6 : level === "premium" ? 5 : 4;
  const count = ri(1, max);

  const out: RiskRelationship[] = [];
  const usedTargets = new Set<string>();

  for (let i = 0; i < count; i++) {
    const tpl = rpick(r, REL_TEMPLATES);
    const name = rpick(r, REL_TARGET_NAMES);
    if (usedTargets.has(name)) continue;
    usedTargets.add(name);

    const targetUid = `USR${hashSeed(`${userId}:rel:${i}`).toString(36).slice(0, 6).toUpperCase()}`;
    const strength = Number(rf(tpl.strengthRange[0], tpl.strengthRange[1]).toFixed(2));
    const details = rpick(r, tpl.details);

    out.push({
      targetClientId: targetUid,
      targetClientName: name,
      relationshipType: tpl.kind,
      strength,
      details,
      detectedAt: new Date(Date.now() - ri(1, 180) * 86400_000).toISOString(),
    });
  }

  return out.sort((a, b) => b.strength - a.strength);
}

/* --------------------------------------------------------------------- */
/* Audit logs                                                            */
/* --------------------------------------------------------------------- */

const AUDIT_TEMPLATES: { action: string; targetField: string; oldValue?: string; newValue?: string; weight: number }[] = [
  { action: "kyc.review.assign",   targetField: "kycReviewer", oldValue: undefined, newValue: "staff-001",   weight: 12 },
  { action: "kyc.status.change",   targetField: "kycStatus",   oldValue: "pending", newValue: "verified",     weight: 10 },
  { action: "ticket.assign",       targetField: "assignedTo",  oldValue: undefined, newValue: "staff-002",   weight: 12 },
  { action: "user.status.freeze",  targetField: "status",      oldValue: "active",  newValue: "frozen",       weight:  3 },
  { action: "user.tag.add",        targetField: "tags",        oldValue: "",        newValue: "VIP",          weight:  8 },
  { action: "permission.update",   targetField: "withdrawal",  oldValue: "true",    newValue: "false",        weight:  5 },
  { action: "fund.review.approve", targetField: "fundStatus",  oldValue: "pending", newValue: "completed",    weight: 15 },
  { action: "note.add",            targetField: "notes",       oldValue: undefined, newValue: "(internal note)", weight: 10 },
];

export function mockAuditLogs(
  userId: string,
  level: UserLevel = "standard",
  registeredAt: Date = new Date(Date.now() - 365 * 24 * 3600_000),
): AuditLog[] {
  const r = rngFor(userId, "audit");
  const ri = intFn(r);
  const count = countFor(userId, level, "audits");
  const from = registeredAt.getTime();
  const to = Date.now();
  const out: AuditLog[] = [];

  for (let i = 0; i < count; i++) {
    const tpl = weightedPick(r, AUDIT_TEMPLATES.map((t) => [t, t.weight] as const));
    const ts = new Date(from + (to - from) * r());
    out.push({
      id: `mock_audit_${userId.slice(-6)}_${i}`,
      clientId: userId,
      operator: rpick(r, STAFF_NAMES),
      action: tpl.action,
      targetField: tpl.targetField,
      oldValue: tpl.oldValue,
      newValue: tpl.newValue,
      timestamp: ts.toISOString(),
      ipAddress: `10.${ri(0, 255)}.${ri(0, 255)}.${ri(1, 254)}`,
    });
  }
  return out.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/* --------------------------------------------------------------------- */
/* Account: full TradingAccount, flow entries, positions, pending orders */
/* --------------------------------------------------------------------- */

const PLATFORMS: readonly [TradingAccount["platform"], number][] = [
  ["MT5",       70],
  ["MT4",       20],
  ["TradePass", 10],
];
const CURRENCIES: readonly [string, number][] = [
  ["USD", 60], ["EUR", 15], ["GBP", 10], ["JPY", 8], ["USDT", 5], ["AUD", 2],
];
const TRADING_MODES: readonly [TradingAccount["tradingMode"], number][] = [
  ["hedging", 80], ["netting", 20],
];
const ACCOUNT_TYPES: readonly [TradingAccount["accountType"], number][] = [
  ["Standard", 55], ["VIP", 20], ["ECN", 15], ["PRO", 10],
];
const SERVERS = [
  "TradePass-Live-01", "TradePass-Live-02", "TradePass-Live-03",
  "TradePass-Demo",    "MT4-East-01",       "MT4-East-02",
];
const ACCOUNT_GROUPS = [
  "live\\standard", "live\\ecn", "live\\pro", "live\\vip",
  "demo\\standard", "demo\\vip",
];

/**
 * Build a complete `TradingAccount` deterministically from
 * `(userId, accountIndex)`. Seed-stable so screenshots / scrollback
 * remain consistent.
 *
 * `baseBalance` is the wallet/headline balance for the account; everything
 * else (equity, margin, totals) derives from it with proportional spreads.
 */
export function mockTradingAccountFull(
  userId: string,
  accountIndex: number,
  baseBalance: number,
  createdAt: Date = new Date(Date.now() - 365 * 24 * 3600_000),
): TradingAccount {
  const seed = `${userId}:acct:${accountIndex}`;
  const r = rngFor(userId, `acct:${accountIndex}`);
  const ri = intFn(r), rf = floatFn(r);

  // 5–9 digit pure-numeric MT login.
  const digits = 5 + (hashSeed(seed) % 5);
  const mtLow = Math.pow(10, digits - 1);
  const mtHigh = Math.pow(10, digits) - 1;
  const mtAccount = String(mtLow + (hashSeed(`${seed}:mt`) % (mtHigh - mtLow)));

  const platform     = weightedPick(r, PLATFORMS);
  const currency     = weightedPick(r, CURRENCIES);
  const tradingMode  = weightedPick(r, TRADING_MODES);
  const accountType  = weightedPick(r, ACCOUNT_TYPES);
  const server       = SERVERS[hashSeed(`${seed}:server`) % SERVERS.length];
  const groupBase    = ACCOUNT_GROUPS[hashSeed(`${seed}:group`) % ACCOUNT_GROUPS.length];

  const leverage = ["1:50", "1:100", "1:200", "1:500", "1:1000"][hashSeed(`${seed}:lev`) % 5];

  const balance = Math.round(baseBalance * (0.92 + r() * 0.16));        // ±8%
  const pnl     = Math.round(balance * rf(-0.05, 0.05));                 // ±5%
  const equity  = Math.max(0, balance + pnl);
  const marginUsed = Math.round(equity * rf(0.05, 0.25));                // 5-25% used
  const freeMargin = Math.max(0, equity - marginUsed);
  const marginLevel = marginUsed > 0
    ? `${((equity / marginUsed) * 100).toFixed(2)}%`
    : "—";

  // Total deposit ≥ balance; total withdrawal = a fraction of deposit.
  const totalDeposit    = Math.round(balance * rf(1.2, 2.5));
  const totalWithdrawal = Math.round(totalDeposit * rf(0.1, 0.6));
  const commission      = Math.round(balance * rf(0.005, 0.02));
  const swap            = Math.round(balance * rf(-0.003, 0.003));

  // Status / readonly distributions
  const statusRoll = r();
  const status: TradingAccount["status"] =
    statusRoll < 0.85 ? "active"
    : statusRoll < 0.93 ? "restricted"
    : "disabled";
  const readonly = r() < 0.07;

  // Last trade — within 30 days for active accounts, longer ago for others.
  const lastTradeAt = status === "active"
    ? new Date(Date.now() - ri(0, 30) * 86400_000).toISOString()
    : new Date(Date.now() - ri(60, 365) * 86400_000).toISOString();

  // Created at — offset from the user's createdAt by 0..180 days
  const createdAtMs = createdAt.getTime() + ri(0, 180) * 86400_000;

  return {
    id: `mock_acct_${userId.slice(-6)}_${accountIndex}`,
    mtAccount,
    accountType,
    status,
    readonly,
    platform,
    balance,
    equity,
    margin: marginUsed,
    freeMargin,
    marginLevel,
    leverage,
    currency,
    totalDeposit,
    totalWithdrawal,
    commission,
    swap,
    tradingMode,
    group: groupBase,
    server,
    createdAt: new Date(createdAtMs).toISOString(),
    lastTradeAt,
  };
}

const FLOW_KINDS: readonly [AccountFlowKind, number][] = [
  ["deposit",       30],
  ["withdrawal",    20],
  ["commission",    18],
  ["swap",          15],
  ["adjustment",     6],
  ["transfer_in",    5],
  ["transfer_out",   4],
  ["rebate",         2],
];

const FLOW_DESC: Record<AccountFlowKind, string[]> = {
  deposit:      ["Bank transfer", "USDT TRC20", "Credit card (Visa)", "Skrill"],
  withdrawal:   ["To bank account", "To USDT TRC20", "To Skrill"],
  commission:   ["Trade commission EURUSD", "Commission XAUUSD", "Commission BTCUSD"],
  swap:         ["Overnight swap", "Triple-swap (Wed→Thu)"],
  adjustment:   ["Manual balance adjustment by ops", "Promotional credit", "Refund"],
  transfer_in:  ["Transfer from another account"],
  transfer_out: ["Transfer to another account"],
  rebate:       ["Volume rebate", "IB rebate"],
};

export function mockAccountFlow(
  account: TradingAccount,
  count = 30,
): AccountFlowEntry[] {
  const r = rngFor(account.id, "flow");
  const ri = intFn(r), rf = floatFn(r), rp = <T,>(arr: readonly T[]): T =>
    arr[Math.floor(r() * arr.length)];

  const created = new Date(account.createdAt).getTime();
  const now = Date.now();
  let runningBalance = account.balance;

  // Walk backwards from current balance, generating entries in reverse
  // chronological order — the balance "before" each entry is what we need.
  const out: AccountFlowEntry[] = [];
  for (let i = 0; i < count; i++) {
    const kind = weightedPick(r, FLOW_KINDS);
    const sign =
      kind === "deposit" || kind === "transfer_in" || kind === "rebate" ? 1
      : kind === "withdrawal" || kind === "transfer_out" || kind === "swap" || kind === "commission" ? -1
      : (r() < 0.5 ? 1 : -1);

    const magnitude = kind === "swap"
      ? Math.round(account.balance * rf(0.0005, 0.003))
      : kind === "commission"
        ? Math.round(account.balance * rf(0.001, 0.01))
        : kind === "deposit" || kind === "withdrawal"
          ? Math.round(account.balance * rf(0.05, 0.5))
          : Math.round(account.balance * rf(0.01, 0.1));
    const amount = sign * magnitude;

    const balanceAfter = runningBalance;
    runningBalance = Math.max(0, runningBalance - amount);

    const ts = new Date(now - (i + 1) * Math.max(1, Math.floor((now - created) / count)) - ri(0, 12 * 3600_000));
    out.push({
      id: `mock_flow_${account.id.slice(-8)}_${i}`,
      type: kind,
      amount,
      balanceAfter,
      description: rp(FLOW_DESC[kind]),
      timestamp: ts.toISOString(),
    });
  }
  return out;
}

const POSITION_SYMBOLS: readonly [string, number][] = [
  ["EURUSD", 25], ["GBPUSD", 15], ["USDJPY", 15], ["XAUUSD", 12],
  ["BTCUSD", 10], ["ETHUSD", 8],  ["AUDUSD", 5],  ["USDCAD", 5], ["USDCHF", 5],
];
const SYMBOL_PRICE_BANDS: Record<string, [number, number]> = {
  EURUSD: [1.05, 1.12], GBPUSD: [1.22, 1.30], USDJPY: [148, 158],
  XAUUSD: [1900, 2050], BTCUSD: [55000, 75000], ETHUSD: [2400, 3800],
  AUDUSD: [0.62, 0.70], USDCAD: [1.33, 1.42], USDCHF: [0.87, 0.93],
};

export function mockOpenPositions(account: TradingAccount, count?: number): OpenPosition[] {
  if (account.status !== "active") return [];
  const r = rngFor(account.id, "positions");
  const rf = floatFn(r), ri = intFn(r);
  const n = count ?? ri(0, 6);
  const out: OpenPosition[] = [];
  for (let i = 0; i < n; i++) {
    const symbol = weightedPick(r, POSITION_SYMBOLS);
    const [low, high] = SYMBOL_PRICE_BANDS[symbol] ?? [1, 1.5];
    const openPrice = Number(rf(low, high).toFixed(symbol.startsWith("BTC") ? 0 : 5));
    const drift = (r() - 0.5) * (high - low) * 0.05;
    const currentPrice = Number((openPrice + drift).toFixed(symbol.startsWith("BTC") ? 0 : 5));
    const volume = Number(rf(0.01, 3).toFixed(2));
    const side: "buy" | "sell" = r() < 0.5 ? "buy" : "sell";
    const pnl = Number(((currentPrice - openPrice) * volume * (side === "buy" ? 1 : -1) * 100000 / openPrice).toFixed(2));
    out.push({
      id: `mock_pos_${account.id.slice(-8)}_${i}`,
      symbol, side, volume, openPrice, currentPrice, pnl,
      swap: Number(rf(-5, 5).toFixed(2)),
      commission: Number(rf(0.5, 5).toFixed(2)),
      openTime: new Date(Date.now() - ri(1, 96) * 3600_000).toISOString(),
      stopLoss: r() < 0.4 ? Number((openPrice * (1 - 0.02 * (side === "buy" ? 1 : -1))).toFixed(5)) : undefined,
      takeProfit: r() < 0.5 ? Number((openPrice * (1 + 0.03 * (side === "buy" ? 1 : -1))).toFixed(5)) : undefined,
    });
  }
  return out;
}

const PENDING_KINDS: readonly [PendingOrderKind, number][] = [
  ["buy_limit", 30], ["sell_limit", 30], ["buy_stop", 20], ["sell_stop", 20],
];

/* --------------------------------------------------------------------- */
/* Account Operating Workspace mocks                                     */
/*  - Status badges                                                      */
/*  - Risk / Financial / Performance / Behavioral metrics                */
/*  - AccountControls (independent model) + control log                  */
/*  - Unified Activity timeline                                          */
/*  - Permissions / Security                                             */
/* --------------------------------------------------------------------- */

const FLAG_POOL: AccountFlag[] = [
  "readonly", "trial", "expiring_soon", "high_priority", "under_review",
];

/**
 * 从 TradingAccount 和实时风险数据推导出多维徽章。
 * 不同维度独立：一个账户可以同时 active + warning + withdrawal_locked。
 */
export function mockStatusBadge(
  account: TradingAccount,
  controls: AccountControls,
): AccountStatusBadge {
  const r = rngFor(account.id, "badge");

  // Margin
  const ml = parseFloat(account.marginLevel) || Infinity;
  const margin: AccountStatusBadge["margin"] =
    !isFinite(ml) ? "healthy"
    : ml >= 300 ? "healthy"
    : ml >= 100 ? "warning"
    : ml >= 50  ? "call"
    : "stopout";

  // Risk — biased by margin + restricted status
  const riskRoll = r();
  const baseRisk: AccountStatusBadge["risk"] =
    account.status === "disabled" ? "critical"
    : account.status === "restricted" ? "warning"
    : margin === "warning" || margin === "call" ? "warning"
    : margin === "stopout" ? "critical"
    : riskRoll < 0.7 ? "normal"
    : riskRoll < 0.9 ? "watch"
    : "warning";

  // Control — derived from controls + readonly flag
  const tradingLocked = !controls.tradingEnabled.value;
  const withdrawalLocked = !controls.withdrawalEnabled.value;
  const control: AccountStatusBadge["control"] =
    tradingLocked && withdrawalLocked ? "fully_locked"
    : tradingLocked ? "trading_locked"
    : withdrawalLocked ? "withdrawal_locked"
    : "open";

  // Flags
  const flags: AccountFlag[] = [];
  if (account.readonly) flags.push("readonly");
  if (controls.kycReviewRequired.value) flags.push("under_review");
  if (r() < 0.15) flags.push(rpick(r, FLAG_POOL.filter((f) => !flags.includes(f))));

  return {
    operational: account.status,
    risk: baseRisk,
    margin,
    control,
    flags: flags.length > 0 ? flags : undefined,
  };
}

export function mockRiskMetrics(account: TradingAccount): RiskMetrics {
  const r = rngFor(account.id, "risk");
  const rf = floatFn(r);
  const ml = parseFloat(account.marginLevel) || 999;
  const marginCallLevel = 100;
  const stopoutLevel = 50;

  const bufferToMarginCall = account.margin > 0
    ? Math.max(0, account.equity - account.margin * (marginCallLevel / 100))
    : account.equity;

  const maxSymbolExposurePct = Number(rf(0.05, 0.45).toFixed(3));

  const riskLevel: RiskMetrics["riskLevel"] =
    ml < stopoutLevel ? "critical"
    : ml < marginCallLevel ? "high"
    : ml < 300 ? "medium"
    : "low";

  const alerts: RiskAlert[] = [];
  if (ml < 300) {
    alerts.push({
      id: `alert_${account.id.slice(-6)}_margin`,
      level: ml < 100 ? "critical" : "warning",
      message: `Margin level ${account.marginLevel}, below safe threshold 300%`,
      triggeredAt: new Date(Date.now() - intFn(r)(5, 240) * 60_000).toISOString(),
    });
  }
  if (maxSymbolExposurePct > 0.3) {
    alerts.push({
      id: `alert_${account.id.slice(-6)}_concentration`,
      level: "warning",
      message: `Single-symbol exposure ${(maxSymbolExposurePct * 100).toFixed(1)}% of equity — concentration high`,
      triggeredAt: new Date(Date.now() - intFn(r)(60, 600) * 60_000).toISOString(),
    });
  }
  if (account.status === "restricted") {
    alerts.push({
      id: `alert_${account.id.slice(-6)}_restricted`,
      level: "warning",
      message: "Account is restricted — new positions will be rejected",
      triggeredAt: new Date(Date.now() - intFn(r)(30, 1440) * 60_000).toISOString(),
    });
  }

  return {
    marginLevel: ml === 999 ? 9999 : ml,
    marginCallLevel,
    stopoutLevel,
    bufferToMarginCall: Math.round(bufferToMarginCall),
    maxSymbolExposurePct,
    riskLevel,
    alerts,
  };
}

export function mockFinancialMetrics(account: TradingAccount): FinancialMetrics {
  const r = rngFor(account.id, "fin");
  const rf = floatFn(r);
  const realized = Math.round(account.balance * rf(-0.15, 0.25));
  const unrealized = Math.round(account.equity - account.balance);
  return {
    balance: account.balance,
    equity: account.equity,
    freeMargin: account.freeMargin,
    totalDeposit: account.totalDeposit,
    totalWithdrawal: account.totalWithdrawal,
    netDeposit: account.totalDeposit - account.totalWithdrawal,
    realizedPnL: realized,
    unrealizedPnL: unrealized,
    commission: account.commission,
    swap: account.swap,
    currency: account.currency,
  };
}

export function mockTradingPerformance(
  account: TradingAccount,
  trades: TradeRecord[],
): TradingPerformance {
  const r = rngFor(account.id, "perf");
  const rf = floatFn(r);
  const closed = trades.filter((t) => t.profit != null);
  const wins = closed.filter((t) => (t.profit ?? 0) > 0);
  const losses = closed.filter((t) => (t.profit ?? 0) <= 0);

  const sumWin = wins.reduce((s, t) => s + (t.profit ?? 0), 0);
  const sumLoss = Math.abs(losses.reduce((s, t) => s + (t.profit ?? 0), 0));

  const winRate = closed.length === 0 ? 0 : wins.length / closed.length;
  const profitFactor = sumLoss === 0 ? (sumWin > 0 ? 99 : 0) : Number((sumWin / sumLoss).toFixed(2));

  const totalLots = Number(trades.reduce((s, t) => s + t.volume, 0).toFixed(2));

  const now = Date.now();
  const tradesLast7d = trades.filter((t) => now - new Date(t.openTime).getTime() < 7 * 86400_000).length;
  const tradesLast30d = trades.filter((t) => now - new Date(t.openTime).getTime() < 30 * 86400_000).length;

  // Top symbols by lot volume
  const bySymbol = new Map<string, { volume: number; pnl: number }>();
  for (const t of trades) {
    const cur = bySymbol.get(t.symbol) ?? { volume: 0, pnl: 0 };
    cur.volume += t.volume;
    cur.pnl += t.profit ?? 0;
    bySymbol.set(t.symbol, cur);
  }
  const topSymbols = Array.from(bySymbol.entries())
    .sort((a, b) => b[1].volume - a[1].volume)
    .slice(0, 3)
    .map(([symbol, v]) => ({
      symbol,
      volume: Number(v.volume.toFixed(2)),
      pnl: Number(v.pnl.toFixed(2)),
    }));

  return {
    totalTrades: trades.length,
    closedTrades: closed.length,
    winRate: Number(winRate.toFixed(3)),
    averageWin: wins.length === 0 ? 0 : Number((sumWin / wins.length).toFixed(2)),
    averageLoss: losses.length === 0 ? 0 : Number((sumLoss / losses.length).toFixed(2)),
    profitFactor,
    totalLots,
    tradesLast7d,
    tradesLast30d,
    topSymbols: topSymbols.length > 0 ? topSymbols : [
      { symbol: "EURUSD", volume: Number(rf(1, 20).toFixed(2)), pnl: Math.round(rf(-500, 1500)) },
    ],
  };
}

export function mockBehavioralSignals(
  account: TradingAccount,
  trades: TradeRecord[],
): BehavioralSignals {
  const r = rngFor(account.id, "behavior");
  const rf = floatFn(r);
  const eaCount = trades.filter((t) => t.isEATrading).length;
  const isEATrading = trades.length > 0 ? eaCount / trades.length > 0.3 : r() < 0.15;

  const closed = trades.filter((t) => t.closeTime && t.profit != null);
  const avgHold = closed.length === 0
    ? Math.round(rf(60, 720))
    : Math.round(
        closed.reduce(
          (s, t) => s + (new Date(t.closeTime!).getTime() - new Date(t.openTime).getTime()) / 60_000,
          0,
        ) / closed.length,
      );

  const isHighFrequency = avgHold < 30;
  const afterHoursPct = Number(rf(0.05, 0.35).toFixed(2));

  const detectedBehaviors: BehavioralSignals["detectedBehaviors"] = [];
  if (isHighFrequency && r() < 0.4) {
    detectedBehaviors.push({
      type: "high_frequency_abuse",
      level: avgHold < 5 ? "high" : "medium",
      description: `Average holding ${avgHold} min — likely high-frequency strategy`,
      detectedAt: new Date(Date.now() - intFn(r)(1, 30) * 86400_000).toISOString(),
    });
  }
  if (isEATrading && r() < 0.3) {
    detectedBehaviors.push({
      type: "arbitrage",
      level: "medium",
      description: "EA places orders at consistent times — arbitrage signature detected",
      detectedAt: new Date(Date.now() - intFn(r)(1, 14) * 86400_000).toISOString(),
    });
  }

  return {
    isEATrading,
    isHighFrequency,
    avgHoldingMinutes: avgHold,
    afterHoursPct,
    lastLoginToTradeHours: r() < 0.7 ? Number(rf(0.1, 24).toFixed(1)) : undefined,
    detectedBehaviors,
  };
}

const STAFF_FOR_CONTROLS = ["Alice Chen", "Bob Martin", "Carol Wong"];

function buildToggle(value: boolean, changedBy?: string, hoursAgo?: number, reason?: string): ControlToggle {
  return {
    value,
    changedBy,
    changedAt: hoursAgo != null ? new Date(Date.now() - hoursAgo * 3600_000).toISOString() : undefined,
    reason,
  };
}
function buildValue<T>(value: T, changedBy?: string, hoursAgo?: number, reason?: string): ControlValue<T> {
  return {
    value,
    changedBy,
    changedAt: hoursAgo != null ? new Date(Date.now() - hoursAgo * 3600_000).toISOString() : undefined,
    reason,
  };
}

export function mockAccountControls(account: TradingAccount): AccountControls {
  const r = rngFor(account.id, "controls");
  const ri = intFn(r);
  const op = rpick(r, STAFF_FOR_CONTROLS);

  // 默认 90% 开启交易；受限/禁用账户上锁
  const tradingEnabled = account.status === "active";
  const depositEnabled = account.status !== "disabled";
  const withdrawalEnabled = account.status === "active" && r() > 0.15;

  return {
    accountId: account.id,
    tradingEnabled: buildToggle(
      tradingEnabled,
      tradingEnabled ? undefined : op,
      tradingEnabled ? undefined : ri(2, 240),
      tradingEnabled ? undefined : "Account restricted — trading paused",
    ),
    allowEA: buildToggle(r() < 0.7),
    allowHedging: buildToggle(account.tradingMode === "hedging"),
    symbolWhitelist: r() < 0.15 ? ["EURUSD", "USDJPY", "XAUUSD"] : [],
    maxLotSize: buildValue(
      r() < 0.7 ? 0 : Number((r() * 5 + 1).toFixed(1)),
      r() < 0.3 ? op : undefined,
      r() < 0.3 ? ri(24, 720) : undefined,
      r() < 0.3 ? "High-net-worth client — per-order cap adjusted" : undefined,
    ),
    depositEnabled: buildToggle(depositEnabled),
    withdrawalEnabled: buildToggle(
      withdrawalEnabled,
      withdrawalEnabled ? undefined : op,
      withdrawalEnabled ? undefined : ri(1, 168),
      withdrawalEnabled ? undefined : "Suspicious funds — withdrawal paused",
    ),
    dailyWithdrawalCap: buildValue(
      r() < 0.6 ? 0 : Math.round(account.balance * (0.3 + r() * 0.5)),
    ),
    transferEnabled: buildToggle(r() < 0.85),
    customMarginCallLevel: buildValue<number | null>(r() < 0.2 ? 150 : null),
    customStopoutLevel: buildValue<number | null>(r() < 0.1 ? 75 : null),
    maxOpenPositions: buildValue<number | null>(r() < 0.15 ? ri(10, 50) : null),
    liquidationPolicy: buildValue<"fifo" | "largest_first" | "manual">(
      r() < 0.7 ? "fifo" : r() < 0.9 ? "largest_first" : "manual",
    ),
    readonly: buildToggle(
      account.readonly ?? false,
      account.readonly ? op : undefined,
      account.readonly ? ri(1, 720) : undefined,
      account.readonly ? "Client requested read-only mode" : undefined,
    ),
    amlElevated: buildToggle(r() < 0.08),
    kycReviewRequired: buildToggle(r() < 0.1),
  };
}

const CONTROL_KEYS: { key: keyof AccountControls; label: string; isValue?: boolean }[] = [
  { key: "tradingEnabled",        label: "Trading Enabled" },
  { key: "depositEnabled",        label: "Deposit Enabled" },
  { key: "withdrawalEnabled",     label: "Withdrawal Enabled" },
  { key: "transferEnabled",       label: "Internal Transfer" },
  { key: "dailyWithdrawalCap",    label: "Daily Withdrawal Cap",  isValue: true },
  { key: "maxLotSize",            label: "Max Lot Size",          isValue: true },
  { key: "readonly",              label: "Read-only Mode" },
  { key: "amlElevated",           label: "AML Elevated" },
  { key: "kycReviewRequired",     label: "Force KYC Re-review" },
  { key: "customMarginCallLevel", label: "Custom Margin Call",    isValue: true },
];

const CONTROL_REASONS = [
  "Client request",
  "Risk engine alert",
  "Compliance review",
  "Ops adjustment",
  "Anomaly investigation",
];

export function mockControlLog(account: TradingAccount, count = 8): AccountControlLog[] {
  const r = rngFor(account.id, "controlLog");
  const ri = intFn(r);
  const out: AccountControlLog[] = [];
  for (let i = 0; i < count; i++) {
    const def = rpick(r, CONTROL_KEYS);
    const isToggle = !def.isValue;
    const oldValue = isToggle ? (r() < 0.5 ? "true" : "false") : String(ri(1000, 50000));
    const newValue = isToggle ? (oldValue === "true" ? "false" : "true") : String(ri(1000, 50000));
    out.push({
      id: `mock_ctrl_log_${account.id.slice(-8)}_${i}`,
      accountId: account.id,
      controlKey: def.key as string,
      operator: rpick(r, STAFF_FOR_CONTROLS),
      operatorRole: r() < 0.7 ? "Risk Officer" : "Compliance",
      oldValue,
      newValue,
      reason: rpick(r, CONTROL_REASONS),
      timestamp: new Date(Date.now() - (i * ri(3, 48) + ri(0, 24)) * 3600_000).toISOString(),
    });
  }
  return out.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Activity timeline — 跨域事件统一流。
 * 从 trades / flow / control logs 聚合，加入登录/风险/KYC 等合成事件。
 */
export function mockAccountActivity(
  account: TradingAccount,
  trades: TradeRecord[],
  flow: AccountFlowEntry[],
  controlLogs: AccountControlLog[],
): AccountActivityEntry[] {
  const r = rngFor(account.id, "activity");
  const ri = intFn(r);
  const out: AccountActivityEntry[] = [];

  // 交易事件 — 取最近 20 笔
  for (const t of trades.slice(0, 20)) {
    out.push({
      id: `act_trade_${t.id}`,
      accountId: account.id,
      kind: "trade",
      title: `${t.type === "buy" ? "Buy" : "Sell"} ${t.symbol}`,
      description: `${t.volume} lots @ ${t.openPrice}${t.closePrice != null ? ` → ${t.closePrice}` : ""}`,
      highlight: t.profit != null ? `${t.profit >= 0 ? "+" : ""}$${t.profit}` : "Open",
      severity: t.profit != null ? (t.profit >= 0 ? "success" : "danger") : "info",
      timestamp: t.closeTime ?? t.openTime,
      metadata: { tradeId: t.id, symbol: t.symbol },
    });
  }

  // 资金事件 — 全量
  for (const f of flow) {
    out.push({
      id: `act_fund_${f.id}`,
      accountId: account.id,
      kind: "fund",
      title: f.description,
      description: "Account balance changed",
      highlight: `${f.amount >= 0 ? "+" : ""}${account.currency === "USD" ? "$" : ""}${Math.abs(f.amount).toLocaleString()}`,
      severity: f.amount >= 0 ? "success" : "info",
      timestamp: f.timestamp,
      metadata: { flowId: f.id, kind: f.type },
    });
  }

  // 控制变更事件 — 全量
  for (const log of controlLogs) {
    const def = CONTROL_KEYS.find((c) => c.key === log.controlKey);
    out.push({
      id: `act_ctrl_${log.id}`,
      accountId: account.id,
      kind: "control",
      title: `${def?.label ?? log.controlKey} changed`,
      description: `${log.oldValue} → ${log.newValue} · ${log.reason}`,
      highlight: log.newValue,
      severity: "warning",
      operator: log.operator,
      timestamp: log.timestamp,
      metadata: { controlLogId: log.id },
    });
  }

  // 合成登录事件
  for (let i = 0; i < 6; i++) {
    out.push({
      id: `act_login_${account.id.slice(-6)}_${i}`,
      accountId: account.id,
      kind: "login",
      title: "MT terminal login",
      description: `IP ${ri(1, 223)}.${ri(0, 255)}.${ri(0, 255)}.${ri(1, 254)}`,
      severity: i === 0 ? "info" : "info",
      timestamp: new Date(Date.now() - (i * ri(8, 36) + ri(0, 8)) * 3600_000).toISOString(),
    });
  }

  // 合成风险事件
  if (account.status !== "active" || account.marginLevel === "—") {
    out.push({
      id: `act_risk_${account.id.slice(-6)}_status`,
      accountId: account.id,
      kind: "risk",
      title: account.status === "disabled" ? "Account disabled" : "Margin alert triggered",
      description: "Auto-detected by risk engine",
      severity: account.status === "disabled" ? "danger" : "warning",
      timestamp: new Date(Date.now() - ri(12, 168) * 3600_000).toISOString(),
    });
  }

  return out.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function mockAccountPermissions(account: TradingAccount): AccountPermissions {
  const r = rngFor(account.id, "perms");
  return {
    accountId: account.id,
    ibCode: r() < 0.6 ? `IB-${hashSeed(account.id).toString(36).slice(0, 6).toUpperCase()}` : undefined,
    salesAgent: r() < 0.7 ? rpick(r, STAFF_FOR_CONTROLS) : undefined,
    visibleToTeams: r() < 0.3 ? ["Risk", "Compliance", "Sales"] : ["Risk", "Sales"],
    selfServiceWithdrawal: r() < 0.6,
    selfServiceTransfer: r() < 0.4,
    selfServiceLeverageChange: r() < 0.3,
  };
}

export function mockAccountSecurity(account: TradingAccount): AccountSecurity {
  const r = rngFor(account.id, "sec");
  const ri = intFn(r);
  return {
    accountId: account.id,
    twoFactorEnabled: r() < 0.55,
    ipWhitelist: r() < 0.2
      ? Array.from({ length: ri(1, 3) }, () => `${ri(1, 223)}.${ri(0, 255)}.${ri(0, 255)}.0/24`)
      : [],
    apiKeysCount: r() < 0.2 ? ri(1, 4) : 0,
    passwordLastChangedAt: r() < 0.8
      ? new Date(Date.now() - ri(7, 365) * 86400_000).toISOString()
      : undefined,
    failedLoginsLast24h: r() < 0.3 ? ri(1, 8) : 0,
  };
}

export function mockPendingOrders(account: TradingAccount, count?: number): PendingOrder[] {
  if (account.status !== "active") return [];
  const r = rngFor(account.id, "pending");
  const rf = floatFn(r), ri = intFn(r);
  const n = count ?? ri(0, 4);
  const out: PendingOrder[] = [];
  for (let i = 0; i < n; i++) {
    const symbol = weightedPick(r, POSITION_SYMBOLS);
    const [low, high] = SYMBOL_PRICE_BANDS[symbol] ?? [1, 1.5];
    const price = Number(rf(low, high).toFixed(symbol.startsWith("BTC") ? 0 : 5));
    out.push({
      id: `mock_pend_${account.id.slice(-8)}_${i}`,
      symbol,
      orderType: weightedPick(r, PENDING_KINDS),
      volume: Number(rf(0.01, 2).toFixed(2)),
      price,
      stopLoss: r() < 0.5 ? Number((price * 0.98).toFixed(5)) : undefined,
      takeProfit: r() < 0.6 ? Number((price * 1.03).toFixed(5)) : undefined,
      placedAt: new Date(Date.now() - ri(1, 168) * 3600_000).toISOString(),
      expiresAt: r() < 0.7 ? new Date(Date.now() + ri(1, 30) * 86400_000).toISOString() : undefined,
    });
  }
  return out;
}
