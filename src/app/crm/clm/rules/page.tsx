"use client";

/**
 * Routing & Rules — three tabs covering compliance automation:
 *
 *   A. Routing       — assign each user to a KYC Flow by attribute.
 *   B. Auto-Review   — auto-approve / auto-reject / route to manual review.
 *   C. Monitoring    — continuous and event-driven re-verification triggers.
 *
 * The legacy Auto-Upgrade tab was retired; its two use cases now live
 * elsewhere — phone/email OTP enforcement moved to KYC Flow's Contact
 * module (different flows per region/source → different OTP policies),
 * and the "force an extra verification step" cases are expressed as
 * Monitoring rules.
 */

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Power,
  Route,
  Bot,
  Activity,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import {
  ConfigDrawer,
  Field,
  Select,
  TextArea,
  TextInput,
} from "@/components/crm/clm/config/ConfigDrawer";
import { ConditionBuilder } from "@/components/crm/clm/rules/ConditionBuilder";
import type { ConditionBuilderValue } from "@/components/crm/clm/rules/ConditionBuilder";
import { clmFlowService } from "@/lib/clm/services";
import { useCurrentStaffName } from "@/hooks/useCurrentStaff";
import { ReVerificationRulesTab } from "@/components/crm/clm/re-verification/RulesTab";
import type {
  AutoReviewOutcome,
  AutoReviewRule,
  ConfigStatus,
  KYCFlow,
  KYCFlowRoutingRule,
} from "@/types/clm";

type TabKey = "routing" | "review" | "monitoring";

const TAB_META: Record<
  TabKey,
  { label: string; icon: typeof Route; subtitle: string }
> = {
  routing: { label: "Routing", icon: Route, subtitle: "Assign each user to a Flow." },
  review: { label: "Auto-Review", icon: Bot, subtitle: "Auto-approve / reject / send to manual review." },
  monitoring: {
    label: "Monitoring",
    icon: Activity,
    subtitle:
      "Event-driven and continuous triggers for compliance re-verification.",
  },
};

const STATUS_TONES: Record<ConfigStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  draft: "bg-slate-100 text-slate-600",
  retired: "bg-slate-100 text-slate-400",
};

const OUTCOME_META: Record<AutoReviewOutcome, { label: string; tone: string }> = {
  auto_approve: { label: "Auto-approve", tone: "bg-emerald-100 text-emerald-700" },
  auto_reject:  { label: "Auto-reject",  tone: "bg-red-100 text-red-700" },
  manual_review: { label: "Manual review", tone: "bg-amber-100 text-amber-700" },
};

const TAB_ORDER: TabKey[] = ["routing", "review", "monitoring"];

// Back-compat for the redirect from /crm/clm/re-verification/rules,
// which still uses ?tab=re-verification.
function resolveInitialTab(raw: string | null): TabKey {
  if (raw === "re-verification") return "monitoring";
  if (raw && TAB_ORDER.includes(raw as TabKey)) return raw as TabKey;
  return "routing";
}

function RulesPageInner() {
  const search = useSearchParams();
  const [tab, setTab] = useState<TabKey>(resolveInitialTab(search.get("tab")));

  return (
    <div className="space-y-3">
      <Breadcrumb
        items={[
          { label: "CLM Center" },
          { label: "Configuration" },
          { label: "Routing & Rules" },
        ]}
      />
      <PageHeader title="Routing & Rules" />

      <Card padding="none">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {TAB_ORDER.map((key) => {
            const meta = TAB_META[key];
            const Icon = meta.icon;
            const isActive = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2.5 text-xs font-medium inline-flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {meta.label}
              </button>
            );
          })}
        </div>
        <div className="p-4">
          <p className="text-[11px] text-slate-500 mb-3">{TAB_META[tab].subtitle}</p>
          {tab === "routing" && <RoutingTab />}
          {tab === "review" && <AutoReviewTab />}
          {tab === "monitoring" && <ReVerificationRulesTab />}
        </div>
      </Card>
    </div>
  );
}

export default function RulesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-400">Loading…</div>}>
      <RulesPageInner />
    </Suspense>
  );
}

/* ======================================================================== */
/* Tab A — KYC Flow Routing                                                 */
/* ======================================================================== */

