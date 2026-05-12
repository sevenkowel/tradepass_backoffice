"use client";

/**
 * Agreements — versioned legal documents bound to KYC tiers and regions.
 * Force-resign toggles a notification banner the next time matched users
 * sign in; the actual signature workflow lives elsewhere.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Globe, AlertTriangle, Plus, History, GitBranch } from "lucide-react";
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
import type {
  AgreementType,
  ConfigAgreement,
  ConfigStatus,
} from "@/types/clm";

const TYPE_OPTIONS: { label: string; value: AgreementType }[] = [
  { label: "Client Agreement", value: "client_agreement" },
  { label: "Risk Disclosure", value: "risk_disclosure" },
  { label: "Privacy Policy", value: "privacy_policy" },
  { label: "Terms of Service", value: "terms_of_service" },
  { label: "EDD Supplement", value: "edd_supplement" },
  { label: "Marketing Consent", value: "marketing_consent" },
];

const STATUS_TONES: Record<ConfigStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  draft: "bg-slate-100 text-slate-600",
  retired: "bg-slate-100 text-slate-400",
};

interface DraftAgreement {
  name: string;
  type: AgreementType;
  currentVersion: string;
  languages: string;
  country: string;
  forceResign: boolean;
  status: ConfigStatus;
}

const EMPTY: DraftAgreement = {
  name: "",
  type: "client_agreement",
  currentVersion: "v1.0",
  languages: "en",
  country: "Global",
  forceResign: false,
  status: "draft",
};

export default function AgreementsPage() {
  const actor = useCurrentStaffName();

  const [rows, setRows] = useState<ConfigAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ConfigStatus | "all">("all");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftAgreement>(EMPTY);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    setRows(await clmConfigService.agreements.list());
    setLoading(false);
  };

  /** Counts by status across the whole pool — drives the capsule
   *  filter strip. The chips always show totals (not the filtered
   *  subset), which is the convention the rest of the CRM uses. */
  const statusCounts = useMemo(() => {
    const c: Record<ConfigStatus | "all", number> = {
      all: rows.length,
      active: 0,
      draft: 0,
      retired: 0,
    };
    for (const a of rows) c[a.status] += 1;
    return c;
  }, [rows]);

  const filteredRows = useMemo(
    () =>
      statusFilter === "all"
        ? rows
        : rows.filter((r) => r.status === statusFilter),
    [rows, statusFilter]
  );

  /** Helper: does this agreement have a draft version sitting alongside
   *  its active one? Surfaces the "v1.0 active · v1.1 brewing" case so
   *  operators don't have to open each card to discover pending edits. */
  const draftPendingCount = (a: ConfigAgreement): number =>
    a.versions.filter((v) => v.status === "draft").length;

  useEffect(() => {
    reload();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY);
    setDrawerOpen(true);
  };

  const openEdit = (a: ConfigAgreement) => {
    setEditingId(a.id);
    setDraft({
      name: a.name,
      type: a.type,
      currentVersion: a.currentVersion,
      languages: a.languages.join(","),
      country: a.country,
      forceResign: a.forceResign,
      status: a.status,
    });
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      const existing = editingId ? rows.find((r) => r.id === editingId) : null;
      const payload = {
        ...draft,
        languages: draft.languages.split(",").map((s) => s.trim()).filter(Boolean),
        signedCount: existing?.signedCount ?? 0,
        // Keep existing versions on update; brand-new agreements start
        // with no versions — the operator drafts the first one inside
        // the agreement detail page.
        versions: existing?.versions ?? [],
        activeVersionId: existing?.activeVersionId,
      };
      if (editingId) {
        await clmConfigService.agreements.update({ id: editingId, ...payload }, actor);
      } else {
        await clmConfigService.agreements.create(payload, actor);
      }
      setDrawerOpen(false);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this agreement? Existing signatures stay associated with the version that was signed.")) return;
    await clmConfigService.agreements.remove(id, actor);
    setDrawerOpen(false);
    await reload();
  };

  const toggleForceResign = async (a: ConfigAgreement) => {
    await clmConfigService.agreements.update(
      { id: a.id, forceResign: !a.forceResign },
      actor
    );
    await reload();
  };

  const typeLabel = (t: AgreementType) =>
    TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t;

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "Agreements" }]} />
      <PageHeader
        title="Agreements"
        actions={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            New Agreement
          </Button>
        }
      />

      {/* Capsule status filter — same chip pattern as the audit-trail
          and re-verification list pages. */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(
          [
            { key: "all",     label: "All" },
            { key: "active",  label: "Active" },
            { key: "draft",   label: "Draft" },
            { key: "retired", label: "Retired" },
          ] as const
        ).map(({ key, label }) => {
          const count = statusCounts[key];
          const active = statusFilter === key;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {label}
              <span
                className={`text-[10px] font-mono tabular-nums ${
                  active ? "text-white/80" : "text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {loading && (
          <div className="text-sm text-slate-400 py-8 text-center">Loading agreements…</div>
        )}
        {!loading && filteredRows.length === 0 && (
          <div className="text-sm text-slate-400 py-8 text-center">
            {statusFilter === "all"
              ? "No agreements yet"
              : `No ${statusFilter} agreements`}
          </div>
        )}
        {filteredRows.map((agr) => {
          const isOpen = expanded === agr.id;
          return (
            <Card
              key={agr.id}
              padding="md"
              className={`cursor-pointer transition-all ${isOpen ? "ring-2 ring-primary/30" : ""}`}
              onClick={() => setExpanded(isOpen ? null : agr.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 text-sm">{agr.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                      {typeLabel(agr.type)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_TONES[agr.status]}`}>
                      {agr.status}
                    </span>
                    {/* Draft-brewing indicator — surfaces the "active v1.0
                        + draft v1.1" case so operators don't have to open
                        each card. Hidden when status === "draft" (the
                        primary status pill already conveys the same info). */}
                    {agr.status !== "draft" && draftPendingCount(agr) > 0 && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700"
                        title={`${draftPendingCount(agr)} draft version${draftPendingCount(agr) === 1 ? "" : "s"} pending`}
                      >
                        <GitBranch className="w-3 h-3" />
                        {draftPendingCount(agr)} draft pending
                      </span>
                    )}
                    {agr.forceResign && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
                        <AlertTriangle className="w-3 h-3" />
                        Force Re-sign
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
                    <span className="text-blue-600">{agr.currentVersion}</span>
                    <span className="inline-flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {agr.languages.join(", ") || "—"}
                    </span>
                    <span>· {agr.country}</span>
                    <span>· {agr.signedCount} signed</span>
                    <span>· {new Date(agr.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {isOpen && (
                <div
                  className="mt-3 pt-3 border-t border-slate-100 space-y-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-xs text-slate-600 inline-flex items-center gap-1.5">
                    <History className="w-3 h-3" />
                    Last updated by <span className="font-medium">{agr.updatedBy}</span> on{" "}
                    {new Date(agr.updatedAt).toLocaleDateString()}
                  </div>
                  {agr.forceResign && (
                    <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-md text-xs text-amber-700">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      All matched users must re-sign on next login.
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Link
                      href={`/crm/clm/agreements/${agr.id}`}
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-primary text-white text-xs font-medium hover:bg-blue-700"
                    >
                      Open detail
                    </Link>
                    <Button variant="secondary" size="sm" onClick={() => openEdit(agr)}>
                      Edit metadata
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => toggleForceResign(agr)}>
                      {agr.forceResign ? "Disable Force Re-sign" : "Enable Force Re-sign"}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <ConfigDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={save}
        title={editingId ? "Edit Agreement" : "New Agreement"}
        subtitle={editingId ? `Editing ${editingId}` : "Add a new legal document"}
        saving={saving}
        saveDisabled={!draft.name.trim()}
        destructive={
          editingId ? { label: "Delete agreement", onClick: () => remove(editingId) } : undefined
        }
      >
        <Field label="Name" required>
          <TextInput
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. Client Agreement"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type" required>
            <Select
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value as AgreementType })}
              options={TYPE_OPTIONS}
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
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Current version">
            <TextInput
              value={draft.currentVersion}
              onChange={(e) => setDraft({ ...draft, currentVersion: e.target.value })}
              placeholder="v1.0"
            />
          </Field>
          <Field label="Country" hint="ISO code or 'Global'">
            <TextInput
              value={draft.country}
              onChange={(e) => setDraft({ ...draft, country: e.target.value })}
              placeholder="Global"
            />
          </Field>
        </div>
        <Field
          label="Languages"
          hint="Comma-separated ISO codes (e.g. en, id, vi)"
        >
          <TextInput
            value={draft.languages}
            onChange={(e) => setDraft({ ...draft, languages: e.target.value })}
            placeholder="en, id, vi, th"
          />
        </Field>
        <label className="inline-flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={draft.forceResign}
            onChange={(e) => setDraft({ ...draft, forceResign: e.target.checked })}
          />
          Require all matched users to re-sign on next login
        </label>
      </ConfigDrawer>
    </div>
  );
}
