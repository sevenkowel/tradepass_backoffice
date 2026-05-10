"use client";

import Link from "next/link";
import { ClipboardList, Clock, UserCheck, MessageSquare, ArrowUpRight, ExternalLink } from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";

export default function CasesTab({ data }: BaseTabProps) {
  const { cases, user } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">审批 Case</h3>
        <Link
          href={`/crm/clm/cases?search=${encodeURIComponent(user.uid)}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-blue-50 rounded-lg transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          在 CLM 中查看全部
        </Link>
      </div>

      <div className="space-y-3">
        {cases.map((caseItem) => (
          <div key={caseItem.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-5 h-5 text-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-900">{caseItem.caseId}</span>
                    <CaseStatusBadge status={caseItem.status} />
                    <PriorityBadge priority={caseItem.priority} />
                  </div>
                  <span className="text-xs text-slate-500">
                    {caseItem.type === "kyc_review" && "KYC 审核"}
                    {caseItem.type === "withdrawal_review" && "出金审核"}
                    {caseItem.type === "resubmission_review" && "重新提交审核"}
                    {caseItem.type === "video_verification" && "视频认证"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                SLA: {caseItem.sla}
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
              <span>审核人: {caseItem.reviewer || "未分配"}</span>
              <span>创建: {new Date(caseItem.createdAt).toLocaleString("zh-CN")}</span>
            </div>

            {/* 评论 */}
            {caseItem.comments.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                {caseItem.comments.map((comment) => (
                  <div key={comment.id} className="text-sm">
                    <span className="font-medium text-slate-700">{comment.author}:</span>
                    <span className="text-slate-600 ml-1">{comment.content}</span>
                    <span className="text-xs text-slate-400 ml-2">{new Date(comment.createdAt).toLocaleString("zh-CN")}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 操作 */}
            {caseItem.status === "pending" && (
              <div className="flex items-center gap-2 mt-3">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors">
                  <UserCheck className="w-3.5 h-3.5" />
                  指派审核人
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" />
                  添加评论
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  升级
                </button>
              </div>
            )}
          </div>
        ))}

        {cases.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">暂无审批 Case</div>
        )}
      </div>
    </div>
  );
}

function CaseStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "待处理", color: "text-amber-700", bg: "bg-amber-100" },
    in_review: { label: "审核中", color: "text-blue-700", bg: "bg-blue-100" },
    approved: { label: "已通过", color: "text-emerald-700", bg: "bg-emerald-100" },
    rejected: { label: "已拒绝", color: "text-red-700", bg: "bg-red-100" },
    escalated: { label: "已升级", color: "text-violet-700", bg: "bg-violet-100" },
  };

  const c = config[status] || config.pending;
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.color}`}>{c.label}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    low: { label: "低", color: "text-slate-600", bg: "bg-slate-100" },
    medium: { label: "中", color: "text-blue-700", bg: "bg-blue-100" },
    high: { label: "高", color: "text-amber-700", bg: "bg-amber-100" },
    urgent: { label: "紧急", color: "text-red-700", bg: "bg-red-100" },
  };

  const c = config[priority] || config.low;
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.color}`}>{c.label}</span>;
}
