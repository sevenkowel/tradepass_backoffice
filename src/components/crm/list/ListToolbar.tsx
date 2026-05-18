"use client";

/**
 * ListToolbar — single-row filter + primary-action bar.
 *
 * Reference: docs/ui/list-page-spec.md §3.
 *
 * Order (left → right):
 *   1. Search input (max-width 320px, debounced 250ms)
 *   2. Vertical divider (hidden on small screens)
 *   3. Quick filter chips (toggle on/off)
 *   4. Advanced filter button (opens drawer; shows red badge for N active)
 *   5. Primary CTA (right-aligned)
 *
 * Generic over the page's filter shape — pass any `Record<string, unknown>`
 * as `filters` and a `patch` callback. Quick chips are declared inline.
 */

import { useState, useEffect, useRef, type ReactNode } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

/** A single quick-chip definition. */
export interface QuickChipDef<F extends Record<string, unknown>> {
  /** Stable id (also fine for i18n keys). */
  id: string;
  /** Display label (use the i18n-resolved string or pass via `label`). */
  label: string;
  /** Filter patch this chip applies when activated. */
  apply: Partial<F>;
  /** Visual tone for the active state. */
  tone?: "emerald" | "amber" | "red" | "violet" | "slate";
}

interface Props<F extends Record<string, unknown>> {
  search: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;

  /** Current filter state — chips read this to compute active state. */
  filters: Partial<F>;
  /** Patch the filter set. Pass `undefined`/`null`/`""` as a value to clear a key. */
  onFilterChange: (patch: Partial<F>) => void;

  /** Quick chip definitions. Order = display order. */
  quickChips?: QuickChipDef<F>[];

  /** Open the advanced filter drawer. Hidden when not provided. */
  onOpenAdvanced?: () => void;
  /** Number of advanced filters currently active (for the badge). */
  advancedCount?: number;
  /** Label for the advanced filter button. */
  advancedLabel?: string;

  /** Right-aligned primary action. */
  primaryAction?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  };
}

const TONE_INACTIVE =
  "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50";
const TONE_ACTIVE: Record<NonNullable<QuickChipDef<Record<string, unknown>>["tone"]>, string> = {
  emerald: "bg-emerald-50 border-emerald-300 text-emerald-700",
  amber:   "bg-amber-50 border-amber-300 text-amber-700",
  red:     "bg-red-50 border-red-300 text-red-700",
  violet:  "bg-violet-50 border-violet-300 text-violet-700",
  slate:   "bg-slate-200 border-slate-300 text-slate-700",
};

export function ListToolbar<F extends Record<string, unknown>>({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  filters,
  onFilterChange,
  quickChips = [],
  onOpenAdvanced,
  advancedCount = 0,
  advancedLabel = "Advanced filters",
  primaryAction,
}: Props<F>) {
  // Debounce search input: keep typing snappy, only propagate after 250ms idle.
  //
  // `onSearchChange` is read via a ref so callers don't have to memoise
  // their callbacks. An inline arrow like `onSearchChange={(q) => ...}`
  // would otherwise re-fire this effect on every parent render, schedule
  // a new 250 ms timeout, and (since `localSearch` doesn't change) call
  // `onSearchChange("")`, triggering a re-fetch and an infinite loop.
  const [localSearch, setLocalSearch] = useState(search);
  const firstRender = useRef(true);
  const onSearchChangeRef = useRef(onSearchChange);
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const h = setTimeout(() => onSearchChangeRef.current(localSearch), 250);
    return () => clearTimeout(h);
  }, [localSearch]);  // ← intentionally only localSearch

  // Sync external resets (e.g. clear-all) back into local state.
  useEffect(() => {
    if (search !== localSearch) setLocalSearch(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const isChipActive = (chip: QuickChipDef<F>): boolean =>
    Object.entries(chip.apply).every(
      ([k, v]) => (filters as Record<string, unknown>)[k] === v,
    );

  const toggleChip = (chip: QuickChipDef<F>) => {
    if (isChipActive(chip)) {
      const cleared: Partial<F> = {};
      for (const k of Object.keys(chip.apply)) {
        (cleared as Record<string, unknown>)[k] = undefined;
      }
      onFilterChange(cleared);
    } else {
      onFilterChange(chip.apply);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search — leftmost. Capped width so it doesn't eat the row. */}
      <div className="relative w-full sm:w-80 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full h-9 pl-10 pr-9 bg-white border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
        />
        {localSearch && (
          <button
            onClick={() => setLocalSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Light vertical divider — only when there are chips to follow */}
      {quickChips.length > 0 && (
        <div className="hidden sm:block self-stretch w-px bg-slate-200 my-1.5" aria-hidden />
      )}

      {/* Quick chips */}
      {quickChips.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {quickChips.map((chip) => {
            const active = isChipActive(chip);
            return (
              <button
                key={chip.id}
                onClick={() => toggleChip(chip)}
                className={`h-9 px-3 inline-flex items-center gap-1.5 text-sm font-medium rounded-lg border transition-colors ${
                  active ? TONE_ACTIVE[chip.tone ?? "slate"] : TONE_INACTIVE
                }`}
              >
                {chip.label}
                {active && <X className="w-3 h-3" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Advanced filter — outline, low-key. Red badge when active. */}
      {onOpenAdvanced && (
        <button
          onClick={onOpenAdvanced}
          className={`h-9 px-3 inline-flex items-center gap-1.5 text-sm font-medium rounded-lg border transition-colors ${
            advancedCount > 0
              ? "bg-white border-slate-300 text-slate-800"
              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
          }`}
          title={advancedLabel}
        >
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span className="hidden sm:inline">{advancedLabel}</span>
          {advancedCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
              {advancedCount}
            </span>
          )}
        </button>
      )}

      {/* Primary CTA — right-aligned via `ml-auto` */}
      {primaryAction && (
        <button
          onClick={primaryAction.onClick}
          className="ml-auto h-9 px-3.5 inline-flex items-center gap-1.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
        >
          {primaryAction.icon}
          {primaryAction.label}
        </button>
      )}
    </div>
  );
}
