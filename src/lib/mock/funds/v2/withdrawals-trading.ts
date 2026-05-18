/**
 * Funds v2 — Trading Account Withdrawal money requests
 *
 * Source: MT account. Destination: client wallet (internal) OR external direct.
 * 2 steps: Finance verifies margin/positions/KYC → Treasury executes payout.
 */

import {
  clients, mtAccountsByClient, NOW, isoMinusMin,
  type ClientLite, type MTAccount,
} from "./entities";
import {
  STEP_TEMPLATES,
  type ApprovalStep, type MoneyRequestStatus, type TimelineEvent,
} from "./approvals";

export type TradingWithdrawalDest = "Wallet (Internal)" | "External Direct";

export interface TradingWithdrawal {
  id: string;
  client: ClientLite;
  mtAccount: MTAccount;
  destination: TradingWithdrawalDest;
  channelId?: string;       // when destination is External Direct
  merchantName?: string;
  merchantOrderId?: string;
  channelReference?: string;
  amount: number;
  currency: string;
  amountUsd: number;
  /** Withdrawable amount calculated per current formula (Preset B default). */
  withdrawable: number;
  /** Formula used (so audit shows traceability). */
  formulaUsed: "Preset A: Conservative" | "Preset B: Free Margin + Stop-Out" | "Preset C: Closed Realized Only" | "Preset D: Available Balance" | "Custom DSL";
  /** Predicted margin level after this withdrawal (key risk indicator). */
  marginLevelBefore: number;
  marginLevelAfter: number;
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
  return STEP_TEMPLATES["Trading Withdrawal"].map((tpl) => {
    const a = actions.find((x) => x.stepKey === tpl.key);
    if (!a) return { ...tpl };
    return { ...tpl, state: a.state, actorId: a.actorId, outcome: a.outcome, at: a.at };
  });
}

