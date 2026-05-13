"use client";

import { useState } from "react";
import { PageHeader, Button, StatusBadge } from "@/components/crm/ui";
import { EnhancedDataTable } from "@/components/crm/ui/EnhancedDataTable";
import { FilterBar } from "@/components/crm/ui/FilterBar";
import { Users, CreditCard, BarChart3, DollarSign } from "lucide-react";
import type { SignalUsage } from "@/types/backoffice";
import { mockSignalUsages } from "@/lib/backoffice/mock-ai-signals";

import type { StatusType } from "@/types/backoffice";

const planColors: Record<string, StatusType> = {
  free: "default",
  basic: "info",
  pro: "warning",
  enterprise: "success",
};

export default function SignalUsagePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredUsages = mockSignalUsages.filter((usage) => {
    const matchesSearch =
      usage.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usage.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === "all" || usage.planType === planFilter;
    const matchesStatus = statusFilter === "all" || usage.status === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const columns = [
    {
      key: "username",
      title: "User",
      render: (row: SignalUsage) => (
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
      key: "planType",
      title: "Plan",
      render: (row: SignalUsage) => (
        <StatusBadge status={row.planType} type={planColors[row.planType]} />
      ),
    },
    {
      key: "quota",
      title: "Quota",
      render: (row: SignalUsage) => (
        <div>
          <div className="text-sm text-gray-900">
            {row.quotaUsed} / {row.quotaTotal}
          </div>
          <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1">
            <div
              className={`h-full rounded-full ${
                row.quotaUsed / row.quotaTotal > 0.9
                  ? "bg-red-500"
                  : row.quotaUsed / row.quotaTotal > 0.7
                  ? "bg-amber-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${(row.quotaUsed / row.quotaTotal) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{row.quotaRemaining} left</div>
        </div>
      ),
    },
    {
      key: "price",
      title: "Price",
      render: (row: SignalUsage) => (
        <div className="font-medium text-gray-900">
          {row.price === 0 ? "Free" : `$${row.price}/mo`}
        </div>
      ),
    },
    {
      key: "validUntil",
      title: "Valid Until",
      render: (row: SignalUsage) => (
        <div className="text-sm text-gray-600">
          {new Date(row.validUntil).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (row: SignalUsage) => <StatusBadge status={row.status} />,
    },
    {
      key: "lastUsedAt",
      title: "Last Used",
      render: (row: SignalUsage) => (
        <div className="text-sm text-gray-600">
          {new Date(row.lastUsedAt).toLocaleDateString()}
        </div>
      ),
    },
  ];

  const activeUsers = mockSignalUsages.filter((u) => u.status === "active");
  const paidUsers = mockSignalUsages.filter((u) => u.price > 0 && u.status === "active");
  const monthlyRevenue = paidUsers.reduce((sum, u) => sum + u.price, 0);
  const totalQuotaUsed = mockSignalUsages.reduce((sum, u) => sum + u.quotaUsed, 0);
  const totalQuota = mockSignalUsages.reduce((sum, u) => sum + u.quotaTotal, 0);

  const statsCards = [
    {
      label: "Active Subscribers",
      value: activeUsers.length.toString(),
      icon: Users,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Paid Subscribers",
      value: paidUsers.length.toString(),
      icon: CreditCard,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Monthly Revenue",
      value: `$${monthlyRevenue}`,
      icon: DollarSign,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Quota Usage",
      value: `${((totalQuotaUsed / totalQuota) * 100).toFixed(0)}%`,
      icon: BarChart3,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Signal Usage Control"
        description="Manage AI signal subscriptions and quotas"
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
        searchPlaceholder="Search users..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            key: "plan",
            label: "Plan",
            value: planFilter,
            onChange: setPlanFilter,
            options: [
              { value: "all", label: "All Plans" },
              { value: "free", label: "Free" },
              { value: "basic", label: "Basic" },
              { value: "pro", label: "Pro" },
              { value: "enterprise", label: "Enterprise" },
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
              { value: "suspended", label: "Suspended" },
            ],
          },
        ]}
        onRefresh={() => {}}
      />

      <EnhancedDataTable<SignalUsage>
        columns={columns}
        data={filteredUsages}
        keyExtractor={(row) => row.id}
        onRowClick={() => {}}
        emptyText="No usage records found"
      />
    </div>
  );
}
