"use client";

import { useState } from "react";
import {
  Settings,
  Save,
  Layers,
  Percent,
  DollarSign,
  AlertTriangle,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { cn } from "@/lib/utils";

// Types
interface CommissionTier {
  id: string;
  level: "L1" | "L2" | "L3" | "Platform";
  productType: string;
  rate: number;
  minVolume: number;
  maxVolume?: number;
  isActive: boolean;
}

// Mock data
const mockTiers: CommissionTier[] = [
  { id: "CT001", level: "L1", productType: "Forex", rate: 8, minVolume: 0, isActive: true },
  { id: "CT002", level: "L1", productType: "Crypto", rate: 10, minVolume: 0, isActive: true },
  { id: "CT003", level: "L1", productType: "Indices", rate: 6, minVolume: 0, isActive: true },
  { id: "CT004", level: "L1", productType: "Commodities", rate: 7, minVolume: 0, isActive: true },
  { id: "CT005", level: "L2", productType: "Forex", rate: 4, minVolume: 0, isActive: true },
  { id: "CT006", level: "L2", productType: "Crypto", rate: 5, minVolume: 0, isActive: true },
  { id: "CT007", level: "L2", productType: "Indices", rate: 3, minVolume: 0, isActive: true },
  { id: "CT008", level: "L3", productType: "Forex", rate: 2, minVolume: 0, isActive: true },
  { id: "CT009", level: "L3", productType: "Crypto", rate: 2.5, minVolume: 0, isActive: true },
  { id: "CT010", level: "Platform", productType: "Forex", rate: 12, minVolume: 0, isActive: true },
  { id: "CT011", level: "Platform", productType: "Crypto", rate: 15, minVolume: 0, isActive: true },
];

const levelConfig = {
  L1: { label: "L1", color: "text-blue-600", bg: "bg-blue-100" },
  L2: { label: "L2", color: "text-violet-600", bg: "bg-violet-100" },
  L3: { label: "L3", color: "text-amber-600", bg: "bg-amber-100" },
  Platform: { label: "平台", color: "text-emerald-600", bg: "bg-emerald-100" },
};

export default function IBCommissionSettingsPage() {
  const [tiers, setTiers] = useState<CommissionTier[]>(mockTiers);
  const [hasChanges, setHasChanges] = useState(false);

  const levels: CommissionTier["level"][] = ["L1", "L2", "L3", "Platform"];
  const productTypes = Array.from(new Set(tiers.map((t) => t.productType)));

  const updateRate = (id: string, rate: number) => {
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, rate } : t)));
    setHasChanges(true);
  };

  const toggleTier = (id: string) => {
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t)));
    setHasChanges(true);
  };

  const handleSave = () => {
    // TODO: implement commission settings save
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "IB / Commission" }, { label: "返佣设置" }]} />

      <PageHeader
        title="返佣设置"
        description="配置IB层级返佣比例和产品分组"
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
            <p className="text-sm text-amber-700 mt-0.5">修改返佣比例后请保存，变更将即时生效。</p>
          </div>
        </div>
      )}

      {/* Commission Matrix */}
      <Card className="!p-0 overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold">返佣比例矩阵</h3>
            <span className="text-xs text-gray-500">（单位：$/lot）</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">层级</th>
                {productTypes.map((pt) => (
                  <th key={pt} className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-center">
                    {pt}
                  </th>
                ))}
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-center">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {levels.map((level) => {
                const levelTiers = tiers.filter((t) => t.level === level);
                const cfg = levelConfig[level];
                return (
                  <tr key={level} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold", cfg.bg, cfg.color)}>
                        {cfg.label}
                      </span>
                    </td>
                    {productTypes.map((pt) => {
                      const tier = levelTiers.find((t) => t.productType === pt);
                      return (
                        <td key={pt} className="px-4 py-3 text-center">
                          {tier ? (
                            <div className="flex items-center justify-center gap-2">
                              <DollarSign className="w-3 h-3 text-gray-400" />
                              <input
                                type="number"
                                value={tier.rate}
                                onChange={(e) => updateRate(tier.id, Number(e.target.value))}
                                className="w-16 h-8 text-center rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                step="0.5"
                              />
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {levelTiers.map((tier) => (
                          <button
                            key={tier.id}
                            onClick={() => toggleTier(tier.id)}
                            className={cn(
                              "w-8 h-4 rounded-full transition-colors relative",
                              tier.isActive ? "bg-blue-600" : "bg-gray-300"
                            )}
                          >
                            <div
                              className={cn(
                                "w-3.5 h-3.5 bg-white rounded-full absolute top-0.25 transition-transform",
                                tier.isActive ? "translate-x-4" : "translate-x-0.25"
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {levels.map((level) => {
          const cfg = levelConfig[level];
          const levelTiers = tiers.filter((t) => t.level === level);
          const avgRate = (levelTiers.reduce((acc, t) => acc + t.rate, 0) / levelTiers.length).toFixed(1);
          return (
            <Card key={level} className="!p-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", cfg.bg)}>
                  <Percent className={cn("w-5 h-5", cfg.color)} />
                </div>
                <div>
                  <p className={cn("text-2xl font-bold", cfg.color)}>${avgRate}</p>
                  <p className="text-sm text-gray-500">{cfg.label} 平均返佣</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
