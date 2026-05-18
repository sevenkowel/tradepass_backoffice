"use client";

/**
 * OrderHistoryTab — 跨账户历史订单表（2026-05-16 新建）.
 *
 * 输入：已经在 OrdersWorkspace 层做过 账户/品种 筛选的历史 trades，
 *      即 closeTime != null 的 TradeRecord。
 *
 * 列：
 *   开仓 │ 平仓 │ 账户 │ 品种 │ 方向 │ 手数 │ 开仓价 │ 平仓价 │ 盈亏 │ 持仓时长
 *
 * 表头排序：开仓时间 / 平仓时间 / 盈亏 / 手数。
 *
 * 分页：列表默认显示 50 条，超过给「加载更多」按钮（避免一次渲染数百行）。
 */

import { useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpDown, ArrowDown, ArrowUp, Download } from "lucide-react";
import type { TradeRecord } from "@/types/backoffice/client-detail";
import { useT } from "@/lib/i18n/LocaleProvider";
import { exportCsv, withTimestamp } from "../lib/csv-export";

type SortKey = "openTime" | "closeTime" | "profit" | "volume";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 50;

export default function OrderHistoryTab({ trades }: { trades: TradeRecord[] }) {
  const { locale } = useT();
  const dateLocale =
    locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : locale === "es" ? "es-ES" : "en-US";

  const [sortKey, setSortKey] = useState<SortKey>("closeTime");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /* ── 排序 ── */
  const sorted = useMemo(() => {
    const arr = [...trades];
    arr.sort((a, b) => {
      let av: number; let bv: number;
      switch (sortKey) {
        case "profit":
          av = a.profit ?? 0; bv = b.profit ?? 0; break;
        case "volume":
          av = a.volume; bv = b.volume; break;
        case "openTime":
          av = new Date(a.openTime).getTime();
          bv = new Date(b.openTime).getTime();
          break;
        case "closeTime":
        default:
          av = a.closeTime ? new Date(a.closeTime).getTime() : 0;
          bv = b.closeTime ? new Date(b.closeTime).getTime() : 0;
      }
      return sortDir === "desc" ? bv - av : av - bv;
    });
    return arr;
  }, [trades, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey !== k) {
      setSortKey(k);
      setSortDir("desc");
    } else {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    }
  };

  const jumpToAccount = (mtAccount?: string) => {
    if (!mtAccount) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "accounts");
    params.set("account", mtAccount);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  /* ── 行汇总 ── */
  const totalProfit = trades.reduce((s, t) => s + (t.profit ?? 0), 0);
  const totalLots = trades.reduce((s, t) => s + t.volume, 0);
  const wins = trades.filter((t) => (t.profit ?? 0) > 0).length;
  const winRate = trades.length === 0 ? 0 : (wins / trades.length) * 100;

  if (trades.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-slate-400">
        当前筛选范围内无历史订单
      </div>
    );
  }

  const slice = sorted.slice(0, visible);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          历史订单
        </h3>
        <div className="flex items-center gap-4 text-xs tabular-nums text-slate-500">
          <span>{trades.length} 笔</span>
          <span>合计 {totalLots.toFixed(2)} lots</span>
          <span>胜率 {winRate.toFixed(1)}%</span>
          <span>
            净盈亏{" "}
            <span className={totalProfit >= 0 ? "text-emerald-700" : "text-red-700"}>
              {totalProfit >= 0 ? "+" : ""}${totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </span>
          <button
            onClick={() => exportCsv(
              withTimestamp("order-history.csv"),
              trades,
              [
                { label: "开仓时间", get: (t) => t.openTime },
                { label: "平仓时间", get: (t) => t.closeTime ?? "" },
                { label: "MT 账户",  get: (t) => t.mtAccount ?? "" },
                { label: "品种",     get: (t) => t.symbol },
                { label: "方向",     get: (t) => t.type },
                { label: "手数",     get: (t) => t.volume },
                { label: "开仓价",   get: (t) => t.openPrice },
                { label: "平仓价",   get: (t) => t.closePrice ?? "" },
                { label: "盈亏",     get: (t) => t.profit ?? "" },
              ],
            )}
            disabled={trades.length === 0}
            className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            title="导出 CSV"
          >
            <Download className="w-3 h-3" />
            CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <SortableTh active={sortKey === "openTime"} dir={sortDir} onClick={() => toggleSort("openTime")}>
                开仓时间
              </SortableTh>
              <SortableTh active={sortKey === "closeTime"} dir={sortDir} onClick={() => toggleSort("closeTime")}>
                平仓时间
              </SortableTh>
              <th className="pb-2 pr-4">账户</th>
              <th className="pb-2 pr-4">品种</th>
              <th className="pb-2 pr-4">方向</th>
              <SortableTh active={sortKey === "volume"} dir={sortDir} onClick={() => toggleSort("volume")} align="right">
                手数
              </SortableTh>
              <th className="pb-2 pr-4 text-right">开仓价</th>
              <th className="pb-2 pr-4 text-right">平仓价</th>
              <SortableTh active={sortKey === "profit"} dir={sortDir} onClick={() => toggleSort("profit")} align="right">
                盈亏
              </SortableTh>
              <th className="pb-2 text-right">持仓时长</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slice.map((t) => (
              <HistoryRow
                key={t.id}
                trade={t}
                dateLocale={dateLocale}
                onClickAccount={jumpToAccount}
              />
            ))}
          </tbody>
        </table>
      </div>

      {visible < sorted.length && (
        <div className="pt-2 text-center">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="h-7 px-3 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            加载更多（已显示 {visible} / {sorted.length}）
          </button>
        </div>
      )}
    </div>
  );
}

