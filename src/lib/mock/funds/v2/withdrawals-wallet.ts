/**
 * Funds v2 — Wallet Withdrawal money requests
 *
 * Client → External (Bank / Crypto / E-Wallet). 3 approval steps:
 *   Finance audit → Compliance AML → Treasury payout
 */

import {
  clients, mtAccountsByClient, NOW, isoMinusMin,
  type ClientLite, type KYCTier,
} from "./entities";
import { walletChannels, type Channel } from "./channels";
import {
  STEP_TEMPLATES, deriveStatus,
  type ApprovalStep, type MoneyRequestStatus, type TimelineEvent,
} from "./approvals";

export interface WalletWithdrawal {
  id: string;
  client: ClientLite;
  /** Channel id; resolve through channelById for full info. */
  channelId: string;
  /** Channel.merchantName captured at submission for audit/recon. */
  merchantName: string;
  /** PSP-side order id (the reconciliation primary key). */
  merchantOrderId?: string;
  /** Final channel reference (TXID for crypto, wire ref for banks, etc.) — populated on payout. */
  channelReference?: string;
  amount: number;
  currency: string;
  /** USD equivalent at request time (using business FX rate). */
  amountUsd: number;
  /** From which wallet bucket (per deduction strategy). */
  walletBucket: "Real" | "Bonus" | "Credit";
  /** Beneficiary the customer is paying out to. */
  beneficiary: {
    type: "Bank" | "Crypto" | "EWallet";
    label: string;        // human-readable, e.g. "Chase Bank ****4567" or "TXfa...4422"
    detail: string;       // full info (acct number / address / etc.)
  };
  /** Fee summary (applied per Fees & Pricing rules). */
  fee: {
    amount: number;
    paidBy: "Client" | "Broker" | "Split";
  };
  /** Deduction plan — which bucket(s) of historical deposits this WD pulls from. */
  deductionPlan: {
    bucketChannelId: string;
    bucketLabel: string;
    amountUsd: number;
    note?: string;
  }[];
  /** Steps progress. */
  steps: ApprovalStep[];
  /** Convenience: derived from steps. */
  status: MoneyRequestStatus;
  /** Risk class & signals captured at request submission. */
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  /** AML decision at submission. */
  aml: "Pass" | "Hit" | "Pending";
  amlScore: number;
  /** Risk signals triggered. */
  signals: { key: string; label: string; severity: "warn" | "error" | "info"; detail?: string }[];
  /** Policy checks. */
  policyChecks: { key: string; label: string; passed: boolean; detail?: string }[];
  /** Submitted timestamp. */
  submittedAt: string;
  /** SLA budget (minutes). */
  slaMinutes: number;
  /** Minutes elapsed since submission. */
  slaElapsedMinutes: number;
  /** Timeline events for the right rail. */
  timeline: TimelineEvent[];
  /** Whether this is the client's first withdrawal ever. */
  isFirstWithdrawal: boolean;
  /** Notes left by operators. */
  internalNotes: string[];
}

/* ── Helpers to fabricate consistent rows ─────────────────────── */

function withStepsResolved(kind: "Wallet Withdrawal", actions: { stepKey: string; done: boolean; actorId?: string; outcome?: string; at?: string }[]): ApprovalStep[] {
  return STEP_TEMPLATES[kind].map((tpl) => {
    const action = actions.find((a) => a.stepKey === tpl.key);
    if (!action) return { ...tpl };
    return {
      ...tpl,
      state: action.done ? "done" : "in_progress",
      actorId: action.actorId,
      outcome: action.outcome,
      at: action.at,
    };
  });
}

function client(id: string) {
  return clients.find((c) => c.id === id)!;
}

/* ── Mock dataset ─────────────────────────────────────────────── */

