"use client";

/**
 * FundsFilterDrawer — shared advanced filter Drawer for funds list pages.
 *
 * Each list page declares its filter `fields` (select / multiselect / range /
 * toggle) and passes current `values`. The Drawer renders the appropriate
 * control for each field. On Apply, returns the merged values to the page.
 *
 * Mirrors the Client List filter Drawer pattern (see ClientsFilterDrawer.tsx)
 * — same Drawer chrome, same Apply/Reset/Close footer.
 */

import { Drawer, DrawerFooter } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type FilterFieldType = "select" | "multiselect" | "range" | "toggle";

export interface FilterField {
  key: string;
  label: string;
  type: FilterFieldType;
  /** For select/multiselect. */
  options?: { value: string; label: string }[];
  /** For range. */
  min?: number;
  max?: number;
  /** For range — UI hint (e.g. "$0 - $1M"). */
  rangeHint?: string;
}

export interface FundsFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Title shown at top of Drawer. */
  title?: string;
  /** Field definitions for this list page. */
  fields: FilterField[];
  /** Current values, keyed by field.key. */
  values: Record<string, unknown>;
  /** Patch a single field's value. */
  onChange: (key: string, value: unknown) => void;
  /** Apply the staged values (close drawer). */
  onApply: () => void;
  /** Clear all to defaults. */
  onReset: () => void;
}

export function FundsFilterDrawer({
  open, onClose, title = "高级筛选",
  fields, values, onChange, onApply, onReset,
}: FundsFilterDrawerProps) {
  const activeCount = fields.filter((f) => {
    const v = values[f.key];
    if (v === undefined || v === null || v === "" || v === "all") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    if (typeof v === "object" && v !== null && "min" in (v as object) && (v as { min: unknown }).min === undefined && (v as { max: unknown }).max === undefined) return false;
    return true;
  }).length;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      description={activeCount > 0 ? `${activeCount} 个筛选条件已应用` : "未应用任何条件"}
      size="md"
      footer={
        <DrawerFooter>
          <Button variant="secondary" onClick={onReset} className="flex-1">清除全部</Button>
          <Button onClick={() => { onApply(); onClose(); }} className="flex-1">应用筛选</Button>
        </DrawerFooter>
      }
    >
      <div className="space-y-4">
        {fields.map((f) => (
          <FieldRenderer key={f.key} field={f} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
        ))}
      </div>
    </Drawer>
  );
}

/* ── Field renderers ───────────────────────────────────────────── */

function FieldRenderer({ field, value, onChange }: { field: FilterField; value: unknown; onChange: (v: unknown) => void }) {
  switch (field.type) {
    case "select":      return <SelectField field={field} value={value as string} onChange={onChange} />;
    case "multiselect": return <MultiSelectField field={field} value={(value as string[]) ?? []} onChange={onChange} />;
    case "range":       return <RangeField field={field} value={(value as { min?: number; max?: number }) ?? {}} onChange={onChange} />;
    case "toggle":      return <ToggleField field={field} value={Boolean(value)} onChange={onChange} />;
  }
}

function FieldShell({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">{label}</label>
        {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function SelectField({ field, value, onChange }: { field: FilterField; value: string; onChange: (v: string) => void }) {
  return (
    <FieldShell label={field.label}>
      <select
        value={value ?? "all"}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
      >
        <option value="all">全部</option>
        {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </FieldShell>
  );
}

function MultiSelectField({ field, value, onChange }: { field: FilterField; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  };
  return (
    <FieldShell label={field.label} hint={value.length > 0 ? `${value.length} 选中` : undefined}>
      <div className="flex flex-wrap gap-1.5">
        {field.options?.map((o) => {
          const active = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value)}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border transition-colors",
                active ? "bg-blue-50 text-primary border-blue-300" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </FieldShell>
  );
}

function RangeField({ field, value, onChange }: { field: FilterField; value: { min?: number; max?: number }; onChange: (v: { min?: number; max?: number }) => void }) {
  return (
    <FieldShell label={field.label} hint={field.rangeHint}>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="最小"
          value={value.min ?? ""}
          onChange={(e) => onChange({ ...value, min: e.target.value === "" ? undefined : Number(e.target.value) })}
          className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        />
        <span className="text-slate-400">~</span>
        <input
          type="number"
          placeholder="最大"
          value={value.max ?? ""}
          onChange={(e) => onChange({ ...value, max: e.target.value === "" ? undefined : Number(e.target.value) })}
          className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        />
      </div>
    </FieldShell>
  );
}

function ToggleField({ field, value, onChange }: { field: FilterField; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-primary focus:ring-blue-200"
      />
      <span className="text-sm text-slate-800">{field.label}</span>
    </label>
  );
}
