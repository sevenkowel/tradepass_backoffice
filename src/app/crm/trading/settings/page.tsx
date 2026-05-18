"use client";

import { useState } from "react";
import {
  Settings,
  Save,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  Shield,
  CheckCircle,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { cn } from "@/lib/utils";

// Types
interface TradingSetting {
  id: string;
  category: "general" | "execution" | "risk" | "fees";
  name: string;
  description: string;
  value: string | number | boolean;
  type: "text" | "number" | "toggle" | "select";
  options?: string[];
  unit?: string;
  isImportant: boolean;
}

// Mock data
const mockSettings: TradingSetting[] = [
  {
    id: "TS001",
    category: "general",
    name: "最小订单量",
    description: "单笔交易的最小手数",
    value: 0.01,
    type: "number",
    unit: "lot",
    isImportant: false,
  },
  {
    id: "TS002",
    category: "general",
    name: "最大订单量",
    description: "单笔交易的最大手数",
    value: 100,
    type: "number",
    unit: "lot",
    isImportant: false,
  },
  {
    id: "TS003",
    category: "general",
    name: "订单量步长",
    description: "交易量递增的最小单位",
    value: 0.01,
    type: "number",
    unit: "lot",
    isImportant: false,
  },
  {
    id: "TS004",
    category: "execution",
    name: "执行模式",
    description: "订单执行方式",
    value: "Market Execution",
    type: "select",
    options: ["Market Execution", "Instant Execution", "Request Execution"],
    isImportant: true,
  },
  {
    id: "TS005",
    category: "execution",
    name: "允许对冲",
    description: "是否允许同一品种同时持有多空仓位",
    value: true,
    type: "toggle",
    isImportant: false,
  },
  {
    id: "TS006",
    category: "execution",
    name: "允许剥头皮",
    description: "是否允许高频短线交易",
    value: true,
    type: "toggle",
    isImportant: false,
  },
  {
    id: "TS007",
    category: "risk",
    name: "保证金追加通知",
    description: "保证金水平低于此值时发送通知",
    value: 100,
    type: "number",
    unit: "%",
    isImportant: true,
  },
  {
    id: "TS008",
    category: "risk",
    name: "强制平仓水平",
    description: "保证金水平低于此值时强制平仓",
    value: 50,
    type: "number",
    unit: "%",
    isImportant: true,
  },
  {
    id: "TS009",
    category: "risk",
    name: "负余额保护",
    description: "启用负余额保护，防止账户余额为负",
    value: true,
    type: "toggle",
    isImportant: true,
  },
  {
    id: "TS010",
    category: "fees",
    name: "隔夜利息计算方式",
    description: "隔夜利息的计算方法",
    value: "Points",
    type: "select",
    options: ["Points", "Percentage", "Money"],
    isImportant: false,
  },
  {
    id: "TS011",
    category: "fees",
    name: "周三三倍隔夜利息",
    description: "周三收取三倍隔夜利息以覆盖周末",
    value: true,
    type: "toggle",
    isImportant: false,
  },
  {
    id: "TS012",
    category: "fees",
    name: "伊斯兰账户免隔夜利息",
    description: "伊斯兰账户是否免除隔夜利息",
    value: true,
    type: "toggle",
    isImportant: false,
  },
];

const categoryConfig = {
  general: { label: "通用", icon: Settings, color: "text-blue-600", bg: "bg-blue-100" },
  execution: { label: "执行", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100" },
  risk: { label: "风控", icon: Shield, color: "text-red-600", bg: "bg-red-100" },
  fees: { label: "费用", icon: DollarSign, color: "text-amber-600", bg: "bg-amber-100" },
};

export default function TradingSettingsPage() {
  const [settings, setSettings] = useState<TradingSetting[]>(mockSettings);
  const [activeCategory, setActiveCategory] = useState<TradingSetting["category"]>("general");
  const [hasChanges, setHasChanges] = useState(false);

  const filteredSettings = settings.filter((s) => s.category === activeCategory);

  const updateSetting = (id: string, value: string | number | boolean) => {
    setSettings((prev) => prev.map((s) => (s.id === id ? { ...s, value } : s)));
    setHasChanges(true);
  };

  const handleSave = () => {
    // TODO: implement trading settings save
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Trading" }, { label: "交易设置" }]} />

      <PageHeader
        title="交易设置"
        description="配置交易规则、点差、隔夜利息和执行参数"
        actions={
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="w-4 h-4" />
            保存更改
          </Button>
        }
      />

      {hasChanges && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">未保存的更改</p>
            <p className="text-sm text-amber-700 mt-0.5">您有未保存的更改，点击"保存更改"按钮应用。</p>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl w-fit">
        {(Object.keys(categoryConfig) as TradingSetting["category"][]).map((cat) => {
          const cfg = categoryConfig[cat];
          const Icon = cfg.icon;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                activeCategory === cat
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Icon className="w-4 h-4" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Settings List */}
      <div className="space-y-3">
        {filteredSettings.map((setting) => {
          const cfg = categoryConfig[setting.category];
          return (
            <Card key={setting.id} className={cn("!p-4", setting.isImportant && "border-l-4 border-l-red-400")}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">{setting.name}</h3>
                    {setting.isImportant && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-medium">
                        重要
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{setting.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {setting.type === "toggle" && (
                    <button
                      onClick={() => updateSetting(setting.id, !setting.value)}
                      className={cn(
                        "w-11 h-6 rounded-full transition-colors relative",
                        setting.value ? "bg-blue-600" : "bg-gray-300"
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm",
                          setting.value ? "translate-x-5.5" : "translate-x-0.5"
                        )}
                      />
                    </button>
                  )}

                  {setting.type === "number" && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={setting.value as number}
                        onChange={(e) => updateSetting(setting.id, Number(e.target.value))}
                        className="w-24 h-9 px-3 text-right rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {setting.unit && (
                        <span className="text-sm text-gray-500">{setting.unit}</span>
                      )}
                    </div>
                  )}

                  {setting.type === "text" && (
                    <input
                      type="text"
                      value={setting.value as string}
                      onChange={(e) => updateSetting(setting.id, e.target.value)}
                      className="w-48 h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}

                  {setting.type === "select" && setting.options && (
                    <select
                      value={setting.value as string}
                      onChange={(e) => updateSetting(setting.id, e.target.value)}
                      className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {setting.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Category Legend */}
      <div className="flex items-center gap-4 pt-4 border-t">
        <p className="text-sm text-gray-500">分类说明：</p>
        {(Object.keys(categoryConfig) as TradingSetting["category"][]).map((cat) => {
          const cfg = categoryConfig[cat];
          const Icon = cfg.icon;
          return (
            <div key={cat} className="flex items-center gap-1.5">
              <Icon className={cn("w-4 h-4", cfg.color)} />
              <span className="text-sm text-gray-600">{cfg.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
