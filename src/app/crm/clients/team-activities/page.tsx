"use client";

/**
 * Team Activities — 今日团队对客户做了什么的全局活动流.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  UserPlus, ShieldCheck, ShieldX, Shield, ArrowDown, ArrowUp,
  Ban, Unlock, Tag as TagIcon, MessageSquare, CheckCircle, FileCheck,
  type LucideIcon,
} from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { PageHeader, Card } from "@/components/crm/ui";
import {
  generateTeamActivities, ACTIVITY_META,
  type TeamActivityItem,
} from "@/lib/crm/mock-collaboration";

const ICON_MAP: Record<string, LucideIcon> = {
  "user-plus":      UserPlus,
  "shield-check":   ShieldCheck,
  "shield-x":       ShieldX,
  "shield":         Shield,
  "arrow-down":     ArrowDown,
  "arrow-up":       ArrowUp,
  "ban":            Ban,
  "unlock":         Unlock,
  "tag":            TagIcon,
  "message-square": MessageSquare,
  "check-circle":   CheckCircle,
  "file-check":     FileCheck,
};

export default function TeamActivitiesPage() {
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const activities = useMemo(() => generateTeamActivities(), []);

  const staffList = useMemo(() => {
    const set = new Map<string, string>();
    for (const a of activities) set.set(a.staffId, a.staffName);
    return Array.from(set.entries());
  }, [activities]);

  const filtered = useMemo(() => {
    return staffFilter === "all" ? activities : activities.filter((a) => a.staffId === staffFilter);
  }, [activities, staffFilter]);

  // 按日期分组
  const grouped = useMemo(() => {
    const m = new Map<string, TeamActivityItem[]>();
    for (const a of filtered) {
      const date = new Date(a.timestamp).toLocaleDateString("zh-CN");
      if (!m.has(date)) m.set(date, []);
      m.get(date)!.push(a);
    }
    return Array.from(m.entries());
  }, [filtered]);

  const todayCount = activities.filter((a) => {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return new Date(a.timestamp) >= t;
  }).length;

  return (
    <>
      <Breadcrumb items={[{ label: "Clients", href: "/crm/clients" }, { label: "团队活动" }]} />
      <PageHeader
        title="团队活动"
        description="今日 / 本周团队对客户做了什么的全局活动流"
      />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">本周活动</p>
          <p className="text-2xl font-bold tabular-nums">{activities.length}</p>
        </Card>
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">今日活动</p>
          <p className="text-2xl font-bold text-blue-700 tabular-nums">{todayCount}</p>
        </Card>
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">活跃员工</p>
          <p className="text-2xl font-bold tabular-nums">{staffList.length}</p>
        </Card>
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">涉及客户</p>
          <p className="text-2xl font-bold tabular-nums">
            {new Set(activities.map((a) => a.clientId)).size}
          </p>
        </Card>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs text-slate-500">按员工筛选：</span>
        <button
          onClick={() => setStaffFilter("all")}
          className={`px-2.5 h-7 rounded-md text-xs font-medium border ${
            staffFilter === "all" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200"
          }`}
        >
          全部 ({activities.length})
        </button>
        {staffList.map(([id, name]) => {
          const count = activities.filter((a) => a.staffId === id).length;
          return (
            <button
              key={id}
              onClick={() => setStaffFilter(id)}
              className={`px-2.5 h-7 rounded-md text-xs font-medium border ${
                staffFilter === id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200"
              }`}
            >
              {name} ({count})
            </button>
          );
        })}
      </div>

      {/* Activity feed grouped by date */}
      <div className="space-y-4">
        {grouped.map(([date, items]) => (
          <div key={date}>
            <h3 className="text-[10.5px] uppercase tracking-wider font-bold text-slate-400 mb-2 sticky top-0 bg-slate-50/80 backdrop-blur py-1 z-10">
              {date} · {items.length} 条
            </h3>
            <ul className="space-y-1">
              {items.map((a) => {
                const meta = ACTIVITY_META[a.type];
                const Icon = ICON_MAP[meta.icon] ?? MessageSquare;
                return (
                  <li key={a.id} className="bg-white rounded-lg border border-slate-200 p-3 hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center ${meta.tone}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium text-slate-900">{a.staffName}</span>
                          {" "}
                          <span className={`${meta.tone}`}>{meta.label}</span>
                          {" "}
                          <Link href={`/crm/clients/${a.clientId}`} className="text-primary hover:underline">
                            {a.clientName}
                          </Link>
                          {a.metadata && <span className="text-slate-600"> · {a.metadata}</span>}
                        </p>
                      </div>
                      <span className="text-[10.5px] text-slate-400 tabular-nums flex-shrink-0">
                        {new Date(a.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
