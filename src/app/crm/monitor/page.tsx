"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Users,
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Server,
  Zap,
  Globe,
} from "lucide-react";
import { Card, PageHeader } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { cn } from "@/lib/utils";

// Types
interface LiveMetric {
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface SystemStatus {
  name: string;
  status: "healthy" | "warning" | "critical";
  latency: number;
  uptime: string;
}

export default function MonitorPage() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const metrics: LiveMetric[] = [
    { label: "在线用户", value: "1,247", change: +12, icon: <Users className="w-5 h-5" />, color: "text-blue-600", bgColor: "bg-blue-100" },
    { label: "活跃订单", value: "3,892", change: +5, icon: <BarChart3 className="w-5 h-5" />, color: "text-violet-600", bgColor: "bg-violet-100" },
    { label: "今日入金", value: "$128,450", change: +23, icon: <DollarSign className="w-5 h-5" />, color: "text-emerald-600", bgColor: "bg-emerald-100" },
    { label: "今日出金", value: "$45,200", change: -8, icon: <DollarSign className="w-5 h-5" />, color: "text-amber-600", bgColor: "bg-amber-100" },
    { label: "实时交易量", value: "2,156 lot", change: +18, icon: <Zap className="w-5 h-5" />, color: "text-pink-600", bgColor: "bg-pink-100" },
    { label: "新注册", value: "89", change: +34, icon: <Globe className="w-5 h-5" />, color: "text-cyan-600", bgColor: "bg-cyan-100" },
  ];

  const systems: SystemStatus[] = [
    { name: "Web Server", status: "healthy", latency: 45, uptime: "99.99%" },
    { name: "MT5 Gateway", status: "healthy", latency: 120, uptime: "99.95%" },
    { name: "Payment Gateway", status: "healthy", latency: 200, uptime: "99.90%" },
    { name: "KYC Service", status: "warning", latency: 850, uptime: "98.50%" },
    { name: "Notification Queue", status: "healthy", latency: 30, uptime: "99.99%" },
    { name: "Database Primary", status: "healthy", latency: 15, uptime: "99.99%" },
  ];

  const recentActivities = [
    { time: "14:32:05", event: "用户 USR-8823 完成入金 $5,000", type: "deposit" },
    { time: "14:31:22", event: "新用户注册: emma.w@email.com", type: "register" },
    { time: "14:30:45", event: "订单 ORD-9921 已执行", type: "trade" },
    { time: "14:29:10", event: "风控告警: 大额入金触发审核", type: "risk" },
    { time: "14:28:33", event: "用户 USR-4401 请求出金 $2,000", type: "withdrawal" },
    { time: "14:27:15", event: "MT5 连接恢复", type: "system" },
    { time: "14:26:00", event: "KYC 审核通过: USR-5502", type: "kyc" },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Dashboard" }, { label: "实时监控" }]} />

      <PageHeader
        title="实时监控"
        description="系统运行状态和业务数据实时看板"
      />

      {/* Clock */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>{now.toLocaleString("zh-CN")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-emerald-600 font-medium">系统正常运行</span>
        </div>
      </div>

      {/* Live Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {metrics.map((m) => (
          <Card key={m.label} className="!p-4">
            <div className="flex items-start justify-between">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", m.bgColor)}>
                <div className={m.color}>{m.icon}</div>
              </div>
              <div className={cn("flex items-center gap-1 text-xs font-medium", m.change >= 0 ? "text-emerald-600" : "text-red-600")}>
                {m.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(m.change)}%
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold">{m.value}</p>
              <p className="text-sm text-gray-500">{m.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card className="!p-6">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold">系统状态</h3>
          </div>
          <div className="space-y-3">
            {systems.map((s) => (
              <div key={s.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", s.status === "healthy" ? "bg-emerald-500" : s.status === "warning" ? "bg-amber-500" : "bg-red-500")} />
                  <span className="text-sm font-medium">{s.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500">{s.latency}ms</span>
                  <span className="text-gray-500">{s.uptime}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="!p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold">实时活动</h3>
          </div>
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {recentActivities.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-400 font-mono shrink-0 w-16">{a.time}</span>
                <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0",
                  a.type === "deposit" ? "bg-emerald-500" :
                  a.type === "withdrawal" ? "bg-amber-500" :
                  a.type === "trade" ? "bg-blue-500" :
                  a.type === "risk" ? "bg-red-500" :
                  a.type === "register" ? "bg-violet-500" :
                  "bg-gray-400"
                )} />
                <span className="text-sm">{a.event}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
