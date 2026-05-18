"use client";

/**
 * CustomerCaseHistory (P1-B4) — 该客户的历史 case 迷你时间线.
 *
 * 让审核员决策前快速看到："这位客户之前来过吗？是怎么处理的？"
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, AlertTriangle, History as HistoryIcon } from "lucide-react";
import { caseService } from "@/lib/clm/services";
import type { CLMCase } from "@/types/clm";
import { CaseTypeBadge } from "@/components/crm/ui/CaseTypeBadge";
import { fmtDate } from "@/components/crm/clm/case-detail/bits";

export function CustomerCaseHistory({
  customerId, currentCaseId,
}: {
  customerId: string;
  currentCaseId: string;
}) {
  const [items, setItems] = useState<CLMCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // CaseListParams 没有 customerId 字段；用 search 模糊匹配 + 客户端 filter。
        // 列表服务把 search 与 customerName/uid/caseNo 做匹配；多拉点结果给本地过滤。
        const res = await caseService.list({ search: customerId, pageSize: 50 });
        const others = (res.items ?? [])
          .filter((c) => c.customerId === customerId && c.id !== currentCaseId);
        // 最新在前
        others.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setItems(others);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [customerId, currentCaseId]);

  if (loading) {
    return (
      <p className="text-xs text-slate-400 text-center py-4">Loading customer history…</p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-6 text-center">
        <HistoryIcon className="w-6 h-6 text-slate-200 mx-auto mb-1" />
        <p className="text-xs text-slate-400">No prior cases — this is the customer&apos;s first application.</p>
      </div>
    );
  }

  return (
    <ol className="relative pl-4 border-l border-slate-200 space-y-2.5">
      {items.map((it) => (
        <HistoryDot key={it.id} item={it} />
      ))}
    </ol>
  );
}

function HistoryDot({ item }: { item: CLMCase }) {
  const isApproved = ["approved", "auto_approved"].includes(item.status);
  const isRejected = ["rejected", "auto_rejected"].includes(item.status);
  const isPending  = ["pending", "reviewing", "resubmission", "escalated"].includes(item.status);

  const Icon = isApproved ? CheckCircle2 : isRejected ? XCircle : isPending ? Clock : AlertTriangle;
  const tone = isApproved ? "text-emerald-600 bg-emerald-50 ring-emerald-200"
    : isRejected ? "text-red-600 bg-red-50 ring-red-200"
    : isPending ? "text-amber-600 bg-amber-50 ring-amber-200"
    : "text-slate-500 bg-slate-50 ring-slate-200";

  return (
    <li className="relative">
      <span className={`absolute -left-[22px] top-0 w-4 h-4 rounded-full ring-2 flex items-center justify-center ${tone}`}>
        <Icon className="w-2.5 h-2.5" />
      </span>
      <Link
        href={`/crm/clm/cases/${item.id}`}
        className="block rounded-md hover:bg-slate-50 px-2 py-1 -mx-2"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-[11px] tabular-nums text-slate-700 font-semibold truncate">
              {item.caseNo}
            </span>
            <CaseTypeBadge type={item.type} />
          </div>
          <span className="text-[10px] text-slate-400 tabular-nums whitespace-nowrap">
            {fmtDate(item.createdAt)}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
          {item.status.replace(/_/g, " ")}
          {item.reviewedBy ? ` · ${item.reviewedBy}` : ""}
        </p>
      </Link>
    </li>
  );
}
