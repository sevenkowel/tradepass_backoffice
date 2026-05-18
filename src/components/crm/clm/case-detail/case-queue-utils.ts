/**
 * Case 队列工具函数 — 给 "Approve & Next" / "Reject & Next" 等串行审批
 * 流程提供"下一个待审 case"查询能力。
 *
 * 从 queue-sidebar.tsx 抽出（左栏 MY QUEUE 组件被删除后保留的必要逻辑）。
 */

import { caseService } from "@/lib/clm/services";
import type { CLMCase } from "@/types/clm";
import { computeSLA } from "@/components/crm/clm/case-detail/bits";

/** SLA 紧迫度排序：overdue > urgent > normal；同档按到期时间正序。 */
function sortBySla(items: CLMCase[]): CLMCase[] {
  const rank = (s: CLMCase) => {
    const info = computeSLA(s.slaDueAt);
    if (info.overdue) return 0;
    if (info.urgent) return 1;
    return 2;
  };
  return [...items].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    return new Date(a.slaDueAt ?? a.createdAt).getTime() - new Date(b.slaDueAt ?? b.createdAt).getTime();
  });
}

/**
 * 取 "Approve & Next" / "Reject & Next" 应该跳转的下一个 case ID。
 *   - 优先拉当前审核员的任务；没有 assignee 时拉全队列
 *   - 排除当前 case 本身
 *   - 按 SLA 紧迫度排，返回最靠前的一个
 *
 * 返回 null 表示队列已清空，调用方可以跳回列表页并 toast 提示。
 */
export async function getNextPendingCaseId(
  currentCaseId: string,
  currentAssigneeId?: string,
): Promise<string | null> {
  const params = currentAssigneeId
    ? { assignee: currentAssigneeId, statusIn: ["pending", "reviewing"] as CLMCase["status"][] }
    : { statusIn: ["pending", "reviewing"] as CLMCase["status"][] };
  const res = await caseService.list({ ...params, pageSize: 20 });
  const items = sortBySla(res.items ?? []).filter((it) => it.id !== currentCaseId);
  return items[0]?.id ?? null;
}
