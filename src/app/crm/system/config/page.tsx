"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Globe, Shield, Power, Wrench, Save, RotateCcw, Clock,
  Eye, EyeOff, FileText, Video, UserCheck, Handshake,
  ChevronDown, ChevronRight, RefreshCw, AlertCircle,
  CheckCircle2, History, Loader2, Smartphone, Mail, Lock, Unlock,
} from "lucide-react";
import { PageHeader, Card, Button } from "@/components/crm/ui";
import type { AccountOpeningConfig, RegionAccountConfig, ConfigVersion, FundLimitsConfig, FundMethod } from "@/lib/config/types";
import type { RegionCode } from "@/lib/kyc/region-config";

const REGION_NAMES: Record<string, { name: string; flag: string }> = {
  VN: { name: "Vietnam", flag: "🇻🇳" },
  TH: { name: "Thailand", flag: "🇹🇭" },
  IN: { name: "India", flag: "🇮🇳" },
  AE: { name: "UAE", flag: "🇦🇪" },
  KR: { name: "South Korea", flag: "🇰🇷" },
  JP: { name: "Japan", flag: "🇯🇵" },
  FR: { name: "France", flag: "🇫🇷" },
  ES: { name: "Spain", flag: "🇪🇸" },
  BR: { name: "Brazil", flag: "🇧🇷" },
};

const STEP_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  document: { label: "Document Upload", icon: <FileText className="w-4 h-4" />, color: "blue" },
  liveness: { label: "Liveness Check", icon: <Video className="w-4 h-4" />, color: "purple" },
  personalInfo: { label: "Personal Info", icon: <UserCheck className="w-4 h-4" />, color: "green" },
  agreements: { label: "Agreements", icon: <Handshake className="w-4 h-4" />, color: "orange" },
};

// ============================================================
// Toggle Switch
// ============================================================
function Toggle({
  checked,
  onChange,
  disabled,
  size = "md",
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const sizes = { sm: "h-5 w-9", md: "h-6 w-11" };
  const dotSizes = { sm: "h-3.5 w-3.5", md: "h-4.5 w-4.5" };
  const translateX = { sm: checked ? "translate-x-4" : "translate-x-0.5", md: checked ? "translate-x-5" : "translate-x-0.5" };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        sizes[size]
      } ${checked ? "bg-blue-600" : "bg-gray-300"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`pointer-events-none inline-block rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${dotSizes[size]} ${translateX[size]}`}
      />
    </button>
  );
}

