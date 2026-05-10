"use client";

/**
 * RiskFactorList — explainable 6-axis risk breakdown.
 *
 * Each row shows one factor (Country / Identity / Device-IP / IB / AML
 * / Blacklist) with its score, level chip, and a chevron. Click a row
 * to expand and see the reasoning sentence + structured evidence (the
 * data the engine fed into its scoring decision).
 *
 * The component is read-only — operators don't change scores here, the
 * engine does. They consume this to understand *why* the composite is
 * what it is.
 */

import { useState } from "react";
import { ChevronDown, Globe, Fingerprint, Wifi, Users, ShieldAlert, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskFactor, RiskFactorKey } from "@/types/core";
import type { RiskLevel } from "@/types/clm";

interface Props {
  factors: RiskFactor[];
  className?: string;
}

const FACTOR_ICON: Record<RiskFactorKey, typeof Globe> = {
  country: Globe,
  identity: Fingerprint,
  device_ip: Wifi,
  ib_source: Users,
  aml: ShieldAlert,
  blacklist: Ban,
};

const LEVEL_TONE: Record<RiskLevel, { chip: string; bar: string }> = {
  low:      { chip: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" },
  medium:   { chip: "bg-amber-100 text-amber-700",     bar: "bg-amber-500"   },
  high:     { chip: "bg-orange-100 text-orange-700",   bar: "bg-orange-500"  },
  critical: { chip: "bg-red-100 text-red-700",         bar: "bg-red-500"     },
};

const LEVEL_LABEL: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export function RiskFactorList({ factors, className }: Props) {
  const [openKey, setOpenKey] = useState<RiskFactorKey | null>(null);

  return (
    <div className={cn("divide-y divide-slate-100", className)}>
      {factors.map((f) => {
        const Icon = FACTOR_ICON[f.key];
        const tone = LEVEL_TONE[f.level];
        const isOpen = openKey === f.key;
        return (
          <div key={f.key} className="text-sm">
            <button
              onClick={() => setOpenKey(isOpen ? null : f.key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
            >
              <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="font-medium text-slate-700 flex-1 truncate">{f.label}</span>

              {/* Mini progress bar — consumes 60px, conveys magnitude visually. */}
              <div className="hidden sm:block w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-[width] duration-500", tone.bar)}
                  style={{ width: `${Math.max(0, Math.min(100, f.score))}%` }}
                />
              </div>

              <span className="font-mono tabular-nums text-xs text-slate-500 w-7 text-right">
                {f.score}
              </span>
              <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", tone.chip)}>
                {LEVEL_LABEL[f.level]}
              </span>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-slate-400 transition-transform flex-shrink-0",
                  isOpen && "rotate-180"
                )}
              />
            </button>

            {isOpen && (
              <div className="px-3 pb-3 pt-1 space-y-2 bg-slate-50/60">
                <p className="text-xs text-slate-700 leading-relaxed">{f.reasoning}</p>
                {Object.keys(f.evidence).length > 0 && (
                  <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-1 text-[11px]">
                    {Object.entries(f.evidence).map(([k, v]) => (
                      <div key={k} className="contents">
                        <dt className="text-slate-400 font-medium uppercase tracking-wider">
                          {k.replace(/([A-Z])/g, " $1").trim()}
                        </dt>
                        <dd className="text-slate-700 break-words">
                          {formatEvidence(v)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  Weight in composite: <span className="font-mono tabular-nums">{(f.weight * 100).toFixed(0)}%</span>
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatEvidence(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toString();
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value.join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
