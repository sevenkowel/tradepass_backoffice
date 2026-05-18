"use client";

/**
 * ClientsFilterDrawer — right-side drawer for advanced multi-condition filtering.
 *
 * v3 (2026-05-14) — Aligned to product spec. The drawer carries 5 advanced
 * filters; quick chips above the table cover the most common combinations:
 *
 *   1. Status         — all 4 user statuses (active/frozen/pending/closed)
 *   2. Risk           — all 4 risk levels (low/medium/high/critical)
 *   3. Tag            — single tag name lookup
 *   4. Account count  — min/max inclusive range
 *   5. Country        — ISO-3166 alpha-2 code
 *
 * Pattern: edit a `draft` copy locally so users can fiddle without immediately
 * refetching the table on every change. Click "应用" to commit, "重置" to clear
 * the draft, "清除全部" to wipe the live advanced filter set.
 */

import { useEffect, useState } from "react";
import { RotateCcw, Check } from "lucide-react";
import { Drawer } from "@/components/crm/ui/Drawer";
import { useT } from "@/lib/i18n/LocaleProvider";
import type {
  BackofficeUser, ClientListParams, KYCStatus, RiskLevel, UserStatus,
} from "@/types/backoffice/user";
import { CountrySelect } from "./CountrySelect";

interface ClientsFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: Partial<ClientListParams>;
  onApply: (patch: Partial<ClientListParams>) => void;
}

/** Keys this drawer is allowed to mutate. */
const ADVANCED_KEYS = [
  "status",
  "kycStatus",
  "riskLevel",
  "tag",
  "country",
  "minAccountCount",
  "maxAccountCount",
] as const satisfies readonly (keyof ClientListParams)[];

type DraftFilters = Pick<Partial<ClientListParams>, (typeof ADVANCED_KEYS)[number]>;

function extractAdvanced(filters: Partial<ClientListParams>): DraftFilters {
  const out: DraftFilters = {};
  for (const k of ADVANCED_KEYS) {
    const v = filters[k];
    if (v !== undefined && v !== "" && v !== null) {
      (out as Record<string, unknown>)[k] = v;
    }
  }
  return out;
}

