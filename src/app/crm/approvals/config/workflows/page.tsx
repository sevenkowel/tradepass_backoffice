"use client";

/**
 * Approval Center — Workflows config (v3)
 *
 * Implements PRD §17 (Workflow Engine) + §21 (Workflow Config).
 * Visualizes the state machine for each task type and lists the
 * available actions plus any auto-approval rules.
 *
 * Data source: `workflowEngine` — `DEFAULT_TRANSITIONS`,
 * `createDefaultWorkflowConfig(type)`, `TERMINAL_STATUSES`.
 *
 * Implementation depth: read-only. "Edit" buttons surface intent but
 * persistence is deferred (see ADR §5).
 */

import { useState } from "react";
import { ArrowRight, CheckCircle2, Settings2 } from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, BadgeBase } from "@/components/crm/ui";
import {
  DEFAULT_TRANSITIONS,
  TERMINAL_STATUSES,
  createDefaultWorkflowConfig,
} from "@/lib/approval/workflowEngine";
import type { TaskType, WorkflowStatus, ApprovalAction } from "@/types/approval";

const TASK_TYPES: TaskType[] = [
  "kyc", "re_verification", "aml_review",
  "withdrawal", "large_withdrawal", "deposit",
  "leverage", "reward", "partner", "profile_change",
];

const STATUS_LABEL: Record<WorkflowStatus, string> = {
  pending:  "Pending",
  on_hold:  "On Hold",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_TONE: Record<WorkflowStatus, "neutral" | "warning" | "success" | "error"> = {
  pending:  "neutral",
  on_hold:  "warning",
  approved: "success",
  rejected: "error",
};

const ACTION_LABEL: Record<ApprovalAction, string> = {
  claim:                   "Claim",
  hold:                    "Hold",
  approve:                 "Approve",
  reject:                  "Reject",
  request_re_submit:       "Request Resubmit",
  request_additional_docs: "Request Additional Docs",
  transfer:                "Transfer",
  escalate:                "Escalate",
  release:                 "Release",
};

export default function WorkflowsConfigPage() {
  const [activeType, setActiveType] = useState<TaskType>("kyc");
  const config = createDefaultWorkflowConfig(activeType);

  return (
    <div className="space-y-3">
      <Breadcrumb
        items={[
          { label: "Approval Center" },
          { label: "Configuration" },
          { label: "Workflows" },
        ]}
      />
      <PageHeader
        title="Workflows"
        description="State machine, transitions, and auto-approval rules for each task type"
      />

      {/* Type selector */}
      <Card padding="none">
        <div className="flex items-center gap-1 px-4 py-2.5 border-b border-slate-200 overflow-x-auto">
          {TASK_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeType === t
                  ? "bg-blue-100 text-primary"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.replace(/_/g, " ").toUpperCase()}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{config.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Initial status: <span className="font-mono">{config.initialStatus}</span> ·{" "}
                Batch: {config.allowBatch ? "enabled" : "disabled"}
              </p>
            </div>
            <button
              onClick={() => alert("Workflow editor coming in Phase 2")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Edit Workflow
            </button>
          </div>

          {/* State map */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              States
            </h4>
            <div className="flex items-center gap-3 flex-wrap">
              {(Object.keys(STATUS_LABEL) as WorkflowStatus[]).map((status) => {
                const isTerminal = TERMINAL_STATUSES.includes(status);
                return (
                  <div
                    key={status}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                      isTerminal ? "border-slate-200 bg-slate-50/50" : "border-slate-200 bg-white"
                    }`}
                  >
                    <BadgeBase tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</BadgeBase>
                    {isTerminal && (
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">terminal</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transitions table */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Transitions
            </h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-3 py-2 text-left">From</th>
                    <th className="px-3 py-2 text-left">Action</th>
                    <th className="px-3 py-2 text-left">To</th>
                    <th className="px-3 py-2 text-left">Requires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {DEFAULT_TRANSITIONS.map((t, i) => {
                    const fromList = Array.isArray(t.from) ? t.from : [t.from];
                    return (
                      <tr key={i} className="hover:bg-slate-50/40">
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            {fromList.map((f) => (
                              <BadgeBase key={f} tone={STATUS_TONE[f]} size="sm">{STATUS_LABEL[f]}</BadgeBase>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs font-medium text-slate-700">{ACTION_LABEL[t.action]}</span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <ArrowRight className="w-3 h-3 text-slate-300" />
                            <BadgeBase tone={STATUS_TONE[t.to]} size="sm">{STATUS_LABEL[t.to]}</BadgeBase>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1.5">
                            {t.requiresNote && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">note</span>
                            )}
                            {t.requiresReason && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700">reason</span>
                            )}
                            {!t.requiresNote && !t.requiresReason && (
                              <span className="text-[10px] text-slate-300">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Auto-approval rules */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Auto-approval rules
              </h4>
              <button
                onClick={() => alert("Rule editor coming in Phase 2")}
                className="text-xs text-primary hover:underline"
              >
                + Add Rule
              </button>
            </div>
            {config.autoApproveRules && config.autoApproveRules.length > 0 ? (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                {config.autoApproveRules.map((rule) => (
                  <div key={rule.id} className="px-3 py-2 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700">{rule.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {Object.entries(rule.condition).map(([k, v]) =>
                          `${k}=${Array.isArray(v) ? v.join("|") : v}`
                        ).join(" · ")}
                      </p>
                    </div>
                    <BadgeBase tone={rule.action === "approve" ? "success" : "neutral"} size="sm">
                      {rule.action}
                    </BadgeBase>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-400">
                  No auto-approval rules. Tasks of type <span className="font-mono">{activeType}</span>{" "}
                  always require manual review.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