// ============================================================
// Status Pill
// ============================================================
function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
      enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${enabled ? "bg-green-500" : "bg-gray-400"}`} />
      {enabled ? "Active" : "Inactive"}
    </span>
  );
}

// ============================================================
// Region Card
// ============================================================
function RegionCard({
  code,
  config,
  isExpanded,
  onToggleExpand,
  onToggleEnabled,
  onFieldChange,
}: {
  code: RegionCode;
  config: RegionAccountConfig;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleEnabled: (enabled: boolean) => void;
  onFieldChange: (field: string, value: unknown) => void;
}) {
  const info = REGION_NAMES[code] || { name: code, flag: "🏳️" };

  return (
    <div className={`border rounded-xl transition-all ${isExpanded ? "border-blue-200 bg-blue-50/30" : "border-gray-200"} ${!config.enabled ? "opacity-60" : ""}`}>
      {/* Header Row */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">{info.flag}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{info.name}</span>
              <span className="text-xs text-gray-400">{code}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">{config.kycLevel}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {config.allowedDocuments.map((doc) => (
                <span key={doc} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 capitalize">
                  {doc.replace("_", " ")}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Toggle checked={config.enabled} onChange={onToggleEnabled} size="sm" />
          <button
            onClick={onToggleExpand}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && config.enabled && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          {/* KYC Level */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">KYC Level</span>
            <select
              value={config.kycLevel}
              onChange={(e) => onFieldChange("kycLevel", e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="enhanced">Enhanced</option>
            </select>
          </div>

          {/* Allowed Documents */}
          <div>
            <span className="text-sm text-gray-600 block mb-2">Allowed Documents</span>
            <div className="flex flex-wrap gap-2">
              {(["id_card", "passport", "driving_license"] as const).map((doc) => {
                const isSelected = config.allowedDocuments.includes(doc);
                return (
                  <button
                    key={doc}
                    onClick={() => {
                      const docs = isSelected
                        ? config.allowedDocuments.filter((d) => d !== doc)
                        : [...config.allowedDocuments, doc];
                      onFieldChange("allowedDocuments", docs);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    {doc.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feature Toggles */}
          <div>
            <span className="text-sm text-gray-600 block mb-2">Features</span>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(config.features) as [string, boolean][]).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-gray-100">
                  <span className="text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                  <Toggle
                    checked={value}
                    onChange={(v) => {
                      onFieldChange("features", { ...config.features, [key]: v });
                    }}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Contact Verification / OTP Settings */}
          <div>
            <span className="text-sm text-gray-600 block mb-2">Contact Verification (OTP)</span>
            <div className="bg-white rounded-lg border border-gray-100 p-3 space-y-3">
              {/* Phone OTP */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Phone OTP Required</span>
                </div>
                <Toggle
                  checked={config.contactVerification?.phoneOtpRequired ?? true}
                  size="sm"
                  onChange={(v) => {
                    onFieldChange("contactVerification", {
                      ...config.contactVerification,
                      phoneOtpRequired: v,
                    });
                  }}
                />
              </div>
              {/* Email OTP */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Email OTP Required</span>
                </div>
                <Toggle
                  checked={config.contactVerification?.emailOtpRequired ?? true}
                  size="sm"
                  onChange={(v) => {
                    onFieldChange("contactVerification", {
                      ...config.contactVerification,
                      emailOtpRequired: v,
                    });
                  }}
                />
              </div>
              {/* Skip if pre-verified */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Skip if Pre-verified</span>
                </div>
                <Toggle
                  checked={config.contactVerification?.skipIfPreVerified ?? false}
                  size="sm"
                  onChange={(v) => {
                    onFieldChange("contactVerification", {
                      ...config.contactVerification,
                      skipIfPreVerified: v,
                    });
                  }}
                />
              </div>
              {/* Lock if pre-verified */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Lock if Pre-verified</span>
                </div>
                <Toggle
                  checked={config.contactVerification?.lockIfPreVerified ?? true}
                  size="sm"
                  onChange={(v) => {
                    onFieldChange("contactVerification", {
                      ...config.contactVerification,
                      lockIfPreVerified: v,
                    });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Form Sections */}
          <div>
            <span className="text-sm text-gray-600 block mb-2">Form Sections</span>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(config.formFields) as [string, unknown][]).map(([key, value]) => {
                if (key === "personalInfo") return null;
                return (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                    <Toggle
                      checked={!!value}
                      size="sm"
                      onChange={(v) => {
                        onFieldChange("formFields", { ...config.formFields, [key]: v });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fund Limits by KYC Level (default currency) */}
          <FundLimitsPanel
            fundLimits={config.fundLimits?.["default"]}
            onChange={(newLimits) =>
              onFieldChange("fundLimits", {
                ...config.fundLimits,
                default: newLimits,
              })
            }
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// Fund Limits Panel
// ============================================================
const ALL_METHODS: { id: FundMethod; label: string }[] = [
  { id: "bank", label: "Bank" },
  { id: "usdt_trc20", label: "USDT TRC20" },
  { id: "usdt_erc20", label: "USDT ERC20" },
  { id: "btc", label: "BTC" },
  { id: "eth", label: "ETH" },
  { id: "swift", label: "SWIFT" },
  { id: "sepa", label: "SEPA" },
];

function FundLimitsPanel({
  fundLimits,
  onChange,
}: {
  fundLimits?: Record<string, FundLimitsConfig>;
  onChange: (v: Record<string, FundLimitsConfig>) => void;
}) {
  const defaultLimits: Record<string, FundLimitsConfig> = {
    basic: {
      deposit: { perTransactionMin: 10, perTransactionMax: 1000, dailyLimit: 5000, dailyThreshold: 1000, allowedMethods: ["bank"] },
      withdrawal: { perTransactionMin: 10, perTransactionMax: 500, dailyLimit: 2000, dailyThreshold: 500, allowedMethods: ["bank"], eWalletRequiresAddressProof: true },
    },
    standard: {
      deposit: { perTransactionMin: 50, perTransactionMax: 50000, dailyLimit: 200000, dailyThreshold: 10000, allowedMethods: ["bank", "usdt_trc20", "usdt_erc20"] },
      withdrawal: { perTransactionMin: 50, perTransactionMax: 20000, dailyLimit: 100000, dailyThreshold: 10000, allowedMethods: ["bank", "usdt_trc20"], eWalletRequiresAddressProof: true },
    },
    enhanced: {
      deposit: { perTransactionMin: 100, perTransactionMax: 999999999, dailyLimit: 999999999, dailyThreshold: 50000, allowedMethods: ["bank", "usdt_trc20", "usdt_erc20", "btc", "eth"] },
      withdrawal: { perTransactionMin: 100, perTransactionMax: 999999999, dailyLimit: 999999999, dailyThreshold: 50000, allowedMethods: ["bank", "usdt_trc20", "usdt_erc20", "btc", "eth"], eWalletRequiresAddressProof: false },
    },
  };

  const limits = fundLimits ?? defaultLimits;

  const updateLevel = (level: "basic" | "standard" | "enhanced", type: "deposit" | "withdrawal", field: string, value: unknown) => {
    const lvl = limits[level];
    const next = {
      ...limits,
      [level]: {
        ...lvl,
        [type]: { ...lvl[type], [field]: value },
      },
    };
    onChange(next);
  };

  const toggleMethod = (level: "basic" | "standard" | "enhanced", type: "deposit" | "withdrawal", methodId: FundMethod) => {
    const current = limits[level][type].allowedMethods;
    const nextMethods = current.includes(methodId)
      ? current.filter((m) => m !== methodId)
      : [...current, methodId];
    updateLevel(level, type, "allowedMethods", nextMethods);
  };

  return (
    <div className="border-t border-gray-100 pt-4">
      <span className="text-sm text-gray-600 block mb-3">Fund Limits (by KYC Level)</span>
      <div className="space-y-3">
        {(["basic", "standard", "enhanced"] as const).map((level) => (
          <div key={level} className="bg-white rounded-lg border border-gray-100 p-3">
            <span className="text-xs font-semibold text-gray-700 uppercase mb-2 block">{level}</span>

            {/* Deposit */}
            <div className="mb-3">
              <span className="text-xs text-gray-500 block mb-1">Deposit</span>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {(["perTransactionMin", "perTransactionMax", "dailyLimit", "dailyThreshold"] as const).map((field) => (
                  <div key={field}>
                    <span className="text-[10px] text-gray-400 block mb-0.5 capitalize">{field.replace(/([A-Z])/g, " $1")}</span>
                    <input
                      type="number"
                      value={limits[level].deposit[field]}
                      onChange={(e) => updateLevel(level, "deposit", field, Number(e.target.value))}
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_METHODS.map((m) => {
                  const selected = limits[level].deposit.allowedMethods.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleMethod(level, "deposit", m.id)}
                      className={`text-[10px] px-2 py-1 rounded border transition-colors ${selected ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"}`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Withdrawal */}
            <div>
              <span className="text-xs text-gray-500 block mb-1">Withdrawal</span>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {(["perTransactionMin", "perTransactionMax", "dailyLimit", "dailyThreshold"] as const).map((field) => (
                  <div key={field}>
                    <span className="text-[10px] text-gray-400 block mb-0.5 capitalize">{field.replace(/([A-Z])/g, " $1")}</span>
                    <input
                      type="number"
                      value={limits[level].withdrawal[field]}
                      onChange={(e) => updateLevel(level, "withdrawal", field, Number(e.target.value))}
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {ALL_METHODS.map((m) => {
                    const selected = limits[level].withdrawal.allowedMethods.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => toggleMethod(level, "withdrawal", m.id)}
                        className={`text-[10px] px-2 py-1 rounded border transition-colors ${selected ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"}`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">eWallet needs address proof</span>
                  <Toggle
                    checked={limits[level].withdrawal.eWalletRequiresAddressProof}
                    size="sm"
                    onChange={(v) => updateLevel(level, "withdrawal", "eWalletRequiresAddressProof", v)}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// History Drawer
// ============================================================
function HistoryPanel({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<ConfigVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/config/kyc/history")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setHistory(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Configuration History</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <span className="text-gray-400">&times;</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No history yet</p>
          ) : (
            <div className="space-y-3">
              {history.map((v, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-mono font-medium text-gray-900">v{v.version}</span>
                    <span className="text-xs text-gray-400">{new Date(v.updatedAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-600">{v.changes}</p>
                  <p className="text-xs text-gray-400 mt-1">by {v.updatedBy}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================
export default function AccountConfigPage() {
  const [config, setConfig] = useState<AccountOpeningConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<AccountOpeningConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/config/kyc");
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
        setOriginalConfig(JSON.parse(JSON.stringify(data.data)));
        setHasChanges(false);
      }
    } catch (err) {
      console.error("Failed to fetch config:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const saveConfig = async (reason?: string) => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch("/api/config/kyc", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          reason,
          updatedBy: "admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ type: "success", message: `Saved as v${data.version}` });
        setOriginalConfig(JSON.parse(JSON.stringify(config)));
        setHasChanges(false);
      } else {
        setToast({ type: "error", message: data.error || "Save failed" });
      }
    } catch {
      setToast({ type: "error", message: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const quickToggle = async (action: string, region?: string, enabled?: boolean) => {
    try {
      const res = await fetch("/api/config/kyc/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, region, enabled, updatedBy: "admin" }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ type: "success", message: data.message });
        fetchConfig();
      }
    } catch {
      setToast({ type: "error", message: "Toggle failed" });
    }
  };

  const handleRegionFieldChange = (regionCode: string, field: string, value: unknown) => {
    if (!config) return;
    setConfig({
      ...config,
      regions: {
        ...config.regions,
        [regionCode]: {
          ...config.regions[regionCode as RegionCode],
          [field]: value,
        },
      },
    });
    setHasChanges(true);
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const enabledCount = Object.values(config.regions).filter((r) => r.enabled).length;
  const totalRegions = Object.keys(config.regions).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Opening Config"
        description="Manage KYC configuration, region settings, and workflow steps. Changes take effect immediately on the Portal."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(true)}
            >
              <History className="w-4 h-4" />
              History
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchConfig}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            {hasChanges && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (originalConfig) {
                      setConfig(JSON.parse(JSON.stringify(originalConfig)));
                      setHasChanges(false);
                    }
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveConfig("Manual config update")}
                  loading={saving}
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Version & Status Bar */}
      <Card padding="sm">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="font-mono text-gray-500">v{config.version}</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">
              Updated {new Date(config.updatedAt).toLocaleString()} by {config.updatedBy}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill enabled={config.enabled} />
            {config.maintenanceMode && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                <Wrench className="w-3 h-3" />
                Maintenance
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Global Switches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Account Opening Toggle */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Power className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Account Opening</p>
                <p className="text-xs text-gray-500">
                  {config.enabled ? "Users can register" : "Registration closed"}
                </p>
              </div>
            </div>
            <Toggle
              checked={config.enabled}
              onChange={(v) => quickToggle("toggleAccountOpening", undefined, v)}
            />
          </div>
        </Card>

        {/* Maintenance Mode */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Maintenance Mode</p>
                <p className="text-xs text-gray-500">
                  {config.maintenanceMode ? "Portal shows maintenance page" : "Normal operation"}
                </p>
              </div>
            </div>
            <Toggle
              checked={config.maintenanceMode}
              onChange={(v) => quickToggle("toggleMaintenance", undefined, v)}
            />
          </div>
        </Card>

        {/* Region Stats */}
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Globe className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Active Regions</p>
              <p className="text-xs text-gray-500">
                {enabledCount} of {totalRegions} regions enabled
              </p>
            </div>
            <div className="ml-auto">
              <div className="text-2xl font-bold text-green-600">{enabledCount}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Two-column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Region Configurations */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Region Configurations</h2>
          </div>

          <div className="space-y-3">
            {(Object.entries(config.regions) as [RegionCode, RegionAccountConfig][]).map(
              ([code, regionConfig]) => (
                <RegionCard
                  key={code}
                  code={code}
                  config={regionConfig}
                  isExpanded={expandedRegion === code}
                  onToggleExpand={() =>
                    setExpandedRegion(expandedRegion === code ? null : code)
                  }
                  onToggleEnabled={(enabled) =>
                    quickToggle("toggleRegion", code, enabled)
                  }
                  onFieldChange={(field, value) =>
                    handleRegionFieldChange(code, field, value)
                  }
                />
              )
            )}
          </div>
        </div>

        {/* Right Sidebar: Steps + Defaults */}
        <div className="space-y-3">
          {/* KYC Steps */}
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">KYC Steps</h2>
          </div>

          {(Object.entries(config.steps) as [string, Record<string, unknown>][]).map(
            ([stepName, stepConfig]) => {
              const meta = STEP_LABELS[stepName] || { label: stepName, icon: null, color: "gray" };
              const enabled = stepConfig.enabled as boolean;

              return (
                <Card key={stepName}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        enabled ? `bg-${meta.color}-100 text-${meta.color}-600` : "bg-gray-100 text-gray-400"
                      }`}>
                        {meta.icon}
                      </div>
                      <span className="font-medium text-gray-900 text-sm">{meta.label}</span>
                    </div>
                    <Toggle
                      checked={enabled}
                      size="sm"
                      onChange={(v) => {
                        setConfig({
                          ...config,
                          steps: {
                            ...config.steps,
                            [stepName]: { ...stepConfig, enabled: v },
                          },
                        });
                        setHasChanges(true);
                      }}
                    />
                  </div>

                  {/* Step-specific settings */}
                  {enabled && (
                    <div className="border-t border-gray-100 pt-3 space-y-2">
                      {Object.entries(stepConfig).map(([key, value]) => {
                        if (key === "enabled") return null;
                        if (typeof value === "boolean") {
                          return (
                            <div key={key} className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                              <Toggle
                                checked={value}
                                size="sm"
                                onChange={(v) => {
                                  setConfig({
                                    ...config,
                                    steps: {
                                      ...config.steps,
                                      [stepName]: { ...stepConfig, [key]: v },
                                    },
                                  });
                                  setHasChanges(true);
                                }}
                              />
                            </div>
                          );
                        }
                        if (typeof value === "number") {
                          return (
                            <div key={key} className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                              <input
                                type="number"
                                value={value}
                                onChange={(e) => {
                                  setConfig({
                                    ...config,
                                    steps: {
                                      ...config.steps,
                                      [stepName]: { ...stepConfig, [key]: parseInt(e.target.value) || 0 },
                                    },
                                  });
                                  setHasChanges(true);
                                }}
                                className="w-20 text-xs border border-gray-200 rounded-lg px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          );
                        }
                        if (Array.isArray(value)) {
                          return null; // skip arrays like allowedFormats, sections
                        }
                        return null;
                      })}
                    </div>
                  )}
                </Card>
              );
            }
          )}

          {/* Defaults */}
          <div className="flex items-center gap-2 mb-2 mt-6">
            <Clock className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Defaults</h2>
          </div>

          <Card>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Default Region</span>
                <select
                  value={config.defaults.defaultRegion}
                  onChange={(e) => {
                    setConfig({
                      ...config,
                      defaults: { ...config.defaults, defaultRegion: e.target.value as RegionCode },
                    });
                    setHasChanges(true);
                  }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {(Object.entries(REGION_NAMES) as [string, { name: string; flag: string }][]).map(
                    ([code, info]) => (
                      <option key={code} value={code}>
                        {info.flag} {info.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Review Mode</span>
                <select
                  value={config.defaults.reviewMode}
                  onChange={(e) => {
                    setConfig({
                      ...config,
                      defaults: { ...config.defaults, reviewMode: e.target.value as "auto" | "manual" | "hybrid" },
                    });
                    setHasChanges(true);
                  }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="auto">Auto</option>
                  <option value="manual">Manual</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Auto-approve Threshold</span>
                <input
                  type="number"
                  value={config.defaults.autoApproveThreshold}
                  min={0}
                  max={100}
                  onChange={(e) => {
                    setConfig({
                      ...config,
                      defaults: { ...config.defaults, autoApproveThreshold: parseInt(e.target.value) || 0 },
                    });
                    setHasChanges(true);
                  }}
                  className="w-20 text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Review Timeout (hours)</span>
                <input
                  type="number"
                  value={config.defaults.reviewTimeout}
                  min={1}
                  max={720}
                  onChange={(e) => {
                    setConfig({
                      ...config,
                      defaults: { ...config.defaults, reviewTimeout: parseInt(e.target.value) || 24 },
                    });
                    setHasChanges(true);
                  }}
                  className="w-20 text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}>
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {toast.message}
          </div>
        </div>
      )}

      {/* History Drawer */}
      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
    </div>
  );
}
