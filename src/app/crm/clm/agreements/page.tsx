"use client";

import { useState } from "react";
import { FileText, Globe, History, Edit3, Eye, Plus, AlertTriangle } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";

const agreements = [
  {
    id: "agr-001",
    name: "Client Agreement",
    type: "client_agreement",
    currentVersion: "v1.2",
    languages: ["en", "id", "vi", "th"],
    country: "Global",
    status: "published" as const,
    forceResign: false,
    signedCount: 1240,
    updatedAt: "2026-04-15",
  },
  {
    id: "agr-002",
    name: "Risk Disclosure",
    type: "risk_disclosure",
    currentVersion: "v1.1",
    languages: ["en", "id", "vi"],
    country: "Global",
    status: "published" as const,
    forceResign: false,
    signedCount: 1180,
    updatedAt: "2026-03-20",
  },
  {
    id: "agr-003",
    name: "Privacy Policy",
    type: "privacy_policy",
    currentVersion: "v1.0",
    languages: ["en", "id"],
    country: "Global",
    status: "published" as const,
    forceResign: false,
    signedCount: 1240,
    updatedAt: "2026-01-01",
  },
  {
    id: "agr-004",
    name: "Leverage Agreement",
    type: "leverage_agreement",
    currentVersion: "v2.0",
    languages: ["en"],
    country: "ID",
    status: "draft" as const,
    forceResign: true,
    signedCount: 0,
    updatedAt: "2026-05-08",
  },
];

const typeLabels: Record<string, string> = {
  client_agreement: "Client Agreement",
  risk_disclosure: "Risk Disclosure",
  privacy_policy: "Privacy Policy",
  terms_of_business: "Terms of Business",
  leverage_agreement: "Leverage Agreement",
  product_disclosure: "Product Disclosure",
  esign_consent: "E-sign Consent",
};

export default function AgreementsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "Agreements" }]} />
      <PageHeader
        title="Agreements"
        description="Manage agreement versions, languages, and forced re-sign policies"
        actions={
          <Button>
            <Plus className="w-4 h-4" />
            New Agreement
          </Button>
        }
      />

      <div className="space-y-3">
        {agreements.map((agr) => (
          <Card
            key={agr.id}
            className={`!p-5 cursor-pointer transition-all ${expanded === agr.id ? "ring-2 ring-blue-200" : ""}`}
            onClick={() => setExpanded(expanded === agr.id ? null : agr.id)}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{agr.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    agr.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {agr.status}
                  </span>
                  {agr.forceResign && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      Force Re-sign
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="font-mono text-blue-600">{agr.currentVersion}</span>
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {agr.languages.join(", ")}</span>
                  <span>{agr.signedCount} signed</span>
                  <span>Country: {agr.country}</span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(agr.updatedAt).toLocaleDateString()}
              </div>
            </div>

            {expanded === agr.id && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <History className="w-4 h-4" />
                  <span>Version History: v1.0 → v1.1 → {agr.currentVersion}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="w-4 h-4" />
                  <span>Languages: {agr.languages.join(", ")}</span>
                </div>
                {agr.forceResign && (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg text-sm text-amber-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span>This agreement requires all users to re-sign upon next login.</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button size="sm"><Edit3 className="w-3 h-3" /> Edit Content</Button>
                  <Button variant="secondary" size="sm"><Eye className="w-3 h-3" /> Preview</Button>
                  <Button variant="secondary" size="sm" className="text-amber-700">
                    Force Re-sign
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
