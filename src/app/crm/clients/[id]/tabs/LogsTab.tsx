"use client";

/**
 * Client Detail → Logs tab.
 *
 * Reads the cross-domain `GlobalAuditLog` pool filtered by `clientId`, so a
 * single tab now shows everything that touched the client — regardless of
 * which module emitted it. The domain badge tells the operator where the
 * action originated (Clients edit · CLM case · Risk rule · Compliance freeze · …).
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ScrollText } from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";
import { globalAuditService, clientAuditToGlobal } from "@/lib/audit";
import type { AuditDomain, GlobalAuditLog } from "@/types/core";

const DOMAIN_TONES: Record<AuditDomain, string> = {
  clients: "bg-violet-50 text-violet-700",
  clm: "bg-blue-50 text-blue-700",
  risk: "bg-orange-50 text-orange-700",
  compliance: "bg-emerald-50 text-emerald-700",
  funds: "bg-emerald-50 text-emerald-800",
  trading: "bg-amber-50 text-amber-700",
  staff: "bg-slate-100 text-slate-700",
  system: "bg-slate-100 text-slate-500",
};

const SEVERITY_DOTS = {
  info: "bg-blue-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
} as const;

export default function LogsTab({ data }: BaseTabProps) {
  const { user, auditLogs } = data;

  // Two sources for now: the global pool (CLM, compliance, etc — keyed by
  // clientId) and the legacy per-client logs sourced from Prisma. We merge
  // them via the unified shape so the tab reads one type.
  const [logs, setLogs] = useState<GlobalAuditLog[]>(() => auditLogs.map(clientAuditToGlobal));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    globalAuditService.listForClient(user.id, 100).then((cross) => {
      if (cancelled) return;
      const fromClient = auditLogs.map(clientAuditToGlobal);
      // De-dupe by id (defensive — adapter ids should already be unique).
      const seen = new Set<string>();
      const merged = [...cross, ...fromClient]
        .filter((l) => (seen.has(l.id) ? false : (seen.add(l.id), true)))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      setLogs(merged);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user.id, auditLogs]);

  const totals = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of logs) counts[l.severity] = (counts[l.severity] ?? 0) + 1;
    return counts;
  }, [logs]);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">操作历史</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {logs.length} 条记录 · {totals.critical || 0} 严重 · {totals.warning || 0} 警告
          </p>
        </div>
        <Link
          href={`/crm/clm/audit-trail?clientId=${encodeURIComponent(user.id)}`}
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          在审计中心查看 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500">
              <th className="px-4 py-3 text-left font-medium w-[140px]">时间</th>
              <th className="px-4 py-3 text-left font-medium w-[110px]">来源</th>
              <th className="px-4 py-3 text-left font-medium">操作</th>
              <th className="px-4 py-3 text-left font-medium w-[130px]">操作人</th>
              <th className="px-4 py-3 text-left font-medium">变更</th>
              <th className="px-4 py-3 text-left font-medium w-[130px]">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
              >
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono tabular-nums text-xs">
                  {new Date(log.createdAt).toLocaleString("zh-CN", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[11px] font-medium ${DOMAIN_TONES[log.domain]}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOTS[log.severity]}`} />
                    {log.domain}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">{log.actionLabel}</p>
                  {log.description && (
                    <p className="text-xs text-slate-500 truncate max-w-md">{log.description}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-700">{log.actor.name}</td>
                <td className="px-4 py-3">
                  {log.changes.length === 0 ? (
                    <span className="text-xs text-slate-300">—</span>
                  ) : (
                    <div className="space-y-0.5">
                      {log.changes.slice(0, 2).map((c, i) => (
                        <div key={i} className="text-[11px] flex items-center gap-1">
                          <span className="text-slate-500">{c.label ?? c.field}:</span>
                          {c.oldValue !== undefined && (
                            <span className="line-through text-red-500 font-mono">
                              {String(c.oldValue)}
                            </span>
                          )}
                          {c.newValue !== undefined && (
                            <>
                              <ArrowRight className="w-3 h-3 text-blue-500" />
                              <span className="text-emerald-600 font-mono">
                                {String(c.newValue)}
                              </span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {log.ipAddress ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && logs.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm flex flex-col items-center gap-2">
            <ScrollText className="w-6 h-6 text-slate-300" />
            暂无审计日志
          </div>
        )}
      </div>
    </div>
  );
}
