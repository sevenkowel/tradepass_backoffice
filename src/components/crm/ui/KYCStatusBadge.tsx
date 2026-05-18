"use client";

import type { KYCStatus } from "@/types/backoffice/user";
import { BadgeBase, type BadgeTone } from "./BadgeBase";

interface KYCStatusBadgeProps {
  status: KYCStatus;
  className?: string;
}

const config: Record<KYCStatus, { tone: BadgeTone; label: string; dot?: boolean }> = {
  not_submitted: { tone: "neutral", label: "Not Submitted", dot: false },
  pending:       { tone: "warning", label: "Pending" },
  verified:      { tone: "success", label: "Verified" },
  rejected:      { tone: "error",   label: "Rejected" },
};

export function KYCStatusBadge({ status, className }: KYCStatusBadgeProps) {
  const cfg = config[status];
  return (
    <BadgeBase tone={cfg.tone} dot={cfg.dot ?? true} className={className}>
      {cfg.label}
    </BadgeBase>
  );
}
