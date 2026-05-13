"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  CreditCard, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Building2,
  Loader2,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, PageHeader } from "@/components/crm/ui";
import { LineChartComponent, BarChartComponent, AreaChartComponent, PieChartComponent } from "@/components/crm/charts";
import { Breadcrumb } from "@/components/crm/layout";
import { EmptyState } from "@/components/ui/EmptyState";

// Chart mock data (trading data not yet in database)
const volumeData = [
  { date: "Mon", value: 4500, volume: 3200 },
  { date: "Tue", value: 5200, volume: 3800 },
  { date: "Wed", value: 4800, volume: 3500 },
  { date: "Thu", value: 6100, volume: 4200 },
  { date: "Fri", value: 5500, volume: 4000 },
  { date: "Sat", value: 3200, volume: 2500 },
  { date: "Sun", value: 2800, volume: 2100 },
];

const userData = [
  { date: "Week 1", registered: 120, verified: 80, deposited: 45 },
  { date: "Week 2", registered: 145, verified: 95, deposited: 52 },
  { date: "Week 3", registered: 132, verified: 88, deposited: 48 },
  { date: "Week 4", registered: 168, verified: 110, deposited: 62 },
];

const depositWithdrawData = [
  { date: "Mon", deposit: 450, withdraw: 120 },
  { date: "Tue", deposit: 520, withdraw: 180 },
  { date: "Wed", deposit: 480, withdraw: 150 },
  { date: "Thu", deposit: 610, withdraw: 200 },
  { date: "Fri", deposit: 550, withdraw: 190 },
  { date: "Sat", deposit: 320, withdraw: 80 },
  { date: "Sun", deposit: 280, withdraw: 60 },
];

const instrumentData = [
  { name: "XAUUSD", value: 45000, color: "#F59E0B" },
  { name: "EURUSD", value: 32000, color: "#3B82F6" },
  { name: "GBPJPY", value: 18000, color: "#10B981" },
  { name: "USDJPY", value: 15000, color: "#8B5CF6" },
  { name: "Others", value: 12000, color: "#6B7280" },
];

// KPI Card Component
interface KPICardProps {
  title: string;
  value: string;
  change: number;
  icon: LucideIcon;
  color: string;
  delay?: number;
}

function KPICard({ title, value, change, icon: Icon, color, delay = 0 }: KPICardProps) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-200" },
    red: { bg: "bg-red-50", icon: "text-red-600", border: "border-red-200" },
    blue: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-200" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-200" },
    orange: { bg: "bg-orange-50", icon: "text-orange-600", border: "border-orange-200" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-200" },
  };

  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center border", c.bg, c.border)}>
          <Icon size={20} className={c.icon} />
        </div>
        <div className={cn(
          "flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-lg",
          isPositive && "bg-emerald-50 text-emerald-600 border border-emerald-200",
          isNegative && "bg-red-50 text-red-600 border border-red-200",
          !isPositive && !isNegative && "bg-gray-50 text-gray-500 border border-gray-200"
        )}>
          {isPositive ? <ArrowUpRight size={11} /> : isNegative ? <ArrowDownRight size={11} /> : null}
          {isPositive && "+"}
          {change}%
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "month">("7d");
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/backoffice/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const kpiData = metrics?.kpi
    ? [
        {
          title: "Today's Deposits",
          value: "$1,234,567",
          change: 12.5,
          icon: DollarSign,
          color: "emerald",
        },
        {
          title: "Today's Withdrawals",
          value: "$456,789",
          change: -5.2,
          icon: CreditCard,
          color: "red",
        },
        {
          title: "Net Deposit",
          value: "$777,778",
          change: 18.3,
          icon: TrendingUp,
          color: "blue",
        },
        {
          title: "Total Users",
          value: metrics.kpi.users.total.toLocaleString(),
          change: 8.7,
          icon: Users,
          color: "purple",
        },
        {
          title: "Active Traders",
          value: "5,678",
          change: -2.1,
          icon: Activity,
          color: "orange",
        },
        {
          title: "Pending Reviews",
          value: String(metrics.kpi.pendingKyc || 0),
          change: -15.3,
          icon: Clock,
          color: "amber",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400 mr-2" />
        <span className="text-sm text-slate-500">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Page Header */}
      <PageHeader
        title="Dashboard Overview"
        description="Real-time monitoring of platform operations"
        actions={
          <div className="flex gap-2">
            {(["7d", "30d", "month"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                  timeRange === range
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                )}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "This Month"}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiData.map((kpi, index) => (
          <KPICard
            key={kpi.title}
            {...kpi}
            delay={index * 0.05}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trading Volume Trend */}
        <Card padding="none">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Trading Volume Trend</h3>
            <p className="text-sm text-gray-500 mt-1">Volume and transaction count over time</p>
          </div>
          <div className="p-5">
            <LineChartComponent
              data={volumeData}
              xKey="date"
              yKeys={[
                { key: "value", name: "Volume ($)", color: "#3B82F6" },
                { key: "volume", name: "Transactions", color: "#10B981" },
              ]}
              height={280}
            />
          </div>
        </Card>

        {/* User Registration Trend */}
        <Card padding="none">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">User Registration Funnel</h3>
            <p className="text-sm text-gray-500 mt-1">Weekly user registration and conversion</p>
          </div>
          <div className="p-5">
            <BarChartComponent
              data={userData}
              xKey="date"
              yKeys={[
                { key: "registered", name: "Registered", color: "#3B82F6" },
                { key: "verified", name: "Verified", color: "#10B981" },
                { key: "deposited", name: "Deposited", color: "#F59E0B" },
              ]}
              stacked
              height={280}
            />
          </div>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deposit/Withdraw Comparison */}
        <Card padding="none" className="lg:col-span-2">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Deposit vs Withdrawal</h3>
            <p className="text-sm text-gray-500 mt-1">Daily comparison of deposits and withdrawals</p>
          </div>
          <div className="p-5">
            <AreaChartComponent
              data={depositWithdrawData}
              xKey="date"
              yKeys={[
                { key: "deposit", name: "Deposit", color: "#10B981" },
                { key: "withdraw", name: "Withdrawal", color: "#EF4444" },
              ]}
              height={250}
            />
          </div>
        </Card>

        {/* Trading by Instrument */}
        <Card padding="none">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Trading by Instrument</h3>
            <p className="text-sm text-gray-500 mt-1">Distribution by trading instrument</p>
          </div>
          <div className="p-5">
            <PieChartComponent
              data={instrumentData}
              height={250}
            />
          </div>
        </Card>
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <Card padding="none" className="lg:col-span-2">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">最新注册用户</h3>
              <p className="text-sm text-gray-500 mt-1">平台最新注册用户</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">用户</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">邮箱</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">注册时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(metrics?.recentUsers || []).map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{u.name || "-"}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{u.email}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!metrics?.recentUsers || metrics.recentUsers.length === 0) && (
              <EmptyState title="暂无注册用户" className="py-8" />
            )}
          </div>
        </Card>

        {/* Recent Tenants */}
        <Card padding="none">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">最新租户</h3>
              <p className="text-sm text-gray-500 mt-1">最近创建的租户</p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {(metrics?.recentTenants || []).map((t: any) => (
              <div key={t.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Building2 size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{t.owner?.email || t.slug}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {(!metrics?.recentTenants || metrics.recentTenants.length === 0) && (
              <EmptyState title="暂无租户" className="py-8" />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
