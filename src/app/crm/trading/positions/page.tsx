"use client";

import { useState, useEffect } from "react";
import { PageHeader, Button } from "@/components/crm/ui/PageHeader";
import { EnhancedDataTable } from "@/components/crm/ui/EnhancedDataTable";
import { StatusBadge } from "@/components/crm/ui/StatusBadge";
import { FilterBar } from "@/components/crm/ui/FilterBar";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import type { Position } from "@/types/backoffice";

import type { StatusType } from "@/types/backoffice";

const statusColors: Record<string, StatusType> = {
  open: "success",
  closed: "default",
  partial: "warning",
};

export default function PositionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/backoffice/trading/positions")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPositions(data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredPositions = positions.filter((position) => {
    const matchesSearch =
      position.ticket.toLowerCase().includes(searchQuery.toLowerCase()) ||
      position.accountId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      position.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || position.status === statusFilter;
    const matchesType = typeFilter === "all" || position.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const columns = [
    {
      key: "ticket",
      title: "Ticket",
      render: (row: Position) => (
        <div className="font-mono text-sm text-gray-900">{row.ticket}</div>
      ),
    },
    {
      key: "accountId",
      title: "Account",
      render: (row: Position) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{row.accountId}</div>
        </div>
      ),
    },
    {
      key: "symbol",
      title: "Symbol",
      render: (row: Position) => (
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              row.type === "buy" ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {row.type === "buy" ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.symbol}</div>
            <div className="text-xs text-gray-500 capitalize">{row.type}</div>
          </div>
        </div>
      ),
    },
    {
      key: "volume",
      title: "Volume",
      render: (row: Position) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{row.volume.toFixed(2)} lots</div>
        </div>
      ),
    },
    {
      key: "price",
      title: "Open / Current",
      render: (row: Position) => (
        <div className="text-sm">
          <div className="text-gray-900">{row.openPrice.toFixed(5)}</div>
          <div className="text-gray-500">{row.currentPrice.toFixed(5)}</div>
        </div>
      ),
    },
    {
      key: "profit",
      title: "Profit",
      render: (row: Position) => {
        const isProfit = row.profit >= 0;
        return (
          <div className={`font-medium ${isProfit ? "text-green-600" : "text-red-600"}`}>
            {isProfit ? "+" : ""}${row.profit.toFixed(2)}
          </div>
        );
      },
    },
    {
      key: "margin",
      title: "Margin",
      render: (row: Position) => (
        <div className="text-sm text-gray-600">${row.margin.toFixed(2)}</div>
      ),
    },
    {
      key: "tp",
      title: "TP / SL",
      render: (row: Position) => (
        <div className="text-sm text-gray-600">
          {row.tp ? row.tp.toFixed(5) : "-"} / {row.sl ? row.sl.toFixed(5) : "-"}
        </div>
      ),
    },
    {
      key: "openTime",
      title: "Open Time",
      render: (row: Position) => (
        <div className="text-sm text-gray-600">
          <div>{new Date(row.openTime).toLocaleDateString()}</div>
          <div className="text-xs text-gray-400">
            {new Date(row.openTime).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
  ];

  const totalProfit = filteredPositions.reduce((sum, p) => sum + p.profit, 0);
  const totalMargin = filteredPositions.reduce((sum, p) => sum + p.margin, 0);
  const totalVolume = filteredPositions.reduce((sum, p) => sum + p.volume, 0);

  const statsCards = [
    {
      label: "Open Positions",
      value: positions.length.toString(),
      change: "",
      changeType: "neutral" as const,
    },
    {
      label: "Total Volume",
      value: `${totalVolume.toFixed(2)} lots`,
      change: "",
      changeType: "neutral" as const,
    },
    {
      label: "Total Margin",
      value: `$${totalMargin.toFixed(2)}`,
      change: "",
      changeType: "neutral" as const,
    },
    {
      label: "Total P&L",
      value: `${totalProfit >= 0 ? "+" : ""}$${totalProfit.toFixed(2)}`,
      change: "",
      changeType: (totalProfit >= 0 ? "positive" : "negative") ,
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Positions"
        description="Real-time view of all open trading positions"
        actions={
          <Button
            onClick={() => {}}
            variant="secondary"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statsCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
            <div className="flex items-end justify-between">
              <div
                className={`text-2xl font-bold ${
                  stat.changeType === "positive"
                    ? "text-green-600"
                    : "text-gray-900"
                }`}
              >
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <FilterBar
        searchPlaceholder="Search by ticket, account or symbol..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All Status" },
              { value: "open", label: "Open" },
              { value: "partial", label: "Partial" },
              { value: "closed", label: "Closed" },
            ],
          },
          {
            key: "type",
            label: "Type",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { value: "all", label: "All Types" },
              { value: "buy", label: "Buy" },
              { value: "sell", label: "Sell" },
            ],
          },
        ]}
        onRefresh={() => {}}
      />

      {/* Data Table */}
      <EnhancedDataTable<Position>
        columns={columns}
        data={filteredPositions}
        keyExtractor={(row) => row.id}
        emptyText="No positions found"
      />
    </div>
  );
}
