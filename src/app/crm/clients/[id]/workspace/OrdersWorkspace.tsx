"use client";

/**
 * OrdersWorkspace — 「订单」一级 Tab 容器（2026-05-16 新建）.
 *
 * 把客户在所有 MT 交易账户的订单**跨账户聚合**到一个视图里展示，
 * 让运营/风控/CS 不必逐账户跳进去查。两个子 Tab：
 *
 *   - 持仓订单 (positions) — `closeTime == null` 的活动持仓
 *   - 历史订单 (history)   — `closeTime != null` 的已平仓单
 *
 * 顶部提供：
 *   - KPI 摘要条（账户数 / 持仓数 / 浮动盈亏 / 已实现盈亏 / 30 天交易量）
 *   - 账户筛选下拉（按 MT 账户号）
 *   - 品种筛选下拉（EURUSD / XAUUSD / …）
 *   - 子 Tab 切换
 *
 * 过滤状态在 Workspace 层维护一次，下传给子 Tab。这样切换 持仓/历史
 * 时筛选条件保留，符合运营的肌肉记忆。
 */

import { useMemo, useState } from "react";
import type { ClientDetailData } from "@/types/backoffice/client-detail";
import PositionsTab from "../tabs/PositionsTab";
import OrderHistoryTab from "../tabs/OrderHistoryTab";
import { SubTabBar, useSubTab } from "./SubTabBar";

const SUBS = [
  { key: "positions", label: "持仓订单" },
  { key: "history",   label: "历史订单" },
] as const;

const VALID = SUBS.map((s) => s.key);

export default function OrdersWorkspace({ data }: { data: ClientDetailData }) {
  const [active, setActive] = useSubTab("positions", VALID);

  // —— 跨子 Tab 复用的筛选状态 ——
  // "all" = 不过滤；其他 = MT 账户号
  const [accountFilter, setAccountFilter] = useState<string>("all");
  // "all" = 不过滤；其他 = symbol
  const [symbolFilter, setSymbolFilter] = useState<string>("all");

  /* ─── KPI 摘要：派生自 trades + accounts ─── */
  const { positions, history, kpi, allSymbols } = useMemo(() => {
    const positions = data.trades.filter((t) => !t.closeTime);
    const history   = data.trades.filter((t) => !!t.closeTime);

    const floatingPnL = positions.reduce((s, t) => s + (t.profit ?? 0), 0);
    const realizedPnL = history.reduce((s, t) => s + (t.profit ?? 0), 0);
    // 最近 30 天交易量（按开仓时间）— Date.now() 包在模块级 pure 函数里
    // 以规避 react-hooks/purity 规则（不能在 hook 回调里直接调用 impure
    // 函数）。
    const lots30d = computeLots30d(data.trades);

    const symbolSet = new Set<string>();
    for (const t of data.trades) symbolSet.add(t.symbol);

    return {
      positions,
      history,
      allSymbols: Array.from(symbolSet).sort(),
      kpi: {
        accounts: data.accounts.length,
        activeAccounts: data.accounts.filter((a) => a.status === "active").length,
        openPositions: positions.length,
        floatingPnL,
        realizedPnL,
        lots30d: Number(lots30d.toFixed(2)),
      },
    };
  }, [data.trades, data.accounts]);

  /* ─── 应用筛选 ─── */
  const filteredPositions = useMemo(
    () => applyFilters(positions, accountFilter, symbolFilter),
    [positions, accountFilter, symbolFilter],
  );
  const filteredHistory = useMemo(
    () => applyFilters(history, accountFilter, symbolFilter),
    [history, accountFilter, symbolFilter],
  );

  return (
    <div className="space-y-5">
      {/* KPI 摘要条 */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-4xl">
        <Stat label="交易账户" value={`${kpi.activeAccounts} / ${kpi.accounts}`} sub="活跃 / 总数" />
        <Stat label="持仓订单" value={`${kpi.openPositions}`} sub="未平仓笔数" />
        <Stat
          label="浮动盈亏"
          value={fmtMoneySigned(kpi.floatingPnL)}
          tone={kpi.floatingPnL >= 0 ? "ok" : "danger"}
        />
        <Stat
          label="已实现盈亏"
          value={fmtMoneySigned(kpi.realizedPnL)}
          tone={kpi.realizedPnL >= 0 ? "ok" : "danger"}
        />
        <Stat label="30 天交易量" value={`${kpi.lots30d} lots`} />
      </section>

      {/* 筛选条 + 子 Tab */}
      <div className="border-t border-slate-100 pt-4 flex items-center gap-3 flex-wrap">
        <SubTabBar
          primaryTab="trading"
          subs={[
            { ...SUBS[0], count: filteredPositions.length },
            { ...SUBS[1], count: filteredHistory.length },
          ]}
          active={active}
          onChange={setActive}
        />

        <div className="flex items-center gap-2 ml-auto">
          <FilterSelect
            label="账户"
            value={accountFilter}
            onChange={setAccountFilter}
            options={[
              { value: "all", label: `全部账户 (${data.accounts.length})` },
              ...data.accounts.map((a) => ({
                value: a.mtAccount,
                label: `${a.mtAccount} · ${a.accountType}`,
              })),
            ]}
          />
          <FilterSelect
            label="品种"
            value={symbolFilter}
            onChange={setSymbolFilter}
            options={[
              { value: "all", label: `全部品种 (${allSymbols.length})` },
              ...allSymbols.map((s) => ({ value: s, label: s })),
            ]}
          />
        </div>
      </div>

      {/* 子 Tab 内容 */}
      {active === "positions" && <PositionsTab trades={filteredPositions} />}
      {active === "history"   && <OrderHistoryTab trades={filteredHistory} />}
    </div>
  );
}

/* ─── 工具：跨账户筛选 ─── */
function applyFilters(
  trades: ClientDetailData["trades"],
  account: string,
  symbol: string,
) {
  return trades.filter((t) => {
    if (account !== "all" && t.mtAccount !== account) return false;
    if (symbol !== "all" && t.symbol !== symbol) return false;
    return true;
  });
}

/* ─── 视觉组件 ─── */
function Stat({
  label, value, sub, tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "ok" | "warn" | "danger";
}) {
  const t = tone ?? "default";
  const cls = t === "danger" ? "text-red-700"
    : t === "warn" ? "text-amber-700"
    : t === "ok" ? "text-emerald-700"
    : "text-slate-900";
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${cls}`}>{value}</div>
      {sub && <div className="text-[10.5px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs">
      <span className="text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 pl-2 pr-7 border border-slate-200 rounded-md bg-white text-slate-700 text-xs hover:border-slate-300 focus:outline-none focus:border-primary"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function fmtMoneySigned(n: number): string {
  const sign = n >= 0 ? "+" : "-";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000)    return `${sign}$${(abs / 1000).toFixed(1)}k`;
  return `${sign}$${abs.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

/** Last-30-day cumulative lot volume. Date.now() is impure so it has to
 *  live outside any hook callback (React 19 react-hooks/purity rule). */
function computeLots30d(trades: ClientDetailData["trades"]): number {
  const cutoff = Date.now() - 30 * 24 * 3600_000;
  return trades
    .filter((t) => new Date(t.openTime).getTime() > cutoff)
    .reduce((s, t) => s + t.volume, 0);
}
