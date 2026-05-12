"use client";

/**
 * Compliance Templates — PRD §6 Regulatory Engine.
 *
 * Three-pane layout:
 *   - left:   regulator template list (PRD §6.5)
 *   - right:  tabbed config editor with five sections (PRD §6.6.A–E):
 *               Regulatory · AML · Risk · Leverage · Agreement Rules
 *
 * The header card (above the tabs) holds metadata + Clone / Publish /
 * Archive actions (PRD §6.7). Bundled-counts ("policies / forms /
 * agreements") render as a strip below the metadata.
 */

import { useEffect, useMemo, useState } from "react";
import {
  LayoutTemplate,
  Plus,
  Globe,
  Shield,
  Copy,
  Power,
  Save,
  Trash2,
  Archive,
  Sparkles,
  ListChecks,
  ScanLine,
  AlertTriangle,
  Gauge,
  FileText,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { clmConfigService } from "@/lib/clm/services";
import { useCurrentStaffName } from "@/hooks/useCurrentStaff";
import { Field, Select, TextInput } from "@/components/crm/clm/config/ConfigDrawer";
import type {
  AMLRequirements,
  ConfigStatus,
  ConfigTemplate,
  LeverageRule,
  RegulatoryRequirements,
  RiskControlRule,
  TemplateAgreementRules,
} from "@/types/clm";

const STATUS_TONES: Record<ConfigStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  draft: "bg-slate-100 text-slate-600",
  retired: "bg-slate-100 text-slate-400",
};

type TabKey = "regulatory" | "aml" | "risk" | "leverage" | "agreements";

const TAB_META: Record<TabKey, { label: string; icon: typeof ListChecks }> = {
  regulatory: { label: "Regulatory", icon: ListChecks },
  aml: { label: "AML", icon: ScanLine },
  risk: { label: "Risk Controls", icon: AlertTriangle },
  leverage: { label: "Leverage", icon: Gauge },
  agreements: { label: "Agreement Rules", icon: FileText },
};

const REG_FIELD_LABELS: Record<keyof RegulatoryRequirements, string> = {
  identityVerification: "Identity Verification",
  livenessVerification: "Liveness Verification",
  proofOfAddress: "Proof of Address",
  incomeProof: "Income Proof",
  questionnaire: "Suitability Questionnaire",
  agreementSigning: "Agreement Signing",
  pepDeclaration: "PEP Declaration",
};

const AML_FIELD_LABELS: Record<keyof AMLRequirements, string> = {
  sanctionScreening: "Sanction Screening",
  pepScreening: "PEP Screening",
  adverseMedia: "Adverse Media",
  walletScreening: "Wallet Screening",
  sourceOfWealth: "Source of Wealth",
};

const ACCOUNT_TYPES: LeverageRule["accountType"][] = [
  "Retail",
  "Professional",
  "VIP",
  "Institutional",
];

/** Helpers for the empty-state defaults used by the "New Template" flow. */
const EMPTY_REG: RegulatoryRequirements = {
  identityVerification: true,
  livenessVerification: true,
  proofOfAddress: false,
  incomeProof: false,
  questionnaire: false,
  agreementSigning: true,
  pepDeclaration: true,
};
const EMPTY_AML: AMLRequirements = {
  sanctionScreening: true,
  pepScreening: true,
  adverseMedia: false,
  walletScreening: false,
  sourceOfWealth: false,
};
const EMPTY_LEVERAGE: LeverageRule[] = ACCOUNT_TYPES.map((t) => ({
  accountType: t,
  maxLeverage: t === "Retail" ? 30 : t === "Professional" ? 200 : 500,
}));
const EMPTY_AGR_RULES: TemplateAgreementRules = {
  forceResign: false,
  resignIntervalMonths: 0,
  mandatoryLanguage: "en",
};

interface DraftTemplate {
  id?: string;
  name: string;
  country: string;
  regulator: string;
  version: string;
  status: ConfigStatus;
  policiesCount: number;
  formsCount: number;
  agreementsCount: number;
  regulatoryRequirements: RegulatoryRequirements;
  amlRequirements: AMLRequirements;
  riskControls: RiskControlRule[];
  leverageRules: LeverageRule[];
  agreementRules: TemplateAgreementRules;
}

