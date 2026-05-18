"use client";

import type { ApprovalTag, SlaStatus, WorkflowStatus } from "@/types/approval";
import { BadgeBase, type BadgeTone } from "@/components/crm/ui";

const STATUS_TONE: Record<WorkflowStatus, { tone: BadgeTone; label: string }> = {
  pending:   { tone: "neutral", label: "Pending" },
  on_hold:   { tone: "warning", label: "On Hold" },
  approved:  { tone: "success", label: "Approved" },
  rejected:  { tone: "error",   label: "Rejected" },
};

const SLA_TONE: Record<SlaStatus, { tone: BadgeTone; label: string }> = {
  normal:   { tone: "success", label: "Normal" },
  warning:  { tone: "warning", label: "Warning" },
  critical: { tone: "error",   label: "Critical" },
  timeout:  { tone: "error",   label: "Timeout" },
};

const TAG_TONE: Record<ApprovalTag, { tone: BadgeTone; label: string }> = {
  claimed:           { tone: "primary", label: "Claimed" },
  escalated:         { tone: "orange",  label: "Escalated" },
  awaiting_user:     { tone: "warning", label: "Awaiting user" },
  docs_requested:    { tone: "warning", label: "Docs requested" },
  resubmitted:       { tone: "purple",  label: "Resubmitted" },
  blacklist_flagged: { tone: "error",   label: "Blacklisted" },
};

export function TaskStatusBadge({ status }: { status: WorkflowStatus }) {
  const cfg = STATUS_TONE[status];
  return <BadgeBase tone={cfg.tone}>{cfg.label}</BadgeBase>;
}

export function SlaStatusBadge({ status }: { status: SlaStatus }) {
  const cfg = SLA_TONE[status];
  return <BadgeBase tone={cfg.tone}>{cfg.label}</BadgeBase>;
}

/** Tags render as small chips alongside the status badge. Caller
 *  decides which ones to show — there is no implicit ordering rule. */
export function TaskTagBadge({ tag }: { tag: ApprovalTag }) {
  const cfg = TAG_TONE[tag];
  return <BadgeBase tone={cfg.tone} size="sm" dot={false}>{cfg.label}</BadgeBase>;
}
