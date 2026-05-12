"use client";

/**
 * ConditionBuilder — shared rule condition editor.
 *
 * Renders a vertical stack of condition rows with a top-level AND/OR
 * combinator. Each row's value control is driven by the field's
 * `ConditionFieldKind` so operators see typed inputs (country dropdown,
 * boolean toggle, number stepper) instead of a free-form text box.
 *
 * The "<>" button on each row falls back to a raw text input for that
 * row only — useful when a rule needs a value not in the dropdown set.
 *
 * The "{ }" button at the top flips the whole panel into a JSON editor
 * mode whose schema mirrors the data structure 1:1:
 *
 *   { "logic": "and", "conditions": [{ "field": "country", "operator": "in", "value": ["VN","TH"] }] }
 *
 * Saving validates the JSON, parses it back into rows, and returns to
 * visual mode. Invalid JSON shows an inline error and blocks saving.
 *
 * Mixed nesting (`(A AND B) OR C`) is not modeled — the top-level
 * combinator is either AND or OR. Use the JSON mode for anything else
 * (the engine can read arbitrary AST; this UI just doesn't render it).
 */

import { useMemo, useState } from "react";
import { Plus, Trash2, Braces, Code2, AlertCircle } from "lucide-react";
import { Button } from "@/components/crm/ui";
import {
  CONDITION_FIELDS,
  getConditionFieldDef,
  type ConditionFieldDef,
  type WorkflowCondition,
} from "@/types/clm";
import { listIBs } from "@/lib/clm/mock";

const OPERATOR_LABEL: Record<WorkflowCondition["operator"], string> = {
  eq: "=", neq: "≠", gt: ">", gte: "≥", lt: "<", lte: "≤", in: "in", contains: "contains",
};

const ALL_OPERATORS: WorkflowCondition["operator"][] = [
  "eq", "neq", "gt", "gte", "lt", "lte", "in", "contains",
];

export interface ConditionBuilderValue {
  logic: "and" | "or";
  conditions: WorkflowCondition[];
}

interface Props {
  value: ConditionBuilderValue;
  onChange: (next: ConditionBuilderValue) => void;
  /** Label shown above the row stack. */
  label?: string;
}

