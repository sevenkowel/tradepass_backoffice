/**
 * Funds v2 — Wallet Deposit money requests
 *
 * External → Client Wallet. 2 approval steps:
 *   Treasury confirm PSP credit → Finance post to wallet
 */

import {
  clients, NOW, isoMinusMin,
  type ClientLite,
} from "./entities";
import {
  STEP_TEMPLATES,
  type ApprovalStep, type MoneyRequestStatus, type TimelineEvent,
} from "./approvals";

export interface WalletDeposit {
  id: string;
  client: ClientLite;
  channelId: string;
  merchantName: string;
  merchantOrderId: string;
  channelReference?: string;
  amount: number;
  currency: string;
  amountUsd: number;
  /** Detection method that found this deposit. */
  matchMethod: "Auto Bank Reference" | "Auto Crypto Confirm" | "Manual Match" | "Webhook";
  matchConfidence?: number; // 0-100; only when matchMethod is automatic
  /** Crypto on-chain confirms (only for crypto). */
  cryptoConfirms?: { current: number; required: number; txHash: string; fromAddress: string };
  /** Fee paid by client / broker (if any deposit fee). */
  fee: { amount: number; paidBy: "Client" | "Broker" };
  steps: ApprovalStep[];
  status: MoneyRequestStatus;
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  aml: "Pass" | "Hit" | "Pending";
  amlScore: number;
  signals: { key: string; label: string; severity: "warn" | "error" | "info"; detail?: string }[];
  policyChecks: { key: string; label: string; passed: boolean; detail?: string }[];
  submittedAt: string;
  slaMinutes: number;
  slaElapsedMinutes: number;
  timeline: TimelineEvent[];
  isFirstDeposit: boolean;
  internalNotes: string[];
}

function client(id: string) { return clients.find((c) => c.id === id)!; }

function resolveSteps(actions: { stepKey: string; state: ApprovalStep["state"]; actorId?: string; outcome?: string; at?: string }[]): ApprovalStep[] {
  return STEP_TEMPLATES["Wallet Deposit"].map((tpl) => {
    const a = actions.find((x) => x.stepKey === tpl.key);
    if (!a) return { ...tpl };
    return { ...tpl, state: a.state, actorId: a.actorId, outcome: a.outcome, at: a.at };
  });
}

