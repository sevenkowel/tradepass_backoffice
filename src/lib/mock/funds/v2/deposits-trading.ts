/**
 * Funds v2 — Trading Account Deposit money requests
 *
 * Source: client wallet (internal) OR external (direct in).
 * Internal path: 1 step (Finance pushes to MT, Treasury skipped).
 * External direct: 2 steps (Treasury confirms external receipt → Finance pushes to MT).
 */

import {
  clients, mtAccountsByClient, NOW, isoMinusMin,
  type ClientLite, type MTAccount,
} from "./entities";
import {
  STEP_TEMPLATES,
  type ApprovalStep, type MoneyRequestStatus, type TimelineEvent,
} from "./approvals";

export type TradingDepositSource = "Wallet (Internal)" | "External Direct";

export interface TradingDeposit {
  id: string;
  client: ClientLite;
  mtAccount: MTAccount;
  source: TradingDepositSource;
  /** When source = External Direct, this is the inbound channel. */
  channelId?: string;
  merchantName?: string;
  merchantOrderId?: string;
  amount: number;
  currency: string;
  amountUsd: number;
  /** For internal transfers, the FX rate used (1.0 for same-currency). */
  fxRate?: number;
  /** MT transaction id returned by MT5 Manager (populated after Step 2). */
  mtTransactionId?: string;
  fee: { amount: number; paidBy: "Client" | "Broker" };
  steps: ApprovalStep[];
  status: MoneyRequestStatus;
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  signals: { key: string; label: string; severity: "warn" | "error" | "info"; detail?: string }[];
  policyChecks: { key: string; label: string; passed: boolean; detail?: string }[];
  submittedAt: string;
  slaMinutes: number;
  slaElapsedMinutes: number;
  timeline: TimelineEvent[];
  internalNotes: string[];
}

function client(id: string) { return clients.find((c) => c.id === id)!; }
function mt(id: string, clientId: string): MTAccount {
  const list = mtAccountsByClient(clientId);
  return list.find((a) => a.id === id) ?? list[0];
}

function resolveSteps(actions: { stepKey: string; state: ApprovalStep["state"]; actorId?: string; outcome?: string; at?: string }[]): ApprovalStep[] {
  return STEP_TEMPLATES["Trading Deposit"].map((tpl) => {
    const a = actions.find((x) => x.stepKey === tpl.key);
    if (!a) return { ...tpl };
    return { ...tpl, state: a.state, actorId: a.actorId, outcome: a.outcome, at: a.at };
  });
}

