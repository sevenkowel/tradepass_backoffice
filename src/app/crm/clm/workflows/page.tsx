"use client";

import { useState } from "react";
import { Workflow, Plus, Route, Timer, AlertTriangle, Bot, UserCheck } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";

const workflows = [
  {
    id: "wf-001",
    name: "Indonesia Team Routing",
    type: "routing",
    description: "Route Indonesian users to ID Review Team",
    rule: "IF country = Indonesia THEN assign_to_team = ID Review Team",
    status: "active" as const,
    priority: 1,
  },
  {
    id: "wf-002",
    name: "Critical Risk Escalation",
    type: "escalation",
    description: "Auto-escalate critical risk cases to Senior Reviewer",
    rule: "IF risk_level = Critical THEN assign_to_role = Senior Reviewer AND priority = Critical",
    status: "active" as const,
    priority: 10,
  },
  {
    id: "wf-003",
    name: "SLA Timeout Alert",
    type: "sla",
    description: "Notify team lead when case exceeds SLA",
    rule: "IF case_status = Pending AND pending_time > 30 minutes THEN notify = Team Lead AND mark_sla = Timeout",
    status: "active" as const,
    priority: 5,
  },
  {
    id: "wf-004",
    name: "Auto Review Fallback",
    type: "automation",
    description: "Route failed auto-review cases to manual queue",
    rule: "IF auto_review_failed = true THEN case_status = Pending AND assign_to = Manual Review Queue",
    status: "active" as const,
    priority: 3,
  },
  {
    id: "wf-005",
    name: "Resubmission Reopen",
    type: "reopen",
    description: "Re-enter queue when user resubmits documents",
    rule: "IF user_resubmitted = true THEN case_status = Pending AND reset_sla = true",
    status: "draft" as const,
    priority: 4,
  },
];

const typeIcons: Record<string, React.ReactNode> = {
  routing: <Route className="w-4 h-4 text-blue-500" />,
  escalation: <AlertTriangle className="w-4 h-4 text-red-500" />,
  sla: <Timer className="w-4 h-4 text-amber-500" />,
  automation: <Bot className="w-4 h-4 text-cyan-500" />,
  reopen: <UserCheck className="w-4 h-4 text-purple-500" />,
};

const typeLabels: Record<string, string> = {
  routing: "Routing",
  escalation: "Escalation",
  sla: "SLA",
  automation: "Automation",
  reopen: "Reopen",
};

export default function WorkflowSettingsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "Workflow Settings" }]} />
      <PageHeader
        title="Workflow Settings"
        description="Case routing, escalation, SLA, and automation rules"
        actions={
          <Button>
            <Plus className="w-4 h-4" />
            New Workflow
          </Button>
        }
      />

      <div className="space-y-3">
        {workflows.map((wf) => (
          <Card
            key={wf.id}
            className={`!p-5 cursor-pointer transition-all ${expanded === wf.id ? "ring-2 ring-blue-200" : ""}`}
            onClick={() => setExpanded(expanded === wf.id ? null : wf.id)}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                <Workflow className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{wf.name}</h3>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {typeIcons[wf.type]}
                    {typeLabels[wf.type]}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    wf.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {wf.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{wf.description}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Priority: {wf.priority}</p>
              </div>
            </div>

            {expanded === wf.id && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div className="p-3 bg-gray-50 rounded-xl font-mono text-sm text-gray-700">
                  {wf.rule}
                </div>
                <div className="flex gap-2">
                  <Button size="sm">Edit Rule</Button>
                  <Button variant="secondary" size="sm">Test Workflow</Button>
                  <Button variant="secondary" size="sm" className={wf.status === "active" ? "text-gray-500" : "text-emerald-600"}>
                    {wf.status === "active" ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
