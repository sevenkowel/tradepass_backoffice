/**
 * CLM Workspace Service
 * Dashboard data and KPIs
 */
import type { WorkspaceData, WorkspaceKPI, QueueSummaryItem, RiskAlert, CaseActivity } from "@/types/clm";
import { mockWorkspaceKPI, mockQueueSummary, mockRiskAlerts, mockRecentActivity, mockMyTasks } from "../mock";
import { delay } from "@/lib/utils";

class WorkspaceService {
  async getDashboard(): Promise<WorkspaceData> {
    await delay(300);
    return {
      kpi: mockWorkspaceKPI,
      queueSummary: mockQueueSummary,
      riskAlerts: mockRiskAlerts,
      myTasks: mockMyTasks,
      recentActivity: mockRecentActivity,
    };
  }

  async getKPI(): Promise<WorkspaceKPI> {
    await delay(200);
    return mockWorkspaceKPI;
  }

  async getQueueSummary(): Promise<QueueSummaryItem[]> {
    await delay(200);
    return mockQueueSummary;
  }

  async getRiskAlerts(): Promise<RiskAlert[]> {
    await delay(200);
    return mockRiskAlerts;
  }

  async getRecentActivity(): Promise<CaseActivity[]> {
    await delay(200);
    return mockRecentActivity;
  }
}

export const workspaceService = new WorkspaceService();
