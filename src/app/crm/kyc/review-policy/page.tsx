"use client";

import { useState } from "react";
import { Settings, Gauge, Users, Clock, Play } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";

type Tab = "auto" | "manual";

const thresholds = [
  { label: "OCR Confidence - Auto Approve", value: 0.9, unit: "≥ 90%" },
  { label: "OCR Confidence - Manual Review", value: 0.7, unit: "70-89%" },
  { label: "OCR Confidence - Auto Reject", value: 0.7, unit: "< 70%" },
  { label: "Liveness Score - Auto Approve", value: 0.85, unit: "≥ 85%" },
];

const routingRules = [
  { condition: "Region IN/AE/JP/FR/ES", action: "Force manual review (Enhanced KYC)" },
  { condition: "Risk score ≥ 70", action: "Route to senior reviewer" },
  { condition: "VIP level", action: "Priority review queue" },
  { condition: "AML hit", action: "Route to compliance officer" },
];

const slaConfig = [
  { level: "Standard", time: "24 hours", escalation: "48 hours" },
  { level: "Priority", time: "4 hours", escalation: "8 hours" },
  { level: "Urgent", time: "1 hour", escalation: "2 hours" },
];

export default function ReviewPolicyPage() {
  const [tab, setTab] = useState<Tab>("auto");

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "KYC Center" }, { label: "Review Policy" }]} />
      <PageHeader title="Review Policy" description="Auto-review thresholds and manual routing configuration"
        actions={<Button variant="secondary"><Play size={16} /> Simulate</Button>}
      />

      <div className="flex bg-slate-100 rounded-lg p-1 w-fit mb-4">
        {(["auto","manual"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${tab === t ? "bg-white shadow text-blue-700" : "text-slate-600"}`}>
            {t === "auto" ? "Auto Review" : "Manual Routing & SLA"}
          </button>
        ))}
      </div>

      {tab === "auto" ? (
        <div className="space-y-3">
          {thresholds.map((t, i) => (
            <Card key={i} className="!p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Gauge size={18} className="text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t.label}</p>
                    <p className="text-xs text-slate-500">Threshold: {t.unit}</p>
                  </div>
                </div>
                <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${t.value >= 0.9 ? "bg-emerald-500" : t.value >= 0.7 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${t.value * 100}%` }} />
                </div>
                <span className="text-sm font-mono text-slate-600">{t.value}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="!p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2"><Users size={16} /> Routing Rules</h3>
            {routingRules.map((r, i) => (
              <div key={i} className="flex items-center gap-2 py-2 border-b last:border-0 text-sm">
                <span className="font-mono text-blue-600 w-48">{r.condition}</span>
                <span className="text-slate-400">→</span>
                <span className="text-slate-700">{r.action}</span>
              </div>
            ))}
          </Card>
          <Card className="!p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2"><Clock size={16} /> SLA Configuration</h3>
            {slaConfig.map((s, i) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b last:border-0 text-sm">
                <span className="font-medium text-slate-900 w-20">{s.level}</span>
                <span className="text-slate-500">Response: {s.time}</span>
                <span className="text-slate-500">Escalation: {s.escalation}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
