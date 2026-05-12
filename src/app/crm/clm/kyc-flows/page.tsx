"use client";

/**
 * KYC Flows — PRD v2.0 §1.
 *
 * The "Flow" is the central onboarding object: pick which of the five
 * modules apply (Identity is required; the rest are toggles), bind any
 * agreements that must be signed, then route users into it via the
 * Routing & Workflow Rules page.
 *
 * Layout: list of flow cards on the page; clicking Edit opens a single
 * drawer with the full module configuration. The drawer is deliberately
 * narrow — this is what the simplification PRD asked for.
 */

import { useEffect, useState } from "react";
import {
  Plus,
  IdCard,
  ScanFace,
  MapPin,
  Wallet,
  ClipboardList,
  FileSignature,
  Camera,
  Phone,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import {
  ConfigDrawer,
  Field,
  TextArea,
  TextInput,
  Select,
} from "@/components/crm/clm/config/ConfigDrawer";
import { clmConfigService, clmFlowService } from "@/lib/clm/services";
import { useCurrentStaffName } from "@/hooks/useCurrentStaff";
import type {
  ConfigAgreement,
  ConfigStatus,
  KYCFlow,
  KYCFlowAgreementModule,
  KYCFlowContactModule,
  KYCFlowIdentityModule,
  KYCFlowQuestionnaireModule,
  KYCFlowSimpleModule,
} from "@/types/clm";

const STATUS_TONES: Record<ConfigStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  draft: "bg-slate-100 text-slate-600",
  retired: "bg-slate-100 text-slate-400",
};

function contactSummary(c: KYCFlowContactModule): string {
  if (!c.enabled) return "Contact";
  const parts: string[] = [];
  if (c.requireMobileOtp) parts.push("Mobile");
  if (c.requireEmailOtp)  parts.push("Email");
  return parts.length === 0 ? "Contact" : `Contact OTP (${parts.join(" + ")})`;
}

interface DraftFlow {
  name: string;
  description: string;
  status: ConfigStatus;
  contact: KYCFlowContactModule;
  identity: KYCFlowIdentityModule;
  proofOfAddress: KYCFlowSimpleModule;
  incomeProof: KYCFlowSimpleModule;
  questionnaire: KYCFlowQuestionnaireModule;
  agreement: KYCFlowAgreementModule;
}

const EMPTY_DRAFT: DraftFlow = {
  name: "",
  description: "",
  status: "draft",
  contact: { enabled: true, requireMobileOtp: true, requireEmailOtp: true },
  identity: {
    documentVerification: true,
    liveness: true,
    selfie: true,
    forceCameraOnly: false,
  },
  proofOfAddress: { enabled: false },
  incomeProof: { enabled: false },
  questionnaire: { enabled: false },
  agreement: { enabled: true, agreementIds: [] },
};

