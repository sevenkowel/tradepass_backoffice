"use client";

import { Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight, Activity, Clock, AlertTriangle } from "lucide-react";
import type { ClientDetailData } from "@/types/backoffice/client-detail";

interface Props {
  data: ClientDetailData;
}

export default function OverviewTab({ data }: Props) {
  const { user, valueMetrics, timeline, riskFactors } = data;

  // 风险警告
  const riskWarnings = riskFactors
    .filter((f) => f.level !== "low")
    .map((f) => ({ label: f.name, description: f.description }));

  // 最近活动（取 timeline 前 5 条）
  const recentActivities = timeline.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="当前余额" value={`$${valueMetrics.currentBalance.toLocaleString()}`} icon={Wallet} color="blue" />
        <KpiCard label="净入金" value={`$${valueMetrics.netDeposit.toLocaleString()}`} icon={ArrowDownLeft} color="emerald" />
        <KpiCard label="浮动盈亏" value={`+$${valueMetrics.totalProfit.toLocaleString()}`} icon={TrendingUp} color="violet" />
        <KpiCard label="持仓数量" value={`${valueMetrics.openPositions}`} icon={Activity} color="amber" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="总入金" value={`$${(user.totalDeposit || 0).toLocaleString()}`} icon={ArrowDownLeft} color="slate" />
        <KpiCard label="总出金" value={`$${(user.totalWithdrawal || 0).toLocaleString()}`} icon={ArrowUpRight} color="slate" />
        <KpiCard label="净值" value={`$${valueMetrics.equity.toLocaleString()}`} icon={Wallet} color="slate" />
        <KpiCard label="最后登录" value={formatTimeAgo(user.lastLoginAt)} icon={Clock} color="slate" />
      </div>

      {/* Risk Warnings */}
      {riskWarnings.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-red-800">风险警告</h4>
          </div>
          <div className="space-y-2">
            {riskWarnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-red-700">{w.label}</span>
                  <span className="text-red-600 ml-1">{w.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activities */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">最近活动</h4>
        <div className="space-y-3">
          {recentActivities.map((item) => (
            <div key={item.id} className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="text-slate-700 flex-1">{item.title}</span>
              <span className="text-slate-500 text-xs">{formatTimeAgo(item.timestamp)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-50 text-slate-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div className={`p-4 rounded-xl ${colorMap[color] || colorMap.slate}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 opacity-70" />
        <span className="text-xs opacity-70">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "刚刚";
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 30) return `${diffDays} 天前`;
  return date.toLocaleDateString("zh-CN");
}
