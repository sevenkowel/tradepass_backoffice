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

import { useCallback, useEffect, useState } from "react";
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
  { label: "TradePass（自研）", value: "tradepass" },
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
  if (code === "Global") return "Global（全球默认）";
  try {
    return new Intl.DisplayNames(["zh"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function fmtList(items: string[], max = 3): string {
  if (items.length === 0) return "—";
  const shown = items.slice(0, max);
  const rest = items.length - max;
  return rest > 0 ? `${shown.join("、")} +${rest}` : shown.join("、");
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
      title="文档类型设置"
      subtitle="配置各证件类型的正反面采集和有效期检查规则。"
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      width={520}
    >
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left py-2 px-3 font-medium">证件类型</th>
              <th className="text-center py-2 px-3 font-medium">背面采集</th>
              <th className="text-center py-2 px-3 font-medium">背面必传</th>
              <th className="text-center py-2 px-3 font-medium">过期检查</th>
              <th className="text-center py-2 px-3 font-medium">拒绝期限(月)</th>
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
      title="上传设置"
      subtitle="配置证件文件的格式限制和重试策略。"
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
    >
      {/* 文件格式 */}
      <Field label="允许的文件格式">
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

      {/* 最大文件大小 */}
      <Field label="最大文件大小（MB）">
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

      {/* 单用户总次数 */}
      <Field
        label="单用户最大上传次数"
        hint="单个用户累计上传失败超过此次数后，账户被锁定，需人工处理"
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

      {/* 时间窗口内限制 */}
      <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50/40">
        <p className="text-xs font-semibold text-slate-700">时间窗口限制</p>
        <Field
          label="时间窗口（小时）"
          hint="滚动时间窗口，默认 24 小时"
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
          label={`${draft.retryWindowHours} 小时内最大次数`}
          hint="在上方时间窗口内超过此次数将被暂时锁定"
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

      {/* 重复文件号检测 */}
      <Field label="重复证件号检测" hint="检测到相同证件号已绑定其他账户时发出警告">
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
          <span className="text-sm text-slate-700">启用</span>
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

function CountryPolicyDrawer({
  open,
  draft,
  isNew,
  docTypeDefaults,
  onSave,
  onDelete,
  onClose,
}: {
  open: boolean;
  draft: PolicyDraft | null;
  isNew: boolean;
  docTypeDefaults: DocumentTypeDefaults[];
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

  const toggleType = (t: DocumentTypeKind) => {
    setLocal((prev) => ({
      ...prev,
      allowedTypes: prev.allowedTypes.includes(t)
        ? prev.allowedTypes.filter((x) => x !== t)
        : [...prev.allowedTypes, t],
    }));
  };

  const valid = local.country.trim().length > 0 && local.allowedTypes.length > 0;
  const isGlobal = local.country === "Global";

  return (
    <ConfigDrawer
      open={open}
      title={isNew ? "新增国家政策" : "编辑国家政策"}
      subtitle={
        isGlobal
          ? "全球默认配置——无匹配国家时自动生效。"
          : "指定该居住国用户允许提交的证件类型。"
      }
      onClose={onClose}
      onSave={() => onSave(local)}
      saveDisabled={!valid}
      destructive={
        !isNew && !isGlobal
          ? { label: "删除此政策", onClick: onDelete }
          : undefined
      }
    >
      <Field label="国家代码（ISO）或 'Global'" required>
        <TextInput
          value={local.country}
          onChange={(e) =>
            setLocal((p) => ({ ...p, country: e.target.value.toUpperCase() }))
          }
          placeholder="例如：CN、GB、Global"
          maxLength={6}
          disabled={!isNew && isGlobal}
        />
        {isGlobal && (
          <p className="text-[11px] text-amber-600 mt-1">
            全球默认配置不可更改国家代码。
          </p>
        )}
      </Field>

      <Field label="允许的证件类型" required>
        <div className="space-y-2 mt-1">
          {DOC_TYPE_ORDER.map((t) => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={local.allowedTypes.includes(t)}
                onChange={() => toggleType(t)}
                className="rounded"
              />
              <span className="text-sm text-slate-700">{DOC_TYPE_LABELS[t]}</span>
            </label>
          ))}
        </div>
      </Field>

      {/* 背面覆盖，仅对全局默认启用背面的类型显示 */}
      {local.allowedTypes.some((t) =>
        docTypeDefaults.find((d) => d.kind === t)?.backSideEnabled
      ) && (
        <Field
          label="背面要求覆盖"
          hint="覆盖全局文档类型设置中的背面规则（省略则继承全局默认）"
        >
          <div className="space-y-2 mt-1">
            {local.allowedTypes
              .filter((t) => docTypeDefaults.find((d) => d.kind === t)?.backSideEnabled)
              .map((t) => {
                const ov = local.backSideOverrides[t];
                return (
                  <div key={t} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-600">{DOC_TYPE_LABELS[t]}</span>
                    <select
                      value={ov === undefined ? "inherit" : ov ? "required" : "optional"}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLocal((p) => {
                          const ovs = { ...p.backSideOverrides };
                          if (v === "inherit") delete ovs[t];
                          else ovs[t] = v === "required";
                          return { ...p, backSideOverrides: ovs };
                        });
                      }}
                      className="h-7 text-xs px-2 rounded border border-slate-200 bg-white"
                    >
                      <option value="inherit">继承全局默认</option>
                      <option value="required">背面必传</option>
                      <option value="optional">背面可选</option>
                    </select>
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

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(draft); onClose(); } finally { setSaving(false); }
  };

  return (
    <ConfigDrawer
      open={open}
      title="住址证明（POA）"
      subtitle="配置接受的文件类型和上传约束。"
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      saveDisabled={!cur.acceptedDocuments?.length}
    >
      <Field label="接受的文件类型" required>
        <CheckboxGroup
          options={ALL_POA_DOCS.map((d) => ({ label: POA_DOC_LABELS[d], value: d }))}
          value={cur.acceptedDocuments ?? []}
          onChange={(v) => setDraft((p) => ({ ...p, acceptedDocuments: v }))}
        />
      </Field>
      <Field label="文件有效期（月）" hint="文件出具日期不得早于此月数前">
        <TextInput
          type="number" min={1} max={24}
          value={cur.maxAgeMonths ?? 3}
          onChange={(e) => setDraft((p) => ({ ...p, maxAgeMonths: Number(e.target.value) || 1 }))}
        />
      </Field>
      <Field label="允许的文件格式">
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
      <Field label="最大文件大小（MB）">
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

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(draft); onClose(); } finally { setSaving(false); }
  };

  return (
    <ConfigDrawer
      open={open}
      title="收入证明"
      subtitle="配置接受的文件类型和覆盖期限。"
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      saveDisabled={!cur.acceptedDocuments?.length}
    >
      <Field label="接受的文件类型" required>
        <CheckboxGroup
          options={ALL_INCOME_DOCS.map((d) => ({ label: INCOME_DOC_LABELS[d], value: d }))}
          value={cur.acceptedDocuments ?? []}
          onChange={(v) => setDraft((p) => ({ ...p, acceptedDocuments: v }))}
        />
      </Field>
      <Field label="收入历史覆盖期限（月）" hint="文件须覆盖最近连续 N 个月">
        <TextInput
          type="number" min={1} max={24}
          value={cur.periodCoverageMonths ?? 3}
          onChange={(e) => setDraft((p) => ({ ...p, periodCoverageMonths: Number(e.target.value) || 1 }))}
        />
      </Field>
      <Field label="允许的文件格式">
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
      <Field label="最大文件大小（MB）">
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
      title="活体认证"
      subtitle="选择供应商并配置识别阈值。"
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
    >
      {/* 供应商选择 */}
      <Field label="供应商" required>
        <Select
          value={provider}
          onChange={(e) => setProvider(e.target.value as LivenessProvider)}
          options={LIVENESS_PROVIDERS}
        />
      </Field>

      {/* TradePass 自研说明 */}
      {provider === "tradepass" && (
        <div className="rounded-md bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-700">
          使用 TradePass 自研活体检测引擎，无需额外配置。
        </div>
      )}

      {/* Onfido 配置 */}
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
          <Field label="Webhook Secret" hint="用于验证 Onfido 回调签名">
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

      {/* Sumsub 配置 */}
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
          <Field label="Secret Key" required hint="用于 HMAC 请求签名">
            <TextInput
              value={pc.secretKey ?? ""}
              onChange={(e) => setPc({ secretKey: e.target.value })}
              type="password"
            />
          </Field>
          <SdkGuideLink provider="sumsub" />
        </>
      )}

      {/* 通用配置 */}
      <hr className="border-slate-100" />
      <Field label="最小通过置信度（0–100）" hint="低于此分数将自动判定为失败">
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
      <Field label="最大尝试次数" hint="超过此次数将自动判定为失败，创建人工审核 Case">
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
    onfido: "查看 Onfido SDK 接入文档",
    sumsub: "查看 Sumsub SDK 接入文档",
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
      title="KYC 问卷"
      subtitle={`${fields.length} 个问题字段`}
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      width={560}
    >
      <div className="space-y-3">
        {fields.map((f, idx) => (
          <div key={f.id} className="border border-slate-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                字段 {idx + 1}
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
                <Field label="问题标签" required>
                  <TextInput
                    value={f.label}
                    onChange={(e) =>
                      setFields((p) => p.map((x) => x.id === f.id ? { ...x, label: e.target.value } : x))
                    }
                    placeholder="例如：就业状态"
                  />
                </Field>
              </div>
              <Field label="类型">
                <Select
                  value={f.type}
                  onChange={(e) =>
                    setFields((p) => p.map((x) => x.id === f.id ? { ...x, type: e.target.value as QuestionFieldType } : x))
                  }
                  options={QUESTION_FIELD_TYPES}
                />
              </Field>
              <Field label="是否必填">
                <Select
                  value={f.required ? "yes" : "no"}
                  onChange={(e) =>
                    setFields((p) => p.map((x) => x.id === f.id ? { ...x, required: e.target.value === "yes" } : x))
                  }
                  options={[{ label: "必填", value: "yes" }, { label: "选填", value: "no" }]}
                />
              </Field>
              <div className="col-span-2">
                <Field label="提示文本">
                  <TextInput
                    value={f.hint ?? ""}
                    onChange={(e) =>
                      setFields((p) => p.map((x) => x.id === f.id ? { ...x, hint: e.target.value } : x))
                    }
                    placeholder="向申请人展示的说明（可选）"
                  />
                </Field>
              </div>
            </div>
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={addField} className="w-full">
          <Plus className="w-3.5 h-3.5" />
          添加字段
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
    addToast({ title: "文档类型设置已保存", type: "success" });
  };

  const saveUploadConfig = async (c: DocumentUploadConfig) => {
    await clmFlowService.identityModule.update({ uploadConfig: c }, actor);
    await loadIdentity();
    addToast({ title: "上传设置已保存", type: "success" });
  };

  /* ── 国家政策 helpers ── */
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
    addToast({ title: "国家政策已保存", type: "success" });
  };

  const deletePolicy = async () => {
    if (!identityConfig || editingPolicyIdx === null) return;
    const updated = identityConfig.policies.filter((_, i) => i !== editingPolicyIdx);
    await clmFlowService.identityModule.update({ policies: updated }, actor);
    await loadIdentity();
    setActiveDrawer(null);
    addToast({ title: "国家政策已删除", type: "success" });
  };

  /* ── 其他模块保存 ── */
  const savePoa = async (patch: Partial<POAModuleConfig>) => {
    const updated = await clmFlowService.poaModule.update(patch, actor);
    setPoaConfig(updated);
    addToast({ title: "住址证明配置已保存", type: "success" });
  };

  const saveIncome = async (patch: Partial<IncomeProofModuleConfig>) => {
    const updated = await clmFlowService.incomeProofModule.update(patch, actor);
    setIncomeConfig(updated);
    addToast({ title: "收入证明配置已保存", type: "success" });
  };

  const saveLiveness = async (patch: Partial<LivenessModuleConfig>) => {
    const updated = await clmFlowService.livenessModule.update(patch, actor);
    setLivenessConfig(updated);
    addToast({ title: "活体认证配置已保存", type: "success" });
  };

  const saveQuestionnaire = async (patch: Partial<QuestionnaireModuleConfig>) => {
    const updated = await clmFlowService.questionnaireModule.update(patch, actor);
    setQuestionnaireConfig(updated);
    addToast({ title: "问卷配置已保存", type: "success" });
  };

  /* ── 全局兜底检查 ── */
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
            <p className="text-[11px] text-slate-500">证件采集规则、国家政策与上传约束。</p>
          </div>
        </div>

        {loadingIdentity ? (
          <p className="text-sm text-slate-400 text-center py-8">加载中…</p>
        ) : (
          <div className="space-y-3">
            {/* 全球兜底警告 */}
            {!hasGlobalPolicy && (
              <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  未配置全球默认政策（Global）——无匹配国家的用户将被拒绝。
                  建议立即添加一条 <strong>country = Global</strong> 的兜底政策。
                </span>
              </div>
            )}

            {/* 文档类型设置摘要行 */}
            <SummaryRow
              label="文档类型设置"
              summary={
                identityConfig
                  ? `${identityConfig.documentTypeDefaults.filter((d) => d.backSideEnabled).length} 种证件启用背面 · ${identityConfig.expiryRules.filter((r) => r.checkEnabled).length} 种证件启用过期检查`
                  : "—"
              }
              onEdit={() => setActiveDrawer("doc-type")}
            />

            {/* 上传设置摘要行 */}
            <SummaryRow
              label="上传设置"
              summary={
                identityConfig
                  ? `${identityConfig.uploadConfig.acceptedFormats.join(" / ").toUpperCase()} · 最大 ${identityConfig.uploadConfig.maxFileSizeMb}MB · 单用户 ${identityConfig.uploadConfig.maxRetryAttemptsPerUser} 次 · ${identityConfig.uploadConfig.retryWindowHours}h 内 ${identityConfig.uploadConfig.maxRetryAttemptsPerWindow} 次`
                  : "—"
              }
              onEdit={() => setActiveDrawer("upload")}
            />

            {/* 国家政策列表 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-700">国家政策</p>
                <Button variant="secondary" size="sm" onClick={openNewPolicy}>
                  <Plus className="w-3 h-3" />
                  添加国家
                </Button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                {!identityConfig?.policies.length ? (
                  <p className="py-6 text-center text-xs text-slate-400">
                    暂无国家政策，点击"添加国家"进行配置。
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
                              默认
                            </span>
                          )}
                          <button
                            onClick={() => openEditPolicy(idx)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 shrink-0"
                            aria-label="编辑"
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
              ? `${fmtList(poaConfig.acceptedDocuments.map((d) => POA_DOC_LABELS[d]))} · 有效期 ${poaConfig.maxAgeMonths} 个月`
              : "加载中…"
          }
          onConfigure={() => setActiveDrawer("poa")}
        />
        <ModuleCard
          icon={Wallet}
          tone="bg-amber-50 text-amber-700"
          title="Income Proof"
          summary={
            incomeConfig
              ? `${fmtList(incomeConfig.acceptedDocuments.map((d) => INCOME_DOC_LABELS[d]))} · 覆盖 ${incomeConfig.periodCoverageMonths} 个月`
              : "加载中…"
          }
          onConfigure={() => setActiveDrawer("income")}
        />
        <ModuleCard
          icon={ScanFace}
          tone="bg-violet-50 text-violet-700"
          title="Liveness Check"
          summary={
            livenessConfig
              ? `${LIVENESS_PROVIDERS.find((p) => p.value === livenessConfig.provider)?.label ?? livenessConfig.provider} · 置信度 ${livenessConfig.confidenceThreshold}% · 最多 ${livenessConfig.maxAttempts} 次`
              : "加载中…"
          }
          onConfigure={() => setActiveDrawer("liveness")}
        />
        <ModuleCard
          icon={ClipboardList}
          tone="bg-sky-50 text-sky-700"
          title="Questionnaire"
          summary={
            questionnaireConfig
              ? `${questionnaireConfig.fields.length} 个字段`
              : "加载中…"
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
          配置
        </button>
      </div>
    </Card>
  );
}
