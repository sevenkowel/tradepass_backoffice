"use client";

import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/backoffice/user";

interface RiskBadgeProps {
  level?: RiskLevel;
  score?: number;
  className?: string;
}

const config: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  low: { label: "Low", color: "text-emerald-700", bg: "bg-emerald-100" },
  medium: { label: "Medium", color: "text-amber-700", bg: "bg-amber-100" },
  high: { label: "High", color: "text-orange-700", bg: "bg-orange-100" },
  critical: { label: "Critical", color: "text-red-700", bg: "bg-red-100" },
};

export function RiskBadge({ level, score, className }: RiskBadgeProps) {
  if (!level) return <span className="text-slate-400 text-xs">-</span>;

  const cfg = config[level];

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium", cfg.bg, cfg.color, className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", {
        "bg-emerald-500": level === "low",
        "bg-amber-500": level === "medium",
        "bg-orange-500": level === "high",
        "bg-red-500": level === "critical",
      })} />
      {cfg.label}
      {score !== undefined && <span className="opacity-60">({score})</span>}
    </div>
  );
}
