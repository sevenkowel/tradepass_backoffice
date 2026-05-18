/**
 * Approval Center - SLA Engine
 * 倒计时计算、预警检测、升级触发
 */

import type { ApprovalTask, SlaConfig, SlaSnapshot, SlaStatus, TaskType } from "@/types/approval";

// ============================================
// 默认 SLA 配置
// ============================================

export const DEFAULT_SLA_CONFIGS: SlaConfig[] = [
  {
    id: "sla-kyc-normal",
    name: "KYC Normal",
    taskType: "kyc",
    priority: "normal",
    timeoutMinutes: 240,           // 4 hours
    warningThresholdMinutes: 60,    // warn at 3 hours remaining
    escalationThresholdMinutes: 30, // escalate 30 min after timeout
    escalateTo: "senior_reviewer",
    escalationStrategy: "skill_based",
  },
  {
    id: "sla-kyc-vip",
    name: "KYC VIP",
    taskType: "kyc",
    priority: "vip",
    timeoutMinutes: 60,             // 1 hour
    warningThresholdMinutes: 15,
    escalationThresholdMinutes: 15,
    escalateTo: "senior_reviewer",
    escalationStrategy: "manual",
  },
  {
    id: "sla-kyc-high-risk",
    name: "KYC High Risk",
    taskType: "kyc",
    priority: "high_risk",
    timeoutMinutes: 120,
    warningThresholdMinutes: 30,
    escalationThresholdMinutes: 30,
    escalateTo: "compliance_officer",
    escalationStrategy: "skill_based",
  },
  {
    id: "sla-withdrawal-normal",
    name: "Withdrawal Normal",
    taskType: "withdrawal",
    priority: "normal",
    timeoutMinutes: 120,
    warningThresholdMinutes: 30,
    escalationThresholdMinutes: 30,
    escalateTo: "senior_reviewer",
    escalationStrategy: "round_robin",
  },
  {
    id: "sla-withdrawal-large",
    name: "Withdrawal Large",
    taskType: "withdrawal",
    priority: "high_risk",
    timeoutMinutes: 60,
    warningThresholdMinutes: 15,
    escalationThresholdMinutes: 15,
    escalateTo: "compliance_officer",
    escalationStrategy: "manual",
  },
  {
    id: "sla-deposit",
    name: "Deposit",
    taskType: "deposit",
    priority: "normal",
    timeoutMinutes: 60,
    warningThresholdMinutes: 15,
    escalationThresholdMinutes: 30,
    escalateTo: "senior_reviewer",
    escalationStrategy: "round_robin",
  },
  {
    id: "sla-leverage",
    name: "Leverage",
    taskType: "leverage",
    priority: "normal",
    timeoutMinutes: 30,
    warningThresholdMinutes: 10,
    escalationThresholdMinutes: 15,
    escalateTo: "senior_reviewer",
    escalationStrategy: "round_robin",
  },
  {
    id: "sla-reward",
    name: "Reward",
    taskType: "reward",
    priority: "normal",
    timeoutMinutes: 120,
    warningThresholdMinutes: 30,
    escalationThresholdMinutes: 30,
    escalateTo: "senior_reviewer",
    escalationStrategy: "round_robin",
  },
  {
    id: "sla-partner",
    name: "Partner",
    taskType: "partner",
    priority: "normal",
    timeoutMinutes: 480,
    warningThresholdMinutes: 120,
    escalationThresholdMinutes: 60,
    escalateTo: "supervisor",
    escalationStrategy: "skill_based",
  },
  {
    id: "sla-profile-change",
    name: "Profile Change",
    taskType: "profile_change",
    priority: "normal",
    timeoutMinutes: 240,
    warningThresholdMinutes: 60,
    escalationThresholdMinutes: 30,
    escalateTo: "senior_reviewer",
    escalationStrategy: "round_robin",
  },
  {
    id: "sla-aml-review",
    name: "AML Review",
    taskType: "aml_review",
    priority: "high_risk",
    timeoutMinutes: 180,
    warningThresholdMinutes: 45,
    escalationThresholdMinutes: 30,
    escalateTo: "compliance_officer",
    escalationStrategy: "skill_based",
  },
  {
    id: "sla-large-withdrawal",
    name: "Large Withdrawal",
    taskType: "large_withdrawal",
    priority: "high_risk",
    timeoutMinutes: 60,
    warningThresholdMinutes: 15,
    escalationThresholdMinutes: 15,
    escalateTo: "compliance_officer",
    escalationStrategy: "manual",
  },
  {
    id: "sla-re-verification",
    name: "Re-Verification",
    taskType: "re_verification",
    priority: "normal",
    timeoutMinutes: 480,
    warningThresholdMinutes: 120,
    escalationThresholdMinutes: 60,
    escalateTo: "senior_reviewer",
    escalationStrategy: "round_robin",
  },
];

