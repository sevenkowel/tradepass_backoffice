"use client";

/**
 * System Modules — PRD v2.0 §4 / SystemModules改版 v1.1
 *
 * 五个可配置验证模块，所有编辑均通过右侧抽屉完成，页面本身只读：
 *   1. Identity Verification  — 文档类型设置抽屉 + 上传设置抽屉 + 国家政策抽屉
 *   2. Proof of Address
 *   3. Income Proof
 *   4. Liveness Check         — 含 TradePass / Onfido / Sumsub 供应商配置
 *   5. Questionnaire
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IdCard,
  ScanFace,
  MapPin,
  Wallet,
  ClipboardList,
  Plus,
  Trash2,
  Pencil,
  Settings2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import {
  ConfigDrawer,
  Field,
  Select,
  TextInput,
} from "@/components/crm/clm/config/ConfigDrawer";
import { clmFlowService } from "@/lib/clm/services";
import { useCurrentStaffName } from "@/hooks/useCurrentStaff";
import { useToastStore } from "@/store/crm";
import type {
  DocumentTypeKind,
  DocumentTypeDefaults,
  DocumentTypeExpiryRule,
  DocumentTypePolicy,
  DocumentUploadConfig,
  IdentityModuleConfig,
  LivenessProvider,
  LivenessProviderConfig,
  LivenessModuleConfig,
  POAModuleConfig,
  POADocumentKind,
  IncomeProofModuleConfig,
  IncomeDocumentKind,
  QuestionnaireModuleConfig,
  QuestionnaireField,
  QuestionFieldType,
} from "@/types/clm";

/* ─────────────────────────────────────────────────────────────────────────── */
/* 常量                                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

const DOC_TYPE_ORDER: DocumentTypeKind[] = [
  "national_id",
  "passport",
  "drivers_license",
];
const DOC_TYPE_LABELS: Record<DocumentTypeKind, string> = {
  national_id: "National ID",
  passport: "Passport",
  drivers_license: "Driver's License",
};

const POA_DOC_LABELS: Record<POADocumentKind, string> = {
  utility_bill: "Utility Bill",
  bank_statement: "Bank Statement",
  government_letter: "Government Letter",
  tenancy_agreement: "Tenancy Agreement",
  tax_document: "Tax Document",
};
const ALL_POA_DOCS = Object.keys(POA_DOC_LABELS) as POADocumentKind[];

const INCOME_DOC_LABELS: Record<IncomeDocumentKind, string> = {
  payslip: "Payslip",
  tax_return: "Tax Return",
  bank_statement: "Bank Statement",
  audited_accounts: "Audited Accounts",
  employer_letter: "Employer Letter",
};
const ALL_INCOME_DOCS = Object.keys(INCOME_DOC_LABELS) as IncomeDocumentKind[];

const QUESTION_FIELD_TYPES: { label: string; value: QuestionFieldType }[] = [
  { label: "Text", value: "text" },
  { label: "Select", value: "select" },
  { label: "Multi-select", value: "multiselect" },
  { label: "Yes / No", value: "boolean" },
  { label: "Number", value: "number" },
  { label: "Date", value: "date" },
];

const LIVENESS_PROVIDERS: { label: string; value: LivenessProvider }[] = [
  { label: "TradePass (Self-hosted)", value: "tradepass" },
  { label: "Onfido", value: "onfido" },
  { label: "Sumsub", value: "sumsub" },
];

const PROVIDER_SDK_LINKS: Record<Exclude<LivenessProvider, "tradepass">, string> = {
  onfido: "https://documentation.onfido.com/",
  sumsub: "https://developers.sumsub.com/",
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* 工具函数                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

function countryName(code: string): string {
  if (code === "Global") return "Global (Default)";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function fmtList(items: string[], max = 3): string {
  if (items.length === 0) return "—";
  const shown = items.slice(0, max);
  const rest = items.length - max;
  return rest > 0 ? `${shown.join(", ")} +${rest}` : shown.join(", ");
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* 通用多选 checkbox 组                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

function CheckboxGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T[];
  onChange: (next: T[]) => void;
}) {
  const toggle = (v: T) => {
    onChange(
      value.includes(v) ? value.filter((x) => x !== v) : [...value, v]
    );
  };
  return (
    <div className="space-y-2 mt-1">
      {options.map((o) => (
        <label key={o.value} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.includes(o.value)}
            onChange={() => toggle(o.value)}
            className="rounded"
          />
          <span className="text-sm text-slate-700">{o.label}</span>
        </label>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* ① 文档类型设置抽屉                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

function DocTypeSettingsDrawer({
  open,
  defaults,
  expiryRules,
  onSave,
  onClose,
}: {
  open: boolean;
  defaults: DocumentTypeDefaults[];
  expiryRules: DocumentTypeExpiryRule[];
  onSave: (d: DocumentTypeDefaults[], r: DocumentTypeExpiryRule[]) => Promise<void>;
  onClose: () => void;
}) {
  const [draftDefaults, setDraftDefaults] = useState<DocumentTypeDefaults[]>([]);
  const [draftExpiry, setDraftExpiry] = useState<DocumentTypeExpiryRule[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraftDefaults(defaults.map((d) => ({ ...d })));
    setDraftExpiry(expiryRules.map((r) => ({ ...r })));
  }, [open, defaults, expiryRules]);

  const dirty = useMemo(() => {
    return (
      JSON.stringify(draftDefaults) !== JSON.stringify(defaults) ||
      JSON.stringify(draftExpiry) !== JSON.stringify(expiryRules)
    );
  }, [draftDefaults, draftExpiry, defaults, expiryRules]);

  const updateDefault = (kind: DocumentTypeKind, patch: Partial<DocumentTypeDefaults>) =>
    setDraftDefaults((prev) =>
      prev.map((d) => (d.kind === kind ? { ...d, ...patch } : d))
    );

  const updateExpiry = (kind: DocumentTypeKind, patch: Partial<DocumentTypeExpiryRule>) =>
    setDraftExpiry((prev) =>
      prev.map((r) => (r.kind === kind ? { ...r, ...patch } : r))
    );

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draftDefaults, draftExpiry);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ConfigDrawer
      open={open}
      title="Document Type Settings"
      subtitle="Configure front/back capture and expiry-check rules per document type."
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      dirty={dirty}
      width={520}
    >
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left py-2 px-3 font-medium">Document Type</th>
              <th className="text-center py-2 px-3 font-medium">Back Side</th>
              <th className="text-center py-2 px-3 font-medium">Back Required</th>
              <th className="text-center py-2 px-3 font-medium">Expiry Check</th>
              <th className="text-center py-2 px-3 font-medium">Reject Within (mo)</th>
            </tr>
          </thead>
          <tbody>
            {DOC_TYPE_ORDER.map((kind) => {
              const def = draftDefaults.find((d) => d.kind === kind) ?? {
                kind,
                backSideEnabled: false,
                backSideRequired: false,
              };
              const rule = draftExpiry.find((r) => r.kind === kind) ?? {
                kind,
                checkEnabled: false,
                rejectIfExpiringWithinMonths: 0,
              };
              return (
                <tr key={kind} className="border-t border-slate-100">
                  <td className="py-2.5 px-3 font-medium text-slate-700">
                    {DOC_TYPE_LABELS[kind]}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={def.backSideEnabled}
                      onChange={(e) =>
                        updateDefault(kind, {
                          backSideEnabled: e.target.checked,
                          backSideRequired: e.target.checked ? def.backSideRequired : false,
                        })
                      }
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={def.backSideRequired}
                      disabled={!def.backSideEnabled}
                      onChange={(e) =>
                        updateDefault(kind, { backSideRequired: e.target.checked })
                      }
                      className="disabled:opacity-30"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={rule.checkEnabled}
                      onChange={(e) =>
                        updateExpiry(kind, { checkEnabled: e.target.checked })
                      }
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min={0}
                      max={60}
                      className="w-16 h-7 px-2 rounded border border-slate-200 bg-white text-xs text-center disabled:opacity-30"
                      value={rule.rejectIfExpiringWithinMonths}
                      disabled={!rule.checkEnabled}
                      onChange={(e) =>
                        updateExpiry(kind, {
                          rejectIfExpiringWithinMonths: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ConfigDrawer>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* ② 上传设置抽屉                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

function UploadSettingsDrawer({
  open,
  config,
  onSave,
  onClose,
}: {
  open: boolean;
  config: DocumentUploadConfig;
  onSave: (c: DocumentUploadConfig) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<DocumentUploadConfig>({ ...config });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({ ...config });
  }, [open, config]);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(config),
    [draft, config]
  );

  const toggleFmt = (f: "jpg" | "png" | "pdf") => {
    const next = draft.acceptedFormats.includes(f)
      ? draft.acceptedFormats.filter((x) => x !== f)
      : [...draft.acceptedFormats, f];
    setDraft((p) => ({ ...p, acceptedFormats: next }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ConfigDrawer
      open={open}
      title="Upload Settings"
      subtitle="File format limits and retry policy for document uploads."
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      dirty={dirty}
    >
      {/* File formats */}
      <Field label="Accepted file formats">
        <div className="flex gap-4 mt-1">
          {(["jpg", "png", "pdf"] as const).map((f) => (
            <label key={f} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.acceptedFormats.includes(f)}
                onChange={() => toggleFmt(f)}
                className="rounded"
              />
              <span className="text-sm text-slate-700 uppercase">{f}</span>
            </label>
          ))}
        </div>
      </Field>

      {/* Max file size */}
      <Field label="Max file size (MB)">
        <TextInput
          type="number"
          min={1}
          max={50}
          value={draft.maxFileSizeMb}
          onChange={(e) =>
            setDraft((p) => ({ ...p, maxFileSizeMb: Number(e.target.value) || 1 }))
          }
        />
      </Field>

      {/* Per-user total */}
      <Field
        label="Max uploads per user"
        hint="Cumulative cap. Once exceeded the account is locked pending manual review."
      >
        <TextInput
          type="number"
          min={1}
          max={100}
          value={draft.maxRetryAttemptsPerUser}
          onChange={(e) =>
            setDraft((p) => ({
              ...p,
              maxRetryAttemptsPerUser: Math.max(1, Number(e.target.value) || 1),
            }))
          }
        />
      </Field>

      {/* Sliding window limit */}
      <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50/40">
        <p className="text-xs font-semibold text-slate-700">Window-based limit</p>
        <Field
          label="Window (hours)"
          hint="Rolling window — defaults to 24 hours."
        >
          <TextInput
            type="number"
            min={1}
            max={168}
            value={draft.retryWindowHours}
            onChange={(e) =>
              setDraft((p) => ({
                ...p,
                retryWindowHours: Math.max(1, Number(e.target.value) || 1),
              }))
            }
          />
        </Field>
        <Field
          label={`Max attempts within ${draft.retryWindowHours}h`}
          hint="Exceeding this number inside the window temporarily locks the user."
        >
          <TextInput
            type="number"
            min={1}
            max={50}
            value={draft.maxRetryAttemptsPerWindow}
            onChange={(e) =>
              setDraft((p) => ({
                ...p,
                maxRetryAttemptsPerWindow: Math.max(1, Number(e.target.value) || 1),
              }))
            }
          />
        </Field>
      </div>

      {/* Duplicate document number detection */}
      <Field label="Duplicate document number check" hint="Warn when the same document number is already bound to another account.">
        <label className="flex items-center gap-2 cursor-pointer mt-1">
          <input
            type="checkbox"
            checked={draft.duplicateDocumentNumberCheck}
            onChange={(e) =>
              setDraft((p) => ({
                ...p,
                duplicateDocumentNumberCheck: e.target.checked,
              }))
            }
            className="rounded"
          />
          <span className="text-sm text-slate-700">Enabled</span>
        </label>
      </Field>
    </ConfigDrawer>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* ③ 国家政策抽屉                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

