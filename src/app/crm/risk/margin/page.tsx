"use client";

import { useState } from "react";
import {
  TrendingDown,
  Search,
  AlertTriangle,
  ShieldAlert,
  Skull,
  Clock,
  CheckCircle,
  X,
  Bell,
  Phone,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { EnhancedDataTable, Column, RowAction } from "@/components/crm/ui/EnhancedDataTable";
import { cn } from "@/lib/utils";

// Types
interface MarginAlert {
  id: string;
  accountId: string;
  userName: string;
  userId: string;
  marginLevel: number;
  equity: number;
  margin: number;
  status: "warning" | "danger" | "liquidated" | "resolved";
  alertType: "margin_call" | "stop_out" | "near_liquidation";
  triggeredAt: string;
  resolvedAt?: string;
  action: string;
  handledBy?: string;
}

// Mock data
const mockAlerts: MarginAlert[] = [
  {
    id: "MA001",
    accountId: "ACC-8823",
    userName: "John Smith",
    userId: "USR-001",
    marginLevel: 45,
    equity: 2500,
    margin: 5555,
    status: "warning",
    alertType: "margin_call",
    triggeredAt: "2024-03-15 14:30:00",
    action: "发送通知，建议追加保证金",
  },
  {
    id: "MA002",
    accountId: "ACC-9912",
    userName: "Sarah Johnson",
    userId: "USR-002",
    marginLevel: 28,
    equity: 1200,
    margin: 4285,
    status: "danger",
    alertType: "stop_out",
    triggeredAt: "2024-03-15 14:15:00",
    action: "触发强制平仓",
  },
  {
    id: "MA003",
    accountId: "ACC-3345",
    userName: "Michael Brown",
    userId: "USR-003",
    marginLevel: 15,
    equity: 500,
    margin: 3333,
    status: "liquidated",
    alertType: "stop_out",
    triggeredAt: "2024-03-15 13:45:00",
    resolvedAt: "2024-03-15 13:46:00",
    action: "已强制平仓",
    handledBy: "system",
  },
  {
    id: "MA004",
    accountId: "ACC-5567",
    userName: "Emma Wilson",
    userId: "USR-004",
    marginLevel: 52,
    equity: 3200,
    margin: 6153,
    status: "warning",
    alertType: "near_liquidation",
    triggeredAt: "2024-03-15 13:00:00",
    action: "发送预警通知",
  },
  {
    id: "MA005",
    accountId: "ACC-7789",
    userName: "David Lee",
    userId: "USR-005",
    marginLevel: 35,
    equity: 1800,
    margin: 5142,
    status: "danger",
    alertType: "margin_call",
    triggeredAt: "2024-03-15 12:30:00",
    action: "电话联系客户",
    handledBy: "admin_01",
  },
  {
    id: "MA006",
    accountId: "ACC-1123",
    userName: "Lisa Chen",
    userId: "USR-006",
    marginLevel: 65,
    equity: 4500,
    margin: 6923,
    status: "resolved",
    alertType: "margin_call",
    triggeredAt: "2024-03-15 10:00:00",
    resolvedAt: "2024-03-15 11:30:00",
    action: "客户追加保证金",
    handledBy: "system",
  },
];

const statusConfig = {
  warning: { label: "预警", color: "text-amber-600", bg: "bg-amber-100", icon: AlertTriangle },
  danger: { label: "危险", color: "text-red-600", bg: "bg-red-100", icon: ShieldAlert },
  liquidated: { label: "已强平", color: "text-gray-500", bg: "bg-gray-100", icon: Skull },
  resolved: { label: "已解决", color: "text-emerald-600", bg: "bg-emerald-100", icon: CheckCircle },
};

const alertTypeConfig = {
  margin_call: { label: "保证金不足", color: "text-amber-600" },
  stop_out: { label: "强平线", color: "text-red-600" },
  near_liquidation: { label: "接近强平", color: "text-orange-600" },
};

export default function MarginAlertsPage() {
  const [alerts] = useState<MarginAlert[]>(mockAlerts);
  const [filterStatus, setFilterStatus] = useState<"all" | MarginAlert["status"]>("all");
  const [filterType, setFilterType] = useState<"all" | MarginAlert["alertType"]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlert, setSelectedAlert] = useState<MarginAlert | null>(null);

  const filteredAlerts = alerts.filter((a) => {
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (filterType !== "all" && a.alertType !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.userName.toLowerCase().includes(q) || a.accountId.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: alerts.length,
    warning: alerts.filter((a) => a.status === "warning").length,
    danger: alerts.filter((a) => a.status === "danger").length,
    liquidated: alerts.filter((a) => a.status === "liquidated").length,
  };

  const columns: Column<MarginAlert>[] = [
    {
      key: "status",
      title: "状态",
      width: "110px",
      render: (row) => {
        const cfg = statusConfig[row.status];
        const Icon = cfg.icon;
        return (
          <div className="flex items-center gap-2">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", cfg.bg)}>
              <Icon className={cn("w-4 h-4", cfg.color)} />
            </div>
            <span className={cn("text-sm font-medium", cfg.color)}>{cfg.label}</span>
          </div>
        );
      },
    },
    {
      key: "userName",
      title: "用户",
      render: (row) => (
        <div>
          <p className="text-sm font-medium">{row.userName}</p>
          <p className="text-xs text-gray-500 font-mono">{row.accountId}</p>
        </div>
      ),
    },
    {
      key: "alertType",
      title: "告警类型",
      width: "110px",
      render: (row) => {
        const cfg = alertTypeConfig[row.alertType];
        return <span className={cn("text-sm font-medium", cfg.color)}>{cfg.label}</span>;
      },
    },
    {
      key: "marginLevel",
      title: "保证金水平",
      width: "110px",
      align: "right",
      render: (row) => (
        <span className={cn("text-sm font-bold", row.marginLevel < 30 ? "text-red-600" : row.marginLevel < 50 ? "text-amber-600" : "text-gray-600")}>
          {row.marginLevel}%
        </span>
      ),
    },
    {
      key: "equity",
      title: "净值/保证金",
      width: "140px",
      render: (row) => (
        <div className="text-right">
          <p className="text-sm font-medium">${row.equity.toLocaleString()}</p>
          <p className="text-xs text-gray-500">/ ${row.margin.toLocaleString()}</p>
        </div>
      ),
    },
    {
      key: "triggeredAt",
      title: "触发时间",
      width: "150px",
      render: (row) => (
        <div className="text-sm text-gray-500">
          <p>{row.triggeredAt}</p>
          {row.resolvedAt && <p className="text-xs text-emerald-600">解决: {row.resolvedAt}</p>}
        </div>
      ),
    },
    {
      key: "action",
      title: "处理措施",
      render: (row) => <span className="text-sm text-gray-600">{row.action}</span>,
    },
  ];

  const rowActions: RowAction<MarginAlert>[] = [
    {
      label: "查看详情",
      icon: <TrendingDown className="w-4 h-4" />,
      onClick: (row) => setSelectedAlert(row),
    },
    {
      label: "标记已解决",
      icon: <CheckCircle className="w-4 h-4" />,
      onClick: () => {},
      disabled: (row) => row.status === "resolved" || row.status === "liquidated",
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Risk Center" }, { label: "保证金预警" }]} />

      <PageHeader
        title="保证金预警"
        description="监控交易账户保证金水平，管理强平预警"
        actions={
          <Button variant="secondary">
            <Bell className="w-4 h-4" />
            告警设置
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-500">总预警</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.warning}</p>
              <p className="text-sm text-gray-500">预警中</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.danger}</p>
              <p className="text-sm text-gray-500">危险</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Skull className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">{stats.liquidated}</p>
              <p className="text-sm text-gray-500">已强平</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索用户或账户号..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部状态</option>
            <option value="warning">预警中</option>
            <option value="danger">危险</option>
            <option value="liquidated">已强平</option>
            <option value="resolved">已解决</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部类型</option>
            <option value="margin_call">保证金不足</option>
            <option value="stop_out">强平线</option>
            <option value="near_liquidation">接近强平</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <EnhancedDataTable
        columns={columns}
        data={filteredAlerts}
        keyExtractor={(row) => row.id}
        searchable={false}
        rowActions={rowActions}
        onRowClick={setSelectedAlert}
        emptyText="暂无保证金预警"
      />

      {/* Detail Modal */}
      {selectedAlert && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedAlert(null)} />
          <div className="fixed inset-x-4 top-[10%] max-w-lg mx-auto bg-white rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                {(() => {
                  const cfg = statusConfig[selectedAlert.status];
                  const Icon = cfg.icon;
                  return (
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", cfg.bg)}>
                      <Icon className={cn("w-6 h-6", cfg.color)} />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-lg font-semibold">{selectedAlert.userName}</h2>
                  <p className="text-sm text-gray-500 font-mono">{selectedAlert.accountId}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAlert(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="text-center p-6 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl text-white">
                <p className="text-sm opacity-80">保证金水平</p>
                <p className="text-5xl font-bold mt-1">{selectedAlert.marginLevel}%</p>
                <div className="mt-3 w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white rounded-full h-2 transition-all"
                    style={{ width: `${Math.min(selectedAlert.marginLevel, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-xs text-emerald-600 mb-1">账户净值</p>
                  <p className="text-xl font-bold text-emerald-700">${selectedAlert.equity.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-600 mb-1">已用保证金</p>
                  <p className="text-xl font-bold text-blue-700">${selectedAlert.margin.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">告警类型</p>
                  <span className={cn("text-sm font-medium", alertTypeConfig[selectedAlert.alertType].color)}>
                    {alertTypeConfig[selectedAlert.alertType].label}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">状态</p>
                  <span className={cn("text-sm font-medium", statusConfig[selectedAlert.status].color)}>
                    {statusConfig[selectedAlert.status].label}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">触发时间</p>
                  <p className="text-sm">{selectedAlert.triggeredAt}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">解决时间</p>
                  <p className="text-sm">{selectedAlert.resolvedAt || "-"}</p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">处理措施</p>
                <p className="text-sm">{selectedAlert.action}</p>
                {selectedAlert.handledBy && (
                  <p className="text-xs text-gray-500 mt-1">处理人: {selectedAlert.handledBy}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 p-6 border-t bg-gray-50">
              {(selectedAlert.status === "warning" || selectedAlert.status === "danger") && (
                <>
                  <Button variant="secondary" className="flex-1">
                    <Phone className="w-4 h-4" />
                    联系客户
                  </Button>
                  <Button className="flex-1">
                    <CheckCircle className="w-4 h-4" />
                    标记已解决
                  </Button>
                </>
              )}
              {selectedAlert.status !== "warning" && selectedAlert.status !== "danger" && (
                <Button variant="secondary" className="w-full" onClick={() => setSelectedAlert(null)}>
                  关闭
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
