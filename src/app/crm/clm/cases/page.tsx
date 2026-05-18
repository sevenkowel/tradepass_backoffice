"use client";

/**
 * CLM Cases list page — canonical "tool" list pattern.
 *
 * Reference: `docs/05-UI-System/list-page-spec.md`.
 *
 * Layout: Breadcrumb → Toolbar (search + 3 chips + Advanced) → Table → Pagination.
 *
 * Design choices (intentionally minimal):
 *   - **No KPI strip.** A 5-card stats grid duplicates information that's
 *     already in the chips' counts and the table's status column.
 *   - **3 chips, not 5.** The high-actionability filters at start of day:
 *     Pending / AML hit / Overdue. The rest live in Advanced.
 *   - **Neutral chip tones.** Active state uses the brand colour;
 *     inactive chips stay slate so the page doesn't shout.
 *   - **6 advanced fields.** Status / Case Type / Risk Level / AML
 *     Status / SLA Status / Review Route. Operators who need to
 *     narrow on AML pass-vs-pending or auto-vs-manual review go here.
 *   - **Uniform cell typography.** All cell content is `text-xs` so
 *     the row reads as a single tabular surface; chips keep their
 *     own sizing. Both Created and Updated columns are visible by
 *     default for case lifecycle reasoning.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, UserCheck } from "lucide-react";
import {
  Card,
  EnhancedDataTable,
  type Column,
} from "@/components/crm/ui";
import { caseService } from "@/lib/clm/services";
import { useListWithFilters } from "@/hooks/useListWithFilters";
import { useCurrentStaffId } from "@/hooks/useCurrentStaff";
import { useToast } from "@/components/ui/use-toast";
import type {
  CLMCase, CaseListParams, CLMCaseStatus, CLMCaseType, RiskLevel, SLACaseStatus,
} from "@/types/clm";
import {
  ListPageShell,
  ListToolbar,
  TablePagination,
  AdvancedFilterDrawer,
  type QuickChipDef,
  type AdvancedField,
} from "@/components/crm/list";

/** Map case status → dot + text colour. Plain colored text (no chip
 *  background) — matches the Risk / AML / SLA columns so the whole
 *  row reads at a single weight. */
