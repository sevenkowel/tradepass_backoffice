"use client";

/**
 * Device Clusters — 多账户共享同一设备的客户群.
 *
 * Phase 2.6 子页：从关系网络细分出来的"设备维度"专注视图。
 * 数据底层与 /relationships?view=clusters 相同，但仅按 shared_device 过滤。
 */

import { useMemo } from "react";
import Link from "next/link";
import { Monitor, AlertTriangle, ExternalLink, Users } from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { PageHeader, Card } from "@/components/crm/ui";
import { generateDeviceClusters, type DeviceCluster } from "@/lib/crm/mock-collaboration";

const TONE_BG: Record<DeviceCluster["riskLevel"], string> = {
  critical: "bg-red-50 border-l-red-500",
  high:     "bg-orange-50 border-l-orange-500",
  medium:   "bg-amber-50 border-l-amber-400",
  low:      "bg-emerald-50 border-l-emerald-400",
};

export default function DeviceClustersPage() {
  const clusters = useMemo(() => generateDeviceClusters(), []);
  const critical = clusters.filter((c) => c.riskLevel === "critical").length;

  return (
    <>
      <Breadcrumb items={[{ label: "Clients", href: "/crm/clients" }, { label: "设备集群" }]} />
      <PageHeader
        title="设备集群"
        description="多个客户共享同一设备指纹（疑似农场账户 / 同人多账户）"
      />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">设备集群</p>
          <p className="text-2xl font-bold tabular-nums">{clusters.length}</p>
        </Card>
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">Critical 集群</p>
          <p className="text-2xl font-bold text-red-700 tabular-nums">{critical}</p>
        </Card>
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">涉及账户</p>
          <p className="text-2xl font-bold tabular-nums">
            {clusters.reduce((s, c) => s + c.members.length, 0)}
          </p>
        </Card>
        <Card className="!p-3">
          <p className="text-[10.5px] uppercase tracking-wider text-slate-500">平均规模</p>
          <p className="text-2xl font-bold tabular-nums">
            {(clusters.reduce((s, c) => s + c.members.length, 0) / clusters.length).toFixed(1)}
          </p>
        </Card>
      </div>

      <div className="space-y-2">
        {clusters.map((c) => (
          <div key={c.id} className={`rounded-xl border border-slate-200 bg-white border-l-4 p-4 ${TONE_BG[c.riskLevel]}`}>
            <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <Monitor className="w-4 h-4 text-slate-500" />
                <span className="font-mono text-sm font-bold text-slate-900 truncate">{c.deviceHash}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">{c.deviceLabel}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  c.riskLevel === "critical" ? "bg-red-200 text-red-800" :
                  c.riskLevel === "high" ? "bg-orange-200 text-orange-800" :
                  c.riskLevel === "medium" ? "bg-amber-200 text-amber-800" :
                  "bg-emerald-200 text-emerald-800"
                }`}>
                  {c.riskLevel.toUpperCase()}
                </span>
              </div>
              <Link
                href={`/crm/clients/relationships?view=graph&clientId=${c.memberIds[0]}`}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                在图谱中查看
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-2">
              <span><Users className="w-3 h-3 inline -mt-0.5 mr-1" />{c.members.length} 个账户</span>
              <span>OS: {c.os}</span>
              <span>Browser: {c.browser}</span>
              <span>最近 {new Date(c.lastSeenAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {c.members.map((m) => (
                <Link key={m.id} href={`/crm/clients/${m.id}`} className="block px-2 py-1.5 rounded border border-slate-200 hover:bg-blue-50/30 hover:border-blue-300 text-xs">
                  <div className="font-medium text-slate-800 truncate">{m.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{m.uid} · {m.country}</div>
                  <div className="text-[10px] mt-0.5">
                    风险评分 <span className={m.riskScore >= 70 ? "text-red-700 font-bold" : m.riskScore >= 40 ? "text-amber-700 font-medium" : "text-slate-600"}>
                      {m.riskScore}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
