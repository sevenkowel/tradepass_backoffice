"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Single canonical badge primitive used across the CRM.
 *
 * Visual contract:
 *   - rounded-full
 *   - bg-{tone}-100 / text-{tone}-700
 *   - optional 1.5px status dot in bg-{tone}-500
 *   - 12px font (xs), medium weight, px-2 py-0.5
 *
 * Every domain badge (StatusBadge, RiskBadge, KYCStatusBadge,
 * AMLStatusBadge, CaseTypeBadge, SLABadge, ...) MUST be implemented
 * on top of BadgeBase to guarantee shape and rhythm consistency.
 *
 * Tones map to fixed Tailwind palettes — they intentionally don't
 * read CSS variables, since semantic state colors must remain stable
 * regardless of theme.
 */
export type BadgeTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "purple"
  | "orange"
  | "teal"
  | "indigo"
  | "rose";

const toneClass: Record<BadgeTone, { bg: string; text: string; dot: string }> = {
  neutral: { bg: "bg-slate-100",   text: "text-slate-700",   dot: "bg-slate-400"   },
  primary: { bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500"    },
  success: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  warning: { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500"   },
  error:   { bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500"     },
  info:    { bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500"    },
  purple:  { bg: "bg-purple-100",  text: "text-purple-700",  dot: "bg-purple-500"  },
  orange:  { bg: "bg-orange-100",  text: "text-orange-700",  dot: "bg-orange-500"  },
  teal:    { bg: "bg-teal-100",    text: "text-teal-700",    dot: "bg-teal-500"    },
  indigo:  { bg: "bg-indigo-100",  text: "text-indigo-700",  dot: "bg-indigo-500"  },
  rose:    { bg: "bg-rose-100",    text: "text-rose-700",    dot: "bg-rose-500"    },
};

interface BadgeBaseProps {
  tone?: BadgeTone;
  /** Show a leading status dot. Defaults to true; set false for type-only labels. */
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
  children: ReactNode;
}

export function BadgeBase({
  tone = "neutral",
  dot = true,
  size = "md",
  className,
  children,
}: BadgeBaseProps) {
  const c = toneClass[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium whitespace-nowrap",
        c.bg,
        c.text,
        size === "sm" ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-xs",
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "rounded-full mr-1.5",
            c.dot,
            size === "sm" ? "w-1 h-1" : "w-1.5 h-1.5"
          )}
        />
      )}
      {children}
    </span>
  );
}
