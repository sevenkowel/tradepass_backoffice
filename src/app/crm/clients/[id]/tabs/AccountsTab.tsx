"use client";

import { Briefcase, Ban, Settings, Lock, Plus } from "lucide-react";
import type { ClientDetailData, TradingAccount } from "@/types/backoffice/client-detail";
import type { BaseTabProps } from "@/types/backoffice/client";


export default function AccountsTab({ data }: BaseTabProps) {
  const { accounts } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">交易账户</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          新建账户
        </button>
      </div>

      <div className="space-y-3">
        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>
    </div>
  );
}

function AccountCard({ account }: { account: TradingAccount }) {
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: "活跃", color: "text-emerald-700", bg: "bg-emerald-50" },
    disabled: { label: "已禁用", color: "text-slate-600", bg: "bg-slate-100" },
    restricted: { label: "受限", color: "text-red-700", bg: "bg-red-50" },
  };

  const status = statusConfig[account.status] || statusConfig.disabled;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Briefcase className="w-5 h-5 text-blue-600" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-slate-900">{account.mtAccount}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.color}`}>{status.label}</span>
            </div>
            <span className="text-xs text-slate-500">{account.accountType} · {account.group}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors" title="禁用账户">
            <Ban className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors" title="修改杠杆">
            <Settings className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors" title="限制交易">
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Metric label="余额" value={`$${account.balance.toLocaleString()}`} />
        <Metric label="净值" value={`$${account.equity.toLocaleString()}`} />
        <Metric label="保证金" value={`$${account.margin.toLocaleString()}`} />
        <Metric label="保证金比例" value={account.marginLevel} highlight />
        <Metric label="杠杆" value={account.leverage} />
      </div>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-sm font-semibold ${highlight ? "text-emerald-600" : "text-slate-900"}`}>{value}</div>
    </div>
  );
}
