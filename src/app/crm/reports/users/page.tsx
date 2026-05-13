"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Users,
  UserPlus,
  UserCheck,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
} from "lucide-react";
import { Button, PageHeader, Card } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const GROWTH_DATA = [
  { month: "Oct", newUsers: 1840, activeUsers: 12400, kycCompleted: 1280, churned: 320 },
  { month: "Nov", newUsers: 2310, activeUsers: 13200, kycCompleted: 1560, churned: 380 },
  { month: "Dec", newUsers: 1980, activeUsers: 12800, kycCompleted: 1340, churned: 440 },
  { month: "Jan", newUsers: 2760, activeUsers: 14600, kycCompleted: 1980, churned: 290 },
  { month: "Feb", newUsers: 3420, activeUsers: 16800, kycCompleted: 2340, churned: 350 },
  { month: "Mar", newUsers: 2980, activeUsers: 15900, kycCompleted: 2120, churned: 410 },
  { month: "Apr", newUsers: 3840, activeUsers: 18200, kycCompleted: 2680, churned: 360 },
];

const FUNNEL_DATA = [
  { stage: "注册", count: 18200, color: "#6366f1" },
  { stage: "验证邮箱", count: 15840, color: "#8b5cf6" },
  { stage: "完成 KYC", count: 9120, color: "#0ea5e9" },
  { stage: "首次入金", count: 6380, color: "#10b981" },
  { stage: "首次交易", count: 4290, color: "#f59e0b" },
  { stage: "活跃 30d", count: 2840, color: "#ec4899" },
];

const REGION_DATA = [
  { region: "🇻🇳 Vietnam", users: 4280, pct: 23.5, growth: "+18%" },
  { region: "🇹🇭 Thailand", users: 3640, pct: 20.0, growth: "+24%" },
  { region: "🇯🇵 Japan", users: 2980, pct: 16.4, growth: "+11%" },
  { region: "🇮🇳 India", users: 2540, pct: 13.9, growth: "+31%" },
  { region: "🇦🇪 UAE", users: 1820, pct: 10.0, growth: "+15%" },
  { region: "🇰🇷 Korea", users: 1240, pct: 6.8, growth: "+9%" },
  { region: "Others", users: 1700, pct: 9.4, growth: "+20%" },
];

const RETENTION_DATA = [
  { week: "W1", d1: 82, d7: 64, d30: 41 },
  { week: "W2", d1: 79, d7: 61, d30: 39 },
  { week: "W3", d1: 84, d7: 67, d30: 44 },
  { week: "W4", d1: 88, d7: 71, d30: 48 },
  { week: "W5", d1: 85, d7: 68, d30: 46 },
  { week: "W6", d1: 91, d7: 74, d30: 52 },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="flex justify-between gap-4">
          <span>{p.name}</span>
          <span className="font-mono font-medium">{p.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

export default function UserReportsPage() {
  const [period, setPeriod] = useState<"30d" | "90d" | "1y">("30d");

  const current = GROWTH_DATA[GROWTH_DATA.length - 1];
  const prev = GROWTH_DATA[GROWTH_DATA.length - 2];

  const totalUsers = 18200;
  const kycRate = Math.round((current.kycCompleted / current.newUsers) * 100);
  const churnRate = ((current.churned / prev.activeUsers) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "报表" }, { label: "用户报表" }]} />

      <PageHeader
        title="用户报表"
        description="用户增长、活跃度、留存率及地区分布分析"
        actions={
          <Button variant="secondary">
            <Download className="w-4 h-4" />
            导出
          </Button>
        }
      />

      {/* Period */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-sm w-fit">
        {(["30d", "90d", "1y"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setPeriod(r)}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              period === r ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
            }`}
          >
            {r === "30d" ? "30天" : r === "90d" ? "90天" : "1年"}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "总用户数", value: totalUsers.toLocaleString(), change: "14.2", up: true, icon: Users, bg: "bg-blue-100", color: "text-blue-600" },
          { label: "本月新增", value: current.newUsers.toLocaleString(), change: "28.9", up: true, icon: UserPlus, bg: "bg-emerald-100", color: "text-emerald-600" },
          { label: "KYC 完成率", value: `${kycRate}%`, change: "5.3", up: true, icon: UserCheck, bg: "bg-purple-100", color: "text-purple-600" },
          { label: "流失率", value: `${churnRate}%`, change: "0.8", up: false, icon: ArrowDownRight, bg: "bg-amber-100", color: "text-amber-600" },
        ].map(({ label, value, change, up, icon: Icon, bg, color }) => (
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
            <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </Card>
        ))}
      </div>

      {/* Growth Chart */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-6">用户增长趋势</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={GROWTH_DATA}>
            <defs>
              <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="activeUsers" name="活跃用户" stroke="#6366f1" strokeWidth={2} fill="url(#activeGrad)" />
            <Bar dataKey="newUsers" name="新增用户" fill="#10b981" radius={[3, 3, 0, 0]} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card>
          <h3 className="text-base font-semibold text-slate-800 mb-4">转化漏斗</h3>
          <div className="space-y-2">
            {FUNNEL_DATA.map(({ stage, count, color }, idx) => {
              const pct = Math.round((count / FUNNEL_DATA[0].count) * 100);
              const convPct = idx > 0 ? Math.round((count / FUNNEL_DATA[idx - 1].count) * 100) : 100;
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-700 font-medium">{stage}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">{count.toLocaleString()}</span>
                      {idx > 0 && (
                        <span className="text-slate-500">
                          转化 <span className="font-semibold text-slate-700">{convPct}%</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-6 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.85 }}
                    >
                      <span className="text-white text-xs font-bold">{pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Region Distribution */}
        <Card>
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-400" />
            地区分布
          </h3>
          <div className="space-y-3">
            {REGION_DATA.map(({ region, users, pct, growth }) => (
              <div key={region}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-700">{region}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500">{users.toLocaleString()}</span>
                    <span className="text-emerald-600 font-medium">{growth}</span>
                    <span className="text-slate-700 font-semibold w-8 text-right">{pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Retention */}
      <Card>
        <h3 className="text-base font-semibold text-slate-800 mb-6">用户留存率</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={RETENTION_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip formatter={(v: any) => `${v}%`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="d1" name="次日留存" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="d7" name="7日留存" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="d30" name="30日留存" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
