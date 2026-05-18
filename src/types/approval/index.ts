/**
 * Approval Center 类型系统
 * 按 PRD v1.0 定义，覆盖 Task、Workflow、SLA、Routing、Audit、Notification、Permission
 */

// ============================================
// 基础枚举
// ============================================

/** 业务模块 — 所有可能产生审批任务的模块 */
export type BusinessModule =
  | "clm_kyc"
  | "wallet_withdrawal"
  | "wallet_deposit"
  | "trading_leverage"
  | "promotions_reward"
  | "ib_partner"
  | "crm_profile_change"
  | "risk_aml_review"
  | "finance_large_withdrawal";

/** 任务类型 — 对应 PRD Section 6 菜单 */
export type TaskType =
  | "kyc"
  | "withdrawal"
  | "deposit"
  | "leverage"
  | "reward"
  | "partner"
  | "profile_change"
  | "aml_review"
  | "large_withdrawal"
  | "re_verification";

/** 工作流状态 — v2 simplified to 4 axes.
 *
 * The v1 enum had 8 values that overloaded two concerns: "where is the
 * case in its lifecycle?" and "what is the latest action that happened
 * to it?". The new model separates them — status is the lifecycle axis
 * only; orthogonal facts (claimed-or-not, escalated, awaiting user
 * input, etc.) live in `tags`. See `ApprovalTag` below and
 * `docs/Approval-Center-v2-Architecture.md` §D3. */
export type WorkflowStatus =
  | "pending"      // 待决策（含未认领、已认领、被升级 — 由 tags 进一步区分）
  | "on_hold"      // 暂挂（等待外部输入：用户回应 / 补材料 / 银行确认）
  | "approved"     // 终态：通过
  | "rejected";    // 终态：拒绝

/** Orthogonal tags carried alongside a status — multi-select. */
export type ApprovalTag =
  | "claimed"             // has an assigneeId (was the v1 in_review state)
  | "escalated"           // bumped to senior reviewer
  | "awaiting_user"       // user-input requested
  | "docs_requested"      // supplementary documents requested
  | "resubmitted"         // user resubmitted after a request
  | "blacklist_flagged";  // reject + blacklist combo

/** 审批操作 — PRD Section 16 */
export type ApprovalAction =
  | "claim"               // Accept / 认领任务
  | "hold"                // Hold / 暂挂
  | "approve"             // Approve / 通过
  | "reject"              // Reject / 永久拒绝
  | "request_re_submit"   // Request Re-submit / 退回用户重新提交
  | "request_additional_docs" // Request Additional Docs / 要求补充材料
  | "transfer"            // Transfer / 重新指派
  | "escalate"            // Escalate / 升级到高级审批人
  | "release";            // Release / 释放回队列

/** 风险等级 */
export type RiskLevel = "low" | "medium" | "high" | "critical";

/** SLA 状态 */
export type SlaStatus = "normal" | "warning" | "critical" | "timeout";

/** 用户角色 — PRD Section 23 */
export type ApprovalRole =
  | "reviewer"
  | "senior_reviewer"
  | "compliance_officer"
  | "supervisor"
  | "admin";

/** 通知渠道 — PRD Section 22 */
export type NotificationChannel = "email" | "inbox" | "push" | "webhook";

/** 分配策略 — PRD Section 18 */
export type AssignmentStrategy =
  | "manual"       // 手动分配
  | "skill_based"  // 基于技能匹配
  | "round_robin"  // 轮询
  | "self_pick";   // 自领

// ============================================
// 核心实体：审批任务
// ============================================

export interface ApprovalTask {
  id: string;
  /** 任务类型 */
  type: TaskType;
  /** 业务模块 */
  module: BusinessModule;
  /** 关联业务实体 ID */
  sourceId: string;
  /** 关联业务实体详情 URL */
  detailUrl?: string;

  // 用户信息
  userId: string;
  userUid: string;
  userName: string;
  userEmail?: string;
  userCountry: string;
  userTier?: string;        // 账户等级

  // 任务内容
  subject: string;
  description?: string;
  amount?: number;
  currency?: string;

  // 风险
  riskLevel: RiskLevel;
  riskScore?: number;       // 0-100
  riskFlags?: string[];     // e.g. ["vpn", "duplicate_device", "sanction_hit"]

  // 工作流状态
  status: WorkflowStatus;
  previousStatus?: WorkflowStatus;
  /** Orthogonal tags — see `ApprovalTag`. May be empty. */
  tags?: ApprovalTag[];

