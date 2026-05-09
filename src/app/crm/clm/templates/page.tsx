"use client";

import { useState } from "react";
import { LayoutTemplate, Plus, ChevronRight, Shield, Globe, Copy, Eye } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";

const templates = [
  {
    id: "tmp-001",
    name: "Indonesia - BAPPEBTI Standard",
    country: "ID",
    regulator: "BAPPEBTI",
    policies: 8,
    forms: 3,
    agreements: 4,
    status: "active" as const,
    version: "v1.0",
    updatedAt: "2026-04-01",
  },
  {
    id: "tmp-002",
    name: "CySEC - EU Standard",
    country: "CY",
    regulator: "CySEC",
    policies: 12,
    forms: 4,
    agreements: 5,
    status: "active" as const,
    version: "v1.2",
    updatedAt: "2026-03-15",
  },
  {
    id: "tmp-003",
    name: "ASIC - Australia",
    country: "AU",
    regulator: "ASIC",
    policies: 10,
    forms: 4,
    agreements: 4,
    status: "active" as const,
    version: "v1.1",
    updatedAt: "2026-02-20",
  },
  {
    id: "tmp-004",
    name: "SVG - Simplified",
    country: "VG",
    regulator: "SVG FSA",
    policies: 4,
    forms: 2,
    agreements: 2,
    status: "draft" as const,
    version: "v0.9",
    updatedAt: "2026-05-08",
  },
];

export default function ComplianceTemplatesPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "Compliance Templates" }]} />
      <PageHeader
        title="Compliance Templates"
        description="Regulatory templates by jurisdiction"
        actions={
          <Button>
            <Plus className="w-4 h-4" />
            New Template
          </Button>
        }
      />

      <div className="space-y-3">
        {templates.map((tmp) => (
          <Card
            key={tmp.id}
            className={`!p-5 cursor-pointer transition-all ${expanded === tmp.id ? "ring-2 ring-blue-200" : ""}`}
            onClick={() => setExpanded(expanded === tmp.id ? null : tmp.id)}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                <LayoutTemplate className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{tmp.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    tmp.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {tmp.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {tmp.country}</span>
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {tmp.regulator}</span>
                  <span>{tmp.policies} policies</span>
                  <span>{tmp.forms} forms</span>
                  <span>{tmp.agreements} agreements</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono text-blue-600">{tmp.version}</p>
                <p className="text-xs text-gray-400">{new Date(tmp.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>

            {expanded === tmp.id && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl text-center">
                    <p className="text-2xl font-bold text-gray-900">{tmp.policies}</p>
                    <p className="text-xs text-gray-500">Policies</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl text-center">
                    <p className="text-2xl font-bold text-gray-900">{tmp.forms}</p>
                    <p className="text-xs text-gray-500">Forms</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl text-center">
                    <p className="text-2xl font-bold text-gray-900">{tmp.agreements}</p>
                    <p className="text-xs text-gray-500">Agreements</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm">Edit Template</Button>
                  <Button variant="secondary" size="sm"><Eye className="w-3 h-3" /> Preview</Button>
                  <Button variant="secondary" size="sm"><Copy className="w-3 h-3" /> Duplicate</Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
