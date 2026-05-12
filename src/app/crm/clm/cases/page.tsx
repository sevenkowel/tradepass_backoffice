"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bot, User } from "lucide-react";
import {
  Card,
  PageHeader,
  EnhancedDataTable,
  type Column,
} from "@/components/crm/ui";
import { FilterBar } from "@/components/crm/ui/FilterBar";
import { Breadcrumb } from "@/components/crm/layout";
import { caseService } from "@/lib/clm/services";
import { RiskBadge } from "@/components/crm/ui/RiskBadge";
import { SLABadge } from "@/components/crm/ui/SLABadge";
import { CaseTypeBadge } from "@/components/crm/ui/CaseTypeBadge";
import { AMLStatusBadge } from "@/components/crm/ui/AMLStatusBadge";
import { BadgeBase, type BadgeTone } from "@/components/crm/ui/BadgeBase";
import { useListWithFilters } from "@/hooks/useListWithFilters";
import type { CLMCase, CaseListParams, CLMCaseStatus } from "@/types/clm";

/** Derive the resolved decision mode from a case row. Drives both the
 *  Decision column and the row icon when the case is closed. */
type DecisionMode = "auto" | "manual" | "pending";
function decisionModeOf(c: CLMCase): DecisionMode {
  if (c.status === "auto_approved" || c.status === "auto_rejected") return "auto";
  if (c.status === "approved" || c.status === "rejected") return "manual";
  return "pending";
}

/** Map case status → badge tone (single source for the whole module). */
const statusTone: Record<CLMCaseStatus, BadgeTone> = {
  pending: "warning",
  reviewing: "primary",
  approved: "success",
  rejected: "error",
  escalated: "orange",
  resubmission: "purple",
  cancelled: "neutral",
  auto_approved: "success",
  auto_rejected: "error",
  expired: "neutral",
};

const STATUS_LABEL: Record<CLMCaseStatus, string> = {
  pending: "Pending",
  reviewing: "Reviewing",
  approved: "Approved",
  rejected: "Rejected",
  escalated: "Escalated",
  resubmission: "Resubmission",
  cancelled: "Cancelled",
  auto_approved: "Auto-Approved",
  auto_rejected: "Auto-Rejected",
  expired: "Expired",
};

