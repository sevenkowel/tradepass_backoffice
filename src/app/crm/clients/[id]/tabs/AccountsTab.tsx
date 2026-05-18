"use client";

/**
 * AccountsTab — list of the client's MT/TradePass accounts.
 *
 * v4 design (2026-05-15):
 *   - Uses `<EnhancedDataTable>` so sorting / column-visibility /
 *     localStorage persistence / search all come for free. Consistent
 *     with the canonical list-page-spec.md pattern.
 *   - 20 columns total; 12 visible by default, 8 hideable via the
 *     "Columns" menu (累计存款/取款/手续费/利息/账户组/服务器/可用保证金/交易模式).
 *   - Status filter chips on top — Active / Restricted / Disabled / Readonly.
 *   - Row click opens AccountDetailView in either right drawer or center
 *     modal; per-row `⋯` menu hosts the 5 financial-grade operations
 *     (status / deposit / withdrawal / transfer / readonly).
 *   - Default sort: created descending (newest first).
 */

import { useEffect, useMemo, useState } from "react";
import {
  Plus, Lock,
  PanelRightOpen, RectangleHorizontal,
  LayoutGrid, TrendingUp, Wallet, ShieldCheck, Activity, Settings,
} from "lucide-react";
import type { TradingAccount, TradeRecord } from "@/types/backoffice/client-detail";
import type { BaseTabProps } from "@/types/backoffice/client";
import { useT } from "@/lib/i18n/LocaleProvider";
import { Drawer } from "@/components/crm/ui/Drawer";
import { CenterModal } from "@/components/crm/ui/CenterModal";
import {
  Card, EnhancedDataTable, type Column, type RowAction,
} from "@/components/crm/ui";
import { AccountDetailView, type AccountDetailTab } from "./account-detail/AccountDetailView";
import { AccountHoverCard } from "../lib/AccountHoverCard";
import { Ban, Unlock, ShieldOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type ViewMode = "drawer" | "modal";
const VIEW_MODE_KEY = "crm.clients.accounts.detailView";

type StatusFilter = "all" | "active" | "restricted" | "disabled" | "readonly";

export default function AccountsTab({ data }: BaseTabProps) {
  const { t } = useT();
  const { accounts, trades } = data;

  /* ── View-mode toggle (drawer vs modal) ───────────────────────────── */
  const [viewMode, setViewMode] = useState<ViewMode>("drawer");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(VIEW_MODE_KEY);
    if (stored === "drawer" || stored === "modal") setViewMode(stored);
  }, []);
  const switchMode = (m: ViewMode) => {
    setViewMode(m);
    if (typeof window !== "undefined") window.localStorage.setItem(VIEW_MODE_KEY, m);
  };

  /* ── Selection state for the detail view ──────────────────────────── */
  // 选中行 + 期望打开的 Tab。Row click 默认进 Overview；行 ⋯ 下拉支持深链到任一 Tab。
  type DetailRoute = { row: TradingAccount; tab: AccountDetailTab };
  const [route, setRoute] = useState<DetailRoute | null>(null);
  const selected = route?.row ?? null;
  const openDetail = (row: TradingAccount, tab: AccountDetailTab = "overview") =>
    setRoute({ row, tab });

  /* ── Status filter ────────────────────────────────────────────────── */
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  // N8 批量操作：选中的账户 id 集合（不同于上面单选的 `selected`）
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toast = useToast();

  /* ── Status counts for the chip labels ────────────────────────────── */
  const statusCounts = useMemo(() => ({
    all:        accounts.length,
    active:     accounts.filter((a) => a.status === "active").length,
    restricted: accounts.filter((a) => a.status === "restricted").length,
    disabled:   accounts.filter((a) => a.status === "disabled").length,
    readonly:   accounts.filter((a) => a.readonly).length,
  }), [accounts]);

  /* ── Apply status filter + default sort (created desc) ────────────── */
  const filtered = useMemo(() => {
    let rows = accounts;
    if (statusFilter === "active")     rows = rows.filter((a) => a.status === "active");
    if (statusFilter === "restricted") rows = rows.filter((a) => a.status === "restricted");
    if (statusFilter === "disabled")   rows = rows.filter((a) => a.status === "disabled");
    if (statusFilter === "readonly")   rows = rows.filter((a) => a.readonly);
    return [...rows].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [accounts, statusFilter]);

  /* ── Closed trades for the selected account ───────────────────────── */
  const accountHistory: TradeRecord[] = useMemo(() => {
    if (!selected) return [];
    return trades.filter((trade) => trade.closePrice != null);
  }, [selected, trades]);

  /* ── Columns ──────────────────────────────────────────────────────── */
  const columns: Column<TradingAccount>[] = useMemo(() => [
    {
      key: "mtAccount", title: "MT 账户", width: "110px", sortable: true,
      render: (row) => (
        <AccountHoverCard account={row}>
          <span className="font-mono font-semibold text-slate-800 tabular-nums underline decoration-dotted underline-offset-2 decoration-slate-300">
            {row.mtAccount}
          </span>
        </AccountHoverCard>
      ),
    },
    {
      key: "platform", title: "平台", width: "80px",
      render: (row) => (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">
          {row.platform}
        </span>
      ),
    },
    {
      key: "accountType", title: "类型", width: "90px", sortable: true,
      render: (row) => <span className="text-sm text-slate-600">{row.accountType}</span>,
    },
    {
      key: "status", title: "状态", width: "110px", sortable: true,
      render: (row) => {
        const tone =
          row.status === "active"     ? "text-emerald-700" :
          row.status === "restricted" ? "text-amber-700"   :
                                        "text-red-700";
        const label =
          row.status === "active" ? "活跃" :
          row.status === "restricted" ? "受限" : "禁用";
        return (
          <span className="inline-flex items-center gap-1">
            <span className={`text-xs font-medium ${tone}`}>● {label}</span>
            {row.readonly && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-violet-700 ml-1">
                <Lock className="w-2.5 h-2.5" />只读
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: "balance", title: "余额", width: "120px", align: "right", sortable: true,
      render: (row) => (
        <span className="tabular-nums font-medium text-slate-800">
          {fmtMoney(row.balance, row.currency)}
        </span>
      ),
    },
    {
      key: "equity", title: "净值", width: "120px", align: "right", sortable: true,
      render: (row) => (
        <span className="tabular-nums text-slate-700">
          {fmtMoney(row.equity, row.currency)}
        </span>
      ),
    },
    {
      key: "marginLevel", title: "保证金比例", width: "100px", align: "right",
      render: (row) => (
        <span className={`tabular-nums text-xs ${
          row.marginLevel === "—" ? "text-slate-400"
          : "text-emerald-700"
        }`}>{row.marginLevel}</span>
      ),
    },
    {
      key: "leverage", title: "杠杆", width: "80px",
      render: (row) => <span className="text-xs text-slate-600">{row.leverage}</span>,
    },
    {
      key: "currency", title: "币种", width: "70px",
      render: (row) => (
        <span className="font-mono text-xs text-slate-600">{row.currency}</span>
      ),
    },

    // ── Hideable by default ─────────────────────────────────────────
    {
      key: "freeMargin", title: "可用保证金", width: "120px", align: "right",
      defaultHidden: true, sortable: true,
      render: (row) => (
        <span className="tabular-nums text-xs text-slate-600">
          {fmtMoney(row.freeMargin, row.currency)}
        </span>
      ),
    },
    {
      key: "totalDeposit", title: "累计存款", width: "120px", align: "right",
      defaultHidden: true, sortable: true,
      render: (row) => (
        <span className="tabular-nums text-xs text-emerald-700">
          {fmtMoney(row.totalDeposit, row.currency)}
        </span>
      ),
    },
    {
      key: "totalWithdrawal", title: "累计取款", width: "120px", align: "right",
      defaultHidden: true, sortable: true,
      render: (row) => (
        <span className="tabular-nums text-xs text-slate-600">
          {fmtMoney(row.totalWithdrawal, row.currency)}
        </span>
      ),
    },
    {
      key: "commission", title: "累计手续费", width: "110px", align: "right",
      defaultHidden: true, sortable: true,
      render: (row) => (
        <span className="tabular-nums text-xs text-slate-600">
          {fmtMoney(row.commission, row.currency)}
        </span>
      ),
    },
    {
      key: "swap", title: "累计利息", width: "100px", align: "right",
      defaultHidden: true, sortable: true,
      render: (row) => (
        <span className={`tabular-nums text-xs ${
          row.swap < 0 ? "text-red-700" : "text-slate-600"
        }`}>{fmtMoney(row.swap, row.currency)}</span>
      ),
    },
    {
      key: "tradingMode", title: "交易模式", width: "90px",
      defaultHidden: true,
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.tradingMode === "hedging" ? "Hedging" : "Netting"}
        </span>
      ),
    },
    {
      key: "group", title: "账户组", width: "130px",
      defaultHidden: true,
      render: (row) => (
        <span className="font-mono text-xs text-slate-600 truncate">{row.group}</span>
      ),
    },
    {
      key: "server", title: "服务器", width: "150px",
      defaultHidden: true,
      render: (row) => (
        <span className="text-xs text-slate-600 truncate">{row.server}</span>
      ),
    },

    // ── Times (visible by default) ───────────────────────────────────
    {
      key: "createdAt", title: "创建时间", width: "110px", sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-500 tabular-nums">
          {new Date(row.createdAt).toLocaleDateString("zh-CN")}
        </span>
      ),
    },
    {
      key: "lastTradeAt", title: "最后交易", width: "100px", sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-500 tabular-nums">
          {row.lastTradeAt ? timeAgo(row.lastTradeAt) : "—"}
        </span>
      ),
    },
  ], []);

  /* ── Row actions (the per-row `⋯` menu) ─────────────────────────────
   *
   * Design (2026-05-15):
   *   行下拉不再承担任何状态修改职责。CRM 的"操作动作"全部统一到详情页的
   *   Risk & Controls Tab 完成（带强制原因 + 操作日志 + 二次确认）。
   *
   *   行下拉的 6 个入口对应详情页的 6 个 Tab，点击 = 打开详情面板并自动
   *   定位到对应 Tab。这样列表层只做"导航"，不做"修改"，符合 CRM 职责
   *   边界（不直接动账户状态，更不动资金）。
   */
  const rowActions: RowAction<TradingAccount>[] = useMemo(() => [
    {
      label: "Overview",
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
      onClick: (row) => openDetail(row, "overview"),
    },
    {
      label: "Trading",
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      onClick: (row) => openDetail(row, "trading"),
    },
    {
      label: "Funds",
      icon: <Wallet className="w-3.5 h-3.5" />,
      onClick: (row) => openDetail(row, "funds"),
    },
    {
      label: "Risk & Controls",
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      onClick: (row) => openDetail(row, "controls"),
    },
    {
      label: "Activity",
      icon: <Activity className="w-3.5 h-3.5" />,
      onClick: (row) => openDetail(row, "activity"),
    },
    {
      label: "Settings",
      icon: <Settings className="w-3.5 h-3.5" />,
      onClick: (row) => openDetail(row, "settings"),
    },
  ], []);

  /* ── Render ───────────────────────────────────────────────────────── */
  // Single combined toolbar: status chips on the left, view-mode toggle +
  // "+ 新建账户" on the right. The old "交易账户·N" title row was redundant
  // (count is in the "全部" chip anyway) so it's gone.
  return (
    <div className="space-y-4">
      {/* ── Filter + actions row ───────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusChip label="全部"  count={statusCounts.all}        active={statusFilter === "all"}        tone="slate"   onClick={() => setStatusFilter("all")} />
          <StatusChip label="活跃"  count={statusCounts.active}     active={statusFilter === "active"}     tone="emerald" onClick={() => setStatusFilter("active")} />
          <StatusChip label="受限"  count={statusCounts.restricted} active={statusFilter === "restricted"} tone="amber"   onClick={() => setStatusFilter("restricted")} />
          <StatusChip label="禁用"  count={statusCounts.disabled}   active={statusFilter === "disabled"}   tone="red"     onClick={() => setStatusFilter("disabled")} />
          <StatusChip label="只读"  count={statusCounts.readonly}   active={statusFilter === "readonly"}   tone="violet"  onClick={() => setStatusFilter("readonly")} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* View-mode toggle — sits left of the primary CTA */}
          <div className="inline-flex items-center bg-slate-100 rounded-md p-0.5">
            <button
              onClick={() => switchMode("drawer")}
              title="右侧抽屉"
              className={`h-7 px-2 inline-flex items-center gap-1 text-xs rounded ${
                viewMode === "drawer" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              <PanelRightOpen className="w-3.5 h-3.5" />
              抽屉
            </button>
            <button
              onClick={() => switchMode("modal")}
              title="居中弹框"
              className={`h-7 px-2 inline-flex items-center gap-1 text-xs rounded ${
                viewMode === "modal" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              <RectangleHorizontal className="w-3.5 h-3.5" />
              弹框
            </button>
          </div>

          {/* Primary CTA */}
          <button className="h-8 px-3 inline-flex items-center gap-1.5 text-sm font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800">
            <Plus className="w-3.5 h-3.5" />
            {t("clients.detail.accounts.new")}
          </button>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────── */}
      <Card padding="none">
        <EnhancedDataTable<TradingAccount>
          columns={columns}
          data={filtered}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => openDetail(row)}
          rowActions={rowActions}
          searchable
          searchKeys={["mtAccount", "server", "group"]}
          searchPlaceholder="搜索 MT 号 / 服务器 / 账户组…"
          emptyText="暂无账户"
          pagination={false}
          tableId="crm.client.accounts.list"
          /* N8 批量操作 */
          selectable
          selectedKeys={selectedIds}
          onSelectionChange={setSelectedIds}
          bulkActions={(keys) => {
            const ids = Array.from(keys);
            const targets = filtered.filter((a) => keys.has(a.id));
            const activeCount = targets.filter((a) => a.status === "active").length;
            const restrictedOrDisabled = targets.filter((a) => a.status !== "active").length;
            const handleBulkFreeze = () => {
              if (!confirm(`批量冻结 ${activeCount} 个活跃账户？该操作将禁止交易和出金。`)) return;
              // Mock implementation — 真实接入时调用 accountService.bulkUpdateStatus(ids, "disabled")
              toast.success(`${activeCount} 个账户已冻结（mock）`);
              console.info(`[bulk-freeze] ids=${ids.join(",")}`);
              setSelectedIds(new Set());
            };
            const handleBulkUnfreeze = () => {
              toast.success(`${restrictedOrDisabled} 个账户已解冻（mock）`);
              console.info(`[bulk-unfreeze] ids=${ids.join(",")}`);
              setSelectedIds(new Set());
            };
            const handleBulkRestrict = () => {
              toast.success(`${activeCount} 个账户已置为只读（mock）`);
              console.info(`[bulk-restrict] ids=${ids.join(",")}`);
              setSelectedIds(new Set());
            };
            return (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{keys.size} 已选</span>
                <button
                  onClick={handleBulkFreeze}
                  disabled={activeCount === 0}
                  className="inline-flex items-center gap-1 px-2.5 h-7 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Ban className="w-3 h-3" />
                  批量冻结 {activeCount > 0 ? `(${activeCount})` : ""}
                </button>
                <button
                  onClick={handleBulkRestrict}
                  disabled={activeCount === 0}
                  className="inline-flex items-center gap-1 px-2.5 h-7 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShieldOff className="w-3 h-3" />
                  批量限制
                </button>
                <button
                  onClick={handleBulkUnfreeze}
                  disabled={restrictedOrDisabled === 0}
                  className="inline-flex items-center gap-1 px-2.5 h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Unlock className="w-3 h-3" />
                  批量解锁
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-2.5 h-7 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md text-xs font-medium"
                >
                  清空
                </button>
              </div>
            );
          }}
        />
      </Card>

      {/* ── Detail view — drawer OR modal ────────────────────────────
       *  Drawer + CenterModal 都用 fullBleed: 让 AccountDetailView 自己控制
       *  内边距和滚动区域，避免外层 overflow-y-auto 与内层 sticky 冲突。
       *  showClose={false}: 不渲染容器自带的关闭区，AccountDetailView 的
       *  Header 右上角自带 X 按钮（通过 onClose 注入）。
       */}
      {viewMode === "drawer" ? (
        <Drawer
          open={!!route}
          onClose={() => setRoute(null)}
          size="xl"
          showClose={false}
          fullBleed
        >
          {route && (
            <AccountDetailView
              // key 包含 tab — 列表入口深链到不同 Tab 时强制 remount，
              // 这样 initialTab 在 useState initializer 里直接生效，避免 effect 同步。
              key={`${route.row.id}:${route.tab}`}
              account={route.row}
              history={accountHistory}
              initialTab={route.tab}
              onClose={() => setRoute(null)}
            />
          )}
        </Drawer>
      ) : (
        <CenterModal
          open={!!route}
          onClose={() => setRoute(null)}
          width={1000}
          showClose={false}
          fullBleed
        >
          {route && (
            <AccountDetailView
              key={`${route.row.id}:${route.tab}`}
              account={route.row}
              history={accountHistory}
              initialTab={route.tab}
              onClose={() => setRoute(null)}
            />
          )}
        </CenterModal>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* Status chip — count + active state                                    */
/* --------------------------------------------------------------------- */

function StatusChip({
  label, count, active, tone, onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  tone: "slate" | "emerald" | "amber" | "red" | "violet";
  onClick: () => void;
}) {
  const activeCls: Record<typeof tone, string> = {
    slate:   "bg-slate-200 border-slate-300 text-slate-700",
    emerald: "bg-emerald-50 border-emerald-300 text-emerald-700",
    amber:   "bg-amber-50 border-amber-300 text-amber-700",
    red:     "bg-red-50 border-red-300 text-red-700",
    violet:  "bg-violet-50 border-violet-300 text-violet-700",
  };
  const inactive = "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50";
  return (
    <button
      onClick={onClick}
      className={`h-8 px-2.5 inline-flex items-center gap-1.5 text-xs font-medium rounded-md border transition-colors ${
        active ? activeCls[tone] : inactive
      }`}
    >
      {label}
      <span className={`tabular-nums text-[10px] ${active ? "" : "text-slate-400"}`}>
        {count}
      </span>
    </button>
  );
}

/* --------------------------------------------------------------------- */
/* Formatters                                                            */
/* --------------------------------------------------------------------- */

function fmtMoney(n: number, currency: string): string {
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "";
  const abs = Math.abs(n);
  const formatted = abs >= 10000
    ? abs.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : abs.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return `${n < 0 ? "-" : ""}${symbol}${formatted}${symbol ? "" : ` ${currency}`}`;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(iso).toLocaleDateString("zh-CN");
}
