"use client";

import { Suspense, useState, useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, UserPlus, ExternalLink, ScrollText, Shield, Timer, Clock } from "lucide-react";
import {
  PageHeader,
  EnhancedDataTable,
  type Column,
  type RowAction,
} from "@/components/crm/ui";
import { cn } from "@/lib/utils";
import { FilterBar } from "@/components/crm/ui/FilterBar";
import { Breadcrumb } from "@/components/crm/layout";
import { caseService } from "@/lib/clm/services";
import { RiskBadge } from "@/components/crm/ui/RiskBadge";
import { SLABadge } from "@/components/crm/ui/SLABadge";
import { CaseTypeBadge } from "@/components/crm/ui/CaseTypeBadge";
import { AMLStatusBadge } from "@/components/crm/ui/AMLStatusBadge";
import { BadgeBase, type BadgeTone } from "@/components/crm/ui/BadgeBase";
import type { CLMCase, CaseListParams, CLMCaseStatus, Priority, SourceChannel, AutoReviewVerdict } from "@/types/clm";
import { useCurrentStaffId } from "@/hooks/useCurrentStaff";
import { useListWithFilters } from "@/hooks/useListWithFilters";
import { useGlobalSLATick } from "@/hooks/useGlobalSLATick";

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

// ─── Case status → badge tone (kept in sync with cases/page.tsx) ──
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

const STATUS_TEXT: Record<CLMCaseStatus, string> = {
  pending: "Pending",
  reviewing: "Reviewing",
  approved: "Approved",
  rejected: "Rejected",
  escalated: "Escalated",
  resubmission: "Resubmission",
  cancelled: "Cancelled",
  auto_approved: "Auto Approved",
  auto_rejected: "Auto Rejected",
  expired: "Expired",
};

function statusLabel(s: CLMCaseStatus): string {
  return STATUS_TEXT[s] ?? s.replace(/_/g, " ");
}

// ─── SLA Cell with live tick ─────────────────────────────────────
//
// Uses the global 10s ticker (`useGlobalSLATick`) instead of a per-cell
// `setInterval`. With 100+ rows this turns N timers into 1 timer.
function SLACell({ slaDueAt }: { slaDueAt: string }) {
  const tick = useGlobalSLATick();
  const info = useMemo(
    () => computeSLA(slaDueAt),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slaDueAt, tick]
  );

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${slaColors[info.status] || slaColors.normal}`}>
      {info.urgent ? <Clock className="w-3 h-3 flex-shrink-0" /> : <Timer className="w-3 h-3 flex-shrink-0" />}
      {info.label}
    </span>
  );
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
function AutoReviewBadge({ result }: { result?: AutoReviewVerdict }) {
  if (!result || result === "not_checked") return <span className="text-xs text-gray-400">—</span>;
  const colors: Record<string, string> = {
    pass: "bg-emerald-100 text-emerald-700",
    reject: "bg-red-100 text-red-700",
    pending: "bg-amber-100 text-amber-700",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[result]}`}>{result}</span>;
}

/* URL ⇄ filter mapping — single source of truth so deep-links from
 * Workspace KPI tiles and Audit Trail rows hydrate the table state. */
const URL_FILTER_KEYS = [
  "caseType", "riskLevel", "country", "amlStatus", "slaStatus", "status",
  "assignee", "priority", "sourceChannel", "autoReview", "search",
  "startDate", "endDate",
] as const;

type UrlFilterKey = (typeof URL_FILTER_KEYS)[number];

function urlToFilters(sp: URLSearchParams): Partial<CaseListParams> {
  const out: Partial<CaseListParams> = {};
  for (const key of URL_FILTER_KEYS) {
    const value = sp.get(key);
    if (!value) continue;
    if (key === "autoReview") out.autoReviewResult = value as AutoReviewVerdict;
    else (out as Record<string, unknown>)[key] = value;
  }
  return out;
}