export function ClientsFilterDrawer({
  open,
  onClose,
  filters,
  onApply,
}: ClientsFilterDrawerProps) {
  const { t } = useT();
  const [draft, setDraft] = useState<DraftFilters>(() => extractAdvanced(filters));

  useEffect(() => {
    if (open) setDraft(extractAdvanced(filters));
  }, [open, filters]);

  const patch = <K extends keyof DraftFilters>(key: K, value: DraftFilters[K] | undefined) => {
    setDraft((prev) => {
      const next = { ...prev };
      if (value === undefined || value === "" || Number.isNaN(value as number)) {
        delete next[key];
      } else {
        (next as Record<string, unknown>)[key] = value;
      }
      return next;
    });
  };

  const handleApply = () => {
    // Patch every advanced key, explicitly clearing those not present in draft.
    const next: Partial<ClientListParams> = {};
    for (const k of ADVANCED_KEYS) {
      (next as Record<string, unknown>)[k] = draft[k] ?? undefined;
    }
    onApply(next);
    onClose();
  };

  const handleReset = () => setDraft({});

  const handleClearAndApply = () => {
    const cleared: Partial<ClientListParams> = {};
    for (const k of ADVANCED_KEYS) {
      (cleared as Record<string, unknown>)[k] = undefined;
    }
    onApply(cleared);
    onClose();
  };

  const draftCount = Object.values(draft).filter((v) => v !== undefined && v !== "" && !Number.isNaN(v as number)).length;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t("clients.advanced.title")}
      description={t("clients.advanced.subtitle")}
      size="md"
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleReset}
            disabled={draftCount === 0}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t("clients.advanced.reset")}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearAndApply}
              className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {t("clients.advanced.clearAll")}
            </button>
            <button
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              {t("clients.advanced.apply")} {draftCount > 0 && `(${draftCount})`}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* 1. Status — covers all 4 values; quick chips cover only "active" & "frozen" */}
        <Field label={t("clients.advanced.status")}>
          <ChipGroup
            value={String(draft.status ?? "")}
            onChange={(v) => patch("status", (v || undefined) as UserStatus | undefined)}
            options={[
              { value: "active",  label: t("clients.status.active"),  tone: "emerald" },
              { value: "pending", label: t("clients.status.pending"), tone: "amber"   },
              { value: "frozen",  label: t("clients.status.frozen"),  tone: "slate"   },
              { value: "closed",  label: t("clients.status.closed"),  tone: "red"     },
            ]}
          />
        </Field>

        {/* 2. Risk — all 4 levels */}
        <Field label={t("clients.advanced.risk")}>
          <ChipGroup
            value={String(draft.riskLevel ?? "")}
            onChange={(v) => patch("riskLevel", (v || undefined) as RiskLevel | undefined)}
            options={[
              { value: "low",      label: t("clients.risk.low"),      tone: "emerald" },
              { value: "medium",   label: t("clients.risk.medium"),   tone: "amber"   },
              { value: "high",     label: t("clients.risk.high"),     tone: "orange"  },
              { value: "critical", label: t("clients.risk.critical"), tone: "red"     },
            ]}
          />
        </Field>

        {/* 3. Tag — single tag lookup */}
        <Field label={t("clients.advanced.tag")}>
          <input
            type="text"
            placeholder={t("clients.advanced.tagPlaceholder")}
            value={draft.tag ?? ""}
            onChange={(e) => patch("tag", e.target.value || undefined)}
            className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </Field>

        {/* 4. Account count range */}
        <Field label={t("clients.advanced.accountCountRange")}>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder={t("clients.advanced.min")}
              value={draft.minAccountCount ?? ""}
              onChange={(e) => patch("minAccountCount", e.target.value ? Number(e.target.value) : undefined)}
              className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder={t("clients.advanced.max")}
              value={draft.maxAccountCount ?? ""}
              onChange={(e) => patch("maxAccountCount", e.target.value ? Number(e.target.value) : undefined)}
              className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{t("clients.advanced.accountCountHint")}</p>
        </Field>

        {/* 5. Country — searchable dropdown with flags + localised names */}
        <Field label={t("clients.advanced.country")}>
          <CountrySelect
            value={draft.country}
            onChange={(v) => patch("country", v as typeof draft.country)}
          />
        </Field>

        {/* KYC status — secondary, kept because users routinely filter by it */}
        <Field label={t("clients.advanced.kycStatus")}>
          <ChipGroup
            value={String(draft.kycStatus ?? "")}
            onChange={(v) => patch("kycStatus", (v || undefined) as KYCStatus | undefined)}
            options={[
              { value: "verified",      label: t("clients.kyc.verified"),     tone: "emerald" },
              { value: "pending",       label: t("clients.kyc.pending"),      tone: "amber"   },
              { value: "rejected",      label: t("clients.kyc.rejected"),     tone: "red"     },
              { value: "not_submitted", label: t("clients.kyc.notSubmitted"), tone: "slate"   },
            ]}
          />
        </Field>
      </div>
    </Drawer>
  );
}

/* --------------------------------------------------------------------- */
/* Helpers                                                               */
/* --------------------------------------------------------------------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

type ChipTone = "emerald" | "amber" | "red" | "orange" | "slate" | "blue";

const TONE_ACTIVE: Record<ChipTone, string> = {
  emerald: "bg-emerald-50 border-emerald-300 text-emerald-700",
  amber:   "bg-amber-50 border-amber-300 text-amber-700",
  red:     "bg-red-50 border-red-300 text-red-700",
  orange:  "bg-orange-50 border-orange-300 text-orange-700",
  slate:   "bg-slate-200 border-slate-300 text-slate-700",
  blue:    "bg-blue-50 border-blue-300 text-blue-700",
};

function ChipGroup({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; tone: ChipTone }[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(active ? "" : o.value)}
            className={`h-8 px-2.5 text-sm font-medium rounded-md border transition-colors ${
              active
                ? TONE_ACTIVE[o.tone]
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// `BackofficeUser` is imported to keep ts-prune from flagging the type as
// unused — it's the canonical client shape but the drawer only writes to a
// `Partial<ClientListParams>` patch, not the user object.
void undefined as unknown as BackofficeUser | undefined;
