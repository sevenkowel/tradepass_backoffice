/**
 * Mock data — Deposits (extended for the funds module redesign)
 *
 * Replaces the inline ad-hoc data inside the old `/funds/deposits` page.
 * Adds the forex-broker-specific surfaces we need:
 *
 *   - Auto-match confidence (bank reference matching, crypto confirms)
 *   - Channel × confirmation-count for crypto
 *   - Velocity / duplicate detection signals
 *   - Risk score + AML state
 *
 * Spec: `docscc/产品文档/2026-05-17-funds-module-design.md` §6.3
 */

export type DepositStatus =
  | "pending_match"        // waiting to be associated with a client / order
  | "pending_confirmation" // on-chain or bank ack pending
  | "auto_matched"
  | "completed"
  | "failed"
  | "expired";

export type DepositChannel =
  | "USDT_TRC20"
  | "USDT_ERC20"
  | "BANK_WIRE"
  | "EWALLET_DOKU"
  | "CARD_VISA";

export type RiskLevel = "Critical" | "High" | "Medium" | "Low";

export type AMLStatus = "Pass" | "Hit" | "Pending";

export interface DepositRow {
  id: string;
  /* Client (may be undefined for unmatched bank wires) */
  userId?: string;
  userName?: string;
  /* Money */
  amount: number;
  currency: string;
  channel: DepositChannel;
  channelLabel: string;
  /* Auto match */
  status: DepositStatus;
  decision: "Auto" | "Manual";
  /** 0-100 — only meaningful for `pending_match` / `auto_matched`. */
  matchConfidence?: number;
  /** Crypto: confirmation count (e.g. "3/6"). */
  cryptoConfirms?: { current: number; required: number };
  /** Bank: free-text memo / reference. */
  bankReference?: string;
  /* Risk */
  risk: RiskLevel;
  aml: AMLStatus;
  amlScore: number;
  signals: DepositSignal[];
  /* Timeline */
  submittedAt: string;
  /* Optional */
  txHash?: string;
  fromAddress?: string;
}

export interface DepositSignal {
  key: "duplicate" | "velocity" | "amount" | "aml_wallet" | "memo_missing";
  label: string;
  severity: "warn" | "error";
  detail?: string;
}

export const DEPOSIT_CHANNEL_META: Record<DepositChannel, { label: string }> = {
  USDT_TRC20:   { label: "USDT · TRC20" },
  USDT_ERC20:   { label: "USDT · ERC20" },
  BANK_WIRE:    { label: "Bank Wire" },
  EWALLET_DOKU: { label: "DOKU Wallet" },
  CARD_VISA:    { label: "Visa Card" },
};

export const DEPOSIT_STATUS_FG: Record<DepositStatus, { text: string; dot: string; label: string }> = {
  pending_match:        { text: "text-amber-700",  dot: "bg-amber-500",  label: "Pending match" },
  pending_confirmation: { text: "text-blue-700",   dot: "bg-blue-500",   label: "Pending confirmation" },
  auto_matched:         { text: "text-emerald-700",dot: "bg-emerald-500",label: "Auto matched" },
  completed:            { text: "text-emerald-700",dot: "bg-emerald-500",label: "Completed" },
  failed:               { text: "text-red-700",    dot: "bg-red-500",    label: "Failed" },
  expired:              { text: "text-slate-500",  dot: "bg-slate-400",  label: "Expired" },
};

export const DEPOSIT_RISK_FG: Record<RiskLevel, { text: string; dot: string }> = {
  Critical: { text: "text-red-700",     dot: "bg-red-500"     },
  High:     { text: "text-orange-700",  dot: "bg-orange-500"  },
  Medium:   { text: "text-amber-700",   dot: "bg-amber-500"   },
  Low:      { text: "text-emerald-700", dot: "bg-emerald-500" },
};

export const DEPOSIT_AML_FG: Record<AMLStatus, { text: string; dot: string }> = {
  Pass:    { text: "text-emerald-700", dot: "bg-emerald-500" },
  Hit:     { text: "text-red-700",     dot: "bg-red-500"     },
  Pending: { text: "text-slate-600",   dot: "bg-slate-400"   },
};

const NOW = new Date("2026-05-17T14:30:00.000Z");
function isoMinusMin(min: number): string {
  return new Date(NOW.getTime() - min * 60_000).toISOString();
}

