"use client";

import type { SLACaseStatus } from "@/types/clm";
import { BadgeBase, type BadgeTone } from "./BadgeBase";

interface SLABadgeProps {
  status: SLACaseStatus;
  remainingMinutes?: number;
  className?: string;
}

const config: Record<SLACaseStatus, { tone: BadgeTone; label: string }> = {
  normal:       { tone: "success", label: "Normal" },
  near_timeout: { tone: "warning", label: "Near Timeout" },
  timeout:      { tone: "error",   label: "Timeout" },
};

export function SLABadge({ status, remainingMinutes, className }: SLABadgeProps) {
  const cfg = config[status];
  const timeText =
    remainingMinutes !== undefined
      ? remainingMinutes <= 0
        ? `${Math.abs(remainingMinutes)}m overdue`
        : `${remainingMinutes}m left`
      : cfg.label;

  return (
    <BadgeBase tone={cfg.tone} className={className}>
      {timeText}
    </BadgeBase>
  );
}
