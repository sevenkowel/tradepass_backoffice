/**
 * Lifecycle Milestone Templates — 生命周期模板与触发规则.
 *
 * 与客户详情页 `ClientMilestone` 的关系：
 *   - 这里定义"broker 范围内有哪些里程碑节点 + 触发条件 + 自动动作"
 *   - 客户详情页 → 审计 → 里程碑 Tab 展示「该客户达成了哪些节点 / 还差什么」
 *     其 `key` 字段必须来自这里定义的 `MilestoneTemplate.key`
 *   - 同步关系：编辑模板 → 客户详情 Tab 展示自动一致
 *
 * 数据流：
 *   定义 (Lifecycle 页面) → 客户详情显示 (ClientMilestone)
 *                       ↓
 *                       触发 (DynamicRule)
 */

import type { MilestoneIcon } from "./client-detail";

/* ─────────────────────────────────────────────────────────────────────────── */
/* Triggers — 描述"哪种条件下里程碑达成"                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

/** 简化版"DSL" — 支持单字段比较 + 多条件 AND。 */
export type TriggerOperator =
  | "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "exists" | "elapsed_days";

export interface TriggerCondition {
  /** 字段路径，例如 "user.kycStatus" / "valueMetrics.netDeposit" / "lastLoginAt"。 */
  field: string;
  op: TriggerOperator;
  /** 比较值，按 op 解释。 */
  value?: string | number | boolean | string[];
}

/** 多条件 AND。未来需要 OR 时升级为嵌套 AST。 */
export interface MilestoneTrigger {
  conditions: TriggerCondition[];
  /** 触发后是否只算一次（true）还是每次满足都触发（false）。 */
  once: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Auto actions — 里程碑达成后的自动动作                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

export type AutoActionType =
  | "add_tag"           // 给客户加标签
  | "remove_tag"        // 移除标签
  | "send_email"        // 发送模板邮件
  | "send_sms"          // 发短信
  | "notify_staff"      // 通知员工 / 客户经理
  | "create_followup"   // 创建跟进任务
  | "assign_to_team"    // 分配到某个团队
  | "unlock_feature"    // 解锁功能（高杠杆 / 高额出金 等）
  | "lock_feature"      // 锁定功能
  | "trigger_webhook";  // 触发自定义 webhook

export interface AutoAction {
  type: AutoActionType;
  /** 动作参数。按 type 解释 — 例 add_tag: { tag: "VIP" } */
  params: Record<string, string | number | boolean>;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* MilestoneTemplate — 一个里程碑模板                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

export type MilestoneCategory =
  | "onboarding"   // 入门：注册 / 邮箱 / 首登
  | "compliance"   // 合规：KYC / 协议
  | "funding"      // 资金：FTD / 出金
  | "trading"      // 交易：首单 / 高频
  | "growth"       // 增长：VIP / IB
  | "retention"    // 留存：沉默 / 唤回
  | "risk";        // 风险：冻结 / 高风险

export interface MilestoneTemplate {
  id: string;
  /** 稳定 key — 客户详情里程碑数据用这个 key 关联。例 "kyc_l1_verified"。 */
  key: string;
  /** 显示名。 */
  title: string;
  description: string;
  category: MilestoneCategory;
  icon: MilestoneIcon;
  /** 重要程度（用于排序 / 视觉权重）。 */
  weight: "low" | "medium" | "high";
  /** 触发条件。 */
  trigger: MilestoneTrigger;
  /** 达成后的自动动作。可为空。 */
  actions: AutoAction[];
  /** 是否启用 — 关闭后客户详情不再显示该 placeholder + 不触发动作。 */
  enabled: boolean;
  /** 排序权重 — 数字小的先显示。 */
  order: number;
  /** 系统内置（true）vs 用户自定义（false）。系统模板不能删除，但可禁用 + 改 actions。 */
  builtIn: boolean;
  /** 最近触发的客户数 + 时间 — 演示用。 */
  recentTriggers?: number;
  lastTriggeredAt?: string;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Dynamic Rules — 自动化规则（非里程碑场景：批量加标签 / 通知 / 触发任务）   */
/* ─────────────────────────────────────────────────────────────────────────── */

export type DynamicRuleEvent =
  | "client_created"
  | "kyc_status_changed"
  | "deposit_completed"
  | "withdrawal_requested"
  | "trade_executed"
  | "login_detected"
  | "risk_score_changed"
  | "scheduled";       // 定时（每日 / 每周）

export interface DynamicRule {
  id: string;
  name: string;
  description: string;
  /** 触发事件 — 决定规则什么时候被评估。 */
  triggerEvent: DynamicRuleEvent;
  /** 过滤条件 — 只对满足条件的客户应用。 */
  conditions: TriggerCondition[];
  /** 命中后的动作。 */
  actions: AutoAction[];
  /** 是否启用。 */
  enabled: boolean;
  /** 累计命中次数。 */
  runCount: number;
  /** 最近一次命中。 */
  lastRunAt?: string;
  createdAt: string;
  /** 谁建的。 */
  createdBy: string;
}
