"use client";

/**
 * KYC Levels — tier definitions plus the cross-tier permission matrix.
 *
 * The matrix is derived from each tier's `permissions` map, so editing
 * a permission for any tier feeds back into the matrix view immediately.
 */

import { useEffect, useMemo, useState } from "react";
import { Shield, Plus, Check } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { clmConfigService } from "@/lib/clm/services";
import { useCurrentStaffName } from "@/hooks/useCurrentStaff";
import {
  ConfigDrawer,
  Field,
  Select,
  TextInput,
} from "@/components/crm/clm/config/ConfigDrawer";
import type { ConfigStatus, KYCLevelConfig } from "@/types/clm";

type Perm = "Yes" | "No" | "Limited";

interface DraftLevel {
  name: string;
  label: string;
  badgeClass: string;
  requiredSteps: string;
  status: ConfigStatus;
  priority: number;
  permissions: Record<string, Perm>;
}

const PERMISSION_KEYS: { key: string; label: string }[] = [
  { key: "view_market", label: "View Market" },
  { key: "create_demo", label: "Create Demo Account" },
  { key: "submit_kyc", label: "Submit KYC" },
  { key: "create_real", label: "Create Real Account" },
  { key: "deposit", label: "Deposit" },
  { key: "withdraw", label: "Withdraw" },
  { key: "add_account", label: "Add Trading Account" },
  { key: "high_leverage", label: "High Leverage" },
  { key: "auto_withdrawal", label: "Auto Withdrawal" },
  { key: "copy_trading", label: "Copy Trading" },
  { key: "api_access", label: "API Access" },
];

const BADGE_OPTIONS = [
  { label: "Slate", value: "bg-slate-100 text-slate-700" },
  { label: "Blue", value: "bg-blue-100 text-blue-700" },
  { label: "Violet", value: "bg-violet-100 text-violet-700" },
  { label: "Amber", value: "bg-amber-100 text-amber-700" },
  { label: "Emerald", value: "bg-emerald-100 text-emerald-700" },
];

const DEFAULT_PERMS: Record<string, Perm> = Object.fromEntries(
  PERMISSION_KEYS.map((p) => [p.key, "No" as Perm])
);

const EMPTY: DraftLevel = {
  name: "",
  label: "",
  badgeClass: BADGE_OPTIONS[0].value,
  requiredSteps: "",
  status: "draft",
  priority: 0,
  permissions: { ...DEFAULT_PERMS },
};

