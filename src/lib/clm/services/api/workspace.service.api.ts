/**
 * HTTP-backed implementation of `IWorkspaceService`. See sibling
 * `case.service.api.ts` for the migration recipe.
 */

import type {
  IWorkspaceService,
  WorkspaceData,
  WorkspaceKPI,
  QueueSummaryItem,
  RiskAlert,
  CaseActivity,
} from "../types";
import { clmEndpoint } from "../../config";

function notImplemented(m: string): Error {
  return new Error(`[CLM ApiWorkspaceService.${m}] Not implemented`);
}

class ApiWorkspaceService implements IWorkspaceService {
  async getDashboard(): Promise<WorkspaceData> {
    void clmEndpoint;
    throw notImplemented("getDashboard");
  }
  async getKPI(): Promise<WorkspaceKPI> {
    throw notImplemented("getKPI");
  }
  async getQueueSummary(): Promise<QueueSummaryItem[]> {
    throw notImplemented("getQueueSummary");
  }
  async getRiskAlerts(): Promise<RiskAlert[]> {
    throw notImplemented("getRiskAlerts");
  }
  async getRecentActivity(): Promise<CaseActivity[]> {
    throw notImplemented("getRecentActivity");
  }
}

export const apiWorkspaceService = new ApiWorkspaceService();
