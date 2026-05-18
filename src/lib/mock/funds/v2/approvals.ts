/**
 * Funds v2 — step-based approval model
 *
 * Every deposit / withdrawal / transfer is a Money Request with a
 * **fixed sequence of steps** specific to its type. Each step has:
 *   - a required role (finance / treasury / compliance)
 *   - a current state (pending / done / skipped / rejected)
 *   - actor + timestamp when done
 *
 * Pages render the timeline by walking `steps[]`. The "current step"
 * = first non-done. The "action area" on detail pages targets that
 * current step.
 *
 * Spec: §3, §7, §8 of v2.1 PRD
 */

import type { OperatorRole } from "./entities";

export type MoneyRequestKind =
  | "Wallet Deposit"
  | "Wallet Withdrawal"
  | "Trading Deposit"
  | "Trading Withdrawal"
  | "Transfer";

export type MoneyRequestStatus =
  | "Pending"        // waiting on current step
  | "In Progress"    // step 1 done, step 2 running
  | "Completed"
  | "Rejected"
  | "On Hold"
  | "Cancelled";

export type StepState = "pending" | "in_progress" | "done" | "skipped" | "rejected";

export interface ApprovalStep {
  key: string;
  label: string;
  /** Role required to act on this step. */
  role: OperatorRole;
  state: StepState;
  /** Notes / outcome (e.g. "Margin OK, KYC OK"). */
  outcome?: string;
  actorId?: string;
  /** ISO. */
  at?: string;
  /** Required fields the actor must fill before approving. */
  requires?: string[];
}

export interface TimelineEvent {
  at: string;
  text: string;
  by?: string;        // operator id or "system"
  kind?: "info" | "warn" | "error";
}

/* ── Step templates per Money Request kind ────────────────────── */

export const STEP_TEMPLATES: Record<MoneyRequestKind, ApprovalStep[]> = {
  /* Wallet Deposit: 1) Treasury confirms PSP credited 2) Finance posts to wallet */
  "Wallet Deposit": [
    { key: "treasury_confirm", label: "Treasury · 确认收款 (PSP credited)", role: "treasury", state: "pending",
      requires: ["psp_settlement_id"] },
    { key: "finance_post",     label: "Finance · 入账客户钱包",            role: "finance",  state: "pending" },
  ],
  /* Wallet Withdrawal: 1) Finance + Compliance audit 2) Treasury executes payout */
  "Wallet Withdrawal": [
    { key: "finance_audit",   label: "Finance · 审核合规、KYC、Policy",   role: "finance",    state: "pending",
      requires: ["risk_decision"] },
    { key: "compliance_aml",  label: "Compliance · AML & 风险评估",        role: "compliance", state: "pending" },
    { key: "treasury_payout", label: "Treasury · 通道实际付款",           role: "treasury",   state: "pending",
      requires: ["channel_reference"] },
  ],
  /* Trading Deposit: 1) (external 直入时 Treasury 确认) 2) Finance pushes to MT */
  "Trading Deposit": [
    { key: "treasury_confirm", label: "Treasury · 确认外部资金到位 (仅直入)", role: "treasury", state: "pending",
      requires: ["psp_settlement_id"] },
    { key: "finance_mt_push",  label: "Finance · 上分到 MT 账户",            role: "finance",  state: "pending",
      requires: ["mt_transaction_id"] },
  ],
  /* Trading Withdrawal: 1) Finance verifies margin/positions 2) Treasury executes payout */
  "Trading Withdrawal": [
    { key: "finance_margin", label: "Finance · 核验 margin / positions / KYC", role: "finance",  state: "pending",
      requires: ["margin_calc", "withdrawable_formula"] },
    { key: "treasury_payout", label: "Treasury · 付款给客户",                  role: "treasury", state: "pending",
      requires: ["channel_reference"] },
  ],
  /* Transfer: single Finance approval (or Compliance for P2P) */
  "Transfer": [
    { key: "finance_audit", label: "Finance · 校验余额 / 限额", role: "finance", state: "pending" },
  ],
};

/** Helper — compute overall status from step states. */
export function deriveStatus(steps: ApprovalStep[]): MoneyRequestStatus {
  if (steps.some((s) => s.state === "rejected")) return "Rejected";
  if (steps.every((s) => s.state === "done" || s.state === "skipped")) return "Completed";
  const firstActive = steps.findIndex((s) => s.state === "pending" || s.state === "in_progress");
  if (firstActive === 0) return "Pending";
  return "In Progress";
}

/** Helper — first non-done step (the one that needs action). */
export function currentStep(steps: ApprovalStep[]): ApprovalStep | undefined {
  return steps.find((s) => s.state === "pending" || s.state === "in_progress");
}

/* ── Style maps ───────────────────────────────────────────────── */

export const STATUS_FG: Record<MoneyRequestStatus, { text: string; dot: string }> = {
  Pending:       { text: "text-amber-700",   dot: "bg-amber-500"   },
  "In Progress": { text: "text-blue-700",    dot: "bg-blue-500"    },
  Completed:     { text: "text-emerald-700", dot: "bg-emerald-500" },
  Rejected:      { text: "text-red-700",     dot: "bg-red-500"     },
  "On Hold":     { text: "text-slate-600",   dot: "bg-slate-400"   },
  Cancelled:     { text: "text-slate-500",   dot: "bg-slate-400"   },
};

export const STEP_STATE_FG: Record<StepState, { text: string; dot: string; bg: string }> = {
  pending:     { text: "text-slate-500",   dot: "bg-slate-300",   bg: "border-slate-200 bg-slate-50/40" },
  in_progress: { text: "text-blue-700",    dot: "bg-blue-500",    bg: "border-blue-100 bg-blue-50/40" },
  done:        { text: "text-emerald-700", dot: "bg-emerald-500", bg: "border-emerald-100 bg-emerald-50/40" },
  skipped:     { text: "text-slate-400",   dot: "bg-slate-300",   bg: "border-slate-200 bg-slate-50/30" },
  rejected:    { text: "text-red-700",     dot: "bg-red-500",     bg: "border-red-200 bg-red-50/40" },
};
