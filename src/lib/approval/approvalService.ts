/**
 * Approval Center - Service Layer
 * 统一服务层：封装所有审批业务逻辑，供 UI 和 Mock API 调用
 */

import type {
  ApprovalTask,
  TaskType,
  WorkflowStatus,
  ApprovalAction,
  Reviewer,
  TaskListQuery,
  BatchOperationRequest,
  BatchOperationResult,
  ApprovalStats,
  TeamPerformance,
  AuditEntry,
  ApprovalCallback,
  BusinessModuleIntegration,
  SlaSnapshot,
  RiskLevel,
} from "@/types/approval";
import { WorkflowEngine, createDefaultWorkflowConfig } from "./workflowEngine";
import { SlaEngine, slaEngine } from "./slaEngine";
import { RoutingEngine, routingEngine } from "./routingEngine";
import { mockTasks, mockReviewers, mockAuditTrail, generateMockTask } from "./mockData";

// ============================================
// Approval Service
// ============================================

class ApprovalService {
  private tasks: Map<string, ApprovalTask> = new Map();
  private reviewers: Map<string, Reviewer> = new Map();
  private auditLogs: AuditEntry[] = [];
  private integrations: Map<string, BusinessModuleIntegration> = new Map();
  private currentReviewerId: string = "reviewer-1";

  private workflowEngine: WorkflowEngine;
  private slaEngine: SlaEngine;
  private routingEngine: RoutingEngine;

  constructor() {
    this.workflowEngine = new WorkflowEngine();
    this.slaEngine = slaEngine;
    this.routingEngine = routingEngine;

    // 初始化 mock 数据
    for (const t of mockTasks) this.tasks.set(t.id, t);
    for (const r of mockReviewers) this.reviewers.set(r.id, r);
    this.auditLogs = [...mockAuditTrail];
  }

  // ============================================
  // 当前用户
  // ============================================

  setCurrentReviewer(id: string) {
    this.currentReviewerId = id;
  }

  getCurrentReviewer(): Reviewer | undefined {
    return this.reviewers.get(this.currentReviewerId);
  }

  // ============================================
  // 任务 CRUD
  // ============================================

  getTask(id: string): ApprovalTask | undefined {
    return this.tasks.get(id);
  }

