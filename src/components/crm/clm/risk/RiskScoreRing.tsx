"use client";

/**
 * RiskScoreRing — circular progress meter for the composite risk score.
 *
 * Visual: a 96px ring with the score in the center; the arc colour
 * follows the risk bucket (low → emerald, medium → amber, high → orange,
 * critical → red). Replaces the previous flat numeric chip so reviewers
 * can read the level at a glance without parsing the digits.
 */

import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/clm";

interface Props {
  score: number;          // 0-100
  level: RiskLevel;
  size?: number;          // diameter in px, default 96
  strokeWidth?: number;   // ring thickness in px, default 8
  label?: string;         // optional caption under the score
  className?: string;
}

const TONE: Record<RiskLevel, { stroke: string; track: string; text: string }> = {
  low:      { stroke: "stroke-emerald-500", track: "stroke-emerald-100", text: "text-emerald-700" },
  medium:   { stroke: "stroke-amber-500",   track: "stroke-amber-100",   text: "text-amber-700"   },
  high:     { stroke: "stroke-orange-500",  track: "stroke-orange-100",  text: "text-orange-700"  },
  critical: { stroke: "stroke-red-500",     track: "stroke-red-100",     text: "text-red-700"     },
};

export function RiskScoreRing({
  score,
  level,
  size = 96,
  strokeWidth = 8,
  label,
  className,
}: Props) {
  const safe = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - safe / 100);
  const tone = TONE[level];

  return (
    <div className={cn("inline-flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            className={tone.track}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(tone.stroke, "transition-[stroke-dashoffset] duration-500")}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-2xl font-bold tabular-nums leading-none", tone.text)}>
            {safe}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">
            /100
          </span>
        </div>
      </div>
      {label && (
        <p className={cn("mt-2 text-xs font-semibold uppercase tracking-wider", tone.text)}>
          {label}
        </p>
      )}
    </div>
  );
}
