"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Monitor,
  Loader2,
} from "lucide-react";
import {
  Button,
  PageHeader,
  Card,
  EmptyState,
  FilterBar,
  EnhancedDataTable,
  type Column,
  type RowAction,
} from "@/components/crm/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  useToast,
  Badge,
} from "@/components/ui";
import { useSecurityStore } from "@/store/crm/securityStore";
import type { SecurityEvent, SecuritySeverity, SecurityEventType } from "@/types/backoffice/security";
import { securityEventTypeLabels, severityLabels } from "@/lib/backoffice/mock-security";

export default function SecurityLogsPage() {
  const { toast } = useToast();
  const { events, isLoadingEvents, isSubmitting, fetchEvents, resolveEvent } = useSecurityStore();

  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedSeverity, setSelectedSeverity] = useState<SecuritySeverity | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "resolved" | "unresolved">("all");
  const [eventToResolve, setEventToResolve] = useState<SecurityEvent | null>(null);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);

  // Load data
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Filter events
  useEffect(() => {
    fetchEvents({
      type: (selectedType as SecurityEventType) || undefined,
      severity: selectedSeverity,
      resolved: selectedStatus === "all" ? "all" : selectedStatus === "resolved",
    });
  }, [selectedType, selectedSeverity, selectedStatus, fetchEvents]);

  const handleResolveClick = (event: SecurityEvent) => {
    setEventToResolve(event);
    setIsResolveDialogOpen(true);
  };

  const confirmResolve = async () => {
    if (!eventToResolve) return;

    const success = await resolveEvent(eventToResolve.id);
    if (success) {
      toast({
        title: "事件已处理",
        description: "安全事件已标记为已处理",
      });
      setIsResolveDialogOpen(false);
      setEventToResolve(null);
    }
  };

  // Table columns
  const columns: Column<SecurityEvent>[] = [
    {
      key: "severity",
      title: "级别",
      width: "80px",
      render: (row) => {
        const { label, color } = severityLabels[row.severity];
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
            {label}
          </span>
        );
      },
    },
    {
      key: "type",
      title: "事件类型",
      width: "140px",
      render: (row) => (
        <span className="text-sm text-slate-700">{securityEventTypeLabels[row.type] || row.type}</span>
      ),
    },
    {
      key: "createdAt",
      title: "时间",
      width: "150px",
      render: (row) => (
        <div className="text-sm">
          <p className="text-slate-900 dark:text-white">{new Date(row.createdAt).toLocaleDateString("zh-CN")}</p>
          <p className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleTimeString("zh-CN")}</p>
        </div>
      ),
    },
    {
      key: "staffName",
      title: "相关人员",
      width: "120px",
      render: (row) =>
        row.staffName ? (
          <Link
            href={`/crm/system/staff/${row.staffId}`}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            {row.staffName}
          </Link>
        ) : (
          <span className="text-sm text-slate-400">-</span>
        ),
    },
    {
      key: "ip",
      title: "IP 地址",
      width: "120px",
      render: (row) => <span className="font-mono text-xs text-slate-600">{row.ip}</span>,
    },
    {
      key: "location",
      title: "位置",
      width: "120px",
      render: (row) => (
        <div className="flex items-center gap-1 text-sm text-slate-600">
          <MapPin className="w-3 h-3" />
          {row.location || "未知"}
        </div>
      ),
    },
    {
      key: "details",
      title: "详情",
      render: (row) => {
        const details = row.details as Record<string, string>;
        return (
          <div className="text-sm">
            {details.reason && <p className="text-slate-600">{details.reason}</p>}
            {details.activity && <p className="text-slate-600">{details.activity}</p>}
            {details.attemptCount && <p className="text-slate-500 text-xs">尝试次数: {details.attemptCount}</p>}
          </div>
        );
      },
    },
    {
      key: "resolved",
      title: "状态",
      width: "100px",
      render: (row) =>
        row.resolved ? (
          <span className="inline-flex items-center gap-1 text-green-600 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            已处理
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-amber-600 text-sm">
            <Clock className="w-4 h-4" />
            待处理
          </span>
        ),
    },
  ];

  // Row actions
  const rowActions: RowAction<SecurityEvent>[] = [
    {
      label: "标记为已处理",
      icon: <CheckCircle2 className="w-4 h-4" />,
      onClick: handleResolveClick,
      disabled: (row) => row.resolved,
    },
  ];

  // Event type options
  const eventTypeOptions = [
    { label: "全部", value: "" },
    ...Object.entries(securityEventTypeLabels).map(([value, label]) => ({ label, value })),
  ];

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link href="/crm/system/security" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回安全管理
      </Link>

      {/* Page Header */}
      <PageHeader title="安全事件日志" description="查看和处理系统安全事件和告警" />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="!p-4">
          <p className="text-sm text-slate-500">今日事件</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{events.length}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">严重事件</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {events.filter((e) => e.severity === "critical").length}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">待处理</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {events.filter((e) => !e.resolved).length}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">已处理</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {events.filter((e) => e.resolved).length}
          </p>
        </Card>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={[
          {
            key: "type",
            label: "事件类型",
            type: "select",
            options: eventTypeOptions,
            value: selectedType,
            onChange: setSelectedType,
          },
          {
            key: "severity",
            label: "严重级别",
            type: "select",
            options: [
              { label: "全部", value: "all" },
              { label: "严重", value: "critical" },
              { label: "高", value: "high" },
              { label: "中", value: "medium" },
              { label: "低", value: "low" },
            ],
            value: selectedSeverity,
            onChange: (value) => setSelectedSeverity(value as SecuritySeverity | "all"),
          },
          {
            key: "status",
            label: "处理状态",
            type: "select",
            options: [
              { label: "全部", value: "all" },
              { label: "待处理", value: "unresolved" },
              { label: "已处理", value: "resolved" },
            ],
            value: selectedStatus,
            onChange: (value) => setSelectedStatus(value as "all" | "resolved" | "unresolved"),
          },
        ]}
      />

      {/* Data Table */}
      <Card padding="none">
        {isLoadingEvents ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="w-6 h-6" />}
            title="暂无安全事件"
            description="系统运行正常，未检测到安全事件"
          />
        ) : (
          <EnhancedDataTable<SecurityEvent>
            columns={columns}
            data={events}
            keyExtractor={(row) => row.id}
            rowActions={rowActions}
            emptyText="暂无安全事件"
          />
        )}
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <CheckCircle2 className="w-5 h-5" />
              确认处理事件
            </DialogTitle>
            <DialogDescription className="pt-4">
              <p>您确定要将此安全事件标记为已处理吗？</p>
              <div className="mt-4 p-4 bg-slate-100 rounded-lg">
                <p className="text-sm text-slate-600">
                  事件类型: <strong>{securityEventTypeLabels[eventToResolve?.type || ""] || eventToResolve?.type}</strong>
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  发生时间: {eventToResolve?.createdAt ? new Date(eventToResolve.createdAt).toLocaleString("zh-CN") : ""}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setIsResolveDialogOpen(false)} disabled={isSubmitting}>
              取消
            </Button>
            <Button onClick={confirmResolve} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              确认处理
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
