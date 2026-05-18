"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, PageHeader, BadgeBase, type BadgeTone } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import type { ApprovalAction, AuditEntry } from "@/types/approval";

const ACTION_TONE: Record<ApprovalAction, BadgeTone> = {
  claim:                   "primary",
  hold:                    "warning",
  approve:                 "success",
  reject:                  "error",
  request_re_submit:       "purple",
  request_additional_docs: "warning",
  transfer:                "neutral",
  escalate:                "orange",
  release:                 "neutral",
};

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/approvals/audit-trail")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setLogs(data.logs);
      })
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const byDay = new Map<string, AuditEntry[]>();
    for (const entry of logs) {
      const day = new Date(entry.timestamp).toLocaleDateString();
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(entry);
    }
    return Array.from(byDay.entries());
  }, [logs]);

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "Approval Center" }, { label: "Audit Trail" }]} />
      <PageHeader
        title="Audit Trail"
        description="Complete history of all approval actions"
      />

      {loading ? (
        <Card padding="none">
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </Card>
      ) : logs.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-sm text-slate-400">No audit records yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {grouped.map(([day, entries]) => (
            <Card key={day} padding="none">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{day}</h3>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider tabular-nums">
                  {entries.length} action{entries.length === 1 ? "" : "s"}
                </span>
              </div>
              <ol className="divide-y divide-slate-100">
                {entries.map((log) => (
                  <li key={log.id} className="px-4 py-3 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <BadgeBase tone={ACTION_TONE[log.action] ?? "neutral"}>
                        {log.actionLabel}
                      </BadgeBase>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900">
                          <span className="font-medium">{log.operatorName}</span>
                          <span className="text-slate-500">
                            {" "}
                            ({log.operatorRole.replace(/_/g, " ")})
                          </span>{" "}
                          <span className="text-slate-400">·</span>{" "}
                          <span className="text-slate-500">{log.oldStatus}</span>{" "}
                          →{" "}
                          <span className="font-medium">{log.newStatus}</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono tabular-nums">
                          {log.taskType.replace(/_/g, " ").toUpperCase()} · {log.taskId}
                        </p>
                        {log.note && (
                          <p className="text-xs text-slate-500 mt-1">{log.note}</p>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap font-mono tabular-nums">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
