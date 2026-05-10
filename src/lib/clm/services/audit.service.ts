/**
 * CLM Audit Service — mock implementation.
 *
 * Counterpart to `services/api/audit.service.api.ts`. The factory
 * in `services/index.ts` exports whichever the config selects.
 */
import type { CLMAuditLog, AuditListParams, PaginatedResult } from "@/types/clm";
import type { IAuditService } from "./types";
import { mockAuditLogs } from "../mock";
import { delay } from "@/lib/utils";

class AuditService implements IAuditService {
  private logs = [...mockAuditLogs];

  async list(params: AuditListParams = {}): Promise<PaginatedResult<CLMAuditLog>> {
    await delay(300);
    let result = [...this.logs];

    if (params.actorId) {
      result = result.filter((l) => l.actorId === params.actorId);
    }
    if (params.action) {
      result = result.filter((l) => l.action === params.action);
    }
    if (params.targetType) {
      result = result.filter((l) => l.targetType === params.targetType);
    }
    if (params.targetId) {
      result = result.filter((l) => l.targetId === params.targetId);
    }
    if (params.startDate) {
      result = result.filter((l) => l.createdAt >= params.startDate!);
    }
    if (params.endDate) {
      result = result.filter((l) => l.createdAt <= params.endDate!);
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const start = (page - 1) * pageSize;
    const paginated = result.slice(start, start + pageSize);

    return { items: paginated, total: result.length, page, pageSize };
  }

  async getByCaseId(caseId: string): Promise<CLMAuditLog[]> {
    await delay(200);
    return this.logs
      .filter((l) => l.targetId === caseId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const auditService = new AuditService();