export const mockWalletDeposits: WalletDeposit[] = [
  /* 1. USDT crypto · pending confirmation (3/6 confirms) */
  {
    id: "WD-2026-0001",
    client: client("USR-23456"),
    channelId: "WC-USDT-TRC20",
    merchantName: "Tron Network", merchantOrderId: "TRX-9988B22",
    amount: 600, currency: "USDT", amountUsd: 600,
    matchMethod: "Auto Crypto Confirm",
    cryptoConfirms: { current: 3, required: 6, txHash: "0xdf991...22aa", fromAddress: "TXza...4422" },
    fee: { amount: 0, paidBy: "Broker" },
    steps: resolveSteps([
      { stepKey: "treasury_confirm", state: "in_progress" },
    ]),
    status: "Pending",
    riskLevel: "Low", aml: "Pass", amlScore: 12, signals: [],
    policyChecks: [
      { key: "amount_limit", label: "Within tier limit", passed: true },
      { key: "min_confirms", label: "Min 6 confirms — currently 3", passed: false, detail: "Wait for chain confirmation" },
    ],
    submittedAt: isoMinusMin(4), slaMinutes: 30, slaElapsedMinutes: 4,
    timeline: [
      { at: isoMinusMin(4), text: "Submitted by client", kind: "info" },
      { at: isoMinusMin(4), text: "Tx found on-chain, awaiting confirmations", by: "system" },
    ],
    isFirstDeposit: false, internalNotes: [],
  },

  /* 2. Bank wire · pending manual match (low confidence) */
  {
    id: "WD-2026-0002",
    client: client("USR-12345"),
    channelId: "WC-BANK-WIRE",
    merchantName: "Wise Global Settlement", merchantOrderId: "WISE-XX1029",
    amount: 4800, currency: "USD", amountUsd: 4800,
    matchMethod: "Auto Bank Reference",
    matchConfidence: 64,
    fee: { amount: 0, paidBy: "Broker" },
    steps: resolveSteps([
      { stepKey: "treasury_confirm", state: "in_progress" },
    ]),
    status: "Pending",
    riskLevel: "Medium", aml: "Pass", amlScore: 28,
    signals: [
      { key: "memo_missing", label: "Memo missing UID", severity: "warn",
        detail: "Bank reference does not contain a client UID — fuzzy match only" },
    ],
    policyChecks: [
      { key: "amount_limit", label: "Within tier limit", passed: true },
      { key: "name_match", label: "Beneficiary name matches KYC", passed: true },
    ],
    submittedAt: isoMinusMin(15), slaMinutes: 60, slaElapsedMinutes: 15,
    timeline: [
      { at: isoMinusMin(15), text: "Bank wire received from John Smith", kind: "info" },
      { at: isoMinusMin(14), text: "Auto-match confidence 64% — Treasury manual review", by: "system" },
    ],
    isFirstDeposit: false, internalNotes: ["Email sent asking client for ref number."],
  },

  /* 3. USDT · completed auto */
  {
    id: "WD-2026-0003",
    client: client("USR-90123"),
    channelId: "WC-USDT-TRC20",
    merchantName: "Tron Network", merchantOrderId: "TRX-9990C18",
    channelReference: "0xab12c...4cd0",
    amount: 2500, currency: "USDT", amountUsd: 2500,
    matchMethod: "Auto Crypto Confirm",
    cryptoConfirms: { current: 6, required: 6, txHash: "0xab12c...4cd0", fromAddress: "TXbc...5678" },
    fee: { amount: 0, paidBy: "Broker" },
    steps: resolveSteps([
      { stepKey: "treasury_confirm", state: "done", actorId: "trs_001", outcome: "6/6 confirms reached", at: isoMinusMin(7) },
      { stepKey: "finance_post",     state: "done", actorId: "fin_001", outcome: "Posted to Real wallet", at: isoMinusMin(6) },
    ]),
    status: "Completed",
    riskLevel: "Low", aml: "Pass", amlScore: 10,
    signals: [],
    policyChecks: [],
    submittedAt: isoMinusMin(8), slaMinutes: 30, slaElapsedMinutes: 2,
    timeline: [
      { at: isoMinusMin(8), text: "On-chain tx detected", kind: "info" },
      { at: isoMinusMin(7), text: "6/6 confirms — Treasury auto-confirmed", by: "trs_001" },
      { at: isoMinusMin(6), text: "Posted to Real wallet", by: "fin_001" },
    ],
    isFirstDeposit: false, internalNotes: [],
  },

  /* 4. AML hit · large USDT */
  {
    id: "WD-2026-0004",
    client: client("USR-90123"),
    channelId: "WC-USDT-ERC20",
    merchantName: "Ethereum Network", merchantOrderId: "ERC-77AC09",
    amount: 80_000, currency: "USDT", amountUsd: 80_000,
    matchMethod: "Auto Crypto Confirm",
    cryptoConfirms: { current: 8, required: 12, txHash: "0xff992...77cc", fromAddress: "0x9aa1...8821" },
    fee: { amount: 0, paidBy: "Broker" },
    steps: resolveSteps([
      { stepKey: "treasury_confirm", state: "in_progress" },
    ]),
    status: "On Hold",
    riskLevel: "Critical", aml: "Hit", amlScore: 87,
    signals: [
      { key: "aml_wallet", label: "Wallet screening · Severe (Chainalysis)", severity: "error",
        detail: "Source wallet linked to mixer service" },
      { key: "large_amount", label: "Large deposit $80k", severity: "warn" },
    ],
    policyChecks: [
      { key: "amount_limit", label: "Within tier limit (Tier2)", passed: true },
      { key: "wallet_screening", label: "Wallet screening passed", passed: false },
    ],
    submittedAt: isoMinusMin(35), slaMinutes: 60, slaElapsedMinutes: 35,
    timeline: [
      { at: isoMinusMin(35), text: "Tx found on-chain, $80k", kind: "info" },
      { at: isoMinusMin(34), text: "Wallet screening returned Severe", by: "system", kind: "error" },
      { at: isoMinusMin(34), text: "Auto-hold — Compliance review needed", by: "system", kind: "error" },
    ],
    isFirstDeposit: false,
    internalNotes: ["Flagged for SAR filing — pending Compliance L2 sign-off."],
  },

  /* 5. DOKU · auto completed */
  {
    id: "WD-2026-0005",
    client: client("USR-45678"),
    channelId: "WC-DOKU-IDR",
    merchantName: "DOKU - PT XYZ Indonesia", merchantOrderId: "DOKU-X1A29",
    channelReference: "DOKU-IDR-228831",
    amount: 7_500_000, currency: "IDR", amountUsd: 500,
    matchMethod: "Webhook",
    fee: { amount: 0, paidBy: "Broker" },
    steps: resolveSteps([
      { stepKey: "treasury_confirm", state: "done", actorId: "trs_001", outcome: "DOKU webhook confirmed", at: isoMinusMin(2) },
      { stepKey: "finance_post",     state: "done", actorId: "fin_001", outcome: "Posted to Real wallet @ FX 15000", at: isoMinusMin(2) },
    ]),
    status: "Completed",
    riskLevel: "Low", aml: "Pass", amlScore: 8, signals: [],
    policyChecks: [],
    submittedAt: isoMinusMin(3), slaMinutes: 15, slaElapsedMinutes: 1,
    timeline: [
      { at: isoMinusMin(3), text: "DOKU webhook received", by: "system" },
      { at: isoMinusMin(2), text: "Auto-confirmed and posted", by: "system" },
    ],
    isFirstDeposit: false, internalNotes: [],
  },

  /* 6. First-deposit Tier1 — manual review per first-large rule */
  {
    id: "WD-2026-0006",
    client: client("USR-89012"),
    channelId: "WC-VISA",
    merchantName: "Adyen", merchantOrderId: "ADYEN-991204",
    amount: 1200, currency: "USD", amountUsd: 1200,
    matchMethod: "Webhook",
    fee: { amount: 15, paidBy: "Client" },
    steps: resolveSteps([
      { stepKey: "treasury_confirm", state: "in_progress" },
    ]),
    status: "Pending",
    riskLevel: "Medium", aml: "Pass", amlScore: 22,
    signals: [
      { key: "first_deposit_large", label: "First deposit > $500 (Tier1 cap)", severity: "warn" },
    ],
    policyChecks: [
      { key: "first_deposit_amount", label: "Tier1 first-deposit cap $500", passed: false,
        detail: "Requested $1,200 exceeds Tier1 cap. Promote to Tier2 or partial deposit." },
    ],
    submittedAt: isoMinusMin(11), slaMinutes: 60, slaElapsedMinutes: 11,
    timeline: [
      { at: isoMinusMin(11), text: "Card charge received", kind: "info" },
      { at: isoMinusMin(11), text: "Auto-hold — first-deposit cap exceeded", by: "system", kind: "warn" },
    ],
    isFirstDeposit: true, internalNotes: [],
  },
];

export function walletDepositStats(rows: WalletDeposit[]) {
  return {
    pending:      rows.filter((r) => r.status === "Pending" || r.status === "In Progress").length,
    onHold:       rows.filter((r) => r.status === "On Hold").length,
    completed24h: rows.filter((r) => r.status === "Completed").length,
    rejected24h:  rows.filter((r) => r.status === "Rejected").length,
    overdue:      rows.filter((r) => (r.status === "Pending" || r.status === "In Progress") && r.slaElapsedMinutes > r.slaMinutes).length,
    amlHits:      rows.filter((r) => r.aml === "Hit").length,
    awaitingConfirm: rows.filter((r) => r.cryptoConfirms && r.cryptoConfirms.current < r.cryptoConfirms.required).length,
    amountPending: rows.filter((r) => r.status === "Pending" || r.status === "In Progress" || r.status === "On Hold").reduce((s, r) => s + r.amountUsd, 0),
  };
}

export function findWalletDeposit(id: string): WalletDeposit | undefined {
  return mockWalletDeposits.find((r) => r.id === id);
}