export default function KycFlowsPage() {
  const actor = useCurrentStaffName();
  const [rows, setRows] = useState<KYCFlow[]>([]);
  const [agreements, setAgreements] = useState<ConfigAgreement[]>([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftFlow>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    const [flowList, agreementList] = await Promise.all([
      clmFlowService.flows.list(),
      clmConfigService.agreements.list(),
    ]);
    setRows(flowList);
    setAgreements(agreementList);
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
  const openEdit = (f: KYCFlow) => {
    setEditingId(f.id);
    setDraft({
      name: f.name,
      description: f.description ?? "",
      status: f.status,
      contact: { ...f.contact },
      identity: { ...f.identity },
      proofOfAddress: { ...f.proofOfAddress },
      incomeProof: { ...f.incomeProof },
      questionnaire: { ...f.questionnaire },
      agreement: { ...f.agreement, agreementIds: [...f.agreement.agreementIds] },
    });
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await clmFlowService.flows.update(editingId, draft, actor);
      } else {
        await clmFlowService.flows.create(draft, actor);
      }
      setDrawerOpen(false);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this flow? Routing rules pointing at it will need re-targeting.")) return;
    await clmFlowService.flows.remove(id);
    setDrawerOpen(false);
    await reload();
  };

  const toggleStatus = async (f: KYCFlow) => {
    const next: ConfigStatus = f.status === "active" ? "draft" : "active";
    await clmFlowService.flows.setStatus(f.id, next, actor);
    await reload();
  };

  const enabledModules = (f: KYCFlow) =>
    [
      {
        key: "contact",
        label: contactSummary(f.contact),
        on: f.contact.enabled && (f.contact.requireMobileOtp || f.contact.requireEmailOtp),
        icon: Phone,
      },
      { key: "identity", label: "Identity", on: true, icon: IdCard },
      { key: "liveness", label: "Liveness", on: f.identity.liveness, icon: ScanFace },
      { key: "poa", label: "POA", on: f.proofOfAddress.enabled, icon: MapPin },
      { key: "income", label: "Income", on: f.incomeProof.enabled, icon: Wallet },
      { key: "questionnaire", label: "Questionnaire", on: f.questionnaire.enabled, icon: ClipboardList },
      { key: "agreement", label: `Agreements${f.agreement.enabled ? ` (${f.agreement.agreementIds.length})` : ""}`, on: f.agreement.enabled, icon: FileSignature },
    ];

  return (
    <div className="space-y-3">
      <Breadcrumb
        items={[
          { label: "CLM Center" },
          { label: "Configuration" },
          { label: "KYC Flows" },
        ]}
      />
      <PageHeader
        title="KYC Flows"
        actions={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            New Flow
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {loading && (
          <div className="col-span-full text-sm text-slate-400 py-8 text-center">
            Loading flows…
          </div>
        )}
        {!loading && rows.length === 0 && (
          <div className="col-span-full text-sm text-slate-400 py-8 text-center">
            No flows yet — click "New Flow".
          </div>
        )}
        {rows.map((f) => (
          <Card key={f.id} padding="md">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 truncate">{f.name}</h3>
                <p className="text-[11px] text-slate-400 font-mono">{f.id}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_TONES[f.status]}`}>
                {f.status}
              </span>
            </div>
            {f.description && (
              <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                {f.description}
              </p>
            )}

            {/* Module chips */}
            <div className="flex items-center flex-wrap gap-1.5 mt-3">
              {enabledModules(f).map((m) => {
                const Icon = m.icon;
                return (
                  <span
                    key={m.key}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      m.on
                        ? "bg-blue-50 text-blue-700"
                        : "bg-slate-50 text-slate-400 line-through"
                    }`}
                    title={m.on ? "Enabled" : "Disabled"}
                  >
                    <Icon className="w-3 h-3" />
                    {m.label}
                  </span>
                );
              })}
              {f.identity.forceCameraOnly && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">
                  <Camera className="w-3 h-3" />
                  Force camera
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-1.5 mt-3 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => toggleStatus(f)}>
                {f.status === "active" ? "Disable" : "Activate"}
              </Button>
              <Button size="sm" onClick={() => openEdit(f)}>
                Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Drawer — flow editor */}
      <ConfigDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={save}
        title={editingId ? "Edit Flow" : "New Flow"}
        subtitle={editingId ? `Editing ${editingId}` : "Configure the five onboarding modules"}
        saving={saving}
        saveDisabled={!draft.name.trim()}
        width={520}
        destructive={
          editingId ? { label: "Delete flow", onClick: () => remove(editingId) } : undefined
        }
      >
        <Field label="Name" required>
          <TextInput
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. EU Retail (CySEC)"
          />
        </Field>
        <Field label="Description">
          <TextArea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={2}
            placeholder="When this flow applies and why"
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

        {/* A. Contact (phone / email OTP) */}
        <ModuleSection
          icon={Phone}
          title="Contact Verification"
        >
          <Toggle
            label="Enable contact verification"
            description="Configures which OTP channels are required at the start of onboarding. Runtime skips channels the user has already verified."
            checked={draft.contact.enabled}
            onChange={(v) =>
              setDraft({ ...draft, contact: { ...draft.contact, enabled: v } })
            }
          />
          {draft.contact.enabled && (
            <>
              <Toggle
                label="Require mobile OTP"
                checked={draft.contact.requireMobileOtp}
                onChange={(v) =>
                  setDraft({ ...draft, contact: { ...draft.contact, requireMobileOtp: v } })
                }
                indent
              />
              <Toggle
                label="Require email OTP"
                checked={draft.contact.requireEmailOtp}
                onChange={(v) =>
                  setDraft({ ...draft, contact: { ...draft.contact, requireEmailOtp: v } })
                }
                indent
              />
            </>
          )}
        </ModuleSection>

        {/* B. Identity */}
        <ModuleSection
          icon={IdCard}
          title="Identity Verification"
          forced
          forcedNote="Required by default — document verification can't be turned off."
        >
          <Toggle
            label="Liveness check"
            checked={draft.identity.liveness}
            onChange={(v) =>
              setDraft({ ...draft, identity: { ...draft.identity, liveness: v } })
            }
          />
          <Toggle
            label="Selfie photo"
            checked={draft.identity.selfie}
            onChange={(v) =>
              setDraft({ ...draft, identity: { ...draft.identity, selfie: v } })
            }
          />
          {draft.identity.selfie && (
            <Toggle
              label="Force camera only"
              description="Disallow uploading from album — must use the live camera."
              checked={draft.identity.forceCameraOnly}
              onChange={(v) =>
                setDraft({
                  ...draft,
                  identity: { ...draft.identity, forceCameraOnly: v },
                })
              }
              indent
            />
          )}
        </ModuleSection>

        {/* B. POA */}
        <ModuleSection icon={MapPin} title="Proof of Address">
          <Toggle
            label="Enable proof of address"
            checked={draft.proofOfAddress.enabled}
            onChange={(v) => setDraft({ ...draft, proofOfAddress: { enabled: v } })}
          />
        </ModuleSection>

        {/* C. Income */}
        <ModuleSection icon={Wallet} title="Income Proof">
          <Toggle
            label="Require income / source-of-wealth proof"
            checked={draft.incomeProof.enabled}
            onChange={(v) => setDraft({ ...draft, incomeProof: { enabled: v } })}
          />
        </ModuleSection>

        {/* D. Questionnaire */}
        <ModuleSection icon={ClipboardList} title="Questionnaire">
          <Toggle
            label="Require a suitability questionnaire"
            checked={draft.questionnaire.enabled}
            onChange={(v) =>
              setDraft({
                ...draft,
                questionnaire: { ...draft.questionnaire, enabled: v },
              })
            }
          />
        </ModuleSection>

        {/* E. Agreement Signing */}
        <ModuleSection icon={FileSignature} title="Agreement Signing">
          <Toggle
            label="Require agreement signing"
            checked={draft.agreement.enabled}
            onChange={(v) =>
              setDraft({
                ...draft,
                agreement: { ...draft.agreement, enabled: v },
              })
            }
          />
          {draft.agreement.enabled && (
            <div className="pt-1.5">
              <p className="text-[11px] text-slate-500 mb-1.5">
                Agreements to sign (from Agreement Documents)
              </p>
              <div className="space-y-1.5">
                {agreements.length === 0 && (
                  <p className="text-[11px] text-slate-400 italic">
                    No agreements yet — create one in Agreement Documents.
                  </p>
                )}
                {agreements.map((a) => {
                  const checked = draft.agreement.agreementIds.includes(a.id);
                  return (
                    <label
                      key={a.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-slate-50 cursor-pointer hover:bg-slate-100"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setDraft({
                            ...draft,
                            agreement: {
                              ...draft.agreement,
                              agreementIds: checked
                                ? draft.agreement.agreementIds.filter(
                                    (id) => id !== a.id
                                  )
                                : [...draft.agreement.agreementIds, a.id],
                            },
                          })
                        }
                      />
                      <span className="text-xs flex-1 text-slate-700">{a.name}</span>
                      <span className="text-[10px] font-mono text-blue-600">
                        {a.currentVersion}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </ModuleSection>
      </ConfigDrawer>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Drawer helpers                                                            */
/* ------------------------------------------------------------------------- */

function ModuleSection({
  icon: Icon,
  title,
  forced,
  forcedNote,
  children,
}: {
  icon: typeof IdCard;
  title: string;
  forced?: boolean;
  forcedNote?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pt-3 border-t border-slate-100">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 inline-flex items-center justify-center">
          <Icon className="w-3.5 h-3.5" />
        </span>
        <p className="text-xs font-semibold text-slate-900">{title}</p>
        {forced && (
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] uppercase tracking-wider font-bold">
            Required
          </span>
        )}
      </div>
      {forced && forcedNote && (
        <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">{forcedNote}</p>
      )}
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  indent,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  indent?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-2 cursor-pointer ${indent ? "pl-3 border-l-2 border-slate-100" : ""}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5"
      />
      <span className="min-w-0">
        <span className="block text-xs text-slate-700">{label}</span>
        {description && (
          <span className="block text-[10px] text-slate-400 mt-0.5">{description}</span>
        )}
      </span>
    </label>
  );
}