interface PolicyDraft {
  country: string;
  allowedTypes: DocumentTypeKind[];
  backSideOverrides: Partial<Record<DocumentTypeKind, boolean>>;
}

function policyToDraft(p: DocumentTypePolicy): PolicyDraft {
  return {
    country: p.country,
    allowedTypes: [...p.allowedTypes],
    backSideOverrides: { ...(p.backSideOverrides ?? {}) },
  };
}

const COUNTRY_OPTIONS: { code: string; name: string; flag: string }[] = [
  { code: "Global", name: "Global (Fallback)", flag: "🌐" },
  { code: "VN", name: "Vietnam",        flag: "🇻🇳" },
  { code: "TH", name: "Thailand",       flag: "🇹🇭" },
  { code: "ID", name: "Indonesia",      flag: "🇮🇩" },
  { code: "MY", name: "Malaysia",       flag: "🇲🇾" },
  { code: "PH", name: "Philippines",    flag: "🇵🇭" },
  { code: "SG", name: "Singapore",      flag: "🇸🇬" },
  { code: "JP", name: "Japan",          flag: "🇯🇵" },
  { code: "KR", name: "South Korea",    flag: "🇰🇷" },
  { code: "CN", name: "China",          flag: "🇨🇳" },
  { code: "IN", name: "India",          flag: "🇮🇳" },
  { code: "US", name: "United States",  flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "DE", name: "Germany",        flag: "🇩🇪" },
  { code: "FR", name: "France",         flag: "🇫🇷" },
  { code: "AU", name: "Australia",      flag: "🇦🇺" },
  { code: "AE", name: "UAE",            flag: "🇦🇪" },
];