function SortableTh({
  children, active, dir, onClick, align = "left",
}: {
  children: React.ReactNode;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "right";
}) {
  const Icon = !active ? ArrowUpDown : dir === "desc" ? ArrowDown : ArrowUp;
  return (
    <th className={`pb-2 pr-4 ${align === "right" ? "text-right" : ""}`}>
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 hover:text-slate-900 ${
          active ? "text-slate-900" : ""
        }`}
      >
        <span>{children}</span>
        <Icon className={`w-3 h-3 ${active ? "opacity-100" : "opacity-40"}`} />
      </button>
    </th>
  );
}

function HistoryRow({
  trade, dateLocale, onClickAccount,
}: {
  trade: TradeRecord;
  dateLocale: string;
  onClickAccount: (mt?: string) => void;
}) {
  const { t } = useT();
  const isBuy = trade.type === "buy";
  const profitTone =
    trade.profit == null ? "text-slate-400"
      : trade.profit >= 0 ? "text-emerald-700"
      : "text-red-700";

  const holdMinutes = trade.closeTime
    ? Math.max(
        0,
        Math.round(
          (new Date(trade.closeTime).getTime() - new Date(trade.openTime).getTime()) / 60_000,
        ),
      )
    : 0;

  return (
    <tr className="hover:bg-slate-50/60">
      <td className="py-2 pr-4 text-xs text-slate-500 tabular-nums whitespace-nowrap">
        {new Date(trade.openTime).toLocaleString(dateLocale, {
          month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit",
        })}
      </td>
      <td className="py-2 pr-4 text-xs text-slate-500 tabular-nums whitespace-nowrap">
        {trade.closeTime
          ? new Date(trade.closeTime).toLocaleString(dateLocale, {
              month: "2-digit", day: "2-digit",
              hour: "2-digit", minute: "2-digit",
            })
          : "—"}
      </td>
      <td className="py-2 pr-4">
        {trade.mtAccount ? (
          <button
            onClick={() => onClickAccount(trade.mtAccount)}
            className="text-xs font-mono text-blue-600 hover:underline tabular-nums"
            title="跳转到账户详情"
          >
            {trade.mtAccount}
          </button>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
      <td className="py-2 pr-4 font-medium text-slate-800">{trade.symbol}</td>
      <td className="py-2 pr-4">
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
          isBuy ? "text-emerald-700" : "text-red-700"
        }`}>
          {isBuy ? t("clients.detail.trading.buy") : t("clients.detail.trading.sell")}
        </span>
      </td>
      <td className="py-2 pr-4 text-right tabular-nums">{trade.volume}</td>
      <td className="py-2 pr-4 text-right font-mono text-xs text-slate-600 tabular-nums">
        {trade.openPrice}
      </td>
      <td className="py-2 pr-4 text-right font-mono text-xs text-slate-600 tabular-nums">
        {trade.closePrice ?? "—"}
      </td>
      <td className={`py-2 pr-4 text-right font-medium tabular-nums ${profitTone}`}>
        {trade.profit == null
          ? "—"
          : `${trade.profit >= 0 ? "+" : ""}$${trade.profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
      </td>
      <td className="py-2 text-right text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
        {formatDuration(holdMinutes)}
      </td>
    </tr>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }
  const d = Math.floor(minutes / (60 * 24));
  const h = Math.floor((minutes % (60 * 24)) / 60);
  return h === 0 ? `${d}d` : `${d}d ${h}h`;
}
