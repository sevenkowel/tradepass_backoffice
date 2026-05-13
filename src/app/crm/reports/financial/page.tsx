"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button, PageHeader, Card } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MONTHLY_DATA = [
  { month: "Oct", deposits: 2840000, withdrawals: 1920000, netFlow: 920000, fees: 42600 },
  { month: "Nov", deposits: 3210000, withdrawals: 2180000, netFlow: 1030000, fees: 48150 },
  { month: "Dec", deposits: 2980000, withdrawals: 2450000, netFlow: 530000, fees: 44700 },
  { month: "Jan", deposits: 3560000, withdrawals: 2310000, netFlow: 1250000, fees: 53400 },
  { month: "Feb", deposits: 4120000, withdrawals: 2780000, netFlow: 1340000, fees: 61800 },
  { month: "Mar", deposits: 3890000, withdrawals: 3020000, netFlow: 870000, fees: 58350 },
  { month: "Apr", deposits: 4580000, withdrawals: 2890000, netFlow: 1690000, fees: 68700 },
];

const CHANNEL_DATA = [
  { channel: "加密货币", amount: 18400000, pct: 38, color: "#6366f1" },
  { channel: "银行转账", amount: 14200000, pct: 29, color: "#0ea5e9" },
  { channel: "信用卡", amount: 9800000, pct: 20, color: "#10b981" },
  { channel: "电汇", amount: 4900000, pct: 10, color: "#f59e0b" },
  { channel: "电子钱包", amount: 1500000, pct: 3, color: "#ec4899" },
];

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(1)}K`
    : `$${n}`;

const pct = (a: number, b: number) => {
  const diff = ((a - b) / b) * 100;
  return { value: Math.abs(diff).toFixed(1), up: diff >= 0 };
};

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="flex justify-between gap-4">
          <span>{p.name}</span>
          <span className="font-mono font-medium">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Range = "7d" | "30d" | "90d" | "1y";

export default function FinancialReportsPage() {
  const [range, setRange] = useState<Range>("30d");

  const current = MONTHLY_DATA[MONTHLY_DATA.length - 1];
  const prev = MONTHLY_DATA[MONTHLY_DATA.length - 2];

  const depPct = pct(current.deposits, prev.deposits);
  const wdPct = pct(current.withdrawals, prev.withdrawals);
  const netPct = pct(current.netFlow, prev.netFlow);
  const feePct = pct(current.fees, prev.fees);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "报表" }, { label: "财务报表" }]} />

      <PageHeader
        title="财务报表"
        description="资金流入流出、手续费收入及渠道分析"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="secondary">
              <Download className="w-4 h-4" />
              导出 Excel
            </Button>
          </div>
        }
      />

      {/* Range Selector */}
      <div className="flex items-center gap-3">
        <Calendar className="w-4 h-4 text-slate-400" />
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-sm">
          {(["7d", "30d", "90d", "1y"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                range === r ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {r === "7d" ? "7天" : r === "30d" ? "30天" : r === "90d" ? "90天" : "1年"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "本月入金", value: fmt(current.deposits), change: depPct, icon: TrendingUp, iconColor: "text-emerald-600", iconBg: "bg-emerald-100" },
          { label: "本月出金", value: fmt(current.withdrawals), change: { ...wdPct, up: !wdPct.up }, icon: TrendingDown, iconColor: "text-red-600", iconBg: "bg-red-100" },
          { label: "净资金流入", value: fmt(current.netFlow), change: netPct, icon: DollarSign, iconColor: "text-blue-600", iconBg: "bg-blue-100" },
          { label: "手续费收入", value: fmt(current.fees), change: feePct, icon: DollarSign, iconColor: "text-purple-600", iconBg: "bg-purple-100" },
        ].map(({ label, value, change, icon: Icon, iconColor, iconBg }) => (
          <Card key={label} className="!p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <span
                className={`flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                  change.up ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                }`}
              >
                {change.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {change.value}%
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </Card>
        ))}
      </div>

      {/* Area Chart */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-6">入金 vs 出金趋势</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={MONTHLY_DATA}>
            <defs>
              <linearGradient id="depositGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="withdrawalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="deposits" name="入金" stroke="#10b981" strokeWidth={2} fill="url(#depositGrad)" />
            <Area type="monotone" dataKey="withdrawals" name="出金" stroke="#ef4444" strokeWidth={2} fill="url(#withdrawalGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Net Flow */}
        <Card>
          <h3 className="text-base font-semibold text-slate-800 mb-6">净资金流入 & 手续费</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MONTHLY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis tickFormatter={(v) => `$${(v / 1_000).toFixed(0)}K`} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="netFlow" name="净流入" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fees" name="手续费" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Channel Breakdown */}
        <Card>
          <h3 className="text-base font-semibold text-slate-800 mb-4">支付渠道分布</h3>
          <div className="space-y-3">
            {CHANNEL_DATA.map(({ channel, amount, pct, color }) => (
              <div key={channel}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-700 font-medium">{channel}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-xs">{fmt(amount)}</span>
                    <span className="text-slate-700 font-semibold w-8 text-right">{pct}%</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
