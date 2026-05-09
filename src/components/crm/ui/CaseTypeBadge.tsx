"use client";

import { cn } from "@/lib/utils";
import type { CLMCaseType } from "@/types/clm";

interface CaseTypeBadgeProps {
  type: CLMCaseType;
  className?: string;
}

const config: Record<CLMCaseType, { label: string; color: string; bg: string }> = {
  kyc: { label: "KYC", color: "text-blue-700", bg: "bg-blue-100" },
  poa: { label: "POA", color: "text-purple-700", bg: "bg-purple-100" },
  liveness: { label: "Liveness", color: "text-teal-700", bg: "bg-teal-100" },
  video_verification: { label: "Video", color: "text-indigo-700", bg: "bg-indigo-100" },
  withdrawal_review: { label: "Withdrawal", color: "text-orange-700", bg: "bg-orange-100" },
  edd: { label: "EDD", color: "text-red-700", bg: "bg-red-100" },
  source_of_wealth: { label: "SoW", color: "text-amber-700", bg: "bg-amber-100" },
  agreement_signing: { label: "Agreement", color: "text-gray-700", bg: "bg-gray-100" },
  risk_recheck: { label: "Risk", color: "text-rose-700", bg: "bg-rose-100" },
  manual_review: { label: "Manual", color: "text-slate-700", bg: "bg-slate-100" },
};

export function CaseTypeBadge({ type, className }: CaseTypeBadgeProps) {
  const cfg = config[type];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        cfg.bg,
        cfg.color,
        className
      )}
    >
      {cfg.label}
    </span>
  );
}
