/**
 * Mock data — Approval Workflow (read-only view of the active flows
 * that gate fund decisions). The actual editor lives in Approval
 * Center; here we just visualise so funds operators understand the
 * decision pipeline without leaving the module.
 *
 * Spec: `docscc/产品文档/2026-05-17-funds-module-design.md` §7.8
 */

export interface WorkflowStep {
  label: string;
  /** "auto" steps run without human input; "human" needs an operator. */
  kind: "auto" | "human" | "decision" | "end";
  /** Optional next-step branch keys (only for `decision`). */
  branches?: { label: string; target: string }[];
  /** Required role to act, if `human`. */
  role?: string;
}

export interface Workflow {
  id: string;
  trigger: string;           // e.g. "Withdrawal request"
  description: string;
  steps: WorkflowStep[];
  lastEdited: string;        // ISO
  lastEditedBy: string;
}

export const mockWorkflows: Workflow[] = [
  {
    id: "WF-WD-001",
    trigger: "Withdrawal request",
    description: "Standard withdrawal pipeline (auto-approval lane with risk-based diversion).",
    steps: [
      { label: "Submitted",                    kind: "end" },
      { label: "Auto checks (KYC, channel, AML)", kind: "auto" },
      { label: "Branch: low risk?",            kind: "decision",
        branches: [
          { label: "Yes",  target: "Auto-approve"  },
          { label: "No",   target: "Manual review" },
        ] },
      { label: "Auto-approve → channel send",  kind: "auto" },
      { label: "Manual review (Tier1 approver)", kind: "human", role: "funds_reviewer_l1" },
      { label: "Branch: amount > $10k?",       kind: "decision",
        branches: [
          { label: "Yes", target: "Senior approver" },
          { label: "No",  target: "Send to channel" },
        ] },
      { label: "Senior approver (Tier2)",      kind: "human", role: "funds_reviewer_l2" },
      { label: "Send to channel",              kind: "auto" },
      { label: "Completed",                    kind: "end" },
    ],
    lastEdited: "2026-05-10T10:00:00.000Z",
    lastEditedBy: "approval_admin",
  },
  {
    id: "WF-DEP-001",
    trigger: "Deposit auto-match failure",
    description: "Fallback when an incoming bank credit cannot be auto-matched to a client.",
    steps: [
      { label: "Auto-match attempt",   kind: "auto" },
      { label: "Confidence < 70%",     kind: "decision",
        branches: [
          { label: "Yes", target: "Manual match queue" },
          { label: "No",  target: "Credit client" },
        ] },
      { label: "Manual match queue",   kind: "human", role: "funds_ops" },
      { label: "Credit client",        kind: "auto" },
      { label: "Completed",            kind: "end" },
    ],
    lastEdited: "2026-04-22T09:00:00.000Z",
    lastEditedBy: "approval_admin",
  },
  {
    id: "WF-ADJ-001",
    trigger: "Manual adjustment",
    description: "Any manual ledger entry requires approval before posting.",
    steps: [
      { label: "Submitted by ops",     kind: "human", role: "funds_ops" },
      { label: "Branch: amount > $5k?", kind: "decision",
        branches: [
          { label: "Yes", target: "L2 + Compliance" },
          { label: "No",  target: "L1 approval" },
        ] },
      { label: "L1 approval",          kind: "human", role: "funds_reviewer_l1" },
      { label: "L2 + Compliance",      kind: "human", role: "funds_reviewer_l2 + compliance" },
      { label: "Posted to ledger",     kind: "auto" },
      { label: "Completed",            kind: "end" },
    ],
    lastEdited: "2026-05-05T14:00:00.000Z",
    lastEditedBy: "approval_admin",
  },
];

export const STEP_KIND_FG: Record<WorkflowStep["kind"], { text: string; dot: string; bg: string }> = {
  auto:     { text: "text-emerald-700", dot: "bg-emerald-500", bg: "border-emerald-100 bg-emerald-50/40" },
  human:    { text: "text-blue-700",    dot: "bg-blue-500",    bg: "border-blue-100 bg-blue-50/40" },
  decision: { text: "text-amber-700",   dot: "bg-amber-500",   bg: "border-amber-100 bg-amber-50/40" },
  end:      { text: "text-slate-600",   dot: "bg-slate-400",   bg: "border-slate-200 bg-slate-50/40" },
};
