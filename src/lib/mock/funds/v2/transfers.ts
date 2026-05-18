/**
 * Funds v2 — Transfers (5 scenarios)
 *
 * Internal money movements.
 * Scenarios:
 *   - Account ↔ Account (same client, MT↔MT, possibly cross-currency / cross-platform)
 *   - Wallet → Account (same client)
 *   - Account → Wallet (same client)
 *   - Wallet → Wallet P2P (IB-only, requires Compliance)
 *   - Bonus Injection (marketing → client bonus wallet)
 */

import {
  clients, mtAccountsByClient, NOW, isoMinusMin,
  type ClientLite, type MTAccount,
} from "./entities";
import {
  type ApprovalStep, type MoneyRequestStatus, type TimelineEvent,
} from "./approvals";

export type TransferScenario =
  | "Account ↔ Account"
  | "Wallet → Account"
  | "Account → Wallet"
  | "Wallet → Wallet (P2P)"
  | "Bonus Injection";

export interface TransferRow {
  id: string;
  scenario: TransferScenario;
  /** Initiator (the person/operator who started the request). */
  fromClient: ClientLite;
  /** For P2P: the recipient (different client). For other scenarios: same as fromClient. */
  toClient: ClientLite;
  /** Source description (Wallet · Real / MT5-100012 / Bonus Pool / etc). */
  fromLabel: string;
  toLabel: string;
  /** Source platform (for Account ↔ Account). */
  fromPlatform?: "MT4" | "MT5" | "TradePass" | "Wallet";
  toPlatform?: "MT4" | "MT5" | "TradePass" | "Wallet";
  amount: number;
  currency: string;
  amountUsd: number;
  /** FX rate applied when cross-currency. */
  fxRate?: number;
  /** Source currency != target currency? */
  isCrossCurrency: boolean;
  /** Source platform != target platform? */
  isCrossPlatform: boolean;
  fee: { amount: number; paidBy: "Client" | "Broker" };
  steps: ApprovalStep[];
  status: MoneyRequestStatus;
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  policyChecks: { key: string; label: string; passed: boolean; detail?: string }[];
  signals: { key: string; label: string; severity: "warn" | "error" | "info"; detail?: string }[];
  submittedAt: string;
  slaMinutes: number;
  slaElapsedMinutes: number;
  timeline: TimelineEvent[];
  internalNotes: string[];
}

function client(id: string) { return clients.find((c) => c.id === id)!; }

const TPL_FINANCE_STEP: ApprovalStep = {
  key: "finance_audit",
  label: "Finance · 校验余额 / 限额",
  role: "finance",
  state: "pending",
};

const TPL_COMPLIANCE_STEP: ApprovalStep = {
  key: "compliance_p2p",
  label: "Compliance · P2P 反洗钱审核",
  role: "compliance",
  state: "pending",
};

