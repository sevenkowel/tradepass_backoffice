"use client";

import { useState } from "react";
import { FileText, History, Globe, Edit3, Eye } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";

const agreements = [
  { id: "agr-001", name: "Client Agreement", currentVersion: "v1.2", languages: ["en", "vi", "th"], signedCount: 12, updatedAt: "2024-06-15" },
  { id: "agr-002", name: "Risk Disclosure", currentVersion: "v1.1", languages: ["en", "vi"], signedCount: 10, updatedAt: "2024-08-20" },
  { id: "agr-003", name: "Privacy Policy", currentVersion: "v1.0", languages: ["en"], signedCount: 8, updatedAt: "2024-01-01" },
  { id: "agr-004", name: "AML Policy", currentVersion: "v1.0", languages: ["en"], signedCount: 6, updatedAt: "2024-01-01" },
];

export default function AgreementDocsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "KYC Center" }, { label: "Agreement Docs" }]} />
      <PageHeader title="Agreement Documents" description="Manage agreement versions and forced re-sign policies"
        actions={<Button><Edit3 size={16} /> New Agreement</Button>}
      />

      <div className="space-y-3">
        {agreements.map(agr => (
          <Card key={agr.id} className={`!p-5 cursor-pointer ${expanded === agr.id ? "ring-2 ring-blue-200" : ""}`}
            onClick={() => setExpanded(expanded === agr.id ? null : agr.id)}>
            <div className="flex items-center gap-4">
              <FileText size={24} className="text-slate-400" />
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">{agr.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className="font-mono text-blue-600">{agr.currentVersion}</span>
                  <span className="flex items-center gap-1"><Globe size={12} /> {agr.languages.join(", ")}</span>
                  <span>{agr.signedCount} signed</span>
                </div>
              </div>
              <div className="text-sm text-slate-500">{new Date(agr.updatedAt).toLocaleDateString()}</div>
              <Eye size={18} className="text-slate-300" />
            </div>
            {expanded === agr.id && (
              <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600"><History size={14} /> Version History: v1.0 → v1.1 → v1.2</div>
                <div className="flex items-center gap-2 text-slate-600"><Globe size={14} /> Languages: {agr.languages.join(", ")}</div>
                <div className="mt-3 flex gap-2">
                  <Button className="text-xs !px-3 !py-1"><Edit3 size={12} /> Edit Content</Button>
                  <Button variant="secondary" className="text-xs !px-3 !py-1 text-amber-700">Force Re-sign ({agr.signedCount} users)</Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
