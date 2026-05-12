/**
 * Re-Verification service — mock implementation.
 *
 * Three pools (requests / templates / rules), each exposed as its own
 * sub-namespace so the page surface stays narrow:
 *
 *   reVerificationService.requests.list({...})
 *   reVerificationService.templates.list()
 *   reVerificationService.rules.list()
 *
 * The big behaviour piece is `requests.create(input)`: per PRD §11 each
 * trigger drawer submission can target N users, and we fan them out
 * into N requests with a shared `reasonText`/restriction/notification.
 *
 * Cancel / approve / reject simulate the lifecycle transitions; in
 * production the case workflow drives them, but the mock service has
 * to mimic it for the UI.
 */
import type {
  ReVerificationCreateInput,
  ReVerificationListParams,
  ReVerificationRequest,
  ReVerificationRule,
  ReVerificationStatus,
  ReVerificationTemplate,
} from "@/types/clm";
import {
  mockReVerificationRequests,
  mockReVerificationRules,
  mockReVerificationTemplates,
} from "../mock";
import { delay } from "@/lib/utils";

interface PaginatedRequests {
  items: ReVerificationRequest[];
  total: number;
  page: number;
  pageSize: number;
}

const requestPool: ReVerificationRequest[] = [...mockReVerificationRequests];
const templatePool: ReVerificationTemplate[] = [...mockReVerificationTemplates];
const rulePool: ReVerificationRule[] = [...mockReVerificationRules];

function nextRequestNo(): string {
  const n = requestPool.length + 1;
  return `RV-2026-${String(n).padStart(6, "0")}`;
}

function nextRequestId(): string {
  const n = requestPool.length + 1;
  return `rvr-${String(n).padStart(3, "0")}`;
}

