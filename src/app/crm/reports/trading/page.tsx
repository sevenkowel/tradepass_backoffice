"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Activity,
  BarChart3,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button, PageHeader, Card } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const DAILY_VOLUME = [
  { day: "3/30", volume: 12400000, orders: 2340, pnl: 148000 },
  { day: "3/31", volume: 14800000, orders: 2890, pnl: 223000 },
  { day: "4/1", volume: 11200000, orders: 2100, pnl: -89000 },
  { day: "4/2", volume: 16800000, orders: 3240, pnl: 312000 },
  { day: "4/3", volume: 13600000, orders: 2560, pnl: 178000 },
  { day: "4/4", volume: 18200000, orders: 3810, pnl: 456000 },
  { day: "4/5", volume: 15400000, orders: 2980, pnl: 234000 },
];

const INSTRUMENT_DATA = [
  { name: "EUR/USD", volume: 45000000, trades: 18240, color: "#6366f1" },
  { name: "XAU/USD", volume: 32000000, trades: 9840, color: "#f59e0b" },
  { name: "GBP/USD", volume: 28000000, trades: 11200, color: "#0ea5e9" },
  { name: "USD/JPY", volume: 21000000, trades: 8460, color: "#10b981" },
  { name: "BTC/USD", volume: 15000000, trades: 4230, color: "#ec4899" },
  { name: "Other", volume: 9000000, trades: 3200, color: "#94a3b8" },
];

const TOP_TRADERS = [
  { rank: 1, id: "MT-88291", pnl: "+$124,580", volume: "$8.2M", trades: 342, win: "68%" },
  { rank: 2, id: "MT-77403", pnl: "+$98,240", volume: "$6.7M", trades: 218, win: "72%" },
  { rank: 3, id: "MT-92817", pnl: "+$76,110", volume: "$5.1M", trades: 189, win: "65%" },
  { rank: 4, id: "MT-64521", pnl: "+$54,390", volume: "$3.8M", trades: 156, win: "61%" },
  { rank: 5, id: "MT-73840", pnl: "+$43,120", volume: "$2.9M", trades: 124, win: "58%" },
];

const HOURLY_DIST = [
  { hour: "00", trades: 120 }, { hour: "02", trades: 85 }, { hour: "04", trades: 210 },
  { hour: "06", trades: 380 }, { hour: "08", trades: 890 }, { hour: "10", trades: 1240 },
  { hour: "12", trades: 980 }, { hour: "14", trades: 1560 }, { hour: "16", trades: 1820 },
  { hour: "18", trades: 1340 }, { hour: "20", trades: 760 }, { hour: "22", trades: 430 },
];

const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`;
const fmtK = (n: number) => n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="flex justify-between gap-4">
          <span>{p.name}</span>
          <span className="font-mono font-medium">{p.name === "交易量" ? fmt(p.value) : fmtK(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export default function TradingReportsPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");

  const totalVolume = DAILY_VOLUME.reduce((s, d) => s + d.volume, 0);
  const totalOrders = DAILY_VOLUME.reduce((s, d) => s + d.orders, 0);
  const totalPnl = DAILY_VOLUME.reduce((s, d) => s + d.pnl, 0);
  const avgDailyVol = totalVolume / DAILY_VOLUME.length;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Reports" }, { label: "交易报表" }]} />

      <PageHeader
        title="交易报表"
        description="交易量、订单分布、品种占比及盈亏分析"
        actions={
          <Button variant="secondary">
            <Download className="w-4 h-4" />
            导出
          </Button>
        }
      />

      {/* Range */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-sm w-fit">
        {(["7d", "30d", "90d"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setPeriod(r)}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              period === r ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
            }`}
          >
            {r === "7d" ? "7天" : r === "30d" ? "30天" : "90天"}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "总交易量", value: fmt(totalVolume), sub: `日均 ${fmt(avgDailyVol)}`, icon: Activity, bg: "bg-indigo-100", color: "text-indigo-600", up: true, change: "12.4" },
          { label: "总订单数", value: fmtK(totalOrders), sub: `日均 ${fmtK(Math.round(totalOrders / DAILY_VOLUME.length))}`, icon: BarChart3, bg: "bg-blue-100", color: "text-blue-600", up: true, change: "8.7" },
          { label: "净盈亏", value: `+${fmt(totalPnl)}`, sub: "用户端综合盈亏", icon: TrendingUp, bg: "bg-emerald-100", color: "text-emerald-600", up: true, change: "23.1" },
          { label: "活跃账户", value: "3,847", sub: "持有开仓仓位", icon: Activity, bg: "bg-purple-100", color: "text-purple-600", up: false, change: "3.2" },
        ].map(({ label, value, sub, icon: Icon, bg, color, up, change }) => (
          <Card key={label} className="!p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                up ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              }`}>
                {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {change}%
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-0.5">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
          </Card>
        ))}
      </div>

      {/* Volume + Orders Line Chart */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-6">日交易量 & 订单数</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={DAILY_VOLUME}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis yAxisId="vol" tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis yAxisId="ord" orientation="right" tickFormatter={(v) => `${(v / 1000).toFixed(1)}K`} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="vol" type="monotone" dataKey="volume" name="交易量" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: "#6366f1" }} />
            <Line yAxisId="ord" type="monotone" dataKey="orders" name="订单数" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: "#f59e0b" }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instrument Pie / Bar */}
        <Card>
          <h3 className="text-base font-semibold text-slate-800 mb-4">交易品种分布</h3>
          <div className="flex items-center gap-4">
            <div className="w-36 h-36 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={INSTRUMENT_DATA} dataKey="volume" cx="50%" cy="50%" outerRadius={68} innerRadius={44}>
                    {INSTRUMENT_DATA.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2.5">
              {INSTRUMENT_DATA.map(({ name, volume, color }) => {
                const pct = Math.round((volume / INSTRUMENT_DATA.reduce((s, d) => s + d.volume, 0)) * 100);
                return (
                  <div key={name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-slate-700">{name}</span>
                      </span>
                      <span className="text-slate-500 font-mono">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Hourly Distribution */}
        <Card>
          <h3 className="text-base font-semibold text-slate-800 mb-4">交易时段分布（UTC）</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={HOURLY_DIST} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <Tooltip />
              <Bar dataKey="trades" name="订单数" fill="#6366f1" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Traders */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-4">盈利排行 Top 5</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["排名", "账号 ID", "净盈亏", "交易量", "成交笔数", "胜率"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TOP_TRADERS.map(({ rank, id, pnl, volume, trades, win }) => (
                <tr key={id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                      rank === 1 ? "bg-amber-100 text-amber-700" :
                      rank === 2 ? "bg-slate-100 text-slate-600" :
                      rank === 3 ? "bg-orange-100 text-orange-700" :
                      "bg-slate-50 text-slate-500"
                    }`}>{rank}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">{id}</td>
                  <td className="py-3 px-4 font-semibold text-emerald-600">{pnl}</td>
                  <td className="py-3 px-4 text-slate-600">{volume}</td>
                  <td className="py-3 px-4 text-slate-600">{trades}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">{win}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
