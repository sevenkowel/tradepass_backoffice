"use client";

import { useState, useEffect, useCallback } from "react";
import { ScrollText, Shield, User, FileText, Settings, AlertTriangle } from "lucide-react";
import { Card, PageHeader, EnhancedDataTable, type Column } from "@/components/crm/ui";
import { FilterBar } from "@/components/crm/ui/FilterBar";
import { Breadcrumb } from "@/components/crm/layout";
import { auditService } from "@/lib/clm/services";
import type { CLMAuditLog, CLMAuditAction, CLMAuditTargetType } from "@/types/clm";

const actionLabels: Record<CLMAuditAction, string> = {
  case_created: "Case Created",
  case_assigned: "Case Assigned",
  case_reviewed: "Case Reviewed",
  case_approved: "Case Approved",
  case_rejected: "Case Rejected",
  case_resubmission_requested: "Resubmission Requested",
  case_escalated: "Case Escalated",
  case_cancelled: "Case Cancelled",
  policy_updated: "Policy Updated",
  policy_published: "Policy Published",
  agreement_published: "Agreement Published",
  workflow_changed: "Workflow Changed",
  customer_level_changed: "Level Changed",
  customer_frozen: "Account Frozen",
  customer_unfrozen: "Account Unfrozen",
};

const actionIcons: Record<CLMAuditAction, React.ReactNode> = {
  case_created: <FileText className="w-4 h-4 text-blue-500" />,
  case_assigned: <User className="w-4 h-4 text-purple-500" />,
  case_reviewed: <ScrollText className="w-4 h-4 text-amber-500" />,
  case_approved: <Shield className="w-4 h-4 text-emerald-500" />,
  case_rejected: <AlertTriangle className="w-4 h-4 text-red-500" />,
  case_resubmission_requested: <ScrollText className="w-4 h-4 text-amber-500" />,
  case_escalated: <AlertTriangle className="w-4 h-4 text-orange-500" />,
  case_cancelled: <FileText className="w-4 h-4 text-gray-500" />,
  policy_updated: <Settings className="w-4 h-4 text-blue-500" />,
  policy_published: <Settings className="w-4 h-4 text-blue-500" />,
  agreement_published: <FileText className="w-4 h-4 text-blue-500" />,
  workflow_changed: <Settings className="w-4 h-4 text-purple-500" />,
  customer_level_changed: <User className="w-4 h-4 text-cyan-500" />,
  customer_frozen: <AlertTriangle className="w-4 h-4 text-red-500" />,
  customer_unfrozen: <Shield className="w-4 h-4 text-emerald-500" />,
};

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<CLMAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<{
    action?: CLMAuditAction;
    targetType?: CLMAuditTargetType;
    actorId?: string;
  }>({});
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchLogs = useCallback(async (params: { action?: CLMAuditAction; targetType?: CLMAuditTargetType; actorId?: string } = {}) => {
    setLoading(true);
    try {
      const result = await auditService.list({ page, pageSize, ...params });
      setLogs(result.items);
      setTotal(result.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchLogs(filters);
  }, [fetchLogs, filters, page]);

  const handleFilterChange = useCallback((newFilters: Record<string, unknown>) => {
    const params: { action?: CLMAuditAction; targetType?: CLMAuditTargetType; actorId?: string } = {};
    if (newFilters.action) params.action = newFilters.action as CLMAuditAction;
    if (newFilters.targetType) params.targetType = newFilters.targetType as CLMAuditTargetType;
    if (newFilters.actorId) params.actorId = newFilters.actorId as string;
    setPage(1);
    setFilters(params);
  }, []);

  const columns: Column<CLMAuditLog>[] = [
    {
      key: "auditId",
      title: "Audit ID",
      width: "100px",
      render: (row) => <span className="font-mono text-xs text-gray-500">{row.auditId}</span>,
    },
    {
      key: "action",
      title: "Action",
      width: "180px",
      render: (row) => (
        <div className="flex items-center gap-2">
          {actionIcons[row.action]}
          <span className="text-sm text-gray-900">{actionLabels[row.action]}</span>
        </div>
      ),
    },
    {
      key: "actor",
      title: "Actor",
      width: "140px",
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{row.actorName}</p>
          <p className="text-xs text-gray-500">{row.actorRole}</p>
        </div>
      ),
    },
    {
      key: "target",
      title: "Target",
      render: (row) => (
        <div>
          <p className="text-sm text-gray-700">
            {row.targetType.replace("_", " ")}: <span className="font-medium">{row.targetName || row.targetId}</span>
          </p>
        </div>
      ),
    },
    {
      key: "changes",
      title: "Changes",
      render: (row) => {
        if (!row.previousValue || !row.newValue) return <span className="text-xs text-gray-400">—</span>;
        const keys = Object.keys(row.newValue);
        return (
          <div className="space-y-1">
            {keys.map((key) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">{key}:</span>
                <span className="text-red-600 line-through">{String(row.previousValue![key])}</span>
                <span className="text-gray-300">→</span>
                <span className="text-emerald-600 font-medium">{String(row.newValue![key])}</span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: "reason",
      title: "Reason",
      width: "150px",
      render: (row) => <span className="text-xs text-gray-500">{row.reason || "—"}</span>,
    },
    {
      key: "meta",
      title: "Meta",
      width: "120px",
      render: (row) => (
        <div className="text-xs text-gray-400">
          {row.ipAddress && <p>IP: {row.ipAddress}</p>}
          {row.device && <p>{row.device}</p>}
        </div>
      ),
    },
    {
      key: "createdAt",
      title: "Time",
      width: "130px",
      render: (row) => (
        <span className="text-xs text-gray-500">
          {new Date(row.createdAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      ),
    },
  ];

  const filterOptions = [
    {
      key: "action",
      label: "Action",
      type: "select" as const,
      options: Object.entries(actionLabels).map(([value, label]) => ({ label, value })),
    },
    {
      key: "targetType",
      label: "Target Type",
      type: "select" as const,
      options: [
        { label: "Case", value: "case" },
        { label: "Customer", value: "customer" },
        { label: "Policy", value: "policy" },
        { label: "Workflow", value: "workflow" },
        { label: "Agreement", value: "agreement" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "Audit Trail" }]} />
      <PageHeader
        title="Audit Trail"
        description="Compliance-grade audit logs — read only"
      />

      {/* Read-only notice */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200">
        <Shield className="w-4 h-4 text-blue-600" />
        <p className="text-sm text-blue-700">
          Audit logs are immutable. All actions are recorded automatically and cannot be modified or deleted.
        </p>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filterOptions}
        searchable
        searchKeys={["actorName", "targetName", "auditId"]}
        searchPlaceholder="Search actor, target or audit ID..."
        onSearch={handleFilterChange}
      />

      {/* Data Table */}
      <Card padding="none">
        <EnhancedDataTable<CLMAuditLog>
          columns={columns}
          data={logs}
          keyExtractor={(row) => row.id}
          emptyText={loading ? "" : "No audit logs found"}
          loading={loading}
          pagination={false}
        />
      </Card>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Total {total} records</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-700">
              Page {page} of {Math.ceil(total / pageSize)}
            </span>
            <button
              onClick={() => setPage(page + 1)}
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