export default function KYCLevelsPage() {
  const actor = useCurrentStaffName();

  const [levels, setLevels] = useState<KYCLevelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftLevel>(EMPTY);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    const list = await clmConfigService.levels.list();
    // Sort by priority asc so Tier 0 → Tier 4 reads naturally.
    list.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
    setLevels(list);
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

  const openEdit = (lvl: KYCLevelConfig) => {
    setEditingId(lvl.id);
    setDraft({
      name: lvl.name,
      label: lvl.label,
      badgeClass: lvl.badgeClass,
      requiredSteps: lvl.requiredSteps.join(", "),
      status: lvl.status,
      priority: lvl.priority ?? 0,
      permissions: { ...DEFAULT_PERMS, ...lvl.permissions },
    });
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      const existing = editingId ? levels.find((l) => l.id === editingId) : null;
      const payload = {
        name: draft.name,
        label: draft.label,
        badgeClass: draft.badgeClass,
        requiredSteps: draft.requiredSteps
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        status: draft.status,
        priority: draft.priority,
        permissions: draft.permissions,
        userCount: existing?.userCount ?? 0,
      };
      if (editingId) {
        await clmConfigService.levels.update({ id: editingId, ...payload }, actor);
      } else {
        await clmConfigService.levels.create(payload, actor);
      }
      setDrawerOpen(false);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this tier? Existing users on this tier will need re-tiering.")) return;
    await clmConfigService.levels.remove(id, actor);
    setDrawerOpen(false);
    await reload();
  };

  const matrix = useMemo(
    () =>
      PERMISSION_KEYS.map((perm) => ({
        ...perm,
        values: levels.map((lvl) => lvl.permissions[perm.key] ?? "No"),
      })),
    [levels]
  );

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "KYC Levels" }]} />
      <PageHeader
        title="KYC Levels"
        actions={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            New Tier
          </Button>
        }
      />

      {/* Tier cards */}
      <div className="space-y-2">
        {loading && (
          <div className="text-sm text-slate-400 py-8 text-center">Loading tiers…</div>
        )}
        {levels.map((lvl) => {
          const isOpen = expanded === lvl.id;
          return (
            <Card
              key={lvl.id}
              padding="md"
              className={`cursor-pointer transition-all ${isOpen ? "ring-2 ring-primary/30" : ""}`}
              onClick={() => setExpanded(isOpen ? null : lvl.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${lvl.badgeClass.split(" ")[0]}`}>
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 text-sm">{lvl.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${lvl.badgeClass}`}>
                      {lvl.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {lvl.requiredSteps.length} steps · priority {lvl.priority}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900 tabular-nums">{lvl.userCount}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Users</p>
                </div>
              </div>

              {isOpen && (
                <div
                  className="mt-3 pt-3 border-t border-slate-100 space-y-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div>
                    <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Required Steps
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {lvl.requiredSteps.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded text-xs text-slate-700">
                          <Check className="w-3 h-3 text-emerald-500" />
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => openEdit(lvl)}>
                    Edit Tier
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Permission Matrix */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Permission Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-2 font-medium text-slate-500">Permission</th>
                {levels.map((lvl) => (
                  <th key={lvl.id} className="text-center py-2 px-2 font-medium text-slate-500">
                    {lvl.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.key} className="border-b border-slate-50 hover:bg-slate-50/40">
                  <td className="py-2 px-2 text-slate-700">{row.label}</td>
                  {row.values.map((value, i) => (
                    <td key={i} className="py-2 px-2 text-center">
                      <span
                        className={`text-xs font-medium ${
                          value === "Yes"
                            ? "text-emerald-600"
                            : value === "No"
                            ? "text-slate-300"
                            : "text-amber-600"
                        }`}
                      >
                        {value === "No" ? "—" : value}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfigDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={save}
        title={editingId ? "Edit Tier" : "New Tier"}
        subtitle={editingId ? `Editing ${editingId}` : "Add a new KYC tier"}
        saving={saving}
        saveDisabled={!draft.name.trim()}
        width={560}
        destructive={
          editingId ? { label: "Delete tier", onClick: () => remove(editingId) } : undefined
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" required>
            <TextInput
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Tier 5"
            />
          </Field>
          <Field label="Label" required>
            <TextInput
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              placeholder="Premium"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Badge colour">
            <Select
              value={draft.badgeClass}
              onChange={(e) => setDraft({ ...draft, badgeClass: e.target.value })}
              options={BADGE_OPTIONS}
            />
          </Field>
          <Field label="Priority" hint="Tier 0 = lowest, Tier 4 = highest">
            <TextInput
              type="number"
              value={draft.priority}
              onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) || 0 })}
            />
          </Field>
        </div>
        <Field label="Required steps" hint="Comma-separated">
          <TextInput
            value={draft.requiredSteps}
            onChange={(e) => setDraft({ ...draft, requiredSteps: e.target.value })}
            placeholder="Region, Document, Liveness, POA"
          />
        </Field>
        <Field label="Status">
          <Select
            value={draft.status}
            onChange={(e) => setDraft({ ...draft, status: e.target.value as ConfigStatus })}
            options={[
              { label: "Active", value: "active" },
              { label: "Draft", value: "draft" },
              { label: "Retired", value: "retired" },
            ]}
          />
        </Field>

        <div className="pt-3 border-t border-slate-100">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">Permissions</h4>
          <div className="space-y-1.5">
            {PERMISSION_KEYS.map((p) => (
              <div key={p.key} className="flex items-center gap-2">
                <span className="text-xs text-slate-700 flex-1">{p.label}</span>
                <select
                  className="h-7 px-2 rounded border border-slate-200 bg-white text-xs"
                  value={draft.permissions[p.key]}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      permissions: { ...draft.permissions, [p.key]: e.target.value as Perm },
                    })
                  }
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Limited">Limited</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </ConfigDrawer>
    </div>
  );
}
