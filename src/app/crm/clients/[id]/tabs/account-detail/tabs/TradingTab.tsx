"use client";

/**
 * Trading Tab — 交易实况
 *
 * 内部 4 个 sub-tab：
 *   - Positions  当前持仓
 *   - Orders     挂单（限价/止损）
 *   - History    成交历史
 *   - Exposure   按品种聚合的净敞口
 *
 * Exposure 是新加的：对运营来说，「这个客户在 EURUSD 上净买多少手」
 * 比「他有 30 张持仓单」更有意义。
 */

import { useMemo, useState } from "react";
import { ArrowUp, ChevronsUpDown } from "lucide-react";
import type {
  TradingAccount, OpenPosition, PendingOrder, TradeRecord,
} from "@/types/backoffice/client-detail";
import { Empty, fmtMoney, shortTime, timeAgo } from "../primitives";

/* --------------------------------------------------------------------- */
/* Sortable hook + header — 复用给所有子表                                */
/* --------------------------------------------------------------------- */

type SortDir = "asc" | "desc";
type SortState<K extends string> = { key: K | null; dir: SortDir };
type Comparable = string | number | null | undefined;

function useSortable<T, K extends string>(
  data: T[],
  defaultSort: { key: K; dir: SortDir },
  getValue: (row: T, key: K) => Comparable,
) {
  const [sort, setSort] = useState<SortState<K>>(defaultSort);

  const sortedData = useMemo(() => {
    if (!sort.key) return data;
    const k = sort.key;
    const mult = sort.dir === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      const va = getValue(a, k);
      const vb = getValue(b, k);
      // null/undefined 永远沉底
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * mult;
      return String(va).localeCompare(String(vb)) * mult;
    });
  }, [data, sort, getValue]);

  const toggleSort = (key: K) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "desc" };
      if (prev.dir === "desc") return { key, dir: "asc" };
      // 第三次点击：回到默认排序
      return defaultSort;
    });
  };

  return { sortedData, sort, toggleSort };
}

