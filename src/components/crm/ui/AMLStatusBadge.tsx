"use client";

import type { AMLStatus } from "@/types/clm";
import { BadgeBase, type BadgeTone } from "./BadgeBase";

interface AMLStatusBadgeProps {
  status: AMLStatus;
  className?: string;
}

const config: Record<AMLStatus, { tone: BadgeTone; label: string; dot?: boolean }> = {
  not_checked: { tone: "neutral", label: "Not Checked", dot: false },
  pass:        { tone: "success", label: "Pass" },
  hit:         { tone: "error",   label: "Hit" },
  pending:     { tone: "warning", label: "Pending" },
};

export function AMLStatusBadge({ status, className }: AMLStatusBadgeProps) {
  const cfg = config[status];
  return (
    <BadgeBase tone={cfg.tone} dot={cfg.dot ?? true} className={className}>
      {cfg.label}
    </BadgeBase>
  );
}