  // 分配
  assigneeId?: string;
  assigneeName?: string;
  assigneeRole?: ApprovalRole;

  // SLA
  slaConfigId: string;
  slaDueAt: string;         // ISO timestamp
  slaStatus: SlaStatus;
  slaWarnedAt?: string;     // 首次触发 warning 的时间
  slaEscalatedAt?: string;  // 首次触发 escalation 的时间

  // 时间戳
  createdAt: string;
  updatedAt: string;
  claimedAt?: string;
  heldAt?: string;
  escalatedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;

  // 快捷审批标志
  canInlineApprove: boolean;

  // 扩展：业务模块自定义 payload
  payload?: Record<string, unknown>;
}

// ============================================
// 工作流引擎
// ============================================

/** 状态转换定义 */
export interface StateTransition {
  from: WorkflowStatus | WorkflowStatus[];
  action: ApprovalAction;
  to: WorkflowStatus;
  requiredRole?: ApprovalRole[];
  /** 是否需要填写备注 */
  requiresNote?: boolean;
  /** 是否需要填写原因 */
  requiresReason?: boolean;
  /** 执行前校验 */
  validate?: (task: ApprovalTask, actor: Reviewer) => boolean | string;
}

/** 工作流配置 */
export interface WorkflowConfig {
  id: string;
  name: string;
  taskType: TaskType;
  /** 状态转换规则 */
  transitions: StateTransition[];
  /** 初始状态 */
  initialStatus: WorkflowStatus;
  /** 是否支持批量审批 */
  allowBatch: boolean;
  /** 自动审批规则 */
  autoApproveRules?: AutoApproveRule[];
}

/** 自动审批规则 */
export interface AutoApproveRule {
  id: string;
  name: string;
  condition: {
    riskLevel?: RiskLevel[];
    riskScoreBelow?: number;
    amountBelow?: number;
    currency?: string;
    userTier?: string[];
    flagsAbsent?: string[];
  };
  action: "approve" | "route_to_manual";
}

// ============================================
// SLA 引擎
// ============================================

/** SLA 配置 */
export interface SlaConfig {
  id: string;
  name: string;
  taskType: TaskType;
  priority: "normal" | "vip" | "high_risk";
  /** 超时时间（分钟） */
  timeoutMinutes: number;
  /** 提前警告时间（分钟，在 timeout 之前） */
  warningThresholdMinutes: number;
  /** 升级时间（分钟，在 timeout 之后） */
  escalationThresholdMinutes: number;
  /** 升级目标 */
  escalateTo: ApprovalRole;
  /** 升级后的分配策略 */
  escalationStrategy: AssignmentStrategy;
}

/** SLA 实时计算结果 */
export interface SlaSnapshot {
  taskId: string;
  status: SlaStatus;
  remainingMinutes: number;
  elapsedMinutes: number;
  totalMinutes: number;
  progressPercent: number; // 0-100
  isOverdue: boolean;
  nextMilestone: "warning" | "escalation" | "none";
  nextMilestoneMinutes: number;
}

// ============================================
// 路由引擎
// ============================================

/** 分配规则 */
export interface RoutingRule {
  id: string;
  name: string;
  priority: number; // 数字越小优先级越高
  enabled: boolean;

  // 匹配条件（AND 关系）
  conditions: {
    countries?: string[];
    languages?: string[];
    riskLevels?: RiskLevel[];
    taskTypes?: TaskType[];
    isVip?: boolean;
    amountAbove?: number;
    amountBelow?: number;
    hasFlags?: string[];
  };

  // 分配动作
  action: {
    strategy: AssignmentStrategy;
    assignTo?: string[];        // 指定 reviewer IDs
    assignToTeam?: string;      // 指定团队
    assignToRole?: ApprovalRole;
  };
}

// ============================================
// 审计日志
// ============================================

/** 审计条目 — PRD Section 20 */
export interface AuditEntry {
  id: string;
  taskId: string;
  taskType: TaskType;

  // 操作人
  operatorId: string;
  operatorName: string;
  operatorRole: ApprovalRole;
  operatorIp?: string;

  // 操作
  action: ApprovalAction;
  actionLabel: string;

  // 状态变更
  oldStatus: WorkflowStatus;
  newStatus: WorkflowStatus;

  // 备注
  note?: string;
  reason?: string;

  // 时间
  timestamp: string;

  // 变更 diff（可选）
  changes?: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
}

// ============================================
// 通知
// ============================================

