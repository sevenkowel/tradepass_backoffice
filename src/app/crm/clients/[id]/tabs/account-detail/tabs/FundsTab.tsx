"use client";

/**
 * Funds Tab — 资金流水（按类型 5 个子分类筛选）
 *
 *   - Deposits      入金
 *   - Withdrawals   出金
 *   - Transfers     账户间转账
 *   - Credit        Bonus / Rebate / 调整
 *   - Adjustments   手动调整
 *
 * Header 显示净入金 / 总入金 / 总出金 / 累计利息+手续费四个聚合数字，
 * 让运营快速判断「这个账户钱进得多还是出得多」。
 */

import { useMemo, useState } from "react";
import type {
  TradingAccount, AccountFlowEntry, AccountFlowKind,
} from "@/types/backoffice/client-detail";
import { Card, Empty, Metric, fmtMoney, shortTime } from "../primitives";

type FundFilter = "all" | "deposit" | "withdrawal" | "transfer" | "credit" | "adjustment";

const FILTERS: { key: FundFilter; label: string }[] = [
  { key: "all",        label: "All" },
  { key: "deposit",    label: "Deposits" },
  { key: "withdrawal", label: "Withdrawals" },
  { key: "transfer",   label: "Transfers" },
  { key: "credit",     label: "Credit" },
  { key: "adjustment", label: "Adjustments" },
];

function matches(kind: AccountFlowKind, filter: FundFilter): boolean {
  if (filter === "all")        return true;
  if (filter === "deposit")    return kind === "deposit";
  if (filter === "withdrawal") return kind === "withdrawal";
  if (filter === "transfer")   return kind === "transfer_in" || kind === "transfer_out";
  if (filter === "credit")     return kind === "rebate" || kind === "swap" || kind === "commission";
  if (filter === "adjustment") return kind === "adjustment";
  return false;
}

const FLOW_LABEL: Record<AccountFlowKind, string> = {
  deposit: "Deposit", withdrawal: "Withdrawal", commission: "Commission", swap: "Swap",
  adjustment: "Adjustment", transfer_in: "Transfer In", transfer_out: "Transfer Out", rebate: "Rebate",
};

interface Props {
  account: TradingAccount;
  flow: AccountFlowEntry[];
}

export function FundsTab({ account, flow }: Props) {
  const [filter, setFilter] = useState<FundFilter>("all");

  const filtered = useMemo(() => flow.filter((f) => matches(f.type, filter)), [flow, filter]);

  const totals = useMemo(() => {
    let deposit = 0, withdrawal = 0, fees = 0, swap = 0, rebate = 0;
    for (const f of flow) {
      if (f.type === "deposit" || f.type === "transfer_in") deposit += f.amount;
      else if (f.type === "withdrawal" || f.type === "transfer_out") withdrawal += Math.abs(f.amount);
      else if (f.type === "commission") fees += Math.abs(f.amount);
      else if (f.type === "swap") swap += f.amount;
      else if (f.type === "rebate") rebate += f.amount;
    }
    return { deposit, withdrawal, net: deposit - withdrawal, fees, swap, rebate };
  }, [flow]);

  return (
    <div>
      {/* Aggregates */}
      <Card className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Metric label="Net Deposit"  value={fmtMoney(totals.net, account.currency)}
                  tone={totals.net >= 0 ? "ok" : "danger"} emphasize />
          <Metric label="Gross Inflow" value={fmtMoney(totals.deposit, account.currency)}
                  sub="incl. transfers in" />
          <Metric label="Gross Outflow" value={fmtMoney(totals.withdrawal, account.currency)}
                  sub="incl. transfers out" />
          <Metric label="Total Fees"   value={fmtMoney(-(totals.fees), account.currency)}
                  sub="commission + swap" tone="warn" />
          <Metric label="Total Rebates" value={fmtMoney(totals.rebate, account.currency)}
                  tone="ok" />
        </div>
      </Card>

      {/* Filter pills — 与 Trading / Activity Tab 同款风格 */}
      <div className="mb-4">
        <div className="inline-flex bg-slate-100 rounded-lg p-0.5 flex-wrap max-w-full">
          {FILTERS.map((f) => {
            const count = f.key === "all" ? flow.length : flow.filter((e) => matches(e.type, f.key)).length;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 h-7 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  active
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>{f.label}</span>
                {count > 0 && (
                  <span className="text-[10px] tabular-nums text-slate-400">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Flow table */}
      {filtered.length === 0 ? <Empty>No flow entries</Empty> : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <th className="pb-2 pr-3 w-[110px]">Time</th>
              <th className="pb-2 pr-3 w-[110px]">Type</th>
              <th className="pb-2 pr-3">Description</th>
              <th className="pb-2 pr-3 text-right w-[120px]">Amount</th>
              <th className="pb-2 text-right w-[120px]">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((f) => (
              <tr key={f.id}>
                <td className="py-2 pr-3 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                  {shortTime(f.timestamp)}
                </td>
                <td className="py-2 pr-3 text-xs">
                  <span className={`px-1.5 py-0.5 rounded font-medium ${
                    f.amount >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {FLOW_LABEL[f.type]}
                  </span>
                </td>
                <td className="py-2 pr-3 text-slate-600 truncate">{f.description}</td>
                <td className={`py-2 pr-3 text-right tabular-nums font-medium ${
                  f.amount >= 0 ? "text-emerald-700" : "text-red-700"
                }`}>
                  {f.amount >= 0 ? "+" : ""}{fmtMoney(f.amount, account.currency)}
                </td>
                <td className="py-2 text-right tabular-nums text-slate-500 text-xs">
                  {fmtMoney(f.balanceAfter, account.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