export const mockDeposits: DepositRow[] = [
  {
    id: "DEP-00001",
    userId: "USR-12345",
    userName: "John Smith",
    amount: 2500, currency: "USD",
    channel: "USDT_TRC20", channelLabel: DEPOSIT_CHANNEL_META.USDT_TRC20.label,
    status: "auto_matched",
    decision: "Auto",
    matchConfidence: 98,
    cryptoConfirms: { current: 6, required: 6 },
    risk: "Low",  aml: "Pass", amlScore: 10,
    signals: [],
    submittedAt: isoMinusMin(8),
    txHash: "0xabc12...8821",
    fromAddress: "TXbc...5678",
  },
  {
    id: "DEP-00002",
    amount: 4800, currency: "USD",
    channel: "BANK_WIRE", channelLabel: DEPOSIT_CHANNEL_META.BANK_WIRE.label,
    status: "pending_match",
    decision: "Manual",
    matchConfidence: 64,
    bankReference: "ORDER 12 4 5 SMITH",
    risk: "Medium", aml: "Pass", amlScore: 28,
    signals: [
      { key: "memo_missing", label: "Memo missing UID", severity: "warn",
        detail: "Bank reference does not contain a client UID, fuzzy match only" },
    ],
    submittedAt: isoMinusMin(15),
  },
  {
    id: "DEP-00003",
    userId: "USR-23456", userName: "Sarah Johnson",
    amount: 600, currency: "USD",
    channel: "USDT_TRC20", channelLabel: DEPOSIT_CHANNEL_META.USDT_TRC20.label,
    status: "pending_confirmation",
    decision: "Auto",
    cryptoConfirms: { current: 3, required: 6 },
    risk: "Low",  aml: "Pass", amlScore: 12,
    signals: [],
    submittedAt: isoMinusMin(4),
    txHash: "0xdf991...22aa",
    fromAddress: "TXza...4422",
  },
  {
    id: "DEP-00004",
    userId: "USR-34567", userName: "Michael Brown",
    amount: 12_500, currency: "USD",
    channel: "BANK_WIRE", channelLabel: DEPOSIT_CHANNEL_META.BANK_WIRE.label,
    status: "auto_matched",
    decision: "Manual",
    matchConfidence: 91,
    bankReference: "USR34567 DEP",
    risk: "High", aml: "Pending", amlScore: 60,
    signals: [
      { key: "amount", label: "Large deposit · $12.5k", severity: "warn" },
    ],
    submittedAt: isoMinusMin(45),
  },
  {
    id: "DEP-00005",
    userId: "USR-67890", userName: "Vu Nguyen",
    amount: 2000, currency: "USD",
    channel: "USDT_TRC20", channelLabel: DEPOSIT_CHANNEL_META.USDT_TRC20.label,
    status: "completed",
    decision: "Auto",
    matchConfidence: 100,
    cryptoConfirms: { current: 6, required: 6 },
    risk: "Critical", aml: "Pass", amlScore: 22,
    signals: [
      { key: "velocity", label: "Velocity · 3 deposits / 24h", severity: "warn" },
    ],
    submittedAt: isoMinusMin(150),
    txHash: "0xee011...44bb",
    fromAddress: "TXfa...4422",
  },
  {
    id: "DEP-00006",
    userId: "USR-90123", userName: "Aisha Khan",
    amount: 80_000, currency: "USD",
    channel: "USDT_ERC20", channelLabel: DEPOSIT_CHANNEL_META.USDT_ERC20.label,
    status: "pending_confirmation",
    decision: "Manual",
    cryptoConfirms: { current: 7, required: 12 },
    risk: "Critical", aml: "Hit", amlScore: 78,
    signals: [
      { key: "aml_wallet", label: "Wallet screening hit", severity: "error",
        detail: "Source wallet linked to mixer (Chainalysis Severe)" },
      { key: "amount",     label: "Large deposit · $80k", severity: "warn" },
    ],
    submittedAt: isoMinusMin(35),
    txHash: "0xff992...77cc",
    fromAddress: "0x9aa1...8821",
  },
  {
    id: "DEP-00007",
    amount: 350, currency: "USD",
    channel: "BANK_WIRE", channelLabel: DEPOSIT_CHANNEL_META.BANK_WIRE.label,
    status: "expired",
    decision: "Manual",
    matchConfidence: 22,
    bankReference: "transfer",
    risk: "Low", aml: "Pass", amlScore: 15,
    signals: [
      { key: "memo_missing", label: "Memo missing UID", severity: "warn" },
    ],
    submittedAt: isoMinusMin(2880),
  },
  {
    id: "DEP-00008",
    userId: "USR-78901", userName: "Yuki Tanaka",
    amount: 5000, currency: "USD",
    channel: "EWALLET_DOKU", channelLabel: DEPOSIT_CHANNEL_META.EWALLET_DOKU.label,
    status: "completed",
    decision: "Auto",
    matchConfidence: 100,
    risk: "Low", aml: "Pass", amlScore: 8,
    signals: [],
    submittedAt: isoMinusMin(1440),
  },
  {
    id: "DEP-00009",
    userId: "USR-01234", userName: "Andre Silva",
    amount: 1200, currency: "USD",
    channel: "CARD_VISA", channelLabel: DEPOSIT_CHANNEL_META.CARD_VISA.label,
    status: "failed",
    decision: "Auto",
    risk: "Medium", aml: "Pass", amlScore: 22,
    signals: [
      { key: "duplicate", label: "Duplicate amount within 1h", severity: "warn",
        detail: "Same client, same amount, 12 minutes earlier (declined)" },
    ],
    submittedAt: isoMinusMin(180),
  },
  {
    id: "DEP-00010",
    userId: "USR-11111", userName: "Test Acc",
    amount: 50, currency: "USD",
    channel: "USDT_TRC20", channelLabel: DEPOSIT_CHANNEL_META.USDT_TRC20.label,
    status: "pending_confirmation",
    decision: "Auto",
    cryptoConfirms: { current: 1, required: 6 },
    risk: "Low", aml: "Pass", amlScore: 5,
    signals: [],
    submittedAt: isoMinusMin(2),
    txHash: "0xaa771...11dd",
    fromAddress: "TXcc...0099",
  },
];

export function depositStats(rows: DepositRow[]) {
  return {
    pendingMatch:   rows.filter((r) => r.status === "pending_match").length,
    pendingConfirm: rows.filter((r) => r.status === "pending_confirmation").length,
    autoMatched:    rows.filter((r) => r.status === "auto_matched").length,
    failed:         rows.filter((r) => r.status === "failed" || r.status === "expired").length,
  };
}
