"use client";

/**
 * FundsWorkspace — 「资金」一级 Tab 容器（2026-05-16 新建）.
 *
 *   - 钱包 (wallets)        — 客户在平台的内部账户余额（v1 仅 USD）
 *   - 流水明细 (transactions) — 入金 / 出金 / 待审核 等所有资金流水
 *
 * 顶部摘要条统一展示 5 个 KPI（钱包余额 / 冻结 / 累计入金 / 累计出金 / 待审核）。
 *
 * 与 Sidebar 关系：Sidebar 只显示「净资产」概念（钱包 + 账户合并），
 * 这里展开钱包 vs 账户的拆分，并提供流水追溯。
 */

import { useMemo } from "react";
import type { ClientDetailData } from "@/types/backoffice/client-detail";
import WalletsTab from "../tabs/WalletsTab";
import FundsTab from "../tabs/FundsTab";
import { SubTabBar, useSubTab } from "./SubTabBar";

const SUBS = [
  { key: "wallets",      label: "钱包" },
  { key: "transactions", label: "流水明细" },
] as const;

const VALID = SUBS.map((s) => s.key);

export default function FundsWorkspace({ data }: { data: ClientDetailData }) {
  const [active, setActive] = useSubTab("wallets", VALID);

  /* ── KPI 摘要 ── */
  const kpi = useMemo(() => {
    const totalWalletBalance = data.wallets.reduce((s, w) => s + w.balance, 0);
    const totalFrozen = data.wallets.reduce((s, w) => s + w.frozen, 0);

    const deposits = data.funds.filter(
      (f) => f.type === "deposit" && f.status === "completed",
    );
    const withdrawals = data.funds.filter(
      (f) => f.type === "withdrawal" && f.status === "completed",
    );
    const pending = data.funds.filter(
      (f) => f.status === "pending" || f.status === "manual_review",
    );

    return {
      walletBalance: totalWalletBalance,
      frozen: totalFrozen,
      totalDeposit: deposits.reduce((s, f) => s + f.amount, 0),
      totalWithdrawal: Math.abs(withdrawals.reduce((s, f) => s + f.amount, 0)),
      pendingCount: pending.length,
    };
  }, [data.wallets, data.funds]);

  return (
    <div className="space-y-5">
      {/* KPI 摘要条 */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-4xl">
        <Stat label="钱包余额" value={fmtMoney(kpi.walletBalance)} sub={`含冻结 ${fmtMoney(kpi.frozen)}`} />
        <Stat
          label="冻结金额"
          value={fmtMoney(kpi.frozen)}
          tone={kpi.frozen > 0 ? "warn" : "default"}
        />
        <Stat label="累计入金" value={fmtMoney(kpi.totalDeposit)} tone="ok" />
        <Stat label="累计出金" value={fmtMoney(kpi.totalWithdrawal)} />
        <Stat
          label="待审核"
          value={`${kpi.pendingCount}`}
          sub={kpi.pendingCount > 0 ? "笔" : "无"}
          tone={kpi.pendingCount > 0 ? "warn" : "default"}
        />
      </section>

      {/* 子 Tab */}
      <div className="border-t border-slate-100 pt-4">
        <SubTabBar
          primaryTab="funds"
          subs={[
            { ...SUBS[0], count: data.wallets.length },
            { ...SUBS[1], count: data.funds.length },
          ]}
          active={active}
          onChange={setActive}
        />

        {active === "wallets"      && <WalletsTab data={data} />}
        {active === "transactions" && <FundsTab data={data} />}
      </div>
    </div>
  );
}

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

function fmtMoney(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000)    return `${sign}$${(abs / 1000).toFixed(1)}k`;
  return `${sign}$${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
