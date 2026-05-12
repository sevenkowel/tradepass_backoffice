"use client";

/**
 * KYC Policies — read + CRUD via `clmConfigService.policies`.
 *
 * The page is a list of expandable cards (each card is a rule-engine entry).
 * Create / Edit open the shared right-side drawer; Activate/Disable/Delete
 * happen inline. All mutations route through the service so swapping the
 * mock for the real backend doesn't require page changes.
 */

import { useEffect, useMemo, useState } from "react";
import { Shield, ChevronRight, Plus } from "lucide-react";
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
  KYCPolicy,
  KYCPolicyCategory,
  KYCPolicyType,
} from "@/types/clm";

const TYPE_OPTIONS: { label: string; value: KYCPolicyType }[] = [
  { label: "Country", value: "country" },
  { label: "Document", value: "document" },
  { label: "Risk", value: "risk" },
  { label: "AML", value: "aml" },
  { label: "Deposit", value: "deposit" },
  { label: "Withdrawal", value: "withdrawal" },
  { label: "Account", value: "account" },
  { label: "Auto Review", value: "auto_review" },
];

const TYPE_TONES: Record<KYCPolicyType, string> = {
  country: "bg-blue-100 text-blue-700",
  document: "bg-violet-100 text-violet-700",
  risk: "bg-red-100 text-red-700",
  aml: "bg-amber-100 text-amber-700",
  deposit: "bg-emerald-100 text-emerald-700",
  withdrawal: "bg-orange-100 text-orange-700",
  account: "bg-cyan-100 text-cyan-700",
  auto_review: "bg-slate-100 text-slate-700",
};

const STATUS_TONES: Record<ConfigStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  draft: "bg-slate-100 text-slate-600",
  retired: "bg-slate-100 text-slate-400",
};

interface DraftPolicy {
  name: string;
  type: KYCPolicyType;
  category: KYCPolicyCategory;
  country: string;
  status: ConfigStatus;
  priority: number;
  rule: string;
  description: string;
}

const EMPTY_DRAFT: DraftPolicy = {
  name: "",
  type: "country",
  category: "review",
  country: "Global",
  status: "draft",
  priority: 1,
  rule: "",
  description: "",
};

/** PRD §7.5 — sidebar categories. Order matters; the page renders these
 *  buckets in the same order as the PRD. */
const CATEGORY_META: Record<
  KYCPolicyCategory,
  { label: string; description: string }
> = {
  review: { label: "Review", description: "Auto-approve / reject thresholds" },
  risk: { label: "Risk", description: "Score adjustments, blacklists, EDD triggers" },
  routing: { label: "Routing", description: "Auto-assign by country / channel" },
  escalation: { label: "Escalation", description: "Hand-off rules to senior reviewers" },
  sla: { label: "SLA", description: "Response time per user class" },
  automation: { label: "Automation", description: "Reminders, auto-actions, retries" },
  permission: { label: "Permission", description: "Tier-gated capabilities" },
};

const CATEGORY_ORDER: KYCPolicyCategory[] = [
  "review",
  "risk",
  "routing",
  "escalation",
  "sla",
  "automation",
  "permission",
];