// ============================================
// SLA Engine
// ============================================

export class SlaEngine {
  private configs: Map<string, SlaConfig> = new Map();

  constructor(configs?: SlaConfig[]) {
    const list = configs ?? DEFAULT_SLA_CONFIGS;
    for (const c of list) {
      this.configs.set(c.id, c);
    }
  }

  /** 注册配置 */
  register(config: SlaConfig) {
    this.configs.set(config.id, config);
  }

  /** 获取匹配的 SLA 配置 */
  resolveConfig(task: ApprovalTask): SlaConfig | undefined {
    // 按 priority + taskType 匹配
    const priority = this.inferPriority(task);
    return Array.from(this.configs.values()).find(
      (c) => c.taskType === task.type && c.priority === priority
    );
  }

  /** 推断优先级 */
  private inferPriority(task: ApprovalTask): "normal" | "vip" | "high_risk" {
    if (task.riskLevel === "high" || task.riskLevel === "critical") return "high_risk";
    if (task.userTier === "vip" || task.userTier === "platinum") return "vip";
    if (task.amount && task.amount > 50000) return "high_risk";
    return "normal";
  }

  /** 计算 SLA 快照 */
  computeSnapshot(task: ApprovalTask): SlaSnapshot {
    const config = this.resolveConfig(task);
    const totalMinutes = config?.timeoutMinutes ?? 240;

    const now = Date.now();
    const created = new Date(task.createdAt).getTime();
    const due = new Date(task.slaDueAt).getTime();

    const elapsedMinutes = Math.max(0, (now - created) / 60000);
    const remainingMinutes = Math.max(0, (due - now) / 60000);
    const progressPercent = Math.min(100, (elapsedMinutes / totalMinutes) * 100);
    const isOverdue = now > due;

    let status: SlaStatus = "normal";
    if (isOverdue) {
      status = "timeout";
    } else if (config) {
      const warnAt = totalMinutes - config.warningThresholdMinutes;
      if (elapsedMinutes >= warnAt) {
        status = remainingMinutes <= 15 ? "critical" : "warning";
      }
    }

    // 下一个里程碑
    let nextMilestone: "warning" | "escalation" | "none" = "none";
    let nextMilestoneMinutes = 0;

    if (!isOverdue && config) {
      const warnTime = created + (totalMinutes - config.warningThresholdMinutes) * 60000;
      if (now < warnTime) {
        nextMilestone = "warning";
        nextMilestoneMinutes = (warnTime - now) / 60000;
      } else {
        nextMilestone = "escalation";
        nextMilestoneMinutes = (due + config.escalationThresholdMinutes * 60000 - now) / 60000;
      }
    }

    return {
      taskId: task.id,
      status,
      remainingMinutes: Math.round(remainingMinutes),
      elapsedMinutes: Math.round(elapsedMinutes),
      totalMinutes,
      progressPercent: Math.round(progressPercent * 10) / 10,
      isOverdue,
      nextMilestone,
      nextMilestoneMinutes: Math.round(nextMilestoneMinutes),
    };
  }

  /** 格式化倒计时显示 */
  formatCountdown(remainingMinutes: number): string {
    if (remainingMinutes <= 0) return "Overdue";
    const h = Math.floor(remainingMinutes / 60);
    const m = remainingMinutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  /** 生成 SLA 到期时间 */
  static calculateDueAt(createdAt: string, timeoutMinutes: number): string {
    const d = new Date(createdAt);
    d.setMinutes(d.getMinutes() + timeoutMinutes);
    return d.toISOString();
  }
}

// 单例
export const slaEngine = new SlaEngine();
