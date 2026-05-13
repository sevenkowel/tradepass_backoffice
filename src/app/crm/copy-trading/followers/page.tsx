"use client";

import { useState } from "react";
import { PageHeader, Button, StatusBadge } from "@/components/crm/ui";
import { EnhancedDataTable } from "@/components/crm/ui/EnhancedDataTable";
import { FilterBar } from "@/components/crm/ui/FilterBar";
import { Users, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import type { CopyFollower } from "@/types/backoffice";
import { mockCopyFollowers } from "@/lib/backoffice/mock-copy-trading";

export default function CopyFollowersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");

  const filteredFollowers = mockCopyFollowers.filter((follower) => {
    const matchesSearch =
      follower.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      follower.traderName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || follower.status === statusFilter;
    const matchesMode = modeFilter === "all" || follower.followMode === modeFilter;
    return matchesSearch && matchesStatus && matchesMode;
  });

  const columns = [
    {
      key: "username",
      title: "Follower",
      render: (row: CopyFollower) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-600">
              {row.username.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.username}</div>
            <div className="text-xs text-gray-500">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "traderName",
      title: "Following",
      render: (row: CopyFollower) => (
        <div>
          <div className="font-medium text-gray-900">{row.traderName}</div>
          <div className="text-xs text-gray-500 capitalize">{row.followMode} mode</div>
        </div>
      ),
    },
    {
      key: "followAmount",
      title: "Amount",
      render: (row: CopyFollower) => (
        <div className="font-medium text-gray-900">
          ${row.followAmount.toLocaleString()}
        </div>
      ),
    },
    {
      key: "followMode",
      title: "Mode",
      render: (row: CopyFollower) => (
        <div>
          <span className="text-xs font-medium px-2 py-1 rounded bg-blue-50 text-blue-700 capitalize">
            {row.followMode}
          </span>
          {row.followMode === "ratio" && (
            <div className="text-xs text-gray-500 mt-1">{(row.followRatio * 100).toFixed(0)}%</div>
          )}
          {row.followMode === "fixed" && (
            <div className="text-xs text-gray-500 mt-1">{row.fixedLots} lots</div>
          )}
        </div>
      ),
    },
    {
      key: "pnl",
      title: "P&L",
      render: (row: CopyFollower) => (
        <div>
          <div className={`flex items-center gap-1 font-medium ${row.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
            {row.pnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {row.pnl >= 0 ? "+" : ""}${row.pnl.toLocaleString()}
          </div>
          <div className={`text-xs ${row.pnlPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
            {row.pnlPercent >= 0 ? "+" : ""}{row.pnlPercent}%
          </div>
        </div>
      ),
    },
    {
      key: "copyCount",
      title: "Copies",
      render: (row: CopyFollower) => (
        <div className="font-medium text-gray-900">{row.copyCount}</div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (row: CopyFollower) => <StatusBadge status={row.status} />,
    },
  ];

  const activeFollowers = mockCopyFollowers.filter((f) => f.status === "active");
  const totalFollowAmount = mockCopyFollowers.reduce((sum, f) => sum + f.followAmount, 0);
  const totalPnl = mockCopyFollowers.reduce((sum, f) => sum + f.pnl, 0);

  const statsCards = [
    {
      label: "Active Followers",
      value: activeFollowers.length.toString(),
      icon: Users,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Total Follow Amount",
      value: `$${totalFollowAmount.toLocaleString()}`,
      icon: Wallet,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Total P&L",
      value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toLocaleString()}`,
      icon: totalPnl >= 0 ? TrendingUp : TrendingDown,
      iconColor: totalPnl >= 0 ? "text-green-600" : "text-red-600",
      bgColor: totalPnl >= 0 ? "bg-green-50" : "bg-red-50",
    },
    {
      label: "Avg Follow Ratio",
      value: `${(mockCopyFollowers.reduce((sum, f) => sum + f.followRatio, 0) / mockCopyFollowers.length * 100).toFixed(0)}%`,
      icon: TrendingUp,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Copy Trading Followers"
        description="Manage followers and their copy relationships"
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
        searchPlaceholder="Search followers..."
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
              { value: "active", label: "Active" },
              { value: "paused", label: "Paused" },
              { value: "stopped", label: "Stopped" },
            ],
          },
          {
            key: "mode",
            label: "Follow Mode",
            value: modeFilter,
            onChange: setModeFilter,
            options: [
              { value: "all", label: "All Modes" },
              { value: "ratio", label: "Ratio" },
              { value: "fixed", label: "Fixed" },
              { value: "mirror", label: "Mirror" },
            ],
          },
        ]}
        onRefresh={() => {}}
      />

      <EnhancedDataTable<CopyFollower>
        columns={columns}
        data={filteredFollowers}
        keyExtractor={(row) => row.id}
        onRowClick={() => {}}
        emptyText="No followers found"
      />
    </div>
  );
}