export const mockTradingWithdrawals: TradingWithdrawal[] = [
  /* 1. Internal MT→Wallet, margin OK, pending Finance Step 1 */
  {
    id: "TW-2026-0001",
    client: client("USR-12345"),
    mtAccount: mt("MT5-100012", "USR-12345"),
    destination: "Wallet (Internal)",
    amount: 5000, currency: "USD", amountUsd: 5000,
    withdrawable: 11500, formulaUsed: "Preset B: Free Margin + Stop-Out",
    marginLevelBefore: 395, marginLevelAfter: 273,
    fee: { amount: 0, paidBy: "Broker" },
    steps: resolveSteps([
      { stepKey: "finance_margin", state: "in_progress" },
    ]),
    status: "Pending",
    riskLevel: "Low",
    signals: [],
    policyChecks: [
      { key: "withdrawable", label: "Withdrawable $11,500 ≥ requested $5,000", passed: true },
      { key: "margin_after", label: "Margin level after = 273% (≥ 200% safe)", passed: true },
    ],
    submittedAt: isoMinusMin(10), slaMinutes: 30, slaElapsedMinutes: 10,
    timeline: [
      { at: isoMinusMin(10), text: "Withdrawal requested from MT5-100012", kind: "info" },
      { at: isoMinusMin(10), text: "Auto-checks passed, awaiting Finance signoff", by: "system" },
    ],
    internalNotes: [],
  },

  /* 2. Internal · margin warning (< 200% threshold) — Compliance escalation */
  {
    id: "TW-2026-0002",
    client: client("USR-56789"),
    mtAccount: mt("MT5-100016", "USR-56789"),
    destination: "Wallet (Internal)",
    amount: 1200, currency: "USD", amountUsd: 1200,
    withdrawable: 1500, formulaUsed: "Preset B: Free Margin + Stop-Out",
    marginLevelBefore: 141, marginLevelAfter: 112,
    fee: { amount: 0, paidBy: "Broker" },
    steps: resolveSteps([
      { stepKey: "finance_margin", state: "in_progress" },
    ]),
    status: "Pending",
    riskLevel: "High",
    signals: [
      { key: "margin_warning", label: "Margin level after = 112% (warn ≤150%)", severity: "warn",
        detail: "Forced into manual review per policy" },
      { key: "open_positions", label: "4 open positions on this account", severity: "info" },
    ],
    policyChecks: [
      { key: "withdrawable", label: "Withdrawable $1,500 ≥ requested $1,200", passed: true },
      { key: "margin_after", label: "Margin level after = 112% (< 150% → manual)", passed: false,
        detail: "Below safe threshold, requires Compliance signoff" },
    ],
    submittedAt: isoMinusMin(25), slaMinutes: 60, slaElapsedMinutes: 25,
    timeline: [
      { at: isoMinusMin(25), text: "WD requested from MT5-100016", kind: "info" },
      { at: isoMinusMin(24), text: "Margin warning triggered (after = 112%)", by: "system", kind: "warn" },
    ],
    internalNotes: ["Recommend client close some positions first."],
  },

  /* 3. External direct · large, completed — VIP */
  {
    id: "TW-2026-0003",
    client: client("USR-78901"),
    mtAccount: mt("MT4-200001", "USR-78901"),
    destination: "External Direct",
    channelId: "TC-BANK-DIRECT",
    merchantName: "Wise Global Settlement",
    merchantOrderId: "WISE-JP-99C19",
    channelReference: "WIRE-MUFG-228839",
    amount: 25_000, currency: "USD", amountUsd: 25_000,
    withdrawable: 50_000, formulaUsed: "Preset B: Free Margin + Stop-Out",
    marginLevelBefore: 0, marginLevelAfter: 0,
    fee: { amount: 25, paidBy: "Client" },
    steps: resolveSteps([
      { stepKey: "finance_margin", state: "done", actorId: "fin_002",
        outcome: "No open positions, full withdrawable available", at: isoMinusMin(120) },
      { stepKey: "treasury_payout", state: "done", actorId: "trs_001",
        outcome: "Bank wire sent to MUFG ****1122", at: isoMinusMin(60) },
    ]),
    status: "Completed",
    riskLevel: "Low",
    signals: [],
    policyChecks: [
      { key: "withdrawable", label: "Within withdrawable limit", passed: true },
      { key: "kyc_tier", label: "Tier3 VIP — external direct allowed", passed: true },
    ],
    submittedAt: isoMinusMin(130), slaMinutes: 120, slaElapsedMinutes: 70,
    timeline: [
      { at: isoMinusMin(130), text: "WD requested from MT4-200001 to MUFG bank", kind: "info" },
      { at: isoMinusMin(120), text: "Finance verified margin OK", by: "fin_002" },
      { at: isoMinusMin(60), text: "Treasury wired to MUFG", by: "trs_001" },
    ],
    internalNotes: [],
  },

  /* 4. Internal · high-profit alert */
  {
    id: "TW-2026-0004",
    client: client("USR-23456"),
    mtAccount: mt("MT5-100013", "USR-23456"),
    destination: "Wallet (Internal)",
    amount: 1500, currency: "USD", amountUsd: 1500,
    withdrawable: 1600, formulaUsed: "Preset B: Free Margin + Stop-Out",
    marginLevelBefore: 0, marginLevelAfter: 0,
    fee: { amount: 0, paidBy: "Broker" },
    steps: resolveSteps([
      { stepKey: "finance_margin", state: "in_progress" },
    ]),
    status: "Pending",
    riskLevel: "Medium",
    signals: [
      { key: "high_profit", label: "+$1,200 PnL last 7d (>50% of balance)", severity: "warn" },
    ],
    policyChecks: [
      { key: "withdrawable", label: "Within withdrawable", passed: true },
    ],
    submittedAt: isoMinusMin(40), slaMinutes: 60, slaElapsedMinutes: 40,
    timeline: [
      { at: isoMinusMin(40), text: "WD requested", kind: "info" },
      { at: isoMinusMin(40), text: "High-profit signal triggered", by: "system", kind: "warn" },
    ],
    internalNotes: [],
  },

  /* 5. Internal · margin BLOCK (after < 100%) */
  {
    id: "TW-2026-0005",
    client: client("USR-01234"),
    mtAccount: mt("MT5-100018", "USR-01234"),
    destination: "Wallet (Internal)",
    amount: 2500, currency: "USD", amountUsd: 2500,
    withdrawable: 1800, formulaUsed: "Preset B: Free Margin + Stop-Out",
    marginLevelBefore: 388, marginLevelAfter: 75,
    fee: { amount: 0, paidBy: "Broker" },
    steps: [
      { ...STEP_TEMPLATES["Trading Withdrawal"][0], state: "rejected", actorId: "fin_001",
        outcome: "Margin level after = 75% (< 100% block threshold)", at: isoMinusMin(5) },
      { ...STEP_TEMPLATES["Trading Withdrawal"][1], state: "skipped" },
    ],
    status: "Rejected",
    riskLevel: "Critical",
    signals: [
      { key: "margin_block", label: "Margin after < 100% — block", severity: "error" },
    ],
    policyChecks: [
      { key: "withdrawable", label: "Requested $2,500 > withdrawable $1,800", passed: false },
      { key: "margin_after", label: "Margin after = 75% (block at <100%)", passed: false },
    ],
    submittedAt: isoMinusMin(8), slaMinutes: 30, slaElapsedMinutes: 8,
    timeline: [
      { at: isoMinusMin(8), text: "WD requested $2,500", kind: "info" },
      { at: isoMinusMin(7), text: "Margin calc: after = 75% → block", by: "system", kind: "error" },
      { at: isoMinusMin(5), text: "Auto-rejected by Finance policy", by: "fin_001", kind: "error" },
    ],
    internalNotes: ["Notified client; suggested $1,500 partial."],
  },
];

export function tradingWithdrawalStats(rows: TradingWithdrawal[]) {
  return {
    pending:      rows.filter((r) => r.status === "Pending" || r.status === "In Progress").length,
    onHold:       rows.filter((r) => r.status === "On Hold").length,
    completed24h: rows.filter((r) => r.status === "Completed").length,
    rejected24h:  rows.filter((r) => r.status === "Rejected").length,
    marginWarn:   rows.filter((r) => r.marginLevelAfter > 0 && r.marginLevelAfter < 150).length,
    overdue:      rows.filter((r) => (r.status === "Pending" || r.status === "In Progress") && r.slaElapsedMinutes > r.slaMinutes).length,
  };
}

export function findTradingWithdrawal(id: string): TradingWithdrawal | undefined {
  return mockTradingWithdrawals.find((r) => r.id === id);
}
