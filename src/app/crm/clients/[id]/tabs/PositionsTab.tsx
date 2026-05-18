"use client";

/**
 * PositionsTab — 跨账户持仓订单表（2026-05-16 新建）.
 *
 * 输入：已经在 OrdersWorkspace 层做过 账户/品种 筛选的持仓 trades，
 *      即 closeTime == null 的 TradeRecord。
 *
 * 列：
 *   时间 │ 账户 │ 品种 │ 方向 │ 手数 │ 开仓价 │ 现价 │ 浮动盈亏 │ SL/TP
 *
 * 表头点击排序：时间 / 浮动盈亏 / 手数（desc → asc → 默认）。
 * 行点击 → 跳到对应账户详情页（带 account+tab=trading sub=positions）。
 */

import { useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";
import type { TradeRecord } from "@/types/backoffice/client-detail";
import { useT } from "@/lib/i18n/LocaleProvider";

type SortKey = "time" | "profit" | "volume";
type SortDir = "asc" | "desc";

export default function PositionsTab({ trades }: { trades: TradeRecord[] }) {
  const { locale } = useT();
  const dateLocale =
    locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : locale === "es" ? "es-ES" : "en-US";

  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
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
        case "time":
        default:
          av = new Date(a.openTime).getTime();
          bv = new Date(b.openTime).getTime();
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

  // 点击行 → 跳到对应账户的订单子 Tab
  const jumpToAccount = (mtAccount?: string) => {
    if (!mtAccount) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "accounts");
    params.set("account", mtAccount);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  /* ── 总浮动盈亏（行汇总） ── */
  const totalFloating = trades.reduce((s, t) => s + (t.profit ?? 0), 0);

  if (trades.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-slate-400">
        当前无持仓订单
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          持仓订单
        </h3>
        <span className="text-xs tabular-nums text-slate-500">
          {trades.length} 笔 · 合计浮动盈亏{" "}
          <span className={totalFloating >= 0 ? "text-emerald-700" : "text-red-700"}>
            {totalFloating >= 0 ? "+" : ""}${totalFloating.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <SortableTh active={sortKey === "time"} dir={sortDir} onClick={() => toggleSort("time")}>
                开仓时间
              </SortableTh>
              <th className="pb-2 pr-4">账户</th>
              <th className="pb-2 pr-4">品种</th>
              <th className="pb-2 pr-4">方向</th>
              <SortableTh active={sortKey === "volume"} dir={sortDir} onClick={() => toggleSort("volume")} align="right">
                手数
              </SortableTh>
              <th className="pb-2 pr-4 text-right">开仓价</th>
              <th className="pb-2 pr-4 text-right">现价</th>
              <SortableTh active={sortKey === "profit"} dir={sortDir} onClick={() => toggleSort("profit")} align="right">
                浮动盈亏
              </SortableTh>
              <th className="pb-2 text-right">SL / TP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((t) => (
              <PositionRow
                key={t.id}
                trade={t}
                dateLocale={dateLocale}
                onClickAccount={jumpToAccount}
              />
            ))}
          </tbody>
        </table>
      </div>
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

function PositionRow({
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

  return (
    <tr className="hover:bg-slate-50/60">
      <td className="py-2 pr-4 text-xs text-slate-500 tabular-nums whitespace-nowrap">
        {new Date(trade.openTime).toLocaleString(dateLocale, {
          month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit",
        })}
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
        {trade.currentPrice ?? "—"}
      </td>
      <td className={`py-2 pr-4 text-right font-medium tabular-nums ${profitTone}`}>
        {trade.profit == null
          ? "—"
          : `${trade.profit >= 0 ? "+" : ""}$${trade.profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
      </td>
      <td className="py-2 text-right text-[11px] font-mono text-slate-500 tabular-nums whitespace-nowrap">
        {trade.stopLoss != null ? <span className="text-red-600">{trade.stopLoss}</span> : <span className="text-slate-300">—</span>}
        <span className="text-slate-300 mx-1">/</span>
        {trade.takeProfit != null ? <span className="text-emerald-600">{trade.takeProfit}</span> : <span className="text-slate-300">—</span>}
      </td>
    </tr>
  );
}
