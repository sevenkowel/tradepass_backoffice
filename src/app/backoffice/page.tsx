"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Building2, KeyRound, CreditCard, TrendingUp, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

interface Metrics {
  users: { total: number; active: number };
  tenants: { total: number; trial: number };
  licenses: { total: number; active: number };
  invoices: { total: number; paid: number; revenue: number };
  recentUsers: { id: string; email: string; name: string | null; createdAt: string }[];
  recentTenants: {
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: string;
    owner: { email: string };
  }[];
}

// Demo 默认数据
const DEFAULT_METRICS: Metrics = {
  users: { total: 0, active: 0 },
  tenants: { total: 0, trial: 0 },
  licenses: { total: 0, active: 0 },
  invoices: { total: 0, paid: 0, revenue: 0 },
  recentUsers: [],
  recentTenants: [],
};

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics>(DEFAULT_METRICS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/backoffice/metrics")
      .then((r) => r.json())
      .then((data) => {
        // 合并默认数据，防止 undefined
        setMetrics({
          ...DEFAULT_METRICS,
          ...data,
          users: { ...DEFAULT_METRICS.users, ...data.users },
          tenants: { ...DEFAULT_METRICS.tenants, ...data.tenants },
          licenses: { ...DEFAULT_METRICS.licenses, ...data.licenses },
          invoices: { ...DEFAULT_METRICS.invoices, ...data.invoices },
          recentUsers: data.recentUsers || [],
          recentTenants: data.recentTenants || [],
        });
      })
      .catch(() => {
        // API 失败时使用默认数据
        setMetrics(DEFAULT_METRICS);
      })
      .finally(() => setLoading(false));
  }, []);

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
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Users className="w-6 h-6" />}
          label="总用户数"
          value={metrics.users.total}
          sub={`${metrics.users.active} 活跃`}
          color="blue"
        />
        <MetricCard
          icon={<Building2 className="w-6 h-6" />}
          label="总租户数"
          value={metrics.tenants.total}
          sub={`${metrics.tenants.trial} 试用中`}
          color="amber"
        />
        <MetricCard
          icon={<KeyRound className="w-6 h-6" />}
          label="License 总数"
          value={metrics.licenses.total}
          sub={`${metrics.licenses.active} 有效`}
          color="emerald"
        />
        <MetricCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="总收入"
          value={`$${metrics.invoices.revenue.toFixed(2)}`}
          sub={`${metrics.invoices.paid} 笔已支付`}
          color="violet"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5">
            <h2 className="font-semibold text-slate-900 mb-4">最新注册用户</h2>
            <div className="space-y-3">
              {metrics.recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{u.name || u.email}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {metrics.recentUsers.length === 0 && (
                <EmptyState title="暂无注册用户" description="还没有用户注册，推广后可在此查看。" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="font-semibold text-slate-900 mb-4">最新创建租户</h2>
            <div className="space-y-3">
              {metrics.recentTenants.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">
                      {t.owner.email} · {t.status}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {metrics.recentTenants.length === 0 && (
                <EmptyState title="暂无租户" description="还没有租户被创建。" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  color: "blue" | "amber" | "emerald" | "violet";
}) {
  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    amber: "bg-amber-100 text-amber-600",
    emerald: "bg-emerald-100 text-emerald-600",
    violet: "bg-violet-100 text-violet-600",
  };
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>{icon}</div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}
