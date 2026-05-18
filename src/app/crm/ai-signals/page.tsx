"use client";

import { useState } from "react";
import { PageHeader, Button, StatusBadge } from "@/components/crm/ui";
import { EnhancedDataTable } from "@/components/crm/ui/EnhancedDataTable";
import { FilterBar } from "@/components/crm/ui/FilterBar";
import { Plus, Zap, Target, Activity, Clock } from "lucide-react";
import type { AISignal } from "@/types/backoffice";
import type { StatusType } from "@/types/backoffice";
import { mockAISignals } from "@/lib/backoffice/mock-ai-signals";

const statusColors: Record<string, StatusType> = {
  active: "info",
  expired: "default",
  hit_sl: "error",
  hit_tp: "success",
  withdrawn: "warning",
};

export default function AISignalsListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [symbolFilter, setSymbolFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredSignals = mockAISignals.filter((signal) => {
    const matchesSearch =
      signal.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      signal.signalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      signal.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSymbol = symbolFilter === "all" || signal.symbol === symbolFilter;
    const matchesStatus = statusFilter === "all" || signal.status === statusFilter;
    return matchesSearch && matchesSymbol && matchesStatus;
  });

  const uniqueSymbols = [...new Set(mockAISignals.map((s) => s.symbol))];

  const columns = [
    {
      key: "signalId",
      title: "Signal",
      render: (row: AISignal) => (
        <div>
          <div className="font-medium text-gray-900">{row.signalId}</div>
          <div className="text-xs text-gray-500">{row.model}</div>
        </div>
      ),
    },
    {
      key: "symbol",
      title: "Symbol",
      render: (row: AISignal) => (
        <div className="font-semibold text-gray-900">{row.symbol}</div>
      ),
    },
    {
      key: "direction",
      title: "Direction",
      render: (row: AISignal) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold ${
            row.direction === "buy"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {row.direction.toUpperCase()}
        </span>
      ),
    },
    {
      key: "entryPrice",
      title: "Entry / SL / TP",
      render: (row: AISignal) => (
        <div className="text-sm">
          <div className="text-gray-900">{row.entryPrice}</div>
          <div className="text-red-500 text-xs">SL: {row.stopLoss}</div>
          <div className="text-green-600 text-xs">TP: {row.takeProfit}</div>
        </div>
      ),
    },
    {
      key: "confidence",
      title: "Confidence",
      render: (row: AISignal) => (
        <div>
          <div className={`font-medium ${row.confidence >= 80 ? "text-green-600" : row.confidence >= 60 ? "text-amber-600" : "text-red-600"}`}>
            {row.confidence}%
          </div>
          <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1">
            <div
              className={`h-full rounded-full ${
                row.confidence >= 80 ? "bg-green-500" : row.confidence >= 60 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${row.confidence}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (row: AISignal) => (
        <StatusBadge status={row.status} type={statusColors[row.status]} />
      ),
    },
    {
      key: "pnl",
      title: "P&L",
      render: (row: AISignal) => (
        row.pnl !== undefined ? (
          <div className={`font-medium ${row.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
            {row.pnl >= 0 ? "+" : ""}${row.pnl}
          </div>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )
      ),
    },
    {
      key: "createdAt",
      title: "Created",
      render: (row: AISignal) => (
        <div className="text-sm text-gray-600">
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      ),
    },
  ];

  const activeSignals = mockAISignals.filter((s) => s.status === "active");
  const hitTpSignals = mockAISignals.filter((s) => s.status === "hit_tp");
  const totalPnl = mockAISignals.reduce((sum, s) => sum + (s.pnl || 0), 0);
  const avgConfidence = mockAISignals.reduce((sum, s) => sum + s.confidence, 0) / mockAISignals.length;

  const statsCards = [
    {
      label: "Active Signals",
      value: activeSignals.length.toString(),
      icon: Zap,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Hit TP",
      value: hitTpSignals.length.toString(),
      icon: Target,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Total P&L",
      value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl}`,
      icon: Activity,
      iconColor: totalPnl >= 0 ? "text-emerald-600" : "text-red-600",
      bgColor: totalPnl >= 0 ? "bg-emerald-50" : "bg-red-50",
    },
    {
      label: "Avg Confidence",
      value: `${avgConfidence.toFixed(0)}%`,
      icon: Clock,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="AI Signal List"
        description="Manage AI-generated trading signals and recommendations"
        actions={
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-1" />
            New Signal
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
        searchPlaceholder="Search signals..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            key: "symbol",
            label: "Symbol",
            value: symbolFilter,
            onChange: setSymbolFilter,
            options: [
              { value: "all", label: "All Symbols" },
              ...uniqueSymbols.map((s) => ({ value: s, label: s })),
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
              { value: "expired", label: "Expired" },
              { value: "hit_tp", label: "Hit TP" },
              { value: "hit_sl", label: "Hit SL" },
              { value: "withdrawn", label: "Withdrawn" },
            ],
          },
        ]}
        onRefresh={() => {}}
      />

      <EnhancedDataTable<AISignal>
        columns={columns}
        data={filteredSignals}
        keyExtractor={(row) => row.id}
        onRowClick={() => {}}
        emptyText="No signals found"
      />
    </div>
  );
}
