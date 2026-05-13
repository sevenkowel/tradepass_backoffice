"use client";

import { useState } from "react";
import {
  Funnel,
  Users,
  UserPlus,
  DollarSign,
  BarChart3,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { Card, PageHeader } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { cn } from "@/lib/utils";

// Types
interface FunnelStage {
  id: string;
  name: string;
  count: number;
  prevCount?: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface ConversionData {
  date: string;
  registrations: number;
  kycCompleted: number;
  firstDeposit: number;
  firstTrade: number;
}

// Mock data
const funnelStages: FunnelStage[] = [
  { id: "register", name: "注册", count: 12500, icon: <UserPlus className="w-5 h-5" />, color: "text-blue-600", bgColor: "bg-blue-100" },
  { id: "kyc", name: "完成KYC", count: 8750, prevCount: 12500, icon: <Users className="w-5 h-5" />, color: "text-violet-600", bgColor: "bg-violet-100" },
  { id: "deposit", name: "首次入金", count: 4200, prevCount: 8750, icon: <DollarSign className="w-5 h-5" />, color: "text-emerald-600", bgColor: "bg-emerald-100" },
  { id: "trade", name: "首笔交易", count: 3150, prevCount: 4200, icon: <BarChart3 className="w-5 h-5" />, color: "text-amber-600", bgColor: "bg-amber-100" },
];

const dailyData: ConversionData[] = [
  { date: "03-09", registrations: 180, kycCompleted: 125, firstDeposit: 58, firstTrade: 42 },
  { date: "03-10", registrations: 195, kycCompleted: 140, firstDeposit: 65, firstTrade: 48 },
  { date: "03-11", registrations: 210, kycCompleted: 155, firstDeposit: 72, firstTrade: 55 },
  { date: "03-12", registrations: 175, kycCompleted: 120, firstDeposit: 55, firstTrade: 40 },
  { date: "03-13", registrations: 220, kycCompleted: 165, firstDeposit: 80, firstTrade: 60 },
  { date: "03-14", registrations: 240, kycCompleted: 180, firstDeposit: 88, firstTrade: 68 },
  { date: "03-15", registrations: 200, kycCompleted: 150, firstDeposit: 70, firstTrade: 52 },
];

export default function FunnelPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");

  const conversionRates = funnelStages.map((stage, i) => {
    if (i === 0) return { ...stage, rate: 100 };
    const rate = stage.prevCount ? Math.round((stage.count / stage.prevCount) * 100) : 0;
    return { ...stage, rate };
  });

  const overallRate = Math.round((funnelStages[funnelStages.length - 1].count / funnelStages[0].count) * 100);

  const maxCount = Math.max(...funnelStages.map((s) => s.count));

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "仪表盘" }, { label: "转化漏斗" }]} />

      <PageHeader
        title="转化漏斗"
        description="分析用户从注册到首单的转化路径"
      />

      {/* Period Selector */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl w-fit">
        {(["7d", "30d", "90d"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              period === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            )}
          >
            {p === "7d" ? "近7天" : p === "30d" ? "近30天" : "近90天"}
          </button>
        ))}
      </div>

      {/* Funnel Visualization */}
      <Card className="!p-6">
        <div className="flex items-center gap-2 mb-6">
          <Funnel className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold">转化漏斗</h3>
          <span className="text-sm text-gray-500 ml-auto">总转化率: {overallRate}%</span>
        </div>

        <div className="space-y-3">
          {conversionRates.map((stage, i) => (
            <div key={stage.id} className="relative">
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", stage.bgColor)}>
                  <div className={stage.color}>{stage.icon}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{stage.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">{stage.count.toLocaleString()}</span>
                      {i > 0 && (
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", stage.rate >= 50 ? "bg-emerald-100 text-emerald-600" : stage.rate >= 30 ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600")}>
                          {stage.rate}% 转化
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", stage.bgColor.replace("bg-", "bg-").replace("100", "500"))}
                      style={{ width: `${(stage.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              {i < conversionRates.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowRight className="w-4 h-4 text-gray-300 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Daily Trend */}
      <Card className="!p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold">每日转化趋势</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">日期</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-right">注册</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-right">KYC完成</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-right">首次入金</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-right">首笔交易</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-right">注册→入金</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-right">入金→交易</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dailyData.map((d) => {
                const regToDeposit = Math.round((d.firstDeposit / d.registrations) * 100);
                const depositToTrade = Math.round((d.firstTrade / d.firstDeposit) * 100);
                return (
                  <tr key={d.date} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{d.date}</td>
                    <td className="px-4 py-3 text-sm text-right">{d.registrations}</td>
                    <td className="px-4 py-3 text-sm text-right">{d.kycCompleted}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-emerald-600">{d.firstDeposit}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-amber-600">{d.firstTrade}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={cn("text-xs font-medium", regToDeposit >= 35 ? "text-emerald-600" : "text-amber-600")}>
                        {regToDeposit}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={cn("text-xs font-medium", depositToTrade >= 70 ? "text-emerald-600" : "text-amber-600")}>
                        {depositToTrade}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">12,500</p>
              <p className="text-sm text-gray-500">总注册</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-violet-600">8,750</p>
              <p className="text-sm text-gray-500">KYC完成</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">4,200</p>
              <p className="text-sm text-gray-500">首次入金</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">3,150</p>
              <p className="text-sm text-gray-500">首笔交易</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
