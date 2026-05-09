"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Download, UserPlus, ExternalLink, ScrollText, Shield, Timer, Clock } from "lucide-react";
import {
  Card,
  PageHeader,
  Button,
  EnhancedDataTable,
  type Column,
  type RowAction,
} from "@/components/crm/ui";
import { FilterBar } from "@/components/crm/ui/FilterBar";
import { Breadcrumb } from "@/components/crm/layout";
import { caseService } from "@/lib/clm/services";
import { RiskBadge } from "@/components/crm/ui/RiskBadge";
import { SLABadge } from "@/components/crm/ui/SLABadge";
import { CaseTypeBadge } from "@/components/crm/ui/CaseTypeBadge";
import { AMLStatusBadge } from "@/components/crm/ui/AMLStatusBadge";
import type { CLMCase, CaseListParams, KYCLevel, Priority, SourceChannel, AutoReviewResult } from "@/types/clm";

// ─── SLA Countdown Helpers ───────────────────────────────────────
function computeSLA(slaDueAt: string): { status: string; label: string; urgent: boolean; overdue: boolean } {
  const diffMs = new Date(slaDueAt).getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin <= 0) return { status: "timeout", label: `${Math.abs(diffMin)}m overdue`, urgent: true, overdue: true };
  if (diffMin <= 5) return { status: "critical", label: `${diffMin}m left`, urgent: true, overdue: false };
  if (diffMin <= 10) return { status: "warning", label: `${diffMin}m left`, urgent: true, overdue: false };
  if (diffMin <= 30) return { status: "near", label: `${diffMin}m left`, urgent: false, overdue: false };
  return { status: "normal", label: `${diffMin}m left`, urgent: false, overdue: false };
}

const slaColors: Record<string, string> = {
  timeout: "bg-red-100 text-red-700 border-red-200",
  critical: "bg-red-50 text-red-600 border-red-100",
  warning: "bg-orange-50 text-orange-700 border-orange-100",
  near: "bg-amber-50 text-amber-700 border-amber-100",
  normal: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

// ─── SLA Cell with live tick ─────────────────────────────────────
function SLACell({ slaDueAt }: { slaDueAt: string }) {
  const calc = useCallback(() => computeSLA(slaDueAt), [slaDueAt]);
  const [info, setInfo] = useState(calc);

  useEffect(() => {
    setInfo(calc());
    const timer = setInterval(() => setInfo(calc()), 10000);
    return () => clearInterval(timer);
  }, [calc]);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${slaColors[info.status] || slaColors.normal}`}>
      {info.urgent ? <Clock className="w-3 h-3" /> : <Timer className="w-3 h-3" />}
      {info.label}
    </span>
  );
}

// ─── KYC Level Badge ────────────────────────────────────────────
function LevelBadge({ level }: { level?: KYCLevel }) {
  if (!level) return <span className="text-xs text-gray-400">—</span>;
  const colors: Record<KYCLevel, string> = {
    tier0: "bg-gray-100 text-gray-600",
    tier1: "bg-blue-100 text-blue-700",
    tier2: "bg-violet-100 text-violet-700",
    tier3: "bg-amber-100 text-amber-700",
    tier4: "bg-emerald-100 text-emerald-700",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[level]}`}>{level.toUpperCase()}</span>;
}

// ─── Priority Badge ─────────────────────────────────────────────
function PriorityBadge({ priority }: { priority?: Priority }) {
  if (!priority || priority === "normal") return null;
  const colors: Record<string, string> = {
    vip: "bg-purple-100 text-purple-700",
    high_risk: "bg-red-100 text-red-700",
    urgent: "bg-amber-100 text-amber-700",
  };
  const labels: Record<string, string> = {
    vip: "VIP",
    high_risk: "High Risk",
    urgent: "Urgent",
  };
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${colors[priority]}`}>{labels[priority]}</span>;
}

// ─── Auto Review Badge ──────────────────────────────────────────
function AutoReviewBadge({ result }: { result?: AutoReviewResult }) {
  if (!result || result === "not_checked") return <span className="text-xs text-gray-400">—</span>;
  const colors: Record<string, string> = {
    pass: "bg-emerald-100 text-emerald-700",
    reject: "bg-red-100 text-red-700",
    pending: "bg-amber-100 text-amber-700",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[result]}`}>{result}</span>;
}

