"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Inbox,
  Clock,
  AlertTriangle,
  CheckCircle,
  Timer,
  Bot,
  ArrowRight,
  ShieldAlert,
  Users,
  Activity,
} from "lucide-react";
import { Card, PageHeader } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { workspaceService } from "@/lib/clm/services";
import { caseService } from "@/lib/clm/services";
import { RiskBadge } from "@/components/crm/ui/RiskBadge";
import { SLABadge } from "@/components/crm/ui/SLABadge";
import { CaseTypeBadge } from "@/components/crm/ui/CaseTypeBadge";
import type { WorkspaceData, CLMCase, RiskAlert } from "@/types/clm";

export default function WorkspacePage() {
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "in_progress" | "near_timeout" | "escalated" | "returned">("pending");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboard, myTasks] = await Promise.all([
        workspaceService.getDashboard(),
        caseService.getMyTasks("staff-001"),
      ]);
      setData({ ...dashboard, myTasks });
    } catch (err) {
      console.error("Workspace fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTasks = data?.myTasks.filter((task) => {
    switch (activeTab) {
      case "pending": return task.status === "pending";
      case "in_progress": return task.status === "reviewing";
      case "near_timeout": return task.slaStatus === "near_timeout" || task.slaStatus === "timeout";
      case "escalated": return task.status === "escalated";
      case "returned": return task.status === "resubmission";
      default: return true;
    }
  }) || [];

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Workspace" description="Loading..." />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="!p-4 h-24 animate-pulse bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "Workspace" }]} />
      <PageHeader
        title="Workspace"
        description="Your compliance review dashboard"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          icon={<Inbox className="w-5 h-5 text-blue-600" />}
          label="Pending Reviews"
          value={data.kpi.pendingReviews}
          href="/crm/clm/review-queue"
        />
        <KPICard
          icon={<Clock className="w-5 h-5 text-red-600" />}
          label="Timeout Cases"
          value={data.kpi.timeoutCases}
          href="/crm/clm/review-queue?sla=timeout"
          alert
        />
        <KPICard
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          label="AML Hits"
          value={data.kpi.amlHits}
          href="/crm/clm/review-queue?aml=hit"
        />
        <KPICard
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
          label="Approval Rate"
          value={`${data.kpi.approvalRateToday}%`}
        />
        <KPICard
          icon={<Timer className="w-5 h-5 text-purple-600" />}
          label="Avg Review Time"
          value={`${data.kpi.avgReviewTimeMinutes}m`}
        />
        <KPICard
          icon={<Bot className="w-5 h-5 text-cyan-600" />}
          label="Auto Review Rate"
          value={`${data.kpi.autoReviewRate}%`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Queue Summary */}
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Queue Summary</h3>
            <Link
              href="/crm/clm/review-queue"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {data.queueSummary.map((queue) => (
              <QueueSummaryRow key={queue.queue} queue={queue} />
            ))}
          </div>
        </Card>

        {/* Risk Alerts */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h3 className="text-base font-semibold text-gray-900">Risk Alerts</h3>
          </div>
          <div className="space-y-3">
            {data.riskAlerts.map((alert) => (
              <RiskAlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </Card>
      </div>

      {/* My Tasks */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">My Tasks</h3>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {data.myTasks.length}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-gray-100 pb-2">
          {([
            { key: "pending", label: "Pending" },
            { key: "in_progress", label: "In Progress" },
            { key: "near_timeout", label: "Near Timeout" },
            { key: "escalated", label: "Escalated" },
            { key: "returned", label: "Returned" },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.key
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No tasks in this category</div>
          ) : (
            filteredTasks.map((task) => <TaskRow key={task.id} task={task} />)
          )}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-gray-600" />
          <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {data.recentActivity.slice(0, 5).map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 text-sm">
              <span className="text-gray-500 w-20 text-xs">
                {new Date(activity.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="font-medium text-gray-900">{activity.actor}</span>
              <span className="text-gray-500">{activity.action}</span>
              <Link
                href={`/crm/clm/cases/${activity.caseNo.toLowerCase().replace(/-/g, "-")}`}
                className="text-blue-600 hover:underline font-mono text-xs"
              >
                {activity.caseNo}
              </Link>
              <span className="text-gray-400 ml-auto">{activity.customerName}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function KPICard({
  icon,
  label,
  value,
  href,
  alert,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  href?: string;
  alert?: boolean;
}) {
  const content = (
    <Card className={`!p-4 ${alert ? "border-red-200" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-xl font-bold ${alert ? "text-red-600" : "text-gray-900"}`}>{value}</p>
        </div>
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }
  return content;
}

function QueueSummaryRow({ queue }: { queue: import("@/types/clm").QueueSummaryItem }) {
  const priorityColors = {
    low: "bg-gray-100 text-gray-600",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-amber-100 text-amber-700",
    critical: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <CaseTypeBadge type={queue.caseType} />
        <span className="text-sm font-medium text-gray-900">{queue.queue}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[queue.priority]}`}>
          {queue.priority}
        </span>
        <span className="text-lg font-bold text-gray-900 w-10 text-right">{queue.count}</span>
      </div>
    </div>
  );
}

function RiskAlertCard({ alert }: { alert: RiskAlert }) {
  return (
    <Link
      href={`/crm/clm/cases/${alert.caseId}`}
      className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
    >
      <AlertTriangle
        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
          alert.severity === "critical" ? "text-red-500" : "text-amber-500"
        }`}
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{alert.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{alert.description}</p>
        <p className="text-xs text-gray-400 mt-1">{alert.customerName}</p>
      </div>
    </Link>
  );
}

function TaskRow({ task }: { task: CLMCase }) {
  return (
    <Link
      href={`/crm/clm/cases/${task.id}`}
      className="flex items-center gap-4 py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="flex-1 min-w-0 grid grid-cols-6 gap-4 items-center">
        <span className="text-sm font-mono text-blue-600">{task.caseNo}</span>
        <span className="text-sm text-gray-900 truncate">{task.customerName}</span>
        <CaseTypeBadge type={task.type} />
        <RiskBadge level={task.riskLevel} />
        <SLABadge status={task.slaStatus} />
        <span className="text-xs text-gray-400">
          {task.assigneeName || "Unassigned"}
        </span>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-300" />
    </Link>
  );
}
