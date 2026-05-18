/**
 * 跨客户导航工具 — 给详情页提供 Prev/Next 客户跳转 + Cmd+K 搜索能力。
 */

import { clientService } from "@/lib/crm/services/client.service";

/** 获取当前列表中的相邻客户 ID。返回 null 表示已到边界。 */
export async function getAdjacentClientId(
  currentClientId: string,
  direction: "prev" | "next",
): Promise<string | null> {
  // 拉前 100 个客户作为"队列"——足以覆盖运营单天工作量
  const res = await clientService.list({ pageSize: 100 });
  const items = res.items ?? [];
  const idx = items.findIndex((c) => c.id === currentClientId);
  if (idx === -1) return null;
  if (direction === "next") return items[idx + 1]?.id ?? null;
  return items[idx - 1]?.id ?? null;
}

/** 返回当前客户在列表中的位置（1-based）+ 总数，用于显示 "3 / 24"。 */
export async function getClientQueuePosition(
  currentClientId: string,
): Promise<{ position: number; total: number } | null> {
  const res = await clientService.list({ pageSize: 100 });
  const items = res.items ?? [];
  const idx = items.findIndex((c) => c.id === currentClientId);
  if (idx === -1) return null;
  return { position: idx + 1, total: items.length };
}

/** Cmd+K 搜索 — 模糊匹配 name / uid / email / phone。 */
export async function searchClients(query: string, limit = 12): Promise<{
  id: string;
  uid: string;
  name: string;
  email: string;
  country?: string;
  status: string;
}[]> {
  const q = query.trim();
  if (!q) {
    // 空 query 时返回最近的客户（按 createdAt 倒序，pageSize 个）
    const res = await clientService.list({ pageSize: limit });
    return (res.items ?? []).map((c) => ({
      id: c.id,
      uid: c.uid,
      name: c.name,
      email: c.email,
      country: c.country,
      status: c.status,
    }));
  }
  const res = await clientService.list({ search: q, pageSize: limit });
  return (res.items ?? []).map((c) => ({
    id: c.id,
    uid: c.uid,
    name: c.name,
    email: c.email,
    country: c.country,
    status: c.status,
  }));
}