const STATUS_FG: Record<CLMCaseStatus, { text: string; dot: string }> = {
  pending:       { text: "text-amber-700",   dot: "bg-amber-500"   },
  reviewing:     { text: "text-blue-700",    dot: "bg-blue-500"    },
  approved:      { text: "text-emerald-700", dot: "bg-emerald-500" },
  rejected:      { text: "text-red-700",     dot: "bg-red-500"     },
  escalated:     { text: "text-orange-700",  dot: "bg-orange-500"  },
  resubmission:  { text: "text-purple-700",  dot: "bg-purple-500"  },
  cancelled:     { text: "text-slate-500",   dot: "bg-slate-400"   },
  auto_approved: { text: "text-emerald-700", dot: "bg-emerald-500" },
  auto_rejected: { text: "text-red-700",     dot: "bg-red-500"     },
  expired:       { text: "text-slate-500",   dot: "bg-slate-400"   },
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

/** Short, human labels for case types. Rendered as plain text, not chips —
 *  Type is reference info, not a status signal that needs to flag the row. */
const TYPE_LABEL: Record<CLMCaseType, string> = {
  kyc: "KYC",
  poa: "POA",
  liveness: "Liveness",
  video_verification: "Video",
  edd: "EDD",
  source_of_wealth: "SoW",
  agreement_signing: "Agreement",
  manual_review: "Manual",
  re_verification: "Re-Verify",
};

/** Risk level → "dot + text" colour. Foreground only — no chip background.
 *  All rows render at the same `text-xs` weight; colour alone conveys
 *  severity. Bolding High / Critical was visually inconsistent vs the
 *  Low / Medium rows in the same column. */
const RISK_FG: Record<RiskLevel, { text: string; dot: string }> = {
  low:      { text: "text-emerald-700", dot: "bg-emerald-500" },
  medium:   { text: "text-amber-700",   dot: "bg-amber-500"   },
  high:     { text: "text-orange-700",  dot: "bg-orange-500"  },
  critical: { text: "text-red-700",     dot: "bg-red-500"     },
};

const RISK_LABEL: Record<RiskLevel, string> = {
  low: "Low", medium: "Medium", high: "High", critical: "Critical",
};

/** SLA → dot + text. Same plain-text pattern as Risk / AML / Status. */
const SLA_FG: Record<SLACaseStatus, { text: string; dot: string; label: string }> = {
  normal:       { text: "text-emerald-700", dot: "bg-emerald-500", label: "Normal"       },
  near_timeout: { text: "text-amber-700",   dot: "bg-amber-500",   label: "Near Timeout" },
  timeout:      { text: "text-red-700",     dot: "bg-red-500",     label: "Timeout"      },
};

type Filters = Partial<CaseListParams>;

/* Three quick chips for the high-actionability filters.
 * Pending / AML hit / Overdue — the three rows an operator will most
 * often want to bias toward at the start of their day. "Escalated"
 * was demoted to Advanced because the population is small. */
const QUICK_CHIPS: QuickChipDef<Filters>[] = [
  { id: "pending", label: "Pending", apply: { status: "pending" }    as Filters, tone: "slate" },
  { id: "amlHit",  label: "AML hit", apply: { amlStatus: "hit" }     as Filters, tone: "slate" },
  { id: "overdue", label: "Overdue", apply: { slaStatus: "timeout" } as Filters, tone: "slate" },
];

/** Keys the advanced drawer manages — used to count the active badge. */
const ADVANCED_KEYS = ["status", "caseType", "riskLevel", "amlStatus", "slaStatus", "decisionMode"] as const;

/* Six advanced filters in priority order:
 *   Status → Type → Risk → AML → SLA → Decision Mode
 * Each chip group is multi-/single-select per the AdvancedField contract. */
const ADVANCED_FIELDS: AdvancedField[] = [
  {
    type: "chips",
    key: "status",
    label: "Status",
    options: Object.entries(STATUS_LABEL).map(([value, label]) => ({
      label, value,
      tone: value.includes("approved") ? "emerald"
        : value.includes("rejected") ? "red"
        : value === "escalated" ? "violet"
        : "amber",
    })),
  },
  {
    type: "chips",
    key: "caseType",
    label: "Case Type",
    options: [
      { label: "KYC",        value: "kyc" },
      { label: "POA",        value: "poa" },
      { label: "Liveness",   value: "liveness" },
      { label: "Video",      value: "video_verification" },
      { label: "EDD",        value: "edd" },
      { label: "SoW",        value: "source_of_wealth" },
      { label: "Agreement",  value: "agreement_signing" },
      { label: "Manual",     value: "manual_review" },
      { label: "Re-Verify",  value: "re_verification" },
    ],
  },
  {
    type: "chips",
    key: "riskLevel",
    label: "Risk Level",
    options: [
      { label: "Low",      value: "low",      tone: "emerald" },
      { label: "Medium",   value: "medium",   tone: "amber" },
      { label: "High",     value: "high",     tone: "orange" },
      { label: "Critical", value: "critical", tone: "red" },
    ],
  },
  {
    type: "chips",
    key: "amlStatus",
    label: "AML Status",
    options: [
      { label: "Pass",        value: "pass",        tone: "emerald" },
      { label: "Pending",     value: "pending",     tone: "amber" },
      { label: "Hit",         value: "hit",         tone: "red" },
      { label: "Not Checked", value: "not_checked"                  },
    ],
  },
  {
    type: "chips",
    key: "slaStatus",
    label: "SLA Status",
    options: [
      { label: "Normal",       value: "normal",       tone: "emerald" },
      { label: "Near Timeout", value: "near_timeout", tone: "amber"   },
      { label: "Timeout",      value: "timeout",      tone: "red"     },
    ],
  },
  {
    type: "chips",
    key: "decisionMode",
    label: "Review Route",
    options: [
      { label: "Auto",    value: "auto",    tone: "emerald" },
      { label: "Manual",  value: "manual",  tone: "amber"   },
      { label: "Pending", value: "pending"                  },
    ],
  },
];

export default function CasesPage() {
  const router = useRouter();
  const staffId = useCurrentStaffId();
  const toast = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const list = useListWithFilters<CLMCase, Filters>({
    fetcher: ({ page, pageSize, filters }) =>
      caseService
        .list({ page, pageSize, ...filters })
        .then((r) => ({ items: r.items, total: r.total })),
    initialFilters: {},
    pageSize: 20,
  });

  /* P1-D3 批量 approve / assign — 只允许"低风险 + pending/reviewing"的 case
   * 入选；高风险的 critical / AML hit 自动从选区剔除，避免一键过滤掉关键审核。 */
  const eligibleForBatch = (c: CLMCase): boolean =>
    (c.status === "pending" || c.status === "reviewing")
    && c.riskLevel !== "critical"
    && c.amlStatus !== "hit";

  const handleBatchApprove = async () => {
    const ids = Array.from(selected).filter((id) => {
      const it = list.items.find((x) => x.id === id);
      return it && eligibleForBatch(it);
    });
    if (ids.length === 0) {
      toast.error("No eligible cases selected (excluded high-risk / AML hits).");
      return;
    }
    if (!confirm(`Batch approve ${ids.length} case(s)? This cannot be undone.`)) return;
    try {
      await caseService.batchApprove(ids, staffId);
      toast.success(`${ids.length} case(s) approved`);
      setSelected(new Set());
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Please try again.", {
        title: "Batch approve failed",
      });
    }
  };

  const handleBatchAssignToMe = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    try {
      await caseService.batchAssign(ids, staffId, staffId);
      toast.success(`${ids.length} case(s) assigned to you`);
      setSelected(new Set());
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Please try again.", {
        title: "Batch assign failed",
      });
    }
  };

  // Note: we delegate ALL filter mutation to the hook's stable
  // `patchFilters` (useCallback []). Wrapping it locally with our own
  // `useCallback([list])` would re-create the callback on every render
  // (since `list` is a fresh object literal each render), which would
  // cascade into the ListToolbar's debounce effect re-firing and looping
  // a fetch every 250ms. The hook's version is the single canonical
  // patcher; treat it like Redux's dispatch.
  const search = ((list.filters as { search?: string }).search) ?? "";

  /* --------------------------- Advanced count -------------------------- */
  const advancedCount = useMemo(() => {
    let n = 0;
    for (const k of ADVANCED_KEYS) {
      const v = (list.filters as Record<string, unknown>)[k];
      if (v !== undefined && v !== null && v !== "") n += 1;
    }
    return n;
  }, [list.filters]);

  /* --------------------------- Columns ---------------------------------
   *
   * Tool-grade table — chips are *only* used for the two columns that
   * convey row-level signal: Status (the case's authoritative state)
   * and SLA (urgency). Everything else renders as plain text — colour
   * is used as foreground only, never as a chip background. This keeps
   * the eye on the data, not the chrome.
   *
   * "Decision" column was removed: it duplicates Status (the case row
   * already says `auto_approved` / `approved` / `pending`).
   *
   * Customer collapsed to one line: `name · UID`. The two-line layout
   * inflated every row's height for low-density information.
   *
   * ------------------------------------------------------------------- */
  /* All cell content is `text-xs` (12px) so the row reads as a flat
   * tabular surface — no visual hierarchy bumps between identifier
   * columns and data columns. Chips (Status / SLA) keep their own
   * sizing via `BadgeBase` / `SLABadge`. `font-mono tabular-nums`
   * stays on IDs, UIDs, and timestamps so columns align vertically. */
  const fmtDateTime = (s: string) =>
    new Date(s).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
    });

  const columns: Column<CLMCase>[] = useMemo(
    () => [
      {
        key: "caseNo", title: "Case No", width: "110px",
        render: (row) => (
          <span className="font-mono tabular-nums text-xs text-primary">
            {row.caseNo}
          </span>
        ),
      },
      {
        key: "customer", title: "Customer", sortable: true, sortField: "customerName",
        render: (row) => (
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-xs font-medium text-slate-900 truncate">{row.customerName}</span>
            <span className="text-xs text-slate-400 font-mono tabular-nums whitespace-nowrap">{row.customerUid}</span>
          </div>
        ),
      },
      {
        key: "type", title: "Type", width: "100px",
        render: (row) => (
          <span className="text-xs text-slate-600">{TYPE_LABEL[row.type] ?? row.type}</span>
        ),
      },
      {
        key: "riskLevel", title: "Risk", width: "100px", sortable: true,
        render: (row) => {
          const cfg = RISK_FG[row.riskLevel];
          return (
            <span className={`inline-flex items-center gap-1.5 text-xs ${cfg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} aria-hidden />
              {RISK_LABEL[row.riskLevel]}
            </span>
          );
        },
      },
      {
        key: "amlStatus", title: "AML", width: "90px",
        render: (row) => {
          /* Same dot + text pattern as Risk / Status / SLA so the
           * whole row reads at a single weight. */
          if (row.amlStatus === "hit") return (
            <span className="inline-flex items-center gap-1.5 text-xs text-red-700">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" aria-hidden />
              Hit
            </span>
          );
          if (row.amlStatus === "pending") return (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden />
              Pending
            </span>
          );
          if (row.amlStatus === "pass") return (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" aria-hidden />
              Pass
            </span>
          );
          return <span className="text-xs text-slate-300">—</span>;
        },
      },
      {
        key: "status", title: "Status", width: "120px", sortable: true,
        render: (row) => {
          const cfg = STATUS_FG[row.status];
          return (
            <span className={`inline-flex items-center gap-1.5 text-xs ${cfg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} aria-hidden />
              {STATUS_LABEL[row.status]}
            </span>
          );
        },
      },
      {
        key: "slaStatus", title: "SLA", width: "120px", sortable: true,
        render: (row) => {
          const cfg = SLA_FG[row.slaStatus];
          return (
            <span className={`inline-flex items-center gap-1.5 text-xs ${cfg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} aria-hidden />
              {cfg.label}
            </span>
          );
        },
      },
      {
        key: "createdAt", title: "Created", width: "120px", sortable: true,
        render: (row) => (
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {fmtDateTime(row.createdAt)}
          </span>
        ),
      },
      {
        key: "updatedAt", title: "Updated", width: "120px", sortable: true,
        render: (row) => (
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {fmtDateTime(row.updatedAt)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <ListPageShell
      breadcrumb={[{ label: "CLM Center" }, { label: "Cases" }]}
    >
      {/* No KPI strip — chip counts + the table itself carry the same
          information without the visual weight of 5 stat cards. */}

      {/* Filter toolbar — search + chips + advanced.
          All filter mutation goes through the hook's stable patchFilters
          to avoid the toolbar's debounce effect re-firing on every render. */}
      <ListToolbar<Filters>
        search={search}
        onSearchChange={(q) =>
          list.patchFilters({ search: q || undefined } as Partial<Filters>)
        }
        searchPlaceholder="Search by case no / customer / UID…"
        filters={list.filters}
        onFilterChange={list.patchFilters}
        quickChips={QUICK_CHIPS}
        onOpenAdvanced={() => setDrawerOpen(true)}
        advancedCount={advancedCount}
        advancedLabel="Advanced filters"
      />

      {/* Table — supports batch selection for approve/assign (P1-D3) */}
      <Card padding="none">
        <EnhancedDataTable<CLMCase>
          columns={columns}
          data={list.items}
          keyExtractor={(c) => c.id}
          loading={list.loading}
          onRowClick={(c) => router.push(`/crm/clm/cases/${c.id}`)}
          emptyText="No cases match the current filters"
          pagination={false}
          tableId="crm.clm.cases.list"
          selectable
          selectedKeys={selected}
          onSelectionChange={setSelected}
          bulkActions={(sel) => {
            const eligibleCount = list.items
              .filter((it) => sel.has(it.id) && eligibleForBatch(it))
              .length;
            const ineligibleCount = sel.size - eligibleCount;
            return (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {sel.size} selected
                  {ineligibleCount > 0 && (
                    <span className="text-red-600 ml-1">({ineligibleCount} not eligible)</span>
                  )}
                </span>
                <button
                  onClick={handleBatchApprove}
                  disabled={eligibleCount === 0}
                  className="inline-flex items-center gap-1 px-2.5 h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Critical / AML-hit cases are excluded from batch approve"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Batch approve {eligibleCount > 0 ? `(${eligibleCount})` : ""}
                </button>
                <button
                  onClick={handleBatchAssignToMe}
                  className="inline-flex items-center gap-1 px-2.5 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors"
                >
                  <UserCheck className="w-3 h-3" />
                  Assign to me
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="px-2.5 h-7 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md text-xs font-medium"
                >
                  Clear
                </button>
              </div>
            );
          }}
        />
      </Card>

      {/* Pagination. `useListWithFilters` doesn't expose `setPageSize`, so
          page-size is fixed for now — TODO: extend the hook. */}
      <TablePagination
        total={list.total}
        page={list.page}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
      />

      {/* Advanced filter drawer */}
      <AdvancedFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Advanced filters"
        subtitle="Combine multiple conditions to narrow the list."
        fields={ADVANCED_FIELDS}
        filters={list.filters as Record<string, unknown>}
        onApply={(patch) => list.patchFilters(patch as Partial<Filters>)}
      />
    </ListPageShell>
  );
}
