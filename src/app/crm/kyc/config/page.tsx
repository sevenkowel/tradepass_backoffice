"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Globe,
  Layers,
  Shield,
  Key,
  ChevronRight,
  RefreshCw,
  Save,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  MapPin,
  FileText,
  ScanFace,
  User,
  FileSignature,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { UnifiedKYCConfig, RegionConfigSummary, StageConfig } from "@/lib/kyc/unified-config-types";
import type { RegionCode } from "@/lib/kyc/region-config";
import type { UnifiedRegionConfig, VerificationStage } from "@/lib/kyc/unified-config-types";

// ============================================================
// Tab 类型定义
// ============================================================

type TabType = "dashboard" | "regions" | "stages" | "tiers" | "permissions" | "settings";

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: TabConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: TrendingUp,
    description: "配置概览与统计",
  },
  {
    id: "regions",
    label: "Regions",
    icon: Globe,
    description: "地区开户与 KYC 配置",
  },
  {
    id: "stages",
    label: "Stages",
    icon: Layers,
    description: "认证阶段定义",
  },
  {
    id: "tiers",
    label: "Tiers",
    icon: Shield,
    description: "KYC 等级体系",
  },
  {
    id: "permissions",
    label: "Permissions",
    icon: Key,
    description: "权限矩阵配置",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    description: "全局设置",
  },
];

// ============================================================
// 主页面组件
// ============================================================

