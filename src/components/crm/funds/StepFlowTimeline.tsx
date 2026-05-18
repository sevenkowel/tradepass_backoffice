"use client";

/**
 * StepFlowTimeline — funds approval step visualizer
 *
 * Vertical list of approval steps with role + state + outcome + timestamp.
 * Active step shows an inline action area where the operator can approve /
 * reject / hold. Mirrors CLM case-detail timeline style.
 *
 * Used by all funds detail pages (Wallet/Trading Deposit/Withdrawal + Transfers).
 */

import { Zap, User, GitBranch, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  STEP_STATE_FG,
  type ApprovalStep,
} from "@/lib/mock/funds/v2/approvals";

interface Props {
  steps: ApprovalStep[];
  /** Lookup helper — turn operator id → display name. */
  actorName?: (id: string) => string;
  /** Show inline action buttons on the currently active step. */
  showActions?: boolean;
  /** Callback when operator clicks Approve/Reject/Hold on the active step. */
  onAction?: (stepKey: string, action: "approve" | "reject" | "hold") => void;
}

export function StepFlowTimeline({ steps, actorName, showActions = false, onAction }: Props) {
  return (
    <ol className="relative space-y-3">
      {/* vertical line connector */}
      <span className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" aria-hidden />

      {steps.map((step, i) => {
        const tone = STEP_STATE_FG[step.state];
        const isActive = step.state === "in_progress" || (step.state === "pending" && steps.slice(0, i).every((s) => s.state === "done" || s.state === "skipped"));
        const Icon =
          step.state === "done"     ? CheckCircle2 :
          step.state === "rejected" ? XCircle      :
          step.state === "skipped"  ? CheckCircle2 :
          step.role === "compliance" ? GitBranch   :
          step.role === "treasury"   ? Zap         :
                                       User;

        return (
          <li key={step.key} className="relative pl-7">
            {/* dot */}
            <span
              className={cn(
                "absolute left-0 top-0.5 w-3.5 h-3.5 rounded-full ring-4 ring-white flex items-center justify-center",
                tone.dot,
              )}
              aria-hidden
            >
              {step.state === "done" && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
              {step.state === "rejected" && <XCircle className="w-2.5 h-2.5 text-white" />}
              {step.state === "in_progress" && <Clock className="w-2.5 h-2.5 text-white" />}
            </span>

            <div className={cn("rounded-lg border p-3", tone.bg, isActive && "ring-2 ring-blue-100")}>
              {/* head row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-3.5 h-3.5", tone.text)} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Step {i + 1} · {step.role}
                    </span>
                    {step.state === "done" && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Done</span>
                    )}
                    {step.state === "rejected" && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-red-700">Rejected</span>
                    )}
                    {step.state === "skipped" && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Skipped</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{step.label}</p>

                  {step.outcome && (
                    <p className="text-xs text-slate-600 mt-1">{step.outcome}</p>
                  )}
                  {step.actorId && step.at && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      {actorName ? actorName(step.actorId) : step.actorId} · {new Date(step.at).toLocaleString()}
                    </p>
                  )}
                  {isActive && step.requires && step.requires.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Requires</p>
                      <ul className="space-y-0.5">
                        {step.requires.map((r) => (
                          <li key={r} className="text-xs text-slate-600 font-mono">• {r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* action area only on currently-active step */}
              {isActive && showActions && onAction && (
                <div className="mt-3 pt-3 border-t border-slate-200 flex gap-2">
                  <Button size="sm" onClick={() => onAction(step.key, "approve")}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve & Next
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => onAction(step.key, "reject")}>
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => onAction(step.key, "hold")}>
                    <Clock className="w-3.5 h-3.5" />
                    Hold
                  </Button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