export default function CasesPage() {
  const router = useRouter();

  const list = useListWithFilters<CLMCase, Partial<CaseListParams>>({
    fetcher: ({ page, pageSize, filters }) =>
      caseService
        .list({ page, pageSize, ...filters })
        .then((r) => ({ items: r.items, total: r.total })),
    initialFilters: {},
    pageSize: 20,
  });

  const handleFilterChange = useCallback(
    (next: Record<string, unknown>) => {
      list.setFilters({
        status: (next.status as CLMCaseStatus) || undefined,
        caseType: (next.caseType as Partial<CaseListParams>["caseType"]) || undefined,
        riskLevel: (next.riskLevel as Partial<CaseListParams>["riskLevel"]) || undefined,
        amlStatus: (next.amlStatus as Partial<CaseListParams>["amlStatus"]) || undefined,
        decisionMode:
          (next.decisionMode as Partial<CaseListParams>["decisionMode"]) || undefined,
      });
    },
    [list]
  );

  const columns: Column<CLMCase>[] = useMemo(
    () => [
      {
        key: "caseNo",
        title: "Case No",
        width: "120px",
        render: (row) => (
          <span className="font-mono tabular-nums text-sm text-primary">
            {row.caseNo}
          </span>
        ),
      },
      {
        key: "customerName",
        title: "Customer",
        sortable: true,
        render: (row) => (
          <div>
            <p className="text-sm font-medium text-slate-900">{row.customerName}</p>
            <p className="text-xs text-slate-500 font-mono">{row.customerUid}</p>
          </div>
        ),
      },
      {
        key: "type",
        title: "Type",
        width: "120px",
        render: (row) => <CaseTypeBadge type={row.type} />,
      },
      {
        key: "riskLevel",
        title: "Risk",
        width: "120px",
        render: (row) => <RiskBadge level={row.riskLevel} />,
      },
      {
        key: "amlStatus",
        title: "AML",
        width: "120px",
        render: (row) => <AMLStatusBadge status={row.amlStatus} />,
      },
      {
        key: "status",
        title: "Status",
        width: "130px",
        render: (row) => (
          <BadgeBase tone={statusTone[row.status]}>
            {STATUS_LABEL[row.status]}
          </BadgeBase>
        ),
      },
      {
        // Decision column — chip showing who finalised the case. Auto =
        // the engine resolved it; Manual = a reviewer did; Pending =
        // still open. Lets operators QA the auto-decision rate at a glance.
        key: "decision",
        title: "Decision",
        width: "140px",
        sortField: "status",
        render: (row) => {
          const mode = decisionModeOf(row);
          if (mode === "pending") {
            return (
              <span className="text-[11px] text-slate-400 italic">—</span>
            );
          }
          if (mode === "auto") {
            return (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700"
                title={row.reviewReason ?? "Auto-resolved by the rule engine"}
              >
                <Bot className="w-3 h-3" />
                Auto
              </span>
            );
          }
          return (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700"
              title={row.reviewedBy ? `Reviewed by ${row.reviewedBy}` : "Manual review"}
            >
              <User className="w-3 h-3" />
              {row.reviewedBy ? row.reviewedBy : "Manual"}
            </span>
          );
        },
      },
      {
        key: "slaStatus",
        title: "SLA",
        width: "130px",
        render: (row) => <SLABadge status={row.slaStatus} />,
      },
      {
        key: "updatedAt",
        title: "Updated",
        width: "140px",
        sortable: true,
        render: (row) => (
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {new Date(row.updatedAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ),
      },
    ],
    []
  );

  const filterFields = useMemo(
    () => [
      {
        key: "status",
        label: "Status",
        type: "select" as const,
        options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ label, value })),
      },
      {
        key: "caseType",
        label: "Case Type",
        type: "select" as const,
        options: [
          { label: "KYC", value: "kyc" },
          { label: "POA", value: "poa" },
          { label: "Liveness", value: "liveness" },
          { label: "Video", value: "video_verification" },
          { label: "EDD", value: "edd" },
          { label: "SoW", value: "source_of_wealth" },
          { label: "Agreement", value: "agreement_signing" },
          { label: "Risk", value: "risk_recheck" },
          { label: "Manual", value: "manual_review" },
          { label: "Re-Verify", value: "re_verification" },
        ],
      },
      {
        key: "riskLevel",
        label: "Risk",
        type: "select" as const,
        options: [
          { label: "Low", value: "low" },
          { label: "Medium", value: "medium" },
          { label: "High", value: "high" },
          { label: "Critical", value: "critical" },
        ],
      },
      {
        key: "amlStatus",
        label: "AML",
        type: "select" as const,
        options: [
          { label: "Pass", value: "pass" },
          { label: "Hit", value: "hit" },
          { label: "Pending", value: "pending" },
          { label: "Not Checked", value: "not_checked" },
        ],
      },
      {
        key: "decisionMode",
        label: "Decision",
        type: "select" as const,
        options: [
          { label: "Auto", value: "auto" },
          { label: "Manual", value: "manual" },
          { label: "Pending", value: "pending" },
        ],
      },
    ],
    []
  );

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "Cases" }]} />
      <PageHeader
        title="Cases"
        description="All cases — including approved / rejected / cancelled. For active workload, use Review Queue."
      />

      <FilterBar
        filters={filterFields}
        searchable
        searchKeys={["caseNo", "customerName", "customerUid"]}
        searchPlaceholder="Search by case no / customer / UID…"
        onSearch={handleFilterChange}
      />

      <Card padding="none">
        <EnhancedDataTable<CLMCase>
          columns={columns}
          data={list.items}
          keyExtractor={(c) => c.id}
          loading={list.loading}
          onRowClick={(c) => router.push(`/crm/clm/cases/${c.id}`)}
          emptyText="No cases match the current filters"
          pagination={false}
        />
      </Card>

      {list.total > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Showing {list.items.length} of <span className="tabular-nums">{list.total}</span> cases
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => list.setPage(Math.max(1, list.page - 1))}
              disabled={list.page === 1}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-slate-700 tabular-nums">
              Page {list.page} of {Math.max(1, Math.ceil(list.total / list.pageSize))}
            </span>
            <button
              onClick={() => list.setPage(list.page + 1)}
              disabled={list.page >= Math.ceil(list.total / list.pageSize)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
