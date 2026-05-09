"use client";

import { cn } from "@/lib/utils";
import type { SLACaseStatus } from "@/types/clm";

interface SLABadgeProps {
  status: SLACaseStatus;
  remainingMinutes?: number;
  className?: string;
}

const config: Record<SLACaseStatus, { label: string; color: string; bg: string }> = {
  normal: { label: "Normal", color: "text-emerald-700", bg: "bg-emerald-100" },
  near_timeout: { label: "Near Timeout", color: "text-amber-700", bg: "bg-amber-100" },
  timeout: { label: "Timeout", color: "text-red-700", bg: "bg-red-100" },
};

export function SLABadge({ status, remainingMinutes, className }: SLABadgeProps) {
  const cfg = config[status];
  const timeText = remainingMinutes !== undefined
    ? remainingMinutes <= 0
      ? `${Math.abs(remainingMinutes)}m overdue`
      : `${remainingMinutes}m left`
    : cfg.label;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        cfg.bg,
        cfg.color,
        className
      )}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full mr-1.5", {
          "bg-emerald-500": status === "normal",
          "bg-amber-500": status === "near_timeout",
          "bg-red-500": status === "timeout",
        })}
      />
      {timeText}
    </span>
  );
}
