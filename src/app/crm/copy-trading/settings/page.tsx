"use client";

import { useState } from "react";
import { PageHeader, Button } from "@/components/crm/ui";
import { Settings, Save, RotateCcw } from "lucide-react";
import { mockCopySettings } from "@/lib/backoffice/mock-copy-trading";
import type { CopySettings } from "@/types/backoffice";

export default function CopySettingsPage() {
  const [settings, setSettings] = useState<CopySettings>(mockCopySettings);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateField = <K extends keyof CopySettings>(key: K, value: CopySettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-5">{children}</div>
    </div>
  );

  const Field = ({
    label,
    description,
    children,
  }: {
    label: string;
    description?: string;
    children: React.ReactNode;
  }) => (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="w-64">{children}</div>
    </div>
  );

  return (
    <div className="p-6">
      <PageHeader
        title="Copy Trading Settings"
        description="Configure global copy trading parameters"
        actions={
          <>
            <Button variant="secondary" onClick={() => setSettings(mockCopySettings)}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            <Button variant="primary" onClick={handleSave}>
              <Save className="w-4 h-4 mr-1" />
              {saved ? "Saved!" : "Save Changes"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Section title="Follow Mode">
          <Field label="Default Follow Mode" description="How followers replicate trades by default">
            <select
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings.followMode}
              onChange={(e) => updateField("followMode", e.target.value as "fixed" | "ratio" | "mirror")}
            >
              <option value="ratio">Ratio</option>
              <option value="fixed">Fixed Lots</option>
              <option value="mirror">Mirror</option>
            </select>
          </Field>
          <Field label="Default Ratio" description="Default follow ratio for new followers">
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={0.01}
                min={0.01}
                max={1}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings.defaultRatio}
                onChange={(e) => updateField("defaultRatio", parseFloat(e.target.value))}
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </Field>
          <Field label="Minimum Follow Amount" description="Minimum capital required to follow">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">$</span>
              <input
                type="number"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings.minFollowAmount}
                onChange={(e) => updateField("minFollowAmount", parseFloat(e.target.value))}
              />
            </div>
          </Field>
        </Section>

        <Section title="Risk Control">
          <Field label="Max Positions" description="Maximum open positions per follower">
            <input
              type="number"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings.maxPositions}
              onChange={(e) => updateField("maxPositions", parseInt(e.target.value))}
            />
          </Field>
          <Field label="Stop Loss (%)">
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings.stopLossPercent}
                onChange={(e) => updateField("stopLossPercent", parseFloat(e.target.value))}
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </Field>
          <Field label="Forced Close (%)">
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings.forcedClosePercent}
                onChange={(e) => updateField("forcedClosePercent", parseFloat(e.target.value))}
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </Field>
        </Section>

        <Section title="Profit Sharing">
          <Field label="Platform Share" description="Platform commission percentage">
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings.platformShare}
                onChange={(e) => updateField("platformShare", parseFloat(e.target.value))}
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </Field>
          <Field label="Trader Share">
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings.traderShare}
                onChange={(e) => updateField("traderShare", parseFloat(e.target.value))}
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </Field>
          <Field label="Follower Share">
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings.followerShare}
                onChange={(e) => updateField("followerShare", parseFloat(e.target.value))}
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </Field>
        </Section>

        <Section title="Advanced">
          <Field label="Min Follower Balance">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">$</span>
              <input
                type="number"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings.minFollowerBalance}
                onChange={(e) => updateField("minFollowerBalance", parseFloat(e.target.value))}
              />
            </div>
          </Field>
          <Field label="Allow Pause" description="Followers can pause copying">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowPause}
                onChange={(e) => updateField("allowPause", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enabled</span>
            </label>
          </Field>
          <Field label="Auto Stop Loss" description="Auto-close on stop loss hit">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoStopLoss}
                onChange={(e) => updateField("autoStopLoss", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enabled</span>
            </label>
          </Field>
        </Section>
      </div>
    </div>
  );
}
