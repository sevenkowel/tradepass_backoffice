"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, AlertTriangle, Ban, UserCheck, Wallet } from "lucide-react";
import type { ClientDetailData, FundRecord } from "@/types/backoffice/client-detail";
import type { BaseTabProps } from "@/types/backoffice/client";


export default function FundsTab({ data }: BaseTabProps) {
  const { funds } = data;
  const [filter, setFilter] = useState<"all" | "deposit" | "withdrawal">("all");

  const filtered = filter === "all" ? funds : funds.filter((f) => f.type === filter);

  const deposits = funds.filter((f) => f.type === "deposit");
  const withdrawals = funds.filter((f) => f.type === "withdrawal");

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">资金管理</h3>

      {/* 统计 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <ArrowDownLeft className="w-4 h-4" />
            <span className="text-xs font-medium">总入金</span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            ${deposits.reduce((s, f) => s + f.amount, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-xs font-medium">总出金</span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            ${Math.abs(withdrawals.reduce((s, f) => s + f.amount, 0)).toLocaleString()}
          </div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">风险标记</span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {funds.filter((f) => f.riskFlags && f.riskFlags.length > 0).length}
          </div>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex gap-2">
        {(["all", "deposit", "withdrawal"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === type ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {type === "all" ? "全部" : type === "deposit" ? "入金" : "出金"}
          </button>
        ))}
      </div>

      {/* 记录列表 */}
      <div className="space-y-3">
        {filtered.map((fund) => (
          <FundRow key={fund.id} fund={fund} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">暂无记录</div>
        )}
      </div>
    </div>
  );
}

function FundRow({ fund }: { fund: FundRecord }) {
  const isDeposit = fund.type === "deposit";

  const statusConfig: Record<string, { label: string; color: string }> = {
    completed: { label: "已完成", color: "text-emerald-600" },
    pending: { label: "处理中", color: "text-amber-600" },
    rejected: { label: "已拒绝", color: "text-red-600" },
    manual_review: { label: "人工审核", color: "text-amber-600" },
    frozen: { label: "已冻结", color: "text-red-600" },
  };

  const status = statusConfig[fund.status] || { label: fund.status, color: "text-slate-600" };

  const methodLabels: Record<string, string> = {
    bank_transfer: "银行转账",
    crypto: "加密货币",
    e_wallet: "电子钱包",
    credit_card: "信用卡",
    wire_transfer: "电汇",
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDeposit ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
          {isDeposit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
        </div>
        <div>
          <div className="text-sm font-medium text-slate-900">
            {isDeposit ? "入金" : "出金"} · {methodLabels[fund.method] || fund.method}
          </div>
          <div className="text-xs text-slate-500">{new Date(fund.createdAt).toLocaleString("zh-CN")}</div>
          {fund.riskFlags && fund.riskFlags.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span className="text-xs text-amber-600">{fund.riskFlags.join(", ")}</span>
            </div>
          )}
        </div>
      </div>

      <div className="text-right">
        <div className={`font-semibold ${isDeposit ? "text-emerald-600" : "text-red-600"}`}>
          {isDeposit ? "+" : ""}${Math.abs(fund.amount).toLocaleString()}
        </div>
        <div className={`text-xs ${status.color}`}>{status.label}</div>
      </div>

      {/* 操作按钮 */}
      {fund.status === "manual_review" && (
        <div className="flex items-center gap-2 ml-4">
          <button className="p-1.5 rounded hover:bg-emerald-100 text-emerald-600" title="通过">
            <UserCheck className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-red-100 text-red-600" title="拒绝">
            <Ban className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
