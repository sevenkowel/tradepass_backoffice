"use client";

/**
 * CLM Workspace — operator's personal "what's on my plate" page.
 *
 * Scope after the 2026-05-10 refactor:
 *   - 3 personal KPI tiles (My Pending / My Near-Timeout / My Escalated)
 *   - My Tasks list (Pending + Near-Timeout, filterable)
 *   - Risk Alerts (top 3-5 cross-case red flags)
 *
 * Removed (as redundant with neighbouring pages):
 *   - Macro KPIs (Approval Rate / Avg Time / Auto Rate) → live in
 *     SLA & Monitoring, which is the team-wide dashboard.
 *   - Queue Summary table → Review Queue is the canonical queue view.
 *   - Recent Activity feed → Audit Trail is the canonical history.
 *
 * The page now answers a single question: "what should I do next?"
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Inbox,
  Clock,
  ArrowUpRight,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import { Card, PageHeader } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { workspaceService, caseService } from "@/lib/clm/services";
import { RiskBadge } from "@/components/crm/ui/RiskBadge";
import { SLABadge } from "@/components/crm/ui/SLABadge";
import { CaseTypeBadge } from "@/components/crm/ui/CaseTypeBadge";
import type { CLMCase, RiskAlert } from "@/types/clm";
import { useCurrentStaffId, useCurrentStaffName } from "@/hooks/useCurrentStaff";

type TaskFilter = "pending" | "near_timeout" | "escalated";

export default function WorkspacePage() {
  const staffId = useCurrentStaffId();
  const staffName = useCurrentStaffName();

  const [myTasks, setMyTasks] = useState<CLMCase[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskFilter>("pending");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasks, alerts] = await Promise.all([
        caseService.getMyTasks(staffId),
        workspaceService.getRiskAlerts(),
      ]);
      setMyTasks(tasks);
      setRiskAlerts(alerts);
    } catch (err) {
      console.error("Workspace fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Personal KPIs derived from myTasks (single source, no duplicate fetch)
  const counts = useMemo(() => {
    const pending = myTasks.filter((t) => t.status === "pending" || t.status === "reviewing").length;
    const nearTimeout = myTasks.filter(
      (t) => t.slaStatus === "near_timeout" || t.slaStatus === "timeout"
    ).length;
    const escalated = myTasks.filter((t) => t.status === "escalated").length;
    return { pending, nearTimeout, escalated, total: myTasks.length };
  }, [myTasks]);

  const filteredTasks = useMemo(() => {
    return myTasks.filter((t) => {
      switch (filter) {
        case "pending":
          return t.status === "pending" || t.status === "reviewing";
        case "near_timeout":
          return t.slaStatus === "near_timeout" || t.slaStatus === "timeout";
        case "escalated":
          return t.status === "escalated";
        default:
          return true;
      }
    });
  }, [myTasks, filter]);

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "Workspace" }]} />
      <PageHeader
        title="Workspace"
        description={`Hello ${staffName} — ${counts.total} active task${counts.total === 1 ? "" : "s"} on your plate`}
      />

      {/* Personal KPIs — only what the current operator owns */}
      <div className="grid grid-cols-3 gap-3">
        <PersonalKPI
          icon={<Inbox className="w-4 h-4 text-primary" />}
          label="My Pending"
          value={counts.pending}
          loading={loading}
          href="/crm/clm/review-queue?assignee=me"
          tone="primary"
        />
        <PersonalKPI
          icon={<Clock className="w-4 h-4 text-red-600" />}
          label="Near Timeout / Overdue"
          value={counts.nearTimeout}
          loading={loading}
          href="/crm/clm/review-queue?assignee=me&slaStatus=near_timeout"
          tone="error"
        />
        <PersonalKPI
          icon={<ArrowUpRight className="w-4 h-4 text-orange-600" />}
          label="Escalated"
          value={counts.escalated}
          loading={loading}
          href="/crm/clm/review-queue?assignee=me&status=escalated"
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* My Tasks (col-span-2) */}
        <Card padding="none" className="lg:col-span-2">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">My Tasks</h3>
            <Link
              href="/crm/clm/review-queue"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Open Review Queue
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex gap-1 px-4 py-2 border-b border-slate-200 bg-slate-50/50">
            {(
              [
                { key: "pending" as const, label: "Active", count: counts.pending },
                { key: "near_timeout" as const, label: "Near Timeout", count: counts.nearTimeout },
                { key: "escalated" as const, label: "Escalated", count: counts.escalated },
              ]
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  filter === tab.key
                    ? "bg-white text-primary shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
                <span
                  className={`min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[10px] font-semibold tabular-nums ${
                    filter === tab.key ? "bg-blue-100 text-primary" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400">
              Nothing in this bucket. Nice work.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTasks.slice(0, 8).map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
              {filteredTasks.length > 8 && (
                <div className="px-4 py-2 text-center bg-slate-50/50">
                  <Link
                    href={`/crm/clm/review-queue?assignee=me`}
                    className="text-xs text-primary hover:underline"
                  >
                    + {filteredTasks.length - 8} more in Review Queue
                  </Link>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Risk Alerts */}
        <Card padding="none">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-semibold text-slate-900">Risk Alerts</h3>
            <span className="text-[10px] font-medium text-slate-400 ml-auto uppercase tracking-wider">
              cross-case
            </span>
          </div>
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : riskAlerts.length === 0 ? (
            <div className="text-center py-10 text-sm text-slate-400">No risk alerts right now.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {riskAlerts.slice(0, 5).map((alert) => (
                <RiskAlertRow key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Bits ────────────────────────────────────────────────────────

function PersonalKPI({
  icon,
  label,
  value,
  loading,
  href,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading: boolean;
  href?: string;
  tone: "primary" | "error" | "warning";
}) {
  const accent =
    tone === "error" ? "border-red-100" :
    tone === "warning" ? "border-amber-100" :
    "border-slate-200";

  const content = (
    <Card className={`!p-3 hover:shadow-md transition-shadow ${accent}`}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500 truncate">{label}</p>
          <p className="text-xl font-semibold text-slate-900 tabular-nums leading-tight mt-0.5">
            {loading ? <span className="inline-block w-6 h-5 bg-slate-100 rounded animate-pulse" /> : value}
          </p>
        </div>
      </div>
    </Card>
  );

  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

function TaskRow({ task }: { task: CLMCase }) {
  return (
    <Link
      href={`/crm/clm/cases/${task.id}`}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors group"
    >
      <span className="font-mono tabular-nums text-xs text-primary w-16 flex-shrink-0">
        {task.caseNo}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 truncate">{task.customerName}</p>
        <p className="text-xs text-slate-400 truncate">{task.country} · {task.triggerSource}</p>
      </div>
      <CaseTypeBadge type={task.type} />
      <RiskBadge level={task.riskLevel} />
      <SLABadge status={task.slaStatus} />
      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
    </Link>
  );
}

function RiskAlertRow({ alert }: { alert: RiskAlert }) {
  const isCritical = alert.severity === "critical";
  return (
    <Link
      href={`/crm/clm/cases/${alert.caseId}`}
      className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors group"
    >
      <AlertTriangle
        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
          isCritical ? "text-red-500" : "text-amber-500"
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 truncate">{alert.title}</p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{alert.description}</p>
        <p className="text-[11px] text-slate-400 mt-1 truncate">
          {alert.customerName}
        </p>
      </div>
    </Link>
  );
}
