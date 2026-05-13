"use client";

/**
 * Re-Verification rules — fourth tab on /crm/clm/rules.
 *
 * Two trigger kinds:
 *   - **Event** — fires on a business event (withdrawal, AML callback,
 *                 VPN switch, agreement publish, …).
 *   - **Continuous** — background scanner walks every active user on a
 *                 schedule (daily / weekly / monthly). The home of
 *                 "ID expires soon", "inactive 12 months", and similar
 *                 time-based compliance triggers.
 *
 * Filter chips at the top let operators jump between the two views.
 * Editing happens in a single drawer that flips the relevant fields
 * (`scanFrequency` shows only when `triggerKind === "continuous"`).
 */

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Power,
  Edit3,
  Trash2,
  Timer,
  Bot,
  Clock,
  ShieldQuestion,
  CalendarClock,
} from "lucide-react";
import { Card, Button } from "@/components/crm/ui";
import {
  ConfigDrawer,
  Field,
  Select,
  TextArea,
  TextInput,
} from "@/components/crm/clm/config/ConfigDrawer";
import { reVerificationService } from "@/lib/clm/services";
import { useCurrentStaffName } from "@/hooks/useCurrentStaff";
import {
  RESTRICTION_LEVEL_META,
  RESTRICTION_SCOPE_LABELS,
  RESTRICTION_SCOPE_ORDER,
  TYPE_META,
  TYPE_ORDER,
  TypePill,
  fmtRel,
} from "@/components/crm/clm/re-verification/bits";
import type {
  NotificationChannel,
  ReVerificationRule,
  ReVerificationScanFrequency,
  ReVerificationTriggerKind,
  ReVerificationType,
  RestrictionLevel,
  RestrictionScope,
  WorkflowCondition,
} from "@/types/clm";

const TRIGGER_KIND_META: Record<
  ReVerificationTriggerKind,
  { label: string; tone: string; icon: typeof Clock; description: string }
> = {
  event: {
    label: "Event",
    tone: "bg-blue-50 text-blue-700",
    icon: Bot,
    description: "Fires on a business event.",
  },
  continuous: {
    label: "Continuous",
    tone: "bg-violet-50 text-violet-700",
    icon: CalendarClock,
    description: "Background scanner — runs on a schedule.",
  },
};

const SCAN_FREQ_LABEL: Record<ReVerificationScanFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

interface DraftRule {
  name: string;
  description: string;
  priority: number;
  enabled: boolean;
  triggerKind: ReVerificationTriggerKind;
  scanFrequency: ReVerificationScanFrequency;
  conditions: WorkflowCondition[];
  type: ReVerificationType;
  level: RestrictionLevel;
  scopes: RestrictionScope[];
  validityHours: number;
  channels: NotificationChannel[];
}

const EMPTY: DraftRule = {
  name: "",
  description: "",
  priority: 5,
  enabled: false,
  triggerKind: "event",
  scanFrequency: "daily",
  conditions: [{ field: "country", operator: "eq", value: "" }],
  type: "re_identity",
  level: "restrict",
  scopes: ["withdrawal"],
  validityHours: 24 * 7,
  channels: ["email", "inbox", "login_popup"],
};