export function ConditionBuilder({ value, onChange, label = "Conditions" }: Props) {
  const [mode, setMode] = useState<"visual" | "json">("visual");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  /** Per-row override: if true, that row uses a raw text input for value. */
  const [rawRows, setRawRows] = useState<Set<number>>(new Set());

  const enterJsonMode = () => {
    setJsonText(JSON.stringify(value, null, 2));
    setJsonError(null);
    setMode("json");
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || (parsed.logic !== "and" && parsed.logic !== "or")) {
        throw new Error('logic must be "and" or "or"');
      }
      if (!Array.isArray(parsed.conditions)) {
        throw new Error("conditions must be an array");
      }
      for (const c of parsed.conditions) {
        if (typeof c.field !== "string" || typeof c.operator !== "string") {
          throw new Error("each condition needs field + operator");
        }
        if (!ALL_OPERATORS.includes(c.operator)) {
          throw new Error(`unknown operator: ${c.operator}`);
        }
      }
      onChange({ logic: parsed.logic, conditions: parsed.conditions });
      setJsonError(null);
      setMode("visual");
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  const setLogic = (logic: "and" | "or") => onChange({ ...value, logic });

  const addRow = () => {
    onChange({
      ...value,
      conditions: [...value.conditions, { field: "country", operator: "eq", value: "" }],
    });
  };

  const removeRow = (idx: number) => {
    onChange({
      ...value,
      conditions: value.conditions.filter((_, i) => i !== idx),
    });
    const next = new Set(rawRows);
    next.delete(idx);
    setRawRows(next);
  };

  const updateRow = (idx: number, patch: Partial<WorkflowCondition>) => {
    onChange({
      ...value,
      conditions: value.conditions.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    });
  };

  const toggleRowRaw = (idx: number) => {
    const next = new Set(rawRows);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    setRawRows(next);
  };

  if (mode === "json") {
    return (
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-700">{label} — JSON</p>
          <Button variant="secondary" size="sm" onClick={() => setMode("visual")}>
            <Code2 className="w-3 h-3" />
            Visual mode
          </Button>
        </div>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={10}
          spellCheck={false}
          className="w-full px-3 py-2 bg-slate-900 text-emerald-200 font-mono text-xs rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          placeholder='{ "logic": "and", "conditions": [...] }'
        />
        {jsonError && (
          <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-md text-xs text-red-700">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{jsonError}</span>
          </div>
        )}
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={applyJson}>Validate & apply</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2 border-t border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-slate-700">{label}</p>
          <LogicSwitch value={value.logic} onChange={setLogic} />
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" size="sm" onClick={enterJsonMode} title="Advanced JSON mode">
            <Braces className="w-3 h-3" />
            JSON
          </Button>
          <Button variant="secondary" size="sm" onClick={addRow}>
            <Plus className="w-3 h-3" />
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        {value.conditions.length === 0 && (
          <p className="text-[11px] text-slate-400 px-2 py-3 bg-slate-50 rounded-md text-center">
            No conditions — rule will always fire.
          </p>
        )}
        {value.conditions.map((c, idx) => (
          <ConditionRow
            key={idx}
            condition={c}
            isFirst={idx === 0}
            logic={value.logic}
            rawMode={rawRows.has(idx)}
            onToggleRaw={() => toggleRowRaw(idx)}
            onChange={(patch) => updateRow(idx, patch)}
            onRemove={() => removeRow(idx)}
          />
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function LogicSwitch({
  value, onChange,
}: { value: "and" | "or"; onChange: (v: "and" | "or") => void }) {
  return (
    <div className="inline-flex items-center bg-slate-100 rounded-md p-0.5">
      {(["and", "or"] as const).map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-2 py-0.5 text-[11px] font-semibold uppercase rounded transition-colors ${
            value === opt
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function ConditionRow({
  condition, isFirst, logic, rawMode, onChange, onRemove, onToggleRaw,
}: {
  condition: WorkflowCondition;
  isFirst: boolean;
  logic: "and" | "or";
  rawMode: boolean;
  onChange: (patch: Partial<WorkflowCondition>) => void;
  onRemove: () => void;
  onToggleRaw: () => void;
}) {
  const fieldDef = getConditionFieldDef(condition.field);
  const operators = fieldDef?.operators ?? ALL_OPERATORS;

  const handleFieldChange = (newKey: string) => {
    const newDef = getConditionFieldDef(newKey);
    const newOps = newDef?.operators ?? ALL_OPERATORS;
    // If current operator isn't compatible, reset to first available.
    const newOp = newOps.includes(condition.operator) ? condition.operator : newOps[0];
    onChange({ field: newKey, operator: newOp, value: "" });
  };

  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 rounded-md">
      <span className="text-[10px] font-semibold text-slate-400 w-10 shrink-0 uppercase">
        {isFirst ? "IF" : logic}
      </span>

      {/* Field dropdown */}
      <select
        className="h-7 px-2 rounded border border-slate-200 bg-white text-xs flex-1 min-w-0"
        value={condition.field}
        onChange={(e) => handleFieldChange(e.target.value)}
      >
        {!fieldDef && <option value={condition.field}>{condition.field} (custom)</option>}
        {CONDITION_FIELDS.map((f) => (
          <option key={f.key} value={f.key}>{f.label}</option>
        ))}
      </select>

      {/* Operator dropdown */}
      <select
        className="h-7 px-2 rounded border border-slate-200 bg-white text-xs w-20 shrink-0"
        value={condition.operator}
        onChange={(e) =>
          onChange({ operator: e.target.value as WorkflowCondition["operator"] })
        }
      >
        {operators.map((op) => (
          <option key={op} value={op}>{OPERATOR_LABEL[op]}</option>
        ))}
      </select>

      {/* Value — typed control when fieldDef known, else raw text */}
      <div className="flex-1 min-w-0">
        {rawMode || !fieldDef
          ? <RawValueInput condition={condition} onChange={onChange} />
          : <TypedValueInput fieldDef={fieldDef} condition={condition} onChange={onChange} />
        }
      </div>

      {/* Toggle raw mode for this row */}
      <button
        onClick={onToggleRaw}
        className={`p-1 rounded shrink-0 ${
          rawMode
            ? "text-slate-700 bg-slate-200"
            : "text-slate-300 hover:text-slate-500 hover:bg-slate-100"
        }`}
        title={rawMode ? "Switch to typed value" : "Switch to raw value"}
      >
        <Code2 className="w-3 h-3" />
      </button>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="p-1 text-red-500 hover:bg-red-50 rounded shrink-0"
        title="Remove condition"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

/* ─── Raw text fallback ──────────────────────────────────────────────── */

function RawValueInput({
  condition, onChange,
}: { condition: WorkflowCondition; onChange: (patch: Partial<WorkflowCondition>) => void }) {
  return (
    <input
      className="h-7 px-2 w-full rounded border border-slate-200 bg-white text-xs font-mono"
      value={Array.isArray(condition.value) ? condition.value.join(",") : String(condition.value)}
      onChange={(e) => {
        const raw = e.target.value;
        const parsed: WorkflowCondition["value"] =
          condition.operator === "in"
            ? raw.split(",").map((s) => s.trim()).filter(Boolean)
            : /^-?\d+(\.\d+)?$/.test(raw)
            ? Number(raw)
            : raw;
        onChange({ value: parsed });
      }}
      placeholder="value"
    />
  );
}

/* ─── Typed inputs ────────────────────────────────────────────────────── */

function TypedValueInput({
  fieldDef, condition, onChange,
}: {
  fieldDef: ConditionFieldDef;
  condition: WorkflowCondition;
  onChange: (patch: Partial<WorkflowCondition>) => void;
}) {
  // Multi-select for `in` operator on enum/entity fields
  if (condition.operator === "in" && (fieldDef.kind === "enum" || fieldDef.kind === "entity")) {
    return <MultiSelectChips fieldDef={fieldDef} condition={condition} onChange={onChange} />;
  }

  switch (fieldDef.kind) {
    case "enum":
      return (
        <select
          className="h-7 px-2 w-full rounded border border-slate-200 bg-white text-xs"
          value={String(condition.value)}
          onChange={(e) => onChange({ value: e.target.value })}
        >
          <option value="">(select…)</option>
          {fieldDef.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    case "entity":
      return <EntitySelect fieldDef={fieldDef} condition={condition} onChange={onChange} />;
    case "number":
      return (
        <input
          type="number"
          className="h-7 px-2 w-full rounded border border-slate-200 bg-white text-xs font-mono"
          value={Number.isFinite(Number(condition.value)) ? String(condition.value) : ""}
          onChange={(e) => onChange({ value: Number(e.target.value) })}
          placeholder="number"
        />
      );
    case "boolean":
      return (
        <select
          className="h-7 px-2 w-full rounded border border-slate-200 bg-white text-xs"
          value={String(condition.value)}
          onChange={(e) => onChange({ value: e.target.value })}
        >
          <option value="">(select…)</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    case "text":
    default:
      return <RawValueInput condition={condition} onChange={onChange} />;
  }
}

function EntitySelect({
  fieldDef, condition, onChange,
}: {
  fieldDef: ConditionFieldDef;
  condition: WorkflowCondition;
  onChange: (patch: Partial<WorkflowCondition>) => void;
}) {
  const options = useMemo(() => {
    if (fieldDef.entity === "ib") {
      return listIBs().map((ib) => ({ value: ib.id, label: `${ib.name} (${ib.id})` }));
    }
    return [];
  }, [fieldDef.entity]);

  return (
    <select
      className="h-7 px-2 w-full rounded border border-slate-200 bg-white text-xs"
      value={String(condition.value)}
      onChange={(e) => onChange({ value: e.target.value })}
    >
      <option value="">(select…)</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function MultiSelectChips({
  fieldDef, condition, onChange,
}: {
  fieldDef: ConditionFieldDef;
  condition: WorkflowCondition;
  onChange: (patch: Partial<WorkflowCondition>) => void;
}) {
  const selected = Array.isArray(condition.value)
    ? condition.value
    : condition.value ? [String(condition.value)] : [];

  const options = useMemo(() => {
    if (fieldDef.kind === "entity" && fieldDef.entity === "ib") {
      return listIBs().map((ib) => ({ value: ib.id, label: `${ib.name} (${ib.id})` }));
    }
    return fieldDef.options ?? [];
  }, [fieldDef]);

  const toggle = (v: string) => {
    const next = selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v];
    onChange({ value: next });
  };

  return (
    <details className="relative">
      <summary className="h-7 px-2 w-full rounded border border-slate-200 bg-white text-xs flex items-center cursor-pointer list-none">
        {selected.length === 0
          ? <span className="text-slate-400">(select…)</span>
          : <span className="truncate">{selected.length} selected</span>
        }
      </summary>
      <div className="absolute z-20 mt-1 right-0 min-w-[200px] max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-md shadow-lg p-1">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-slate-50 rounded cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(o.value)}
              onChange={() => toggle(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </details>
  );
}
