"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, User, Settings, Shield, Users, Wallet, BarChart3, Loader2 } from "lucide-react";
import { Button, PageHeader, Card, EmptyState, FilterBar, EnhancedDataTable, type Column } from "@/components/crm/ui";
import { useStaffStore } from "@/store/crm/staffStore";
import type { StaffAuditLog } from "@/types/backoffice/staff";

// Module icons mapping
const moduleIcons: Record<string, React.ReactNode> = {
  staff: <User className="w-4 h-4" />,
  user: <Users className="w-4 h-4" />,
  system: <Settings className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  funds: <Wallet className="w-4 h-4" />,
  kyc: <Shield className="w-4 h-4" />,
  default: <FileText className="w-4 h-4" />,
};

// Action labels
const actionLabels: Record<string, string> = {
  CREATE: "创建",
  UPDATE: "更新",
  DELETE: "删除",
  UPDATE_STATUS: "状态变更",
  RESET_PASSWORD: "重置密码",
  REVIEW: "审核",
  LOGIN: "登录",
  LOGOUT: "登出",
};

export default function StaffLogsPage() {
  const { auditLogs, isLoadingAuditLogs, fetchAuditLogs, staff } = useStaffStore();
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("");

  // Load data
  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Filter logs
  useEffect(() => {
    fetchAuditLogs({
      staffId: selectedStaff || undefined,
      module: selectedModule || undefined,
    });
  }, [selectedStaff, selectedModule, fetchAuditLogs]);

  // Get unique modules from logs
  const modules = [...new Set(auditLogs.map((log) => log.module))];

  // Table columns
  const columns: Column<StaffAuditLog>[] = [
    {
      key: "createdAt",
      title: "时间",
      width: "160px",
      render: (row) => (
        <div className="text-sm">
          <p className="text-slate-900 dark:text-white">{new Date(row.createdAt).toLocaleDateString("zh-CN")}</p>
          <p className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleTimeString("zh-CN")}</p>
        </div>
      ),
    },
    {
      key: "staffName",
      title: "操作人",
      width: "120px",
      render: (row) => (
        <Link href={`/crm/system/staff/${row.staffId}`} className="text-sm font-medium text-blue-600 hover:underline">
          {row.staffName}
        </Link>
      ),
    },
    {
      key: "module",
      title: "模块",
      width: "100px",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">{moduleIcons[row.module] || moduleIcons.default}</span>
          <span className="text-sm text-slate-700 capitalize">{row.module}</span>
        </div>
      ),
    },
    {
      key: "action",
      title: "操作",
      width: "100px",
      render: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            row.action === "DELETE"
              ? "bg-red-100 text-red-700"
              : row.action === "CREATE"
              ? "bg-green-100 text-green-700"
              : row.action === "UPDATE" || row.action === "UPDATE_STATUS"
              ? "bg-blue-100 text-blue-700"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {actionLabels[row.action] || row.action}
        </span>
      ),
    },
    {
      key: "description",
      title: "描述",
      render: (row) => <span className="text-sm text-slate-700">{row.description}</span>,
    },
    {
      key: "ip",
      title: "IP 地址",
      width: "120px",
      render: (row) => <span className="font-mono text-xs text-slate-500">{row.ip}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link href="/crm/system/staff" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回员工列表
      </Link>

      {/* Page Header */}
      <PageHeader title="操作审计日志" description="查看所有员工的关键操作记录" />

      {/* Filter Bar */}
      <FilterBar
        filters={[
          {
            key: "staff",
            label: "操作人",
            type: "select",
            options: [{ label: "全部", value: "" }, ...staff.map((s) => ({ label: s.fullName, value: s.id }))],
            value: selectedStaff,
            onChange: setSelectedStaff,
          },
          {
            key: "module",
            label: "模块",
            type: "select",
            options: [{ label: "全部", value: "" }, ...modules.map((m) => ({ label: m, value: m }))],
            value: selectedModule,
            onChange: setSelectedModule,
          },
        ]}
        searchable
        searchKeys={["description"]}
        searchPlaceholder="搜索操作描述..."
      />

      {/* Data Table */}
      <Card padding="none">
        {isLoadingAuditLogs ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : auditLogs.length === 0 ? (
          <EmptyState icon={<FileText className="w-6 h-6" />} title="暂无审计日志" description="系统尚未记录任何操作" />
        ) : (
          <EnhancedDataTable<StaffAuditLog> columns={columns} data={auditLogs} keyExtractor={(row) => row.id} emptyText="暂无审计日志" />
        )}
      </Card>
    </div>
  );
}
