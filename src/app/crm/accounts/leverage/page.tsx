"use client";

import { useState } from "react";
import {
  Gauge,
  Search,
  Save,
  AlertTriangle,
  Shield,
  TrendingUp,
  X,
  Info,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { cn } from "@/lib/utils";

// Types
interface LeverageRule {
  id: string;
  groupName: string;
  instrumentType: string;
  maxLeverage: number;
  defaultLeverage: number;
  riskLevel: "low" | "medium" | "high" | "extreme";
  minBalance?: number;
  maxBalance?: number;
  isActive: boolean;
}

// Mock data
const mockRules: LeverageRule[] = [
  { id: "LR001", groupName: "Standard", instrumentType: "Forex", maxLeverage: 500, defaultLeverage: 100, riskLevel: "medium", isActive: true },
  { id: "LR002", groupName: "Standard", instrumentType: "Crypto", maxLeverage: 20, defaultLeverage: 10, riskLevel: "high", isActive: true },
  { id: "LR003", groupName: "Standard", instrumentType: "Indices", maxLeverage: 100, defaultLeverage: 50, riskLevel: "medium", isActive: true },
  { id: "LR004", groupName: "Standard", instrumentType: "Commodities", maxLeverage: 50, defaultLeverage: 20, riskLevel: "medium", isActive: true },
  { id: "LR005", groupName: "ECN Pro", instrumentType: "Forex", maxLeverage: 200, defaultLeverage: 100, riskLevel: "medium", isActive: true },
  { id: "LR006", groupName: "ECN Pro", instrumentType: "Crypto", maxLeverage: 10, defaultLeverage: 5, riskLevel: "high", isActive: true },
  { id: "LR007", groupName: "ECN Pro", instrumentType: "Stocks", maxLeverage: 20, defaultLeverage: 10, riskLevel: "high", isActive: true },
  { id: "LR008", groupName: "VIP", instrumentType: "Forex", maxLeverage: 1000, defaultLeverage: 200, riskLevel: "extreme", minBalance: 100000, isActive: true },
  { id: "LR009", groupName: "VIP", instrumentType: "Crypto", maxLeverage: 50, defaultLeverage: 20, riskLevel: "high", minBalance: 100000, isActive: true },
  { id: "LR010", groupName: "Islamic", instrumentType: "Forex", maxLeverage: 500, defaultLeverage: 100, riskLevel: "medium", isActive: true },
  { id: "LR011", groupName: "Cent", instrumentType: "Forex", maxLeverage: 1000, defaultLeverage: 500, riskLevel: "extreme", maxBalance: 5000, isActive: true },
];

const riskConfig = {
  low: { label: "低风险", color: "text-emerald-600", bg: "bg-emerald-100", bar: "bg-emerald-500" },
  medium: { label: "中风险", color: "text-blue-600", bg: "bg-blue-100", bar: "bg-blue-500" },
  high: { label: "高风险", color: "text-amber-600", bg: "bg-amber-100", bar: "bg-amber-500" },
  extreme: { label: "极高风险", color: "text-red-600", bg: "bg-red-100", bar: "bg-red-500" },
};

export default function LeverageSettingsPage() {
  const [rules, setRules] = useState<LeverageRule[]>(mockRules);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRule, setEditingRule] = useState<LeverageRule | null>(null);

  const groups = Array.from(new Set(rules.map((r) => r.groupName)));

  const filteredRules = rules.filter((r) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.groupName.toLowerCase().includes(q) || r.instrumentType.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: rules.length,
    active: rules.filter((r) => r.isActive).length,
    highRisk: rules.filter((r) => r.riskLevel === "high" || r.riskLevel === "extreme").length,
    maxLeverage: Math.max(...rules.map((r) => r.maxLeverage)),
  };

  const handleSave = () => {
    if (!editingRule) return;
    setRules((prev) => prev.map((r) => (r.id === editingRule.id ? editingRule : r)));
    setEditingRule(null);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "账户" }, { label: "杠杆设置" }]} />

      <PageHeader
        title="杠杆设置"
        description="配置各账户分组和品种的最大杠杆倍数"
        actions={
          <Button>
            <Save className="w-4 h-4" />
            保存所有更改
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-500">规则数</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
              <p className="text-sm text-gray-500">已启用</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.highRisk}</p>
              <p className="text-sm text-gray-500">高风险规则</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-violet-600">1:{stats.maxLeverage}</p>
              <p className="text-sm text-gray-500">最高杠杆</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Alert */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">风险提示</p>
          <p className="text-sm text-amber-700 mt-0.5">
            修改杠杆设置将影响所有新开户和新订单。已开仓订单的杠杆不会自动变更。
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索分组或品种..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Rules Table */}
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">分组</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">品种</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-right">最大杠杆</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-right">默认杠杆</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">风险等级</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">资金限制</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">状态</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase w-20">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRules.map((rule) => {
              const risk = riskConfig[rule.riskLevel];
              return (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{rule.groupName}</td>
                  <td className="px-4 py-3 text-sm">{rule.instrumentType}</td>
                  <td className="px-4 py-3 text-sm font-mono font-medium text-right">1:{rule.maxLeverage}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500 text-right">1:{rule.defaultLeverage}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center px-2 py-1 rounded-md text-xs font-medium", risk.bg, risk.color)}>
                      {risk.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {rule.minBalance ? `≥$${rule.minBalance.toLocaleString()}` : ""}
                    {rule.maxBalance ? `≤$${rule.maxBalance.toLocaleString()}` : ""}
                    {!rule.minBalance && !rule.maxBalance && "-"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, isActive: !r.isActive } : r)))}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors relative",
                        rule.isActive ? "bg-blue-600" : "bg-gray-300"
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform",
                          rule.isActive ? "translate-x-5" : "translate-x-0.5"
                        )}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditingRule(rule)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Gauge className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingRule && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setEditingRule(null)} />
          <div className="fixed inset-x-4 top-[10%] max-w-md mx-auto bg-white rounded-xl shadow-2xl z-50">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">编辑杠杆规则</h2>
                <p className="text-sm text-gray-500">{editingRule.groupName} - {editingRule.instrumentType}</p>
              </div>
              <button onClick={() => setEditingRule(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最大杠杆</label>
                <select
                  value={editingRule.maxLeverage}
                  onChange={(e) => setEditingRule({ ...editingRule, maxLeverage: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[10, 20, 50, 100, 200, 300, 500, 1000].map((v) => (
                    <option key={v} value={v}>1:{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">默认杠杆</label>
                <select
                  value={editingRule.defaultLeverage}
                  onChange={(e) => setEditingRule({ ...editingRule, defaultLeverage: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[10, 20, 50, 100, 200, 300, 500, 1000].map((v) => (
                    <option key={v} value={v}>1:{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">风险等级</label>
                <select
                  value={editingRule.riskLevel}
                  onChange={(e) => setEditingRule({ ...editingRule, riskLevel: e.target.value as LeverageRule["riskLevel"] })}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">低风险</option>
                  <option value="medium">中风险</option>
                  <option value="high">高风险</option>
                  <option value="extreme">极高风险</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 p-6 border-t bg-gray-50">
              <Button className="flex-1" onClick={handleSave}>
                <Save className="w-4 h-4" />
                保存
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setEditingRule(null)}>
                取消
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