function SortHeader<K extends string>({
  label, sortKey, current, align = "left", className = "", onClick,
}: {
  label: string;
  sortKey: K;
  current: SortState<K>;
  align?: "left" | "right";
  className?: string;
  onClick: (key: K) => void;
}) {
  const active = current.key === sortKey;
  return (
    <th
      onClick={() => onClick(sortKey)}
      className={`pb-2 pr-3 select-none cursor-pointer group hover:text-slate-700 transition-colors ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
    >
      <span className={`inline-flex items-baseline gap-0.5 ${align === "right" ? "flex-row-reverse" : ""}`}>
        <span>{label}</span>
        {active ? (
          <ArrowUp
            className={`w-3 h-3 self-center text-slate-700 transition-transform ${current.dir === "desc" ? "rotate-180" : ""}`}
          />
        ) : (
          <ChevronsUpDown className="w-3 h-3 self-center text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </span>
    </th>
  );
}

type SubTab = "positions" | "pending" | "history" | "exposure";

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: "positions", label: "Positions" },
  { key: "pending",   label: "Orders" },
  { key: "history",   label: "History" },
  { key: "exposure",  label: "Exposure" },
];

interface Props {
  account: TradingAccount;
  positions: OpenPosition[];
  pending: PendingOrder[];
  history: TradeRecord[];
}

export function TradingTab({ account, positions, pending, history }: Props) {
  const [sub, setSub] = useState<SubTab>("positions");

  return (
    <div>
      {/* Sub-tabs (pill segmented control) + inline summary in one row */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="inline-flex bg-slate-100 rounded-lg p-0.5">
          {SUB_TABS.map((t) => {
            const active = sub === t.key;
            const count =
              t.key === "positions" ? positions.length
              : t.key === "pending" ? pending.length
              : t.key === "history" ? history.length
              : undefined;
            return (
              <button
                key={t.key}
                onClick={() => setSub(t.key)}
                className={`px-3 h-7 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  active
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>{t.label}</span>
                {count != null && count > 0 && (
                  <span className={`text-[10px] tabular-nums ${active ? "text-slate-400" : "text-slate-400"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Inline summary - 右侧紧凑显示，根据当前子 Tab 切换 */}
        <SubTabSummary
          sub={sub}
          positions={positions}
          pending={pending}
          history={history}
          currency={account.currency}
        />
      </div>

      {sub === "positions" && <PositionsPanel positions={positions} />}
      {sub === "pending"   && <PendingPanel orders={pending} />}
      {sub === "history"   && <HistoryPanel trades={history} />}
      {sub === "exposure"  && <ExposurePanel positions={positions} currency={account.currency} equity={account.equity} />}
    </div>
  );
}

/* ===================================================================== */
/* Inline summary — 跟 sub-tabs 同行的紧凑摘要                            */
/* ===================================================================== */

function SubTabSummary({
  sub, positions, pending, history, currency,
}: {
  sub: SubTab;
  positions: OpenPosition[];
  pending: PendingOrder[];
  history: TradeRecord[];
  currency: string;
}) {
  if (sub === "positions" && positions.length > 0) {
    const totalPnl = positions.reduce((s, p) => s + p.pnl, 0);
    const totalVolume = positions.reduce((s, p) => s + p.volume, 0);
    return (
      <div className="flex items-baseline gap-3 text-xs">
        <SummaryStat label="Volume" value={totalVolume.toFixed(2)} />
        <SummaryStat
          label="Floating PnL"
          value={`${totalPnl >= 0 ? "+" : ""}${fmtMoney(totalPnl, currency)}`}
          tone={totalPnl >= 0 ? "ok" : "danger"}
        />
      </div>
    );
  }

  if (sub === "pending" && pending.length > 0) {
    const totalVolume = pending.reduce((s, o) => s + o.volume, 0);
    return (
      <div className="flex items-baseline gap-3 text-xs">
        <SummaryStat label="Pending Volume" value={totalVolume.toFixed(2)} />
      </div>
    );
  }

  if (sub === "history" && history.length > 0) {
    const closed = history.filter((t) => t.profit != null);
    const totalPnl = closed.reduce((s, t) => s + (t.profit ?? 0), 0);
    const wins = closed.filter((t) => (t.profit ?? 0) > 0).length;
    const winRate = closed.length === 0 ? 0 : wins / closed.length;
    return (
      <div className="flex items-baseline gap-3 text-xs">
        <SummaryStat label="Win Rate" value={`${(winRate * 100).toFixed(0)}%`} />
        <SummaryStat
          label="Realized PnL"
          value={`${totalPnl >= 0 ? "+" : ""}${fmtMoney(totalPnl, currency)}`}
          tone={totalPnl >= 0 ? "ok" : "danger"}
        />
      </div>
    );
  }

  return null;
}

function SummaryStat({
  label, value, tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "danger";
}) {
  const toneCls = {
    neutral: "text-slate-800",
    ok:      "text-emerald-700",
    danger:  "text-red-700",
  }[tone];
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-slate-400">{label}</span>
      <span className={`font-mono font-semibold tabular-nums ${toneCls}`}>{value}</span>
    </span>
  );
}

/* ===================================================================== */
/* Positions                                                              */
/* ===================================================================== */

type PosSortKey = "symbol" | "side" | "volume" | "openPrice" | "currentPrice" | "pnl" | "swap" | "openTime";

function PositionsPanel({ positions }: { positions: OpenPosition[] }) {
  const { sortedData, sort, toggleSort } = useSortable<OpenPosition, PosSortKey>(
    positions,
    { key: "openTime", dir: "desc" },
    (row, k) => row[k],
  );

  if (positions.length === 0) return <Empty>No open positions</Empty>;

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
            <SortHeader<PosSortKey> label="Symbol"  sortKey="symbol"       current={sort} onClick={toggleSort} className="w-[100px]" />
            <SortHeader<PosSortKey> label="Side"    sortKey="side"         current={sort} onClick={toggleSort} className="w-[60px]" />
            <SortHeader<PosSortKey> label="Volume"  sortKey="volume"       current={sort} onClick={toggleSort} align="right" className="w-[70px]" />
            <SortHeader<PosSortKey> label="Open"    sortKey="openPrice"    current={sort} onClick={toggleSort} align="right" />
            <SortHeader<PosSortKey> label="Current" sortKey="currentPrice" current={sort} onClick={toggleSort} align="right" />
            <th className="pb-2 pr-3 text-right text-slate-400">SL / TP</th>
            <SortHeader<PosSortKey> label="PnL"     sortKey="pnl"          current={sort} onClick={toggleSort} align="right" />
            <SortHeader<PosSortKey> label="Swap"    sortKey="swap"         current={sort} onClick={toggleSort} align="right" />
            <SortHeader<PosSortKey> label="Opened"  sortKey="openTime"     current={sort} onClick={toggleSort} align="right" className="w-[100px]" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedData.map((p) => (
            <tr key={p.id}>
              <td className="py-2 pr-3 font-medium text-slate-800">{p.symbol}</td>
              <td className="py-2 pr-3">
                <span className={`text-xs font-medium ${p.side === "buy" ? "text-emerald-700" : "text-red-700"}`}>
                  {p.side === "buy" ? "Buy" : "Sell"}
                </span>
              </td>
              <td className="py-2 pr-3 text-right tabular-nums">{p.volume}</td>
              <td className="py-2 pr-3 text-right font-mono text-xs text-slate-600">{p.openPrice}</td>
              <td className="py-2 pr-3 text-right font-mono text-xs text-slate-800">{p.currentPrice}</td>
              <td className="py-2 pr-3 text-right text-[10px] text-slate-500 leading-tight">
                {p.stopLoss != null ? <div>S {p.stopLoss}</div> : <div className="text-slate-300">—</div>}
                {p.takeProfit != null ? <div>T {p.takeProfit}</div> : <div className="text-slate-300">—</div>}
              </td>
              <td className={`py-2 pr-3 text-right tabular-nums font-medium ${p.pnl >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {p.pnl >= 0 ? "+" : ""}${p.pnl.toFixed(2)}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums text-xs text-slate-500">{p.swap.toFixed(2)}</td>
              <td className="py-2 text-right text-xs text-slate-500">{timeAgo(p.openTime)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ===================================================================== */
/* Pending Orders                                                         */
/* ===================================================================== */

const PENDING_LABEL: Record<PendingOrder["orderType"], string> = {
  buy_limit:  "Buy Limit",  sell_limit: "Sell Limit",
  buy_stop:   "Buy Stop",   sell_stop:  "Sell Stop",
};

type PendSortKey = "symbol" | "orderType" | "volume" | "price" | "placedAt" | "expiresAt";

function PendingPanel({ orders }: { orders: PendingOrder[] }) {
  const { sortedData, sort, toggleSort } = useSortable<PendingOrder, PendSortKey>(
    orders,
    { key: "placedAt", dir: "desc" },
    (row, k) => row[k],
  );

  if (orders.length === 0) return <Empty>No pending orders</Empty>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
          <SortHeader<PendSortKey> label="Symbol"  sortKey="symbol"    current={sort} onClick={toggleSort} />
          <SortHeader<PendSortKey> label="Type"    sortKey="orderType" current={sort} onClick={toggleSort} />
          <SortHeader<PendSortKey> label="Volume"  sortKey="volume"    current={sort} onClick={toggleSort} align="right" />
          <SortHeader<PendSortKey> label="Trigger" sortKey="price"     current={sort} onClick={toggleSort} align="right" />
          <th className="pb-2 pr-3 text-right text-slate-400">SL / TP</th>
          <SortHeader<PendSortKey> label="Placed"  sortKey="placedAt"  current={sort} onClick={toggleSort} />
          <SortHeader<PendSortKey> label="Expires" sortKey="expiresAt" current={sort} onClick={toggleSort} />
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {sortedData.map((o) => {
          const isBuy = o.orderType.startsWith("buy");
          return (
            <tr key={o.id}>
              <td className="py-2 pr-3 font-medium text-slate-800">{o.symbol}</td>
              <td className="py-2 pr-3">
                <span className={`text-xs font-medium ${isBuy ? "text-emerald-700" : "text-red-700"}`}>
                  {PENDING_LABEL[o.orderType]}
                </span>
              </td>
              <td className="py-2 pr-3 text-right tabular-nums">{o.volume}</td>
              <td className="py-2 pr-3 text-right font-mono text-xs">{o.price}</td>
              <td className="py-2 pr-3 text-right text-[10px] text-slate-500 leading-tight">
                {o.stopLoss != null ? <div>S {o.stopLoss}</div> : <div className="text-slate-300">—</div>}
                {o.takeProfit != null ? <div>T {o.takeProfit}</div> : <div className="text-slate-300">—</div>}
              </td>
              <td className="py-2 pr-3 text-xs text-slate-500">{timeAgo(o.placedAt)}</td>
              <td className="py-2 text-xs text-slate-500 tabular-nums">
                {o.expiresAt ? new Date(o.expiresAt).toLocaleDateString("zh-CN") : "GTC"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ===================================================================== */
/* History                                                                */
/* ===================================================================== */

type HistSortKey = "openTime" | "symbol" | "type" | "volume" | "openPrice" | "closePrice" | "profit";

function HistoryPanel({ trades }: { trades: TradeRecord[] }) {
  const { sortedData, sort, toggleSort } = useSortable<TradeRecord, HistSortKey>(
    trades,
    { key: "openTime", dir: "desc" },
    (row, k) => row[k],
  );

  if (trades.length === 0) return <Empty>No trade history</Empty>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
          <SortHeader<HistSortKey> label="Time"   sortKey="openTime"   current={sort} onClick={toggleSort} className="w-[100px]" />
          <SortHeader<HistSortKey> label="Symbol" sortKey="symbol"     current={sort} onClick={toggleSort} className="w-[100px]" />
          <SortHeader<HistSortKey> label="Side"   sortKey="type"       current={sort} onClick={toggleSort} className="w-[60px]" />
          <SortHeader<HistSortKey> label="Volume" sortKey="volume"     current={sort} onClick={toggleSort} align="right" className="w-[70px]" />
          <SortHeader<HistSortKey> label="Open"   sortKey="openPrice"  current={sort} onClick={toggleSort} align="right" />
          <SortHeader<HistSortKey> label="Close"  sortKey="closePrice" current={sort} onClick={toggleSort} align="right" />
          <SortHeader<HistSortKey> label="PnL"    sortKey="profit"     current={sort} onClick={toggleSort} align="right" />
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {sortedData.slice(0, 100).map((t) => (
          <tr key={t.id}>
            <td className="py-2 pr-3 text-xs text-slate-500 tabular-nums">{shortTime(t.openTime)}</td>
            <td className="py-2 pr-3 font-medium text-slate-800">{t.symbol}</td>
            <td className="py-2 pr-3">
              <span className={`text-xs font-medium ${t.type === "buy" ? "text-emerald-700" : "text-red-700"}`}>
                {t.type === "buy" ? "Buy" : "Sell"}
              </span>
            </td>
            <td className="py-2 pr-3 text-right tabular-nums">{t.volume}</td>
            <td className="py-2 pr-3 text-right font-mono text-xs text-slate-600">{t.openPrice}</td>
            <td className="py-2 pr-3 text-right font-mono text-xs text-slate-600">{t.closePrice ?? "—"}</td>
            <td className={`py-2 text-right tabular-nums font-medium ${
              t.profit != null && t.profit >= 0 ? "text-emerald-700"
                : t.profit != null ? "text-red-700"
                : "text-slate-400"
            }`}>
              {t.profit != null ? `${t.profit >= 0 ? "+" : ""}$${t.profit}` : "Open"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ===================================================================== */
/* Exposure — aggregated by symbol                                        */
/* ===================================================================== */

type ExposureRow = {
  symbol: string;
  netLots: number;
  longLots: number;
  shortLots: number;
  notional: number;
  pnl: number;
};
type ExpoSortKey = "symbol" | "netLots" | "notional" | "pnl";

function ExposurePanel({
  positions, currency, equity,
}: { positions: OpenPosition[]; currency: string; equity: number }) {
  const exposure = useMemo<ExposureRow[]>(() => {
    const map = new Map<string, { netLots: number; longLots: number; shortLots: number; notional: number; pnl: number }>();
    for (const p of positions) {
      const cur = map.get(p.symbol) ?? { netLots: 0, longLots: 0, shortLots: 0, notional: 0, pnl: 0 };
      const signed = p.side === "buy" ? p.volume : -p.volume;
      cur.netLots += signed;
      if (p.side === "buy") cur.longLots += p.volume; else cur.shortLots += p.volume;
      // Notional = volume * 100000 * openPrice (approx, lot * contract size)
      cur.notional += p.volume * 100000 * p.openPrice;
      cur.pnl += p.pnl;
      map.set(p.symbol, cur);
    }
    return Array.from(map.entries()).map(([symbol, v]) => ({ symbol, ...v }));
  }, [positions]);

  // 排序用绝对值的 notional 做默认
  const { sortedData, sort, toggleSort } = useSortable<ExposureRow, ExpoSortKey>(
    exposure,
    { key: "notional", dir: "desc" },
    (row, k) => k === "notional" ? Math.abs(row.notional) : row[k],
  );

  if (exposure.length === 0) return <Empty>No symbol exposure</Empty>;

  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">
        Net exposure aggregated by symbol. <span className="text-slate-400">Notional = volume × contract size × price.</span>
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
            <SortHeader<ExpoSortKey> label="Symbol"       sortKey="symbol"   current={sort} onClick={toggleSort} />
            <SortHeader<ExpoSortKey> label="Net Lots"     sortKey="netLots"  current={sort} onClick={toggleSort} align="right" />
            <th className="pb-2 pr-3 text-right text-slate-400">Long / Short</th>
            <SortHeader<ExpoSortKey> label="Notional"     sortKey="notional" current={sort} onClick={toggleSort} align="right" />
            <th className="pb-2 pr-3 text-right text-slate-400">% Equity</th>
            <SortHeader<ExpoSortKey> label="Floating PnL" sortKey="pnl"      current={sort} onClick={toggleSort} align="right" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedData.map((e) => {
            const pct = equity > 0 ? Math.abs(e.notional) / (equity * 100) : 0;  // very rough
            const tone =
              pct > 0.5 ? "text-red-700"
              : pct > 0.3 ? "text-amber-700"
              : "text-slate-700";
            return (
              <tr key={e.symbol}>
                <td className="py-2 pr-3 font-medium text-slate-800 font-mono">{e.symbol}</td>
                <td className={`py-2 pr-3 text-right tabular-nums font-semibold ${e.netLots > 0 ? "text-emerald-700" : e.netLots < 0 ? "text-red-700" : "text-slate-500"}`}>
                  {e.netLots > 0 ? "+" : ""}{e.netLots.toFixed(2)}
                </td>
                <td className="py-2 pr-3 text-right text-xs text-slate-500 tabular-nums">
                  {e.longLots.toFixed(2)} / {e.shortLots.toFixed(2)}
                </td>
                <td className={`py-2 pr-3 text-right tabular-nums ${tone}`}>
                  {fmtMoney(e.notional, currency)}
                </td>
                <td className={`py-2 pr-3 text-right tabular-nums ${tone}`}>
                  {(pct * 100).toFixed(1)}%
                </td>
                <td className={`py-2 text-right tabular-nums font-medium ${e.pnl >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {e.pnl >= 0 ? "+" : ""}{fmtMoney(e.pnl, currency)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
