"use client";

import { useState, useEffect } from "react";
import { PageHeader, Button } from "@/components/crm/ui/PageHeader";
import { EnhancedDataTable } from "@/components/crm/ui/EnhancedDataTable";
import { StatusBadge } from "@/components/crm/ui/StatusBadge";
import { FilterBar } from "@/components/crm/ui/FilterBar";
import { IBDrawer } from "@/components/crm/ib/IBDrawer";
import { Plus, Download, TrendingUp, Users, DollarSign } from "lucide-react";
import type { IBPartner } from "@/types/backoffice";

import type { StatusType } from "@/types/backoffice";

const statusColors: Record<string, StatusType> = {
  active: "success",
  inactive: "default",
  suspended: "error",
};

const levelColors: Record<string, StatusType> = {
  manager: "info",
  ib: "info",
  sub_ib: "warning",
};

export default function IBListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [ibPartners, setIbPartners] = useState<IBPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/backoffice/ib")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setIbPartners(data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  const [selectedIB, setSelectedIB] = useState<IBPartner | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredIBs = ibPartners.filter((ib) => {
    const matchesSearch =
      ib.ibId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ib.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ib.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ib.status === statusFilter;
    const matchesLevel = levelFilter === "all" || ib.level === levelFilter;
    return matchesSearch && matchesStatus && matchesLevel;
  });

  const columns = [
    {
      key: "ibId",
      title: "IB ID",
      render: (row: IBPartner) => (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-blue-600">
              {row.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.ibId}</div>
            <div className="text-xs text-gray-500">{row.referralCode}</div>
          </div>
        </div>
      ),
    },
    {
      key: "name",
      title: "Partner",
      render: (row: IBPartner) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-xs text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      key: "level",
      title: "Level",
      render: (row: IBPartner) => (
        <StatusBadge
          status={row.level}
          type={levelColors[row.level]}
        />
      ),
    },
    {
      key: "clients",
      title: "Clients",
      render: (row: IBPartner) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <div>
            <div className="font-medium text-gray-900">{row.totalClients}</div>
            <div className="text-xs text-gray-500">
              {row.activeClients} active
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "volume",
      title: "Total Volume",
      render: (row: IBPartner) => (
        <div className="font-medium text-gray-900">
          ${row.totalVolume.toLocaleString()}
        </div>
      ),
    },
    {
      key: "commission",
      title: "Commission",
      render: (row: IBPartner) => (
        <div>
          <div className="flex items-center gap-1 text-green-600 font-medium">
            <DollarSign className="w-4 h-4" />
            ${row.totalCommission.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            Pending: ${row.pendingCommission.toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      key: "deposit",
      title: "Deposit/Withdraw",
      render: (row: IBPartner) => (
        <div className="text-sm">
          <div className="text-gray-900">
            ${row.totalDeposit.toLocaleString()}
          </div>
          <div className="text-gray-500">
            / ${row.totalWithdrawal.toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (row: IBPartner) => (
<StatusBadge
                  status={row.status}
                  type={statusColors[row.status]}
                />
      ),
    },
    {
      key: "lastActive",
      title: "Last Active",
      render: (row: IBPartner) =>
        row.lastActiveAt ? (
          <div className="text-sm text-gray-600">
            {new Date(row.lastActiveAt).toLocaleDateString()}
          </div>
        ) : (
          <span className="text-gray-400">Never</span>
        ),
    },
  ];

  const handleViewDetail = (ib: IBPartner) => {
    setSelectedIB(ib);
    setDrawerOpen(true);
  };

  const totalClients = ibPartners.reduce((sum, ib) => sum + ib.totalClients, 0);
  const totalCommission = ibPartners.reduce((sum, ib) => sum + ib.totalCommission, 0);
  const pendingCommission = ibPartners.reduce((sum, ib) => sum + ib.pendingCommission, 0);

  const statsCards = [
    {
      label: "Total IB Partners",
      value: ibPartners.length.toString(),
      change: "+3",
      changeType: "positive" as const,
    },
    {
      label: "Total Clients",
      value: totalClients.toString(),
      change: "+24",
      changeType: "positive" as const,
    },
    {
      label: "Total Commission",
      value: `$${totalCommission.toLocaleString()}`,
      change: "+12.5%",
      changeType: "positive" as const,
    },
    {
      label: "Pending Payout",
      value: `$${pendingCommission.toLocaleString()}`,
      change: "",
      changeType: "neutral" as const,
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="IB Partners"
        description="Manage Introducing Broker partners and their commissions"
        actions={
          <>
            <Button
              onClick={() => {}}
              variant="primary"
            >
              <Plus className="w-4 h-4" />
              Add IB
            </Button>
            <Button
              onClick={() => {}}
              variant="secondary"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </>
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
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div
                className={`text-xs font-medium ${
                  stat.changeType === "positive"
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <FilterBar
        searchPlaceholder="Search by IB ID, name or email..."
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
              { value: "inactive", label: "Inactive" },
              { value: "suspended", label: "Suspended" },
            ],
          },
          {
            key: "level",
            label: "Level",
            value: levelFilter,
            onChange: setLevelFilter,
            options: [
              { value: "all", label: "All Levels" },
              { value: "manager", label: "Manager" },
              { value: "ib", label: "IB" },
              { value: "sub_ib", label: "Sub IB" },
            ],
          },
        ]}
        onRefresh={() => {}}
      />

      {/* Data Table */}
      <EnhancedDataTable<IBPartner>
        columns={columns}
        data={filteredIBs}
        onRowClick={handleViewDetail}
        keyExtractor={(row) => row.id}
        emptyText="No IB partners found"
      />

      {/* Detail Drawer */}
      <IBDrawer
        ib={selectedIB}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
