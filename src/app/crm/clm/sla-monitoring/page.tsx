"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Inbox,
  Clock,
  Timer,
  TrendingUp,
  AlertTriangle,
  Bot,
  Eye,
  BarChart3,
} from "lucide-react";
import { Card, PageHeader } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { workspaceService } from "@/lib/clm/services";
import { caseService } from "@/lib/clm/services";
import type { CLMCase } from "@/types/clm";

export default function SLAMonitoringPage() {
  const [cases, setCases] = useState<CLMCase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await caseService.list({ page: 1, pageSize: 100 });
      setCases(result.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const pending = cases.filter((c) => ["pending", "reviewing"].includes(c.status)).length;
    const timeout = cases.filter((c) => c.slaStatus === "timeout").length;
    const nearTimeout = cases.filter((c) => c.slaStatus === "near_timeout").length;
    const approved = cases.filter((c) => ["approved", "auto_approved"].includes(c.status)).length;
    const rejected = cases.filter((c) => ["rejected", "auto_rejected"].includes(c.status)).length;
    const autoReviewed = cases.filter((c) => ["auto_approved", "auto_rejected"].includes(c.status)).length;
    const autoRate = cases.length > 0 ? Math.round((autoReviewed / cases.length) * 100) : 0;
    const slaRate = cases.length > 0
      ? Math.round(((cases.length - timeout) / cases.length) * 100)
      : 100;

    return { pending, timeout, nearTimeout, approved, rejected, autoRate, slaRate };
  }, [cases]);

  const queueBacklog = useMemo(() => {
    const queues = [
      { name: "KYC", types: ["kyc"] },
      { name: "POA", types: ["poa"] },
      { name: "AML", types: ["manual_review", "edd"] },
      { name: "Video", types: ["video_verification", "liveness"] },
      { name: "Withdrawal", types: ["withdrawal_review"] },
      { name: "Risk", types: ["risk_recheck"] },
    ];

    return queues.map((q) => {
      const queueCases = cases.filter((c) => q.types.includes(c.type));
      const pending = queueCases.filter((c) => ["pending", "reviewing"].includes(c.status)).length;
      const timeout = queueCases.filter((c) => c.slaStatus === "timeout").length;
      const avgTime = pending > 0 ? Math.floor(Math.random() * 10 + 3) : 0;
      return { name: q.name, pending, timeout, avgTime };
    });
  }, [cases]);

  const reviewerStats = useMemo(() => [
    { name: "Admin A", throughput: 120, approvalRate: 84, avgTime: 3, timeout: 2 },
    { name: "Admin B", throughput: 96, approvalRate: 79, avgTime: 5, timeout: 4 },
    { name: "Senior Reviewer", throughput: 45, approvalRate: 72, avgTime: 8, timeout: 1 },
  ], []);

  const automationStats = useMemo(() => [
    { label: "Auto Review Rate", value: `${stats.autoRate}%`, icon: <Bot className="w-5 h-5 text-cyan-600" /> },
    { label: "Auto Approval", value: "68%", icon: <TrendingUp className="w-5 h-5 text-emerald-600" /> },
    { label: "Auto Rejection", value: "12%", icon: <AlertTriangle className="w-5 h-5 text-red-600" /> },
    { label: "Manual Fallback", value: "20%", icon: <Eye className="w-5 h-5 text-amber-600" /> },
    { label: "OCR Success", value: "91%", icon: <BarChart3 className="w-5 h-5 text-blue-600" /> },
    { label: "AML Fail Rate", value: "2%", icon: <AlertTriangle className="w-5 h-5 text-orange-600" /> },
  ], [stats.autoRate]);

  const alerts = useMemo(() => [
    { type: "sla_timeout", message: "KYC-00123 exceeded 30min SLA", severity: "critical" as const },
    { type: "queue_overload", message: "AML queue积压超过 20 个 Case", severity: "warning" as const },
    { type: "aml_spike", message: "AML 命中数异常升高: 今日 6 例", severity: "warning" as const },
    { type: "auto_review_failure", message: "自动审核失败率超过阈值 5%", severity: "warning" as const },
    { type: "high_risk", message: "Critical Case 创建: EDD-00113", severity: "critical" as const },
  ], []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="SLA & Monitoring" description="Loading..." />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="!p-4 h-24 animate-pulse bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "SLA & Monitoring" }]} />
      <PageHeader
        title="SLA & Monitoring"
        description="Review operations and performance monitoring"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard icon={<Inbox className="w-5 h-5 text-blue-600" />} label="Pending Cases" value={stats.pending} />
        <MetricCard icon={<Clock className="w-5 h-5 text-red-600" />} label="Timeout Cases" value={stats.timeout} alert />
        <MetricCard icon={<Timer className="w-5 h-5 text-amber-600" />} label="Near Timeout" value={stats.nearTimeout} />
        <MetricCard icon={<TrendingUp className="w-5 h-5 text-emerald-600" />} label="SLA Rate" value={`${stats.slaRate}%`} />
        <MetricCard icon={<Bot className="w-5 h-5 text-cyan-600" />} label="Auto Review" value={`${stats.autoRate}%`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Queue Backlog */}
        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Queue Backlog</h3>
          <div className="space-y-3">
            {queueBacklog.map((queue) => (
              <div key={queue.name} className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 w-24">{queue.name}</span>
                <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-lg transition-all"
                    style={{ width: `${Math.min(100, (queue.pending / 20) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-900 w-10 text-right">{queue.pending}</span>
                <span className="text-xs text-red-600 w-10 text-right">{queue.timeout > 0 ? `${queue.timeout}` : "—"}</span>
                <span className="text-xs text-gray-400 w-14 text-right">{queue.avgTime > 0 ? `${queue.avgTime}m` : "—"}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-400 border-t border-gray-100 pt-2">
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded" /> Pending</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded" /> Timeout</span>
            <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> Avg Time</span>
          </div>
        </Card>

        {/* Automation Health */}
        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Automation Health</h3>
          <div className="grid grid-cols-2 gap-3">
            {automationStats.map((stat) => (
              <div key={stat.label} className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  {stat.icon}
                  <span className="text-xs text-gray-500">{stat.label}</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Reviewer Performance */}
      <Card>
        <h3 className="text-base font-semibold text-gray-900 mb-4">Reviewer Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Reviewer</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Throughput</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Approval Rate</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Avg Time</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Timeout</th>
              </tr>
            </thead>
            <tbody>
              {reviewerStats.map((r) => (
                <tr key={r.name} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium text-gray-900">{r.name}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700">{r.throughput}/day</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`font-medium ${r.approvalRate >= 80 ? "text-emerald-600" : "text-amber-600"}`}>
                      {r.approvalRate}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-gray-700">{r.avgTime}m</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={r.timeout > 3 ? "text-red-600 font-medium" : "text-gray-600"}>
                      {r.timeout}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Alerts */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="text-base font-semibold text-gray-900">Alerts</h3>
        </div>
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl ${
                alert.severity === "critical" ? "bg-red-50" : "bg-amber-50"
              }`}
            >
              <AlertTriangle
                className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  alert.severity === "critical" ? "text-red-500" : "text-amber-500"
                }`}
              />
              <p className={`text-sm ${alert.severity === "critical" ? "text-red-700" : "text-amber-700"}`}>
                {alert.message}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  alert,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  alert?: boolean;
}) {
  return (
    <Card className={`!p-4 ${alert ? "border-red-200" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-xl font-bold ${alert ? "text-red-600" : "text-gray-900"}`}>{value}</p>
        </div>
      </div>
    </Card>
  );
}
