"use client";

/**
 * Follow-ups — 全平台待跟进任务清单 (Phase 3).
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ListChecks, AlertTriangle, CheckCircle2, Clock, Circle, X,
  ChevronRight,
} from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { PageHeader, Card } from "@/components/crm/ui";
import { generateFollowups, type FollowupTask, type FollowupStatus } from "@/lib/crm/mock-collaboration";

const STATUS_META: Record<FollowupStatus, { label: string; color: string; icon: typeof Circle }> = {
  open:        { label: "待处理", color: "text-slate-700 bg-slate-100", icon: Circle },
  in_progress: { label: "进行中", color: "text-blue-700 bg-blue-100",   icon: Clock },
  done:        { label: "已完成", color: "text-emerald-700 bg-emerald-100", icon: CheckCircle2 },
  overdue:     { label: "已逾期", color: "text-red-700 bg-red-100",     icon: AlertTriangle },
};

const PRIORITY_META = {
  low:    { label: "低",   color: "text-slate-500" },
  medium: { label: "中",   color: "text-blue-700" },
  high:   { label: "高",   color: "text-amber-700" },
  urgent: { label: "紧急", color: "text-red-700 font-bold" },
};

// 假设当前用户
const CURRENT_STAFF_ID = "staff-001";

export default function FollowupsPage() {
  const [filter, setFilter] = useState<"all" | "mine" | "today" | "overdue">("all");
  const followups = useMemo(() => generateFollowups(), []);

  const filtered = useMemo(() => {
    if (filter === "all") return followups;
    if (filter === "mine") return followups.filter((f) => f.assigneeId === CURRENT_STAFF_ID);
    if (filter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return followups.filter((f) => {
        const due = new Date(f.dueAt);
        return due >= today && due < tomorrow;
      });
    }
    if (filter === "overdue") return followups.filter((f) => f.status === "overdue" || (f.status !== "done" && new Date(f.dueAt) < new Date()));
    return followups;
  }, [followups, filter]);

  const stats = useMemo(() => ({
    total: followups.length,
    mine: followups.filter((f) => f.assigneeId === CURRENT_STAFF_ID).length,
    open: followups.filter((f) => f.status === "open" || f.status === "in_progress").length,
    done: followups.filter((f) => f.status === "done").length,
    overdue: followups.filter((f) => f.status === "overdue").length,
  }), [followups]);

  return (
    <>
      <Breadcrumb items={[{ label: "Clients", href: "/crm/clients" }, { label: "跟进任务" }]} />
      <PageHeader title="跟进任务" description="所有客户跟进任务的全局视图 — 我的 / 今日 / 逾期" />

      <div className="grid grid-cols-5 gap-3 mb-4">
        <StatCard label="总数"    value={stats.total} />
        <StatCard label="我的"    value={stats.mine}    tone="info" />
        <StatCard label="待处理"  value={stats.open}    tone="warn" />
        <StatCard label="已完成"  value={stats.done}    tone="ok" />
        <StatCard label="已逾期"  value={stats.overdue} tone="danger" />
      </div>

      <div className="flex items-center gap-2 mb-3">
        {([
          ["all",     "全部",    stats.total],
          ["mine",    "我的",    stats.mine],
          ["today",   "今日",    followups.filter((f) => {
            const t = new Date(); t.setHours(0,0,0,0);
            const tm = new Date(t); tm.setDate(tm.getDate()+1);
            const d = new Date(f.dueAt);
            return d >= t && d < tm;
          }).length],
          ["overdue", "已逾期",  stats.overdue],
        ] as const).map(([k, label, count]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`px-3 h-7 rounded-md text-xs font-medium border inline-flex items-center gap-1.5 ${
              filter === k ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {label}
            <span className={`text-[10px] tabular-nums ${filter === k ? "opacity-80" : "text-slate-400"}`}>{count}</span>
          </button>
        ))}
      </div>

      <Card padding="none">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-2 w-8"></th>
              <th className="px-4 py-2">任务</th>
              <th className="px-4 py-2">客户</th>
              <th className="px-4 py-2 w-24">优先级</th>
              <th className="px-4 py-2">负责人</th>
              <th className="px-4 py-2 w-32">截止时间</th>
              <th className="px-4 py-2 w-24">状态</th>
              <th className="px-4 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((f) => {
              const statusMeta = STATUS_META[f.status];
              const SIcon = statusMeta.icon;
              const dueDate = new Date(f.dueAt);
              const isOverdue = f.status !== "done" && dueDate < new Date();
              return (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <input type="checkbox" defaultChecked={f.status === "done"} className="rounded" />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="text-sm font-medium text-slate-800">{f.title}</div>
                    {f.sourceName && (
                      <div className="text-[10px] text-slate-400">来源: {f.sourceName}</div>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/crm/clients/${f.clientId}`} className="text-sm text-primary hover:underline">
                      {f.clientName}
                    </Link>
                    <div className="text-[10px] text-slate-400 font-mono">{f.clientUid}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs ${PRIORITY_META[f.priority].color}`}>
                      {PRIORITY_META[f.priority].label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-slate-700">{f.assigneeName}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs tabular-nums ${isOverdue ? "text-red-700 font-bold" : "text-slate-600"}`}>
                      {dueDate.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] ${statusMeta.color}`}>
                      <SIcon className="w-3 h-3" />
                      {statusMeta.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-slate-400">无任务</p>
        )}
      </Card>
    </>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "info" | "warn" | "ok" | "danger" }) {
  const cls = tone === "warn" ? "text-amber-700"
    : tone === "ok" ? "text-emerald-700"
    : tone === "danger" ? "text-red-700"
    : tone === "info" ? "text-blue-700"
    : "text-slate-900";
  return (
    <Card className="!p-3">
      <p className="text-[10.5px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${cls}`}>{value}</p>
    </Card>
  );
}
