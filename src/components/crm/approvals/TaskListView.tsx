"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  PageHeader,
  EnhancedDataTable,
  FilterBar,
  Button,
  type Column,
} from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { RiskBadge } from "./RiskBadge";
import { SlaTimer } from "./SlaTimer";
import { useListWithFilters } from "@/hooks/useListWithFilters";
import type {
  ApprovalTask,
  TaskType,
  WorkflowStatus,
  RiskLevel,
  SlaSnapshot,
} from "@/types/approval";

interface TaskWithSnapshot extends ApprovalTask {
  slaSnapshot?: SlaSnapshot;
}

interface TaskListFilters {
  search?: string;
  status?: string;
  riskLevel?: string;
  type?: string;
}

interface TaskListViewProps {
  breadcrumb: Array<{ label: string; href?: string }>;
  description?: string;
  view?: string;
  defaultFilters?: {
    type?: TaskType;
    status?: WorkflowStatus | WorkflowStatus[];
    riskLevel?: RiskLevel | RiskLevel[];
    assignee?: "all" | "me" | "unassigned";
  };
  showBatchActions?: boolean;
}

const STATUS_OPTIONS = [
  { label: "Pending",   value: "pending" },
  { label: "On Hold",   value: "on_hold" },
  { label: "Approved",  value: "approved" },
  { label: "Rejected",  value: "rejected" },
];

const RISK_OPTIONS = [
  { label: "Low",      value: "low" },
  { label: "Medium",   value: "medium" },
  { label: "High",     value: "high" },
  { label: "Critical", value: "critical" },
];

const TYPE_OPTIONS = [
  { label: "KYC",                value: "kyc" },
  { label: "Withdrawal",         value: "withdrawal" },
  { label: "Deposit",            value: "deposit" },
  { label: "Leverage",           value: "leverage" },
  { label: "Reward",             value: "reward" },
  { label: "Partner",            value: "partner" },
  { label: "Profile Change",     value: "profile_change" },
  { label: "AML Review",         value: "aml_review" },
  { label: "Large Withdrawal",   value: "large_withdrawal" },
  { label: "Re-Verification",    value: "re_verification" },
];