export const mockTransfers: TransferRow[] = [
  /* 1. Wallet → Account (internal upload), completed */
  {
    id: "TR-2026-0001",
    scenario: "Wallet → Account",
    fromClient: client("USR-12345"),
    toClient:   client("USR-12345"),
    fromLabel:  "Wallet · Real (USD)",
    toLabel:    "MT5-100012 (USD)",
    fromPlatform: "Wallet", toPlatform: "MT5",
    amount: 500, currency: "USD", amountUsd: 500,
    isCrossCurrency: false, isCrossPlatform: true,
    fee: { amount: 0, paidBy: "Broker" },
    steps: [
      { ...TPL_FINANCE_STEP, state: "done", actorId: "fin_001",
        outcome: "Wallet balance OK, daily transfer limit OK", at: isoMinusMin(7) },
    ],
    status: "Completed",
    riskLevel: "Low",
    policyChecks: [
      { key: "balance", label: "Wallet balance sufficient", passed: true },
      { key: "daily_limit", label: "Daily transfer limit OK", passed: true },
    ],
    signals: [],
    submittedAt: isoMinusMin(8), slaMinutes: 15, slaElapsedMinutes: 1,
    timeline: [
      { at: isoMinusMin(8), text: "Transfer initiated", kind: "info" },
      { at: isoMinusMin(7), text: "Auto-approved by Finance rules", by: "fin_001" },
    ],
    internalNotes: [],
  },

  /* 2. Account ↔ Account (MT5 → MT5, same client, same currency) */
  {
    id: "TR-2026-0002",
    scenario: "Account ↔ Account",
    fromClient: client("USR-78901"),
    toClient:   client("USR-78901"),
    fromLabel:  "MT4-200001 (USD)",
    toLabel:    "TP-300001 (USDT)",
    fromPlatform: "MT4", toPlatform: "TradePass",
    amount: 10_000, currency: "USD", amountUsd: 10_000,
    fxRate: 0.9998, isCrossCurrency: true, isCrossPlatform: true,
    fee: { amount: 5, paidBy: "Client" },
    steps: [
      { ...TPL_FINANCE_STEP, state: "in_progress" },
    ],
    status: "Pending",
    riskLevel: "Low",
    policyChecks: [
      { key: "margin", label: "Source MT4 margin OK", passed: true },
      { key: "fx_quote", label: "FX rate 0.9998 within ±0.5%", passed: true },
      { key: "cross_platform", label: "Cross-platform transfer enabled", passed: true },
    ],
    signals: [
      { key: "cross_platform", label: "Cross-platform MT4 → TradePass", severity: "info" },
      { key: "cross_currency", label: "Cross-currency USD → USDT", severity: "info" },
    ],
    submittedAt: isoMinusMin(5), slaMinutes: 30, slaElapsedMinutes: 5,
    timeline: [
      { at: isoMinusMin(5), text: "Transfer initiated by VIP client", kind: "info" },
      { at: isoMinusMin(5), text: "FX quoted 0.9998 (Rate Center · Tier3 spread)", by: "system" },
    ],
    internalNotes: [],
  },

  /* 3. Account → Wallet (downloading from MT5) */
  {
    id: "TR-2026-0003",
    scenario: "Account → Wallet",
    fromClient: client("USR-23456"),
    toClient:   client("USR-23456"),
    fromLabel:  "MT5-100013 (USD)",
    toLabel:    "Wallet · Real (USD)",
    fromPlatform: "MT5", toPlatform: "Wallet",
    amount: 800, currency: "USD", amountUsd: 800,
    isCrossCurrency: false, isCrossPlatform: true,
    fee: { amount: 0, paidBy: "Broker" },
    steps: [
      { ...TPL_FINANCE_STEP, state: "done", actorId: "fin_001",
        outcome: "MT5 balance OK, no positions, transfer cleared", at: isoMinusMin(2) },
    ],
    status: "Completed",
    riskLevel: "Low",
    policyChecks: [
      { key: "margin", label: "MT5 has no open positions — full balance withdrawable", passed: true },
    ],
    signals: [],
    submittedAt: isoMinusMin(3), slaMinutes: 15, slaElapsedMinutes: 1,
    timeline: [
      { at: isoMinusMin(3), text: "Transfer initiated", kind: "info" },
      { at: isoMinusMin(2), text: "Auto-approved", by: "fin_001" },
    ],
    internalNotes: [],
  },

  /* 4. Wallet → Wallet (P2P), IB → IB sub-client, pending Compliance */
  {
    id: "TR-2026-0004",
    scenario: "Wallet → Wallet (P2P)",
    fromClient: client("USR-78901"),  // VIP / IB
    toClient:   client("USR-45678"),  // Sub-IB client
    fromLabel:  "USR-78901 Wallet · Real (USD)",
    toLabel:    "USR-45678 Wallet · Real (USD)",
    fromPlatform: "Wallet", toPlatform: "Wallet",
    amount: 2000, currency: "USD", amountUsd: 2000,
    isCrossCurrency: false, isCrossPlatform: false,
    fee: { amount: 0, paidBy: "Broker" },
    steps: [
      { ...TPL_FINANCE_STEP, state: "done", actorId: "fin_002",
        outcome: "Balance OK, sender is IB-001 (eligible for P2P)", at: isoMinusMin(45) },
      { ...TPL_COMPLIANCE_STEP, state: "in_progress" },
    ],
    status: "In Progress",
    riskLevel: "Medium",
    policyChecks: [
      { key: "p2p_eligible_role", label: "Sender role is IB (P2P enabled)", passed: true },
      { key: "p2p_recipient_kyc", label: "Recipient KYC tier ≥ 2", passed: true },
      { key: "p2p_amount_limit", label: "P2P single $2,000 within tier limit", passed: true },
      { key: "compliance_review", label: "Compliance signoff required for all P2P", passed: false,
        detail: "P2P transfers always require Compliance approval per v2.2 policy" },
    ],
    signals: [
      { key: "p2p", label: "P2P transfer (IB → sub-client)", severity: "warn",
        detail: "IB-001 internal liquidity move — must verify intent" },
    ],
    submittedAt: isoMinusMin(60), slaMinutes: 240, slaElapsedMinutes: 60,
    timeline: [
      { at: isoMinusMin(60), text: "P2P initiated by IB user", kind: "info" },
      { at: isoMinusMin(58), text: "Eligibility check passed (IB role)", by: "system" },
      { at: isoMinusMin(45), text: "Finance audit passed", by: "fin_002" },
      { at: isoMinusMin(45), text: "Routed to Compliance for P2P signoff", by: "system", kind: "warn" },
    ],
    internalNotes: ["Awaiting Compliance signoff. IB stated this is a referral payout."],
  },

  /* 5. Bonus Injection (marketing → bonus wallet) */
  {
    id: "TR-2026-0005",
    scenario: "Bonus Injection",
    fromClient: client("USR-90123"),  // recipient
    toClient:   client("USR-90123"),
    fromLabel:  "Bonus Pool · NEWYR2026",
    toLabel:    "USR-90123 Bonus Wallet",
    fromPlatform: "Wallet", toPlatform: "Wallet",
    amount: 100, currency: "USD", amountUsd: 100,
    isCrossCurrency: false, isCrossPlatform: false,
    fee: { amount: 0, paidBy: "Broker" },
    steps: [
      { ...TPL_FINANCE_STEP, state: "in_progress" },
    ],
    status: "Pending",
    riskLevel: "Low",
    policyChecks: [
      { key: "campaign_active", label: "Campaign NEWYR2026 still active", passed: true },
      { key: "client_eligible", label: "Client matches targeting criteria", passed: true },
      { key: "no_duplicate", label: "No duplicate grant this campaign", passed: true },
    ],
    signals: [],
    submittedAt: isoMinusMin(15), slaMinutes: 60, slaElapsedMinutes: 15,
    timeline: [
      { at: isoMinusMin(15), text: "Bonus grant initiated by marketing", by: "mkt_001" },
      { at: isoMinusMin(15), text: "Awaiting Finance approval", by: "system" },
    ],
    internalNotes: [],
  },

  /* 6. Account ↔ Account, same currency, same platform (just sub-account move) */
  {
    id: "TR-2026-0006",
    scenario: "Account ↔ Account",
    fromClient: client("USR-12345"),
    toClient:   client("USR-12345"),
    fromLabel:  "MT5-100012-A",
    toLabel:    "MT5-100012-B",  // imaginary sub-account
    fromPlatform: "MT5", toPlatform: "MT5",
    amount: 200, currency: "USD", amountUsd: 200,
    isCrossCurrency: false, isCrossPlatform: false,
    fee: { amount: 0, paidBy: "Broker" },
    steps: [
      { ...TPL_FINANCE_STEP, state: "done", actorId: "fin_001",
        outcome: "Auto-cleared", at: isoMinusMin(35) },
    ],
    status: "Completed",
    riskLevel: "Low",
    policyChecks: [],
    signals: [],
    submittedAt: isoMinusMin(36), slaMinutes: 15, slaElapsedMinutes: 1,
    timeline: [
      { at: isoMinusMin(36), text: "MT5 sub-account move initiated", kind: "info" },
      { at: isoMinusMin(35), text: "Auto-approved", by: "fin_001" },
    ],
    internalNotes: [],
  },
];

export function transferStats(rows: TransferRow[]) {
  return {
    pending:      rows.filter((r) => r.status === "Pending" || r.status === "In Progress").length,
    completed24h: rows.filter((r) => r.status === "Completed").length,
    p2p:          rows.filter((r) => r.scenario === "Wallet → Wallet (P2P)").length,
    crossCurrency: rows.filter((r) => r.isCrossCurrency).length,
    crossPlatform: rows.filter((r) => r.isCrossPlatform).length,
    overdue:      rows.filter((r) => (r.status === "Pending" || r.status === "In Progress") && r.slaElapsedMinutes > r.slaMinutes).length,
  };
}

export function findTransfer(id: string): TransferRow | undefined {
  return mockTransfers.find((r) => r.id === id);
}
