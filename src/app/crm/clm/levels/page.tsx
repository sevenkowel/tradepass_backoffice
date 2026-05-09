"use client";

import { useState } from "react";
import { Shield, Lock, Eye, Wallet, TrendingUp, Check, ArrowUpDown } from "lucide-react";
import { Card, PageHeader } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";

const levels = [
  {
    id: "tier0",
    name: "Tier 0",
    label: "Registered",
    color: "bg-slate-100 text-slate-700",
    requiredSteps: ["Region Selection"],
    userCount: 12,
  },
  {
    id: "tier1",
    name: "Tier 1",
    label: "Basic",
    color: "bg-blue-100 text-blue-700",
    requiredSteps: ["Region", "Document Upload", "Liveness"],
    userCount: 45,
  },
  {
    id: "tier2",
    name: "Tier 2",
    label: "Standard",
    color: "bg-violet-100 text-violet-700",
    requiredSteps: ["Region", "Document", "Liveness", "POA"],
    userCount: 28,
  },
  {
    id: "tier3",
    name: "Tier 3",
    label: "Complete",
    color: "bg-amber-100 text-amber-700",
    requiredSteps: ["Region", "Document", "Liveness", "POA", "Experience", "Agreements"],
    userCount: 67,
  },
  {
    id: "tier4",
    name: "Tier 4",
    label: "VIP",
    color: "bg-emerald-100 text-emerald-700",
    requiredSteps: ["All Steps + Video KYC + EDD"],
    userCount: 8,
  },
];

const permissions = [
  { key: "view_market", label: "View Market" },
  { key: "create_demo", label: "Create Demo Account" },
  { key: "submit_kyc", label: "Submit KYC" },
  { key: "create_real", label: "Create Real Account" },
  { key: "deposit", label: "Deposit" },
  { key: "withdraw", label: "Withdraw" },
  { key: "add_account", label: "Add Trading Account" },
  { key: "high_leverage", label: "High Leverage" },
  { key: "auto_withdrawal", label: "Auto Withdrawal" },
  { key: "copy_trading", label: "Copy Trading" },
  { key: "api_access", label: "API Access" },
];

const permissionMatrix: Record<string, Record<string, string>> = {
  tier0: { view_market: "Yes", create_demo: "Yes", submit_kyc: "Yes", create_real: "No", deposit: "No", withdraw: "No", add_account: "No", high_leverage: "No", auto_withdrawal: "No", copy_trading: "No", api_access: "No" },
  tier1: { view_market: "Yes", create_demo: "Yes", submit_kyc: "Yes", create_real: "Limited", deposit: "Limited", withdraw: "No", add_account: "No", high_leverage: "No", auto_withdrawal: "No", copy_trading: "No", api_access: "No" },
  tier2: { view_market: "Yes", create_demo: "Yes", submit_kyc: "Yes", create_real: "Yes", deposit: "Yes", withdraw: "Limited", add_account: "Limited", high_leverage: "No", auto_withdrawal: "No", copy_trading: "No", api_access: "No" },
  tier3: { view_market: "Yes", create_demo: "Yes", submit_kyc: "Yes", create_real: "Yes", deposit: "Yes", withdraw: "Yes", add_account: "Yes", high_leverage: "Limited", auto_withdrawal: "Yes", copy_trading: "Yes", api_access: "No" },
  tier4: { view_market: "Yes", create_demo: "Yes", submit_kyc: "Yes", create_real: "Yes", deposit: "Yes", withdraw: "Yes", add_account: "Yes", high_leverage: "Yes", auto_withdrawal: "Yes", copy_trading: "Yes", api_access: "Yes" },
};

export default function KYCLevelsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "KYC Levels" }]} />
      <PageHeader
        title="KYC Levels"
        description="Customer tiers, requirements, and permission mappings"
      />

      {/* Level Cards */}
      <div className="space-y-3">
        {levels.map((lvl) => (
          <Card
            key={lvl.id}
            className={`!p-5 cursor-pointer transition-all ${expanded === lvl.id ? "ring-2 ring-blue-200" : ""}`}
            onClick={() => setExpanded(expanded === lvl.id ? null : lvl.id)}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lvl.color.split(" ")[0]}`}>
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{lvl.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${lvl.color}`}>{lvl.label}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{lvl.requiredSteps.length} steps required</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{lvl.userCount}</p>
                <p className="text-xs text-gray-400">users</p>
              </div>
            </div>

            {expanded === lvl.id && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Required Steps</h4>
                  <div className="flex flex-wrap gap-2">
                    {lvl.requiredSteps.map((s) => (
                      <span key={s} className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg text-xs text-gray-700">
                        <Check className="w-3 h-3 text-emerald-500" /> {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Permission Matrix */}
      <Card>
        <h3 className="text-base font-semibold text-gray-900 mb-4">Permission Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Permission</th>
                {levels.map((lvl) => (
                  <th key={lvl.id} className="text-center py-2 px-3 text-xs font-medium text-gray-500">{lvl.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((perm) => (
                <tr key={perm.key} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 text-gray-700">{perm.label}</td>
                  {levels.map((lvl) => {
                    const value = permissionMatrix[lvl.id][perm.key];
                    return (
                      <td key={lvl.id} className="py-2 px-3 text-center">
                        <span className={`text-xs font-medium ${
                          value === "Yes" ? "text-emerald-600" :
                          value === "No" ? "text-gray-300" :
                          "text-amber-600"
                        }`}>
                          {value === "Yes" ? "Yes" : value === "No" ? "—" : "Limited"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