export const mockWalletWithdrawals: WalletWithdrawal[] = [
  /* 1. Critical · large · pending Compliance — high-profit signal */
  {
    id: "WW-2026-0001",
    client: client("USR-12345"),
    channelId: "WC-BANK-WIRE",
    merchantName: "Wise Global Settlement",
    merchantOrderId: "WISE-X100A29",
    amount: 15000, currency: "USD", amountUsd: 15000,
    walletBucket: "Real",
    beneficiary: { type: "Bank", label: "Chase Bank ****4567", detail: "John Smith / Chase Bank / 021000021 / ****4567" },
    fee: { amount: 25, paidBy: "Client" },
    deductionPlan: [
      { bucketChannelId: "WC-BANK-WIRE", bucketLabel: "Bank Wire USD", amountUsd: 12000, note: "Same-channel match" },
      { bucketChannelId: "WC-USDT-TRC20", bucketLabel: "USDT TRC20", amountUsd: 3000, note: "Cross-channel — requires Compliance review" },
    ],
    steps: withStepsResolved("Wallet Withdrawal", [
      { stepKey: "finance_audit", done: true, actorId: "fin_001",
        outcome: "Tier2 daily limit OK · channel whitelisted · no cooldown violation",
        at: isoMinusMin(35) },
    ]),
    status: "In Progress",
    riskLevel: "Critical",
    aml: "Pass", amlScore: 18,
    signals: [
      { key: "high_profit", label: "High Profit · +$3,200 / 7d", severity: "warn",
        detail: "7-day PnL exceeds Tier2 high-profit threshold ($2,000)" },
      { key: "cross_channel_deduction", label: "Cross-channel deduction $3,000", severity: "warn",
        detail: "Bank Wire bucket short; $3,000 must come from USDT bucket per Same-Channel First" },
    ],
    policyChecks: [
      { key: "tier_limit", label: "Tier2 daily limit $20,000", passed: true, detail: "Used today: $0" },
      { key: "channel_eligibility", label: "Bank Wire allowed for Tier2 + US", passed: true },
      { key: "first_withdrawal", label: "Not first withdrawal", passed: true },
      { key: "key_info_cooldown", label: "No key info change in 24h", passed: true },
    ],
    submittedAt: isoMinusMin(45),
    slaMinutes: 120, slaElapsedMinutes: 45,
    timeline: [
      { at: isoMinusMin(45), text: "Submitted by client", kind: "info" },
      { at: isoMinusMin(44), text: "Auto checks triggered: high_profit + cross_channel_deduction → manual", by: "system" },
      { at: isoMinusMin(35), text: "Finance audit passed (Anna Chen)", by: "fin_001" },
      { at: isoMinusMin(34), text: "Routed to Compliance: cross-channel deduction needs AML signoff", by: "system", kind: "warn" },
    ],
    isFirstWithdrawal: false,
    internalNotes: ["Client has been with us 18 months. Steady volume."],
  },

  /* 2. Low · small · auto-completed (all steps done) — happy path */
  {
    id: "WW-2026-0002",
    client: client("USR-23456"),
    channelId: "WC-USDT-TRC20",
    merchantName: "Tron Network",
    merchantOrderId: "TRX-9988A12",
    channelReference: "TXac4582...9ed1",
    amount: 800, currency: "USDT", amountUsd: 800,
    walletBucket: "Real",
    beneficiary: { type: "Crypto", label: "TXbc12...5678", detail: "TXbc1234567890abcdef...5678 (TRC20)" },
    fee: { amount: 1.5, paidBy: "Client" },
    deductionPlan: [
      { bucketChannelId: "WC-USDT-TRC20", bucketLabel: "USDT TRC20", amountUsd: 800, note: "Same-channel match" },
    ],
    steps: withStepsResolved("Wallet Withdrawal", [
      { stepKey: "finance_audit",   done: true, actorId: "fin_001", outcome: "Auto-eligible (Tier2 + low risk + same-channel)", at: isoMinusMin(8) },
      { stepKey: "compliance_aml",  done: true, actorId: "cmp_001", outcome: "AML clean, score 8", at: isoMinusMin(7) },
      { stepKey: "treasury_payout", done: true, actorId: "trs_001", outcome: "Sent on-chain, TXID TXac4582...9ed1", at: isoMinusMin(5) },
    ]),
    status: "Completed",
    riskLevel: "Low",
    aml: "Pass", amlScore: 8,
    signals: [],
    policyChecks: [
      { key: "tier_limit", label: "Tier2 daily $20k", passed: true },
      { key: "channel_eligibility", label: "USDT TRC20 allowed", passed: true },
      { key: "cooldown", label: "No cooldown active", passed: true },
    ],
    submittedAt: isoMinusMin(10),
    slaMinutes: 60, slaElapsedMinutes: 10,
    timeline: [
      { at: isoMinusMin(10), text: "Submitted by client", kind: "info" },
      { at: isoMinusMin(9), text: "Auto-approval rules matched (Tier2 + Low Risk + ≤$2k + same-channel)", by: "system" },
      { at: isoMinusMin(8), text: "Finance audit passed", by: "fin_001" },
      { at: isoMinusMin(7), text: "AML pass", by: "cmp_001" },
      { at: isoMinusMin(5), text: "Treasury payout executed", by: "trs_001" },
    ],
    isFirstWithdrawal: false,
    internalNotes: [],
  },

  /* 3. Critical · first WD · AML hit · on hold (Compliance blocked) */
  {
    id: "WW-2026-0003",
    client: client("USR-34567"),
    channelId: "WC-BANK-WIRE",
    merchantName: "Wise Global Settlement",
    merchantOrderId: "WISE-RU-22Z14",
    amount: 6500, currency: "USD", amountUsd: 6500,
    walletBucket: "Real",
    beneficiary: { type: "Bank", label: "Sberbank ****8901", detail: "Michael Brown / Sberbank / SWIFT SABRRUMM / ****8901" },
    fee: { amount: 35, paidBy: "Client" },
    deductionPlan: [
      { bucketChannelId: "WC-USDT-TRC20", bucketLabel: "USDT TRC20", amountUsd: 6500, note: "All historical deposits from USDT — cross-channel mismatch" },
    ],
    steps: withStepsResolved("Wallet Withdrawal", [
      { stepKey: "finance_audit", done: true, actorId: "fin_002",
        outcome: "Tier1 daily limit exceeded ($6,500 > $1,000), KYC upgrade required",
        at: isoMinusMin(148) },
    ]),
    status: "On Hold",
    riskLevel: "Critical",
    aml: "Hit", amlScore: 87,
    signals: [
      { key: "new_device", label: "New device · 4h ago", severity: "warn",
        detail: "Login from new fingerprint, last seen 14:23 UTC" },
      { key: "ip_anomaly", label: "IP anomaly · proxy detected", severity: "error" },
      { key: "country_risk", label: "Country RU on watch list", severity: "error" },
      { key: "cross_channel_deduction", label: "100% cross-channel (USDT in, Bank Wire out)", severity: "error",
        detail: "Strong suspicion of layered laundering" },
    ],
    policyChecks: [
      { key: "tier_limit", label: "Tier1 daily limit $1,000", passed: false, detail: "Requested $6,500 — KYC upgrade required" },
      { key: "first_withdrawal", label: "First withdrawal · force manual", passed: false },
      { key: "country_restriction", label: "Country RU on watch list", passed: false },
    ],
    submittedAt: isoMinusMin(150),
    slaMinutes: 120, slaElapsedMinutes: 150,
    timeline: [
      { at: isoMinusMin(150), text: "Submitted by client (first withdrawal)", kind: "info" },
      { at: isoMinusMin(149), text: "AML screening → HIT (score 87)", by: "system", kind: "error" },
      { at: isoMinusMin(149), text: "Auto-hold by policy (KYC tier + AML hit + country)", by: "system", kind: "error" },
      { at: isoMinusMin(148), text: "Finance L2 review: Tier1 daily limit exceeded + KYC upgrade required", by: "fin_002", kind: "warn" },
    ],
    isFirstWithdrawal: true,
    internalNotes: ["KYC upgrade requested via CLM case CLM-2026-1042. Awaiting client response."],
  },

  /* 4. Medium · pending Treasury payout (everything else done) */
  {
    id: "WW-2026-0004",
    client: client("USR-45678"),
    channelId: "WC-DOKU-IDR",
    merchantName: "DOKU - PT XYZ Indonesia",
    merchantOrderId: "DOKU-X1A45",
    amount: 18_500_000, currency: "IDR", amountUsd: 1200,
    walletBucket: "Real",
    beneficiary: { type: "EWallet", label: "DOKU ID-22001", detail: "Emma Wilson / DOKU Wallet / ID-22001" },
    fee: { amount: 2.5, paidBy: "Broker" },
    deductionPlan: [
      { bucketChannelId: "WC-DOKU-IDR", bucketLabel: "DOKU IDR", amountUsd: 1200 },
    ],
    steps: withStepsResolved("Wallet Withdrawal", [
      { stepKey: "finance_audit",  done: true, actorId: "fin_003", outcome: "All policy checks passed", at: isoMinusMin(90) },
      { stepKey: "compliance_aml", done: true, actorId: "cmp_001", outcome: "AML clean", at: isoMinusMin(85) },
    ]),
    status: "In Progress",
    riskLevel: "Medium",
    aml: "Pass", amlScore: 12,
    signals: [],
    policyChecks: [
      { key: "tier_limit", label: "Tier2 daily limit $20,000", passed: true },
      { key: "channel_eligibility", label: "DOKU enabled for region=ID", passed: true },
    ],
    submittedAt: isoMinusMin(95),
    slaMinutes: 60, slaElapsedMinutes: 95,
    timeline: [
      { at: isoMinusMin(95), text: "Submitted by client", kind: "info" },
      { at: isoMinusMin(90), text: "Finance audit passed", by: "fin_003" },
      { at: isoMinusMin(85), text: "Compliance AML clean", by: "cmp_001" },
      { at: isoMinusMin(60), text: "Routed to Treasury for payout (SLA breached 35m)", by: "system", kind: "warn" },
    ],
    isFirstWithdrawal: false,
    internalNotes: [],
  },

  /* 5. Low · approved · processing — happy path with bonus wallet bucket */
  {
    id: "WW-2026-0005",
    client: client("USR-90123"),
    channelId: "WC-USDT-TRC20",
    merchantName: "Tron Network",
    merchantOrderId: "TRX-9990B22",
    amount: 300, currency: "USDT", amountUsd: 300,
    walletBucket: "Bonus",
    beneficiary: { type: "Crypto", label: "TXbz55...9911", detail: "TXbz5500...9911 (TRC20)" },
    fee: { amount: 1, paidBy: "Client" },
    deductionPlan: [
      { bucketChannelId: "WC-USDT-TRC20", bucketLabel: "Bonus → USDT TRC20", amountUsd: 300, note: "Bonus wallet conversion (turnover requirement met)" },
    ],
    steps: withStepsResolved("Wallet Withdrawal", [
      { stepKey: "finance_audit",  done: true, actorId: "fin_001", outcome: "Bonus turnover requirement met (volume ≥ 10x bonus)", at: isoMinusMin(120) },
      { stepKey: "compliance_aml", done: true, actorId: "cmp_001", outcome: "AML clean", at: isoMinusMin(115) },
    ]),
    status: "In Progress",
    riskLevel: "Low",
    aml: "Pass", amlScore: 10,
    signals: [],
    policyChecks: [
      { key: "tier_limit", label: "Tier2 daily $20k", passed: true },
      { key: "bonus_turnover", label: "Bonus turnover 12.5x (required 10x)", passed: true },
    ],
    submittedAt: isoMinusMin(130),
    slaMinutes: 60, slaElapsedMinutes: 130,
    timeline: [
      { at: isoMinusMin(130), text: "Submitted by client (bonus wallet)", kind: "info" },
      { at: isoMinusMin(120), text: "Finance audit passed", by: "fin_001" },
      { at: isoMinusMin(115), text: "AML clean", by: "cmp_001" },
    ],
    isFirstWithdrawal: false,
    internalNotes: [],
  },

  /* 6. Critical · Fast In-Out (deposit→WD in 2h) */
  {
    id: "WW-2026-0006",
    client: client("USR-67890"),
    channelId: "WC-USDT-TRC20",
    merchantName: "Tron Network",
    merchantOrderId: "TRX-9992C18",
    amount: 2200, currency: "USDT", amountUsd: 2200,
    walletBucket: "Real",
    beneficiary: { type: "Crypto", label: "TXfa98...4422", detail: "TXfa9876...4422 (TRC20)" },
    fee: { amount: 1.5, paidBy: "Client" },
    deductionPlan: [
      { bucketChannelId: "WC-USDT-TRC20", bucketLabel: "USDT TRC20", amountUsd: 2200 },
    ],
    steps: withStepsResolved("Wallet Withdrawal", []),
    status: "Pending",
    riskLevel: "Critical",
    aml: "Pending", amlScore: 65,
    signals: [
      { key: "fast_in_out", label: "Fast In-Out · deposit 2h ago", severity: "error",
        detail: "Client deposited $2,000 USDT 2h before this withdrawal — classic layering pattern" },
      { key: "velocity", label: "Velocity · 3 withdrawals / 24h", severity: "warn" },
      { key: "ib_link_high_risk", label: "IB-001 → IB-B downstream (flagged sub-IB)", severity: "warn",
        detail: "Sub-IB IB-B has 3 other clients with similar patterns in last 30d" },
    ],
    policyChecks: [
      { key: "tier_limit", label: "Tier2 daily $20k", passed: true },
      { key: "deposit_cooldown", label: "Crypto deposit-to-WD cooldown · violated (2h < 24h)", passed: false,
        detail: "Per Crypto Security policy: USDT must wait 24h after deposit before allowing withdrawal" },
    ],
    submittedAt: isoMinusMin(70),
    slaMinutes: 60, slaElapsedMinutes: 70,
    timeline: [
      { at: isoMinusMin(70), text: "Submitted by client", kind: "info" },
      { at: isoMinusMin(69), text: "Fast-In-Out triggered (deposit 2h ago) → manual", by: "system", kind: "error" },
      { at: isoMinusMin(69), text: "Crypto deposit cooldown 24h violated", by: "system", kind: "error" },
      { at: isoMinusMin(68), text: "Assigned to Compliance queue", by: "system" },
    ],
    isFirstWithdrawal: false,
    internalNotes: ["Sub-IB IB-B under review — pattern monitoring active."],
  },

  /* 7. High · rejected — bank name mismatch */
  {
    id: "WW-2026-0007",
    client: client("USR-89012"),
    channelId: "WC-BANK-WIRE",
    merchantName: "Wise Global Settlement",
    merchantOrderId: "WISE-TW-44Y09",
    amount: 600, currency: "USD", amountUsd: 600,
    walletBucket: "Real",
    beneficiary: { type: "Bank", label: "CTBC Bank ****6677", detail: "Lisa C. / CTBC Bank / ****6677 (mismatched KYC name)" },
    fee: { amount: 25, paidBy: "Client" },
    deductionPlan: [
      { bucketChannelId: "WC-BANK-WIRE", bucketLabel: "Bank Wire", amountUsd: 600 },
    ],
    steps: [
      { ...STEP_TEMPLATES["Wallet Withdrawal"][0], state: "rejected", actorId: "fin_001",
        outcome: "Rejected — bank account holder name does not match KYC name",
        at: isoMinusMin(2810) },
      { ...STEP_TEMPLATES["Wallet Withdrawal"][1], state: "skipped" },
      { ...STEP_TEMPLATES["Wallet Withdrawal"][2], state: "skipped" },
    ],
    status: "Rejected",
    riskLevel: "High",
    aml: "Pass", amlScore: 30,
    signals: [
      { key: "ip_anomaly", label: "IP anomaly · vpn", severity: "warn" },
    ],
    policyChecks: [
      { key: "kyc_name_match", label: "Bank account name must match KYC name", passed: false,
        detail: "Beneficiary 'Lisa C.' vs KYC 'Lisa Chen' — not auto-match-able" },
    ],
    submittedAt: isoMinusMin(2880),
    slaMinutes: 60, slaElapsedMinutes: 90,
    timeline: [
      { at: isoMinusMin(2880), text: "Submitted by client", kind: "info" },
      { at: isoMinusMin(2810), text: "Rejected — bank name mismatch", by: "fin_001", kind: "error" },
    ],
    isFirstWithdrawal: false,
    internalNotes: ["Asked client to resubmit with matching name."],
  },

  /* 8. Medium · auto-hold (cooldown) */
  {
    id: "WW-2026-0008",
    client: client("USR-01234"),
    channelId: "WC-BANK-WIRE",
    merchantName: "Wise Global Settlement",
    merchantOrderId: "WISE-BR-11A02",
    amount: 3000, currency: "USD", amountUsd: 3000,
    walletBucket: "Real",
    beneficiary: { type: "Bank", label: "Itaú ****3344", detail: "Andre Silva / Itaú / ****3344" },
    fee: { amount: 18, paidBy: "Client" },
    deductionPlan: [
      { bucketChannelId: "WC-PIX-BRL", bucketLabel: "PIX BRL", amountUsd: 2400 },
      { bucketChannelId: "WC-BANK-WIRE", bucketLabel: "Bank Wire", amountUsd: 600 },
    ],
    steps: withStepsResolved("Wallet Withdrawal", []),
    status: "On Hold",
    riskLevel: "Medium",
    aml: "Pass", amlScore: 25,
    signals: [
      { key: "velocity", label: "Velocity · 5 withdrawals / 24h", severity: "warn" },
      { key: "high_profit", label: "High Profit · +$900 / 24h", severity: "warn" },
    ],
    policyChecks: [
      { key: "tier_limit", label: "Tier2 daily $20k", passed: true },
      { key: "cooldown", label: "Cooldown · 30m remaining", passed: false,
        detail: "Last withdrawal 30 minutes ago — cooldown 60m" },
    ],
    submittedAt: isoMinusMin(20),
    slaMinutes: 60, slaElapsedMinutes: 20,
    timeline: [
      { at: isoMinusMin(20), text: "Submitted by client", kind: "info" },
      { at: isoMinusMin(20), text: "Auto-hold (cooldown not elapsed)", by: "system", kind: "warn" },
    ],
    isFirstWithdrawal: false,
    internalNotes: [],
  },
];

/* ── Aggregates ───────────────────────────────────────────────── */

export function walletWithdrawalStats(rows: WalletWithdrawal[]) {
  return {
    pending:      rows.filter((r) => r.status === "Pending" || r.status === "In Progress").length,
    onHold:       rows.filter((r) => r.status === "On Hold").length,
    completed24h: rows.filter((r) => r.status === "Completed").length,
    rejected24h:  rows.filter((r) => r.status === "Rejected").length,
    overdue:      rows.filter((r) => (r.status === "Pending" || r.status === "In Progress") && r.slaElapsedMinutes > r.slaMinutes).length,
    critical:     rows.filter((r) => (r.status === "Pending" || r.status === "In Progress" || r.status === "On Hold") && r.riskLevel === "Critical").length,
    amlHits:      rows.filter((r) => r.aml === "Hit").length,
    amountPending: rows.filter((r) => r.status === "Pending" || r.status === "In Progress" || r.status === "On Hold").reduce((s, r) => s + r.amountUsd, 0),
  };
}

export function findWalletWithdrawal(id: string): WalletWithdrawal | undefined {
  return mockWalletWithdrawals.find((r) => r.id === id);
}
