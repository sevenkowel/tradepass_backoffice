"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Globe } from "lucide-react";
import type { DisclaimerInfo } from "@/types/clm";

interface DisclaimerSectionProps {
  data: DisclaimerInfo;
  className?: string;
}

export function DisclaimerSection({ data, className }: DisclaimerSectionProps) {
  const items = [
    { label: "US Person (FATCA)", value: data.usPerson, description: "US tax reporting" },
    { label: "Politically Exposed Person", value: data.pep, description: "Political exposure" },
    { label: "Military Personnel", value: data.military, description: "Military service" },
    { label: "Financial Professional", value: data.financialProfessional, description: "Financial industry" },
    { label: "Criminal Record", value: data.criminalRecord, description: "Criminal history" },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            {item.value ? (
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500">{item.description}</p>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              item.value ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
            }`}>
              {item.value ? "Yes" : "No"}
            </span>
          </div>
        ))}

        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">Tax Residency:</span>
            <span className="text-sm font-medium text-gray-900">{data.taxResidency}</span>
          </div>
          {!data.fatcaRelated && (
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-gray-700">No FATCA-related indicia</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
          <span className="text-xs text-gray-500">Declarations confirmed by user:</span>
          <span className={`text-xs font-medium ${data.declarationsConfirmed ? "text-emerald-700" : "text-amber-700"}`}>
            {data.declarationsConfirmed ? "Yes" : "Pending"}
          </span>
        </div>
      </div>
    </div>
  );
}
