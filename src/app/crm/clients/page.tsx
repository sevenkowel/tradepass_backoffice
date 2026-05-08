"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Eye, Ban, Wallet, Loader2, Unlock } from "lucide-react";
import {
  Card,
  PageHeader,
  Button,
  StatusBadge,
  LevelBadge,
  RiskBadge,
  KYCStatusBadge,
  EnhancedDataTable,
  type Column,
  type RowAction,
} from "@/components/crm/ui";
import { FilterBar } from "@/components/crm/ui/FilterBar";
import { Breadcrumb } from "@/components/crm/layout";
import { clientService } from "@/lib/crm/services/client.service";
import type { BackofficeUser, ClientListParams } from "@/types/backoffice/user";

export default function ClientsPage() {
  const [clients, setClients] = useState<BackofficeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pendingKyc: 0,
    frozen: 0,
    highRisk: 0,
    ftdCount: 0,
  });

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Partial<ClientListParams>>({});

  const fetchClients = useCallback(async (params: Partial<ClientListParams> = {}) => {
    setLoading(true);
    setError("");
    try {
      const [listRes, statsRes] = await Promise.all([
        clientService.list({ page: 1, pageSize: 50, ...params }),
        clientService.getStats(),
      ]);
      setClients(listRes.items);
      setStats(statsRes);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(`加载失败: ${err instanceof Error ? err.message : "请稍后重试"}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleFilterChange = useCallback((newFilters: Record<string, unknown>) => {
    const params: Partial<ClientListParams> = {};
    if (newFilters.status) params.status = newFilters.status as BackofficeUser["status"];
    if (newFilters.kyc) params.kycStatus = newFilters.kyc as BackofficeUser["kycStatus"];
    if (newFilters.level) params.level = newFilters.level as BackofficeUser["level"];
    if (newFilters.riskLevel) params.riskLevel = newFilters.riskLevel as BackofficeUser["riskLevel"];
    if (newFilters.lifecycle) params.lifecycleStage = newFilters.lifecycle as BackofficeUser["lifecycleStage"];
    if (newFilters.search) params.search = newFilters.search as string;
    setFilters(params);
    fetchClients(params);
  }, [fetchClients]);

  const handleFreeze = async (client: BackofficeUser) => {
    try {
      if (client.status === "frozen") {
        await clientService.unfreeze(client.id);
      } else {
        await clientService.freeze(client.id);
      }
      fetchClients(filters);
    } catch (err) {
      console.error(err);
    }
  };

  const columns: Column<BackofficeUser>[] = [
    {
      key: "uid",
      title: "UID",
      width: "90px",
      sortable: true,
      render: (row) => (
        <Link href={`/crm/clients/${row.id}`} className="font-mono text-blue-600 hover:underline text-sm">
          {row.uid}
        </Link>
      ),
    },
    {
      key: "name",
      title: "Client",
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.avatar ? (
            <img src={row.avatar} alt={row.name} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium">
              {row.name.slice(0, 1)}
            </div>
          )}
          <div>
            <p className="font-medium text-slate-900 dark:text-white text-sm">{row.name}</p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "country",
      title: "Country",
      width: "80px",
      render: (row) => <span className="text-sm text-slate-600">{row.country || "-"}</span>,
    },
    {
      key: "level",
      title: "Level",
      width: "90px",
      render: (row) => <LevelBadge level={row.level} />,
    },
    {
      key: "balance",
      title: "Balance",
      width: "110px",
      align: "right",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-slate-900 dark:text-white text-sm">
          ${row.balance.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      width: "90px",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "kycStatus",
      title: "KYC",
      width: "100px",
      render: (row) => <KYCStatusBadge status={row.kycStatus} />,
    },
    {
      key: "riskLevel",
      title: "Risk",
      width: "90px",
      render: (row) => <RiskBadge level={row.riskLevel} score={row.riskScore} />,
    },
    {
      key: "tags",
      title: "Tags",
      width: "120px",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
              {tag}
            </span>
          ))}
          {row.tags.length > 2 && (
            <span className="px-1.5 py-0.5 text-slate-400 text-[10px]">+{row.tags.length - 2}</span>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      title: "Registered",
      width: "110px",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleDateString("zh-CN")}</span>
      ),
    },
  ];

  const rowActions: RowAction<BackofficeUser>[] = [
    {
      label: "View",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => {
        window.location.href = `/crm/clients/${row.id}`;
      },
    },
    {
      label: "Adjust Balance",
      icon: <Wallet className="w-4 h-4" />,
      onClick: () => {},
    },
    {
      label: (row) => (row.status === "frozen" ? "Unfreeze" : "Freeze"),
      icon: (row) => (row.status === "frozen" ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />),
      onClick: handleFreeze,
      variant: "danger",
      disabled: (row) => row.status === "closed",
    },
  ];

  const filterOptions = [
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { label: "Active", value: "active" },
        { label: "Frozen", value: "frozen" },
        { label: "Pending", value: "pending" },
        { label: "Closed", value: "closed" },
      ],
    },
    {
      key: "kyc",
      label: "KYC Status",
      type: "select" as const,
      options: [
        { label: "Verified", value: "verified" },
        { label: "Pending", value: "pending" },
        { label: "Rejected", value: "rejected" },
        { label: "Not Submitted", value: "not_submitted" },
      ],
    },
    {
      key: "level",
      label: "Level",
      type: "select" as const,
      options: [
        { label: "Standard", value: "standard" },
        { label: "VIP", value: "vip" },
        { label: "Premium", value: "premium" },
        { label: "Enterprise", value: "enterprise" },
      ],
    },
    {
      key: "riskLevel",
      label: "Risk",
      type: "select" as const,
      options: [
        { label: "Low", value: "low" },
        { label: "Medium", value: "medium" },
        { label: "High", value: "high" },
        { label: "Critical", value: "critical" },
      ],
    },
    {
      key: "lifecycle",
      label: "Lifecycle",
      type: "select" as const,
      options: [
        { label: "Registered", value: "registered" },
        { label: "Verified", value: "verified" },
        { label: "FTD", value: "ftd" },
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Churn", value: "churn" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Clients" }, { label: "Client List" }]} />

      <PageHeader
        title="Client List"
        description="Manage clients, KYC verification, and account settings"
        actions={
          <div className="flex gap-3">
            <Button variant="secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </Button>
            <Button>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Client
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="!p-4">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">Active</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">Pending KYC</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingKyc}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">Frozen</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.frozen}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">High Risk</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{stats.highRisk}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">FTD</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.ftdCount}</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filterOptions}
        searchable
        searchKeys={["uid", "name", "email"]}
        searchPlaceholder="Search UID, name or email..."
        onChange={handleFilterChange}
      />

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
          <span className="font-medium">Error:</span>
          {error}
          <button onClick={() => fetchClients(filters)} className="ml-auto text-red-700 underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* Data Table */}
      <Card padding="none">
        <EnhancedDataTable<BackofficeUser>
          columns={columns}
          data={clients}
          keyExtractor={(row) => row.id}
          selectable
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          rowActions={rowActions}
          onRowClick={(row) => {
            window.location.href = `/crm/clients/${row.id}`;
          }}
          emptyText={loading ? "" : "No clients found"}
          exportable
          onExport={() => {}}
          loading={loading}
        />
      </Card>
    </div>
  );
}