const EMPTY_DRAFT: DraftTemplate = {
  name: "",
  country: "",
  regulator: "",
  version: "v1.0",
  status: "draft",
  policiesCount: 0,
  formsCount: 0,
  agreementsCount: 0,
  regulatoryRequirements: { ...EMPTY_REG },
  amlRequirements: { ...EMPTY_AML },
  riskControls: [],
  leverageRules: EMPTY_LEVERAGE.slice(),
  agreementRules: { ...EMPTY_AGR_RULES },
};

function fromTemplate(t: ConfigTemplate): DraftTemplate {
  return {
    id: t.id,
    name: t.name,
    country: t.country,
    regulator: t.regulator,
    version: t.version,
    status: t.status,
    policiesCount: t.policiesCount,
    formsCount: t.formsCount,
    agreementsCount: t.agreementsCount,
    regulatoryRequirements: { ...t.regulatoryRequirements },
    amlRequirements: { ...t.amlRequirements },
    riskControls: t.riskControls.map((r) => ({ ...r })),
    leverageRules: t.leverageRules.map((r) => ({ ...r })),
    agreementRules: { ...t.agreementRules },
  };
}

export default function ComplianceTemplatesPage() {
  const actor = useCurrentStaffName();

  const [rows, setRows] = useState<ConfigTemplate[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<TabKey>("regulatory");
  const [searchQuery, setSearchQuery] = useState("");

  const reload = async () => {
    setLoading(true);
    const list = await clmConfigService.templates.list();
    setRows(list);
    setLoading(false);
    if (!activeId && list.length > 0) {
      setActiveId(list[0].id);
      setDraft(fromTemplate(list[0]));
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync draft when active selection changes (only when the user picks a row).
  useEffect(() => {
    if (!activeId) {
      setDraft(null);
      return;
    }
    const row = rows.find((r) => r.id === activeId);
    if (row) setDraft(fromTemplate(row));
  }, [activeId, rows]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q) ||
        r.regulator.toLowerCase().includes(q)
    );
  }, [rows, searchQuery]);

  const dirty = useMemo(() => {
    if (!draft || !draft.id) return draft !== null;
    const original = rows.find((r) => r.id === draft.id);
    return original ? JSON.stringify(fromTemplate(original)) !== JSON.stringify(draft) : true;
  }, [draft, rows]);

  const startCreate = () => {
    setDraft({ ...EMPTY_DRAFT, riskControls: [], leverageRules: EMPTY_LEVERAGE.slice() });
    setActiveId(null);
    setTab("regulatory");
  };

  const save = async () => {
    if (!draft || !draft.name.trim() || !draft.country.trim()) return;
    setSaving(true);
    try {
      if (draft.id) {
        await clmConfigService.templates.update(
          {
            id: draft.id,
            name: draft.name,
            country: draft.country,
            regulator: draft.regulator,
            version: draft.version,
            status: draft.status,
            policiesCount: draft.policiesCount,
            formsCount: draft.formsCount,
            agreementsCount: draft.agreementsCount,
            regulatoryRequirements: draft.regulatoryRequirements,
            amlRequirements: draft.amlRequirements,
            riskControls: draft.riskControls,
            leverageRules: draft.leverageRules,
            agreementRules: draft.agreementRules,
          },
          actor
        );
      } else {
        const created = await clmConfigService.templates.create(
          {
            name: draft.name,
            country: draft.country,
            regulator: draft.regulator,
            version: draft.version,
            status: draft.status,
            policiesCount: draft.policiesCount,
            formsCount: draft.formsCount,
            agreementsCount: draft.agreementsCount,
            regulatoryRequirements: draft.regulatoryRequirements,
            amlRequirements: draft.amlRequirements,
            riskControls: draft.riskControls,
            leverageRules: draft.leverageRules,
            agreementRules: draft.agreementRules,
          },
          actor
        );
        setActiveId(created.id);
      }
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const cloneActive = async () => {
    if (!draft) return;
    const next = await clmConfigService.templates.create(
      {
        name: `${draft.name} (Copy)`,
        country: draft.country,
        regulator: draft.regulator,
        version: "v1.0",
        status: "draft",
        policiesCount: draft.policiesCount,
        formsCount: draft.formsCount,
        agreementsCount: draft.agreementsCount,
        regulatoryRequirements: draft.regulatoryRequirements,
        amlRequirements: draft.amlRequirements,
        riskControls: draft.riskControls,
        leverageRules: draft.leverageRules,
        agreementRules: draft.agreementRules,
      },
      actor
    );
    await reload();
    setActiveId(next.id);
  };

  const toggleStatus = async () => {
    if (!draft?.id) return;
    const next: ConfigStatus = draft.status === "active" ? "draft" : "active";
    await clmConfigService.templates.setStatus(draft.id, next, actor);
    await reload();
  };

  const archive = async () => {
    if (!draft?.id) return;
    if (!confirm("Archive this template? It will stop applying to new onboardings.")) return;
    await clmConfigService.templates.setStatus(draft.id, "retired", actor);
    await reload();
  };

  const remove = async () => {
    if (!draft?.id) return;
    if (!confirm("Delete this template? Bound policies/forms/agreements are not removed.")) return;
    await clmConfigService.templates.remove(draft.id, actor);
    setActiveId(null);
    setDraft(null);
    await reload();
  };

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "Compliance Templates" }]} />
      <PageHeader
        title="Compliance Templates"
        actions={
          <Button onClick={startCreate}>
            <Plus className="w-4 h-4" />
            New Template
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-3">
        {/* Left rail — template list */}
        <Card padding="none" className="overflow-hidden h-fit max-h-[80vh]">
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
            <input
              type="text"
              placeholder="Search regulators…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-7 px-2 rounded-md border border-slate-200 bg-white text-xs"
            />
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {loading && (
              <p className="px-3 py-6 text-xs text-slate-400 text-center">Loading…</p>
            )}
            {!loading && filteredRows.length === 0 && (
              <p className="px-3 py-6 text-xs text-slate-400 text-center">No templates</p>
            )}
            {filteredRows.map((t) => {
              const isActive = activeId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-slate-50 transition-colors ${
                    isActive ? "bg-blue-50/60" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <LayoutTemplate className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <p className="text-xs font-semibold text-slate-900 truncate flex-1">
                      {t.name}
                    </p>
                    <span className={`text-[9px] font-medium px-1 py-0.5 rounded ${STATUS_TONES[t.status]}`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 inline-flex items-center gap-2 font-mono tabular-nums">
                    <Globe className="w-2.5 h-2.5" /> {t.country}
                    <Shield className="w-2.5 h-2.5" /> {t.regulator}
                    <span className="text-blue-600">{t.version}</span>
                  </p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Right pane — header + tabbed editor */}
        {!draft ? (
          <Card padding="md">
            <div className="py-12 text-center text-sm text-slate-400">
              {rows.length === 0
                ? "No templates yet — click 'New Template' to start"
                : "Pick a template from the left"}
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Header card */}
            <Card padding="md">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                <Field label="Name" required>
                  <TextInput
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="e.g. CySEC - EU Standard"
                  />
                </Field>
                <Field label="Country" required>
                  <TextInput
                    value={draft.country}
                    onChange={(e) => setDraft({ ...draft, country: e.target.value })}
                    placeholder="ISO code"
                  />
                </Field>
                <Field label="Regulator" required>
                  <TextInput
                    value={draft.regulator}
                    onChange={(e) => setDraft({ ...draft, regulator: e.target.value })}
                    placeholder="BAPPEBTI / SCA / SBV…"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Version">
                    <TextInput
                      value={draft.version}
                      onChange={(e) => setDraft({ ...draft, version: e.target.value })}
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
              </div>

              {/* Headline counts */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
                <div className="p-2 bg-slate-50 rounded-md text-center">
                  <p className="text-lg font-bold text-slate-900 tabular-nums">{draft.policiesCount}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Policies</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-md text-center">
                  <p className="text-lg font-bold text-slate-900 tabular-nums">{draft.formsCount}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Forms</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-md text-center">
                  <p className="text-lg font-bold text-slate-900 tabular-nums">{draft.agreementsCount}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Agreements</p>
                </div>
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {draft.id && (
                    <button
                      onClick={remove}
                      className="text-xs text-red-600 hover:underline inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {draft.id && (
                    <>
                      <Button variant="secondary" size="sm" onClick={cloneActive}>
                        <Copy className="w-3 h-3" />
                        Clone
                      </Button>
                      <Button variant="secondary" size="sm" onClick={archive}>
                        <Archive className="w-3 h-3" />
                        Archive
                      </Button>
                      <Button variant="secondary" size="sm" onClick={toggleStatus}>
                        <Power className="w-3 h-3" />
                        {draft.status === "active" ? "Disable" : "Activate"}
                      </Button>
                    </>
                  )}
                  <Button size="sm" onClick={save} disabled={!dirty || saving}>
                    <Save className="w-3 h-3" />
                    {saving ? "Saving…" : draft.id ? (dirty ? "Save changes" : "Saved") : "Create"}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Tabs */}
            <Card padding="none">
              <div className="flex border-b border-slate-100">
                {(Object.entries(TAB_META) as [TabKey, (typeof TAB_META)[TabKey]][]).map(([key, meta]) => {
                  const Icon = meta.icon;
                  const isActive = tab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className={`px-4 py-2.5 text-xs font-medium inline-flex items-center gap-1.5 border-b-2 transition-colors ${
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
                {tab === "regulatory" && (
                  <RegulatoryTab
                    value={draft.regulatoryRequirements}
                    onChange={(v) => setDraft({ ...draft, regulatoryRequirements: v })}
                  />
                )}
                {tab === "aml" && (
                  <AMLTab
                    value={draft.amlRequirements}
                    onChange={(v) => setDraft({ ...draft, amlRequirements: v })}
                  />
                )}
                {tab === "risk" && (
                  <RiskTab
                    value={draft.riskControls}
                    onChange={(v) => setDraft({ ...draft, riskControls: v })}
                  />
                )}
                {tab === "leverage" && (
                  <LeverageTab
                    value={draft.leverageRules}
                    onChange={(v) => setDraft({ ...draft, leverageRules: v })}
                  />
                )}
                {tab === "agreements" && (
                  <AgreementRulesTab
                    value={draft.agreementRules}
                    onChange={(v) => setDraft({ ...draft, agreementRules: v })}
                  />
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Tab bodies                                                                */
/* ------------------------------------------------------------------------- */

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-50 last:border-0 cursor-pointer">
      <span className="text-sm text-slate-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-slate-200"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-[3px]"
          }`}
        />
      </button>
    </label>
  );
}

function RegulatoryTab({
  value,
  onChange,
}: {
  value: RegulatoryRequirements;
  onChange: (v: RegulatoryRequirements) => void;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">
        Mandatory steps the regulator requires every onboarding to complete.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        {(Object.keys(REG_FIELD_LABELS) as (keyof RegulatoryRequirements)[]).map((k) => (
          <ToggleRow
            key={k}
            label={REG_FIELD_LABELS[k]}
            checked={value[k]}
            onChange={(v) => onChange({ ...value, [k]: v })}
          />
        ))}
      </div>
    </div>
  );
}

function AMLTab({
  value,
  onChange,
}: {
  value: AMLRequirements;
  onChange: (v: AMLRequirements) => void;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">
        Enable the AML scans the regulator demands. Disabled controls remain available manually but won't run automatically.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        {(Object.keys(AML_FIELD_LABELS) as (keyof AMLRequirements)[]).map((k) => (
          <ToggleRow
            key={k}
            label={AML_FIELD_LABELS[k]}
            checked={value[k]}
            onChange={(v) => onChange({ ...value, [k]: v })}
          />
        ))}
      </div>
    </div>
  );
}

function RiskTab({
  value,
  onChange,
}: {
  value: RiskControlRule[];
  onChange: (v: RiskControlRule[]) => void;
}) {
  const add = () => {
    onChange([
      ...value,
      {
        id: `rc-${Date.now()}`,
        label: "New risk control",
        rule: "IF condition THEN action",
        enabled: true,
      },
    ]);
  };
  const update = (idx: number, patch: Partial<RiskControlRule>) =>
    onChange(value.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-500">
          Jurisdiction-level risk overrides. Each entry is `IF … THEN …`.
        </p>
        <Button variant="secondary" size="sm" onClick={add}>
          <Plus className="w-3 h-3" />
          Add control
        </Button>
      </div>
      <div className="space-y-2">
        {value.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">No controls yet</p>
        )}
        {value.map((r, idx) => (
          <div key={r.id} className="p-3 bg-slate-50 rounded-md space-y-2">
            <div className="flex items-center gap-2">
              <input
                className="h-7 px-2 rounded border border-slate-200 bg-white text-xs flex-1 font-medium"
                value={r.label}
                onChange={(e) => update(idx, { label: e.target.value })}
                placeholder="Label"
              />
              <label className="inline-flex items-center gap-1 text-xs text-slate-600 shrink-0">
                <input
                  type="checkbox"
                  checked={r.enabled}
                  onChange={(e) => update(idx, { enabled: e.target.checked })}
                />
                Enabled
              </label>
              <button
                onClick={() => remove(idx)}
                className="p-1 text-red-500 hover:bg-red-100 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              className="h-7 px-2 rounded border border-slate-200 bg-white text-xs w-full font-mono"
              value={r.rule}
              onChange={(e) => update(idx, { rule: e.target.value })}
              placeholder="IF country IN high_risk_list THEN force_edd = true"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function LeverageTab({
  value,
  onChange,
}: {
  value: LeverageRule[];
  onChange: (v: LeverageRule[]) => void;
}) {
  const ensureAccountType = (type: LeverageRule["accountType"]) => {
    if (value.some((r) => r.accountType === type)) return;
    onChange([...value, { accountType: type, maxLeverage: 30 }]);
  };

  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">
        Maximum leverage per account class. Enter the second number of the
        ratio (e.g. <code>30</code> for 1:30).
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {ACCOUNT_TYPES.map((type) => {
          const existing = value.find((r) => r.accountType === type);
          if (!existing) {
            return (
              <button
                key={type}
                onClick={() => ensureAccountType(type)}
                className="p-2.5 border border-dashed border-slate-200 rounded-md text-xs text-slate-400 hover:border-slate-400 hover:text-slate-700 transition-colors"
              >
                + Set leverage cap for {type}
              </button>
            );
          }
          return (
            <div key={type} className="p-2.5 bg-slate-50 rounded-md">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-700 w-28">{type}</span>
                <span className="text-xs text-slate-500 font-mono">1 :</span>
                <input
                  type="number"
                  className="h-7 px-2 rounded border border-slate-200 bg-white text-xs w-20 font-mono tabular-nums"
                  value={existing.maxLeverage}
                  onChange={(e) =>
                    onChange(
                      value.map((r) =>
                        r.accountType === type
                          ? { ...r, maxLeverage: Number(e.target.value) || 0 }
                          : r
                      )
                    )
                  }
                />
                <button
                  onClick={() =>
                    onChange(value.filter((r) => r.accountType !== type))
                  }
                  className="ml-auto p-1 text-red-500 hover:bg-red-100 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgreementRulesTab({
  value,
  onChange,
}: {
  value: TemplateAgreementRules;
  onChange: (v: TemplateAgreementRules) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Defaults applied to every agreement bound to this template. Individual
        agreements can override these in the Agreements page.
      </p>
      <ToggleRow
        label="Force re-sign on agreement update"
        checked={value.forceResign}
        onChange={(v) => onChange({ ...value, forceResign: v })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Re-sign interval (months)" hint="0 = never">
          <TextInput
            type="number"
            value={value.resignIntervalMonths}
            onChange={(e) =>
              onChange({ ...value, resignIntervalMonths: Number(e.target.value) || 0 })
            }
          />
        </Field>
        <Field label="Mandatory language" hint="Source-of-truth ISO code">
          <TextInput
            value={value.mandatoryLanguage}
            onChange={(e) => onChange({ ...value, mandatoryLanguage: e.target.value })}
            placeholder="en"
          />
        </Field>
      </div>
      {value.forceResign && (
        <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-md text-xs text-amber-700">
          <Sparkles className="w-3.5 h-3.5" />
          With force re-sign on, all bound agreements push a re-sign banner to matched users on next login.
        </div>
      )}
    </div>
  );
}
