import type { ApprovalItem, ApprovalListParams, ApprovalSummary } from "@/types/approval";
import { MOCK_APPROVALS } from "./mock";

// In-memory store so mutations (approve/reject/hold) persist within the session.
let pool: ApprovalItem[] = MOCK_APPROVALS.map((i) => ({ ...i }));

function isOverdue(item: ApprovalItem): boolean {
  if (!item.slaDueAt) return false;
  return new Date(item.slaDueAt).getTime() < Date.now();
}

function slaMs(item: ApprovalItem): number {
  if (!item.slaDueAt) return Infinity;
  return new Date(item.slaDueAt).getTime() - Date.now();
}

function matchesSla(
  item: ApprovalItem,
  slaStatus?: ApprovalListParams["slaStatus"]
): boolean {
  if (!slaStatus || slaStatus === "all") return true;
  const ms = slaMs(item);
  if (slaStatus === "overdue") return ms < 0;
  if (slaStatus === "urgent")  return ms >= 0 && ms < 3_600_000;
  if (slaStatus === "normal")  return ms >= 3_600_000;
  return true;
}

export const approvalService = {
  list(params: ApprovalListParams = {}): { items: ApprovalItem[]; total: number } {
    const {
      type, status, riskLevel, slaStatus,
      search, page = 1, pageSize = 50,
    } = params;

    let items = pool.filter((item) => {
      if (type && type !== "all" && item.type !== type) return false;

      if (status) {
        const statuses = Array.isArray(status) ? status : [status];
        if (!statuses.includes(item.status)) return false;
      }

      if (riskLevel && riskLevel !== "all" && item.riskLevel !== riskLevel) return false;
      if (!matchesSla(item, slaStatus)) return false;

      if (search) {
        const q = search.toLowerCase();
        if (
          !item.userName.toLowerCase().includes(q) &&
          !item.userUid.includes(q) &&
          !item.subject.toLowerCase().includes(q)
        ) return false;
      }

      return true;
    });

    // Sort: overdue first, then by SLA ascending, then createdAt desc.
    items = items.slice().sort((a, b) => {
      const aMs = slaMs(a);
      const bMs = slaMs(b);
      const aOver = aMs < 0;
      const bOver = bMs < 0;
      if (aOver !== bOver) return aOver ? -1 : 1;
      return aMs - bMs;
    });

    const total = items.length;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total };
  },

  getSummary(): ApprovalSummary {
    const active = pool.filter((i) => i.status !== "on_hold");
    const count = (type: ApprovalItem["type"]) => ({
      pending: pool.filter((i) => i.type === type && ["pending", "in_review"].includes(i.status)).length,
      overdue: active.filter((i) => i.type === type && isOverdue(i)).length,
    });
    return { kyc: count("kyc"), deposit: count("deposit"), withdrawal: count("withdrawal") };
  },

  /** Total pending + in_review across all types (for sidebar badge). */
  getTotalPending(): number {
    return pool.filter((i) => ["pending", "in_review"].includes(i.status)).length;
  },

  async approve(id: string, _reviewerId: string, _note?: string): Promise<void> {
    await delay(300);
    const idx = pool.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error("Approval item not found");
    pool = pool.filter((i) => i.id !== id);
  },

  async reject(id: string, _reviewerId: string, _reason: string): Promise<void> {
    await delay(300);
    const idx = pool.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error("Approval item not found");
    pool = pool.filter((i) => i.id !== id);
  },

  async hold(id: string, _reviewerId: string): Promise<void> {
    await delay(200);
    const idx = pool.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error("Approval item not found");
    pool[idx] = { ...pool[idx], status: "on_hold" };
  },
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
