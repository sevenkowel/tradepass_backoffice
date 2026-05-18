"use client";

/**
 * AdvancedFilterDrawer — generic right-side drawer for multi-condition filters.
 *
 * Reference: docs/ui/list-page-spec.md §3 (drawer rules).
 *
 * Field types supported (declaratively):
 *   - chips      : single-select from a small enum (e.g. status, risk)
 *   - select     : native dropdown for longer lists
 *   - text       : freeform string input
 *   - numberRange: min/max pair, both optional
 *   - dateRange  : start/end ISO date inputs
 *   - custom     : any custom React node (for things like country multi-select)
 *
 * Draft pattern: changes are kept local until "Apply" — this matches what
 * operators expect (they want to fiddle with combinations before refetching).
 */

import { useEffect, useState, type ReactNode } from "react";
import { RotateCcw, Check } from "lucide-react";
import { Drawer } from "@/components/crm/ui/Drawer";

type ChipTone = "emerald" | "amber" | "red" | "orange" | "slate" | "blue" | "violet";

export type AdvancedField =
  | {
      type: "chips";
      key: string;
      label: string;
      options: { label: string; value: string; tone?: ChipTone }[];
    }
  | {
      type: "select";
      key: string;
      label: string;
      options: { label: string; value: string }[];
      placeholder?: string;
    }
  | {
      type: "text";
      key: string;
      label: string;
      placeholder?: string;
      maxLength?: number;
      transform?: "uppercase" | "lowercase";
    }
  | {
      type: "numberRange";
      key: string; // base; min stored at `${key}Min`, max at `${key}Max`
      label: string;
      minPlaceholder?: string;
      maxPlaceholder?: string;
      minKey?: string; // override default `${key}Min`
      maxKey?: string;
      hint?: string;
    }
  | {
      type: "dateRange";
      key: string; // base; start at `startDate`, end at `endDate` by default
      label: string;
      startKey?: string;
      endKey?: string;
    }
  | {
      type: "custom";
      key: string;
      label: string;
      hint?: string;
      render: (
        value: unknown,
        onChange: (v: unknown) => void,
        ctx: { draft: Record<string, unknown> },
      ) => ReactNode;
    };

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  fields: AdvancedField[];
  /** Current live filter set — read-only; drawer keeps its own draft. */
  filters: Record<string, unknown>;
  /** Commit a patch of the keys this drawer manages. Pass `undefined` for
   *  a key to clear it. Parent should merge into its filter state. */
  onApply: (patch: Record<string, unknown>) => void;
  labels?: {
    apply?: string;
    reset?: string;
    clearAll?: string;
  };
}

const DEFAULT_LABELS = {
  apply: "Apply",
  reset: "Reset draft",
  clearAll: "Clear all",
};

const TONE_ACTIVE: Record<ChipTone, string> = {
  emerald: "bg-emerald-50 border-emerald-300 text-emerald-700",
  amber:   "bg-amber-50 border-amber-300 text-amber-700",
  red:     "bg-red-50 border-red-300 text-red-700",
  orange:  "bg-orange-50 border-orange-300 text-orange-700",
  slate:   "bg-slate-200 border-slate-300 text-slate-700",
  blue:    "bg-blue-50 border-blue-300 text-blue-700",
  violet:  "bg-violet-50 border-violet-300 text-violet-700",
};

/* Collect every key a field can write to, used for "extract" + "clear all". */
function fieldKeys(f: AdvancedField): string[] {
  switch (f.type) {
    case "numberRange":
      return [f.minKey ?? `${f.key}Min`, f.maxKey ?? `${f.key}Max`];
    case "dateRange":
      return [f.startKey ?? "startDate", f.endKey ?? "endDate"];
    default:
      return [f.key];
  }
}

function extractDraft(filters: Record<string, unknown>, fields: AdvancedField[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    for (const k of fieldKeys(f)) {
      const v = filters[k];
      if (v !== undefined && v !== "" && v !== null) out[k] = v;
    }
  }
  return out;
}

