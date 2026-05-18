/**
 * Mock data — Withdrawals (extended)
 *
 * Scope: replaces the inline mock that used to live in
 * `src/app/crm/funds/withdrawal-review/page.tsx`. Adds the
 * forex-broker-specific fields the redesigned Withdrawals page needs:
 *
 *   - PnL source (Trading Profit / Deposit Balance / Bonus)
 *   - Margin impact (account-level state before/after the withdrawal)
 *   - Risk signals (Fast In-Out / High Profit / New Device / Velocity)
 *   - Policy checks (KYC tier limit, channel whitelist, first withdrawal)
 *   - Wallet type (Real / Bonus / Credit / Reward) + balance
 *   - Auto/Manual decision lane + automation status
 *   - AML status & score
 *
 * See `docscc/产品文档/2026-05-17-funds-module-design.md` §6.2 for the
 * page-level contract this data feeds.
 */

export type WithdrawalStatus =
  | "pending"
  | "reviewing"
  | "approved"
  | "processing"
  | "completed"
  | "rejected"
  | "on_hold";

export type WithdrawalChannel =
  | "USDT_TRC20"
  | "USDT_ERC20"
  | "BANK_WIRE"
  | "EWALLET_DOKU"
  | "CARD_VISA";

export type WalletType = "Real" | "Bonus" | "Credit" | "Reward";

export type RiskLevel = "Critical" | "High" | "Medium" | "Low";

export type AMLStatus = "Pass" | "Hit" | "Pending";

export type PnLSource = "Trading Profit" | "Deposit Balance" | "Bonus Conversion";

export type KYCTier = "Tier1" | "Tier2" | "Tier3";

export type AutoDecision = "Auto-Approved" | "Auto-Hold" | "Manual";

/** Account-level snapshot a Withdrawal might impact. */
export interface MarginSnapshot {
  mtAccountId: string;
  equity: number;
  openPositions: number;
  usedMargin: number;
  freeMargin: number;
  marginLevel: number;            // %
  /** Predicted margin level *after* this withdrawal is honored. */
  marginLevelAfter: number;       // %
}

export interface RiskSignal {
  key: "fast_in_out" | "high_profit" | "new_device" | "velocity" | "ip_anomaly";
  label: string;
  severity: "warn" | "error" | "info";
  detail?: string;
}

export interface PolicyCheck {
  key: "kyc_limit" | "channel" | "first_withdrawal" | "cooldown" | "country";
  label: string;
  passed: boolean;
  detail?: string;
}

export interface TimelineEntry {
  at: string;                     // ISO
  action: string;
  by?: string;
}

export interface WithdrawalRow {
  id: string;
  /* Client */
  userId: string;
  userName: string;
  kycTier: KYCTier;
  country: string;
  /* Money */
  amount: number;
  currency: string;
  channel: WithdrawalChannel;
  channelLabel: string;
  walletType: WalletType;
  walletBalance: number;
  /* Forex-specific */
  pnlSource: PnLSource;
  margin?: MarginSnapshot;
  /* Status */
  status: WithdrawalStatus;
  decision: AutoDecision;
  risk: RiskLevel;
  aml: AMLStatus;
  amlScore: number;               // 0-100
  riskSignals: RiskSignal[];
  policyChecks: PolicyCheck[];
  /* Workflow */
  assignedTo?: string;            // operator id; undefined = unassigned
  isFirstWithdrawal: boolean;
  /* SLA */
  submittedAt: string;            // ISO
  slaMinutes: number;             // SLA budget
  slaElapsedMinutes: number;
  /* History */
  history: TimelineEntry[];
  /* Optional */
  payoutAddress?: string;         // crypto
  bankAccount?: { bank: string; acctName: string; acctNumber: string };
  rejectionReason?: string;
  reviewer?: string;
}

