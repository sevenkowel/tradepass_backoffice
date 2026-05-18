"use client";

import { useState, useEffect } from "react";
import { PageHeader, Button } from "@/components/crm/ui/PageHeader";
import { EnhancedDataTable } from "@/components/crm/ui/EnhancedDataTable";
import { StatusBadge } from "@/components/crm/ui/StatusBadge";
import { FilterBar } from "@/components/crm/ui/FilterBar";
import { Download, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import type { Order } from "@/types/backoffice";
import type { StatusType } from "@/types/backoffice";

const statusColors: Record<string, StatusType> = {
  open: "success",
  pending: "warning",
  closed: "default",
  cancelled: "error",
};

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/backoffice/trading/orders")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setOrders(data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.accountId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesType = typeFilter === "all" || order.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const columns = [
    {
      key: "orderId",
      title: "Order ID",
      render: (row: Order) => (
        <div className="font-mono text-sm text-gray-900">{row.orderId}</div>
      ),
    },
    {
      key: "accountId",
      title: "Account",
      render: (row: Order) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{row.accountId}</div>
        </div>
      ),
    },
    {
      key: "symbol",
      title: "Symbol",
      render: (row: Order) => (
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
      render: (row: Order) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{row.volume.toFixed(2)} lots</div>
        </div>
      ),
    },
    {
      key: "price",
      title: "Price",
      render: (row: Order) => (
        <div className="text-sm">
          <div className="text-gray-900">Open: {row.openPrice.toFixed(5)}</div>
          <div className="text-gray-500">Current: {row.currentPrice.toFixed(5)}</div>
        </div>
      ),
    },
    {
      key: "tp",
      title: "TP / SL",
      render: (row: Order) => (
        <div className="text-sm text-gray-600">
          {row.tp ? row.tp.toFixed(5) : "-"} / {row.sl ? row.sl.toFixed(5) : "-"}
        </div>
      ),
    },
    {
      key: "profit",
      title: "Profit",
      render: (row: Order) => {
        const isProfit = row.profit >= 0;
        return (
          <div
            className={`font-medium ${
              row.status === "closed"
                ? "text-gray-900"
                : isProfit
                  ? "text-green-600"
                  : "text-red-600"
            }`}
          >
            {row.status === "closed" ? "Closed: " : ""}
            {isProfit ? "+" : ""}${row.profit.toFixed(2)}
          </div>
        );
      },
    },
    {
      key: "status",
      title: "Status",
      render: (row: Order) => (
<StatusBadge
                  status={row.status}
                  type={statusColors[row.status]}
                />
      ),
    },
    {
      key: "time",
      title: "Time",
      render: (row: Order) => (
        <div className="text-sm text-gray-600">
          <div>{new Date(row.createdAt).toLocaleDateString()}</div>
          <div className="text-xs text-gray-400">
            {new Date(row.createdAt).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
  ];

  const totalProfit = filteredOrders
    .filter((o) => o.status === "open")
    .reduce((sum, o) => sum + o.profit, 0);

  const statsCards = [
    {
      label: "Open Orders",
      value: orders.filter((o) => o.status === "open").length.toString(),
      change: "",
      changeType: "neutral" as const,
    },
    {
      label: "Total Volume (Open)",
      value: `${orders.filter((o) => o.status === "open").reduce((sum, o) => sum + o.volume, 0).toFixed(2)} lots`,
      change: "",
      changeType: "neutral" as const,
    },
    {
      label: "Open P&L",
      value: `${totalProfit >= 0 ? "+" : ""}$${totalProfit.toFixed(2)}`,
      change: "",
      changeType: (totalProfit >= 0 ? "positive" : "negative") as "positive" | "negative",
    },
    {
      label: "Today Closed",
      value: orders.filter((o) => o.status === "closed").length.toString(),
      change: "",
      changeType: "neutral" as const,
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Orders"
        description="Monitor and manage trading orders across all accounts"
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
        searchPlaceholder="Search by order ID, account or symbol..."
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
              { value: "pending", label: "Pending" },
              { value: "closed", label: "Closed" },
              { value: "cancelled", label: "Cancelled" },
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
      <EnhancedDataTable<Order>
        columns={columns}
        data={filteredOrders}
        keyExtractor={(row) => row.id}
        emptyText="No orders found"
      />
    </div>
  );
}
