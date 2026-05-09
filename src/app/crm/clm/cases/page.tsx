"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, PageHeader } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { caseService } from "@/lib/clm/services";
import { RiskBadge } from "@/components/crm/ui/RiskBadge";
import { SLABadge } from "@/components/crm/ui/SLABadge";
import { CaseTypeBadge } from "@/components/crm/ui/CaseTypeBadge";
import { AMLStatusBadge } from "@/components/crm/ui/AMLStatusBadge";
import type { CLMCase } from "@/types/clm";

export default function CasesPage() {
  const [cases, setCases] = useState<CLMCase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const result = await caseService.list({ page: 1, pageSize: 20 });
      setCases(result.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "Cases" }]} />
      <PageHeader
        title="Cases"
        description="All case lifecycle records"
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="!p-4 h-16 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {cases.map((c) => (
            <Link
              key={c.id}
              href={`/crm/clm/cases/${c.id}`}
              className="flex items-center gap-4 py-3 px-4 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <span className="text-sm font-mono text-blue-600 w-24">{c.caseNo}</span>
              <span className="text-sm text-gray-900 w-32 truncate">{c.customerName}</span>
              <CaseTypeBadge type={c.type} />
              <RiskBadge level={c.riskLevel} />
              <AMLStatusBadge status={c.amlStatus} />
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                c.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                c.status === "rejected" ? "bg-red-100 text-red-700" :
                c.status === "pending" ? "bg-amber-100 text-amber-700" :
                c.status === "reviewing" ? "bg-blue-100 text-blue-700" :
                c.status === "escalated" ? "bg-orange-100 text-orange-700" :
                c.status === "resubmission" ? "bg-purple-100 text-purple-700" :
                "bg-gray-100 text-gray-600"
              }`}>
                {c.status.replace("_", " ")}
              </span>
              <SLABadge status={c.slaStatus} />
              <span className="text-xs text-gray-400 ml-auto">
                {new Date(c.createdAt).toLocaleDateString()}
              </span>
              <ArrowRight className="w-4 h-4 text-gray-300" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