export function TaskListView({
  breadcrumb,
  description,
  view,
  defaultFilters,
  showBatchActions = true,
}: TaskListViewProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const list = useListWithFilters<TaskWithSnapshot, TaskListFilters>({
    fetcher: async ({ page, pageSize, filters }) => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (view) params.set("view", view);
      if (filters.search) params.set("search", filters.search);
      if (filters.status) params.set("status", filters.status);
      if (filters.riskLevel) params.set("riskLevel", filters.riskLevel);
      if (filters.type) params.set("type", filters.type);

      // Default filter overrides
      if (defaultFilters?.type)   params.set("type", defaultFilters.type);
      if (defaultFilters?.status) {
        const s = Array.isArray(defaultFilters.status) ? defaultFilters.status : [defaultFilters.status];
        params.set("status", s.join(","));
      }
      if (defaultFilters?.riskLevel) {
        const r = Array.isArray(defaultFilters.riskLevel) ? defaultFilters.riskLevel : [defaultFilters.riskLevel];
        params.set("riskLevel", r.join(","));
      }
      if (defaultFilters?.assignee) params.set("assignee", defaultFilters.assignee);

      const res = await fetch(`/api/approvals/tasks?${params}`);
      const data = await res.json();
      if (!data.success) return { items: [], total: 0 };
      return { items: data.items as TaskWithSnapshot[], total: data.total as number };
    },
    initialFilters: {},
    pageSize: 20,
  });

  const handleFilterChange = useCallback(
    (next: Record<string, string>) => {
      list.setFilters({
        search:    next.search    || undefined,
        status:    next.status    || undefined,
        riskLevel: next.riskLevel || undefined,
        type:      next.type      || undefined,
      });
    },
    [list]
  );

  const handleBatchAction = useCallback(
    async (action: "approve" | "reject" | "hold") => {
      if (selected.size === 0) return;
      const res = await fetch("/api/approvals/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: Array.from(selected), action }),
      });
      const data = await res.json();
      if (data.success) {
        setSelected(new Set());
        list.refresh();
      }
    },
    [selected, list]
  );

  const columns: Column<TaskWithSnapshot>[] = useMemo(
    () => [
      {
        key: "id",
        title: "Task ID",
        width: "130px",
        render: (row) => (
          <span className="font-mono tabular-nums text-sm text-primary">{row.id}</span>
        ),
      },
      {
        key: "subject",
        title: "Subject",
        minWidth: "240px",
        render: (row) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-900 truncate">{row.subject}</span>
            <span className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">
              {row.type.replace(/_/g, " ")}
            </span>
          </div>
        ),
      },
      {
        key: "user",
        title: "User",
        sortField: "userName",
        sortable: true,
        render: (row) => (
          <div className="flex flex-col min-w-0">
            <span className="text-sm text-slate-900 truncate">{row.userName}</span>
            <span className="text-xs font-mono tabular-nums text-slate-500">{row.userUid}</span>
          </div>
        ),
      },
      {
        key: "status",
        title: "Status",
        width: "120px",
        render: (row) => <TaskStatusBadge status={row.status} />,
      },
      {
        key: "riskLevel",
        title: "Risk",
        width: "110px",
        render: (row) => <RiskBadge level={row.riskLevel} score={row.riskScore} />,
      },
      {
        key: "sla",
        title: "SLA",
        width: "150px",
        render: (row) => <SlaTimer snapshot={row.slaSnapshot} />,
      },
      {
        key: "assignee",
        title: "Assignee",
        width: "140px",
        render: (row) =>
          row.assigneeName ? (
            <span className="text-sm text-slate-700">{row.assigneeName}</span>
          ) : (
            <span className="text-xs text-slate-400 italic">Unassigned</span>
          ),
      },
      {
        key: "createdAt",
        title: "Created",
        width: "110px",
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    []
  );

  const filterFields = useMemo(
    () => [
      { key: "status",    label: "Status", type: "select" as const, options: STATUS_OPTIONS },
      { key: "type",      label: "Type",   type: "select" as const, options: TYPE_OPTIONS },
      { key: "riskLevel", label: "Risk",   type: "select" as const, options: RISK_OPTIONS },
    ],
    []
  );

  const pageTitle = breadcrumb[breadcrumb.length - 1]?.label ?? "Tasks";
  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  return (
    <div className="space-y-3">
      <Breadcrumb items={breadcrumb} />
      <PageHeader
        title={pageTitle}
        description={description}
        actions={
          <Button variant="outline" size="sm" onClick={() => list.refresh()}>
            Refresh
          </Button>
        }
      />

      <FilterBar
        filters={filterFields}
        searchable
        searchPlaceholder="Search by task ID, name, or UID…"
        onSearch={handleFilterChange}
        onRefresh={() => list.refresh()}
      />

      {showBatchActions && selected.size > 0 && (
        <Card padding="sm" className="!p-3 border-blue-200 bg-blue-50/40">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-700">
              <span className="font-semibold tabular-nums">{selected.size}</span> selected
            </span>
            <div className="flex-1" />
            <Button size="sm" variant="outline" onClick={() => handleBatchAction("approve")}>
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBatchAction("reject")}>
              Reject
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBatchAction("hold")}>
              Hold
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        </Card>
      )}

      <Card padding="none">
        <EnhancedDataTable<TaskWithSnapshot>
          columns={columns}
          data={list.items}
          keyExtractor={(t) => t.id}
          loading={list.loading}
          selectable={showBatchActions}
          selectedKeys={selected}
          onSelectionChange={setSelected}
          onRowClick={(t) => router.push(`/crm/approvals/${t.id}`)}
          emptyText="No tasks match the current filters"
          pagination={false}
        />
      </Card>

      {list.total > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Showing {list.items.length} of{" "}
            <span className="tabular-nums">{list.total}</span> tasks
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => list.setPage(Math.max(1, list.page - 1))}
              disabled={list.page === 1}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-slate-700 tabular-nums">
              Page {list.page} of {totalPages}
            </span>
            <button
              onClick={() => list.setPage(list.page + 1)}
              disabled={list.page >= totalPages}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
