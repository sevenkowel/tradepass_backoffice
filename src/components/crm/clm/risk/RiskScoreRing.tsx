"use client";

/**
 * RiskScoreRing — composite risk score readout.
 *
 * Visual contract (v2 — see ADR "Case detail page – de-AI'd"):
 *   - A big tabular number, a level badge, and a 1.5px horizontal bar.
 *   - No SVG ring, no stroke animation — the previous circular dial
 *     read as an "AI dashboard meter" rather than a banking number.
 *
 * The component name + export shape are unchanged so callers don't
 * need to update imports.
 */

import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/clm";

interface Props {
  score: number;          // 0-100
  level: RiskLevel;
  /** Caption rendered below the score (e.g. "AML: hit"). */
  label?: string;
  className?: string;
}

const TONE: Record<
  RiskLevel,
  { text: string; bar: string; bg: string; chipBg: string; chipText: string; chipLabel: string }
> = {
  low:      { text: "text-emerald-700", bar: "bg-emerald-500", bg: "bg-emerald-100",
              chipBg: "bg-emerald-100", chipText: "text-emerald-700", chipLabel: "Low" },
  medium:   { text: "text-amber-700",   bar: "bg-amber-500",   bg: "bg-amber-100",
              chipBg: "bg-amber-100",   chipText: "text-amber-700",   chipLabel: "Medium" },
  high:     { text: "text-orange-700",  bar: "bg-orange-500",  bg: "bg-orange-100",
              chipBg: "bg-orange-100",  chipText: "text-orange-700",  chipLabel: "High" },
  critical: { text: "text-red-700",     bar: "bg-red-500",     bg: "bg-red-100",
              chipBg: "bg-red-100",     chipText: "text-red-700",     chipLabel: "Critical" },
};

export function RiskScoreRing({ score, level, label, className }: Props) {
  const safe = Math.max(0, Math.min(100, score));
  const tone = TONE[level];

  return (
    <div className={cn("flex flex-col items-start gap-2 w-full", className)}>
      <div className="flex items-baseline gap-3 w-full">
        <span className={cn("text-3xl font-semibold tabular-nums leading-none", tone.text)}>
          {safe}
        </span>
        <span className="text-xs text-slate-400 tabular-nums">/100</span>
        <span className="flex-1" />
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", tone.chipBg, tone.chipText)}>
          {tone.chipLabel}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${safe}%` }} />
      </div>
      {label && (
        <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
      )}
    </div>
  );
}
