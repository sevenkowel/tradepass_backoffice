"use client";

import { useState } from "react";
import { PageHeader, Button, StatusBadge } from "@/components/crm/ui";
import { EnhancedDataTable } from "@/components/crm/ui/EnhancedDataTable";
import { FilterBar } from "@/components/crm/ui/FilterBar";
import { Plus, Users, TrendingUp, Wallet, Award } from "lucide-react";
import type { CopyTrader } from "@/types/backoffice";
import { mockCopyTraders } from "@/lib/backoffice/mock-copy-trading";

import type { StatusType } from "@/types/backoffice";

const riskColors: Record<string, StatusType> = {
  low: "success",
  medium: "warning",
  high: "error",
};

export default function CopyTradersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredTraders = mockCopyTraders.filter((trader) => {
    const matchesSearch =
      trader.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trader.traderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trader.strategy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === "all" || trader.riskLevel === riskFilter;
    const matchesStatus = statusFilter === "all" || trader.status === statusFilter;
    return matchesSearch && matchesRisk && matchesStatus;
  });

  const columns = [
    {
      key: "traderId",
      title: "Trader",
      render: (row: CopyTrader) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-sm font-bold text-blue-600">
              {row.name.split(" ").map((n) => n[0]).join("")}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.name}</div>
            <div className="text-xs text-gray-500">{row.traderId}</div>
          </div>
        </div>
      ),
    },
    {
      key: "returnRate",
      title: "Return",
      render: (row: CopyTrader) => (
        <div>
          <div className={`font-medium ${row.returnRate >= 0 ? "text-green-600" : "text-red-600"}`}>
            {row.returnRate >= 0 ? "+" : ""}{row.returnRate}%
          </div>
          <div className="text-xs text-gray-500">Monthly: {row.monthlyReturn}%</div>
        </div>
      ),
    },
    {
      key: "followers",
      title: "Followers",
      render: (row: CopyTrader) => (
        <div>
          <div className="font-medium text-gray-900">{row.followers}</div>
          <div className="text-xs text-gray-500">Max: {row.maxFollowers}</div>
        </div>
      ),
    },
    {
      key: "aum",
      title: "AUM",
      render: (row: CopyTrader) => (
        <div className="font-medium text-gray-900">
          ${row.aum.toLocaleString()}
        </div>
      ),
    },
    {
      key: "winRate",
      title: "Win Rate",
      render: (row: CopyTrader) => (
        <div>
          <div className="font-medium text-gray-900">{row.winRate}%</div>
          <div className="text-xs text-gray-500">{row.totalTrades} trades</div>
        </div>
      ),
    },
    {
      key: "riskLevel",
      title: "Risk",
      render: (row: CopyTrader) => (
        <StatusBadge status={row.riskLevel} type={riskColors[row.riskLevel]} />
      ),
    },
    {
      key: "strategy",
      title: "Strategy",
      render: (row: CopyTrader) => (
        <span className="text-sm text-gray-600">{row.strategy}</span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (row: CopyTrader) => <StatusBadge status={row.status} />,
    },
  ];

  const totalAum = mockCopyTraders.reduce((sum, t) => sum + t.aum, 0);
  const totalFollowers = mockCopyTraders.reduce((sum, t) => sum + t.followers, 0);
  const avgReturn = mockCopyTraders.reduce((sum, t) => sum + t.returnRate, 0) / mockCopyTraders.length;

  const statsCards = [
    {
      label: "Active Traders",
      value: mockCopyTraders.filter((t) => t.status === "active").length.toString(),
      icon: Award,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Total Followers",
      value: totalFollowers.toLocaleString(),
      icon: Users,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Total AUM",
      value: `$${(totalAum / 1000000).toFixed(1)}M`,
      icon: Wallet,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Avg Return",
      value: `${avgReturn.toFixed(1)}%`,
      icon: TrendingUp,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Copy Trading Traders"
        description="Manage master traders available for copy trading"
        actions={
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-1" />
            Add Trader
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
        searchPlaceholder="Search traders..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            key: "risk",
            label: "Risk Level",
            value: riskFilter,
            onChange: setRiskFilter,
            options: [
              { value: "all", label: "All Risk" },
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
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
              { value: "suspended", label: "Suspended" },
            ],
          },
        ]}
        onRefresh={() => {}}
      />

      <EnhancedDataTable<CopyTrader>
        columns={columns}
        data={filteredTraders}
        keyExtractor={(row) => row.id}
        onRowClick={() => {}}
        emptyText="No traders found"
      />
    </div>
  );
}
