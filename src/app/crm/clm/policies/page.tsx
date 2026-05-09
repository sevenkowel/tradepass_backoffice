"use client";

import { useState } from "react";
import { Shield, ChevronRight, Check, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";

const policies = [
  {
    id: "pol-001",
    name: "Indonesia Passport POA",
    type: "document",
    country: "ID",
    status: "active",
    priority: 1,
    rule: "IF country = Indonesia AND document_type = Passport THEN poa_required = true",
    updatedBy: "Admin A",
    updatedAt: "2026-05-01",
  },
  {
    id: "pol-002",
    name: "AML Hit Auto Escalate",
    type: "aml",
    country: "Global",
    status: "active",
    priority: 10,
    rule: "IF aml_status = Hit THEN assign_to = Senior Reviewer AND priority = Critical",
    updatedBy: "Senior Reviewer",
    updatedAt: "2026-04-20",
  },
  {
    id: "pol-003",
    name: "Large Deposit Video KYC",
    type: "deposit",
    country: "Global",
    status: "active",
    priority: 5,
    rule: "IF deposit_amount > 10000000 IDR AND video_verification != Approved THEN trigger_case = Video Verification",
    updatedBy: "Admin B",
    updatedAt: "2026-05-05",
  },
  {
    id: "pol-004",
    name: "Auto Approve Low Risk",
    type: "auto_review",
    country: "Global",
    status: "active",
    priority: 3,
    rule: "IF ocr_confidence >= 90 AND aml_status = Pass AND face_match_score >= 85 THEN auto_approve = true",
    updatedBy: "System",
    updatedAt: "2026-03-15",
  },
  {
    id: "pol-005",
    name: "High-Risk Country EDD",
    type: "risk",
    country: "AE",
    status: "draft",
    priority: 8,
    rule: "IF country = UAE THEN edd_required = true AND manual_review = true",
    updatedBy: "Compliance Admin",
    updatedAt: "2026-05-07",
  },
];

const typeColors: Record<string, string> = {
  country: "bg-blue-100 text-blue-700",
  document: "bg-purple-100 text-purple-700",
  risk: "bg-red-100 text-red-700",
  aml: "bg-amber-100 text-amber-700",
  deposit: "bg-emerald-100 text-emerald-700",
  withdrawal: "bg-orange-100 text-orange-700",
  account: "bg-cyan-100 text-cyan-700",
  auto_review: "bg-gray-100 text-gray-700",
};

export default function KYCPoliciesPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "KYC Policies" }]} />
      <PageHeader
        title="KYC Policies"
        description="KYC, risk, and auto-review rule engine"
        actions={
          <Button>
            <Plus className="w-4 h-4" />
            New Policy
          </Button>
        }
      />

      <div className="space-y-3">
        {policies.map((policy) => (
          <Card
            key={policy.id}
            className={`!p-5 cursor-pointer transition-all ${expanded === policy.id ? "ring-2 ring-blue-200" : ""}`}
            onClick={() => setExpanded(expanded === policy.id ? null : policy.id)}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{policy.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[policy.type] || "bg-gray-100 text-gray-700"}`}>
                    {policy.type.replace("_", " ")}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    policy.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {policy.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>Priority: {policy.priority}</span>
                  <span>Country: {policy.country}</span>
                  <span>Updated by {policy.updatedBy}</span>
                  <span>{new Date(policy.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-gray-300 transition-transform ${expanded === policy.id ? "rotate-90" : ""}`} />
            </div>

            {expanded === policy.id && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div className="p-3 bg-gray-50 rounded-xl font-mono text-sm text-gray-700">
                  {policy.rule}
                </div>
                <div className="flex gap-2">
                  <Button size="sm">Edit Policy</Button>
                  <Button variant="secondary" size="sm">Test Simulation</Button>
                  <Button variant="secondary" size="sm" className="text-amber-700">
                    {policy.status === "active" ? "Disable" : "Activate"}
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
