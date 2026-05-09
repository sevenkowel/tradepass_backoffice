"use client";

import { cn } from "@/lib/utils";
import type { AMLStatus } from "@/types/clm";

interface AMLStatusBadgeProps {
  status: AMLStatus;
  className?: string;
}

const config: Record<AMLStatus, { label: string; color: string; bg: string }> = {
  not_checked: { label: "Not Checked", color: "text-gray-600", bg: "bg-gray-100" },
  pass: { label: "Pass", color: "text-emerald-700", bg: "bg-emerald-100" },
  hit: { label: "Hit", color: "text-red-700", bg: "bg-red-100" },
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-100" },
};

export function AMLStatusBadge({ status, className }: AMLStatusBadgeProps) {
  const cfg = config[status];
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
          "bg-emerald-500": status === "pass",
          "bg-red-500": status === "hit",
          "bg-amber-500": status === "pending",
          "bg-gray-400": status === "not_checked",
        })}
      />
      {cfg.label}
    </span>
  );
}
