"use client";

/**
 * ListStatsGrid — clickable KPI cards that double as one-click filters.
 *
 * Reference: docs/ui/list-page-spec.md §4.
 *
 * Each card carries:
 *   - `key` / `label` / `value` (display)
 *   - optional `tone` for the value colour (red / amber / emerald / blue)
 *   - optional `filter` patch to apply when clicked
 *
 * The grid is responsive: 2 cols on phones, 4-6 cols on desktop.
 */

import type { ReactNode } from "react";

type StatTone = "neutral" | "ok" | "warn" | "danger" | "info";

export interface StatCardDef {
  key: string;
  label: string;
  value: ReactNode;
  tone?: StatTone;
  /** When provided, the card becomes a button. Click applies this filter
   *  patch; click again clears the same keys. Use `null` for "show all"
   *  (clears every filter the parent owns). */
  filter?: Record<string, unknown> | null;
}

interface Props {
  stats: StatCardDef[];
  /** Current live filter state — used to compute which card is "active". */
  activeFilters?: Record<string, unknown>;
  /** Called with the card's filter patch. Pass `{}` (or null inside the
   *  patch) to clear instead of apply. */
  onApply?: (patch: Record<string, unknown>) => void;
  /** Skeleton state — render greyed cards. */
  loading?: boolean;
}

const VALUE_TONE: Record<StatTone, string> = {
  neutral: "text-slate-900",
  ok:      "text-emerald-600",
  warn:    "text-amber-600",
  danger:  "text-red-600",
  info:    "text-blue-600",
};
const RING_TONE: Record<StatTone, string> = {
  neutral: "ring-slate-300",
  ok:      "ring-emerald-300",
  warn:    "ring-amber-300",
  danger:  "ring-red-300",
  info:    "ring-blue-300",
};

export function ListStatsGrid({ stats, activeFilters, onApply, loading }: Props) {
  const isCardActive = (card: StatCardDef): boolean => {
    if (!card.filter || !activeFilters) {
      // "Show all" card is active only when there are no filters at all.
      if (card.filter === null) return Object.values(activeFilters ?? {}).every((v) => !v);
      return false;
    }
    return Object.entries(card.filter).every(
      ([k, v]) => (activeFilters as Record<string, unknown>)[k] === v,
    );
  };

  const handleClick = (card: StatCardDef) => {
    if (!onApply) return;
    if (card.filter === null) {
      // "Show all" — clear ALL filters
      onApply({});
      return;
    }
    if (!card.filter) return;
    const active = isCardActive(card);
    if (active) {
      const cleared: Record<string, unknown> = {};
      for (const k of Object.keys(card.filter)) cleared[k] = undefined;
      onApply(cleared);
    } else {
      onApply(card.filter);
    }
  };

  const cols = stats.length >= 6 ? "lg:grid-cols-6"
    : stats.length >= 4 ? "lg:grid-cols-4"
    : `lg:grid-cols-${stats.length}`;

  return (
    <div className={`grid grid-cols-2 ${cols} gap-3`}>
      {stats.map((s) => {
        const clickable = !!onApply && (s.filter !== undefined);
        const active = isCardActive(s);
        const tone = s.tone ?? "neutral";
        const Component = clickable ? "button" : "div";
        return (
          <Component
            key={s.key}
            type={clickable ? "button" : undefined}
            onClick={clickable ? () => handleClick(s) : undefined}
            className={`text-left bg-white rounded-xl border border-slate-200 p-4 transition-all ${
              clickable ? "hover:border-slate-300 hover:shadow-sm cursor-pointer" : ""
            } ${active ? `ring-2 ${RING_TONE[tone]}` : ""} ${loading ? "opacity-60" : ""}`}
          >
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 tabular-nums ${VALUE_TONE[tone]}`}>
              {s.value}
            </p>
          </Component>
        );
      })}
    </div>
  );
}
