/**
 * Approval Center - Workflow Engine
 * 核心状态机：管理审批任务的状态转换、权限校验、自动化规则
 */

import type {
  ApprovalTask,
  WorkflowStatus,
  ApprovalAction,
  StateTransition,
  WorkflowConfig,
  Reviewer,
  ApprovalRole,
  AutoApproveRule,
  RiskLevel,
} from "@/types/approval";

// ============================================
// 默认状态转换规则
// ============================================

/* v2 transition table — status axis is just `pending | on_hold |
 * approved | rejected`. Actions that used to push to a derivative
 * state (`escalated`, `re_submitted`, `additional_docs_requested`,
 * `in_review`) now keep the status the same and let the service
 * layer flip the corresponding `tags` entry alongside.
 *
 * In practice that means:
 *   - claim    → stay `pending`, set `assigneeId`, add tag `claimed`
 *   - escalate → stay `pending`, add tag `escalated`
 *   - request_re_submit       → go `on_hold`, add `awaiting_user` + `resubmitted`
 *   - request_additional_docs → go `on_hold`, add `awaiting_user` + `docs_requested`
 *   - release  → stay `pending`, clear `claimed` (assignee dropped by service)
 * The transitions below cover only the lifecycle axis; the service
 * applies tag mutations as a side-effect of the same action.
 */
export const DEFAULT_TRANSITIONS: StateTransition[] = [
  // pending → terminal / on_hold
  { from: "pending", action: "claim",    to: "pending",  requiresNote: false },
  { from: "pending", action: "transfer", to: "pending",  requiresNote: true  },
  { from: "pending", action: "escalate", to: "pending",  requiresNote: true  },
  { from: "pending", action: "release",  to: "pending",  requiresNote: false },
  { from: "pending", action: "approve",  to: "approved", requiresNote: false },
  { from: "pending", action: "reject",   to: "rejected", requiresNote: true, requiresReason: true },
  { from: "pending", action: "hold",     to: "on_hold",  requiresNote: true  },
  { from: "pending", action: "request_re_submit",       to: "on_hold", requiresNote: true, requiresReason: true },
  { from: "pending", action: "request_additional_docs", to: "on_hold", requiresNote: true },

  // on_hold → resume or terminate
  { from: "on_hold", action: "claim",    to: "on_hold",  requiresNote: false },
  { from: "on_hold", action: "approve",  to: "approved", requiresNote: false },
  { from: "on_hold", action: "reject",   to: "rejected", requiresNote: true, requiresReason: true },
  { from: "on_hold", action: "transfer", to: "on_hold",  requiresNote: true  },
  { from: "on_hold", action: "release",  to: "pending",  requiresNote: false },
  { from: "on_hold", action: "escalate", to: "on_hold",  requiresNote: true  },
];

// 终态（不可再操作）
export const TERMINAL_STATUSES: WorkflowStatus[] = ["approved", "rejected"];

// ============================================
// Workflow Engine
// ============================================

export class WorkflowEngine {
  private config: WorkflowConfig;

  constructor(config?: Partial<WorkflowConfig>) {
    this.config = {
      id: config?.id ?? "default",
      name: config?.name ?? "Default Workflow",
      taskType: config?.taskType ?? "kyc",
      transitions: config?.transitions ?? DEFAULT_TRANSITIONS,
      initialStatus: config?.initialStatus ?? "pending",
      allowBatch: config?.allowBatch ?? true,
      autoApproveRules: config?.autoApproveRules ?? [],
    };
  }

  /** 获取当前配置 */
  getConfig(): WorkflowConfig {
    return { ...this.config };
  }

  /** 查找匹配的状态转换 */
  findTransition(
    currentStatus: WorkflowStatus,
    action: ApprovalAction
  ): StateTransition | undefined {
    return this.config.transitions.find((t) => {
      const fromArr = Array.isArray(t.from) ? t.from : [t.from];
      return fromArr.includes(currentStatus) && t.action === action;
    });
  }

  /** 判断某个操作在当前状态下是否允许 */
  canPerform(
    task: ApprovalTask,
    action: ApprovalAction,
    actor?: Reviewer
  ): { allowed: boolean; reason?: string } {
    // 终态检查
    if (TERMINAL_STATUSES.includes(task.status)) {
      return { allowed: false, reason: "Task is already in terminal state" };
    }

    const transition = this.findTransition(task.status, action);
    if (!transition) {
      return {
        allowed: false,
        reason: `Action '${action}' is not allowed from status '${task.status}'`,
      };
    }

    // 权限检查
    if (transition.requiredRole && actor) {
      const hasRole = transition.requiredRole.includes(actor.role);
      if (!hasRole) {
        return {
          allowed: false,
          reason: `Requires role: ${transition.requiredRole.join(" or ")}`,
        };
      }
    }

    // 自定义校验
    if (transition.validate) {
      const result = transition.validate(task, actor!);
      if (typeof result === "string") {
        return { allowed: false, reason: result };
      }
      if (!result) {
        return { allowed: false, reason: "Validation failed" };
      }
    }

    return { allowed: true };
  }

