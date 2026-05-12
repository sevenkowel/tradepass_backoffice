"use client";

/**
 * Workflows — every automation rule (routing, escalation, auto-action,
 * notification) lives here. The dedicated `/crm/clm/routing` editor is a
 * specialised view of the same dataset filtered to `type === "routing"`,
 * with a richer condition / action builder.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Plus,
  Route,
  Timer,
  AlertTriangle,
  UserCheck,
  ArrowUpRight,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { clmConfigService } from "@/lib/clm/services";
import { useCurrentStaffName } from "@/hooks/useCurrentStaff";
import {
  ConfigDrawer,
  Field,
  Select,
  TextArea,
  TextInput,
} from "@/components/crm/clm/config/ConfigDrawer";
import type {
  ConfigStatus,
  WorkflowAction,
  WorkflowCondition,
  WorkflowRule,
  WorkflowType,
} from "@/types/clm";

const TYPE_META: Record<
  WorkflowType,
  { label: string; icon: typeof Route; tone: string }
> = {
  routing: { label: "Routing", icon: Route, tone: "bg-blue-50 text-blue-700" },
  escalation: { label: "Escalation", icon: AlertTriangle, tone: "bg-amber-50 text-amber-700" },
  auto_action: { label: "Auto Action", icon: Bot, tone: "bg-emerald-50 text-emerald-700" },
  notification: { label: "Notification", icon: UserCheck, tone: "bg-violet-50 text-violet-700" },
};

const STATUS_TONES: Record<ConfigStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  draft: "bg-slate-100 text-slate-600",
  retired: "bg-slate-100 text-slate-400",
};

function summariseConditions(conditions: WorkflowCondition[]): string {
  if (conditions.length === 0) return "(no conditions)";
  return conditions
    .map((c) => {
      const v = Array.isArray(c.value) ? `{${c.value.join(", ")}}` : c.value;
      return `${c.field} ${c.operator} ${v}`;
    })
    .join(" AND ");
}

function summariseActions(actions: WorkflowAction[]): string {
  if (actions.length === 0) return "(no actions)";
  return actions.map((a) => `${a.type.replace(/_/g, " ")} = ${a.value}`).join(" + ");
}

interface DraftWorkflow {
  name: string;
  description: string;
  type: WorkflowType;
  status: ConfigStatus;
  priority: number;
  rule: string;
}

const EMPTY: DraftWorkflow = {
  name: "",
  description: "",
  type: "routing",
  status: "draft",
  priority: 1,
  rule: "",
};

export default function WorkflowsPage() {
  const actor = useCurrentStaffName();

  const [rows, setRows] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftWorkflow>(EMPTY);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    setRows(await clmConfigService.workflows.list());
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY);
    setDrawerOpen(true);
  };

  const openEdit = (w: WorkflowRule) => {
    setEditingId(w.id);
    setDraft({
      name: w.name,
      description: w.description ?? "",
      type: w.type,
      status: w.status,
      priority: w.priority ?? 1,
      rule: w.rule,
    });
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim() || !draft.rule.trim()) return;
    setSaving(true);
    try {
      const existing = editingId ? rows.find((r) => r.id === editingId) : null;
      const payload = {
        ...draft,
        // The structured editor lives at /crm/clm/routing; this page only
        // edits the textual summary. Pre-fill empties for new rows.
        conditions: existing?.conditions ?? [],
        actions: existing?.actions ?? [],
      };
      if (editingId) {
        await clmConfigService.workflows.update({ id: editingId, ...payload }, actor);
      } else {
        await clmConfigService.workflows.create(payload, actor);
      }
      setDrawerOpen(false);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this workflow?")) return;
    await clmConfigService.workflows.remove(id, actor);
    setDrawerOpen(false);
    await reload();
  };

  const toggleStatus = async (w: WorkflowRule) => {
    const next: ConfigStatus = w.status === "active" ? "draft" : "active";
    await clmConfigService.workflows.setStatus(w.id, next, actor);
    await reload();
  };

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "Workflows" }]} />
      <PageHeader
        title="Workflows"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/crm/clm/routing"
              className="inline-flex items-center gap-1 px-3 h-9 text-sm text-blue-600 hover:underline"
            >
              <Route className="w-4 h-4" />
              Routing editor
              <ArrowUpRight className="w-3 h-3" />
            </Link>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" />
              New Workflow
            </Button>
          </div>
        }
      />

      <div className="space-y-2">
        {loading && (
          <div className="text-sm text-slate-400 py-8 text-center">Loading workflows…</div>
        )}
        {!loading && rows.length === 0 && (
          <div className="text-sm text-slate-400 py-8 text-center">No workflows yet</div>
        )}
        {rows.map((wf) => {
          const meta = TYPE_META[wf.type];
          const Icon = meta.icon;
          return (
            <Card key={wf.id} padding="md">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.tone}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 text-sm">{wf.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${meta.tone}`}>
                      {meta.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_TONES[wf.status]}`}>
                      {wf.status}
                    </span>
                    {typeof wf.runCount === "number" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 inline-flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {wf.runCount} runs
                      </span>
                    )}
                  </div>
                  {wf.description && (
                    <p className="text-xs text-slate-500 mt-1">{wf.description}</p>
                  )}
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 rounded-md">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">When</p>
                      <p className="font-mono text-slate-700">{summariseConditions(wf.conditions)}</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-md">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">Then</p>
                      <p className="font-mono text-slate-700">{summariseActions(wf.actions)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button size="sm" onClick={() => openEdit(wf)}>
                    Edit
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => toggleStatus(wf)}>
                    {wf.status === "active" ? "Disable" : "Activate"}
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
        title={editingId ? "Edit Workflow" : "New Workflow"}
        subtitle={editingId ? `Editing ${editingId}` : "Define an automation rule"}
        saving={saving}
        saveDisabled={!draft.name.trim() || !draft.rule.trim()}
        destructive={
          editingId ? { label: "Delete workflow", onClick: () => remove(editingId) } : undefined
        }
      >
        <Field label="Name" required>
          <TextInput
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. UAE EDD Routing"
          />
        </Field>
        <Field label="Description">
          <TextArea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={2}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type" required>
            <Select
              value={draft.type}
              onChange={(e) =>
                setDraft({ ...draft, type: e.target.value as WorkflowType })
              }
              options={Object.entries(TYPE_META).map(([value, m]) => ({
                label: m.label,
                value,
              }))}
            />
          </Field>
          <Field label="Status">
            <Select
              value={draft.status}
              onChange={(e) =>
                setDraft({ ...draft, status: e.target.value as ConfigStatus })
              }
              options={[
                { label: "Active", value: "active" },
                { label: "Draft", value: "draft" },
                { label: "Retired", value: "retired" },
              ]}
            />
          </Field>
        </div>
        <Field label="Priority" hint="Higher → runs first">
          <TextInput
            type="number"
            value={draft.priority}
            onChange={(e) =>
              setDraft({ ...draft, priority: Number(e.target.value) || 0 })
            }
          />
        </Field>
        <Field
          label="Rule summary"
          required
          hint="Edit the structured conditions/actions in the Routing editor"
        >
          <TextArea
            value={draft.rule}
            onChange={(e) => setDraft({ ...draft, rule: e.target.value })}
            rows={3}
            placeholder="IF risk_level = Critical THEN escalate"
          />
        </Field>
      </ConfigDrawer>
    </div>
  );
}
