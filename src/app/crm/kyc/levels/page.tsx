"use client";

import { useState } from "react";
import { Shield, ArrowUp, ArrowDown, Check, Lock } from "lucide-react";
import { Card, PageHeader } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";

const levels = [
  { id: "tier0", name: "Tier 0", label: "Basic", color: "bg-slate-100 text-slate-700", requiredSteps: ["Region"], permissions: ["View Markets"], userCount: 3 },
  { id: "tier1", name: "Tier 1", label: "Standard", color: "bg-blue-100 text-blue-700", requiredSteps: ["Region", "Document", "Liveness"], permissions: ["View", "Deposit", "Trade", "Withdraw (up to $10k/day)"], userCount: 2 },
  { id: "tier2", name: "Tier 2", label: "Enhanced", color: "bg-violet-100 text-violet-700", requiredSteps: ["Region", "Document", "Liveness", "POA"], permissions: ["View", "Deposit", "Trade", "Withdraw (up to $100k/day)", "Leverage 1:200"], userCount: 0 },
  { id: "tier3", name: "Tier 3", label: "Professional", color: "bg-amber-100 text-amber-700", requiredSteps: ["Region", "Document", "Liveness", "POA", "Experience", "Agreements"], permissions: ["Full Access", "Leverage 1:500", "Copy Trading", "API Access"], userCount: 0 },
  { id: "tier4", name: "Tier 4", label: "Institutional", color: "bg-emerald-100 text-emerald-700", requiredSteps: ["All Steps + Video KYC"], permissions: ["Institutional Access", "Custom Leverage", "Priority Support", "Dedicated Account Manager"], userCount: 1 },
];

export default function KYCLevelsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "KYC Center" }, { label: "KYC Levels" }]} />
      <PageHeader title="KYC Levels" description="Define KYC tiers, requirements, and permission mappings" />

      <div className="space-y-3">
        {levels.map(lvl => (
          <Card key={lvl.id} className={`!p-5 cursor-pointer ${expanded === lvl.id ? "ring-2 ring-blue-200" : ""}`}
            onClick={() => setExpanded(expanded === lvl.id ? null : lvl.id)}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lvl.color.split(" ")[0]}`}>
                <Shield size={20} className={lvl.color.split(" ")[1]} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{lvl.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${lvl.color}`}>{lvl.label}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{lvl.requiredSteps.length} steps required · {lvl.userCount} users</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">{lvl.userCount}</p>
                <p className="text-xs text-slate-400">users</p>
              </div>
            </div>
            {expanded === lvl.id && (
              <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3">
                <div>
                  <h4 className="text-xs font-medium text-slate-500 mb-2">Required Steps</h4>
                  {lvl.requiredSteps.map(s => (
                    <div key={s} className="flex items-center gap-2 text-sm text-slate-700 py-0.5"><Check size={14} className="text-emerald-500" /> {s}</div>
                  ))}
                </div>
                <div>
                  <h4 className="text-xs font-medium text-slate-500 mb-2">Permissions</h4>
                  {lvl.permissions.map(p => (
                    <div key={p} className="flex items-center gap-2 text-sm text-slate-700 py-0.5"><Lock size={14} className="text-slate-400" /> {p}</div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
