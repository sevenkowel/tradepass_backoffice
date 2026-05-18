"use client";

/**
 * Approval Center — SLA config (v3)
 *
 * Implements PRD §19. Lists the SLA tier matrix: per task type ×
 * priority (normal / vip / high_risk) → timeout / warning / escalation
 * thresholds + the escalation target role.
 *
 * Data source: `DEFAULT_SLA_CONFIGS` from slaEngine. Editing stubbed.
 */

import { Settings2, Timer, AlertTriangle, ArrowUpRight } from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, BadgeBase, type BadgeTone } from "@/components/crm/ui";
import { DEFAULT_SLA_CONFIGS } from "@/lib/approval/slaEngine";

const PRIORITY_TONE: Record<string, BadgeTone> = {
  normal:    "neutral",
  vip:       "purple",
  high_risk: "error",
};

function fmtMinutes(m: number): string {
  if (m >= 60 * 24) return `${Math.round((m / 60 / 24) * 10) / 10}d`;
  if (m >= 60) return `${Math.round((m / 60) * 10) / 10}h`;
  return `${m}m`;
}

export default function SlaConfigPage() {
  // Group by task type for readability
  const byType = new Map<string, typeof DEFAULT_SLA_CONFIGS>();
  for (const c of DEFAULT_SLA_CONFIGS) {
    const list = byType.get(c.taskType) ?? [];
    list.push(c);
    byType.set(c.taskType, list);
  }

  return (
    <div className="space-y-3">
      <Breadcrumb
        items={[
          { label: "Approval Center" },
          { label: "Configuration" },
          { label: "SLA" },
        ]}
      />
      <PageHeader
        title="SLA Configuration"
        description="Service-level agreements per task type and priority, including escalation targets"
        actions={
          <button
            onClick={() => alert("SLA editor coming in Phase 2")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Edit SLA
          </button>
        }
      />

      {/* Legend */}
      <Card className="!p-3 border-slate-200">
        <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-emerald-600" />
            <strong className="text-slate-900">Timeout:</strong>
            total budget for the task lifecycle
          </span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <strong className="text-slate-900">Warning at:</strong>
            time before timeout when reviewer is alerted
          </span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-orange-600" />
            <strong className="text-slate-900">Escalation at:</strong>
            time after timeout before bumping to senior reviewer
          </span>
        </div>
      </Card>

      {/* Per-type SLA blocks */}
      <div className="space-y-3">
        {Array.from(byType.entries()).map(([type, configs]) => (
          <Card key={type} padding="none">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 capitalize">
                {type.replace(/_/g, " ")}
              </h3>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                {configs.length} tier{configs.length === 1 ? "" : "s"}
              </span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-2 text-left w-32">Priority</th>
                  <th className="px-4 py-2 text-right w-24">Timeout</th>
                  <th className="px-4 py-2 text-right w-28">Warn before</th>
                  <th className="px-4 py-2 text-right w-32">Escalate after</th>
                  <th className="px-4 py-2 text-left">Escalate to</th>
                  <th className="px-4 py-2 text-left">Strategy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {configs.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/40">
                    <td className="px-4 py-2.5">
                      <BadgeBase tone={PRIORITY_TONE[c.priority]} size="sm">
                        {c.priority}
                      </BadgeBase>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-mono font-semibold text-slate-900">
                      {fmtMinutes(c.timeoutMinutes)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-amber-700 font-mono">
                      −{fmtMinutes(c.warningThresholdMinutes)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-orange-700 font-mono">
                      +{fmtMinutes(c.escalationThresholdMinutes)}
                    </td>
                    <td className="px-4 py-2.5 capitalize text-slate-700 text-xs">
                      {c.escalateTo.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500 capitalize">
                      {c.escalationStrategy.replace(/_/g, " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
      </div>
    </div>
  );
}