// ─── Page Component ─────────────────────────────────────────────
export default function ReviewQueuePage() {
  const router = useRouter();
  const [cases, setCases] = useState<CLMCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Partial<CaseListParams>>({});
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchCases = useCallback(async (params: Partial<CaseListParams> = {}) => {
    setLoading(true);
    try {
      const result = await caseService.list({ page, pageSize, ...filters, ...params });
      setCases(result.items);
      setTotal(result.total);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleFilterChange = useCallback((newFilters: Record<string, unknown>) => {
    const params: Partial<CaseListParams> = {};
    if (newFilters.caseType) params.caseType = newFilters.caseType as CLMCase["type"];
    if (newFilters.riskLevel) params.riskLevel = newFilters.riskLevel as CLMCase["riskLevel"];
    if (newFilters.country) params.country = newFilters.country as string;
    if (newFilters.amlStatus) params.amlStatus = newFilters.amlStatus as CLMCase["amlStatus"];
    if (newFilters.slaStatus) params.slaStatus = newFilters.slaStatus as CLMCase["slaStatus"];
    if (newFilters.status) params.status = newFilters.status as CLMCase["status"];
    if (newFilters.assignee) params.assignee = newFilters.assignee as string;
    if (newFilters.kycLevel) params.customerTier = newFilters.kycLevel as string;
    if (newFilters.priority) params.priority = newFilters.priority as Priority;
    if (newFilters.sourceChannel) params.sourceChannel = newFilters.sourceChannel as SourceChannel;
    if (newFilters.autoReview) params.autoReviewResult = newFilters.autoReview as AutoReviewResult;
    if (newFilters.search) params.search = newFilters.search as string;
    if (newFilters.startDate) params.startDate = newFilters.startDate as string;
    if (newFilters.endDate) params.endDate = newFilters.endDate as string;
    setPage(1);
    setFilters(params);
    fetchCases(params);
  }, [fetchCases]);

  const handleAssignToMe = async (caseItem: CLMCase) => {
    await caseService.assign(caseItem.id, "staff-001", "staff-001");
    fetchCases();
  };

  // ─── Columns ──────────────────────────────────────────────────
  const columns: Column<CLMCase>[] = [
    // 1. Case ID
    {
      key: "caseNo",
      title: "Case ID",
      width: "100px",
      render: (row) => (
        <Link href={`/crm/clm/cases/${row.id}`} className="font-mono text-blue-600 hover:underline text-sm">
          {row.caseNo}
        </Link>
      ),
    },
    // 2. UID (independent column)
    {
      key: "customerUid",
      title: "UID",
      width: "80px",
      render: (row) => <span className="text-xs text-gray-500 font-mono">{row.customerUid}</span>,
    },
    // 3. Customer
    {
      key: "customer",
      title: "Customer",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-medium text-blue-700 flex-shrink-0">
            {row.customerName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{row.customerName}</p>
            <p className="text-xs text-gray-400 truncate">{row.triggerSource}</p>
          </div>
        </div>
      ),
    },
    // 4. Country
    {
      key: "country",
      title: "Country",
      width: "70px",
      render: (row) => <span className="text-sm text-gray-600">{row.country}</span>,
    },
    // 5. Type
    {
      key: "type",
      title: "Type",
      width: "90px",
      render: (row) => <CaseTypeBadge type={row.type} />,
    },
    // 6. Risk
    {
      key: "riskLevel",
      title: "Risk",
      width: "90px",
      render: (row) => <RiskBadge level={row.riskLevel} />,
    },
    // 7. AML
    {
      key: "amlStatus",
      title: "AML",
      width: "80px",
      render: (row) => <AMLStatusBadge status={row.amlStatus} />,
    },
    // 8. KYC Level
    {
      key: "kycLevel",
      title: "Level",
      width: "70px",
      render: (row) => <LevelBadge level={row.kycLevel} />,
    },
    // 9. Priority
    {
      key: "priority",
      title: "",
      width: "70px",
      render: (row) => <PriorityBadge priority={row.priority} />,
    },
    // 10. Status
    {
      key: "status",
      title: "Status",
      width: "100px",
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          row.status === "approved" ? "bg-emerald-100 text-emerald-700" :
          row.status === "rejected" ? "bg-red-100 text-red-700" :
          row.status === "pending" ? "bg-amber-100 text-amber-700" :
          row.status === "reviewing" ? "bg-blue-100 text-blue-700" :
          row.status === "escalated" ? "bg-orange-100 text-orange-700" :
          row.status === "resubmission" ? "bg-purple-100 text-purple-700" :
          "bg-gray-100 text-gray-600"
        }`}>
          {row.status === "resubmission" ? "Resubmission" :
           row.status === "auto_approved" ? "Auto Approved" :
           row.status === "auto_rejected" ? "Auto Rejected" :
           row.status.replace("_", " ")}
        </span>
      ),
    },
    // 11. SLA Countdown (live)
    {
      key: "sla",
      title: "SLA",
      width: "110px",
      render: (row) => <SLACell slaDueAt={row.slaDueAt} />,
    },
    // 12. Auto Review Result
    {
      key: "autoReview",
      title: "Auto Rev",
      width: "80px",
      render: (row) => <AutoReviewBadge result={row.autoReviewResult} />,
    },
    // 13. Assignee
    {
      key: "assignee",
      title: "Reviewer",
      width: "100px",
      render: (row) => (
        <span className={`text-xs font-medium ${
          row.assigneeName ? "text-gray-700" : "text-gray-400 italic"
        }`}>
          {row.assigneeName || "Unassigned"}
        </span>
      ),
    },
    // 14. Source Channel
    {
      key: "sourceChannel",
      title: "Source",
      width: "80px",
      render: (row) => (
        <span className="text-xs capitalize text-gray-500">{row.sourceChannel || "—"}</span>
      ),
    },
    // 15. Created At
    {
      key: "createdAt",
      title: "Created",
      width: "90px",
      render: (row) => (
        <span className="text-xs text-gray-500" title={new Date(row.createdAt).toLocaleString()}>
          {new Date(row.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      ),
    },
    // 16. Updated At
    {
      key: "updatedAt",
      title: "Updated",
      width: "90px",
      render: (row) => (
        <span className="text-xs text-gray-400" title={new Date(row.updatedAt).toLocaleString()}>
          {new Date(row.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
  ];

  // ─── Row Actions ──────────────────────────────────────────────
  const rowActions: RowAction<CLMCase>[] = [
    {
      label: "Review",
      icon: <ArrowUpRight className="w-4 h-4" />,
      onClick: (row) => router.push(`/crm/clm/cases/${row.id}`),
    },
    {
      label: "Assign to Me",
      icon: <UserPlus className="w-4 h-4" />,
      onClick: handleAssignToMe,
    },
    {
      label: "View Customer",
      icon: <ExternalLink className="w-4 h-4" />,
      onClick: (row) => router.push(`/crm/clients/${row.customerId}`),
    },
    {
      label: "View Audit",
      icon: <ScrollText className="w-4 h-4" />,
      onClick: (row) => router.push(`/crm/clm/audit-trail?targetId=${row.id}`),
    },
  ];

  // ─── Filters ──────────────────────────────────────────────────
  const filterOptions = [
    {
      key: "caseType",
      label: "Task Type",
      type: "select" as const,
      options: [
        { label: "KYC", value: "kyc" },
        { label: "POA", value: "poa" },
        { label: "Liveness", value: "liveness" },
        { label: "Video Verification", value: "video_verification" },
        { label: "Agreement", value: "agreement_signing" },
      ],
    },
    {
      key: "riskLevel",
      label: "Risk Level",
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
      label: "AML Status",
      type: "select" as const,
      options: [
        { label: "Pass", value: "pass" },
        { label: "Hit", value: "hit" },
        { label: "Pending", value: "pending" },
        { label: "Not Checked", value: "not_checked" },
      ],
    },
    {
      key: "kycLevel",
      label: "KYC Level",
      type: "select" as const,
      options: [
        { label: "Tier 0", value: "tier0" },
        { label: "Tier 1", value: "tier1" },
        { label: "Tier 2", value: "tier2" },
        { label: "Tier 3", value: "tier3" },
        { label: "Tier 4", value: "tier4" },
      ],
    },
    {
      key: "priority",
      label: "Priority",
      type: "select" as const,
      options: [
        { label: "VIP", value: "vip" },
        { label: "High Risk", value: "high_risk" },
        { label: "Urgent", value: "urgent" },
      ],
    },
    {
      key: "slaStatus",
      label: "SLA Status",
      type: "select" as const,
      options: [
        { label: "Normal", value: "normal" },
        { label: "Near Timeout", value: "near_timeout" },
        { label: "Timeout", value: "timeout" },
      ],
    },
    {
      key: "status",
      label: "Case Status",
      type: "select" as const,
      options: [
        { label: "Pending", value: "pending" },
        { label: "Reviewing", value: "reviewing" },
        { label: "Resubmission", value: "resubmission" },
        { label: "Escalated", value: "escalated" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
      ],
    },
    {
      key: "assignee",
      label: "Reviewer",
      type: "select" as const,
      options: [
        { label: "Unassigned", value: "unassigned" },
        { label: "Me", value: "me" },
      ],
    },
    {
      key: "sourceChannel",
      label: "Source",
      type: "select" as const,
      options: [
        { label: "Website", value: "website" },
        { label: "IB", value: "ib" },
        { label: "Partner", value: "partner" },
        { label: "Mobile", value: "mobile" },
        { label: "API", value: "api" },
      ],
    },
    {
      key: "autoReview",
      label: "Auto Review",
      type: "select" as const,
      options: [
        { label: "Pass", value: "pass" },
        { label: "Reject", value: "reject" },
        { label: "Pending", value: "pending" },
      ],
    },
  ];

  const selectedCases = cases.filter((c) => selectedKeys.has(c.id));

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "Review Queue" }]} />
      <PageHeader
        title="Review Queue"
        description={`${total} pending · ${cases.filter(c => c.slaStatus === "timeout").length} timeout`}
        actions={
          <Button variant="secondary">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        }
      />

      {/* Batch Actions */}
      {selectedKeys.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200">
          <span className="text-sm text-blue-700 font-medium">{selectedKeys.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={async () => {
                await caseService.batchAssign(Array.from(selectedKeys), "staff-001", "staff-001");
                setSelectedKeys(new Set());
                fetchCases();
              }}
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50"
            >
              Assign to Me
            </button>
            <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50">
              Export Selected
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar
        filters={filterOptions}
        searchable
        searchKeys={["caseNo", "customerName", "customerUid"]}
        searchPlaceholder="Search case ID, customer name or UID..."
        onSearch={handleFilterChange}
      />

      {/* Data Table */}
      <Card padding="none">
        <EnhancedDataTable<CLMCase>
          columns={columns}
          data={cases}
          keyExtractor={(row) => row.id}
          selectable
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          rowActions={rowActions}
          onRowClick={(row) => router.push(`/crm/clm/cases/${row.id}`)}
          emptyText={loading ? "" : "No cases found"}
          loading={loading}
          pagination={false}
        />
      </Card>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Total {total}</span>
            <select
              value={pageSize}
              onChange={() => setPage(1)}
              className="h-8 px-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
            >
              {[10, 20, 50].map((s) => (
                <option key={s} value={s}>{s} / page</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, Math.ceil(total / pageSize)) }, (_, i) => {
              const totalPages = Math.ceil(total / pageSize);
              let p = page;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-sm rounded-lg border transition-colors ${
                    page === p ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(Math.ceil(total / pageSize), page + 1))}
              disabled={page >= Math.ceil(total / pageSize)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
