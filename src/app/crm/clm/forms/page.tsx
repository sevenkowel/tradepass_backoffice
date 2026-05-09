"use client";

import { useState } from "react";
import { FormInput, Plus, ChevronRight, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";

const forms = [
  {
    id: "form-001",
    name: "New KYC - Indonesia",
    country: "ID",
    fields: 12,
    status: "published" as const,
    lastUpdated: "2026-04-10",
  },
  {
    id: "form-002",
    name: "New KYC - Vietnam",
    country: "VN",
    fields: 10,
    status: "published" as const,
    lastUpdated: "2026-04-10",
  },
  {
    id: "form-003",
    name: "Passport KYC",
    country: "Global",
    fields: 14,
    status: "published" as const,
    lastUpdated: "2026-03-15",
  },
  {
    id: "form-004",
    name: "EDD - Enhanced Due Diligence",
    country: "Global",
    fields: 18,
    status: "draft" as const,
    lastUpdated: "2026-05-05",
  },
  {
    id: "form-005",
    name: "Video Verification",
    country: "Global",
    fields: 3,
    status: "published" as const,
    lastUpdated: "2026-02-20",
  },
  {
    id: "form-006",
    name: "Bank Account Link",
    country: "Global",
    fields: 6,
    status: "published" as const,
    lastUpdated: "2026-01-10",
  },
];

export default function FormsFieldsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "Forms & Fields" }]} />
      <PageHeader
        title="Forms & Fields"
        description="Dynamic KYC form engine for different countries and scenarios"
        actions={
          <Button>
            <Plus className="w-4 h-4" />
            New Form
          </Button>
        }
      />

      <div className="space-y-3">
        {forms.map((form) => (
          <Card
            key={form.id}
            className={`!p-5 cursor-pointer transition-all ${expanded === form.id ? "ring-2 ring-blue-200" : ""}`}
            onClick={() => setExpanded(expanded === form.id ? null : form.id)}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                <FormInput className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{form.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    form.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {form.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>Country: {form.country}</span>
                  <span>{form.fields} fields</span>
                  <span>Updated: {new Date(form.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-gray-300 transition-transform ${expanded === form.id ? "rotate-90" : ""}`} />
            </div>

            {expanded === form.id && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <p className="text-sm text-gray-600">
                  This form contains {form.fields} configurable fields. Field types: Input, Select, Date, Upload, Checkbox, Radio, Textarea.
                </p>
                <div className="flex gap-2">
                  <Button size="sm">Form Builder</Button>
                  <Button variant="secondary" size="sm"><Eye className="w-3 h-3" /> Preview</Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