export function AdvancedFilterDrawer({
  open, onClose, title, subtitle, fields, filters, onApply, labels,
}: Props) {
  const l = { ...DEFAULT_LABELS, ...labels };
  const [draft, setDraft] = useState<Record<string, unknown>>(() => extractDraft(filters, fields));

  // Re-sync draft each time the drawer opens.
  useEffect(() => {
    if (open) setDraft(extractDraft(filters, fields));
  }, [open, filters, fields]);

  const set = (key: string, value: unknown) => {
    setDraft((prev) => {
      const next = { ...prev };
      if (value === undefined || value === "" || value === null
          || (Array.isArray(value) && value.length === 0)) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const handleApply = () => {
    // Explicitly include cleared keys as `undefined` so the parent's
    // patch handler can remove them.
    const patch: Record<string, unknown> = {};
    for (const f of fields) {
      for (const k of fieldKeys(f)) {
        patch[k] = draft[k] ?? undefined;
      }
    }
    onApply(patch);
    onClose();
  };

  const handleReset = () => setDraft({});

  const handleClearAll = () => {
    const cleared: Record<string, unknown> = {};
    for (const f of fields) {
      for (const k of fieldKeys(f)) cleared[k] = undefined;
    }
    onApply(cleared);
    onClose();
  };

  const draftCount = Object.values(draft).filter((v) =>
    v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)
  ).length;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      description={subtitle}
      size="md"
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleReset}
            disabled={draftCount === 0}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {l.reset}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearAll}
              className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {l.clearAll}
            </button>
            <button
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              {l.apply} {draftCount > 0 && `(${draftCount})`}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {fields.map((f) => (
          <Field key={f.key} field={f} draft={draft} set={set} />
        ))}
      </div>
    </Drawer>
  );
}

/* --------------------------------------------------------------------- */
/* Field renderers                                                       */
/* --------------------------------------------------------------------- */

function Field({
  field, draft, set,
}: {
  field: AdvancedField;
  draft: Record<string, unknown>;
  set: (key: string, value: unknown) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
        {field.label}
      </label>
      {renderField(field, draft, set)}
      {"hint" in field && field.hint && (
        <p className="text-[11px] text-slate-400 mt-1">{field.hint}</p>
      )}
    </div>
  );
}

function renderField(
  f: AdvancedField,
  draft: Record<string, unknown>,
  set: (key: string, value: unknown) => void,
): ReactNode {
  switch (f.type) {
    case "chips": {
      const value = String(draft[f.key] ?? "");
      return (
        <div className="flex flex-wrap gap-1.5">
          {f.options.map((o) => {
            const active = value === o.value;
            const tone = o.tone ?? "slate";
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => set(f.key, active ? undefined : o.value)}
                className={`h-8 px-2.5 text-sm font-medium rounded-md border transition-colors ${
                  active
                    ? TONE_ACTIVE[tone]
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

    case "select":
      return (
        <select
          value={String(draft[f.key] ?? "")}
          onChange={(e) => set(f.key, e.target.value || undefined)}
          className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">{f.placeholder ?? "—"}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );

    case "text": {
      const raw = String(draft[f.key] ?? "");
      return (
        <input
          type="text"
          placeholder={f.placeholder}
          maxLength={f.maxLength}
          value={raw}
          onChange={(e) => {
            let next = e.target.value;
            if (f.transform === "uppercase") next = next.toUpperCase();
            else if (f.transform === "lowercase") next = next.toLowerCase();
            set(f.key, next || undefined);
          }}
          className={`w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 ${
            f.transform === "uppercase" ? "font-mono uppercase" : ""
          }`}
        />
      );
    }

    case "numberRange": {
      const minK = f.minKey ?? `${f.key}Min`;
      const maxK = f.maxKey ?? `${f.key}Max`;
      return (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={f.minPlaceholder ?? "Min"}
            value={(draft[minK] as number | undefined) ?? ""}
            onChange={(e) => set(minK, e.target.value ? Number(e.target.value) : undefined)}
            className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={f.maxPlaceholder ?? "Max"}
            value={(draft[maxK] as number | undefined) ?? ""}
            onChange={(e) => set(maxK, e.target.value ? Number(e.target.value) : undefined)}
            className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      );
    }

    case "dateRange": {
      const startK = f.startKey ?? "startDate";
      const endK = f.endKey ?? "endDate";
      return (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={(draft[startK] as string | undefined) ?? ""}
            onChange={(e) => set(startK, e.target.value || undefined)}
            className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
          <input
            type="date"
            value={(draft[endK] as string | undefined) ?? ""}
            onChange={(e) => set(endK, e.target.value || undefined)}
            className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      );
    }

    case "custom":
      return f.render(draft[f.key], (v) => set(f.key, v), { draft });
  }
}