/** Channel meta */
export const CHANNEL_META: Record<WithdrawalChannel, { label: string; icon: "crypto" | "bank" | "ewallet" | "card" }> = {
  USDT_TRC20:   { label: "USDT · TRC20", icon: "crypto" },
  USDT_ERC20:   { label: "USDT · ERC20", icon: "crypto" },
  BANK_WIRE:    { label: "Bank Wire",    icon: "bank" },
  EWALLET_DOKU: { label: "DOKU Wallet",  icon: "ewallet" },
  CARD_VISA:    { label: "Visa Card",    icon: "card" },
};

/** Status → dot + text color (matches CLM cases pattern). */
export const STATUS_FG: Record<WithdrawalStatus, { text: string; dot: string; label: string }> = {
  pending:    { text: "text-amber-700",   dot: "bg-amber-500",   label: "Pending"    },
  reviewing:  { text: "text-blue-700",    dot: "bg-blue-500",    label: "Reviewing"  },
  approved:   { text: "text-emerald-700", dot: "bg-emerald-500", label: "Approved"   },
  processing: { text: "text-violet-700",  dot: "bg-violet-500",  label: "Processing" },
  completed:  { text: "text-emerald-700", dot: "bg-emerald-500", label: "Completed"  },
  rejected:   { text: "text-red-700",     dot: "bg-red-500",     label: "Rejected"   },
  on_hold:    { text: "text-slate-600",   dot: "bg-slate-400",   label: "On Hold"    },
};

export const RISK_FG: Record<RiskLevel, { text: string; dot: string }> = {
  Critical: { text: "text-red-700",     dot: "bg-red-500"     },
  High:     { text: "text-orange-700",  dot: "bg-orange-500"  },
  Medium:   { text: "text-amber-700",   dot: "bg-amber-500"   },
  Low:      { text: "text-emerald-700", dot: "bg-emerald-500" },
};

export const AML_FG: Record<AMLStatus, { text: string; dot: string }> = {
  Pass:    { text: "text-emerald-700", dot: "bg-emerald-500" },
  Hit:     { text: "text-red-700",     dot: "bg-red-500"     },
  Pending: { text: "text-slate-600",   dot: "bg-slate-400"   },
};

export const PNL_FG: Record<PnLSource, { text: string; dot: string }> = {
  "Trading Profit":    { text: "text-orange-700", dot: "bg-orange-500" }, // suspicious-prone
  "Deposit Balance":   { text: "text-slate-600",  dot: "bg-slate-400"  },
  "Bonus Conversion":  { text: "text-violet-700", dot: "bg-violet-500" },
};

/** Cheap deterministic "now" — keeps mock stable for screenshot diffs. */
const NOW = new Date("2026-05-17T14:30:00.000Z");

function isoMinusMin(min: number): string {
  return new Date(NOW.getTime() - min * 60_000).toISOString();
}

/** Mock dataset — designed to hit every realistic Withdrawals scenario:
 *
 *  1. Critical · large · high-profit · pending     → forces human review
 *  2. Medium · normal client · auto-approved       → happy path
 *  3. Critical · first withdrawal · AML hit · hold → blocked
 *  4. Low · processing · clean profile             → already running
 *  5. High · margin impact -> 80% · pending        → trading-impact case
 *  6. Critical · fast-in-out · USDT                → AML-flag candidate
 *  7. Medium · completed                           → historical record
 *  8. High · rejected · prior history              → audit example
 *  9. Low · approved · bonus conversion            → bonus path
 * 10. Medium · auto-hold · velocity                → policy hit
 */