export default function KYCConfigPage() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [config, setConfig] = useState<UnifiedKYCConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 加载配置
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/config/kyc-system");
      if (!response.ok) throw new Error("Failed to load config");
      const data = await response.json();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    try {
      setSaving(true);
      setSaveSuccess(false);
      const response = await fetch("/api/config/kyc-system", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          updatedBy: "admin",
          reason: "Updated via KYC Config Center",
        }),
      });
      if (!response.ok) throw new Error("Failed to save config");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--tp-bg)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--tp-fg-muted)]">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading configuration...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--tp-bg)] flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md">
          <div className="flex items-center gap-3 text-red-500 mb-3">
            <AlertCircle className="w-6 h-6" />
            <h3 className="font-semibold">Error Loading Config</h3>
          </div>
          <p className="text-[var(--tp-fg-muted)] mb-4">{error}</p>
          <Button onClick={loadConfig} variant="outline" className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="min-h-screen bg-[var(--tp-bg)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--tp-surface)]/80 backdrop-blur-xl border-b border-[var(--tp-border)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--tp-fg)]">
                KYC Config Center
              </h1>
              <p className="text-sm text-[var(--tp-fg-muted)] mt-1">
                Unified configuration for account opening and KYC
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--tp-surface-2)] rounded-lg text-sm text-[var(--tp-fg-muted)]">
                <Clock className="w-4 h-4" />
                <span>v{config.version}</span>
              </div>
              <Button
                onClick={loadConfig}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !config}
                className="bg-[var(--tp-accent)] text-white hover:bg-[var(--tp-accent)]/90"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : saveSuccess ? (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <nav className="w-64 shrink-0">
            <div className="sticky top-24 space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      isActive
                        ? "bg-[var(--tp-accent)]/10 text-[var(--tp-accent)] border border-[var(--tp-accent)]/20"
                        : "text-[var(--tp-fg-muted)] hover:bg-[var(--tp-surface)] hover:text-[var(--tp-fg)]"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="flex-1">
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-xs opacity-70">{tab.description}</div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isActive ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "dashboard" && (
                  <DashboardTab config={config} />
                )}
                {activeTab === "regions" && (
                  <RegionsTab config={config} onChange={setConfig} />
                )}
                {activeTab === "stages" && (
                  <StagesTab config={config} onChange={setConfig} />
                )}
                {activeTab === "tiers" && (
                  <TiersTab config={config} onChange={setConfig} />
                )}
                {activeTab === "permissions" && (
                  <PermissionsTab config={config} onChange={setConfig} />
                )}
                {activeTab === "settings" && (
                  <SettingsTab config={config} onChange={setConfig} />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Dashboard Tab
// ============================================================

function DashboardTab({ config }: { config: UnifiedKYCConfig }) {
  const enabledRegions = Object.values(config.regions).filter((r) => r.enabled).length;
  const totalRegions = Object.keys(config.regions).length;

  const stats = [
    {
      label: "Enabled Regions",
      value: `${enabledRegions}/${totalRegions}`,
      icon: Globe,
      color: "blue",
    },
    {
      label: "KYC Tiers",
      value: config.tiers.length.toString(),
      icon: Shield,
      color: "green",
    },
    {
      label: "Verification Stages",
      value: Object.keys(config.stageDefinitions).length.toString(),
      icon: Layers,
      color: "purple",
    },
    {
      label: "Last Updated",
      value: new Date(config.updatedAt).toLocaleDateString(),
      icon: Clock,
      color: "amber",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-[var(--tp-surface)] border border-[var(--tp-border)] rounded-xl p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-10 h-10 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}
                >
                  <Icon className={`w-5 h-5 text-${stat.color}-500`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-[var(--tp-fg)]">
                {stat.value}
              </div>
              <div className="text-sm text-[var(--tp-fg-muted)]">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Region Status */}
      <div className="bg-[var(--tp-surface)] border border-[var(--tp-border)] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[var(--tp-fg)] mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[var(--tp-accent)]" />
          Region Status
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(config.regions).map(([code, region]) => (
            <div
              key={code}
              className={`p-3 rounded-lg border ${
                region.enabled
                  ? "bg-green-500/5 border-green-500/20"
                  : "bg-[var(--tp-surface-2)] border-[var(--tp-border)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--tp-fg)]">{code}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    region.enabled
                      ? "bg-green-500/10 text-green-500"
                      : "bg-[var(--tp-surface)] text-[var(--tp-fg-muted)]"
                  }`}
                >
                  {region.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="text-xs text-[var(--tp-fg-muted)] mt-1">
                {region.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier Overview */}
      <div className="bg-[var(--tp-surface)] border border-[var(--tp-border)] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[var(--tp-fg)] mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[var(--tp-accent)]" />
          KYC Tier Overview
        </h3>
        <div className="space-y-3">
          {config.tiers.map((tier) => (
            <div
              key={tier.level}
              className="flex items-center gap-4 p-3 bg-[var(--tp-surface-2)] rounded-lg"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold`}
                style={{
                  backgroundColor: `var(--${tier.badge.color}-500)`,
                  color: "white",
                }}
              >
                {tier.level}
              </div>
              <div className="flex-1">
                <div className="font-medium text-[var(--tp-fg)]">{tier.name}</div>
                <div className="text-sm text-[var(--tp-fg-muted)]">
                  {tier.description}
                </div>
              </div>
              <div className="text-sm text-[var(--tp-fg-muted)]">
                {tier.requiredStages.length} stages required
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Regions Tab
// ============================================================

function RegionsTab({
  config,
  onChange,
}: {
  config: UnifiedKYCConfig;
  onChange: (config: UnifiedKYCConfig) => void;
}) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [activeRegionTab, setActiveRegionTab] = useState<"opening" | "kyc" | "supplemental">("opening");

  const regions = Object.entries(config.regions).sort(([a], [b]) => a.localeCompare(b));

  const updateRegion = (code: string, updates: Partial<UnifiedRegionConfig>) => {
    onChange({
      ...config,
      regions: {
        ...config.regions,
        [code]: { ...config.regions[code as RegionCode], ...updates },
      },
    });
  };

  const updateRegionOpening = (code: string, updates: Partial<UnifiedRegionConfig["opening"]>) => {
    onChange({
      ...config,
      regions: {
        ...config.regions,
        [code]: {
          ...config.regions[code as RegionCode],
          opening: { ...config.regions[code as RegionCode].opening, ...updates },
        },
      },
    });
  };

  const updateRegionFeatures = (code: string, updates: Partial<UnifiedRegionConfig["opening"]["features"]>) => {
    onChange({
      ...config,
      regions: {
        ...config.regions,
        [code]: {
          ...config.regions[code as RegionCode],
          opening: {
            ...config.regions[code as RegionCode].opening,
            features: { ...config.regions[code as RegionCode].opening.features, ...updates },
          },
        },
      },
    });
  };

  const updateRegionSteps = (code: string, updates: Partial<UnifiedRegionConfig["opening"]["steps"]>) => {
    onChange({
      ...config,
      regions: {
        ...config.regions,
        [code]: {
          ...config.regions[code as RegionCode],
          opening: {
            ...config.regions[code as RegionCode].opening,
            steps: { ...config.regions[code as RegionCode].opening.steps, ...updates },
          },
        },
      },
    });
  };

  // 地区列表视图
  if (!selectedRegion) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--tp-fg)]">Regions</h3>
            <p className="text-sm text-[var(--tp-fg-muted)]">
              Configure opening flow and KYC upgrade paths for each region
            </p>
          </div>
          <div className="text-sm text-[var(--tp-fg-muted)]">
            {regions.filter(([, r]) => r.enabled).length} / {regions.length} enabled
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {regions.map(([code, region]) => (
            <motion.div
              key={code}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedRegion(code)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                region.enabled
                  ? "bg-[var(--tp-surface)] border-[var(--tp-border)] hover:border-[var(--tp-accent)]/50"
                  : "bg-[var(--tp-surface-2)]/50 border-[var(--tp-border)]/50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--tp-accent)]/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-[var(--tp-accent)]">{code}</span>
                  </div>
                  <div>
                    <div className="font-medium text-[var(--tp-fg)]">{region.name}</div>
                    <div className="text-xs text-[var(--tp-fg-muted)]">
                      Tier {region.opening.defaultTierOnComplete} on complete
                    </div>
                  </div>
                </div>
                <div
                  className={`w-2 h-2 rounded-full ${
                    region.enabled ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--tp-fg-muted)]">OCR</span>
                  <span className={region.opening.features.ocrEnabled ? "text-green-500" : "text-gray-400"}>
                    {region.opening.features.ocrEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--tp-fg-muted)]">Liveness</span>
                  <span className={region.opening.features.livenessRequired ? "text-green-500" : "text-gray-400"}>
                    {region.opening.features.livenessRequired ? "Required" : "Optional"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--tp-fg-muted)]">Upgrade Paths</span>
                  <span className="text-[var(--tp-fg)]">
                    {Object.values(region.kyc.upgradePaths).flat().length}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--tp-border)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--tp-fg-muted)]">Click to configure</span>
                  <ChevronRight className="w-4 h-4 text-[var(--tp-fg-muted)]" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // 地区详情视图
  const region = config.regions[selectedRegion as RegionCode];
  const tierNames = Object.fromEntries(config.tiers.map((t) => [t.level, t.name]));

  return (
    <div className="space-y-6">
      {/* 返回按钮和地区标题 */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => setSelectedRegion(null)}>
          <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
          Back to Regions
        </Button>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[var(--tp-fg)]">
            {region.name} ({selectedRegion})
          </h3>
        </div>
        <label className="flex items-center gap-2 px-3 py-1.5 bg-[var(--tp-surface)] rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={region.enabled}
            onChange={(e) => updateRegion(selectedRegion, { enabled: e.target.checked })}
            className="w-4 h-4 rounded border-[var(--tp-border)] text-[var(--tp-accent)] focus:ring-[var(--tp-accent)]"
          />
          <span className="text-sm text-[var(--tp-fg)]">Enabled</span>
        </label>
      </div>

      {/* 子 Tab */}
      <div className="flex gap-2 p-1 bg-[var(--tp-surface)] rounded-lg border border-[var(--tp-border)]">
        {[
          { id: "opening", label: "Opening Flow", icon: FileText },
          { id: "kyc", label: "KYC Upgrade", icon: TrendingUp },
          { id: "supplemental", label: "Supplemental", icon: AlertCircle },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveRegionTab(id as typeof activeRegionTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeRegionTab === id
                ? "bg-[var(--tp-accent)] text-white"
                : "text-[var(--tp-fg-muted)] hover:text-[var(--tp-fg)]"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Opening Flow Tab */}
      {activeRegionTab === "opening" && (
        <div className="space-y-6">
          {/* 步骤配置 */}
          <div className="bg-[var(--tp-surface)] border border-[var(--tp-border)] rounded-xl p-6">
            <h4 className="font-semibold text-[var(--tp-fg)] mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[var(--tp-accent)]" />
              Opening Steps
            </h4>

            <div className="space-y-3">
              {[
                { key: "document", label: "Document Upload", icon: FileText },
                { key: "liveness", label: "Liveness Check", icon: ScanFace },
                { key: "personalInfo", label: "Personal Information", icon: User },
                { key: "agreements", label: "Agreement Sign", icon: FileSignature },
              ].map(({ key, label, icon: Icon }) => {
                const step = region.opening.steps[key as keyof typeof region.opening.steps];
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 bg-[var(--tp-surface-2)] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--tp-accent)]/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-[var(--tp-accent)]" />
                      </div>
                      <span className="font-medium text-[var(--tp-fg)]">{label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={step.enabled}
                          onChange={(e) =>
                            updateRegionSteps(selectedRegion, {
                              [key]: { ...step, enabled: e.target.checked },
                            })
                          }
                          className="w-4 h-4 rounded border-[var(--tp-border)]"
                        />
                        <span className="text-[var(--tp-fg-muted)]">Enabled</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={step.required}
                          onChange={(e) =>
                            updateRegionSteps(selectedRegion, {
                              [key]: { ...step, required: e.target.checked },
                            })
                          }
                          className="w-4 h-4 rounded border-[var(--tp-border)]"
                        />
                        <span className="text-[var(--tp-fg-muted)]">Required</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 功能配置 */}
          <div className="bg-[var(--tp-surface)] border border-[var(--tp-border)] rounded-xl p-6">
            <h4 className="font-semibold text-[var(--tp-fg)] mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[var(--tp-accent)]" />
              Features
            </h4>

            <div className="grid grid-cols-2 gap-4">
              {/* OCR */}
              <div className="p-4 bg-[var(--tp-surface-2)] rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-[var(--tp-fg)]">OCR Recognition</span>
                  <input
                    type="checkbox"
                    checked={region.opening.features.ocrEnabled}
                    onChange={(e) =>
                      updateRegionFeatures(selectedRegion, { ocrEnabled: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-[var(--tp-border)]"
                  />
                </div>
                <select
                  value={region.opening.features.ocrProvider}
                  onChange={(e) =>
                    updateRegionFeatures(selectedRegion, {
                      ocrProvider: e.target.value as "tencent" | "google" | "azure",
                    })
                  }
                  disabled={!region.opening.features.ocrEnabled}
                  className="w-full px-3 py-2 bg-[var(--tp-surface)] border border-[var(--tp-border)] rounded-lg text-sm disabled:opacity-50"
                >
                  <option value="tencent">Tencent</option>
                  <option value="google">Google</option>
                  <option value="azure">Azure</option>
                </select>
              </div>

              {/* Liveness */}
              <div className="p-4 bg-[var(--tp-surface-2)] rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-[var(--tp-fg)]">Liveness Check</span>
                  <input
                    type="checkbox"
                    checked={region.opening.features.livenessRequired}
                    onChange={(e) =>
                      updateRegionFeatures(selectedRegion, { livenessRequired: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-[var(--tp-border)]"
                  />
                </div>
                <select
                  value={region.opening.features.livenessProvider}
                  onChange={(e) =>
                    updateRegionFeatures(selectedRegion, {
                      livenessProvider: e.target.value as "tencent" | "face++" | "onfido",
                    })
                  }
                  disabled={!region.opening.features.livenessRequired}
                  className="w-full px-3 py-2 bg-[var(--tp-surface)] border border-[var(--tp-border)] rounded-lg text-sm disabled:opacity-50"
                >
                  <option value="tencent">Tencent</option>
                  <option value="face++">Face++</option>
                  <option value="onfido">Onfido</option>
                </select>
              </div>

              {/* Address Proof */}
              <div className="p-4 bg-[var(--tp-surface-2)] rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--tp-fg)]">Address Proof Required</span>
                  <input
                    type="checkbox"
                    checked={region.opening.features.addressProofRequired}
                    onChange={(e) =>
                      updateRegionFeatures(selectedRegion, { addressProofRequired: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-[var(--tp-border)]"
                  />
                </div>
              </div>

              {/* Video KYC */}
              <div className="p-4 bg-[var(--tp-surface-2)] rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--tp-fg)]">Video KYC Required</span>
                  <input
                    type="checkbox"
                    checked={region.opening.features.videoKYCRequired}
                    onChange={(e) =>
                      updateRegionFeatures(selectedRegion, { videoKYCRequired: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-[var(--tp-border)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 默认等级 */}
          <div className="bg-[var(--tp-surface)] border border-[var(--tp-border)] rounded-xl p-6">
            <h4 className="font-semibold text-[var(--tp-fg)] mb-4">Default Tier on Complete</h4>
            <select
              value={region.opening.defaultTierOnComplete}
              onChange={(e) =>
                updateRegionOpening(selectedRegion, {
                  defaultTierOnComplete: parseInt(e.target.value) as 0 | 1 | 2 | 3 | 4,
                })
              }
              className="w-full px-3 py-2 bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg"
            >
              {config.tiers.map((tier) => (
                <option key={tier.level} value={tier.level}>
                  Tier {tier.level} - {tier.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-[var(--tp-fg-muted)] mt-2">
              Users will be assigned this KYC tier after completing the opening flow.
            </p>
          </div>
        </div>
      )}

      {/* KYC Upgrade Tab */}
      {activeRegionTab === "kyc" && (
        <div className="space-y-6">
          <div className="bg-[var(--tp-surface)] border border-[var(--tp-border)] rounded-xl p-6">
            <h4 className="font-semibold text-[var(--tp-fg)] mb-4">Upgrade Paths</h4>

            {Object.values(region.kyc.upgradePaths).flat().length === 0 ? (
              <div className="text-center py-8 text-[var(--tp-fg-muted)]">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No upgrade paths configured for this region.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(region.kyc.upgradePaths).flatMap(([fromTier, paths]) =>
                  paths.map((path, index) => (
                    <div
                      key={`${fromTier}-${index}`}
                      className="p-4 bg-[var(--tp-surface-2)] rounded-lg flex items-center gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-gray-500/10 rounded text-sm">
                          {tierNames[parseInt(fromTier)] || `Tier ${fromTier}`}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[var(--tp-fg-muted)]" />
                        <span className="px-2 py-1 bg-[var(--tp-accent)]/10 text-[var(--tp-accent)] rounded text-sm">
                          {tierNames[path.targetTier] || `Tier ${path.targetTier}`}
                        </span>
                      </div>
                      <div className="flex-1 text-sm text-[var(--tp-fg-muted)]">
                        Requires: {path.requiredStages.join(", ")}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            path.autoApprove
                              ? "bg-green-500/10 text-green-500"
                              : "bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {path.autoApprove ? "Auto" : "Manual"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Supplemental Tab */}
      {activeRegionTab === "supplemental" && (
        <div className="space-y-6">
          <div className="bg-[var(--tp-surface)] border border-[var(--tp-border)] rounded-xl p-6">
            <h4 className="font-semibold text-[var(--tp-fg)] mb-4">Supplemental KYC Rules</h4>

            {!region.kyc.supplementalTriggers.largeWithdrawal.enabled ? (
              <div className="text-center py-8 text-[var(--tp-fg-muted)]">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No supplemental rules configured.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {region.kyc.supplementalTriggers.largeWithdrawal.enabled && (
                  <div className="p-4 bg-[var(--tp-surface-2)] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[var(--tp-fg)]">
                        Large Withdrawal
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-500">
                        Enabled
                      </span>
                    </div>
                    {region.kyc.supplementalTriggers.largeWithdrawal.threshold && (
                      <div className="text-sm text-[var(--tp-fg-muted)]">
                        Threshold: ${region.kyc.supplementalTriggers.largeWithdrawal.threshold.toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
                {region.kyc.supplementalTriggers.riskScore?.enabled && (
                  <div className="p-4 bg-[var(--tp-surface-2)] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[var(--tp-fg)]">
                        Risk Score Based
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-500">
                        Enabled
                      </span>
                    </div>
                  </div>
                )}
                {region.kyc.supplementalTriggers.documentExpiry?.enabled && (
                  <div className="p-4 bg-[var(--tp-surface-2)] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[var(--tp-fg)]">
                        Document Expiry
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-500">
                        Enabled
                      </span>
                    </div>
                    <div className="text-sm text-[var(--tp-fg-muted)]">
                      Warning: {region.kyc.supplementalTriggers.documentExpiry.warningDays} days
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Stages Tab
// ============================================================

function StagesTab({
  config,
  onChange,
}: {
  config: UnifiedKYCConfig;
  onChange: (config: UnifiedKYCConfig) => void;
}) {
  const stages = Object.entries(config.stageDefinitions);

  const updateStage = (id: string, updates: Partial<StageConfig>) => {
    onChange({
      ...config,
      stageDefinitions: {
        ...config.stageDefinitions,
        [id]: { ...config.stageDefinitions[id as keyof typeof config.stageDefinitions], ...updates },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--tp-fg)]">Verification Stages</h3>
          <p className="text-sm text-[var(--tp-fg-muted)]">
            Define verification stages and their validation rules
          </p>
        </div>
        <div className="text-sm text-[var(--tp-fg-muted)]">
          {stages.length} stages defined
        </div>
      </div>

      <div className="space-y-4">
        {stages.map(([id, stage]) => (
          <div
            key={id}
            className="bg-[var(--tp-surface)] border border-[var(--tp-border)] rounded-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--tp-accent)]/10 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-[var(--tp-accent)]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--tp-fg)]">{stage.name}</h4>
                  <p className="text-sm text-[var(--tp-fg-muted)]">{stage.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    stage.enabled
                      ? "bg-green-500/10 text-green-500"
                      : "bg-gray-500/10 text-gray-500"
                  }`}
                >
                  {stage.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <label className="flex items-center gap-2 p-3 bg-[var(--tp-surface-2)] rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={stage.enabled}
                  onChange={(e) => updateStage(id, { enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-[var(--tp-border)]"
                />
                <span className="text-sm text-[var(--tp-fg)]">Enabled</span>
              </label>

              <label className="flex items-center gap-2 p-3 bg-[var(--tp-surface-2)] rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={stage.required}
                  onChange={(e) => updateStage(id, { required: e.target.checked })}
                  className="w-4 h-4 rounded border-[var(--tp-border)]"
                />
                <span className="text-sm text-[var(--tp-fg)]">Required</span>
              </label>

              <label className="flex items-center gap-2 p-3 bg-[var(--tp-surface-2)] rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={stage.autoApprove}
                  onChange={(e) => updateStage(id, { autoApprove: e.target.checked })}
                  className="w-4 h-4 rounded border-[var(--tp-border)]"
                />
                <span className="text-sm text-[var(--tp-fg)]">Auto Approve</span>
              </label>

              <div className="p-3 bg-[var(--tp-surface-2)] rounded-lg">
                <div className="text-xs text-[var(--tp-fg-muted)] mb-1">Max Attempts</div>
                <input
                  type="number"
                  value={stage.maxAttempts}
                  onChange={(e) => updateStage(id, { maxAttempts: parseInt(e.target.value) || 1 })}
                  className="w-full px-2 py-1 bg-[var(--tp-surface)] border border-[var(--tp-border)] rounded text-sm"
                />
              </div>
            </div>

            {stage.documents && stage.documents.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-[var(--tp-fg-muted)]">
                <span>Supported documents:</span>
                <div className="flex gap-1">
                  {stage.documents.map((doc) => (
                    <span
                      key={doc}
                      className="px-2 py-0.5 bg-[var(--tp-surface-2)] rounded text-xs"
                    >
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Tiers Tab
// ============================================================

function TiersTab({
  config,
  onChange,
}: {
  config: UnifiedKYCConfig;
  onChange: (config: UnifiedKYCConfig) => void;
}) {
  const updateTier = (level: number, updates: Partial<typeof config.tiers[0]>) => {
    onChange({
      ...config,
      tiers: config.tiers.map((t) => (t.level === level ? { ...t, ...updates } : t)),
    });
  };

  const toggleStage = (level: number, stageId: string) => {
    const tier = config.tiers.find((t) => t.level === level);
    if (!tier) return;

    const newStages = tier.requiredStages.includes(stageId as VerificationStage)
      ? tier.requiredStages.filter((s) => s !== stageId)
      : [...tier.requiredStages, stageId as VerificationStage];

    updateTier(level, { requiredStages: newStages });
  };

  const stageIds = Object.keys(config.stageDefinitions);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--tp-fg)]">KYC Tier System</h3>
          <p className="text-sm text-[var(--tp-fg-muted)]">
            Configure KYC tiers and their requirements
          </p>
        </div>
        <div className="text-sm text-[var(--tp-fg-muted)]">
          {config.tiers.length} tiers configured
        </div>
      </div>

      <div className="space-y-4">
        {config.tiers.map((tier) => (
          <div
            key={tier.level}
            className="bg-[var(--tp-surface)] border border-[var(--tp-border)] rounded-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: `var(--${tier.badge.color}-500, #6b7280)` }}
                >
                  {tier.level}
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--tp-fg)]">{tier.name}</h4>
                  <p className="text-sm text-[var(--tp-fg-muted)]">{tier.description}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-[var(--tp-fg)] mb-2">
                  Required Stages
                </div>
                <div className="flex flex-wrap gap-2">
                  {stageIds.map((stageId) => {
                    const stage = config.stageDefinitions[stageId as VerificationStage];
                    const isRequired = tier.requiredStages.includes(stageId as VerificationStage);
                    return (
                      <button
                        key={stageId}
                        onClick={() => toggleStage(tier.level, stageId)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          isRequired
                            ? "bg-[var(--tp-accent)]/10 text-[var(--tp-accent)] border border-[var(--tp-accent)]/30"
                            : "bg-[var(--tp-surface-2)] text-[var(--tp-fg-muted)] border border-[var(--tp-border)]"
                        }`}
                      >
                        {isRequired && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                        {stage.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--tp-border)]">
                <div>
                  <div className="text-xs text-[var(--tp-fg-muted)] mb-1">Daily Deposit Limit</div>
                  <input
                    type="text"
                    defaultValue="Unlimited"
                    className="w-full px-3 py-2 bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg text-sm"
                    readOnly
                  />
                </div>
                <div>
                  <div className="text-xs text-[var(--tp-fg-muted)] mb-1">Daily Withdrawal</div>
                  <input
                    type="text"
                    defaultValue="Unlimited"
                    className="w-full px-3 py-2 bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg text-sm"
                    readOnly
                  />
                </div>
                <div>
                  <div className="text-xs text-[var(--tp-fg-muted)] mb-1">Max Position</div>
                  <input
                    type="text"
                    defaultValue="Unlimited"
                    className="w-full px-3 py-2 bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg text-sm"
                    readOnly
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
// Permissions Tab
// ============================================================

function PermissionsTab({
  config,
  onChange,
}: {
  config: UnifiedKYCConfig;
  onChange: (config: UnifiedKYCConfig) => void;
}) {
  const permissions = config.tierPermissions;
  const tiers = config.tiers;

  const permissionLabels: Record<string, string> = {
    canDeposit: "Deposit",
    canWithdraw: "Withdraw",
    canTrade: "Trade",
    canUseLeverage: "Leverage",
    canAccessMargin: "Margin Trading",
    canUseAPI: "API Access",
    maxLeverage: "Max Leverage",
    dailyWithdrawalLimit: "Daily Withdrawal",
    maxPositionSize: "Max Position",
  };

  const updatePermission = (
    tierLevel: number,
    key: string,
    value: boolean | number
  ) => {
    onChange({
      ...config,
      tierPermissions: {
        ...permissions,
        [tierLevel]: {
          ...permissions[tierLevel as 0 | 1 | 2 | 3 | 4],
          [key]: value,
        },
      },
    });
  };

  const allKeys = Array.from(
    new Set(Object.values(permissions).flatMap((p) => Object.keys(p)))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--tp-fg)]">Permission Matrix</h3>
          <p className="text-sm text-[var(--tp-fg-muted)]">
            Configure permissions for each KYC tier
          </p>
        </div>
        <div className="text-sm text-[var(--tp-fg-muted)]">
          {Object.keys(permissions).length} tier permission sets
        </div>
      </div>

      <div className="bg-[var(--tp-surface)] border border-[var(--tp-border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--tp-surface-2)] border-b border-[var(--tp-border)]">
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--tp-fg)]">
                  Permission
                </th>
                {tiers.map((tier) => (
                  <th
                    key={tier.level}
                    className="px-4 py-3 text-center text-sm font-medium text-[var(--tp-fg)]"
                  >
                    <div className="flex flex-col items-center">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white mb-1"
                        style={{
                          backgroundColor: `var(--${tier.badge.color}-500, #6b7280)`,
                        }}
                      >
                        {tier.level}
                      </span>
                      <span className="text-xs text-[var(--tp-fg-muted)]">{tier.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allKeys.map((key) => (
                <tr key={key} className="border-b border-[var(--tp-border)] last:border-0">
                  <td className="px-4 py-3 text-sm text-[var(--tp-fg)]">
                    {permissionLabels[key] || key}
                  </td>
                  {tiers.map((tier) => {
                    const value = permissions[tier.level as 0 | 1 | 2 | 3 | 4]?.[key as keyof typeof permissions[0]];
                    const isBoolean = typeof value === "boolean";

                    return (
                      <td key={tier.level} className="px-4 py-3 text-center">
                        {isBoolean ? (
                          <button
                            onClick={() =>
                              updatePermission(tier.level, key, !value)
                            }
                            className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${
                              value
                                ? "bg-green-500/10 text-green-500"
                                : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            {value ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <AlertCircle className="w-5 h-5" />
                            )}
                          </button>
                        ) : (
                          <span className="text-sm text-[var(--tp-fg-muted)]">
                            {value !== undefined ? String(value) : "-"}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Settings Tab
// ============================================================

function SettingsTab({
  config,
  onChange,
}: {
  config: UnifiedKYCConfig;
  onChange: (config: UnifiedKYCConfig) => void;
}) {
  const updateGlobal = (updates: Partial<typeof config.global>) => {
    onChange({
      ...config,
      global: { ...config.global, ...updates },
    });
  };

  const updateMaintenanceMessage = (lang: string, value: string) => {
    onChange({
      ...config,
      global: {
        ...config.global,
        maintenanceMessage: {
          ...config.global.maintenanceMessage,
          [lang]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--tp-fg)]">Global Settings</h3>
        <p className="text-sm text-[var(--tp-fg-muted)]">
          Configure global KYC system settings
        </p>
      </div>

      {/* System Status */}
      <div className="bg-[var(--tp-surface)] border border-[var(--tp-border)] rounded-xl p-6">
        <h4 className="font-semibold text-[var(--tp-fg)] mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[var(--tp-accent)]" />
          System Status
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-4 bg-[var(--tp-surface-2)] rounded-lg cursor-pointer">
            <span className="text-[var(--tp-fg)]">System Enabled</span>
            <input
              type="checkbox"
              checked={config.global.enabled}
              onChange={(e) => updateGlobal({ enabled: e.target.checked })}
              className="w-5 h-5 rounded border-[var(--tp-border)]"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-[var(--tp-surface-2)] rounded-lg cursor-pointer">
            <span className="text-[var(--tp-fg)]">Maintenance Mode</span>
            <input
              type="checkbox"
              checked={config.global.maintenanceMode}
              onChange={(e) => updateGlobal({ maintenanceMode: e.target.checked })}
              className="w-5 h-5 rounded border-[var(--tp-border)]"
            />
          </label>
        </div>
      </div>

      {/* Default Settings */}
      <div className="bg-[var(--tp-surface)] border border-[var(--tp-border)] rounded-xl p-6">
        <h4 className="font-semibold text-[var(--tp-fg)] mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[var(--tp-accent)]" />
          Default Settings
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[var(--tp-fg-muted)] mb-2">
              Default Region
            </label>
            <select
              value={config.global.defaultRegion}
              onChange={(e) => updateGlobal({ defaultRegion: e.target.value as RegionCode })}
              className="w-full px-3 py-2 bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg"
            >
              {Object.keys(config.regions).map((code) => (
                <option key={code} value={code}>
                  {code} - {config.regions[code as RegionCode].name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--tp-fg-muted)] mb-2">
              Review Mode
            </label>
            <select
              value={config.global.reviewMode}
              onChange={(e) =>
                updateGlobal({ reviewMode: e.target.value as "auto" | "manual" | "hybrid" })
              }
              className="w-full px-3 py-2 bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg"
            >
              <option value="auto">Auto</option>
              <option value="manual">Manual</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--tp-fg-muted)] mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              value={config.global.sessionTimeout}
              onChange={(e) =>
                updateGlobal({ sessionTimeout: parseInt(e.target.value) || 30 })
              }
              className="w-full px-3 py-2 bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--tp-fg-muted)] mb-2">
              Max Retry Attempts
            </label>
            <input
              type="number"
              value={config.global.maxRetryAttempts}
              onChange={(e) =>
                updateGlobal({ maxRetryAttempts: parseInt(e.target.value) || 3 })
              }
              className="w-full px-3 py-2 bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Auto Approval */}
      <div className="bg-[var(--tp-surface)] border border-[var(--tp-border)] rounded-xl p-6">
        <h4 className="font-semibold text-[var(--tp-fg)] mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[var(--tp-accent)]" />
          Auto Approval
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-4 bg-[var(--tp-surface-2)] rounded-lg cursor-pointer">
            <span className="text-[var(--tp-fg)]">Auto Approval Enabled</span>
            <input
              type="checkbox"
              checked={config.global.autoApprovalEnabled}
              onChange={(e) => updateGlobal({ autoApprovalEnabled: e.target.checked })}
              className="w-5 h-5 rounded border-[var(--tp-border)]"
            />
          </label>

          <div>
            <label className="block text-sm text-[var(--tp-fg-muted)] mb-2">
              Approval Threshold (score)
            </label>
            <input
              type="number"
              value={config.global.autoApprovalThreshold}
              onChange={(e) =>
                updateGlobal({ autoApprovalThreshold: parseInt(e.target.value) || 30 })
              }
              disabled={!config.global.autoApprovalEnabled}
              className="w-full px-3 py-2 bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Maintenance Message */}
      {config.global.maintenanceMode && (
        <div className="bg-[var(--tp-surface)] border border-[var(--tp-border)] rounded-xl p-6">
          <h4 className="font-semibold text-[var(--tp-fg)] mb-4">Maintenance Message</h4>

          <div className="space-y-3">
            {Object.entries(config.global.maintenanceMessage).map(([lang, message]) => (
              <div key={lang}>
                <label className="block text-xs text-[var(--tp-fg-muted)] mb-1 uppercase">
                  {lang}
                </label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => updateMaintenanceMessage(lang, e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--tp-surface-2)] border border-[var(--tp-border)] rounded-lg text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