export const mockTradingDeposits: TradingDeposit[] = [
  /* 1. Internal Wallet→MT, completed (Step 1 skipped) */
  {
    id: "TD-2026-0001",
    client: client("USR-12345"),
    mtAccount: mt("MT5-100012", "USR-12345"),
    source: "Wallet (Internal)",
    amount: 500, currency: "USD", amountUsd: 500, fxRate: 1.0,
    mtTransactionId: "MT5-DEP-92201",
    fee: { amount: 0, paidBy: "Broker" },
    steps: [
      { ...STEP_TEMPLATES["Trading Deposit"][0], state: "skipped", outcome: "Internal — no external receipt" },
      { ...STEP_TEMPLATES["Trading Deposit"][1], state: "done", actorId: "fin_001",
        outcome: "MT5 Manager confirmed credit", at: isoMinusMin(8) },
    ],
    status: "Completed",
    riskLevel: "Low",
    signals: [],
    policyChecks: [
      { key: "wallet_balance", label: "Wallet balance sufficient", passed: true },
      { key: "tier_limit", label: "Tier2 daily limit OK", passed: true },
    ],
    submittedAt: isoMinusMin(10), slaMinutes: 15, slaElapsedMinutes: 2,
    timeline: [
      { at: isoMinusMin(10), text: "Internal transfer initiated by client", kind: "info" },
      { at: isoMinusMin(8), text: "Posted to MT5-100012 (Step 2 by fin_001)", by: "fin_001" },
    ],
    internalNotes: [],
  },

  /* 2. External Direct (Bank → MT directly), pending Step 1 */
  {
    id: "TD-2026-0002",
    client: client("USR-78901"),
    mtAccount: mt("MT4-200001", "USR-78901"),
    source: "External Direct",
    channelId: "TC-BANK-DIRECT",
    merchantName: "Wise Global Settlement",
    merchantOrderId: "WISE-JP-99B22",
    amount: 50_000, currency: "USD", amountUsd: 50_000,
    fee: { amount: 25, paidBy: "Client" },
    steps: resolveSteps([
      { stepKey: "treasury_confirm", state: "in_progress" },
    ]),
    status: "Pending",
    riskLevel: "Low",
    signals: [
      { key: "external_direct_large", label: "External direct $50k — requires Treasury confirmation",
        severity: "info", detail: "Skipping wallet bypasses normal AML checks; Compliance also informed." },
    ],
    policyChecks: [
      { key: "kyc_tier", label: "External direct requires Tier3 (VIP)", passed: true },
      { key: "amount_limit", label: "Tier3 daily limit $1M", passed: true },
    ],
    submittedAt: isoMinusMin(20), slaMinutes: 60, slaElapsedMinutes: 20,
    timeline: [
      { at: isoMinusMin(20), text: "Bank wire received from Yuki Tanaka", by: "system" },
      { at: isoMinusMin(20), text: "Routed to Treasury — external direct (skipping wallet)", by: "system" },
    ],
    internalNotes: ["VIP client — Treasury Daytime desk prioritized."],
  },

  /* 3. Internal Wallet→MT, USDT (cross-currency) */
  {
    id: "TD-2026-0003",
    client: client("USR-78901"),
    mtAccount: mt("TP-300001", "USR-78901"),
    source: "Wallet (Internal)",
    amount: 5000, currency: "USDT", amountUsd: 5000, fxRate: 1.0,
    mtTransactionId: "TP-DEP-44C09",
    fee: { amount: 0, paidBy: "Broker" },
    steps: [
      { ...STEP_TEMPLATES["Trading Deposit"][0], state: "skipped" },
      { ...STEP_TEMPLATES["Trading Deposit"][1], state: "done", actorId: "fin_002",
        outcome: "TradePass credit confirmed", at: isoMinusMin(15) },
    ],
    status: "Completed",
    riskLevel: "Low",
    signals: [],
    policyChecks: [
      { key: "wallet_balance", label: "USDT wallet balance OK", passed: true },
    ],
    submittedAt: isoMinusMin(16), slaMinutes: 15, slaElapsedMinutes: 1,
    timeline: [
      { at: isoMinusMin(16), text: "USDT internal transfer initiated", kind: "info" },
      { at: isoMinusMin(15), text: "Credited to TradePass account", by: "fin_002" },
    ],
    internalNotes: [],
  },

  /* 4. Internal · pending Step 2 (Finance hasn't pushed yet) */
  {
    id: "TD-2026-0004",
    client: client("USR-23456"),
    mtAccount: mt("MT5-100013", "USR-23456"),
    source: "Wallet (Internal)",
    amount: 800, currency: "USD", amountUsd: 800, fxRate: 1.0,
    fee: { amount: 0, paidBy: "Broker" },
    steps: [
      { ...STEP_TEMPLATES["Trading Deposit"][0], state: "skipped" },
      { ...STEP_TEMPLATES["Trading Deposit"][1], state: "in_progress" },
    ],
    status: "Pending",
    riskLevel: "Low",
    signals: [],
    policyChecks: [
      { key: "wallet_balance", label: "Wallet balance sufficient", passed: true },
    ],
    submittedAt: isoMinusMin(3), slaMinutes: 15, slaElapsedMinutes: 3,
    timeline: [
      { at: isoMinusMin(3), text: "Internal transfer initiated", kind: "info" },
      { at: isoMinusMin(3), text: "Awaiting Finance push to MT5", by: "system" },
    ],
    internalNotes: [],
  },

  /* 5. External direct — failed MT push */
  {
    id: "TD-2026-0005",
    client: client("USR-56789"),
    mtAccount: mt("MT5-100016", "USR-56789"),
    source: "External Direct",
    channelId: "TC-USDT-DIRECT",
    merchantName: "Tron Network", merchantOrderId: "TRX-USR56789-228",
    amount: 5000, currency: "USDT", amountUsd: 5000,
    fee: { amount: 0, paidBy: "Broker" },
    steps: [
      { ...STEP_TEMPLATES["Trading Deposit"][0], state: "done", actorId: "trs_001",
        outcome: "USDT received on-chain (6/6 confirms)", at: isoMinusMin(40) },
      { ...STEP_TEMPLATES["Trading Deposit"][1], state: "rejected", actorId: "fin_002",
        outcome: "MT5 account suspended — cannot deposit", at: isoMinusMin(30) },
    ],
    status: "Rejected",
    riskLevel: "Medium",
    signals: [
      { key: "mt_suspended", label: "MT5 account suspended (regulatory hold)", severity: "error" },
    ],
    policyChecks: [],
    submittedAt: isoMinusMin(45), slaMinutes: 60, slaElapsedMinutes: 30,
    timeline: [
      { at: isoMinusMin(45), text: "USDT received on-chain", by: "system" },
      { at: isoMinusMin(40), text: "Treasury confirmed receipt", by: "trs_001" },
      { at: isoMinusMin(30), text: "MT5 push failed: account suspended", by: "fin_002", kind: "error" },
      { at: isoMinusMin(29), text: "USDT refunded to wallet (offset adjustment ADJ-2026-100)", by: "fin_002" },
    ],
    internalNotes: ["Account suspended pending CySEC review. Refunded to wallet."],
  },
];

export function tradingDepositStats(rows: TradingDeposit[]) {
  return {
    pending:      rows.filter((r) => r.status === "Pending" || r.status === "In Progress").length,
    onHold:       rows.filter((r) => r.status === "On Hold").length,
    completed24h: rows.filter((r) => r.status === "Completed").length,
    rejected24h:  rows.filter((r) => r.status === "Rejected").length,
    externalDirect: rows.filter((r) => r.source === "External Direct").length,
    overdue:      rows.filter((r) => (r.status === "Pending" || r.status === "In Progress") && r.slaElapsedMinutes > r.slaMinutes).length,
  };
}

export function findTradingDeposit(id: string): TradingDeposit | undefined {
  return mockTradingDeposits.find((r) => r.id === id);
}