function countryMeta(code: string): { name: string; flag: string } {
  const hit = COUNTRY_OPTIONS.find((c) => c.code === code.toUpperCase() || c.code === code);
  if (hit) return { name: hit.name, flag: hit.flag };
  if (code && code.length === 2 && /^[A-Z]{2}$/.test(code.toUpperCase())) {
    const flag = code.toUpperCase().split("").map((c) =>
      String.fromCodePoint(127397 + c.charCodeAt(0))
    ).join("");
    return { name: code.toUpperCase(), flag };
  }
  return { name: code || "—", flag: "🏳" };
}

function CountryPolicyDrawer({
  open,
  draft,
  isNew,
  docTypeDefaults,
  existingCountries,
  onSave,
  onDelete,
  onClose,
}: {
  open: boolean;
  draft: PolicyDraft | null;
  isNew: boolean;
  docTypeDefaults: DocumentTypeDefaults[];
  existingCountries: string[];
  onSave: (d: PolicyDraft) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<PolicyDraft>({
    country: "",
    allowedTypes: ["passport"],
    backSideOverrides: {},
  });

  useEffect(() => {
    if (draft) setLocal(draft);
  }, [draft]);

  const dirty = useMemo(
    () => (draft ? JSON.stringify(local) !== JSON.stringify(draft) : false),
    [local, draft]
  );

  const toggleType = (t: DocumentTypeKind) => {
    setLocal((prev) => ({
      ...prev,
      allowedTypes: prev.allowedTypes.includes(t)
        ? prev.allowedTypes.filter((x) => x !== t)
        : [...prev.allowedTypes, t],
    }));
  };

  const isGlobal = local.country === "Global";
  const valid =
    local.country.trim().length > 0 &&
    local.allowedTypes.length > 0 &&
    /^(Global|[A-Z]{2})$/.test(local.country.trim());

  const taken = new Set(existingCountries.filter((c) => c !== draft?.country));
  const isDuplicate = taken.has(local.country);
  const meta = countryMeta(local.country);

  return (
    <ConfigDrawer
      open={open}
      title={isNew ? "Add Country Policy" : "Edit Country Policy"}
      subtitle={
        isGlobal
          ? "Default policy — applied when no other country rule matches."
          : "Restrict which ID documents are accepted from residents of this country."
      }
      onClose={onClose}
      onSave={() => onSave(local)}
      saveDisabled={!valid || isDuplicate}
      dirty={dirty}
      destructive={
        !isNew && !isGlobal
          ? { label: "Delete policy", onClick: onDelete }
          : undefined
      }
    >
      {/* Header preview card */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
        <span className="text-3xl leading-none" aria-hidden>{meta.flag}</span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{meta.name}</p>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
            {local.country || "—"}
            {isGlobal && <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[9px] font-bold uppercase tracking-wider">Default</span>}
          </p>
        </div>
      </div>

      {/* Country selector */}
      <Field label="Country" required hint="ISO 3166-1 alpha-2 code, or `Global` for the fallback policy.">
        {isGlobal && !isNew ? (
          <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
            Global default — country code cannot be changed.
          </div>
        ) : (
          <>
            <select
              value={COUNTRY_OPTIONS.some((c) => c.code === local.country) ? local.country : "__custom__"}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "__custom__") return;
                setLocal((p) => ({ ...p, country: v }));
              }}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            >
              <option value="">— Select country —</option>
              {COUNTRY_OPTIONS.filter((c) => isNew ? !taken.has(c.code) : true).map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.name} {c.code !== "Global" && `(${c.code})`}</option>
              ))}
              <option value="__custom__">+ Custom ISO code…</option>
            </select>
            {!COUNTRY_OPTIONS.some((c) => c.code === local.country) && local.country !== "" && (
              <input
                value={local.country}
                onChange={(e) =>
                  setLocal((p) => ({ ...p, country: e.target.value.toUpperCase() }))
                }
                placeholder="e.g. BR, SE, NG"
                maxLength={6}
                className="mt-2 w-full h-9 px-3 rounded-lg border border-slate-200 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            )}
            {isDuplicate && (
              <p className="text-[11px] text-red-600 mt-1.5 flex items-center gap-1">
                <span className="text-base leading-none">⚠</span>
                A policy for this country already exists.
              </p>
            )}
          </>
        )}
      </Field>

      {/* Allowed document types */}
      <Field label="Accepted Documents" required hint="Tick the document types residents may use to verify their identity.">
        <div className="grid grid-cols-1 gap-2">
          {DOC_TYPE_ORDER.map((t) => {
            const checked = local.allowedTypes.includes(t);
            const def = docTypeDefaults.find((d) => d.kind === t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleType(t)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                  checked
                    ? "border-blue-300 bg-blue-50/60"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <span className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  checked ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"
                }`}>
                  {checked && (
                    <svg viewBox="0 0 12 12" className="w-3 h-3 text-white"><path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${checked ? "text-slate-900" : "text-slate-700"}`}>
                    {DOC_TYPE_LABELS[t]}
                  </p>
                  {def && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {def.backSideEnabled
                        ? `Back side: ${def.backSideRequired ? "required" : "optional"} (global default)`
                        : "No back side"}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {local.allowedTypes.length === 0 && (
          <p className="text-[11px] text-red-600 mt-1.5 flex items-center gap-1">
            <span className="text-base leading-none">⚠</span>
            Select at least one document type.
          </p>
        )}
      </Field>

      {/* Back-side overrides — only relevant for types where back side is enabled globally */}
      {local.allowedTypes.some((t) =>
        docTypeDefaults.find((d) => d.kind === t)?.backSideEnabled
      ) && (
        <Field
          label="Back-side Overrides"
          hint="Override the global back-side rule for this country. Omit to inherit the default."
        >
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/40 p-2">
            {local.allowedTypes
              .filter((t) => docTypeDefaults.find((d) => d.kind === t)?.backSideEnabled)
              .map((t) => {
                const ov = local.backSideOverrides[t];
                const value = ov === undefined ? "inherit" : ov ? "required" : "optional";
                return (
                  <div key={t} className="flex items-center justify-between gap-3 px-2 py-1.5 bg-white rounded-md border border-slate-100">
                    <span className="text-xs font-medium text-slate-700">{DOC_TYPE_LABELS[t]}</span>
                    <div className="inline-flex items-center bg-slate-100 rounded-md p-0.5">
                      {(["inherit", "required", "optional"] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setLocal((p) => {
                              const ovs = { ...p.backSideOverrides };
                              if (opt === "inherit") delete ovs[t];
                              else ovs[t] = opt === "required";
                              return { ...p, backSideOverrides: ovs };
                            });
                          }}
                          className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded transition-colors ${
                            value === opt
                              ? opt === "required"
                                ? "bg-red-600 text-white"
                                : opt === "optional"
                                ? "bg-emerald-600 text-white"
                                : "bg-white text-slate-700 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </Field>
      )}
    </ConfigDrawer>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* ④ POA 抽屉                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

function POADrawer({
  open,
  config,
  onSave,
  onClose,
}: {
  open: boolean;
  config: POAModuleConfig | null;
  onSave: (patch: Partial<POAModuleConfig>) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Partial<POAModuleConfig>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) setDraft({ ...config });
  }, [config, open]);

  const cur = { ...config, ...draft } as POAModuleConfig;

  const dirty = useMemo(
    () => (config ? JSON.stringify(cur) !== JSON.stringify(config) : false),
    [cur, config]
  );

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(draft); onClose(); } finally { setSaving(false); }
  };

  return (
    <ConfigDrawer
      open={open}
      title="Proof of Address (POA)"
      subtitle="Configure accepted document types and upload limits."
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      dirty={dirty}
      saveDisabled={!cur.acceptedDocuments?.length}
    >
      <Field label="Accepted document types" required>
        <CheckboxGroup
          options={ALL_POA_DOCS.map((d) => ({ label: POA_DOC_LABELS[d], value: d }))}
          value={cur.acceptedDocuments ?? []}
          onChange={(v) => setDraft((p) => ({ ...p, acceptedDocuments: v }))}
        />
      </Field>
      <Field label="Max document age (months)" hint="Document issue date must be within this many months.">
        <TextInput
          type="number" min={1} max={24}
          value={cur.maxAgeMonths ?? 3}
          onChange={(e) => setDraft((p) => ({ ...p, maxAgeMonths: Number(e.target.value) || 1 }))}
        />
      </Field>
      <Field label="Accepted file formats">
        <div className="flex gap-4 mt-1">
          {(["jpg", "png", "pdf"] as const).map((f) => (
            <label key={f} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={cur.acceptedFormats?.includes(f) ?? false}
                onChange={() => {
                  const next = cur.acceptedFormats?.includes(f)
                    ? cur.acceptedFormats.filter((x) => x !== f)
                    : [...(cur.acceptedFormats ?? []), f];
                  setDraft((p) => ({ ...p, acceptedFormats: next }));
                }}
                className="rounded"
              />
              <span className="text-sm uppercase">{f}</span>
            </label>
          ))}
        </div>
      </Field>
      <Field label="Max file size (MB)">
        <TextInput
          type="number" min={1} max={50}
          value={cur.maxFileSizeMb ?? 10}
          onChange={(e) => setDraft((p) => ({ ...p, maxFileSizeMb: Number(e.target.value) || 1 }))}
        />
      </Field>
    </ConfigDrawer>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* ⑤ 收入证明抽屉                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

function IncomeProofDrawer({
  open,
  config,
  onSave,
  onClose,
}: {
  open: boolean;
  config: IncomeProofModuleConfig | null;
  onSave: (patch: Partial<IncomeProofModuleConfig>) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Partial<IncomeProofModuleConfig>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) setDraft({ ...config });
  }, [config, open]);

  const cur = { ...config, ...draft } as IncomeProofModuleConfig;

  const dirty = useMemo(
    () => (config ? JSON.stringify(cur) !== JSON.stringify(config) : false),
    [cur, config]
  );

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(draft); onClose(); } finally { setSaving(false); }
  };

  return (
    <ConfigDrawer
      open={open}
      title="Income Proof"
      subtitle="Configure accepted document types and coverage period."
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      dirty={dirty}
      saveDisabled={!cur.acceptedDocuments?.length}
    >
      <Field label="Accepted document types" required>
        <CheckboxGroup
          options={ALL_INCOME_DOCS.map((d) => ({ label: INCOME_DOC_LABELS[d], value: d }))}
          value={cur.acceptedDocuments ?? []}
          onChange={(v) => setDraft((p) => ({ ...p, acceptedDocuments: v }))}
        />
      </Field>
      <Field label="Income coverage (months)" hint="Documents must cover the most recent N consecutive months.">
        <TextInput
          type="number" min={1} max={24}
          value={cur.periodCoverageMonths ?? 3}
          onChange={(e) => setDraft((p) => ({ ...p, periodCoverageMonths: Number(e.target.value) || 1 }))}
        />
      </Field>
      <Field label="Accepted file formats">
        <div className="flex gap-4 mt-1">
          {(["jpg", "png", "pdf"] as const).map((f) => (
            <label key={f} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={cur.acceptedFormats?.includes(f) ?? false}
                onChange={() => {
                  const next = cur.acceptedFormats?.includes(f)
                    ? cur.acceptedFormats.filter((x) => x !== f)
                    : [...(cur.acceptedFormats ?? []), f];
                  setDraft((p) => ({ ...p, acceptedFormats: next }));
                }}
                className="rounded"
              />
              <span className="text-sm uppercase">{f}</span>
            </label>
          ))}
        </div>
      </Field>
      <Field label="Max file size (MB)">
        <TextInput
          type="number" min={1} max={50}
          value={cur.maxFileSizeMb ?? 10}
          onChange={(e) => setDraft((p) => ({ ...p, maxFileSizeMb: Number(e.target.value) || 1 }))}
        />
      </Field>
    </ConfigDrawer>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* ⑥ 活体认证抽屉                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

function LivenessDrawer({
  open,
  config,
  onSave,
  onClose,
}: {
  open: boolean;
  config: LivenessModuleConfig | null;
  onSave: (patch: Partial<LivenessModuleConfig>) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Partial<LivenessModuleConfig>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) setDraft({ ...config });
  }, [config, open]);

  const cur = { ...config, ...draft } as LivenessModuleConfig;
  const provider = cur.provider ?? "tradepass";
  const pc = cur.providerConfig ?? {};

  const dirty = useMemo(
    () => (config ? JSON.stringify(cur) !== JSON.stringify(config) : false),
    [cur, config]
  );

  const setProvider = (p: LivenessProvider) =>
    setDraft((prev) => ({ ...prev, provider: p, providerConfig: {} }));

  const setPc = (patch: Partial<LivenessProviderConfig>) =>
    setDraft((prev) => ({
      ...prev,
      providerConfig: { ...(prev.providerConfig ?? {}), ...patch },
    }));

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(draft); onClose(); } finally { setSaving(false); }
  };

  return (
    <ConfigDrawer
      open={open}
      title="Liveness Check"
      subtitle="Pick a provider and set detection thresholds."
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      dirty={dirty}
    >
      {/* Provider */}
      <Field label="Provider" required>
        <Select
          value={provider}
          onChange={(e) => setProvider(e.target.value as LivenessProvider)}
          options={LIVENESS_PROVIDERS}
        />
      </Field>

      {/* TradePass note */}
      {provider === "tradepass" && (
        <div className="rounded-md bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-700">
          Uses the TradePass in-house liveness engine — no additional configuration required.
        </div>
      )}

      {/* Onfido config */}
      {provider === "onfido" && (
        <>
          <Field label="API Key" required>
            <TextInput
              value={pc.apiKey ?? ""}
              onChange={(e) => setPc({ apiKey: e.target.value })}
              placeholder="api_sandbox_..."
              type="password"
            />
          </Field>
          <Field label="Webhook Secret" hint="Used to verify Onfido webhook signatures.">
            <TextInput
              value={pc.webhookSecret ?? ""}
              onChange={(e) => setPc({ webhookSecret: e.target.value })}
              placeholder="whsec_..."
              type="password"
            />
          </Field>
          <SdkGuideLink provider="onfido" />
        </>
      )}

      {/* Sumsub config */}
      {provider === "sumsub" && (
        <>
          <Field label="App Token" required>
            <TextInput
              value={pc.appToken ?? ""}
              onChange={(e) => setPc({ appToken: e.target.value })}
              placeholder="sbx:..."
              type="password"
            />
          </Field>
          <Field label="Secret Key" required hint="Used to sign HMAC requests.">
            <TextInput
              value={pc.secretKey ?? ""}
              onChange={(e) => setPc({ secretKey: e.target.value })}
              type="password"
            />
          </Field>
          <SdkGuideLink provider="sumsub" />
        </>
      )}

      {/* Common config */}
      <hr className="border-slate-100" />
      <Field label="Minimum pass confidence (0–100)" hint="Anything below this score is auto-failed.">
        <TextInput
          type="number" min={0} max={100}
          value={cur.confidenceThreshold ?? 80}
          onChange={(e) =>
            setDraft((p) => ({
              ...p,
              confidenceThreshold: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
            }))
          }
        />
      </Field>
      <Field label="Max attempts" hint="Exceeding this count auto-fails the user and opens a manual-review case.">
        <TextInput
          type="number" min={1} max={10}
          value={cur.maxAttempts ?? 3}
          onChange={(e) =>
            setDraft((p) => ({
              ...p,
              maxAttempts: Math.max(1, Number(e.target.value) || 1),
            }))
          }
        />
      </Field>
    </ConfigDrawer>
  );
}

function SdkGuideLink({ provider }: { provider: Exclude<LivenessProvider, "tradepass"> }) {
  const labels: Record<typeof provider, string> = {
    onfido: "Open Onfido SDK integration docs",
    sumsub: "Open Sumsub SDK integration docs",
  };
  return (
    <a
      href={PROVIDER_SDK_LINKS[provider]}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
    >
      <ExternalLink className="w-3 h-3" />
      {labels[provider]}
    </a>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* ⑦ 问卷抽屉                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

function QuestionnaireDrawer({
  open,
  config,
  onSave,
  onClose,
}: {
  open: boolean;
  config: QuestionnaireModuleConfig | null;
  onSave: (patch: Partial<QuestionnaireModuleConfig>) => Promise<void>;
  onClose: () => void;
}) {
  const [fields, setFields] = useState<QuestionnaireField[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) setFields([...config.fields].sort((a, b) => a.order - b.order));
  }, [config, open]);

  const dirty = useMemo(() => {
    if (!config) return false;
    const sortedConfig = [...config.fields].sort((a, b) => a.order - b.order);
    return JSON.stringify(fields) !== JSON.stringify(sortedConfig);
  }, [fields, config]);

  const addField = () => {
    const maxOrder = fields.reduce((m, f) => Math.max(m, f.order), 0);
    setFields((prev) => [
      ...prev,
      { id: `q-${Date.now()}`, label: "", type: "text", required: true, order: maxOrder + 1 },
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    try { await onSave({ fields }); onClose(); } finally { setSaving(false); }
  };

  return (
    <ConfigDrawer
      open={open}
      title="KYC Questionnaire"
      subtitle={`${fields.length} question${fields.length === 1 ? "" : "s"}`}
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      dirty={dirty}
      width={560}
    >
      <div className="space-y-3">
        {fields.map((f, idx) => (
          <div key={f.id} className="border border-slate-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Field {idx + 1}
              </span>
              <button
                onClick={() => setFields((p) => p.filter((x) => x.id !== f.id))}
                className="p-1 text-red-400 hover:text-red-600 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <Field label="Question label" required>
                  <TextInput
                    value={f.label}
                    onChange={(e) =>
                      setFields((p) => p.map((x) => x.id === f.id ? { ...x, label: e.target.value } : x))
                    }
                    placeholder="e.g. Employment status"
                  />
                </Field>
              </div>
              <Field label="Type">
                <Select
                  value={f.type}
                  onChange={(e) =>
                    setFields((p) => p.map((x) => x.id === f.id ? { ...x, type: e.target.value as QuestionFieldType } : x))
                  }
                  options={QUESTION_FIELD_TYPES}
                />
              </Field>
              <Field label="Required">
                <Select
                  value={f.required ? "yes" : "no"}
                  onChange={(e) =>
                    setFields((p) => p.map((x) => x.id === f.id ? { ...x, required: e.target.value === "yes" } : x))
                  }
                  options={[{ label: "Required", value: "yes" }, { label: "Optional", value: "no" }]}
                />
              </Field>
              <div className="col-span-2">
                <Field label="Helper text">
                  <TextInput
                    value={f.hint ?? ""}
                    onChange={(e) =>
                      setFields((p) => p.map((x) => x.id === f.id ? { ...x, hint: e.target.value } : x))
                    }
                    placeholder="Hint shown to the applicant (optional)"
                  />
                </Field>
              </div>
            </div>
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={addField} className="w-full">
          <Plus className="w-3.5 h-3.5" />
          Add field
        </Button>
      </div>
    </ConfigDrawer>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* 主页面                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

type ActiveDrawer =
  | "doc-type"
  | "upload"
  | "country"
  | "poa"
  | "income"
  | "liveness"
  | "questionnaire"
  | null;

export default function SystemModulesPage() {
  const actor = useCurrentStaffName();
  const { addToast } = useToastStore();

  /* ── 身份验证配置 ── */
  const [identityConfig, setIdentityConfig] = useState<IdentityModuleConfig | null>(null);
  const [loadingIdentity, setLoadingIdentity] = useState(true);

  /* ── 其他模块配置 ── */
  const [poaConfig, setPoaConfig] = useState<POAModuleConfig | null>(null);
  const [incomeConfig, setIncomeConfig] = useState<IncomeProofModuleConfig | null>(null);
  const [livenessConfig, setLivenessConfig] = useState<LivenessModuleConfig | null>(null);
  const [questionnaireConfig, setQuestionnaireConfig] = useState<QuestionnaireModuleConfig | null>(null);

  /* ── 抽屉状态 ── */
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>(null);
  const [editingPolicyIdx, setEditingPolicyIdx] = useState<number | null>(null);
  const [policyDraft, setPolicyDraft] = useState<PolicyDraft | null>(null);

  /* ── 加载 ── */
  const loadIdentity = useCallback(async () => {
    setLoadingIdentity(true);
    const c = await clmFlowService.identityModule.get();
    setIdentityConfig(c);
    setLoadingIdentity(false);
  }, []);

  useEffect(() => {
    loadIdentity();
    Promise.all([
      clmFlowService.poaModule.get(),
      clmFlowService.incomeProofModule.get(),
      clmFlowService.livenessModule.get(),
      clmFlowService.questionnaireModule.get(),
    ]).then(([poa, income, liveness, q]) => {
      setPoaConfig(poa);
      setIncomeConfig(income);
      setLivenessConfig(liveness);
      setQuestionnaireConfig(q);
    });
  }, [loadIdentity]);

  /* ── 身份配置保存 helpers ── */
  const saveDocTypeSettings = async (
    defaults: DocumentTypeDefaults[],
    rules: DocumentTypeExpiryRule[]
  ) => {
    await clmFlowService.identityModule.update(
      { documentTypeDefaults: defaults, expiryRules: rules },
      actor
    );
    await loadIdentity();
    addToast({ title: "Document settings saved", type: "success" });
  };

  const saveUploadConfig = async (c: DocumentUploadConfig) => {
    await clmFlowService.identityModule.update({ uploadConfig: c }, actor);
    await loadIdentity();
    addToast({ title: "Upload settings saved", type: "success" });
  };

  /* ── Country policy helpers ── */
  const openNewPolicy = () => {
    setPolicyDraft({ country: "", allowedTypes: ["passport"], backSideOverrides: {} });
    setEditingPolicyIdx(null);
    setActiveDrawer("country");
  };

  const openEditPolicy = (idx: number) => {
    const p = identityConfig!.policies[idx];
    setPolicyDraft(policyToDraft(p));
    setEditingPolicyIdx(idx);
    setActiveDrawer("country");
  };

  const savePolicyDraft = async (d: PolicyDraft) => {
    if (!identityConfig) return;
    const policy: DocumentTypePolicy = {
      country: d.country,
      allowedTypes: d.allowedTypes,
      ...(Object.keys(d.backSideOverrides).length > 0
        ? { backSideOverrides: d.backSideOverrides }
        : {}),
    };
    const updated =
      editingPolicyIdx === null
        ? [...identityConfig.policies, policy]
        : identityConfig.policies.map((p, i) =>
            i === editingPolicyIdx ? policy : p
          );
    await clmFlowService.identityModule.update({ policies: updated }, actor);
    await loadIdentity();
    setActiveDrawer(null);
    addToast({ title: "Country policy saved", type: "success" });
  };

  const deletePolicy = async () => {
    if (!identityConfig || editingPolicyIdx === null) return;
    const updated = identityConfig.policies.filter((_, i) => i !== editingPolicyIdx);
    await clmFlowService.identityModule.update({ policies: updated }, actor);
    await loadIdentity();
    setActiveDrawer(null);
    addToast({ title: "Country policy deleted", type: "success" });
  };

  /* ── Other module saves ── */
  const savePoa = async (patch: Partial<POAModuleConfig>) => {
    const updated = await clmFlowService.poaModule.update(patch, actor);
    setPoaConfig(updated);
    addToast({ title: "Proof of Address settings saved", type: "success" });
  };

  const saveIncome = async (patch: Partial<IncomeProofModuleConfig>) => {
    const updated = await clmFlowService.incomeProofModule.update(patch, actor);
    setIncomeConfig(updated);
    addToast({ title: "Income Proof settings saved", type: "success" });
  };

  const saveLiveness = async (patch: Partial<LivenessModuleConfig>) => {
    const updated = await clmFlowService.livenessModule.update(patch, actor);
    setLivenessConfig(updated);
    addToast({ title: "Liveness settings saved", type: "success" });
  };

  const saveQuestionnaire = async (patch: Partial<QuestionnaireModuleConfig>) => {
    const updated = await clmFlowService.questionnaireModule.update(patch, actor);
    setQuestionnaireConfig(updated);
    addToast({ title: "Questionnaire settings saved", type: "success" });
  };

  /* ── Global default check ── */
  const hasGlobalPolicy =
    identityConfig?.policies.some((p) => p.country === "Global") ?? true;

  /* ──────────────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-3">
      <Breadcrumb
        items={[
          { label: "CLM Center" },
          { label: "Configuration" },
          { label: "System Modules" },
        ]}
      />
      <PageHeader title="System Modules" />

      {/* ── §1 身份验证 ──────────────────────────────────────────────── */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-8 h-8 rounded-md bg-blue-50 text-blue-700 inline-flex items-center justify-center shrink-0">
            <IdCard className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Identity Verification</h3>
            <p className="text-[11px] text-slate-500">Document capture rules, country policies and upload limits.</p>
          </div>
        </div>

        {loadingIdentity ? (
          <p className="text-sm text-slate-400 text-center py-8">Loading…</p>
        ) : (
          <div className="space-y-3">
            {/* 全球兜底警告 */}
            {!hasGlobalPolicy && (
              <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  No global default policy is configured — users from non-matching countries will be rejected.
                  Add a fallback policy with <strong>country = Global</strong>.
                </span>
              </div>
            )}

            {/* 文档类型设置摘要行 */}
            <SummaryRow
              label="Document Settings"
              summary={
                identityConfig
                  ? `${identityConfig.documentTypeDefaults.filter((d) => d.backSideEnabled).length} type(s) with back side · ${identityConfig.expiryRules.filter((r) => r.checkEnabled).length} with expiry check`
                  : "—"
              }
              onEdit={() => setActiveDrawer("doc-type")}
            />

            {/* Upload settings summary row */}
            <SummaryRow
              label="Upload Settings"
              summary={
                identityConfig
                  ? `${identityConfig.uploadConfig.acceptedFormats.join(" / ").toUpperCase()} · max ${identityConfig.uploadConfig.maxFileSizeMb}MB · ${identityConfig.uploadConfig.maxRetryAttemptsPerUser} per user · ${identityConfig.uploadConfig.maxRetryAttemptsPerWindow}/${identityConfig.uploadConfig.retryWindowHours}h`
                  : "—"
              }
              onEdit={() => setActiveDrawer("upload")}
            />

            {/* 国家政策列表 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-700">Country Policies</p>
                <Button variant="secondary" size="sm" onClick={openNewPolicy}>
                  <Plus className="w-3 h-3" />
                  Add country
                </Button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                {!identityConfig?.policies.length ? (
                  <p className="py-6 text-center text-xs text-slate-400">
                    No country policies yet — click "Add country" to configure.
                  </p>
                ) : (
                  <ul>
                    {/* Global 置顶 */}
                    {[
                      ...identityConfig.policies.filter((p) => p.country === "Global"),
                      ...identityConfig.policies.filter((p) => p.country !== "Global"),
                    ].map((p) => {
                      const idx = identityConfig.policies.indexOf(p);
                      return (
                        <li
                          key={p.country}
                          className={`flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50/60 ${
                            idx > 0 ? "border-t border-slate-100" : ""
                          }`}
                        >
                          <span className="text-xs font-mono font-semibold text-slate-500 w-14 shrink-0">
                            {p.country}
                          </span>
                          <span className="text-xs text-slate-600 flex-1 truncate">
                            {countryName(p.country)}
                          </span>
                          <div className="flex gap-1 flex-wrap shrink-0">
                            {p.allowedTypes.map((t) => (
                              <span
                                key={t}
                                className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-medium"
                              >
                                {DOC_TYPE_LABELS[t]}
                              </span>
                            ))}
                          </div>
                          {p.country === "Global" && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded font-medium shrink-0">
                              Default
                            </span>
                          )}
                          <button
                            onClick={() => openEditPolicy(idx)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 shrink-0"
                            aria-label="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ── §2-5 模块卡片 2×2 ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ModuleCard
          icon={MapPin}
          tone="bg-emerald-50 text-emerald-700"
          title="Proof of Address"
          summary={
            poaConfig
              ? `${fmtList(poaConfig.acceptedDocuments.map((d) => POA_DOC_LABELS[d]))} · valid for ${poaConfig.maxAgeMonths} mo`
              : "Loading…"
          }
          onConfigure={() => setActiveDrawer("poa")}
        />
        <ModuleCard
          icon={Wallet}
          tone="bg-amber-50 text-amber-700"
          title="Income Proof"
          summary={
            incomeConfig
              ? `${fmtList(incomeConfig.acceptedDocuments.map((d) => INCOME_DOC_LABELS[d]))} · covers ${incomeConfig.periodCoverageMonths} mo`
              : "Loading…"
          }
          onConfigure={() => setActiveDrawer("income")}
        />
        <ModuleCard
          icon={ScanFace}
          tone="bg-violet-50 text-violet-700"
          title="Liveness Check"
          summary={
            livenessConfig
              ? `${LIVENESS_PROVIDERS.find((p) => p.value === livenessConfig.provider)?.label ?? livenessConfig.provider} · ${livenessConfig.confidenceThreshold}% confidence · max ${livenessConfig.maxAttempts} attempts`
              : "Loading…"
          }
          onConfigure={() => setActiveDrawer("liveness")}
        />
        <ModuleCard
          icon={ClipboardList}
          tone="bg-sky-50 text-sky-700"
          title="Questionnaire"
          summary={
            questionnaireConfig
              ? `${questionnaireConfig.fields.length} field${questionnaireConfig.fields.length === 1 ? "" : "s"}`
              : "Loading…"
          }
          onConfigure={() => setActiveDrawer("questionnaire")}
        />
      </div>

      {/* ── 抽屉 ─────────────────────────────────────────────────── */}
      <DocTypeSettingsDrawer
        open={activeDrawer === "doc-type"}
        defaults={identityConfig?.documentTypeDefaults ?? []}
        expiryRules={identityConfig?.expiryRules ?? []}
        onSave={saveDocTypeSettings}
        onClose={() => setActiveDrawer(null)}
      />
      <UploadSettingsDrawer
        open={activeDrawer === "upload"}
        config={
          identityConfig?.uploadConfig ?? {
            acceptedFormats: ["jpg", "png", "pdf"],
            maxFileSizeMb: 5,
            maxRetryAttemptsPerUser: 10,
            retryWindowHours: 24,
            maxRetryAttemptsPerWindow: 3,
            duplicateDocumentNumberCheck: true,
          }
        }
        onSave={saveUploadConfig}
        onClose={() => setActiveDrawer(null)}
      />
      <CountryPolicyDrawer
        open={activeDrawer === "country"}
        draft={policyDraft}
        isNew={editingPolicyIdx === null}
        docTypeDefaults={identityConfig?.documentTypeDefaults ?? []}
        existingCountries={identityConfig?.policies.map((p) => p.country) ?? []}
        onSave={savePolicyDraft}
        onDelete={deletePolicy}
        onClose={() => setActiveDrawer(null)}
      />
      <POADrawer
        open={activeDrawer === "poa"}
        config={poaConfig}
        onSave={savePoa}
        onClose={() => setActiveDrawer(null)}
      />
      <IncomeProofDrawer
        open={activeDrawer === "income"}
        config={incomeConfig}
        onSave={saveIncome}
        onClose={() => setActiveDrawer(null)}
      />
      <LivenessDrawer
        open={activeDrawer === "liveness"}
        config={livenessConfig}
        onSave={saveLiveness}
        onClose={() => setActiveDrawer(null)}
      />
      <QuestionnaireDrawer
        open={activeDrawer === "questionnaire"}
        config={questionnaireConfig}
        onSave={saveQuestionnaire}
        onClose={() => setActiveDrawer(null)}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* 子组件                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

function SummaryRow({
  label,
  summary,
  onEdit,
}: {
  label: string;
  summary: string;
  onEdit: () => void;
}) {
  return (
    <button
      onClick={onEdit}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-700">{label}</p>
        <p className="text-[11px] text-slate-400 truncate mt-0.5">{summary}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
    </button>
  );
}

function ModuleCard({
  icon: Icon,
  tone,
  title,
  summary,
  onConfigure,
}: {
  icon: typeof IdCard;
  tone: string;
  title: string;
  summary: string;
  onConfigure: () => void;
}) {
  return (
    <Card padding="md">
      <div className="flex items-start gap-3">
        <span className={`w-8 h-8 rounded-md inline-flex items-center justify-center shrink-0 ${tone}`}>
          <Icon className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">{summary}</p>
        </div>
        <button
          onClick={onConfigure}
          className="shrink-0 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded px-2 py-1 hover:bg-slate-50"
        >
          <Settings2 className="w-3 h-3" />
          Configure
        </button>
      </div>
    </Card>
  );
}
