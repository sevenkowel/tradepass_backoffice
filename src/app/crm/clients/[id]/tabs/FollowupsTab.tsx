"use client";

/**
 * FollowupsTab — 跟进任务 (P1, 2026-05-15).
 *
 * Sales / CS 团队对该客户的待办跟进任务：电话回访 / 邮件跟进 / VIP 升级
 * 调研 / 流失挽回 等。带优先级、到期时间、负责人。
 */

import { useMemo, useState } from "react";
import {
  CheckCircle2, Clock, AlertCircle, Plus, User,
} from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";
import { seededRng, rngHelpers, timeAgo } from "./_shared/mock-prng";

// Date.now() 在模块作用域里 ok（不在 render 期间）。
function isOverdueIso(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}
function daysFromNow(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400_000);
}

type Priority = "low" | "medium" | "high" | "urgent";
type FollowupStatus = "todo" | "in_progress" | "done" | "cancelled";
type FollowupKind = "call" | "email" | "meeting" | "kyc_followup" | "deposit_followup" | "vip_research" | "churn_recovery";

interface Followup {
  id: string;
  kind: FollowupKind;
  title: string;
  description: string;
  priority: Priority;
  status: FollowupStatus;
  assignedTo: string;
  dueAt: string;
  createdAt: string;
  completedAt?: string;
}

const KIND_LABEL: Record<FollowupKind, string> = {
  call:             "电话回访",
  email:            "邮件跟进",
  meeting:          "线下会议",
  kyc_followup:     "KYC 跟进",
  deposit_followup: "入金跟进",
  vip_research:     "VIP 升级调研",
  churn_recovery:   "流失挽回",
};

const PRIORITY_LABEL: Record<Priority, string> = {
  low: "低", medium: "中", high: "高", urgent: "紧急",
};

const PRIORITY_TONE: Record<Priority, string> = {
  low:    "bg-slate-50 text-slate-700 border-slate-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  high:   "bg-amber-50 text-amber-700 border-amber-200",
  urgent: "bg-red-50 text-red-700 border-red-200",
};

const STAFF = ["Alice Chen", "Bob Martin", "Carol Wong", "David Liu"];
const TITLES: { kind: FollowupKind; title: string; desc: string }[] = [
  { kind: "call",             title: "电话回访客户",        desc: "首次入金后 24h 内回访，确认体验" },
  { kind: "email",            title: "发送月度报表",         desc: "Q1 交易报表与税单" },
  { kind: "kyc_followup",     title: "催促客户更新护照",     desc: "护照将在 30 天内到期" },
  { kind: "deposit_followup", title: "跟进未完成入金",       desc: "客户发起入金后 48h 未到账，跟进银行渠道" },
  { kind: "vip_research",     title: "评估 VIP 升级资格",    desc: "客户净存款达 $50k，研究是否符合 VIP" },
  { kind: "churn_recovery",   title: "流失客户挽回",         desc: "客户 30 天未登录，发送营销邮件 + 电话" },
  { kind: "meeting",          title: "线下交易策略沟通",     desc: "VIP 客户线下会议，介绍新产品" },
];

