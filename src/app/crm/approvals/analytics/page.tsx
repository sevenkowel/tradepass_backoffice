"use client";

/**
 * Approval Center — Analytics (v3)
 *
 * Implements PRD §26: Reporting & Analytics. Surfaces the six core
 * metrics — approval rate, reject rate, SLA compliance, avg handle
 * time, risk distribution, escalation rate — plus a per-reviewer
 * team performance table.
 *
 * Data source: `approvalService.getStats()` + `getTeamPerformance()`
 * (the same singletons the Inbox + Audit pages use). No new API.
 *
 * Implementation depth: read-only dashboard. Time-series charts are
 * stubbed with sparkline-shaped bars; real chart library integration
 * is deferred. See `docs/Approval-Center-v3-Architecture.md` §5.
 */

import { useEffect, useState } from "react";
import {
  CheckCircle2, XCircle, Clock, Gauge, TrendingUp, ArrowUpRight,
} from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, BadgeBase } from "@/components/crm/ui";
import type { ApprovalStats, TeamPerformance } from "@/types/approval";

interface StatsPayload {
  stats: ApprovalStats;
  team: TeamPerformance[];
  pendingCount: number;
  overdueCount: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/approvals/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d as StatsPayload);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "Approval Center" }, { label: "Analytics" }]} />
      <PageHeader
        title="Analytics"
        description="Approval throughput, SLA compliance, and team performance across the workflow engine"
      />

      {/* KPI tiles — PRD §26 metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Kpi
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          label="Approved today"
          value={data?.stats.todayApproved ?? 0}
          loading={loading}
        />
        <Kpi
          icon={<XCircle className="w-4 h-4 text-red-600" />}
          label="Rejected today"
          value={data?.stats.todayRejected ?? 0}
          loading={loading}
        />
        <Kpi
          icon={<Clock className="w-4 h-4 text-slate-500" />}
          label="Avg handle time"
          value={data?.stats.avgProcessingMinutes ?? 0}
          suffix="m"
          loading={loading}
        />
        <Kpi
          icon={<Gauge className="w-4 h-4 text-blue-600" />}
          label="SLA compliance"
          value={data?.stats.slaComplianceRate ?? 0}
          suffix="%"
          loading={loading}
          tone={
            data && data.stats.slaComplianceRate >= 95 ? "success" :
            data && data.stats.slaComplianceRate >= 80 ? "warning" :
            "error"
          }
        />
        <Kpi
          icon={<TrendingUp className="w-4 h-4 text-amber-600" />}
          label="Overdue rate"
          value={data?.stats.overdueRate ?? 0}
          suffix="%"
          loading={loading}
          tone={
            data && data.stats.overdueRate <= 5 ? "success" :
            data && data.stats.overdueRate <= 15 ? "warning" :
            "error"
          }
        />
        <Kpi
          icon={<ArrowUpRight className="w-4 h-4 text-orange-600" />}
          label="Escalation rate"
          value={data?.stats.escalationRate ?? 0}
          suffix="%"
          loading={loading}
        />
      </div>

      {/* Type breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card padding="none">
          <CardHeader title="Volume by task type" subtitle="active tasks" />
          <div className="p-4 space-y-2">
            {data ? (
              Object.entries(data.stats.typeBreakdown).map(([type, count]) => (
                <BarRow key={type} label={type.replace(/_/g, " ")} value={count as number} max={Math.max(...Object.values(data.stats.typeBreakdown).map(Number))} />
              ))
            ) : (
              <SkeletonRows />
            )}
          </div>
        </Card>

        <Card padding="none">
          <CardHeader title="Risk distribution" subtitle="across all tasks" />
          <div className="p-4 space-y-2">
            {data ? (
              Object.entries(data.stats.riskBreakdown).map(([level, count]) => (
                <BarRow
                  key={level}
                  label={level}
                  value={count as number}
                  max={Math.max(...Object.values(data.stats.riskBreakdown).map(Number))}
                  tone={
                    level === "critical" ? "error" :
                    level === "high"     ? "warning" :
                    level === "medium"   ? "info" :
                    "success"
                  }
                />
              ))
            ) : (
              <SkeletonRows />
            )}
          </div>
        </Card>
      </div>

      {/* Team performance */}
      <Card padding="none">
        <CardHeader title="Team performance" subtitle="active reviewers" />
        {loading || !data ? (
          <div className="p-4">
            <SkeletonRows />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-2 text-left">Reviewer</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-right">Total Processed</th>
                <th className="px-4 py-2 text-right">Approved</th>
                <th className="px-4 py-2 text-right">Rejected</th>
                <th className="px-4 py-2 text-right">Avg Time</th>
                <th className="px-4 py-2 text-right">SLA Compliance</th>
                <th className="px-4 py-2 text-right">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.team.map((m) => (
                <tr key={m.reviewerId} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5">
                    <span className="text-sm font-medium text-slate-900">{m.reviewerName}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs text-slate-500 capitalize">{m.role.replace(/_/g, " ")}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-900 font-medium">{m.totalProcessed}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700">{m.approvedCount}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-red-700">{m.rejectedCount}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{m.avgProcessingMinutes}m</td>
                  <td className="px-4 py-2.5 text-right">
                    <BadgeBase
                      tone={m.slaComplianceRate >= 95 ? "success" : m.slaComplianceRate >= 80 ? "warning" : "error"}
                      size="sm"
                    >
                      {m.slaComplianceRate}%
                    </BadgeBase>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{m.activeTasks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */

function Kpi({
  icon, label, value, suffix, loading, tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  loading: boolean;
  tone?: "success" | "warning" | "error";
}) {
  const accent =
    tone === "error"   ? "border-red-100" :
    tone === "warning" ? "border-amber-100" :
    tone === "success" ? "border-emerald-100" :
    "border-slate-200";

  return (
    <Card className={`!p-3 hover:shadow-md transition-shadow ${accent}`}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500 truncate">{label}</p>
          <p className="text-xl font-semibold text-slate-900 tabular-nums leading-tight mt-0.5">
            {loading ? (
              <span className="inline-block w-10 h-5 bg-slate-100 rounded animate-pulse" />
            ) : (
              <>
                {value}
                {suffix && <span className="text-sm font-medium text-slate-400 ml-0.5">{suffix}</span>}
              </>
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {subtitle && (
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
          {subtitle}
        </span>
      )}
    </div>
  );
}

function BarRow({
  label, value, max, tone = "info",
}: {
  label: string;
  value: number;
  max: number;
  tone?: "success" | "warning" | "error" | "info";
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const fill =
    tone === "error"   ? "bg-red-500" :
    tone === "warning" ? "bg-orange-500" :
    tone === "success" ? "bg-emerald-500" :
    "bg-blue-500";

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-32 capitalize text-slate-600 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
      <span className="w-10 text-right tabular-nums font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />
      ))}
    </div>
  );
}
