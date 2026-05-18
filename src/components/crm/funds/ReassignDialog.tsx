"use client";

/**
 * ReassignDialog — pick a new operator for the current step.
 *
 * Filters available operators by the step's required role.
 * Used by all funds detail pages via ApprovalDetailLayout.
 */

import { useState } from "react";
import { UserCheck, Search, X } from "lucide-react";
import { CenterModal } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { operators, type OperatorRole } from "@/lib/mock/funds/v2/entities";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Role required for the active step (filters the candidate list). */
  requiredRole?: OperatorRole;
  /** Current assignee id (so we can mark them and avoid no-op reassign). */
  currentAssigneeId?: string;
  onConfirm: (operatorId: string, reason: string) => void;
}

export function ReassignDialog({ open, onClose, requiredRole, currentAssigneeId, onConfirm }: Props) {
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const candidates = operators
    .filter((o) => !requiredRole || o.role === requiredRole)
    .filter((o) => !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <CenterModal open={open} onClose={onClose} title="转交给其他操作员">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {requiredRole ? <>需要角色：<span className="font-medium text-slate-800">{requiredRole}</span></> : "无角色限制"}
          </span>
          {currentAssigneeId && (
            <span className="text-slate-500">
              当前：<span className="font-mono">{currentAssigneeId}</span>
            </span>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索操作员姓名 / ID..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
          {candidates.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-slate-400">无匹配操作员</p>
          ) : candidates.map((op) => {
            const isCurrent = op.id === currentAssigneeId;
            const isPicked = op.id === picked;
            return (
              <button
                key={op.id}
                disabled={isCurrent}
                onClick={() => setPicked(op.id)}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-3 py-2 text-left transition-colors",
                  isPicked ? "bg-blue-50" : "hover:bg-slate-50",
                  isCurrent && "opacity-50 cursor-not-allowed",
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{op.name}</p>
                    <p className="text-[11px] text-slate-500">
                      <span className="font-mono">{op.id}</span>
                      <span className="mx-1.5">·</span>
                      <span>{op.team}</span>
                    </p>
                  </div>
                </div>
                {isCurrent && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">当前</span>}
                {isPicked && !isCurrent && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-primary">选中</span>}
              </button>
            );
          })}
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">转交原因 (必填)</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="例如：客户经理熟悉此客户 / 需要 Compliance L2 介入..."
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button
            disabled={!picked || !reason.trim()}
            onClick={() => {
              if (picked && reason.trim()) {
                onConfirm(picked, reason.trim());
                onClose();
                setPicked(null);
                setReason("");
              }
            }}
          >
            确认转交
          </Button>
        </div>
      </div>
    </CenterModal>
  );
}
