/**
 * HTTP-backed implementation of `ICaseService`.
 *
 * This is a **scaffold**: every method is wired to the right endpoint
 * shape via `clmEndpoint(...)` but throws `NotImplemented` until the
 * backend is reachable. To bring this online:
 *
 *   1. Implement matching routes server-side (or NextJS API routes).
 *   2. Set `NEXT_PUBLIC_CLM_USE_MOCK=false` in `.env`.
 *   3. Replace each `throw notImplemented(...)` with the actual fetch.
 *
 * Keep the function signatures aligned with `MockCaseService` —
 * `services/index.ts` swaps them transparently.
 */

import type {
  ICaseService,
  CLMCase,
  CaseListParams,
  PaginatedResult,
  CaseComment,
  CaseDetail,
} from "../types";
import { clmEndpoint } from "../../config";

function notImplemented(method: string): Error {
  return new Error(
    `[CLM ApiCaseService.${method}] Not implemented — set NEXT_PUBLIC_CLM_USE_MOCK=true or wire the backend route.`
  );
}

class ApiCaseService implements ICaseService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async list(_params: CaseListParams = {}): Promise<PaginatedResult<CLMCase>> {
    // TODO: const res = await fetch(clmEndpoint("/cases?…"));
    void clmEndpoint;
    throw notImplemented("list");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getById(_id: string): Promise<(CLMCase & Partial<CaseDetail>) | null> {
    throw notImplemented("getById");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getMyTasks(_userId: string): Promise<CLMCase[]> {
    throw notImplemented("getMyTasks");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async approve(_id: string, _reviewerId: string, _notes?: string): Promise<void> {
    throw notImplemented("approve");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async reject(_id: string, _reviewerId: string, _reason: string): Promise<void> {
    throw notImplemented("reject");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async requestResubmission(_id: string, _reviewerId: string, _reason: string): Promise<void> {
    throw notImplemented("requestResubmission");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async escalate(_id: string, _reviewerId: string, _reason: string): Promise<void> {
    throw notImplemented("escalate");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async assign(_id: string, _assigneeId: string, _assignedBy: string): Promise<void> {
    throw notImplemented("assign");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async addComment(_id: string, _comment: CaseComment): Promise<void> {
    throw notImplemented("addComment");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async batchApprove(_ids: string[], _reviewerId: string): Promise<void> {
    throw notImplemented("batchApprove");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async batchAssign(_ids: string[], _assigneeId: string, _assignedBy: string): Promise<void> {
    throw notImplemented("batchAssign");
  }
}

export const apiCaseService = new ApiCaseService();