export const mockWithdrawals: WithdrawalRow[] = [
  {
    id: "WTH-00001",
    userId: "USR-12345",
    userName: "John Smith",
    kycTier: "Tier2",
    country: "US",
    amount: 15000,
    currency: "USD",
    channel: "BANK_WIRE",
    channelLabel: CHANNEL_META.BANK_WIRE.label,
    walletType: "Real",
    walletBalance: 15800,
    pnlSource: "Trading Profit",
    margin: {
      mtAccountId: "MT5-100012",
      equity: 16200,
      openPositions: 3,
      usedMargin: 4100,
      freeMargin: 12100,
      marginLevel: 395,
      marginLevelAfter: 29,
    },
    status: "pending",
    decision: "Manual",
    risk: "Critical",
    aml: "Pass",
    amlScore: 18,
    riskSignals: [
      { key: "high_profit", label: "High Profit · +$3,200 / 7d", severity: "warn",
        detail: "7-day PnL exceeds Tier2 high-profit threshold ($2,000)" },
    ],
    policyChecks: [
      { key: "kyc_limit", label: "Tier2 daily limit $20,000", passed: true,  detail: "Used today: $0" },
      { key: "channel",   label: "Channel BANK_WIRE allowed",  passed: true  },
      { key: "first_withdrawal", label: "Not first withdrawal", passed: true },
    ],
    assignedTo: undefined,
    isFirstWithdrawal: false,
    submittedAt: isoMinusMin(45),
    slaMinutes: 60,
    slaElapsedMinutes: 45,
    history: [
      { at: isoMinusMin(45), action: "Submitted by client" },
      { at: isoMinusMin(44), action: "Auto-check → routed to manual (large amount)" },
    ],
    bankAccount: { bank: "Chase Bank", acctName: "John Smith", acctNumber: "****4567" },
  },
  {
    id: "WTH-00002",
    userId: "USR-23456",
    userName: "Sarah Johnson",
    kycTier: "Tier2",
    country: "GB",
    amount: 800,
    currency: "USD",
    channel: "USDT_TRC20",
    channelLabel: CHANNEL_META.USDT_TRC20.label,
    walletType: "Real",
    walletBalance: 2400,
    pnlSource: "Deposit Balance",
    margin: {
      mtAccountId: "MT5-100013",
      equity: 1600,
      openPositions: 0,
      usedMargin: 0,
      freeMargin: 1600,
      marginLevel: 0,
      marginLevelAfter: 0,
    },
    status: "approved",
    decision: "Auto-Approved",
    risk: "Low",
    aml: "Pass",
    amlScore: 8,
    riskSignals: [],
    policyChecks: [
      { key: "kyc_limit",        label: "Tier2 daily limit $20,000", passed: true },
      { key: "channel",          label: "USDT TRC20 enabled",        passed: true },
      { key: "first_withdrawal", label: "Not first withdrawal",      passed: true },
      { key: "cooldown",         label: "Cooldown elapsed",          passed: true },
    ],
    assignedTo: "system",
    isFirstWithdrawal: false,
    submittedAt: isoMinusMin(8),
    slaMinutes: 60,
    slaElapsedMinutes: 8,
    history: [
      { at: isoMinusMin(8), action: "Submitted by client" },
      { at: isoMinusMin(8), action: "Auto-approval rules matched", by: "system" },
    ],
    payoutAddress: "TXbc12...5678",
  },
  {
    id: "WTH-00003",
    userId: "USR-34567",
    userName: "Michael Brown",
    kycTier: "Tier1",
    country: "RU",
    amount: 6500,
    currency: "USD",
    channel: "BANK_WIRE",
    channelLabel: CHANNEL_META.BANK_WIRE.label,
    walletType: "Real",
    walletBalance: 7000,
    pnlSource: "Trading Profit",
    margin: {
      mtAccountId: "MT5-100014",
      equity: 7100,
      openPositions: 1,
      usedMargin: 600,
      freeMargin: 6500,
      marginLevel: 1183,
      marginLevelAfter: 100,
    },
    status: "on_hold",
    decision: "Auto-Hold",
    risk: "Critical",
    aml: "Hit",
    amlScore: 87,
    riskSignals: [
      { key: "new_device", label: "New device · 4h ago", severity: "warn",
        detail: "Login from new fingerprint, last seen 14:23 UTC" },
      { key: "ip_anomaly", label: "IP anomaly · proxy detected", severity: "error" },
    ],
    policyChecks: [
      { key: "kyc_limit",        label: "Tier1 daily limit $1,000", passed: false,
        detail: "Requested $6,500 > Tier1 daily limit; upgrade required" },
      { key: "first_withdrawal", label: "First withdrawal · force manual", passed: false },
      { key: "country",          label: "Country RU on watch list",  passed: false },
    ],
    assignedTo: undefined,
    isFirstWithdrawal: true,
    submittedAt: isoMinusMin(150),
    slaMinutes: 120,
    slaElapsedMinutes: 150,
    history: [
      { at: isoMinusMin(150), action: "Submitted by client" },
      { at: isoMinusMin(150), action: "AML screening → HIT (score 87)", by: "system" },
      { at: isoMinusMin(149), action: "Auto-hold by policy (KYC tier + AML hit)", by: "system" },
    ],
    bankAccount: { bank: "Sberbank", acctName: "Michael Brown", acctNumber: "****8901" },
  },
  {
    id: "WTH-00004",
    userId: "USR-45678",
    userName: "Emma Wilson",
    kycTier: "Tier2",
    country: "AU",
    amount: 1200,
    currency: "USD",
    channel: "EWALLET_DOKU",
    channelLabel: CHANNEL_META.EWALLET_DOKU.label,
    walletType: "Real",
    walletBalance: 3500,
    pnlSource: "Deposit Balance",
    status: "processing",
    decision: "Manual",
    risk: "Low",
    aml: "Pass",
    amlScore: 12,
    riskSignals: [],
    policyChecks: [
      { key: "kyc_limit", label: "Tier2 daily limit $20,000", passed: true },
      { key: "channel",   label: "DOKU enabled in AU",        passed: true },
    ],
    assignedTo: "ops_001",
    isFirstWithdrawal: false,
    submittedAt: isoMinusMin(90),
    slaMinutes: 60,
    slaElapsedMinutes: 30,
    history: [
      { at: isoMinusMin(90), action: "Submitted" },
      { at: isoMinusMin(60), action: "Approved", by: "ops_001" },
      { at: isoMinusMin(59), action: "Sent to channel" },
    ],
    reviewer: "ops_001",
  },
  {
    id: "WTH-00005",
    userId: "USR-56789",
    userName: "Carlos Mendez",
    kycTier: "Tier2",
    country: "MX",
    amount: 4900,
    currency: "USD",
    channel: "BANK_WIRE",
    channelLabel: CHANNEL_META.BANK_WIRE.label,
    walletType: "Real",
    walletBalance: 5000,
    pnlSource: "Trading Profit",
    margin: {
      mtAccountId: "MT5-100016",
      equity: 5800,
      openPositions: 4,
      usedMargin: 4100,
      freeMargin: 1700,
      marginLevel: 141,
      marginLevelAfter: 80,
    },
    status: "pending",
    decision: "Manual",
    risk: "High",
    aml: "Pass",
    amlScore: 22,
    riskSignals: [
      { key: "high_profit", label: "High Profit · +$1,800 / 7d", severity: "warn" },
    ],
    policyChecks: [
      { key: "kyc_limit", label: "Tier2 daily limit $20,000", passed: true },
      { key: "channel",   label: "Bank wire allowed",          passed: true },
    ],
    assignedTo: "ops_002",
    isFirstWithdrawal: false,
    submittedAt: isoMinusMin(25),
    slaMinutes: 60,
    slaElapsedMinutes: 25,
    history: [
      { at: isoMinusMin(25), action: "Submitted" },
      { at: isoMinusMin(24), action: "Margin impact warning surfaced", by: "system" },
    ],
    bankAccount: { bank: "BBVA Mexico", acctName: "Carlos Mendez", acctNumber: "****2233" },
  },
  {
    id: "WTH-00006",
    userId: "USR-67890",
    userName: "Vu Nguyen",
    kycTier: "Tier2",
    country: "VN",
    amount: 2200,
    currency: "USD",
    channel: "USDT_TRC20",
    channelLabel: CHANNEL_META.USDT_TRC20.label,
    walletType: "Real",
    walletBalance: 2300,
    pnlSource: "Trading Profit",
    margin: {
      mtAccountId: "MT5-100017",
      equity: 2300,
      openPositions: 0,
      usedMargin: 0,
      freeMargin: 2300,
      marginLevel: 0,
      marginLevelAfter: 0,
    },
    status: "reviewing",
    decision: "Manual",
    risk: "Critical",
    aml: "Pending",
    amlScore: 65,
    riskSignals: [
      { key: "fast_in_out", label: "Fast In-Out · deposit 2h ago", severity: "error",
        detail: "Client deposited $2,000 USDT 2h before this withdrawal" },
      { key: "velocity",    label: "Velocity · 3 withdrawals / 24h", severity: "warn" },
    ],
    policyChecks: [
      { key: "kyc_limit", label: "Tier2 daily limit $20,000", passed: true },
      { key: "channel",   label: "USDT TRC20 enabled",         passed: true },
      { key: "cooldown",  label: "Cooldown elapsed",           passed: true },
    ],
    assignedTo: "ops_002",
    isFirstWithdrawal: false,
    submittedAt: isoMinusMin(70),
    slaMinutes: 60,
    slaElapsedMinutes: 70,
    history: [
      { at: isoMinusMin(70), action: "Submitted" },
      { at: isoMinusMin(69), action: "Fast-In-Out triggered → manual", by: "system" },
      { at: isoMinusMin(20), action: "Picked up", by: "ops_002" },
    ],
    payoutAddress: "TXfa98...4422",
  },
  {
    id: "WTH-00007",
    userId: "USR-78901",
    userName: "Yuki Tanaka",
    kycTier: "Tier3",
    country: "JP",
    amount: 8500,
    currency: "USD",
    channel: "BANK_WIRE",
    channelLabel: CHANNEL_META.BANK_WIRE.label,
    walletType: "Real",
    walletBalance: 12000,
    pnlSource: "Deposit Balance",
    status: "completed",
    decision: "Auto-Approved",
    risk: "Low",
    aml: "Pass",
    amlScore: 6,
    riskSignals: [],
    policyChecks: [
      { key: "kyc_limit", label: "Tier3 daily limit $100,000", passed: true },
      { key: "channel",   label: "Bank wire allowed",           passed: true },
    ],
    assignedTo: "system",
    isFirstWithdrawal: false,
    submittedAt: isoMinusMin(1440),
    slaMinutes: 60,
    slaElapsedMinutes: 60,
    history: [
      { at: isoMinusMin(1440), action: "Submitted" },
      { at: isoMinusMin(1440), action: "Auto-approved", by: "system" },
      { at: isoMinusMin(1380), action: "Completed (channel confirmed)" },
    ],
    bankAccount: { bank: "MUFG Bank", acctName: "Yuki Tanaka", acctNumber: "****1122" },
  },
  {
    id: "WTH-00008",
    userId: "USR-89012",
    userName: "Lisa Chen",
    kycTier: "Tier1",
    country: "TW",
    amount: 600,
    currency: "USD",
    channel: "BANK_WIRE",
    channelLabel: CHANNEL_META.BANK_WIRE.label,
    walletType: "Real",
    walletBalance: 700,
    pnlSource: "Deposit Balance",
    status: "rejected",
    decision: "Manual",
    risk: "High",
    aml: "Pass",
    amlScore: 30,
    riskSignals: [
      { key: "ip_anomaly", label: "IP anomaly · vpn", severity: "warn" },
    ],
    policyChecks: [
      { key: "kyc_limit", label: "Tier1 daily limit $1,000", passed: true },
      { key: "channel",   label: "Bank info mismatch",        passed: false,
        detail: "Bank account holder does not match KYC name" },
    ],
    assignedTo: "ops_001",
    isFirstWithdrawal: false,
    submittedAt: isoMinusMin(2880),
    slaMinutes: 60,
    slaElapsedMinutes: 90,
    history: [
      { at: isoMinusMin(2880), action: "Submitted" },
      { at: isoMinusMin(2810), action: "Rejected — bank name mismatch", by: "ops_001" },
    ],
    bankAccount: { bank: "CTBC Bank", acctName: "Lisa C.", acctNumber: "****6677" },
    rejectionReason: "Bank account holder name does not match KYC name",
    reviewer: "ops_001",
  },
  {
    id: "WTH-00009",
    userId: "USR-90123",
    userName: "Aisha Khan",
    kycTier: "Tier2",
    country: "AE",
    amount: 300,
    currency: "USD",
    channel: "USDT_TRC20",
    channelLabel: CHANNEL_META.USDT_TRC20.label,
    walletType: "Bonus",
    walletBalance: 320,
    pnlSource: "Bonus Conversion",
    status: "approved",
    decision: "Manual",
    risk: "Low",
    aml: "Pass",
    amlScore: 10,
    riskSignals: [],
    policyChecks: [
      { key: "kyc_limit", label: "Tier2 daily limit $20,000",         passed: true },
      { key: "channel",   label: "Bonus wallet → USDT requires manual", passed: true },
    ],
    assignedTo: "ops_001",
    isFirstWithdrawal: false,
    submittedAt: isoMinusMin(120),
    slaMinutes: 60,
    slaElapsedMinutes: 30,
    history: [
      { at: isoMinusMin(120), action: "Submitted (Bonus wallet)" },
      { at: isoMinusMin(90),  action: "Approved", by: "ops_001" },
    ],
    payoutAddress: "TXbz55...9911",
  },
  {
    id: "WTH-00010",
    userId: "USR-01234",
    userName: "Andre Silva",
    kycTier: "Tier2",
    country: "BR",
    amount: 3000,
    currency: "USD",
    channel: "BANK_WIRE",
    channelLabel: CHANNEL_META.BANK_WIRE.label,
    walletType: "Real",
    walletBalance: 3100,
    pnlSource: "Trading Profit",
    margin: {
      mtAccountId: "MT5-100018",
      equity: 3100,
      openPositions: 2,
      usedMargin: 800,
      freeMargin: 2300,
      marginLevel: 388,
      marginLevelAfter: 12,
    },
    status: "on_hold",
    decision: "Auto-Hold",
    risk: "Medium",
    aml: "Pass",
    amlScore: 25,
    riskSignals: [
      { key: "velocity",     label: "Velocity · 5 withdrawals / 24h", severity: "warn" },
      { key: "high_profit",  label: "High Profit · +$900 / 24h",       severity: "warn" },
    ],
    policyChecks: [
      { key: "kyc_limit", label: "Tier2 daily limit $20,000", passed: true },
      { key: "cooldown",  label: "Cooldown · 30m remaining",   passed: false,
        detail: "Last withdrawal 30 minutes ago — cooldown 60m" },
    ],
    assignedTo: undefined,
    isFirstWithdrawal: false,
    submittedAt: isoMinusMin(20),
    slaMinutes: 60,
    slaElapsedMinutes: 20,
    history: [
      { at: isoMinusMin(20), action: "Submitted" },
      { at: isoMinusMin(20), action: "Auto-hold (cooldown not elapsed)", by: "system" },
    ],
    bankAccount: { bank: "Itaú", acctName: "Andre Silva", acctNumber: "****3344" },
  },
];

/** Quick aggregate helpers (kept here so the page only imports data). */
export function statsFor(rows: WithdrawalRow[], myOperatorId: string) {
  const mineCount      = rows.filter((r) => r.assignedTo === myOperatorId && isOpen(r.status)).length;
  const overdueCount   = rows.filter((r) => isOpen(r.status) && r.slaElapsedMinutes > r.slaMinutes).length;
  const criticalCount  = rows.filter((r) => isOpen(r.status) && r.risk === "Critical").length;
  const autoFailedCount = rows.filter((r) => r.decision === "Auto-Hold" && isOpen(r.status)).length;
  return { mineCount, overdueCount, criticalCount, autoFailedCount };
}

export function isOpen(s: WithdrawalStatus): boolean {
  return s === "pending" || s === "reviewing" || s === "on_hold";
}