function generateMockFollowups(userId: string): Followup[] {
  const r = seededRng(`${userId}:followups`);
  const h = rngHelpers(r);
  const count = h.int(3, 12);
  const out: Followup[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const tpl = h.pick(TITLES);
    const status: FollowupStatus = h.weighted([
      ["todo", 35], ["in_progress", 25], ["done", 30], ["cancelled", 10],
    ]);
    const priority: Priority = h.weighted([
      ["low", 25], ["medium", 40], ["high", 25], ["urgent", 10],
    ]);
    const createdAt = new Date(now - h.int(1, 60) * 86400_000).toISOString();
    const dueOffset = h.int(-30, 30) * 86400_000;
    const dueAt = new Date(now + dueOffset).toISOString();
    const done = status === "done" || status === "cancelled";

    out.push({
      id: `fu_${userId.slice(-6)}_${i}`,
      kind: tpl.kind,
      title: tpl.title,
      description: tpl.desc,
      priority,
      status,
      assignedTo: h.pick(STAFF),
      dueAt,
      createdAt,
      completedAt: done ? new Date(now - h.int(0, 14) * 86400_000).toISOString() : undefined,
    });
  }

  // 排序：未完成在前（按 due 升序），已完成在后
  return out.sort((a, b) => {
    const aActive = a.status === "todo" || a.status === "in_progress" ? 0 : 1;
    const bActive = b.status === "todo" || b.status === "in_progress" ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}

export default function FollowupsTab({ data }: BaseTabProps) {
  const { user } = data;
  const followups = useMemo(() => generateMockFollowups(user.id), [user.id]);

  const [filter, setFilter] = useState<"active" | "all" | "done">("active");

  const filtered = useMemo(() => {
    if (filter === "active") return followups.filter((f) => f.status === "todo" || f.status === "in_progress");
    if (filter === "done")   return followups.filter((f) => f.status === "done" || f.status === "cancelled");
    return followups;
  }, [followups, filter]);

  const counts = {
    active: followups.filter((f) => f.status === "todo" || f.status === "in_progress").length,
    done: followups.filter((f) => f.status === "done" || f.status === "cancelled").length,
    overdue: followups.filter((f) =>
      (f.status === "todo" || f.status === "in_progress") && isOverdueIso(f.dueAt)
    ).length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-0.5">跟进任务</h3>
          <p className="text-xs text-slate-500">
            {counts.active} 项进行中
            {counts.overdue > 0 && <span className="text-red-700"> · {counts.overdue} 项已逾期</span>}
          </p>
        </div>
        <button className="h-8 px-3 text-sm font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          创建任务
        </button>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="进行中" value={counts.active}  icon={<Clock className="w-3.5 h-3.5 text-blue-500" />} />
        <StatCard label="已逾期" value={counts.overdue} icon={<AlertCircle className="w-3.5 h-3.5 text-red-500" />} tone={counts.overdue > 0 ? "danger" : "neutral"} />
        <StatCard label="已完成" value={counts.done}    icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />} />
      </div>

      {/* Filter */}
      <div className="inline-flex bg-slate-100 rounded-lg p-0.5">
        <FilterButton label="进行中" active={filter === "active"} onClick={() => setFilter("active")} />
        <FilterButton label="全部"   active={filter === "all"}    onClick={() => setFilter("all")} />
        <FilterButton label="已完成" active={filter === "done"}   onClick={() => setFilter("done")} />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          无跟进任务
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((f) => <FollowupCard key={f.id} item={f} />)}
        </ul>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, tone = "neutral" }: {
  label: string; value: number; icon: React.ReactNode; tone?: "neutral" | "danger";
}) {
  const cls = tone === "danger" ? "text-red-700" : "text-slate-900";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[11px] text-slate-500">{label}</span>
      </div>
      <div className={`text-lg font-bold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 h-7 text-xs font-medium rounded-md transition-all ${
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
      }`}
    >
      {label}
    </button>
  );
}

function FollowupCard({ item }: { item: Followup }) {
  const isActive = item.status === "todo" || item.status === "in_progress";
  const isOverdue = isActive && isOverdueIso(item.dueAt);
  const isDone = item.status === "done";
  const dueIn = daysFromNow(item.dueAt);

  return (
    <li className={`rounded-xl border p-3.5 ${
      isOverdue ? "border-red-200 bg-red-50/30"
      : isDone ? "border-slate-200 bg-slate-50/50 opacity-70"
      : "border-slate-200 bg-white"
    }`}>
      <div className="flex items-start gap-3">
        <button
          className={`mt-0.5 w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${
            isDone ? "border-emerald-500 bg-emerald-500" : "border-slate-300 hover:border-blue-500"
          }`}
        >
          {isDone && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-slate-100 text-slate-700">
              {KIND_LABEL[item.kind]}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10.5px] font-medium border ${PRIORITY_TONE[item.priority]}`}>
              {PRIORITY_LABEL[item.priority]}
            </span>
            <h4 className={`text-sm font-semibold ${isDone ? "line-through text-slate-400" : "text-slate-800"}`}>
              {item.title}
            </h4>
          </div>
          <p className="text-xs text-slate-600 mt-1">{item.description}</p>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              {item.assignedTo}
            </span>
            {isActive && (
              <span className={`inline-flex items-center gap-1 ${isOverdue ? "text-red-700 font-medium" : ""}`}>
                <Clock className="w-3 h-3" />
                {isOverdue
                  ? `逾期 ${Math.abs(dueIn)} 天`
                  : dueIn === 0
                  ? "今天到期"
                  : `${dueIn} 天后到期`}
              </span>
            )}
            {isDone && item.completedAt && (
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="w-3 h-3" />
                完成于 {timeAgo(item.completedAt)}
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
