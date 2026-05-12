"use client";

/**
 * Routing Editor — visual `IF X AND Y THEN Z` rule builder.
 *
 * Filters `clmConfigService.workflows.list()` to `type === "routing"`
 * (and "escalation" — same shape, just a different categorisation), then
 * lets the operator edit conditions and actions row-by-row. The textual
 * `rule` field is regenerated on save so legacy read-only callers
 * (the Workflows page card) stay accurate.
 *
 * Field / operator / action vocabularies are hard-coded here for now —
 * once the backend exposes a schema endpoint, swap the constants for a
 * fetched list and the editor stays unchanged.
 */

import { Suspense, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Route,
  Save,
  Trash2,
  AlertTriangle,
  Bot,
  Power,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { clmConfigService } from "@/lib/clm/services";
import { useCurrentStaffName } from "@/hooks/useCurrentStaff";
import {
  Field,
  Select,
  TextInput,
} from "@/components/crm/clm/config/ConfigDrawer";
import type {
  ConfigStatus,
  WorkflowAction,
  WorkflowCondition,
  WorkflowRule,
  WorkflowType,
} from "@/types/clm";

/* ------------------------------------------------------------------------- */
/* Vocabulary                                                                */
/* ------------------------------------------------------------------------- */

const FIELD_OPTIONS = [
  { value: "country", label: "Country" },
  { value: "risk_level", label: "Risk level" },
  { value: "kyc_level", label: "KYC level" },
  { value: "aml_status", label: "AML status" },
  { value: "ocr_confidence", label: "OCR confidence" },
  { value: "face_match_score", label: "Face match score" },
  { value: "deposit_amount", label: "Deposit amount" },
  { value: "withdrawal_amount", label: "Withdrawal amount" },
  { value: "status", label: "Case status" },
  { value: "hours_since_status_change", label: "Hours in status" },
  { value: "ip_country", label: "IP country" },
  { value: "is_vpn", label: "Is VPN" },
];

const OPERATOR_OPTIONS: { value: WorkflowCondition["operator"]; label: string }[] = [
  { value: "eq", label: "=" },
  { value: "neq", label: "≠" },
  { value: "gt", label: ">" },
  { value: "gte", label: "≥" },
  { value: "lt", label: "<" },
  { value: "lte", label: "≤" },
  { value: "in", label: "in {…}" },
  { value: "contains", label: "contains" },
];

const ACTION_OPTIONS: { value: WorkflowAction["type"]; label: string }[] = [
  { value: "assign_to_team", label: "Assign to team" },
  { value: "assign_to_user", label: "Assign to user" },
  { value: "set_priority", label: "Set priority" },
  { value: "set_status", label: "Set status" },
  { value: "send_notification", label: "Send notification" },
  { value: "escalate", label: "Escalate" },
  { value: "auto_approve", label: "Auto approve" },
  { value: "auto_reject", label: "Auto reject" },
];

const TYPE_META: Record<
  WorkflowType,
  { label: string; icon: typeof Route; tone: string }
> = {
  routing: { label: "Routing", icon: Route, tone: "bg-blue-50 text-blue-700" },
  escalation: { label: "Escalation", icon: AlertTriangle, tone: "bg-amber-50 text-amber-700" },
  auto_action: { label: "Auto action", icon: Bot, tone: "bg-emerald-50 text-emerald-700" },
  notification: { label: "Notification", icon: Power, tone: "bg-violet-50 text-violet-700" },
};

const STATUS_TONES: Record<ConfigStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  draft: "bg-slate-100 text-slate-600",
  retired: "bg-slate-100 text-slate-400",
};

/* ------------------------------------------------------------------------- */
/* Rule string regeneration — keep `WorkflowRule.rule` in sync               */
/* ------------------------------------------------------------------------- */

function summariseValue(v: WorkflowCondition["value"]): string {
  if (Array.isArray(v)) return `{${v.join(", ")}}`;
  return String(v);
}

