"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/crm/ui/PageHeader";
import { StatusBadge } from "@/components/crm/ui/StatusBadge";
import { EnhancedDataTable } from "@/components/crm/ui/EnhancedDataTable";
import { FilterBar } from "@/components/crm/ui/FilterBar";
import { RiskAlertDrawer } from "@/components/crm/risk/RiskAlertDrawer";
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import type { RiskAlert, RiskMetric } from "@/types/backoffice";
import type { StatusType } from "@/types/backoffice";

const levelColors: Record<string, StatusType> = {
  info: "info",
  warning: "warning",
  critical: "error",
};

const statusIcons: Record<string, React.ReactNode> = {
  new: <Clock className="w-4 h-4 text-blue-500" />,
  acknowledged: <AlertCircle className="w-4 h-4 text-yellow-500" />,
  resolved: <CheckCircle className="w-4 h-4 text-green-500" />,
  escalated: <AlertTriangle className="w-4 h-4 text-red-500" />,
};

export default function RiskDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAlert, setSelectedAlert] = useState<RiskAlert | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [riskEvents, setRiskEvents] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/backoffice/risk/events")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setRiskEvents(data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredAlerts = riskEvents.filter((alert) => {
    const matchesSearch =
      alert.alertId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.accountId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === "all" || alert.level === levelFilter;
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const handleViewAlert = (alert: RiskAlert) => {
    setSelectedAlert(alert);
    setDrawerOpen(true);
  };

  const riskMetrics: RiskMetric[] = [
    {
      id: "margin_level",
      name: "Avg Margin Level",
      value: 285,
      change: -5.2,
      trend: "down",
      threshold: 150,
      status: "normal",
    },
    {
      id: "open_positions",
      name: "Open Positions",
      value: 156,
      change: 12,
      trend: "up",
      threshold: 200,
      status: "normal",
    },
    {
      id: "daily_volume",
      name: "Daily Volume",
      value: 2345,
      change: 8.5,
      trend: "up",
      threshold: 5000,
      status: "normal",
    },
    {
      id: "margin_call_count",
      name: "Margin Call Accounts",
      value: 3,
      change: -1,
      trend: "down",
      threshold: 5,
      status: "warning",
    },
  ];

  const columns = [
    {
      key: "alertId",
      title: "Alert ID",
      render: (row: RiskAlert) => (
        <div className="font-mono text-sm">{row.alertId}</div>
      ),
    },
    {
      key: "level",
      title: "Level",
      render: (row: RiskAlert) => (
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              row.level === "critical"
                ? "bg-red-100"
                : row.level === "warning"
                  ? "bg-yellow-100"
                  : "bg-blue-100"
            }`}
          >
            <AlertTriangle
              className={`w-4 h-4 ${
                row.level === "critical"
                  ? "text-red-600"
                  : row.level === "warning"
                    ? "text-yellow-600"
                    : "text-blue-600"
              }`}
            />
          </div>
          <StatusBadge
            status={row.level}
            type={levelColors[row.level]}
          />
        </div>
      ),
    },
    {
      key: "accountId",
      title: "Account",
      render: (row: RiskAlert) => (
        <div>
          <div className="font-medium text-gray-900">{row.accountId}</div>
          <div className="text-xs text-gray-500">{row.username}</div>
        </div>
      ),
    },
    {
      key: "type",
      title: "Type",
      render: (row: RiskAlert) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 capitalize">
            {row.type.replace(/_/g, " ")}
          </div>
        </div>
      ),
    },
    {
      key: "title",
      title: "Description",
      render: (row: RiskAlert) => (
        <div className="max-w-xs">
          <div className="font-medium text-gray-900 truncate">{row.title}</div>
          <div className="text-xs text-gray-500 truncate">{row.description}</div>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (row: RiskAlert) => (
        <div className="flex items-center gap-2">
          {statusIcons[row.status]}
          <span className="text-sm capitalize">{row.status}</span>
        </div>
      ),
    },
    {
      key: "createdAt",
      title: "Created",
      render: (row: RiskAlert) => (
        <div className="text-sm text-gray-600">
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      ),
    },
  ];

  const criticalCount = riskEvents.filter((a) => a.level === "critical" && a.status === "new").length;
  const warningCount = riskEvents.filter((a) => a.level === "warning" && a.status === "new").length;
  const newCount = riskEvents.filter((a) => a.status === "new").length;

  const statsCards = [
    {
      label: "Critical Alerts",
      value: criticalCount.toString(),
      change: "",
      changeType: criticalCount > 0 ? "negative" : "positive",
      icon: AlertTriangle,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      label: "Warnings",
      value: warningCount.toString(),
      change: "",
      changeType: warningCount > 0 ? "negative" : "positive",
      icon: AlertCircle,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      label: "New Alerts",
      value: newCount.toString(),
      change: "",
      changeType: "neutral" as const,
      icon: Clock,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Margin Call Accounts",
      value: "0",
      change: "",
      changeType: "neutral" as const,
      icon: Shield,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Risk Dashboard"
        description="Monitor risk metrics and manage risk alerts across all accounts"
      />

      {/* Risk Metrics */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Risk Metrics</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {riskMetrics.map((metric) => (
            <div
              key={metric.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">{metric.name}</span>
                {metric.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {metric.value.toLocaleString()}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div
                  className={`text-xs ${
                    metric.status === "normal"
                      ? "text-green-600"
                      : metric.status === "warning"
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {metric.status}
                </div>
                <div className="text-xs text-gray-400">
                  Threshold: {metric.threshold}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statsCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
                <div
                  className={`text-3xl font-bold ${
                    stat.changeType === "positive"
                      ? "text-green-600"
                      : "text-gray-900"
                  }`}
                >
                  {stat.value}
                </div>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-full`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <FilterBar
        searchPlaceholder="Search by alert ID, account or description..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            key: "level",
            label: "Level",
            value: levelFilter,
            onChange: setLevelFilter,
            options: [
              { value: "all", label: "All Levels" },
              { value: "critical", label: "Critical" },
              { value: "warning", label: "Warning" },
              { value: "info", label: "Info" },
            ],
          },
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All Status" },
              { value: "new", label: "New" },
              { value: "acknowledged", label: "Acknowledged" },
              { value: "resolved", label: "Resolved" },
              { value: "escalated", label: "Escalated" },
            ],
          },
        ]}
        onRefresh={() => {}}
      />

      {/* Data Table */}
      <EnhancedDataTable<RiskAlert>
        columns={columns}
        data={filteredAlerts}
        onRowClick={handleViewAlert}
        keyExtractor={(row) => row.id}
        emptyText="No alerts found"
      />

      {/* Alert Detail Drawer */}
      <RiskAlertDrawer
        alert={selectedAlert}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