function isMatching(
  req: ReVerificationRequest,
  params: ReVerificationListParams
): boolean {
  if (params.status) {
    const allowed = Array.isArray(params.status) ? params.status : [params.status];
    if (!allowed.includes(req.status)) return false;
  }
  if (params.type && req.type !== params.type) return false;
  if (params.trigger && req.trigger !== params.trigger) return false;
  if (params.triggerReason && req.triggerReason !== params.triggerReason) return false;
  if (params.userId && req.userId !== params.userId) return false;
  if (params.search?.trim()) {
    const q = params.search.toLowerCase();
    const haystack = [
      req.requestNo,
      req.userName,
      req.userEmail,
      req.userUid,
      req.reasonText,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

/* ------------------------------------------------------------------------- */
/* Requests                                                                  */
/* ------------------------------------------------------------------------- */

const requests = {
  async list(params: ReVerificationListParams = {}): Promise<PaginatedRequests> {
    await delay(150);
    const filtered = requestPool
      .filter((r) => isMatching(r, params))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  },

  async getById(id: string): Promise<ReVerificationRequest | null> {
    await delay(120);
    return requestPool.find((r) => r.id === id) ?? null;
  },

  /**
   * Manual trigger flow — fans out into N requests, one per `userIds[]`.
   * Returns the created requests so the page can announce "created N
   * requests" and link straight into the list view.
   */
  async create(
    input: ReVerificationCreateInput,
    actor: { id: string; name: string },
    /** Optional per-user metadata so we can produce realistic mock rows.
     *  In production the backend resolves user identity from `userIds`. */
    userMeta?: Record<string, { uid: string; name: string; email: string; country: string }>
  ): Promise<ReVerificationRequest[]> {
    await delay(220);
    const created: ReVerificationRequest[] = [];
    const nowIso = new Date().toISOString();
    const validityMs = input.restriction.validityHours * 3_600_000;
    const deadlineAt = new Date(Date.now() + validityMs).toISOString();

    for (const userId of input.userIds) {
      const meta = userMeta?.[userId];
      const row: ReVerificationRequest = {
        id: nextRequestId(),
        requestNo: nextRequestNo(),
        userId,
        userUid: meta?.uid ?? userId,
        userName: meta?.name ?? userId,
        userEmail: meta?.email ?? `${userId}@unknown.local`,
        country: meta?.country ?? "—",
        type: input.type,
        trigger: "manual",
        triggerReason: input.triggerReason,
        reasonText: input.reasonText,
        restriction: input.restriction,
        notification: input.notification,
        status: "notified",
        deadlineAt,
        createdBy: actor.id,
        createdByName: actor.name,
        createdAt: nowIso,
        notifiedAt: nowIso,
      };
      requestPool.unshift(row);
      created.push(row);
    }
    return created;
  },

  async cancel(id: string, _actor: string): Promise<void> {
    await delay(150);
    const idx = requestPool.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const row = requestPool[idx];
    // PRD §22: only pre-submission states can be cancelled. After
    // `submitted`, the operator must drive the linked Case to closure.
    if (row.status !== "notified" && row.status !== "draft") return;
    requestPool[idx] = {
      ...row,
      status: "cancelled",
      resolvedAt: new Date().toISOString(),
    };
  },

  /** Lightweight transition used by the "approve / reject" buttons on a
   *  request detail (proxies the underlying case update in production). */
  async setStatus(
    id: string,
    status: ReVerificationStatus,
    _actor: string
  ): Promise<void> {
    await delay(150);
    const idx = requestPool.findIndex((r) => r.id === id);
    if (idx < 0) return;
    requestPool[idx] = {
      ...requestPool[idx],
      status,
      resolvedAt:
        ["approved", "rejected", "expired", "cancelled"].includes(status)
          ? new Date().toISOString()
          : requestPool[idx].resolvedAt,
    };
  },
};

/* ------------------------------------------------------------------------- */
/* Templates + rules — flat CRUD, mirrors clmConfigService primitives        */
/* ------------------------------------------------------------------------- */

const templates = {
  async list(): Promise<ReVerificationTemplate[]> {
    await delay(100);
    return [...templatePool].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },
  async create(
    input: Omit<ReVerificationTemplate, "id" | "updatedBy" | "updatedAt" | "createdAt">,
    actor: string
  ): Promise<ReVerificationTemplate> {
    await delay(160);
    const nowIso = new Date().toISOString();
    const row: ReVerificationTemplate = {
      ...input,
      id: `rvt-${String(templatePool.length + 1).padStart(3, "0")}`,
      updatedBy: actor,
      updatedAt: nowIso,
      createdAt: nowIso,
    };
    templatePool.unshift(row);
    return row;
  },
  async update(
    id: string,
    patch: Partial<ReVerificationTemplate>,
    actor: string
  ): Promise<void> {
    await delay(140);
    const idx = templatePool.findIndex((t) => t.id === id);
    if (idx < 0) return;
    templatePool[idx] = {
      ...templatePool[idx],
      ...patch,
      updatedBy: actor,
      updatedAt: new Date().toISOString(),
    };
  },
  async remove(id: string): Promise<void> {
    await delay(120);
    const idx = templatePool.findIndex((t) => t.id === id);
    if (idx >= 0) templatePool.splice(idx, 1);
  },
};

const rules = {
  async list(): Promise<ReVerificationRule[]> {
    await delay(100);
    return [...rulePool].sort((a, b) => b.priority - a.priority);
  },
  async create(
    input: Omit<ReVerificationRule, "id" | "updatedBy" | "updatedAt" | "createdAt">,
    actor: string
  ): Promise<ReVerificationRule> {
    await delay(160);
    const nowIso = new Date().toISOString();
    const row: ReVerificationRule = {
      ...input,
      id: `rrv-${String(rulePool.length + 1).padStart(3, "0")}`,
      updatedBy: actor,
      updatedAt: nowIso,
      createdAt: nowIso,
    };
    rulePool.unshift(row);
    return row;
  },
  async update(
    id: string,
    patch: Partial<ReVerificationRule>,
    actor: string
  ): Promise<void> {
    await delay(140);
    const idx = rulePool.findIndex((r) => r.id === id);
    if (idx < 0) return;
    rulePool[idx] = {
      ...rulePool[idx],
      ...patch,
      updatedBy: actor,
      updatedAt: new Date().toISOString(),
    };
  },
  async toggle(id: string, enabled: boolean, actor: string): Promise<void> {
    return rules.update(id, { enabled }, actor);
  },
  async remove(id: string): Promise<void> {
    await delay(120);
    const idx = rulePool.findIndex((r) => r.id === id);
    if (idx >= 0) rulePool.splice(idx, 1);
  },
};

export const reVerificationService = { requests, templates, rules };
export type IReVerificationService = typeof reVerificationService;