function RoutingTab() {
  const actor = useCurrentStaffName();
  const [rows, setRows] = useState<KYCFlowRoutingRule[]>([]);
  const [flows, setFlows] = useState<KYCFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    field: "country_of_residence" as KYCFlowRoutingRule["field"],
    values: "",
    flowId: "",
    priority: 5,
    status: "draft" as ConfigStatus,
  });

  const reload = async () => {
    setLoading(true);
    const [rs, fs] = await Promise.all([
      clmFlowService.routingRules.list(),
      clmFlowService.flows.list(),
    ]);
    rs.sort((a, b) => b.priority - a.priority);
    setRows(rs);
    setFlows(fs);
    setLoading(false);
  };
  useEffect(() => {
    reload();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setDraft({
      name: "",
      field: "country_of_residence",
      values: "",
      flowId: flows[0]?.id ?? "",
      priority: 5,
      status: "draft",
    });
    setDrawerOpen(true);
  };
  const openEdit = (r: KYCFlowRoutingRule) => {
    setEditingId(r.id);
    setDraft({
      name: r.name,
      field: r.field,
      values: r.values.join(", "),
      flowId: r.flowId,
      priority: r.priority,
      status: r.status,
    });
    setDrawerOpen(true);
  };
  const save = async () => {
    if (!draft.name.trim() || !draft.flowId) return;
    setSaving(true);
    try {
      const payload = {
        name: draft.name,
        field: draft.field,
        values: draft.values.split(",").map((s) => s.trim()).filter(Boolean),
        flowId: draft.flowId,
        priority: draft.priority,
        status: draft.status,
      };
      if (editingId) {
        await clmFlowService.routingRules.update(editingId, payload, actor);
      } else {
        await clmFlowService.routingRules.create(payload, actor);
      }
      setDrawerOpen(false);
      await reload();
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this routing rule?")) return;
    await clmFlowService.routingRules.remove(id);
    setDrawerOpen(false);
    await reload();
  };
  const toggle = async (r: KYCFlowRoutingRule) => {
    await clmFlowService.routingRules.setStatus(
      r.id,
      r.status === "active" ? "draft" : "active",
      actor
    );
    await reload();
  };

  const flowName = (id: string) => flows.find((f) => f.id === id)?.name ?? id;

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button onClick={openCreate} disabled={flows.length === 0}>
          <Plus className="w-4 h-4" />
          New Routing Rule
        </Button>
      </div>
      <div className="space-y-2">
        {loading && (
          <p className="text-sm text-slate-400 text-center py-4">Loading…</p>
        )}
        {!loading && rows.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No routing rules yet.</p>
        )}
        {rows.map((r) => (
          <Card key={r.id} padding="md">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                <Route className="w-4 h-4 text-blue-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-900">{r.name}</h3>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono tabular-nums">
                    P{r.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_TONES[r.status]}`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 font-mono">
                  <span className="text-slate-400">if</span> {r.field}{" "}
                  <span className="text-slate-400">in</span>{" "}
                  <span className="text-slate-900">{`{${r.values.join(", ")}}`}</span>{" "}
                  <span className="text-slate-400">→ assign flow</span>{" "}
                  <span className="text-blue-700 font-semibold">{flowName(r.flowId)}</span>
                </p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <Button variant="secondary" size="sm" onClick={() => openEdit(r)}>
                  Edit
                </Button>
                <Button variant="secondary" size="sm" onClick={() => toggle(r)}>
                  <Power className="w-3 h-3" />
                  {r.status === "active" ? "Disable" : "Activate"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ConfigDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={save}
        title={editingId ? "Edit Routing Rule" : "New Routing Rule"}
        saving={saving}
        saveDisabled={!draft.name.trim() || !draft.flowId}
        destructive={
          editingId ? { label: "Delete rule", onClick: () => remove(editingId) } : undefined
        }
      >
        <Field label="Name" required>
          <TextInput
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. EU residents → EU Retail"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Field">
            <Select
              value={draft.field}
              onChange={(e) => setDraft({ ...draft, field: e.target.value })}
              options={[
                { label: "Country of Residence", value: "country_of_residence" },
                { label: "Passport Nationality", value: "passport_nationality" },
                { label: "Registration Source",  value: "registration_source"  },
                { label: "Referring IB",         value: "ib_id"                },
              ]}
            />
          </Field>
          <Field label="Priority" hint="Higher → checked first">
            <TextInput
              type="number"
              value={draft.priority}
              onChange={(e) =>
                setDraft({ ...draft, priority: Number(e.target.value) || 0 })
              }
            />
          </Field>
        </div>
        <Field
          label="Values"
          hint="Comma-separated. Use `*` for the default fallback."
          required
        >
          <TextArea
            value={draft.values}
            onChange={(e) => setDraft({ ...draft, values: e.target.value })}
            rows={2}
            placeholder="ID, VN, TH"
          />
        </Field>
        <Field label="Assign Flow" required>
          <Select
            value={draft.flowId}
            onChange={(e) => setDraft({ ...draft, flowId: e.target.value })}
            options={[
              { label: "(pick a flow)", value: "" },
              ...flows.map((f) => ({ label: f.name, value: f.id })),
            ]}
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
      </ConfigDrawer>
    </>
  );
}

/* ======================================================================== */
/* Tab B — Auto-Review                                                      */
/* ======================================================================== */

function AutoReviewTab() {
  const actor = useCurrentStaffName();
  const [rows, setRows] = useState<AutoReviewRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<{
    name: string;
    conditionGroup: ConditionBuilderValue;
    outcome: AutoReviewOutcome;
    priority: number;
    status: ConfigStatus;
  }>({
    name: "",
    conditionGroup: { logic: "and", conditions: [] },
    outcome: "auto_approve",
    priority: 5,
    status: "draft",
  });

  const reload = async () => {
    setLoading(true);
    const list = await clmFlowService.autoReviewRules.list();
    list.sort((a, b) => b.priority - a.priority);
    setRows(list);
    setLoading(false);
  };
  useEffect(() => {
    reload();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setDraft({
      name: "",
      conditionGroup: { logic: "and", conditions: [{ field: "country", operator: "eq", value: "" }] },
      outcome: "auto_approve",
      priority: 5,
      status: "draft",
    });
    setDrawerOpen(true);
  };
  const openEdit = (r: AutoReviewRule) => {
    setEditingId(r.id);
    setDraft({
      name: r.name,
      conditionGroup: {
        logic: r.logic ?? "and",
        conditions: r.conditions,
      },
      outcome: r.outcome,
      priority: r.priority,
      status: r.status,
    });
    setDrawerOpen(true);
  };
  const save = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: draft.name,
        logic: draft.conditionGroup.logic,
        conditions: draft.conditionGroup.conditions.filter((c) => c.field),
        outcome: draft.outcome,
        priority: draft.priority,
        status: draft.status,
      };
      if (editingId) {
        await clmFlowService.autoReviewRules.update(editingId, payload, actor);
      } else {
        await clmFlowService.autoReviewRules.create(payload, actor);
      }
      setDrawerOpen(false);
      await reload();
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this auto-review rule?")) return;
    await clmFlowService.autoReviewRules.remove(id);
    setDrawerOpen(false);
    await reload();
  };
  const toggle = async (r: AutoReviewRule) => {
    await clmFlowService.autoReviewRules.setStatus(
      r.id,
      r.status === "active" ? "draft" : "active",
      actor
    );
    await reload();
  };

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          New Auto-Review Rule
        </Button>
      </div>
      <div className="space-y-2">
        {loading && <p className="text-sm text-slate-400 text-center py-4">Loading…</p>}
        {!loading && rows.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No auto-review rules yet.</p>
        )}
        {rows.map((r) => {
          const meta = OUTCOME_META[r.outcome];
          const joiner = (r.logic ?? "and").toUpperCase();
          return (
            <Card key={r.id} padding="md">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-violet-50 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-violet-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-slate-900">{r.name}</h3>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono tabular-nums">
                      P{r.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_TONES[r.status]}`}>
                      {r.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${meta.tone}`}>
                      → {meta.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 font-mono">
                    {r.conditions.length === 0
                      ? "(always)"
                      : r.conditions
                          .map(
                            (c) =>
                              `${c.field} ${c.operator} ${
                                Array.isArray(c.value) ? `{${c.value.join(",")}}` : c.value
                              }`
                          )
                          .join(` ${joiner} `)}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => openEdit(r)}>
                    Edit
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => toggle(r)}>
                    <Power className="w-3 h-3" />
                    {r.status === "active" ? "Disable" : "Activate"}
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
        title={editingId ? "Edit Auto-Review Rule" : "New Auto-Review Rule"}
        saving={saving}
        saveDisabled={!draft.name.trim()}
        width={600}
        destructive={
          editingId ? { label: "Delete rule", onClick: () => remove(editingId) } : undefined
        }
      >
        <Field label="Name" required>
          <TextInput
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. AML hit → Auto-reject"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Outcome" required>
            <Select
              value={draft.outcome}
              onChange={(e) =>
                setDraft({ ...draft, outcome: e.target.value as AutoReviewOutcome })
              }
              options={[
                { label: "Auto-approve", value: "auto_approve" },
                { label: "Auto-reject", value: "auto_reject" },
                { label: "Manual review", value: "manual_review" },
              ]}
            />
          </Field>
          <Field label="Priority">
            <TextInput
              type="number"
              value={draft.priority}
              onChange={(e) =>
                setDraft({ ...draft, priority: Number(e.target.value) || 0 })
              }
            />
          </Field>
        </div>

        <ConditionBuilder
          value={draft.conditionGroup}
          onChange={(next) => setDraft({ ...draft, conditionGroup: next })}
        />

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
      </ConfigDrawer>
    </>
  );
}