  getTasks(query?: TaskListQuery): {
    items: ApprovalTask[];
    total: number;
    page: number;
    pageSize: number;
  } {
    let items = Array.from(this.tasks.values());

    if (query) {
      // 类型过滤
      if (query.type) {
        const types = Array.isArray(query.type) ? query.type : [query.type];
        items = items.filter((t) => types.includes(t.type));
      }
      // 状态过滤
      if (query.status) {
        const statuses = Array.isArray(query.status) ? query.status : [query.status];
        items = items.filter((t) => statuses.includes(t.status));
      }
      // 风险等级
      if (query.riskLevel) {
        const levels = Array.isArray(query.riskLevel) ? query.riskLevel : [query.riskLevel];
        items = items.filter((t) => levels.includes(t.riskLevel));
      }
      // 模块过滤
      if (query.module) {
        const modules = Array.isArray(query.module) ? query.module : [query.module];
        items = items.filter((t) => modules.includes(t.module));
      }
      // 指派人
      if (query.assignee) {
        switch (query.assignee) {
          case "me":
            items = items.filter((t) => t.assigneeId === this.currentReviewerId);
            break;
          case "unassigned":
            items = items.filter((t) => !t.assigneeId);
            break;
        }
      }
      // SLA 状态
      if (query.slaStatus) {
        const slaStatuses = Array.isArray(query.slaStatus) ? query.slaStatus : [query.slaStatus];
        items = items.filter((t) => {
          const snap = this.slaEngine.computeSnapshot(t);
          return slaStatuses.includes(snap.status);
        });
      }
      // 搜索
      if (query.search) {
        const q = query.search.toLowerCase();
        items = items.filter(
          (t) =>
            t.id.toLowerCase().includes(q) ||
            t.userName.toLowerCase().includes(q) ||
            t.userUid.toLowerCase().includes(q) ||
            t.subject.toLowerCase().includes(q)
        );
      }
      // 国家
      if (query.country) {
        items = items.filter((t) => t.userCountry === query.country);
      }
      // 日期
      if (query.dateFrom) {
        items = items.filter((t) => t.createdAt >= query.dateFrom!);
      }
      if (query.dateTo) {
        items = items.filter((t) => t.createdAt <= query.dateTo!);
      }
      // 排序
      const sortBy = query.sortBy ?? "createdAt";
      const sortOrder = query.sortOrder ?? "desc";
      items.sort((a, b) => {
        const va = sortBy === "riskScore" ? (a.riskScore ?? 0) : a[sortBy];
        const vb = sortBy === "riskScore" ? (b.riskScore ?? 0) : b[sortBy];
        if (va < vb) return sortOrder === "asc" ? -1 : 1;
        if (va > vb) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    const paginated = items.slice(start, start + pageSize);

    return { items: paginated, total: items.length, page, pageSize };
  }

  // ============================================
  // 快捷视图
  // ============================================

  getMyTasks(query?: Omit<TaskListQuery, "assignee">) {
    return this.getTasks({ ...query, assignee: "me" });
  }

  getPendingQueue(query?: Omit<TaskListQuery, "status" | "assignee">) {
    return this.getTasks({ ...query, status: "pending", assignee: "unassigned" });
  }

  getSlaWarningTasks(query?: TaskListQuery) {
    const all = this.getTasks(query);
    const filtered = all.items.filter((t) => {
      const snap = this.slaEngine.computeSnapshot(t);
      return snap.status === "warning" || snap.status === "critical" || snap.status === "timeout";
    });
    return { ...all, items: filtered, total: filtered.length };
  }

  getHighRiskTasks(query?: Omit<TaskListQuery, "riskLevel">) {
    return this.getTasks({ ...query, riskLevel: ["high", "critical"] });
  }

  /* v2: `escalated` is a tag, not a status. Filter by tag at the
   * service boundary; the result still matches the v1 "show me
   * escalated tasks" intent for any caller that hasn't migrated. */
  getEscalatedTasks(query?: TaskListQuery) {
    const all = this.getTasks(query);
    const filtered = all.items.filter((t) => t.tags?.includes("escalated"));
    return { ...all, items: filtered, total: filtered.length };
  }

  getReVerificationTasks(query?: Omit<TaskListQuery, "type">) {
    return this.getTasks({ ...query, type: "re_verification" });
  }

  // ============================================
  // 审批操作
  // ============================================

  performAction(
    taskId: string,
    action: ApprovalAction,
    options?: { note?: string; reason?: string; assignToId?: string }
  ): { success: boolean; task?: ApprovalTask; error?: string } {
    const task = this.tasks.get(taskId);
    if (!task) return { success: false, error: "Task not found" };

    const actor = this.getCurrentReviewer();
    if (!actor) return { success: false, error: "No current reviewer" };

    const engine = new WorkflowEngine(createDefaultWorkflowConfig(task.type));
    const result = engine.execute(task, action, actor, options);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    let newTask = result.newTask;

    // transfer 特殊处理
    if (action === "transfer" && options?.assignToId) {
      const target = this.reviewers.get(options.assignToId);
      if (target) {
        newTask.assigneeId = target.id;
        newTask.assigneeName = target.name;
        newTask.assigneeRole = target.role;
      }
    }

    // 更新存储
    this.tasks.set(taskId, newTask);

    // 记录审计
    this.logAudit({
      taskId,
      taskType: task.type,
      operatorId: actor.id,
      operatorName: actor.name,
      operatorRole: actor.role,
      action,
      actionLabel: this.getActionLabel(action),
      oldStatus: task.status,
      newStatus: newTask.status,
      note: options?.note,
      reason: options?.reason,
    });

    // 触发回调
    if (engine.isTerminal(newTask.status)) {
      this.triggerCallback(newTask);
    }

    return { success: true, task: newTask };
  }

  /** 批量操作 */
  batchPerform(request: BatchOperationRequest): BatchOperationResult {
    const success: string[] = [];
    const failed: BatchOperationResult["failed"] = [];

    for (const taskId of request.taskIds) {
      const result = this.performAction(taskId, request.action, {
        note: request.note,
        reason: request.reason,
      });
      if (result.success) {
        success.push(taskId);
      } else {
        failed.push({ taskId, reason: result.error ?? "Unknown error" });
      }
    }

    // 批量审计
    if (success.length > 0) {
      const actor = this.getCurrentReviewer();
      if (actor) {
        this.logAudit({
          taskId: `batch-${Date.now()}`,
          taskType: "kyc",
          operatorId: actor.id,
          operatorName: actor.name,
          operatorRole: actor.role,
          action: request.action,
          actionLabel: `Batch ${this.getActionLabel(request.action)} (${success.length} tasks)`,
          oldStatus: "pending",
          newStatus: request.action === "approve" ? "approved" : "rejected",
          note: `Batch operation on ${success.length} tasks`,
        });
      }
    }

    return { success, failed };
  }

  /** 创建任务 */
  createTask(partial: Partial<ApprovalTask>): ApprovalTask {
    const task = generateMockTask(partial);

    // 自动路由
    const route = this.routingEngine.route(task);
    if (route.assigned) {
      task.assigneeId = route.assigneeId;
      task.assigneeName = route.assigneeName;
      task.assigneeRole = route.assigneeRole;
    }

    // 自动审批检查
    const engine = new WorkflowEngine(createDefaultWorkflowConfig(task.type));
    const autoCheck = engine.checkAutoApprove(task);
    if (autoCheck.autoApproved) {
      task.status = "approved";
      task.resolvedAt = task.createdAt;
      task.resolutionNote = `Auto-approved by rule: ${autoCheck.matchedRule?.name}`;
    }

    this.tasks.set(task.id, task);
    return task;
  }

  // ============================================
  // 审计
  // ============================================

  private logAudit(partial: Omit<AuditEntry, "id" | "timestamp">) {
    const entry: AuditEntry = {
      ...partial,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
  }

  getAuditTrail(taskId?: string): AuditEntry[] {
    if (taskId) {
      return this.auditLogs.filter((a) => a.taskId === taskId);
    }
    return this.auditLogs;
  }

  // ============================================
  // SLA
  // ============================================

  getSlaSnapshot(taskId: string): SlaSnapshot | undefined {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;
    return this.slaEngine.computeSnapshot(task);
  }

  // ============================================
  // 统计
  // ============================================

  getStats(): ApprovalStats {
    const all = Array.from(this.tasks.values());
    const today = new Date().toISOString().slice(0, 10);

    const todayResolved = all.filter(
      (t) => t.resolvedAt && t.resolvedAt.startsWith(today)
    );

    const typeBreakdown: Record<string, number> = {};
    const riskBreakdown: Record<string, number> = {};

    for (const t of all) {
      typeBreakdown[t.type] = (typeBreakdown[t.type] ?? 0) + 1;
      riskBreakdown[t.riskLevel] = (riskBreakdown[t.riskLevel] ?? 0) + 1;
    }

    // SLA 合规率
    const nonTerminal = all.filter((t) => !["approved", "rejected"].includes(t.status));
    const overdueCount = nonTerminal.filter((t) => {
      const snap = this.slaEngine.computeSnapshot(t);
      return snap.isOverdue;
    }).length;

    // 平均处理时间
    const resolvedWithTime = all.filter((t) => t.resolvedAt && t.claimedAt);
    const totalMinutes = resolvedWithTime.reduce((sum, t) => {
      const start = new Date(t.claimedAt!).getTime();
      const end = new Date(t.resolvedAt!).getTime();
      return sum + (end - start) / 60000;
    }, 0);

    return {
      todayProcessed: todayResolved.length,
      todayApproved: todayResolved.filter((t) => t.status === "approved").length,
      todayRejected: todayResolved.filter((t) => t.status === "rejected").length,
      avgProcessingMinutes: resolvedWithTime.length > 0 ? Math.round(totalMinutes / resolvedWithTime.length) : 0,
      overdueRate: nonTerminal.length > 0 ? Math.round((overdueCount / nonTerminal.length) * 1000) / 10 : 0,
      typeBreakdown: typeBreakdown as any,
      riskBreakdown: riskBreakdown as any,
      slaComplianceRate: nonTerminal.length > 0 ? Math.round(((nonTerminal.length - overdueCount) / nonTerminal.length) * 1000) / 10 : 100,
      escalationRate: Math.round((all.filter((t) => t.tags?.includes("escalated")).length / all.length) * 1000) / 10,
    };
  }

  getTeamPerformance(): TeamPerformance[] {
    return Array.from(this.reviewers.values()).map((r) => {
      const reviewerTasks = Array.from(this.tasks.values()).filter(
        (t) => t.assigneeId === r.id && t.resolvedAt
      );
      const total = reviewerTasks.length;
      const approved = reviewerTasks.filter((t) => t.status === "approved").length;
      const rejected = reviewerTasks.filter((t) => t.status === "rejected").length;

      const times = reviewerTasks
        .filter((t) => t.claimedAt)
        .map((t) => (new Date(t.resolvedAt!).getTime() - new Date(t.claimedAt!).getTime()) / 60000);
      const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

      return {
        reviewerId: r.id,
        reviewerName: r.name,
        role: r.role,
        totalProcessed: total,
        approvedCount: approved,
        rejectedCount: rejected,
        avgProcessingMinutes: Math.round(avgTime),
        slaComplianceRate: total > 0 ? 95 : 100, // simplified
        activeTasks: r.activeTaskCount,
      };
    });
  }

  // ============================================
  // 集成
  // ============================================

  registerIntegration(integration: BusinessModuleIntegration) {
    this.integrations.set(integration.module, integration);
  }

  private async triggerCallback(task: ApprovalTask) {
    const integration = this.integrations.get(task.module);
    if (!integration) return;

    const callback: ApprovalCallback = {
      taskId: task.id,
      sourceId: task.sourceId,
      module: task.module,
      type: task.type,
      result: task.status as any,
      reviewerId: task.resolvedBy ?? "system",
      reviewerName: task.assigneeName ?? "System",
      note: task.resolutionNote,
      resolvedAt: task.resolvedAt!,
    };

    try {
      await integration.onComplete(callback);
    } catch {
      // callback failure should not break the flow
    }
  }

  // ============================================
  // 辅助
  // ============================================

  private getActionLabel(action: ApprovalAction): string {
    const map: Record<ApprovalAction, string> = {
      claim: "Claim",
      hold: "Hold",
      approve: "Approve",
      reject: "Reject",
      request_re_submit: "Request Re-submit",
      request_additional_docs: "Request Additional Docs",
      transfer: "Transfer",
      escalate: "Escalate",
      release: "Release",
    };
    return map[action] ?? action;
  }
}

// 导出单例
export const approvalService = new ApprovalService();
