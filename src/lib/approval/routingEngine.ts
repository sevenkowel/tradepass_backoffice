/**
 * Approval Center - Routing Engine
 * 智能路由：条件匹配 + 分配策略
 */

import type {
  ApprovalTask,
  RoutingRule,
  Reviewer,
  AssignmentStrategy,
  ApprovalRole,
  RiskLevel,
  TaskType,
} from "@/types/approval";

// ============================================
// 默认路由规则
// ============================================

export const DEFAULT_ROUTING_RULES: RoutingRule[] = [
  // VIP 用户 → 专人处理
  {
    id: "route-vip",
    name: "VIP Queue",
    priority: 1,
    enabled: true,
    conditions: { isVip: true },
    action: { strategy: "manual", assignToTeam: "vip-team" },
  },
  // 高风险 + AML → 合规官
  {
    id: "route-aml",
    name: "AML Review",
    priority: 2,
    enabled: true,
    conditions: {
      riskLevels: ["high", "critical"],
      taskTypes: ["aml_review", "large_withdrawal"],
    },
    action: { strategy: "skill_based", assignToRole: "compliance_officer" },
  },
  // 印尼用户 → 印尼团队
  {
    id: "route-id",
    name: "Indonesia Team",
    priority: 3,
    enabled: true,
    conditions: { countries: ["ID", "Indonesia"] },
    action: { strategy: "round_robin", assignToTeam: "id-team" },
  },
  // 泰国用户 → 泰语审核员
  {
    id: "route-th",
    name: "Thailand Team",
    priority: 4,
    enabled: true,
    conditions: { countries: ["TH", "Thailand"] },
    action: { strategy: "round_robin", assignToTeam: "th-team" },
  },
  // 大额提现 (>50K)
  {
    id: "route-large-withdrawal",
    name: "Large Withdrawal",
    priority: 5,
    enabled: true,
    conditions: {
      taskTypes: ["withdrawal", "large_withdrawal"],
      amountAbove: 50000,
    },
    action: { strategy: "skill_based", assignToRole: "senior_reviewer" },
  },
  // 默认规则：自领
  {
    id: "route-default",
    name: "Default Self Pick",
    priority: 999,
    enabled: true,
    conditions: {},
    action: { strategy: "self_pick" },
  },
];

// ============================================
// Routing Engine
// ============================================

export class RoutingEngine {
  private rules: RoutingRule[] = [];
  private reviewerPool: Reviewer[] = [];
  private roundRobinIndex: Map<string, number> = new Map();

  constructor(rules?: RoutingRule[], reviewers?: Reviewer[]) {
    this.rules = [...(rules ?? DEFAULT_ROUTING_RULES)].sort((a, b) => a.priority - b.priority);
    this.reviewerPool = reviewers ?? [];
  }

  /** 更新规则 */
  setRules(rules: RoutingRule[]) {
    this.rules = [...rules].sort((a, b) => a.priority - b.priority);
  }

  /** 更新审核人池 */
  setReviewers(reviewers: Reviewer[]) {
    this.reviewerPool = reviewers;
  }

  /** 匹配路由规则 */
  matchRule(task: ApprovalTask): RoutingRule | undefined {
    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      if (this.matchesConditions(task, rule.conditions)) {
        return rule;
      }
    }
    return undefined;
  }

  /** 条件匹配 */
  private matchesConditions(
    task: ApprovalTask,
    conditions: RoutingRule["conditions"]
  ): boolean {
    if (conditions.countries?.length && !conditions.countries.includes(task.userCountry)) {
      return false;
    }
    if (conditions.languages?.length) {
      // language 不在 task 上，默认通过
    }
    if (conditions.riskLevels?.length && !conditions.riskLevels.includes(task.riskLevel)) {
      return false;
    }
    if (conditions.taskTypes?.length && !conditions.taskTypes.includes(task.type)) {
      return false;
    }
    if (conditions.isVip !== undefined) {
      const isVip = task.userTier === "vip" || task.userTier === "platinum";
      if (isVip !== conditions.isVip) return false;
    }
    if (conditions.amountAbove !== undefined && (task.amount ?? 0) < conditions.amountAbove) {
      return false;
    }
    if (conditions.amountBelow !== undefined && (task.amount ?? Infinity) > conditions.amountBelow) {
      return false;
    }
    if (conditions.hasFlags?.length) {
      for (const flag of conditions.hasFlags) {
        if (!task.riskFlags?.includes(flag)) return false;
      }
    }
    return true;
  }

  /** 执行路由分配 */
  route(task: ApprovalTask): {
    assigned: boolean;
    assigneeId?: string;
    assigneeName?: string;
    assigneeRole?: ApprovalRole;
    strategy: AssignmentStrategy;
    ruleId?: string;
  } {
    const rule = this.matchRule(task);
    if (!rule) {
      return { assigned: false, strategy: "self_pick" };
    }

    const action = rule.action;
    const candidates = this.getCandidates(task, action);

    switch (action.strategy) {
      case "manual":
        return {
          assigned: false,
          strategy: "manual",
          ruleId: rule.id,
        };

      case "self_pick":
        return {
          assigned: false,
          strategy: "self_pick",
          ruleId: rule.id,
        };

      case "skill_based":
        // 找最匹配的（activeTaskCount 最少且 permissions 包含 task.type）
        const best = candidates.sort((a, b) => a.activeTaskCount - b.activeTaskCount)[0];
        if (best) {
          return {
            assigned: true,
            assigneeId: best.id,
            assigneeName: best.name,
            assigneeRole: best.role,
            strategy: "skill_based",
            ruleId: rule.id,
          };
        }
        break;

      case "round_robin":
        const teamKey = action.assignToTeam ?? action.assignToRole ?? "global";
        const idx = this.roundRobinIndex.get(teamKey) ?? 0;
        const pool = candidates.length > 0 ? candidates : this.reviewerPool;
        const available = pool.filter((r) => r.workStatus === "available");
        if (available.length > 0) {
          const selected = available[idx % available.length];
          this.roundRobinIndex.set(teamKey, idx + 1);
          return {
            assigned: true,
            assigneeId: selected.id,
            assigneeName: selected.name,
            assigneeRole: selected.role,
            strategy: "round_robin",
            ruleId: rule.id,
          };
        }
        break;
    }

    // fallback
    return { assigned: false, strategy: action.strategy, ruleId: rule.id };
  }

  /** 获取候选人 */
  private getCandidates(
    task: ApprovalTask,
    action: RoutingRule["action"]
  ): Reviewer[] {
    let pool = this.reviewerPool;

    if (action.assignTo?.length) {
      pool = pool.filter((r) => action.assignTo!.includes(r.id));
    }
    if (action.assignToRole) {
      pool = pool.filter((r) => r.role === action.assignToRole);
    }

    // 过滤：permissions 包含 task.type，countries 包含 userCountry
    pool = pool.filter(
      (r) =>
        r.permissions.includes(task.type) &&
        (r.countries.length === 0 || r.countries.includes(task.userCountry)) &&
        r.isOnline
    );

    return pool;
  }

  /** 获取规则列表 */
  getRules(): RoutingRule[] {
    return this.rules;
  }
}

// 单例
export const routingEngine = new RoutingEngine();