function ruleString(
  conditions: WorkflowCondition[],
  actions: WorkflowAction[]
): string {
  const ifPart =
    conditions.length === 0
      ? "(always)"
      : conditions
          .map((c) => `${c.field} ${c.operator} ${summariseValue(c.value)}`)
          .join(" AND ");
  const thenPart =
    actions.length === 0
      ? "(no action)"
      : actions.map((a) => `${a.type.replace(/_/g, " ")} = ${a.value}`).join(" AND ");
  return `IF ${ifPart} THEN ${thenPart}`;
}

/* ------------------------------------------------------------------------- */
/* Page                                                                      */
/* ------------------------------------------------------------------------- */

function RoutingEditorInner() {
  const actor = useCurrentStaffName();
  const [rows, setRows] = useState<WorkflowRule[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState<WorkflowRule | null>(null);

  const reload = async () => {
    setLoading(true);
    const all = await clmConfigService.workflows.list();
    // Show every workflow type in the editor — operators want one place
    // to maintain rules, even if "Routing editor" is the entry point.
    setRows(all);
    setLoading(false);
    // Pick the first row by default for a non-empty initial state.
    if (!activeId && all.length > 0) setActiveId(all[0].id);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync `draft` whenever the active selection changes.
  useEffect(() => {
    if (!activeId) {
      setDraft(null);
      return;
    }
    const row = rows.find((r) => r.id === activeId);
    setDraft(row ? { ...row } : null);
  }, [activeId, rows]);

  const updateDraft = (patch: Partial<WorkflowRule>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  };

  const updateConditions = (conditions: WorkflowCondition[]) => {
    setDraft((d) =>
      d ? { ...d, conditions, rule: ruleString(conditions, d.actions) } : d
    );
  };

  const updateActions = (actions: WorkflowAction[]) => {
    setDraft((d) =>
      d ? { ...d, actions, rule: ruleString(d.conditions, actions) } : d
    );
  };

  const addCondition = () => {
    if (!draft) return;
    updateConditions([
      ...draft.conditions,
      { field: FIELD_OPTIONS[0].value, operator: "eq", value: "" },
    ]);
  };

  const removeCondition = (idx: number) => {
    if (!draft) return;
    updateConditions(draft.conditions.filter((_, i) => i !== idx));
  };

  const addAction = () => {
    if (!draft) return;
    updateActions([
      ...draft.actions,
      { type: ACTION_OPTIONS[0].value, value: "" },
    ]);
  };

  const removeAction = (idx: number) => {
    if (!draft) return;
    updateActions(draft.actions.filter((_, i) => i !== idx));
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await clmConfigService.workflows.update(
        {
          id: draft.id,
          name: draft.name,
          description: draft.description,
          type: draft.type,
          status: draft.status,
          priority: draft.priority,
          conditions: draft.conditions,
          actions: draft.actions,
          rule: ruleString(draft.conditions, draft.actions),
        },
        actor
      );
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const createRule = async () => {
    const created = await clmConfigService.workflows.create(
      {
        name: "New Routing Rule",
        description: "",
        type: "routing",
        status: "draft",
        priority: 1,
        conditions: [{ field: "country", operator: "eq", value: "" }],
        actions: [{ type: "assign_to_team", value: "" }],
        rule: "IF country = ? THEN assign to team = ?",
      },
      actor
    );
    await reload();
    setActiveId(created.id);
  };

  const remove = async () => {
    if (!draft) return;
    if (!confirm("Delete this rule?")) return;
    await clmConfigService.workflows.remove(draft.id, actor);
    setActiveId(null);
    await reload();
  };

  const toggleStatus = async () => {
    if (!draft) return;
    const next: ConfigStatus = draft.status === "active" ? "draft" : "active";
    await clmConfigService.workflows.setStatus(draft.id, next, actor);
    await reload();
  };

  const dirty = useMemo(() => {
    if (!draft) return false;
    const original = rows.find((r) => r.id === draft.id);
    if (!original) return true;
    return JSON.stringify(original) !== JSON.stringify(draft);
  }, [draft, rows]);

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "Routing" }]} />
      <PageHeader
        title="Routing"
        actions={
          <Button onClick={createRule}>
            <Plus className="w-4 h-4" />
            New Rule
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-3">
        {/* Rule list */}
        <Card padding="none" className="overflow-hidden h-fit max-h-[70vh]">
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
              Rules ({rows.length})
            </p>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && (
              <p className="px-3 py-6 text-xs text-slate-400 text-center">Loading…</p>
            )}
            {!loading && rows.length === 0 && (
              <p className="px-3 py-6 text-xs text-slate-400 text-center">
                No rules yet
              </p>
            )}
            {rows.map((r) => {
              const meta = TYPE_META[r.type];
              const Icon = meta.icon;
              const isActive = activeId === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setActiveId(r.id)}
                  className={`w-full text-left px-3 py-2 border-b border-slate-50 transition-colors ${
                    isActive ? "bg-blue-50/60" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`w-5 h-5 rounded-md inline-flex items-center justify-center ${meta.tone}`}>
                      <Icon className="w-3 h-3" />
                    </span>
                    <p className="text-xs font-semibold text-slate-900 truncate flex-1">
                      {r.name}
                    </p>
                    <span className={`text-[9px] font-medium px-1 py-0.5 rounded ${STATUS_TONES[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono tabular-nums">
                    P{r.priority ?? 0} · {r.conditions.length} cond · {r.actions.length} act
                  </p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Editor */}
        <Card padding="md">
          {!draft ? (
            <div className="py-12 text-center text-sm text-slate-400">
              {rows.length === 0
                ? "No rules yet — click 'New Rule' to start"
                : "Pick a rule from the left"}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header strip */}
              <div className="flex items-center gap-2 flex-wrap pb-3 border-b border-slate-100">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${TYPE_META[draft.type].tone}`}>
                  {TYPE_META[draft.type].label}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_TONES[draft.status]}`}>
                  {draft.status}
                </span>
                <span className="text-[11px] text-slate-500 font-mono tabular-nums ml-auto">
                  P{draft.priority ?? 0} · {draft.runCount ?? 0} runs
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Name" required>
                  <TextInput
                    value={draft.name}
                    onChange={(e) => updateDraft({ name: e.target.value })}
                  />
                </Field>
                <Field label="Type">
                  <Select
                    value={draft.type}
                    onChange={(e) => updateDraft({ type: e.target.value as WorkflowType })}
                    options={Object.entries(TYPE_META).map(([value, m]) => ({
                      label: m.label,
                      value,
                    }))}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Status">
                  <Select
                    value={draft.status}
                    onChange={(e) => updateDraft({ status: e.target.value as ConfigStatus })}
                    options={[
                      { label: "Active", value: "active" },
                      { label: "Draft", value: "draft" },
                      { label: "Retired", value: "retired" },
                    ]}
                  />
                </Field>
                <Field label="Priority">
                  <TextInput
                    type="number"
                    value={draft.priority ?? 0}
                    onChange={(e) => updateDraft({ priority: Number(e.target.value) || 0 })}
                  />
                </Field>
              </div>
              <Field label="Description">
                <TextInput
                  value={draft.description ?? ""}
                  onChange={(e) => updateDraft({ description: e.target.value })}
                />
              </Field>

              {/* Conditions */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-slate-700">
                    When ({draft.conditions.length})
                  </h3>
                  <Button variant="secondary" size="sm" onClick={addCondition}>
                    <Plus className="w-3 h-3" />
                    Add condition
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {draft.conditions.length === 0 && (
                    <p className="text-xs text-slate-400 italic px-2 py-1">
                      Always — rule fires for every case
                    </p>
                  )}
                  {draft.conditions.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 rounded-md"
                    >
                      <span className="text-[10px] font-semibold text-slate-400 w-8 shrink-0">
                        {idx === 0 ? "IF" : "AND"}
                      </span>
                      <select
                        className="h-7 px-2 rounded border border-slate-200 bg-white text-xs flex-1 min-w-0"
                        value={c.field}
                        onChange={(e) =>
                          updateConditions(
                            draft.conditions.map((x, i) =>
                              i === idx ? { ...x, field: e.target.value } : x
                            )
                          )
                        }
                      >
                        {FIELD_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <select
                        className="h-7 px-2 rounded border border-slate-200 bg-white text-xs w-20 shrink-0"
                        value={c.operator}
                        onChange={(e) =>
                          updateConditions(
                            draft.conditions.map((x, i) =>
                              i === idx
                                ? { ...x, operator: e.target.value as WorkflowCondition["operator"] }
                                : x
                            )
                          )
                        }
                      >
                        {OPERATOR_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <input
                        className="h-7 px-2 rounded border border-slate-200 bg-white text-xs flex-1 min-w-0 font-mono"
                        value={Array.isArray(c.value) ? c.value.join(",") : String(c.value)}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const parsed: WorkflowCondition["value"] =
                            c.operator === "in"
                              ? raw.split(",").map((s) => s.trim()).filter(Boolean)
                              : /^\d+(\.\d+)?$/.test(raw)
                              ? Number(raw)
                              : raw;
                          updateConditions(
                            draft.conditions.map((x, i) =>
                              i === idx ? { ...x, value: parsed } : x
                            )
                          );
                        }}
                        placeholder="value"
                      />
                      <button
                        onClick={() => removeCondition(idx)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded shrink-0"
                        aria-label="Remove condition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-slate-700">
                    Then ({draft.actions.length})
                  </h3>
                  <Button variant="secondary" size="sm" onClick={addAction}>
                    <Plus className="w-3 h-3" />
                    Add action
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {draft.actions.length === 0 && (
                    <p className="text-xs text-slate-400 italic px-2 py-1">
                      No actions — add one to make the rule effective
                    </p>
                  )}
                  {draft.actions.map((a, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 rounded-md"
                    >
                      <span className="text-[10px] font-semibold text-slate-400 w-8 shrink-0">
                        {idx === 0 ? "DO" : "AND"}
                      </span>
                      <select
                        className="h-7 px-2 rounded border border-slate-200 bg-white text-xs flex-1 min-w-0"
                        value={a.type}
                        onChange={(e) =>
                          updateActions(
                            draft.actions.map((x, i) =>
                              i === idx
                                ? { ...x, type: e.target.value as WorkflowAction["type"] }
                                : x
                            )
                          )
                        }
                      >
                        {ACTION_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <input
                        className="h-7 px-2 rounded border border-slate-200 bg-white text-xs flex-1 min-w-0 font-mono"
                        value={a.value}
                        onChange={(e) =>
                          updateActions(
                            draft.actions.map((x, i) =>
                              i === idx ? { ...x, value: e.target.value } : x
                            )
                          )
                        }
                        placeholder="value"
                      />
                      <button
                        onClick={() => removeAction(idx)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded shrink-0"
                        aria-label="Remove action"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live preview */}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1.5">
                  Preview
                </p>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-md font-mono text-xs whitespace-pre-wrap">
{ruleString(draft.conditions, draft.actions)}
                </pre>
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={remove}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete rule
                </button>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={toggleStatus}>
                    <Power className="w-3 h-3" />
                    {draft.status === "active" ? "Disable" : "Activate"}
                  </Button>
                  <Button size="sm" onClick={save} disabled={!dirty || saving}>
                    <Save className="w-3 h-3" />
                    {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function RoutingPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-400">Loading…</div>}>
      <RoutingEditorInner />
    </Suspense>
  );
}
