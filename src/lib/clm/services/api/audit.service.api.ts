/**
 * HTTP-backed implementation of `IAuditService`. See sibling
 * `case.service.api.ts` for the migration recipe.
 */

import type {
  IAuditService,
  CLMAuditLog,
  AuditListParams,
  PaginatedResult,
} from "../types";
import { clmEndpoint } from "../../config";

function notImplemented(m: string): Error {
  return new Error(`[CLM ApiAuditService.${m}] Not implemented`);
}

class ApiAuditService implements IAuditService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async list(_params: AuditListParams = {}): Promise<PaginatedResult<CLMAuditLog>> {
    void clmEndpoint;
    throw notImplemented("list");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getByCaseId(_caseId: string): Promise<CLMAuditLog[]> {
    throw notImplemented("getByCaseId");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async log(_entry: Omit<CLMAuditLog, "id" | "auditId" | "createdAt">): Promise<void> {
    throw notImplemented("log");
  }
}

export const apiAuditService = new ApiAuditService();
