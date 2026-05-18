"use client";

/**
 * ClientsToolbar — single-row search + quick filter chips + advanced filter trigger.
 *
 * Replaces the previous two-row FilterBar (search row + collapsible filter grid).
 * The new layout collapses everything into one row so the page chrome stays
 * compact and visually balanced:
 *
 *   [Search 320px] · [Quick chips: 活跃, 待审 KYC, 高风险, VIP, 冻结] ··· [高级筛选 N]
 *
 * Quick chips toggle a single filter on/off (e.g. clicking 活跃 sets
 * status="active"; clicking it again clears it). They cover the 5 most
 * frequent operational filters; everything else lives in the advanced
 * filter drawer.
 *
 * The "高级筛选" button shows the count of currently-active *advanced*
 * filters (excludes search + quick chips, which already display inline).
 */

import { useState, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, X, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { ClientListParams } from "@/types/backoffice/user";

/** A single quick-chip definition. */
interface QuickChip {
  /** Stable id, also doubles as i18n key suffix (`clients.quick.<id>`). */
  id: string;
  /** Filter patch this chip applies when active. */
  apply: Partial<ClientListParams>;
  /** Visual tone — drives chip colour when active. */
  tone: "emerald" | "amber" | "red" | "violet" | "slate";
}

const QUICK_CHIPS: QuickChip[] = [
  { id: "active",       apply: { status: "active" },        tone: "emerald" },
  { id: "pendingKyc",   apply: { kycStatus: "pending" },    tone: "amber"   },
  { id: "highRisk",     apply: { riskLevel: "high" },       tone: "red"     },
  { id: "vip",          apply: { level: "vip" },            tone: "violet"  },
  { id: "frozen",       apply: { status: "frozen" },        tone: "slate"   },
];

const TONE_INACTIVE = "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50";
const TONE_ACTIVE: Record<QuickChip["tone"], string> = {
  emerald: "bg-emerald-50 border-emerald-300 text-emerald-700",
  amber:   "bg-amber-50 border-amber-300 text-amber-700",
  red:     "bg-red-50 border-red-300 text-red-700",
  violet:  "bg-violet-50 border-violet-300 text-violet-700",
  slate:   "bg-slate-200 border-slate-300 text-slate-700",
};

interface ClientsToolbarProps {
  search: string;
  onSearchChange: (q: string) => void;
  /** Currently-applied filters. */
  filters: Partial<ClientListParams>;
  /** Patch the filter set. Pass an empty value to clear a key. */
  onFilterChange: (patch: Partial<ClientListParams>) => void;
  /** Open the advanced-filter drawer. */
  onOpenAdvanced: () => void;
  /** Number of advanced filters currently active (excludes search + chips). */
  advancedCount: number;
  /** Primary CTA on the right — open the "invite client" flow.
   *  Forex back-offices typically forbid manual user creation; the
   *  realistic action is "generate signup link" / "send invite email".
   *  Page wires this to whatever flow it implements. */
  onInvite?: () => void;
}

export function ClientsToolbar({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onOpenAdvanced,
  advancedCount,
  onInvite,
}: ClientsToolbarProps) {
  const { t } = useT();

  // Debounce: keep local input snappy, only propagate after 250ms idle.
  // `onSearchChange` is read via a ref so callers don't have to memoise
  // it (an inline arrow from the parent would otherwise re-fire this
  // effect every render → 250 ms later it'd call onSearchChange("") →
  // re-fetch → loop). See list-page-spec.md.
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
  }, [localSearch]);

  // Sync external resets (Clear button) back into the input.
  useEffect(() => {
    if (search !== localSearch) setLocalSearch(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const isChipActive = (chip: QuickChip): boolean => {
    return Object.entries(chip.apply).every(
      ([k, v]) => (filters as Record<string, unknown>)[k] === v,
    );
  };

  const toggleChip = (chip: QuickChip) => {
    if (isChipActive(chip)) {
      // Clear the keys this chip set
      const cleared: Partial<ClientListParams> = {};
      for (const k of Object.keys(chip.apply)) {
        (cleared as Record<string, undefined>)[k] = undefined;
      }
      onFilterChange(cleared);
    } else {
      onFilterChange(chip.apply);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search — leftmost. Capped at 320px so it doesn't eat the whole row. */}
      <div className="relative w-full sm:w-80 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={t("clients.filter.search")}
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

      {/* Light divider — separates "find by string" (search) from
          "find by attribute" (chips + advanced). */}
      <div className="hidden sm:block self-stretch w-px bg-slate-200 my-1.5" aria-hidden="true" />

      {/* Quick chips — middle */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {QUICK_CHIPS.map((chip) => {
          const active = isChipActive(chip);
          return (
            <button
              key={chip.id}
              onClick={() => toggleChip(chip)}
              className={cn(
                "h-9 px-3 inline-flex items-center gap-1.5 text-sm font-medium rounded-lg border transition-colors",
                active ? TONE_ACTIVE[chip.tone] : TONE_INACTIVE,
              )}
            >
              {t(`clients.quick.${chip.id}`)}
              {active && <X className="w-3 h-3" />}
            </button>
          );
        })}
      </div>

      {/* Advanced filter — right after chips. Reads as "more filter
          options if these chips aren't enough". Low-key outline style;
          a red badge surfaces when advanced filters are active. */}
      <button
        onClick={onOpenAdvanced}
        className={cn(
          "h-9 px-3 inline-flex items-center gap-1.5 text-sm font-medium rounded-lg border transition-colors",
          advancedCount > 0
            ? "bg-white border-slate-300 text-slate-800"
            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
        )}
        title={t("clients.filter.advanced")}
      >
        <SlidersHorizontal className="w-4 h-4 text-slate-500" />
        <span className="hidden sm:inline">{t("clients.filter.advanced")}</span>
        {advancedCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
            {advancedCount}
          </span>
        )}
      </button>

      {/* Far-right — primary CTA "Invite client". */}
      {onInvite && (
        <button
          onClick={onInvite}
          className="ml-auto h-9 px-3.5 inline-flex items-center gap-1.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          {t("clients.action.invite")}
        </button>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* Helpers                                                               */
/* --------------------------------------------------------------------- */

/**
 * Keys the advanced-filter drawer manages. The badge on the "高级筛选"
 * button counts how many of these are currently active.
 *
 * v3 (2026-05-14): drawer carries status / risk / tag / country / account
 * count range / KYC status. Quick chips and the drawer overlap on
 * status / risk / kyc — that's intentional: chips cover the common
 * single-value picks; the drawer lets users pick any value (e.g. "closed",
 * "critical") plus combine multiple conditions.
 */
export const ADVANCED_FILTER_KEYS = new Set<keyof ClientListParams>([
  "status",
  "kycStatus",
  "riskLevel",
  "tag",
  "country",
  "minAccountCount",
  "maxAccountCount",
]);

/** Legacy alias — kept so older imports don't break. */
export const QUICK_CHIP_KEYS = new Set<keyof ClientListParams>([
  "status",
  "kycStatus",
  "riskLevel",
  "level",
]);

/** Count how many advanced filters are active (drawer-managed keys with values). */
export function countAdvancedFilters(filters: Partial<ClientListParams>): number {
  let n = 0;
  for (const k of ADVANCED_FILTER_KEYS) {
    const v = filters[k];
    if (v === undefined || v === null || v === "") continue;
    n += 1;
  }
  return n;
}