function filtersToUrl(filters: Partial<CaseListParams>): string {
  const sp = new URLSearchParams();
  const map: Record<UrlFilterKey, unknown> = {
    caseType: filters.caseType,
    riskLevel: filters.riskLevel,
    country: filters.country,
    amlStatus: filters.amlStatus,
    slaStatus: filters.slaStatus,
    status: filters.status,
    assignee: filters.assignee,
    priority: filters.priority,
    sourceChannel: filters.sourceChannel,
    autoReview: filters.autoReviewResult,
    search: filters.search,
    startDate: filters.startDate,
    endDate: filters.endDate,
  };
  for (const [k, v] of Object.entries(map)) {
    if (v != null && v !== "") sp.set(k, String(v));
  }
  return sp.toString();
}

// ─── Page Component ─────────────────────────────────────────────
export default function ReviewQueuePage() {
  return (
    <Suspense fallback={null}>
      <ReviewQueuePageInner />
    </Suspense>
  );
}

function ReviewQueuePageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const staffId = useCurrentStaffId();
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Review Queue is the operator's "hot inbox": only cases that still
  // need action belong here. Approved / rejected / cancelled cases live
  // in /crm/clm/cases (the archive). The `statusIn` lock is server-side
  // so it cannot be turned off via the user-facing status filter.
  //
  // Case-type scope: CLM is compliance-positioned, so every member of
  // `CLMCaseType` is in-scope by definition. Withdrawal / deposit /
  // trade-anomaly reviews are NOT CLM cases — they live in their own
  // domains (Treasury / Risk) and never reach this query.
  const ACTIVE_STATUSES: CLMCaseStatus[] = useMemo(
    () => ["pending", "reviewing", "escalated", "resubmission"],
    []
  );

  // Hydrate filter state from the URL on the first render only. After
  // that the page is the source of truth and pushes changes back to the
  // URL via `router.replace`.
  const initialFilters = useMemo(() => urlToFilters(searchParams), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Single state-machine for page / filters / fetch (replaces the 4
  // local useState + useCallback + useEffect that lived here before).
  const list = useListWithFilters<CLMCase, Partial<CaseListParams>>({
    fetcher: ({ page, pageSize, filters }) =>
      caseService
        .list({ page, pageSize, statusIn: ACTIVE_STATUSES, ...filters })
        .then((r) => ({
          items: r.items,
          total: r.total,
        })),
    initialFilters,
    pageSize: 10,
  });
  const { items: cases, loading, total, page, filters } = list;

  // Mirror filter changes back into the URL — deep-links from elsewhere
  // (Workspace KPI tiles, Audit Trail rows) stay in sync.
  const lastQs = useRef<string | null>(null);
  useEffect(() => {
    const qs = filtersToUrl(filters);
    if (qs === lastQs.current) return;
    lastQs.current = qs;
    const target = qs ? `${pathname}?${qs}` : pathname;
    router.replace(target, { scroll: false });
  }, [filters, pathname, router]);

  const handleFilterChange = useCallback((newFilters: Record<string, unknown>) => {
    const params: Partial<CaseListParams> = {};
    if (newFilters.caseType) params.caseType = newFilters.caseType as CLMCase["type"];
    if (newFilters.riskLevel) params.riskLevel = newFilters.riskLevel as CLMCase["riskLevel"];
    if (newFilters.country) params.country = newFilters.country as string;
    if (newFilters.amlStatus) params.amlStatus = newFilters.amlStatus as CLMCase["amlStatus"];
    if (newFilters.slaStatus) params.slaStatus = newFilters.slaStatus as CLMCase["slaStatus"];
    if (newFilters.status) params.status = newFilters.status as CLMCase["status"];
    if (newFilters.assignee) params.assignee = newFilters.assignee as string;
    if (newFilters.priority) params.priority = newFilters.priority as Priority;
    if (newFilters.sourceChannel) params.sourceChannel = newFilters.sourceChannel as SourceChannel;
    if (newFilters.autoReview) params.autoReviewResult = newFilters.autoReview as AutoReviewVerdict;
    if (newFilters.search) params.search = newFilters.search as string;
    if (newFilters.startDate) params.startDate = newFilters.startDate as string;
    if (newFilters.endDate) params.endDate = newFilters.endDate as string;
    list.setFilters(params);
  }, [list]);

  const handleAssignToMe = async (caseItem: CLMCase) => {
    await caseService.assign(caseItem.id, staffId, staffId);
    list.refresh();
  };

  // ─── Columns ──────────────────────────────────────────────────
  // 9 columns. Customer is pinned (always visible); the other 8 can be
  // hidden via the toolbar's "Columns" menu (preference is stored in
  // localStorage under `crm.table.review-queue.hidden`). Sortable
  // columns use the table's built-in client-side sort; composite
  // columns specify `sortField` to point at the underlying property.
  const columns: Column<CLMCase>[] = [
    // 1. Customer — primary identification + meta in one cell.
    //    Pinned (`hideable: false`); sorts by customer name.
    {
      key: "customer",
      title: "Customer",
      minWidth: "260px",
      sortable: true,
      sortField: "customerName",
      hideable: false,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
            {row.customerName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <Link
                href={`/crm/clm/cases/${row.id}`}
                className="font-mono tabular-nums text-xs text-primary hover:underline whitespace-nowrap"
              >
                {row.caseNo}
              </Link>
              <span className="text-slate-300 select-none">·</span>
              <p className="text-sm font-medium text-slate-900 truncate">{row.customerName}</p>
              <PriorityBadge priority={row.priority} />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 truncate mt-0.5">
              <span className="font-mono tabular-nums">{row.customerUid}</span>
              <span className="text-slate-300 select-none">·</span>
              <span>{row.country}</span>
              {row.triggerSource && (
                <>
                  <span className="text-slate-300 select-none">·</span>
                  <span className="truncate text-slate-400">{row.triggerSource}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ),
    },
    // 2. Type
    {
      key: "type",
      title: "Type",
      width: "110px",
      sortable: true,
      render: (row) => <CaseTypeBadge type={row.type} />,
    },
    // 3. Risk
    {
      key: "riskLevel",
      title: "Risk",
      width: "100px",
      sortable: true,
      render: (row) => <RiskBadge level={row.riskLevel} />,
    },
    // 4. AML
    {
      key: "amlStatus",
      title: "AML",
      width: "100px",
      sortable: true,
      render: (row) => <AMLStatusBadge status={row.amlStatus} />,
    },
    // 5. Status — unified BadgeBase
    {
      key: "status",
      title: "Status",
      width: "120px",
      sortable: true,
      render: (row) => <BadgeBase tone={statusTone[row.status]}>{statusLabel(row.status)}</BadgeBase>,
    },
    // 7. SLA — sorted by `slaDueAt` (earlier = more urgent).
    {
      key: "sla",
      title: "SLA",
      width: "120px",
      sortable: true,
      sortField: "slaDueAt",
      render: (row) => <SLACell slaDueAt={row.slaDueAt} />,
    },
    // 8. Auto Review verdict — hidden by default.
    {
      key: "autoReview",
      title: "Auto",
      width: "80px",
      sortable: true,
      sortField: "autoReviewResult",
      defaultHidden: true,
      render: (row) => <AutoReviewBadge result={row.autoReviewResult} />,
    },
    // 9. Reviewer + Updated (stacked); sort by reviewer name.
    {
      key: "reviewer",
      title: "Reviewer",
      width: "140px",
      sortable: true,
      sortField: "assigneeName",
      render: (row) => (
        <div className="min-w-0">
          <p className={`text-xs font-medium truncate ${row.assigneeName ? "text-slate-700" : "text-slate-400 italic"}`}>
            {row.assigneeName || "Unassigned"}
          </p>
          <p className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5" title={new Date(row.updatedAt).toLocaleString()}>
            {new Date(row.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {", "}
            {new Date(row.updatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
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
  // The `value` field hydrates the FilterBar from the current filter
  // state — that's what lets deep-links like `?assignee=me` render with
  // the chip pre-selected on first paint.
  const filterOptions = [
    {
      key: "caseType",
      label: "Task Type",
      type: "select" as const,
      value: filters.caseType ?? "",
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
      value: filters.riskLevel ?? "",
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
      value: filters.amlStatus ?? "",
      options: [
        { label: "Pass", value: "pass" },
        { label: "Hit", value: "hit" },
        { label: "Pending", value: "pending" },
        { label: "Not Checked", value: "not_checked" },
      ],
    },
    {
      key: "priority",
      label: "Priority",
      type: "select" as const,
      value: filters.priority ?? "",
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
      value: filters.slaStatus ?? "",
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
      value: filters.status ?? "",
      // Review Queue is locked to active statuses (see ACTIVE_STATUSES
      // above). Terminal statuses live in `/crm/clm/cases`.
      options: [
        { label: "Pending", value: "pending" },
        { label: "Reviewing", value: "reviewing" },
        { label: "Resubmission", value: "resubmission" },
        { label: "Escalated", value: "escalated" },
      ],
    },
    {
      key: "assignee",
      label: "Reviewer",
      type: "select" as const,
      value: filters.assignee ?? "",
      options: [
        { label: "Unassigned", value: "unassigned" },
        { label: "Me", value: "me" },
      ],
    },
    {
      key: "sourceChannel",
      label: "Source",
      type: "select" as const,
      value: filters.sourceChannel ?? "",
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
      value: filters.autoReviewResult ?? "",
      options: [
        { label: "Pass", value: "pass" },
        { label: "Reject", value: "reject" },
        { label: "Pending", value: "pending" },
      ],
    },
  ];

  const selectedCases = cases.filter((c) => selectedKeys.has(c.id));

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "Review Queue" }]} />
      <PageHeader
        title="Review Queue"
        description={`Active workload · ${total} cases waiting · ${cases.filter(c => c.slaStatus === "timeout").length} SLA timeout`}
      />

      {/* Filter Bar — collapsed by default to keep the table front-and-center */}
      <FilterBar
        filters={filterOptions}
        searchable
        searchKeys={["caseNo", "customerName", "customerUid"]}
        searchPlaceholder="Search case ID, customer name or UID..."
        onSearch={handleFilterChange}
        defaultOpen={false}
      />

      {/* Data Table — batch actions appear in the table's own toolbar
          via `bulkActions`, no separate banner needed. */}
      {/* Table — no extra Card wrapper; EnhancedDataTable provides its own
          rounded border and integrated toolbar. */}
      <EnhancedDataTable<CLMCase>
        tableId="review-queue"
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
        bulkActions={(keys) => (
          <>
            <button
              onClick={async () => {
                await caseService.batchAssign(Array.from(keys), staffId, staffId);
                setSelectedKeys(new Set());
                list.refresh();
              }}
              className="h-8 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
            >
              Assign to Me
            </button>
            <button className="h-8 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50">
              Export Selected
            </button>
          </>
        )}
      />

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3 text-slate-500">
            <span>
              Showing{" "}
              <span className="font-medium text-slate-700 tabular-nums">
                {(page - 1) * list.pageSize + 1}–{Math.min(page * list.pageSize, total)}
              </span>{" "}
              of <span className="tabular-nums">{total}</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { list.setPage(Math.max(1, page - 1)); setSelectedKeys(new Set()); }}
              disabled={page === 1}
              className="h-9 px-3 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, Math.ceil(total / list.pageSize)) }, (_, i) => {
              const totalPages = Math.ceil(total / list.pageSize);
              let p = page;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              const isActive = page === p;
              return (
                <button
                  key={p}
                  onClick={() => { list.setPage(p); setSelectedKeys(new Set()); }}
                  className={cn(
                    "w-9 h-9 text-sm rounded-lg border transition-colors tabular-nums",
                    isActive
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => { list.setPage(Math.min(Math.ceil(total / list.pageSize), page + 1)); setSelectedKeys(new Set()); }}
              disabled={page >= Math.ceil(total / list.pageSize)}
              className="h-9 px-3 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
