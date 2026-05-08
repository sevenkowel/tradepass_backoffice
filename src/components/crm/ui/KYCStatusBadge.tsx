"use client";

import { cn } from "@/lib/utils";
import type { KYCStatus } from "@/types/backoffice/user";

interface KYCStatusBadgeProps {
  status: KYCStatus;
  className?: string;
}

const config: Record<KYCStatus, { label: string; color: string; bg: string }> = {
  not_submitted: { label: "Not Submitted", color: "text-slate-600", bg: "bg-slate-100" },
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-100" },
  verified: { label: "Verified", color: "text-emerald-700", bg: "bg-emerald-100" },
  rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-100" },
};

export function KYCStatusBadge({ status, className }: KYCStatusBadgeProps) {
  const cfg = config[status];

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", cfg.bg, cfg.color, className)}>
      {cfg.label}
    </span>
  );
}
