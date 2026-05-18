"use client";

/**
 * Assignments — 客户经理 → 客户分配视图.
 *
 * 给运营主管看：每个员工服务多少客户、其中 VIP 比例、本月触达次数。
 */

import { useMemo } from "react";
import Link from "next/link";
import { Users, TrendingUp, ChevronRight } from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { PageHeader, Card } from "@/components/crm/ui";
import { generateAssignments } from "@/lib/crm/mock-collaboration";

const LEVEL_TONE: Record<string, string> = {
  enterprise: "bg-violet-100 text-violet-700",
  premium:    "bg-amber-100 text-amber-700",
  vip:        "bg-blue-100 text-blue-700",
  standard:   "bg-slate-100 text-slate-600",
};

export default function AssignmentsPage() {
  // memoised — generator is deterministic but cheap-but-not-free
  const data = useMemo(() => generateAssignments(), []);
  return (
    <>
      <Breadcrumb items={[{ label: "Clients", href: "/crm/clients" }, { label: "工作分配" }]} />
      <PageHeader
        title="工作分配"
        description="客户经理服务的客户分布 + 本月触达 — 给运营主管看资源是否分配合理"
      />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">员工数</p>
          <p className="text-2xl font-bold tabular-nums">{data.length}</p>
        </Card>
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">服务客户总数</p>
          <p className="text-2xl font-bold tabular-nums">{data.reduce((s, d) => s + d.clientCount, 0)}</p>
        </Card>
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">VIP 客户</p>
          <p className="text-2xl font-bold text-blue-700 tabular-nums">{data.reduce((s, d) => s + d.vipClientCount, 0)}</p>
        </Card>
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">本月累计触达</p>
          <p className="text-2xl font-bold text-emerald-700 tabular-nums">{data.reduce((s, d) => s + d.monthlyTouches, 0)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.map((w) => (
          <Card key={w.staffId} className="!p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center">
                {w.staffName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{w.staffName}</p>
                <p className="text-[11px] text-slate-500">{w.role} · {w.team}</p>
              </div>
              <button className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                重新分配
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">客户数</p>
                <p className="text-lg font-bold tabular-nums">{w.clientCount}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">VIP 客户</p>
                <p className="text-lg font-bold tabular-nums text-blue-700">{w.vipClientCount}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">月触达</p>
                <p className="text-lg font-bold tabular-nums text-emerald-700">{w.monthlyTouches}</p>
              </div>
            </div>

            <details>
              <summary className="cursor-pointer text-[11px] text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
                <Users className="w-3 h-3" />
                展开客户列表 ({w.clients.length})
              </summary>
              <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {w.clients.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/crm/clients/${c.id}`}
                      className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50 text-xs"
                    >
                      <span className="text-slate-800 truncate">{c.name}</span>
                      <span className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase ${LEVEL_TONE[c.level]}`}>
                          {c.level}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.lastTouch).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" })}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          </Card>
        ))}
      </div>
    </>
  );
}

void TrendingUp;