export function ReVerificationRulesTab() {
  const actor = useCurrentStaffName();
  const [rows, setRows] = useState<ReVerificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState<"all" | ReVerificationTriggerKind>("all");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftRule>(EMPTY);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    setRows(await reVerificationService.rules.list());
    setLoading(false);
  };
  useEffect(() => {
    reload();
  }, []);

  const counts = useMemo(() => {
    const c: Record<"all" | ReVerificationTriggerKind, number> = {
      all: rows.length,
      event: 0,
      continuous: 0,
    };
    for (const r of rows) c[r.triggerKind] += 1;
    return c;
  }, [rows]);

  const filteredRows = useMemo(
    () => (kindFilter === "all" ? rows : rows.filter((r) => r.triggerKind === kindFilter)),
    [rows, kindFilter]
  );

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY);
    setDrawerOpen(true);
  };

  const openEdit = (r: ReVerificationRule) => {
    setEditingId(r.id);
    setDraft({
      name: r.name,
      description: r.description ?? "",
      priority: r.priority,
      enabled: r.enabled,
      triggerKind: r.triggerKind,
      scanFrequency: r.scanFrequency ?? "daily",
      conditions: r.conditions.length > 0 ? r.conditions : EMPTY.conditions,
      type: r.action.verificationType,
      level: r.action.restriction.level,
      scopes: r.action.restriction.scopes,
      validityHours: r.action.restriction.validityHours,
      channels: r.action.notification.channels,
    });
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      const payload: Omit<ReVerificationRule, "id" | "updatedBy" | "updatedAt" | "createdAt"> = {
        name: draft.name,
        description: draft.description,
        priority: draft.priority,
        enabled: draft.enabled,
        triggerKind: draft.triggerKind,
        ...(draft.triggerKind === "continuous"
          ? { scanFrequency: draft.scanFrequency }
          : {}),
        conditions: draft.conditions.filter((c) => c.field && (c.value ?? "") !== ""),
        action: {
          verificationType: draft.type,
          restriction: {
            level: draft.level,
            scopes: draft.scopes,
            effective: { kind: "immediate" as const },
            validityHours: draft.validityHours,
          },
          notification: {
            channels: draft.channels,
          },
        },
      };
      if (editingId) {
        await reVerificationService.rules.update(editingId, payload, actor);
      } else {
        await reVerificationService.rules.create(payload, actor);
      }
      setDrawerOpen(false);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (r: ReVerificationRule) =>
    reVerificationService.rules.toggle(r.id, !r.enabled, actor).then(reload);

  const remove = async (id: string) => {
    if (!confirm("Delete this rule? Existing requests it spawned are not affected.")) return;
    await reVerificationService.rules.remove(id);
    setDrawerOpen(false);
    await reload();
  };

  return (
    <>
      {/* Trigger-kind filter chips + new-rule button */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { key: "all", label: "All" },
              { key: "event", label: "Event-driven" },
              { key: "continuous", label: "Continuous" },
            ] as const
          ).map(({ key, label }) => {
            const count = counts[key];
            const active = kindFilter === key;
            return (
              <button
                key={key}
                onClick={() => setKindFilter(key)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {label}
                <span className={`text-[10px] font-mono tabular-nums ${active ? "text-white/80" : "text-slate-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          New Rule
        </Button>
      </div>

      <div className="space-y-2">
        {loading && <p className="text-sm text-slate-400 text-center py-4">Loading rules…</p>}
        {!loading && filteredRows.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">
            {kindFilter === "all"
              ? "No re-verification rules yet."
              : kindFilter === "continuous"
              ? "No continuous-monitoring rules. Add one to scan for ID expiry, inactivity, etc."
              : "No event-driven rules."}
          </p>
        )}
        {filteredRows.map((r) => {
          const typeMeta = TYPE_META[r.action.verificationType];
          const TypeIcon = typeMeta.icon;
          const kindMeta = TRIGGER_KIND_META[r.triggerKind];
          const KindIcon = kindMeta.icon;
          const levelMeta = RESTRICTION_LEVEL_META[r.action.restriction.level];
          return (
            <Card key={r.id} padding="md">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${typeMeta.tone}`}>
                  <TypeIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 text-sm">{r.name}</h3>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono tabular-nums">
                      P{r.priority}
                    </span>
                    {/* Status pill — uses the same Active / Paused vocabulary as
                        the rest of the CRM. We avoid "Live" here because every
                        ConfigStatus surface elsewhere says "Active"; mixing both
                        words for the same idea was confusing operators. */}
                    {r.enabled ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                        Active
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        Paused
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${kindMeta.tone}`}>
                      <KindIcon className="w-3 h-3" />
                      {kindMeta.label}
                      {r.triggerKind === "continuous" && r.scanFrequency && (
                        <span className="text-[9px] opacity-70">· {SCAN_FREQ_LABEL[r.scanFrequency].toLowerCase()}</span>
                      )}
                    </span>
                    <TypePill type={r.action.verificationType} />
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${levelMeta.tone}`}>
                      {levelMeta.label}
                    </span>
                  </div>
                  {r.description && (
                    <p className="text-xs text-slate-500 mt-1">{r.description}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <div className="p-2 bg-slate-50 rounded-md text-xs">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">When</p>
                      <p className="font-mono text-slate-700">
                        {r.conditions.length === 0
                          ? "(always)"
                          : r.conditions
                              .map(
                                (c) =>
                                  `${c.field} ${c.operator} ${Array.isArray(c.value) ? `{${c.value.join(",")}}` : c.value}`
                              )
                              .join(" AND ")}
                      </p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-md text-xs">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">Then</p>
                      <p className="text-slate-700">
                        Trigger <span className="font-medium">{typeMeta.label}</span>; restrict{" "}
                        {r.action.restriction.scopes.length === 0
                          ? "(none)"
                          : r.action.restriction.scopes
                              .map((s) => RESTRICTION_SCOPE_LABELS[s])
                              .join(", ")}
                        ; notify via {r.action.notification.channels.length} channel
                        {r.action.notification.channels.length === 1 ? "" : "s"}.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-mono tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Bot className="w-3 h-3" />
                      {r.runCount ?? 0} runs
                    </span>
                    {r.lastFiredAt && (
                      <span className="inline-flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        last {fmtRel(r.lastFiredAt)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button size="sm" onClick={() => openEdit(r)}>
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => toggle(r)}>
                    <Power className="w-3 h-3" />
                    {r.enabled ? "Pause" : "Activate"}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <ConfigDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={save}
        title={editingId ? "Edit Re-Verification Rule" : "New Re-Verification Rule"}
        subtitle={
          editingId
            ? `Editing ${editingId}`
            : "Auto-trigger rule for compliance re-verification"
        }
        saving={saving}
        saveDisabled={!draft.name.trim()}
        width={560}
        destructive={
          editingId ? { label: "Delete rule", onClick: () => remove(editingId) } : undefined
        }
      >
        <Field label="Name" required>
          <TextInput
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. ID Expiring Within 7 Days"
          />
        </Field>
        <Field label="Description" hint="Audit-trail one-liner for the rule">
          <TextArea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={2}
          />
        </Field>

        {/* Trigger kind picker — drives the rest of the drawer */}
        <Field label="Trigger" hint="How the engine evaluates this rule" required>
          <div className="grid grid-cols-2 gap-1.5">
            {(["event", "continuous"] as ReVerificationTriggerKind[]).map((k) => {
              const meta = TRIGGER_KIND_META[k];
              const Icon = meta.icon;
              const active = draft.triggerKind === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setDraft({ ...draft, triggerKind: k })}
                  className={`flex items-start gap-2 p-2.5 rounded-md border text-left transition-all ${
                    active
                      ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className={`w-6 h-6 rounded inline-flex items-center justify-center shrink-0 ${meta.tone}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-slate-900">{meta.label}</span>
                    <span className="block text-[10px] text-slate-500 leading-tight">
                      {meta.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </Field>

        {draft.triggerKind === "continuous" && (
          <Field
            label="Scan frequency"
            hint="How often the background scanner walks every active user"
          >
            <Select
              value={draft.scanFrequency}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  scanFrequency: e.target.value as ReVerificationScanFrequency,
                })
              }
              options={[
                { label: "Daily", value: "daily" },
                { label: "Weekly", value: "weekly" },
                { label: "Monthly", value: "monthly" },
              ]}
            />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority" hint="Higher → evaluated first">
            <TextInput
              type="number"
              value={draft.priority}
              onChange={(e) =>
                setDraft({ ...draft, priority: Number(e.target.value) || 0 })
              }
            />
          </Field>
          <Field label="Status">
            <Select
              value={draft.enabled ? "active" : "paused"}
              onChange={(e) => setDraft({ ...draft, enabled: e.target.value === "active" })}
              options={[
                { label: "Active", value: "active" },
                { label: "Paused", value: "paused" },
              ]}
            />
          </Field>
        </div>

        {/* Conditions */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-700 mb-2">When</p>
          <div className="space-y-1.5">
            {draft.conditions.map((c, idx) => (
              <div key={idx} className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 rounded-md">
                <span className="text-[10px] font-semibold text-slate-400 w-8 shrink-0">
                  {idx === 0 ? "IF" : "AND"}
                </span>
                <input
                  className="h-7 px-2 rounded border border-slate-200 bg-white text-xs flex-1 font-mono"
                  value={c.field}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      conditions: draft.conditions.map((x, i) =>
                        i === idx ? { ...x, field: e.target.value } : x
                      ),
                    })
                  }
                  placeholder="field"
                />
                <select
                  className="h-7 px-2 rounded border border-slate-200 bg-white text-xs w-16"
                  value={c.operator}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      conditions: draft.conditions.map((x, i) =>
                        i === idx
                          ? { ...x, operator: e.target.value as WorkflowCondition["operator"] }
                          : x
                      ),
                    })
                  }
                >
                  {(["eq", "neq", "gt", "gte", "lt", "lte", "in", "contains"] as const).map(
                    (op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    )
                  )}
                </select>
                <input
                  className="h-7 px-2 rounded border border-slate-200 bg-white text-xs flex-1 font-mono"
                  value={Array.isArray(c.value) ? c.value.join(",") : String(c.value)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const parsed: WorkflowCondition["value"] =
                      c.operator === "in"
                        ? raw.split(",").map((s) => s.trim()).filter(Boolean)
                        : /^\d+(\.\d+)?$/.test(raw)
                        ? Number(raw)
                        : raw;
                    setDraft({
                      ...draft,
                      conditions: draft.conditions.map((x, i) =>
                        i === idx ? { ...x, value: parsed } : x
                      ),
                    });
                  }}
                  placeholder="value"
                />
                <button
                  onClick={() =>
                    setDraft({
                      ...draft,
                      conditions: draft.conditions.filter((_, i) => i !== idx),
                    })
                  }
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setDraft({
                  ...draft,
                  conditions: [
                    ...draft.conditions,
                    { field: "", operator: "eq", value: "" },
                  ],
                })
              }
            >
              <Plus className="w-3 h-3" />
              Add condition
            </Button>
          </div>
        </div>

        {/* Action */}
        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-700 mb-2">Then</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Verification type">
              <Select
                value={draft.type}
                onChange={(e) =>
                  setDraft({ ...draft, type: e.target.value as ReVerificationType })
                }
                options={TYPE_ORDER.map((t) => ({ label: TYPE_META[t].label, value: t }))}
              />
            </Field>
            <Field label="Restriction level">
              <Select
                value={draft.level}
                onChange={(e) =>
                  setDraft({ ...draft, level: e.target.value as RestrictionLevel })
                }
                options={[
                  { label: "Notice",   value: "notice" },
                  { label: "Restrict", value: "restrict" },
                  { label: "Suspend",  value: "suspend" },
                ]}
              />
            </Field>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 mb-1">Restricted scopes</p>
          <div className="flex flex-wrap gap-1.5">
            {RESTRICTION_SCOPE_ORDER.map((s) => {
              const active = draft.scopes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      scopes: active ? draft.scopes.filter((x) => x !== s) : [...draft.scopes, s],
                    })
                  }
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${
                    active
                      ? "border-orange-300 bg-orange-50 text-orange-700"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {RESTRICTION_SCOPE_LABELS[s]}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Field label="Validity (hours)">
              <TextInput
                type="number"
                value={draft.validityHours}
                onChange={(e) =>
                  setDraft({ ...draft, validityHours: Number(e.target.value) || 0 })
                }
              />
            </Field>
            <Field label="Channels">
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {(["email", "inbox", "push", "login_popup"] as const).map((c) => {
                  const active = draft.channels.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          channels: active
                            ? draft.channels.filter((x) => x !== c)
                            : [...draft.channels, c],
                        })
                      }
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${
                        active
                          ? "border-blue-300 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {c.replace("_", " ")}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed pt-1 inline-flex items-center gap-1">
          <ShieldQuestion className="w-3 h-3" />
          Each spawned request lands in <strong>Re-Verification → Requests</strong>; the user is notified via the chosen channels.
        </p>
      </ConfigDrawer>
    </>
  );
}
