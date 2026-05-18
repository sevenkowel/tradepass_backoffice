/**
 * Unified Audit Trail aggregator.
 *
 * Pulls from every domain that emits audit records and projects each to
 * `GlobalAuditLog`. Used by:
 *   - `/crm/approvals/audit-trail` (the "global" timeline view)
 *   - Client Detail Logs tab (filtered by `clientId`)
 *   - Case Detail history strip (filtered by `targetId`)
 *
 * Mock today; the factory will hand off to an HTTP backend once it lands.
 * UI never imports the underlying producers — only `globalAuditService`.
 */
import type { GlobalAuditLog, GlobalAuditListParams } from "@/types/core";
import { mockAuditLogs as mockClmAuditLogs } from "@/lib/clm/mock";
import { mockAuditLogs as mockClientAuditLogs } from "@/lib/crm/mock-client-detail";
import { clmAuditToGlobal, clientAuditToGlobal } from "./adapters";
import { mockCrossDomainAudit } from "./mock-cross-domain";

export interface PaginatedAudit {
  items: GlobalAuditLog[];
  total: number;
  page: number;
  pageSize: number;
}

/** All known audit logs in one chronological pool (most recent first).
 *  Memoised at module load — mocks are static. */
let _pool: GlobalAuditLog[] | null = null;
function getPool(): GlobalAuditLog[] {
  if (_pool) return _pool;
  const fromClm = mockClmAuditLogs.map(clmAuditToGlobal);
  const fromClient = mockClientAuditLogs.map(clientAuditToGlobal);
  const merged = [...fromClm, ...fromClient, ...mockCrossDomainAudit];
  merged.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  _pool = merged;
  return _pool;
}

/** Reset the memoised pool — useful in tests. */
export function _resetAuditPool() {
  _pool = null;
}

function matchesSearch(log: GlobalAuditLog, q: string): boolean {
  const haystack = [
    log.actionLabel,
    log.action,
    log.actor.name,
    log.actor.role,
    log.target.name,
    log.target.id,
    log.auditId,
    log.description,
    log.reason,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q.toLowerCase());
}

export const globalAuditService = {
  async list(params: GlobalAuditListParams = {}): Promise<PaginatedAudit> {
    let result = [...getPool()];

    if (params.domain) result = result.filter((l) => l.domain === params.domain);
    if (params.severity) result = result.filter((l) => l.severity === params.severity);
    if (params.action) result = result.filter((l) => l.action === params.action);
    if (params.actorId) result = result.filter((l) => l.actor.id === params.actorId);
    if (params.clientId)
      result = result.filter(
        (l) => l.clientId === params.clientId || l.target.id === params.clientId
      );
    if (params.targetKind)
      result = result.filter((l) => l.target.kind === params.targetKind);
    if (params.targetId) result = result.filter((l) => l.target.id === params.targetId);
    if (params.startDate)
      result = result.filter((l) => l.createdAt >= params.startDate!);
    if (params.endDate) result = result.filter((l) => l.createdAt <= params.endDate!);
    if (params.search?.trim()) result = result.filter((l) => matchesSearch(l, params.search!));

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return {
      items: result.slice(start, start + pageSize),
      total: result.length,
      page,
      pageSize,
    };
  },

  /** Convenience: every record relating to a single client (audit, system, etc). */
  async listForClient(clientId: string, limit = 50): Promise<GlobalAuditLog[]> {
    const pool = getPool();
    return pool
      .filter((l) => l.clientId === clientId || l.target.id === clientId)
      .slice(0, limit);
  },

  /** Convenience: every record relating to a single case. */
  async listForCase(caseId: string, limit = 50): Promise<GlobalAuditLog[]> {
    const pool = getPool();
    return pool
      .filter((l) => l.target.kind === "case" && l.target.id === caseId)
      .slice(0, limit);
  },

  /** Push a runtime audit event into the pool so all readers see it
   *  immediately — no page reload needed. Best-effort: never throws. */
  log(entry: Omit<GlobalAuditLog, "id" | "createdAt">): void {
    try {
      const pool = getPool();
      const now = new Date();
      const seq = pool.length.toString(36).padStart(4, "0").toUpperCase();
      const stamp = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
      const record: GlobalAuditLog = {
        id: crypto.randomUUID(),
        auditId: `AUD-${stamp}-${seq}`,
        createdAt: now.toISOString(),
        ...entry,
      };
      pool.unshift(record);
    } catch (e) {
      console.warn("[globalAuditService.log]", e);
    }
  },
};