/** 通知事件 */
export type NotificationEvent =
  | "task_assigned"
  | "task_claimed"
  | "sla_warning"
  | "sla_timeout"
  | "task_escalated"
  | "task_approved"
  | "task_rejected"
  | "task_re_submitted"
  | "additional_docs_requested"
  | "batch_completed";

/** 通知配置 */
export interface NotificationConfig {
  event: NotificationEvent;
  channels: NotificationChannel[];
  /** 延迟发送（分钟），0 表示立即 */
  delayMinutes?: number;
  /** 是否仅在工作时间发送 */
  businessHoursOnly?: boolean;
  template?: {
    subject: string;
    body: string;
  };
}

/** 通知消息 */
export interface NotificationMessage {
  id: string;
  event: NotificationEvent;
  recipientId: string;
  recipientRole?: ApprovalRole;
  channel: NotificationChannel;
  taskId?: string;
  taskType?: TaskType;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
  sentAt?: string;
}

// ============================================
// 审批人
// ============================================

export interface Reviewer {
  id: string;
  name: string;
  email: string;
  role: ApprovalRole;
  avatar?: string;
  /** 可审批的任务类型 */
  permissions: TaskType[];
  /** 可处理的国家 */
  countries: string[];
  /** 可处理的语言 */
  languages: string[];
  /** 当前处理中的任务数 */
  activeTaskCount: number;
  /** 今日已处理数 */
  todayCompletedCount: number;
  /** 是否在线 */
  isOnline: boolean;
  /** 工作状态 */
  workStatus: "available" | "busy" | "away" | "offline";
}

// ============================================
// 统计与报表
// ============================================

/** 审批统计 — PRD Section 26 */
export interface ApprovalStats {
  todayProcessed: number;
  todayApproved: number;
  todayRejected: number;
  avgProcessingMinutes: number;
  overdueRate: number;
  typeBreakdown: Record<TaskType, number>;
  riskBreakdown: Record<RiskLevel, number>;
  slaComplianceRate: number;
  escalationRate: number;
}

/** 团队绩效 */
export interface TeamPerformance {
  reviewerId: string;
  reviewerName: string;
  role: ApprovalRole;
  totalProcessed: number;
  approvedCount: number;
  rejectedCount: number;
  avgProcessingMinutes: number;
  slaComplianceRate: number;
  activeTasks: number;
}

// ============================================
// 重验证
// ============================================

export type ReVerificationType =
  | "re_idv"
  | "re_poa"
  | "re_liveness"
  | "re_agreement"
  | "video_verification";

export interface ReVerificationTask extends ApprovalTask {
  reVerificationType: ReVerificationType;
  /** 触发原因 */
  triggerReason: string;
  /** 原始 KYC 记录 ID */
  originalKycId?: string;
  /** 要求的材料清单 */
  requiredDocuments: string[];
  /** 用户已提交的材料 */
  submittedDocuments?: string[];
}

// ============================================
// 批量操作
// ============================================

export interface BatchOperationRequest {
  taskIds: string[];
  action: ApprovalAction;
  actorId: string;
  note?: string;
  reason?: string;
}

export interface BatchOperationResult {
  success: string[];
  failed: {
    taskId: string;
    reason: string;
  }[];
}

// ============================================
// 查询参数
// ============================================

export interface TaskListQuery {
  type?: TaskType | TaskType[];
  status?: WorkflowStatus | WorkflowStatus[];
  riskLevel?: RiskLevel | RiskLevel[];
  module?: BusinessModule | BusinessModule[];
  assignee?: "all" | "me" | "unassigned" | string;
  slaStatus?: SlaStatus | SlaStatus[];
  search?: string;
  country?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "slaDueAt" | "riskScore" | "updatedAt";
  sortOrder?: "asc" | "desc";
  groupByUser?: boolean;
}

// ============================================
// 集成层：回调
// ============================================

/** 业务模块回调 payload */
export interface ApprovalCallback {
  taskId: string;
  sourceId: string;
  module: BusinessModule;
  type: TaskType;
  result: "approved" | "rejected" | "re_submitted" | "additional_docs_requested";
  reviewerId: string;
  reviewerName: string;
  note?: string;
  reason?: string;
  resolvedAt: string;
}

/** 业务模块注册接口 */
export interface BusinessModuleIntegration {
  module: BusinessModule;
  /** 创建任务时调用 */
  onCreateTask?: (task: ApprovalTask) => void;
  /** 审批完成时回调 */
  onComplete: (callback: ApprovalCallback) => Promise<void> | void;
  /** 获取业务详情 */
  getDetail: (sourceId: string) => Promise<Record<string, unknown>>;
}
