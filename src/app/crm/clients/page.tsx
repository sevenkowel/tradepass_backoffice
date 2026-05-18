"use client";

/**
 * Clients list page — v2 redesign (2026-05-14).
 *
 * Visual layout (top → bottom):
 *
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ Breadcrumb                                                  │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │ 6× KPI cards (clickable → apply matching filter)            │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │ Search 320px · quick chips · ⋯ · [高级筛选 N]               │ ← single row
 *   ├─────────────────────────────────────────────────────────────┤
 *   │ Table toolbar: 共/已选 · bulkActions · Columns · 导出 · 新增 │ ← Plan C
 *   │ Data table                                                  │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * Key changes vs the old layout:
 *   - The PageHeader (Export + Add Client at the top right) is gone — both
 *     actions moved into the table toolbar.
 *   - The two-row FilterBar (search row + collapsible grid) is replaced
 *     by a single-row `<ClientsToolbar>` + a right-side advanced filter
 *     drawer.
 *   - The "Columns" button no longer floats alone over a wide empty bar —
 *     the table's own toolbar is now meaningful, showing count, selection
 *     state, bulk actions, export, and "+ 新增客户".
 *   - KPI cards are now clickable as one-click filter shortcuts.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Eye, Ban, Wallet, Unlock, Download, Tag, Briefcase,
  UserCheck, Network, User as UserIcon,
  type LucideIcon,
} from "lucide-react";
import * as CountryFlags from "country-flag-icons/react/3x2";
import {
  Card,
  Button,
  StatusBadge,
  LevelBadge,
  RiskBadge,
  KYCStatusBadge,
  EnhancedDataTable,
  type Column,
  type RowAction,
} from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { clientService } from "@/lib/crm/services/client.service";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { BackofficeUser, ClientListParams } from "@/types/backoffice/user";
import { ClientsToolbar, countAdvancedFilters } from "./ClientsToolbar";
import { ClientsFilterDrawer } from "./ClientsFilterDrawer";
import { DeviceLabel } from "./DeviceLabel";
import { SavedViews, type SavedView } from "./SavedViews";

const DEFAULT_STATS = {
  total: 0, active: 0, pendingKyc: 0, frozen: 0, highRisk: 0, ftdCount: 0,
};

/** Maps each KPI card to the filter patch it should apply when clicked.
 *  `labelKey` is the i18n key; `key` is the stat field. The two diverge for
 *  `ftd` (label is `stat.ftd`, data is `stats.ftdCount`). */
const KPI_FILTERS: {
  key: keyof typeof DEFAULT_STATS;
  labelKey: string;
  apply: Partial<ClientListParams> | null;
  toneActive: string;
}[] = [
  { key: "total",      labelKey: "clients.stat.total",      apply: null,                     toneActive: "ring-2 ring-slate-300"   },
  { key: "active",     labelKey: "clients.stat.active",     apply: { status: "active" },     toneActive: "ring-2 ring-emerald-300" },
  { key: "pendingKyc", labelKey: "clients.stat.pendingKyc", apply: { kycStatus: "pending" }, toneActive: "ring-2 ring-amber-300"   },
  { key: "frozen",     labelKey: "clients.stat.frozen",     apply: { status: "frozen" },     toneActive: "ring-2 ring-red-300"     },
  { key: "highRisk",   labelKey: "clients.stat.highRisk",   apply: { riskLevel: "high" },    toneActive: "ring-2 ring-orange-300"  },
  { key: "ftdCount",   labelKey: "clients.stat.ftd",        apply: { hasFtd: true },         toneActive: "ring-2 ring-blue-300"    },
];