export default function KYCPoliciesPage() {
  const actor = useCurrentStaffName();

  const [policies, setPolicies] = useState<KYCPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<KYCPolicyCategory | "all">("all");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftPolicy>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const counts = useMemo(() => {
    const c: Record<KYCPolicyCategory | "all", number> = {
      all: policies.length,
      review: 0, risk: 0, routing: 0, escalation: 0, sla: 0, automation: 0, permission: 0,
    };
    for (const p of policies) c[p.category] += 1;
    return c;
  }, [policies]);

  const filteredPolicies = useMemo(
    () =>
      activeCategory === "all"
        ? policies
        : policies.filter((p) => p.category === activeCategory),
    [policies, activeCategory]
  );

  const reload = async () => {
    setLoading(true);
    const list = await clmConfigService.policies.list();
    setPolicies(list);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setDrawerOpen(true);
  };

  const openEdit = (p: KYCPolicy) => {
    setEditingId(p.id);
    setDraft({
      name: p.name,
      type: p.type,
      category: p.category,
      country: p.country,
      status: p.status,
      priority: p.priority ?? 1,
      rule: p.rule,
      description: p.description ?? "",
    });
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim() || !draft.rule.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await clmConfigService.policies.update({ id: editingId, ...draft }, actor);
      } else {
        await clmConfigService.policies.create(draft, actor);
      }
      setDrawerOpen(false);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this policy? This cannot be undone.")) return;
    await clmConfigService.policies.remove(id, actor);
    setDrawerOpen(false);
    await reload();
  };

  const toggleStatus = async (p: KYCPolicy) => {
    const next: ConfigStatus = p.status === "active" ? "draft" : "active";
    await clmConfigService.policies.setStatus(p.id, next, actor);
    await reload();
  };

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "KYC Policies" }]} />
      <PageHeader
        title="KYC Policies"
        actions={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            New Policy
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[220px,1fr] gap-3">
        {/* Category sidebar (PRD §7.5) */}
        <Card padding="none" className="overflow-hidden h-fit">
          <button
            onClick={() => setActiveCategory("all")}
            className={`w-full text-left px-3 py-2.5 border-b border-slate-100 transition-colors ${
              activeCategory === "all" ? "bg-blue-50/60" : "hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">All categories</span>
              <span className="text-[10px] font-mono tabular-nums text-slate-500">{counts.all}</span>
            </div>
          </button>
          {CATEGORY_ORDER.map((cat) => {
            const meta = CATEGORY_META[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`w-full text-left px-3 py-2 border-b border-slate-50 last:border-0 transition-colors ${
                  isActive ? "bg-blue-50/60" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">{meta.label}</span>
                  <span className="text-[10px] font-mono tabular-nums text-slate-500">{counts[cat]}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{meta.description}</p>
              </button>
            );
          })}
        </Card>

        {/* Policy list */}
        <div className="space-y-2">
        {loading && (
          <div className="text-sm text-slate-400 py-8 text-center">Loading policies…</div>
        )}
        {!loading && filteredPolicies.length === 0 && (
          <div className="text-sm text-slate-400 py-8 text-center">
            {activeCategory === "all" ? "No policies yet" : `No ${CATEGORY_META[activeCategory].label} policies yet`}
          </div>
        )}
        {filteredPolicies.map((policy) => {
          const isOpen = expanded === policy.id;
          return (
            <Card
              key={policy.id}
              padding="md"
              className={`cursor-pointer transition-all ${
                isOpen ? "ring-2 ring-primary/30" : ""
              }`}
              onClick={() => setExpanded(isOpen ? null : policy.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 text-sm">{policy.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${TYPE_TONES[policy.type]}`}>
                      {policy.type.replace("_", " ")}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_TONES[policy.status]}`}>
                      {policy.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
                    <span>P{policy.priority}</span>
                    <span>· {policy.country}</span>
                    <span>· by {policy.updatedBy}</span>
                    <span>· {new Date(policy.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-slate-300 transition-transform ${isOpen ? "rotate-90" : ""}`}
                />
              </div>

              {isOpen && (
                <div
                  className="mt-3 pt-3 border-t border-slate-100 space-y-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  {policy.description && (
                    <p className="text-xs text-slate-600">{policy.description}</p>
                  )}
                  <div className="p-3 bg-slate-50 rounded-md font-mono text-xs text-slate-700 whitespace-pre-wrap">
                    {policy.rule}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => openEdit(policy)}>
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toggleStatus(policy)}
                    >
                      {policy.status === "active" ? "Disable" : "Activate"}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        </div>
      </div>

      <ConfigDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={save}
        title={editingId ? "Edit Policy" : "New Policy"}
        subtitle={editingId ? `Editing ${editingId}` : "Add a new rule-engine entry"}
        saving={saving}
        saveDisabled={!draft.name.trim() || !draft.rule.trim()}
        destructive={
          editingId
            ? { label: "Delete policy", onClick: () => remove(editingId) }
            : undefined
        }
      >
        <Field label="Name" required>
          <TextInput
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. UAE EDD Required"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" required hint="PRD §7.5 bucket">
            <Select
              value={draft.category}
              onChange={(e) =>
                setDraft({ ...draft, category: e.target.value as KYCPolicyCategory })
              }
              options={CATEGORY_ORDER.map((cat) => ({
                label: CATEGORY_META[cat].label,
                value: cat,
              }))}
            />
          </Field>
          <Field label="Type" required>
            <Select
              value={draft.type}
              onChange={(e) =>
                setDraft({ ...draft, type: e.target.value as KYCPolicyType })
              }
              options={TYPE_OPTIONS}
            />
          </Field>
        </div>
        <Field label="Country" required>
          <TextInput
            value={draft.country}
            onChange={(e) => setDraft({ ...draft, country: e.target.value })}
            placeholder="ID, VN, AE, or Global"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
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
          label="Rule"
          required
          hint="Pseudo-syntax: IF <condition> THEN <action>"
        >
          <TextArea
            value={draft.rule}
            onChange={(e) => setDraft({ ...draft, rule: e.target.value })}
            placeholder="IF country = UAE THEN edd_required = true"
            rows={3}
          />
        </Field>
        <Field label="Description">
          <TextArea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Why this rule exists, who reviewed it, etc."
            rows={2}
          />
        </Field>
      </ConfigDrawer>
    </div>
  );
}
