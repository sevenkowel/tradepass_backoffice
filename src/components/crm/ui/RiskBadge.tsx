"use client";

import type { RiskLevel } from "@/types/backoffice/user";
import { BadgeBase, type BadgeTone } from "./BadgeBase";

interface RiskBadgeProps {
  level?: RiskLevel;
  score?: number;
  className?: string;
}

const tone: Record<RiskLevel, { tone: BadgeTone; label: string }> = {
  low:      { tone: "success", label: "Low" },
  medium:   { tone: "warning", label: "Medium" },
  high:     { tone: "orange",  label: "High" },
  critical: { tone: "error",   label: "Critical" },
};

export function RiskBadge({ level, score, className }: RiskBadgeProps) {
  if (!level) return <span className="text-slate-400 text-xs">-</span>;
  const cfg = tone[level];

  return (
    <BadgeBase tone={cfg.tone} className={className}>
      {cfg.label}
      {score !== undefined && <span className="opacity-60 ml-1">({score})</span>}
    </BadgeBase>
  );
}