  /** 获取某个状态下允许的所有操作 */
  getAllowedActions(
    task: ApprovalTask,
    actor?: Reviewer
  ): { action: ApprovalAction; requiresNote: boolean; requiresReason: boolean }[] {
    if (TERMINAL_STATUSES.includes(task.status)) return [];

    const actions = new Map<
      ApprovalAction,
      { requiresNote: boolean; requiresReason: boolean }
    >();

    for (const t of this.config.transitions) {
      const fromArr = Array.isArray(t.from) ? t.from : [t.from];
      if (!fromArr.includes(task.status)) continue;

      // 权限过滤
      if (t.requiredRole && actor) {
        if (!t.requiredRole.includes(actor.role)) continue;
      }

      const existing = actions.get(t.action);
      if (!existing || (t.requiresNote && !existing.requiresNote)) {
        actions.set(t.action, {
          requiresNote: t.requiresNote ?? false,
          requiresReason: t.requiresReason ?? false,
        });
      }
    }

    return Array.from(actions.entries()).map(([action, meta]) => ({
      action,
      ...meta,
    }));
  }

  /** 执行状态转换 */
  execute(
    task: ApprovalTask,
    action: ApprovalAction,
    actor: Reviewer,
    options?: { note?: string; reason?: string }
  ): { success: boolean; newTask: ApprovalTask; error?: string } {
    const check = this.canPerform(task, action, actor);
    if (!check.allowed) {
      return { success: false, newTask: task, error: check.reason };
    }

    const transition = this.findTransition(task.status, action)!;

    // 必填校验
    if (transition.requiresNote && !options?.note) {
      return {
        success: false,
        newTask: task,
        error: "Note is required for this action",
      };
    }
    if (transition.requiresReason && !options?.reason) {
      return {
        success: false,
        newTask: task,
        error: "Reason is required for this action",
      };
    }

    const now = new Date().toISOString();
    const newTask: ApprovalTask = {
      ...task,
      status: transition.to,
      previousStatus: task.status,
      updatedAt: now,
    };

    // 根据动作更新特定字段
    switch (action) {
      case "claim":
        newTask.assigneeId = actor.id;
        newTask.assigneeName = actor.name;
        newTask.assigneeRole = actor.role;
        newTask.claimedAt = now;
        break;
      case "release":
        newTask.assigneeId = undefined;
        newTask.assigneeName = undefined;
        newTask.assigneeRole = undefined;
        newTask.claimedAt = undefined;
        break;
      case "hold":
        newTask.heldAt = now;
        break;
      case "escalate":
        newTask.escalatedAt = now;
        break;
      case "approve":
      case "reject":
        newTask.resolvedAt = now;
        newTask.resolvedBy = actor.id;
        newTask.resolutionNote = options?.note;
        break;
      case "transfer":
        // transfer 时更新 assignee（实际由外部传入）
        break;
    }

    return { success: true, newTask };
  }

  /** 自动审批检查 */
  checkAutoApprove(task: ApprovalTask): { autoApproved: boolean; matchedRule?: AutoApproveRule } {
    for (const rule of this.config.autoApproveRules ?? []) {
      if (this.matchesAutoApproveRule(task, rule)) {
        return { autoApproved: true, matchedRule: rule };
      }
    }
    return { autoApproved: false };
  }

  private matchesAutoApproveRule(task: ApprovalTask, rule: AutoApproveRule): boolean {
    const c = rule.condition;
    if (c.riskLevel && !c.riskLevel.includes(task.riskLevel)) return false;
    if (c.riskScoreBelow !== undefined && (task.riskScore ?? 100) >= c.riskScoreBelow) return false;
    if (c.amountBelow !== undefined && (task.amount ?? 0) >= c.amountBelow) return false;
    if (c.currency && task.currency !== c.currency) return false;
    if (c.userTier && !c.userTier.includes(task.userTier ?? "")) return false;
    if (c.flagsAbsent && task.riskFlags) {
      for (const flag of c.flagsAbsent) {
        if (task.riskFlags.includes(flag)) return false;
      }
    }
    return true;
  }

  /** 判断是否为终态 */
  isTerminal(status: WorkflowStatus): boolean {
    return TERMINAL_STATUSES.includes(status);
  }
}

// ============================================
// 预设 Workflow Config
// ============================================

export function createDefaultWorkflowConfig(taskType: string): WorkflowConfig {
  return {
    id: `wf-${taskType}`,
    name: `${taskType} Workflow`,
    taskType: taskType as any,
    transitions: DEFAULT_TRANSITIONS,
    initialStatus: "pending",
    allowBatch: true,
    autoApproveRules: [
      // 低风险 + 无风险标记 = 自动通过
      {
        id: "auto-1",
        name: "Low Risk Auto Approve",
        condition: {
          riskLevel: ["low"],
          riskScoreBelow: 30,
          flagsAbsent: ["vpn", "duplicate_device", "sanction_hit"],
        },
        action: "approve",
      },
    ],
  };
}

/** 按角色过滤可执行的操作 */
export function filterActionsByRole(
  actions: ApprovalAction[],
  role: ApprovalRole
): ApprovalAction[] {
  const restricted: Record<ApprovalRole, ApprovalAction[]> = {
    reviewer: ["claim", "hold", "approve", "reject", "request_re_submit", "request_additional_docs", "release"],
    senior_reviewer: ["claim", "hold", "approve", "reject", "request_re_submit", "request_additional_docs", "transfer", "escalate", "release"],
    compliance_officer: ["claim", "hold", "approve", "reject", "request_re_submit", "request_additional_docs", "transfer", "escalate", "release"],
    supervisor: ["claim", "hold", "approve", "reject", "request_re_submit", "request_additional_docs", "transfer", "escalate", "release"],
    admin: ["claim", "hold", "approve", "reject", "request_re_submit", "request_additional_docs", "transfer", "escalate", "release"],
  };
  const allowed = restricted[role] ?? [];
  return actions.filter((a) => allowed.includes(a));
}
