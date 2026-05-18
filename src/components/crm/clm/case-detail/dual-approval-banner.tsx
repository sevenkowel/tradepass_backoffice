"use client";

/**
 * DualApprovalBanner (P2-C4) — 双人复核 UI（mock）.
 *
 * 触发条件：critical 风险 / AML hit / 高金额（这里 mock 用 risk + AML 组合判定）。
 * 真实场景需要后端支持双 reviewer 状态机：
 *   first_approver_id, second_approver_id, dual_approval_completed_at, ...
 *
 * 本组件只渲染 UI：
 *   - 未启动：显示"This case requires two approvers"，并提示 Approve 后会
 *     进入"awaiting second approver"状态
 *   - 一审通过：显示"Awaiting second approval — Alice approved at xxx"，
 *     第二审核员才能最终 approve
 */

import { ShieldCheck, AlertTriangle } from "lucide-react";
import type { CLMCase, CaseDetail } from "@/types/clm";

export function DualApprovalBanner({
  caseItem,
}: {
  caseItem: CLMCase & Partial<CaseDetail>;
}) {
  const needs = needsDualApproval(caseItem);
  if (!needs) return null;

  // mock: 检测是否已有第一审核员（这里用 reviewedBy 字段做 mock；真实
  // 后端会用专门的 firstApprover 字段）
  const firstApprover = caseItem.reviewedBy && caseItem.status !== "approved" && caseItem.status !== "rejected"
    ? caseItem.reviewedBy
    : null;

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50 p-2.5 text-xs">
      <div className="flex items-center gap-1.5 mb-1">
        <ShieldCheck className="w-3.5 h-3.5 text-violet-700" />
        <span className="font-bold text-violet-800 text-[11px] uppercase tracking-wider">
          Dual approval required
        </span>
      </div>
      {firstApprover ? (
        <p className="text-violet-700 leading-relaxed">
          <b>{firstApprover}</b> has signed off. A <b>second compliance reviewer</b> must
          approve before this case is finalized.
        </p>
      ) : (
        <p className="text-violet-700 leading-relaxed flex items-start gap-1.5">
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0 text-violet-600" />
          <span>
            This case is flagged as <b>high-stakes</b>. Your approval will be marked as
            the <b>first sign-off</b>; a second reviewer (compliance) must approve
            independently before customer is notified.
          </span>
        </p>
      )}
    </div>
  );
}

function needsDualApproval(c: CLMCase & Partial<CaseDetail>): boolean {
  if (c.riskLevel === "critical") return true;
  if (c.amlStatus === "hit") return true;
  if (c.riskAssessment?.amlStatus === "hit") return true;
  return false;
}