const STAT_VALUE_TONE: Record<keyof typeof DEFAULT_STATS, string> = {
  total:      "text-slate-900",
  active:     "text-emerald-600",
  pendingKyc: "text-amber-600",
  frozen:     "text-red-600",
  highRisk:   "text-orange-600",
  ftdCount:   "text-blue-600",
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
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  /* --------------------------- Data fetch ------------------------------ */
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
    [page, pageSize, filters],
  );

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  /* --------------------------- Filter helpers -------------------------- */
  const patchFilters = useCallback((patch: Partial<ClientListParams>) => {
    setFilters((prev) => {
      const next: Partial<ClientListParams> = { ...prev };
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === "" || v === null) {
          delete (next as Record<string, unknown>)[k];
        } else {
          (next as Record<string, unknown>)[k] = v;
        }
      }
      return next;
    });
    setPage(1);
  }, []);

  const setSearch = useCallback(
    (q: string) => patchFilters({ search: q || undefined }),
    [patchFilters],
  );

  const advancedCount = useMemo(() => countAdvancedFilters(filters), [filters]);

  /* --------------------------- KPI click handler ----------------------- */
  const onKpiClick = (k: keyof typeof DEFAULT_STATS, apply: Partial<ClientListParams> | null) => {
    if (!apply) {
      // "总计" — clear all filters
      setFilters({});
      setPage(1);
      return;
    }
    // Toggle: if the same filter is already on, clear it; otherwise apply it.
    const isActive = Object.entries(apply).every(
      ([k2, v]) => (filters as Record<string, unknown>)[k2] === v,
    );
    if (isActive) {
      const cleared: Partial<ClientListParams> = {};
      for (const k2 of Object.keys(apply)) {
        (cleared as Record<string, undefined>)[k2] = undefined;
      }
      patchFilters(cleared);
    } else {
      patchFilters(apply);
    }
    void k;
  };

  const isKpiActive = (apply: Partial<ClientListParams> | null): boolean => {
    if (!apply) {
      // 总计 is "active" only when no filters at all
      return Object.values(filters).every((v) => !v);
    }
    return Object.entries(apply).every(
      ([k, v]) => (filters as Record<string, unknown>)[k] === v,
    );
  };

  /* --------------------------- Row actions ----------------------------- */
  const handleFreeze = async (client: BackofficeUser) => {
    try {
      if (client.status === "frozen") await clientService.unfreeze(client.id);
      else await clientService.freeze(client.id);
      fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mutation failed");
    }
  };

  /* --------------------------- Bulk actions ---------------------------- */
  const handleBulkFreeze = async () => {
    const ids = [...selectedKeys];
    if (ids.length === 0) return;
    if (!window.confirm(t("clients.bulk.confirmFreeze", { n: String(ids.length) }))) return;
    try {
      await Promise.all(ids.map((id) => clientService.freeze(id)));
      setSelectedKeys(new Set());
      fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk freeze failed");
    }
  };

  const handleBulkExport = () => {
    const rows = clients.filter((c) => selectedKeys.has(c.id));
    exportCsv(rows, `clients-selected-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportAll = () => {
    exportCsv(clients, `clients-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleBulkTag = () => {
    // Placeholder: open a tag-picker modal in M8. For now alert.
    window.alert(t("clients.bulk.tagComingSoon"));
  };

  const handleInvite = () => {
    // TODO(M8): open invite drawer — pick agent + plan + currency, then
    // generate a unique signup URL + QR for the client. Forex back-offices
    // generally forbid direct manual creation; the realistic action is
    // "issue an invite link", which is what IBs / sales actually do.
    window.alert(t("clients.action.inviteComingSoon"));
  };

  /* --------------------------- Table config ---------------------------- */
  const dateLocale =
    locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : locale === "es" ? "es-ES" : "en-US";

  const columns = useMemo<Column<BackofficeUser>[]>(
    () => [
      {
        key: "uid", title: t("clients.col.uid"), width: "110px", sortable: true,
        render: (row) => (
          <Link href={`/crm/clients/${row.id}`} className="font-mono text-blue-600 hover:underline text-sm whitespace-nowrap">
            {row.uid}
          </Link>
        ),
      },
      {
        key: "name", title: t("clients.col.client"),
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
        key: "country", title: t("clients.col.country"), width: "100px",
        render: (row) => row.country
          ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
              <CountryFlag cc={row.country} />
              <span className="font-mono text-xs text-slate-600">{row.country}</span>
            </span>
          )
          : <span className="text-slate-400">—</span>,
      },
      {
        key: "role", title: t("clients.col.role"), width: "100px",
        render: (row) => <RoleBadge role={row.role ?? "client"} />,
        defaultHidden: false,
      },
      { key: "level", title: t("clients.col.level"), width: "90px", render: (row) => <LevelBadge level={row.level} /> },
      {
        key: "accountCount", title: t("clients.col.accountCount"), width: "90px", align: "right",
        sortable: true,
        render: (row) => (
          <span className="inline-flex items-center gap-1 text-sm font-medium tabular-nums text-slate-700">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            {row.accountCount ?? 0}
          </span>
        ),
      },
      {
        key: "registrationSource", title: t("clients.col.regSource"), width: "120px",
        defaultHidden: true,
        render: (row) => row.registrationSource
          ? <SourceLabel source={row.registrationSource} />
          : <span className="text-slate-400 text-xs">—</span>,
      },
      {
        key: "registrationDevice", title: t("clients.col.regDevice"), width: "170px",
        defaultHidden: true,
        render: (row) => row.registrationDevice
          ? <DeviceLabel device={row.registrationDevice} seed={row.id} />
          : <span className="text-slate-400 text-xs">—</span>,
      },
      {
        key: "balance", title: t("clients.col.balance"), width: "120px", align: "right", sortable: true,
        render: (row) => (
          <span className="font-medium text-slate-900 dark:text-white text-sm">
            ${row.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        ),
      },
      { key: "status",    title: t("clients.col.status"), width: "100px", render: (row) => <StatusBadge status={row.status} /> },
      { key: "kycStatus", title: t("clients.col.kyc"),    width: "110px", render: (row) => <KYCStatusBadge status={row.kycStatus} /> },
      { key: "riskLevel", title: t("clients.col.risk"),   width: "100px", render: (row) => <RiskBadge level={row.riskLevel} score={row.riskScore} /> },
      {
        key: "tags", title: t("clients.col.tags"), width: "120px",
        render: (row) => (
          <div className="flex flex-wrap gap-1">
            {row.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">{tag}</span>
            ))}
            {row.tags.length > 2 && <span className="px-1.5 py-0.5 text-slate-400 text-[10px]">+{row.tags.length - 2}</span>}
          </div>
        ),
      },
      {
        key: "createdAt", title: t("clients.col.registered"), width: "120px", sortable: true,
        render: (row) => <span className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleDateString(dateLocale)}</span>,
      },
    ],
    [t, dateLocale],
  );

  const rowActions = useMemo<RowAction<BackofficeUser>[]>(
    () => [
      {
        label: t("clients.action.view"), icon: <Eye className="w-4 h-4" />,
        onClick: (row) => { window.location.href = `/crm/clients/${row.id}`; },
      },
      { label: t("clients.action.adjustBalance"), icon: <Wallet className="w-4 h-4" />, onClick: () => {} },
      {
        label: (row) => (row.status === "frozen" ? t("clients.action.unfreeze") : t("clients.action.freeze")),
        icon: (row) => (row.status === "frozen" ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />),
        onClick: handleFreeze,
        variant: "danger",
        disabled: (row) => row.status === "closed",
      },
    ],
    [t],
  );

  /* --------------------------- Pagination ------------------------------ */
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  /* --------------------------- Render ---------------------------------- */
  /* --------------------------- Apply saved view ---------------------- */
  const applyView = useCallback((view: SavedView) => {
    setFilters(view.filters);
    setPage(1);
  }, []);

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: t("clients.crumb.root") }, { label: t("clients.crumb.list") }]} />

      {/* 预设视图 + 已保存视图 — P2-N1 */}
      <SavedViews currentFilters={filters} onApplyView={applyView} />

      {/* KPI cards — now clickable as one-click filter shortcuts. */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {KPI_FILTERS.map(({ key, labelKey, apply, toneActive }) => {
          const active = isKpiActive(apply);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onKpiClick(key, apply)}
              className={`text-left bg-white rounded-xl border border-slate-200 p-4 transition-all hover:border-slate-300 hover:shadow-sm ${
                active ? toneActive : ""
              }`}
            >
              <p className="text-sm text-slate-500">{t(labelKey)}</p>
              <p className={`text-2xl font-bold mt-1 tabular-nums ${STAT_VALUE_TONE[key]}`}>
                {stats[key]}
              </p>
            </button>
          );
        })}
      </div>

      {/* Single-row toolbar: [advanced] [search] [chips] ··· [+ invite].
          Filters live on the left + middle; the primary CTA anchors the right. */}
      <ClientsToolbar
        search={filters.search ?? ""}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={patchFilters}
        onOpenAdvanced={() => setFilterDrawerOpen(true)}
        advancedCount={advancedCount}
        onInvite={handleInvite}
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
          <span className="font-medium">{t("clients.error.prefix")}</span>
          {error}
          <button onClick={() => fetchClients()} className="ml-auto text-red-700 underline hover:no-underline">
            {t("clients.error.retry")}
          </button>
        </div>
      )}

      {/* Table — toolbar is now meaningful (search disabled, bulkActions wired). */}
      <Card padding="none">
        <EnhancedDataTable<BackofficeUser>
          columns={columns}
          data={clients}
          keyExtractor={(row) => row.id}
          selectable
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          rowActions={rowActions}
          onRowClick={(row) => { window.location.href = `/crm/clients/${row.id}`; }}
          emptyText={loading ? "" : t("clients.empty")}
          loading={loading}
          pagination={false}
          exportable
          onExport={handleExportAll}
          tableId="crm.clients.list"
          bulkActions={(selected) => (
            <>
              <Button variant="secondary" size="sm" onClick={handleBulkTag} disabled={selected.size === 0}>
                <Tag className="w-3.5 h-3.5" />
                {t("clients.bulk.tag")}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleBulkFreeze} disabled={selected.size === 0}>
                <Ban className="w-3.5 h-3.5" />
                {t("clients.bulk.freeze")}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleBulkExport} disabled={selected.size === 0}>
                <Download className="w-3.5 h-3.5" />
                {t("clients.bulk.exportSelected")}
              </Button>
            </>
          )}
        />
      </Card>

      {/* Pagination — kept below the table for familiarity. */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>{t("clients.page.totalPrefix")} {total}</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="h-8 px-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
            >
              {[10, 20, 50, 100].map((s) => (
                <option key={s} value={s}>{t("clients.page.perPage", { n: String(s) })}</option>
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
                <span key={`gap-${i}`} className="px-2 text-slate-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-sm rounded-lg border transition-colors ${
                    page === p ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ),
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

      {/* Right-side drawer for advanced filters. */}
      <ClientsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        onApply={patchFilters}
      />
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* Helpers                                                               */
/* --------------------------------------------------------------------- */

/**
 * Country flag — rendered from the locally-bundled `country-flag-icons`
 * package. We tried `flagcdn.com` first but external CDNs are unreliable
 * for clients on restricted networks (CN/UAE corporate firewalls in
 * particular). Local SVG is the most robust default: works offline, no
 * CSP allow-list to maintain, no font-fallback issues.
 *
 * Unicode flag emojis would also work but Windows' Segoe UI Emoji ships
 * without flag glyphs, so "🇨🇳" silently falls back to "CN".
 */
function CountryFlag({ cc, className = "" }: { cc: string; className?: string }) {
  if (!cc || cc.length !== 2) return null;
  const Flag = (CountryFlags as Record<string, React.FC<{ title?: string; className?: string }>>)[
    cc.toUpperCase()
  ];
  if (!Flag) return null;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-sm overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.08)] ${className}`}
      style={{ width: 22, height: 15 }}
      aria-hidden="true"
    >
      <Flag title={cc} className="w-full h-full object-cover" />
    </span>
  );
}

const ROLE_TOKENS: Record<"client" | "partner" | "affiliate", {
  bg: string; text: string; label: string; icon: LucideIcon;
}> = {
  client:    { bg: "bg-slate-100",  text: "text-slate-700",  label: "Client",    icon: UserIcon },
  partner:   { bg: "bg-violet-100", text: "text-violet-700", label: "Partner",   icon: UserCheck },
  affiliate: { bg: "bg-sky-100",    text: "text-sky-700",    label: "Affiliate", icon: Network  },
};

function RoleBadge({ role }: { role: string }) {
  const tk = ROLE_TOKENS[(role as keyof typeof ROLE_TOKENS)] ?? ROLE_TOKENS.client;
  const Icon = tk.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${tk.bg} ${tk.text}`}>
      <Icon className="w-3 h-3" />
      {tk.label}
    </span>
  );
}

const SOURCE_LABEL: Record<string, string> = {
  web:             "Web",
  mobile_ios:      "iOS",
  mobile_android:  "Android",
  affiliate:       "Affiliate",
  import:          "Import",
  api:             "API",
};

function SourceLabel({ source }: { source: string }) {
  const label = SOURCE_LABEL[source] ?? source;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
      {label}
    </span>
  );
}

function exportCsv(rows: BackofficeUser[], filename: string) {
  const headers = [
    "uid", "name", "email", "phone", "status", "kycStatus",
    "level", "balance", "riskLevel", "lifecycleStage", "createdAt",
  ];
  const csvRows = rows.map((c) =>
    headers
      .map((h) => {
        const v = (c as unknown as Record<string, unknown>)[h];
        return v == null ? "" : String(v).replace(/"/g, '""');
      })
      .map((v) => `"${v}"`)
      .join(","),
  );
  const csv = [headers.join(","), ...csvRows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
