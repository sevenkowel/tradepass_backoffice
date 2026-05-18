"use client";

import { useState } from "react";
import { PageHeader, Button, StatusBadge } from "@/components/crm/ui";
import { EnhancedDataTable } from "@/components/crm/ui/EnhancedDataTable";
import { FilterBar } from "@/components/crm/ui/FilterBar";
import { DollarSign, Download, TrendingUp, Wallet, PiggyBank } from "lucide-react";
import type { ProfitRecord } from "@/types/backoffice";
import type { StatusType } from "@/types/backoffice";
import { mockProfitRecords } from "@/lib/backoffice/mock-copy-trading";

const statusColors: Record<string, StatusType> = {
  pending: "warning",
  settled: "success",
  disputed: "error",
};

export default function ProfitSharingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRecords = mockProfitRecords.filter((record) => {
    const matchesSearch =
      record.traderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.followerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.period.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: "traderName",
      title: "Trader",
      render: (row: ProfitRecord) => (
        <div>
          <div className="font-medium text-gray-900">{row.traderName}</div>
          <div className="text-xs text-gray-500">{row.traderId}</div>
        </div>
      ),
    },
    {
      key: "followerName",
      title: "Follower",
      render: (row: ProfitRecord) => (
        <div>
          <div className="font-medium text-gray-900">{row.followerName}</div>
          <div className="text-xs text-gray-500">{row.followerId}</div>
        </div>
      ),
    },
    {
      key: "profitAmount",
      title: "Profit",
      render: (row: ProfitRecord) => (
        <div className={`font-medium ${row.profitAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
          {row.profitAmount >= 0 ? "+" : ""}${row.profitAmount.toLocaleString()}
        </div>
      ),
    },
    {
      key: "shareRatio",
      title: "Share Ratio",
      render: (row: ProfitRecord) => (
        <div className="font-medium text-gray-900">{(row.shareRatio * 100).toFixed(0)}%</div>
      ),
    },
    {
      key: "platformFee",
      title: "Platform Fee",
      render: (row: ProfitRecord) => (
        <div className="text-sm text-gray-600">${row.platformFee.toLocaleString()}</div>
      ),
    },
    {
      key: "traderShare",
      title: "Trader",
      render: (row: ProfitRecord) => (
        <div className="text-sm text-gray-600">${row.traderShare.toLocaleString()}</div>
      ),
    },
    {
      key: "netAmount",
      title: "Net to Follower",
      render: (row: ProfitRecord) => (
        <div className="font-medium text-gray-900">${row.netAmount.toLocaleString()}</div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (row: ProfitRecord) => (
        <StatusBadge status={row.status} type={statusColors[row.status]} />
      ),
    },
    {
      key: "period",
      title: "Period",
      render: (row: ProfitRecord) => (
        <div className="text-sm text-gray-600">{row.period}</div>
      ),
    },
  ];

  const pendingRecords = mockProfitRecords.filter((r) => r.status === "pending");
  const settledRecords = mockProfitRecords.filter((r) => r.status === "settled");
  const platformIncome = mockProfitRecords.reduce((sum, r) => sum + r.platformFee, 0);
  const traderIncome = mockProfitRecords.reduce((sum, r) => sum + r.traderShare, 0);

  const statsCards = [
    {
      label: "Pending Settlement",
      value: `$${pendingRecords.reduce((sum, r) => sum + r.profitAmount, 0).toLocaleString()}`,
      icon: Wallet,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "Settled Amount",
      value: `$${settledRecords.reduce((sum, r) => sum + r.profitAmount, 0).toLocaleString()}`,
      icon: DollarSign,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Platform Income",
      value: `$${platformIncome.toLocaleString()}`,
      icon: PiggyBank,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Trader Income",
      value: `$${traderIncome.toLocaleString()}`,
      icon: TrendingUp,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Profit Sharing"
        description="Profit distribution records and settlements"
        actions={
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-1" />
            Export
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
        searchPlaceholder="Search records..."
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
              { value: "pending", label: "Pending" },
              { value: "settled", label: "Settled" },
              { value: "disputed", label: "Disputed" },
            ],
          },
        ]}
        onRefresh={() => {}}
      />

      <EnhancedDataTable<ProfitRecord>
        columns={columns}
        data={filteredRecords}
        keyExtractor={(row) => row.id}
        onRowClick={() => {}}
        emptyText="No profit records found"
      />
    </div>
  );
}
