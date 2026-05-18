"use client";

/**
 * Small presentational helpers extracted from cases/[id]/page.tsx.
 *
 * These were inline functions that lived alongside the 400-line page
 * component. They're moved here so the page reads top-to-bottom as a
 * narrative ("here is the layout") and not "here are 5 helpers and
 * then the layout."
 */

import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export function InfoRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <span className="text-slate-400 flex-shrink-0">{label}</span>
      <span className="font-medium text-slate-700 text-right">{value}</span>
    </div>
  );
}

const RISK_BAD = new Set(["hit", "suspicious", "auto_reject", "vpn", "proxy"]);
const RISK_GOOD = new Set(["pass", "normal", "auto_pass"]);

export function RiskItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const bad = RISK_BAD.has(value);
  const good = RISK_GOOD.has(value);
  return (
    <div className="flex items-center justify-between text-xs">
      <span
        className={
          bad ? "text-red-500" : good ? "text-emerald-500" : "text-slate-400"
        }
      >
        {label}
      </span>
      <span
        className={`font-bold capitalize ${
          bad ? "text-red-700" : good ? "text-emerald-700" : "text-slate-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function Collapsible({
  title,
  children,
  open,
  onToggle,
}: {
  title: string;
  children: ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <span className="text-sm font-bold text-slate-800">{title}</span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtDateTime(d: string | Date): string {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** SLA status — 5 buckets, kept in sync with the Review Queue list view. */
export type SLAStatus = "timeout" | "critical" | "warning" | "near" | "normal";

/** SLA computation — single source so both the header and any cell agree.
 *  Status thresholds match `review-queue/page.tsx::computeSLA`:
 *    ≤ 0min  → timeout (overdue)
 *    ≤ 5min  → critical (urgent)
 *    ≤ 10min → warning  (urgent)
 *    ≤ 30min → near
 *    > 30min → normal
 */
export function computeSLA(slaDueAt: string): {
  status: SLAStatus;
  label: string;
  urgent: boolean;
  overdue: boolean;
} {
  const diffMs = new Date(slaDueAt).getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin <= 0)
    return { status: "timeout",  label: `${Math.abs(diffMin)}m overdue`, urgent: true,  overdue: true  };
  if (diffMin <= 5)
    return { status: "critical", label: `${diffMin}m left`,              urgent: true,  overdue: false };
  if (diffMin <= 10)
    return { status: "warning",  label: `${diffMin}m left`,              urgent: true,  overdue: false };
  if (diffMin <= 30)
    return { status: "near",     label: `${diffMin}m left`,              urgent: false, overdue: false };
  return    { status: "normal",  label: `${diffMin}m left`,              urgent: false, overdue: false };
}

/** Tone classes for an SLA status pill — matches the Review Queue list. */
export const SLA_TONE: Record<SLAStatus, string> = {
  timeout:  "bg-red-100 text-red-700 border-red-200",
  critical: "bg-red-50 text-red-600 border-red-100",
  warning:  "bg-orange-50 text-orange-700 border-orange-100",
  near:     "bg-amber-50 text-amber-700 border-amber-100",
  normal:   "bg-emerald-50 text-emerald-700 border-emerald-100",
};
