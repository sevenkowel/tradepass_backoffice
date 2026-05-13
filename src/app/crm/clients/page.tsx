"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Eye, Ban, Wallet, Unlock, Plus, Download } from "lucide-react";
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
import { useT } from "@/lib/i18n/LocaleProvider";
import type { BackofficeUser, ClientListParams } from "@/types/backoffice/user";

const DEFAULT_STATS = {
  total: 0,
  active: 0,
  pendingKyc: 0,
  frozen: 0,
  highRisk: 0,
  ftdCount: 0,
};

export default function ClientsPage() {
  const { t, locale } = useT();
  const [clients, setClients] = useState<BackofficeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(DEFAULT_STATS);

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Partial<ClientListParams>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchClients = useCallback(
    async (params: Partial<ClientListParams> = {}) => {
      setLoading(true);
      setError("");
      try {
        const [listRes, statsRes] = await Promise.all([
          clientService.list({ page, pageSize, ...filters, ...params }),
          clientService.getStats(),
        ]);
        setClients(listRes.items);
        setTotal(listRes.total);
        setStats(statsRes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, filters]
  );

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleFilterChange = useCallback(
    (newFilters: Record<string, string>) => {
      const next: Partial<ClientListParams> = {};
      if (newFilters.status) next.status = newFilters.status as BackofficeUser["status"];
      if (newFilters.kyc) next.kycStatus = newFilters.kyc as BackofficeUser["kycStatus"];
      if (newFilters.level) next.level = newFilters.level as BackofficeUser["level"];
      if (newFilters.riskLevel) next.riskLevel = newFilters.riskLevel as BackofficeUser["riskLevel"];
      if (newFilters.lifecycle) next.lifecycleStage = newFilters.lifecycle as BackofficeUser["lifecycleStage"];
      if (newFilters.search) next.search = newFilters.search;
      if (newFilters.startDate) next.startDate = newFilters.startDate;
      if (newFilters.endDate) next.endDate = newFilters.endDate;
      setPage(1);
      setFilters(next);
    },
    []
  );

  const handleFreeze = async (client: BackofficeUser) => {
    try {
      if (client.status === "frozen") {
        await clientService.unfreeze(client.id);
      } else {
        await clientService.freeze(client.id);
      }
      fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mutation failed");
    }
  };

  const handleExport = () => {
    const headers = [
      "uid",
      "name",
      "email",
      "phone",
      "status",
      "kycStatus",
      "level",
      "balance",
      "riskLevel",
      "lifecycleStage",
      "createdAt",
    ];
    const rows = clients.map((c) =>
      headers
        .map((h) => {
          const v = (c as unknown as Record<string, unknown>)[h];
          return v == null ? "" : String(v).replace(/"/g, '""');
        })
        .map((v) => `"${v}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const dateLocale = locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : locale === "es" ? "es-ES" : "en-US";

  const columns = useMemo<Column<BackofficeUser>[]>(
    () => [
      {
        key: "uid",
        title: t("clients.col.uid"),
        width: "100px",
        sortable: true,
        render: (row) => (
          <Link href={`/crm/clients/${row.id}`} className="font-mono text-blue-600 hover:underline text-sm">
            {row.uid}
          </Link>
        ),
      },
      {
        key: "name",
        title: t("clients.col.client"),
        render: (row) => (
          <div className="flex items-center gap-2">
            {row.avatar ? (
              <img src={row.avatar} alt={row.name} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium">
                {row.name.slice(0, 1).toUpperCase()}
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
        title: t("clients.col.country"),
        width: "80px",
        render: (row) => <span className="text-sm text-slate-600">{row.country || "-"}</span>,
      },
      {
        key: "level",
        title: t("clients.col.level"),
        width: "90px",
        render: (row) => <LevelBadge level={row.level} />,
      },
      {
        key: "balance",
        title: t("clients.col.balance"),
        width: "120px",
        align: "right",
        sortable: true,
        render: (row) => (
          <span className="font-medium text-slate-900 dark:text-white text-sm">
            ${row.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        key: "status",
        title: t("clients.col.status"),
        width: "100px",
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "kycStatus",
        title: t("clients.col.kyc"),
        width: "110px",
        render: (row) => <KYCStatusBadge status={row.kycStatus} />,
      },
      {
        key: "riskLevel",
        title: t("clients.col.risk"),
        width: "100px",
        render: (row) => <RiskBadge level={row.riskLevel} score={row.riskScore} />,
      },
      {
        key: "tags",
        title: t("clients.col.tags"),
        width: "120px",
        render: (row) => (
          <div className="flex flex-wrap gap-1">
            {row.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]"
              >
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
        title: t("clients.col.registered"),
        width: "120px",
        sortable: true,
        render: (row) => (
          <span className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleDateString(dateLocale)}</span>
        ),
      },
    ],
    [t, dateLocale]
  );

  const rowActions = useMemo<RowAction<BackofficeUser>[]>(
    () => [
      {
        label: t("clients.action.view"),
        icon: <Eye className="w-4 h-4" />,
        onClick: (row) => {
          window.location.href = `/crm/clients/${row.id}`;
        },
      },
      {
        label: t("clients.action.adjustBalance"),
        icon: <Wallet className="w-4 h-4" />,
        onClick: () => {},
      },
      {
        label: (row) => (row.status === "frozen" ? t("clients.action.unfreeze") : t("clients.action.freeze")),
        icon: (row) =>
          row.status === "frozen" ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />,
        onClick: handleFreeze,
        variant: "danger",
        disabled: (row) => row.status === "closed",
      },
    ],
    [t]
  );

  const filterOptions = useMemo(
    () => [
      {
        key: "status",
        label: t("clients.filter.status"),
        type: "select" as const,
        options: [
          { label: t("clients.status.active"), value: "active" },
          { label: t("clients.status.frozen"), value: "frozen" },
          { label: t("clients.status.pending"), value: "pending" },
          { label: t("clients.status.closed"), value: "closed" },
        ],
      },
      {
        key: "kyc",
        label: t("clients.filter.kyc"),
        type: "select" as const,
        options: [
          { label: t("clients.kyc.verified"), value: "verified" },
          { label: t("clients.kyc.pending"), value: "pending" },
          { label: t("clients.kyc.rejected"), value: "rejected" },
          { label: t("clients.kyc.notSubmitted"), value: "not_submitted" },
        ],
      },
      {
        key: "level",
        label: t("clients.filter.level"),
        type: "select" as const,
        options: [
          { label: t("clients.level.standard"), value: "standard" },
          { label: t("clients.level.vip"), value: "vip" },
          { label: t("clients.level.premium"), value: "premium" },
          { label: t("clients.level.enterprise"), value: "enterprise" },
        ],
      },
      {
        key: "riskLevel",
        label: t("clients.filter.risk"),
        type: "select" as const,
        options: [
          { label: t("clients.risk.low"), value: "low" },
          { label: t("clients.risk.medium"), value: "medium" },
          { label: t("clients.risk.high"), value: "high" },
          { label: t("clients.risk.critical"), value: "critical" },
        ],
      },
      {
        key: "lifecycle",
        label: t("clients.filter.lifecycle"),
        type: "select" as const,
        options: [
          { label: t("clients.lifecycle.registered"), value: "registered" },
          { label: t("clients.lifecycle.verified"), value: "verified" },
          { label: t("clients.lifecycle.ftd"), value: "ftd" },
          { label: t("clients.lifecycle.active"), value: "active" },
          { label: t("clients.lifecycle.inactive"), value: "inactive" },
          { label: t("clients.lifecycle.churn"), value: "churn" },
        ],
      },
      {
        key: "dateRange",
        label: t("clients.filter.dateRange"),
        type: "daterange" as const,
      },
    ],
    [t]
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: t("clients.crumb.root") }, { label: t("clients.crumb.list") }]} />

      <PageHeader
        title={t("clients.title")}
        description={t("clients.subtitle")}
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleExport} disabled={clients.length === 0}>
              <Download className="w-4 h-4" />
              {t("clients.action.export")}
            </Button>
            <Button>
              <Plus className="w-4 h-4" />
              {t("clients.action.add")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Card className="!p-4">
          <p className="text-sm text-slate-500">{t("clients.stat.total")}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">{t("clients.stat.active")}</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">{t("clients.stat.pendingKyc")}</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingKyc}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">{t("clients.stat.frozen")}</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.frozen}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">{t("clients.stat.highRisk")}</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{stats.highRisk}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">{t("clients.stat.ftd")}</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.ftdCount}</p>
        </Card>
      </div>

      <FilterBar
        filters={filterOptions}
        searchable
        searchKeys={["uid", "name", "email"]}
        searchPlaceholder={t("clients.filter.search")}
        onSearch={handleFilterChange}
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
          <span className="font-medium">{t("clients.error.prefix")}</span>
          {error}
          <button
            onClick={() => fetchClients()}
            className="ml-auto text-red-700 underline hover:no-underline"
          >
            {t("clients.error.retry")}
          </button>
        </div>
      )}

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
          emptyText={loading ? "" : t("clients.empty")}
          loading={loading}
          pagination={false}
        />
      </Card>

      {total > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>
              {t("clients.page.totalPrefix")} {total}
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-8 px-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
            >
              {[10, 20, 50, 100].map((s) => (
                <option key={s} value={s}>
                  {t("clients.page.perPage", { n: String(s) })}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t("clients.page.previous")}
            </button>
            {buildPageWindow(page, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`gap-${i}`} className="px-2 text-slate-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-sm rounded-lg border transition-colors ${
                    page === p
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t("clients.page.next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function buildPageWindow(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const result: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) result.push("...");
  for (let i = start; i <= end; i++) result.push(i);
  if (end < total - 1) result.push("...");
  result.push(total);
  return result;
}
