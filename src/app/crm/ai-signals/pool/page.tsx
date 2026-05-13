"use client";

import { useState } from "react";
import { PageHeader, Button, StatusBadge } from "@/components/crm/ui";
import { EnhancedDataTable } from "@/components/crm/ui/EnhancedDataTable";
import { FilterBar } from "@/components/crm/ui/FilterBar";
import { Cpu, Target, TrendingUp, Activity, BarChart3, Zap } from "lucide-react";
import type { SignalModel } from "@/types/backoffice";
import { mockSignalModels } from "@/lib/backoffice/mock-ai-signals";

const typeColors: Record<string, string> = {
  technical: "info",
  ml: "success",
  sentiment: "warning",
  composite: "primary",
};

const freqLabels: Record<string, string> = {
  realtime: "Real-time",
  hourly: "Hourly",
  daily: "Daily",
};

export default function SignalPoolPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredModels = mockSignalModels.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || model.type === typeFilter;
    const matchesStatus = statusFilter === "all" || model.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const columns = [
    {
      key: "name",
      title: "Model",
      render: (row: SignalModel) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.name}</div>
            <div className="text-xs text-gray-500 capitalize">{row.type}</div>
          </div>
        </div>
      ),
    },
    {
      key: "accuracy",
      title: "Accuracy",
      render: (row: SignalModel) => (
        <div>
          <div className={`font-medium ${row.accuracy >= 80 ? "text-green-600" : row.accuracy >= 60 ? "text-amber-600" : "text-red-600"}`}>
            {row.accuracy}%
          </div>
          <div className="text-xs text-gray-500">
            {row.winSignals} / {row.totalSignals} wins
          </div>
        </div>
      ),
    },
    {
      key: "frequency",
      title: "Frequency",
      render: (row: SignalModel) => (
        <span className="text-sm text-gray-600">{freqLabels[row.frequency] || row.frequency}</span>
      ),
    },
    {
      key: "backtestReturn",
      title: "Backtest",
      render: (row: SignalModel) => (
        <div>
          <div className="font-medium text-green-600">+{row.backtestReturn}%</div>
          <div className="text-xs text-gray-500">Sharpe: {row.sharpeRatio}</div>
        </div>
      ),
    },
    {
      key: "maxDrawdown",
      title: "Max DD",
      render: (row: SignalModel) => (
        <div className={`font-medium ${row.maxDrawdown > 20 ? "text-red-600" : "text-amber-600"}`}>
          {row.maxDrawdown}%
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (row: SignalModel) => (
        <StatusBadge status={row.status} type={row.status === "training" ? "warning" : undefined} />
      ),
    },
    {
      key: "createdAt",
      title: "Created",
      render: (row: SignalModel) => (
        <div className="text-sm text-gray-600">
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      ),
    },
  ];

  const activeModels = mockSignalModels.filter((m) => m.status === "active");
  const avgAccuracy = mockSignalModels.reduce((sum, m) => sum + m.accuracy, 0) / mockSignalModels.length;
  const totalSignals = mockSignalModels.reduce((sum, m) => sum + m.totalSignals, 0);
  const bestReturn = Math.max(...mockSignalModels.map((m) => m.backtestReturn));

  const statsCards = [
    {
      label: "Active Models",
      value: activeModels.length.toString(),
      icon: Cpu,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Avg Accuracy",
      value: `${avgAccuracy.toFixed(1)}%`,
      icon: Target,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Total Signals",
      value: totalSignals.toLocaleString(),
      icon: Zap,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "Best Backtest",
      value: `+${bestReturn}%`,
      icon: TrendingUp,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Signal Pool"
        description="Manage AI signal models and sources"
        actions={
          <Button variant="primary">
            <Activity className="w-4 h-4 mr-1" />
            Run Backtest
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statsCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-full`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <FilterBar
        searchPlaceholder="Search models..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            key: "type",
            label: "Type",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { value: "all", label: "All Types" },
              { value: "technical", label: "Technical" },
              { value: "ml", label: "ML" },
              { value: "sentiment", label: "Sentiment" },
              { value: "composite", label: "Composite" },
            ],
          },
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "training", label: "Training" },
            ],
          },
        ]}
        onRefresh={() => {}}
      />

      <EnhancedDataTable<SignalModel>
        columns={columns}
        data={filteredModels}
        keyExtractor={(row) => row.id}
        onRowClick={() => {}}
        emptyText="No signal models found"
      />
    </div>
  );
}
