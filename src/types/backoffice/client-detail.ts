/**
 * Client Detail Page Types
 * 扩展 BackofficeUser，提供 Client 360 各 Tab 所需的完整数据模型
 */

import type { BackofficeUser, RiskLevel } from "./user";

// ============================================================
// 1. 交易账户
// ============================================================

export type TradingPlatform = "MT4" | "MT5" | "TradePass";
export type TradingMode = "hedging" | "netting";

export interface TradingAccount {
  // === Identity ===
  id: string;
  /** Pure-numeric MT login (5-9 digits), e.g. "88012345". */
  mtAccount: string;
  accountType: "Standard" | "ECN" | "PRO" | "VIP";
  status: "active" | "disabled" | "restricted";
  /** v2 — independent from status. Account can be both active + readonly
   *  (e.g. ops temporarily locked but client can still view). */
  readonly?: boolean;
  platform: TradingPlatform;

  // === Funds ===
  balance: number;
  equity: number;
  margin: number;
  /** Available margin = equity - used margin. */
  freeMargin: number;
  /** Margin level % as a display string ("850.00%" / "—" when no margin). */
  marginLevel: string;
  leverage: string;       // e.g. "1:100"
  currency: string;       // ISO 4217 — "USD" / "EUR" / "USDT" / ...

  // === Flow ===
  totalDeposit: number;
  totalWithdrawal: number;
  /** Cumulative commission charged. */
  commission: number;
  /** Cumulative swap (overnight interest). Can be negative. */
  swap: number;

  // === Config ===
  tradingMode: TradingMode;
  group: string;          // "live\\standard" / "demo\\standard" / ...
  server: string;         // "TradePass-Live-01"

  // === Times ===
  createdAt: string;
  lastTradeAt?: string;
}

/** Entry on the per-account balance flow — anything that moves the
 *  account's balance: deposit / withdrawal / commission / swap /
 *  adjustment / transfer. */
export type AccountFlowKind =
  | "deposit" | "withdrawal" | "commission" | "swap"
  | "adjustment" | "transfer_in" | "transfer_out" | "rebate";

export interface AccountFlowEntry {
  id: string;
  type: AccountFlowKind;
  amount: number;            // signed: positive = inflow, negative = outflow
  balanceAfter: number;      // running balance after this entry
  description: string;
  timestamp: string;
}

/** Currently-open position (live P/L). */
export interface OpenPosition {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  volume: number;
  openPrice: number;
  currentPrice: number;
  pnl: number;
  swap: number;
  commission: number;
  openTime: string;
  stopLoss?: number;
  takeProfit?: number;
}

/** Pending limit/stop order, not yet filled. */
export type PendingOrderKind = "buy_limit" | "sell_limit" | "buy_stop" | "sell_stop";

export interface PendingOrder {
  id: string;
  symbol: string;
  orderType: PendingOrderKind;
  volume: number;
  price: number;
  stopLoss?: number;
  takeProfit?: number;
  placedAt: string;
  expiresAt?: string;
}

// ============================================================
// 1b. 账户运营工作台扩展模型 (Trading Account Operating Workspace)
// ============================================================

/**
 * 状态徽章 — 一个账户同时有多条独立维度的状态线。
 * 例如：可以同时是「Active + Margin Warning + Withdrawal Locked + Readonly」。
 * UI 渲染时把非默认值的维度全部显示为 chip。
 */
export interface AccountStatusBadge {
  /** 运营状态：账户是否处于可交易/被冻结/被限制状态。 */
  operational: "active" | "restricted" | "disabled";
  /** 风险状态：来自实时风险引擎的快照。 */
  risk: "normal" | "watch" | "warning" | "critical";
  /** 保证金水平：MT 的硬性指标。 */
  margin: "healthy" | "warning" | "call" | "stopout";
  /** 控制：操作员临时挂的资金/交易锁。 */
  control: "open" | "withdrawal_locked" | "trading_locked" | "fully_locked";
  /** 标签：业务标识（只读 / 试用 / 即将到期 等）。 */
  flags?: AccountFlag[];
}

export type AccountFlag =
  | "readonly"
  | "trial"
  | "expiring_soon"
  | "high_priority"
  | "under_review";

/** Overview - Risk Summary 区。 */
export interface RiskMetrics {
  marginLevel: number;          // 850.0 (== 850%)
  marginCallLevel: number;      // 100  阈值
  stopoutLevel: number;         // 50   阈值
  /** 距 Margin Call 还剩多少 USD 缓冲。 */
  bufferToMarginCall: number;
  /** 当前最大单品种敞口，相对净值的占比。 */
  maxSymbolExposurePct: number;
  /** 实时综合风险等级（来自风险引擎，可能与 status 不同步）。 */
  riskLevel: "low" | "medium" | "high" | "critical";
  /** 实时告警，例如「保证金低于 200%」「单仓 > 30% 净值」。 */
  alerts: RiskAlert[];
}

export interface RiskAlert {
  id: string;
  level: "info" | "warning" | "critical";
  message: string;
  triggeredAt: string;
}

/** Overview - Financial Summary 区。 */
export interface FinancialMetrics {
  balance: number;
  equity: number;
  freeMargin: number;
  totalDeposit: number;
  totalWithdrawal: number;
  netDeposit: number;           // = totalDeposit - totalWithdrawal
  realizedPnL: number;          // 累计已平仓盈亏
  unrealizedPnL: number;        // 当前持仓浮动盈亏
  commission: number;
  swap: number;
  currency: string;
}

/** Overview - Trading Performance 区。 */
export interface TradingPerformance {
  totalTrades: number;
  closedTrades: number;
  winRate: number;              // 0..1
  averageWin: number;
  averageLoss: number;
  profitFactor: number;         // sum(win) / sum(|loss|)
  totalLots: number;
  /** 最近 7 天 / 30 天的活跃度。 */
  tradesLast7d: number;
  tradesLast30d: number;
  /** Top 3 交易品种。 */
  topSymbols: { symbol: string; volume: number; pnl: number }[];
}

/** Overview - Behavioral Signals 区。 */
export interface BehavioralSignals {
  isEATrading: boolean;
  isHighFrequency: boolean;
  /** 平均持仓时长（分钟）。 */
  avgHoldingMinutes: number;
  /** 周末/夜盘交易比例。 */
  afterHoursPct: number;
  /** 最近一次登录 → 最近一次交易的间隔（小时）。 */
  lastLoginToTradeHours?: number;
  detectedBehaviors: RiskBehavior[];
}

/**
 * AccountControls — 独立数据模型，与 `TradingAccount` 解耦。
 * 这是「Risk & Controls」Tab 的灵魂模块。每个开关都附带操作员、时间、原因。
 */
export interface AccountControls {
  accountId: string;

  // === Trading Controls 交易控制 ===
  tradingEnabled: ControlToggle;
  allowEA: ControlToggle;
  allowHedging: ControlToggle;
  /** 允许交易的品种白名单（空 = 全允许）。 */
  symbolWhitelist: string[];
  /** 单笔最大手数。 */
  maxLotSize: ControlValue<number>;

  // === Financial Controls 财务控制 ===
  depositEnabled: ControlToggle;
  withdrawalEnabled: ControlToggle;
  /** 单日提款上限（账户币种）。 */
  dailyWithdrawalCap: ControlValue<number>;
  /** 转账（账户间）开关。 */
  transferEnabled: ControlToggle;

  // === Risk Controls 风险控制 ===
  /** 自定义 Margin Call 阈值（覆盖系统默认）。 */
  customMarginCallLevel: ControlValue<number | null>;
  customStopoutLevel: ControlValue<number | null>;
  /** 最大持仓数。 */
  maxOpenPositions: ControlValue<number | null>;
  /** 强平规则。 */
  liquidationPolicy: ControlValue<"fifo" | "largest_first" | "manual">;

  // === Compliance Controls 合规控制 ===
  /** 设为只读 — 客户能看不能操作。 */
  readonly: ControlToggle;
  /** AML 高风险标记（升级到合规审核）。 */
  amlElevated: ControlToggle;
  /** 强制 KYC 重审。 */
  kycReviewRequired: ControlToggle;
}

/** 布尔开关，带审计字段。 */
export interface ControlToggle {
  value: boolean;
  changedBy?: string;
  changedAt?: string;
  reason?: string;
}

/** 值类开关，带审计字段。 */
export interface ControlValue<T> {
  value: T;
  changedBy?: string;
  changedAt?: string;
  reason?: string;
}

/** 控制操作日志（每次开关变更追加一条）。 */
export interface AccountControlLog {
  id: string;
  accountId: string;
  controlKey: string;           // "tradingEnabled" / "dailyWithdrawalCap" / ...
  operator: string;
  operatorRole?: string;
  /** JSON-encoded old/new value, e.g. "true → false". */
  oldValue?: string;
  newValue?: string;
  reason: string;
  timestamp: string;
}

/**
 * Activity 时间线 — 跨数据源的统一事件流。
 * 每条都标注来源域，前端按 6 个 chip 过滤。
 */
export type AccountActivityKind =
  | "trade"          // 开/平仓
  | "fund"           // 入金/出金/调整
  | "login"          // 登录
  | "risk"           // 风险告警
  | "control"        // 控制开关变更（与 AccountControlLog 对齐）
  | "kyc"            // KYC 提交/审核
  | "settings"       // 杠杆/账户组等配置变更
  | "note";          // 客服/风控笔记

export interface AccountActivityEntry {
  id: string;
  accountId: string;
  kind: AccountActivityKind;
  title: string;
  description?: string;
  /** 例如 "+$10,000" / "EURUSD x2.0 buy" / "Margin level dropped to 180%"。 */
  highlight?: string;
  /** 严重度，用于颜色。 */
  severity?: "info" | "success" | "warning" | "danger";
  operator?: string;
  timestamp: string;
  /** 关联实体，比如 fundId / tradeId / controlLogId。 */
  metadata?: Record<string, string | number>;
}

/**
 * Settings → Account Administration（4 分区）所需。
 * 这些字段相对静态，区别于 AccountControls 的动态控制。
 */
export interface AccountPermissions {
  accountId: string;
  /** Bound IB / Sales 团队。 */
  ibCode?: string;
  salesAgent?: string;
  /** 数据可见范围（哪些团队能看到）。 */
  visibleToTeams: string[];
  /** 客户自助操作权限。 */
  selfServiceWithdrawal: boolean;
  selfServiceTransfer: boolean;
  selfServiceLeverageChange: boolean;
}

export interface AccountSecurity {
  accountId: string;
  /** 服务器端登录 2FA。 */
  twoFactorEnabled: boolean;
  /** IP 白名单。 */
  ipWhitelist: string[];
  /** API key 数量（实际管理走单独子页面）。 */
  apiKeysCount: number;
  /** 最近一次密码变更。 */
  passwordLastChangedAt?: string;
  /** 最近一次登录失败次数（24h）。 */
  failedLoginsLast24h: number;
}

// ============================================================
// 2. 资金记录
// ============================================================
export type FundType = "deposit" | "withdrawal";
export type FundStatus = "pending" | "completed" | "rejected" | "manual_review" | "frozen";
export type FundMethod = "bank_transfer" | "crypto" | "e_wallet" | "credit_card" | "wire_transfer";

export interface FundRecord {
  id: string;
  clientId: string;
  type: FundType;
  amount: number;
  method: FundMethod;
  status: FundStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  riskFlags?: string[];
}

// ============================================================
// 3. 交易记录
// ============================================================
export interface TradeRecord {
  id: string;
  clientId: string;
  /** MT account this trade lives on. Needed for cross-account ordering
   *  views — without it we cannot tell which account a position belongs
   *  to once we aggregate trades from every TradingAccount of the user. */
  accountId?: string;
  /** Pure-numeric MT login of the trade's account ("88012345").
   *  Cached on the trade so the table can render the column without a
   *  second join. */
  mtAccount?: string;
  symbol: string;
  type: "buy" | "sell";
  volume: number;
  openPrice: number;
  closePrice?: number;
  /** Latest market price — only set for OPEN positions (closeTime == null),
   *  used to compute live floating PnL. */
  currentPrice?: number;
  profit?: number;
  /** Optional stop loss / take profit prices set by the trader. */
  stopLoss?: number;
  takeProfit?: number;
  openTime: string;
  closeTime?: string;
  isEATrading?: boolean;
}

export interface TradingStats {
  totalLots: number;
  winRate: number;
  isEATrading: boolean;
  isHighFrequency: boolean;
  riskBehaviors: RiskBehavior[];
}

export interface RiskBehavior {
  type: "arbitrage" | "tick_scalping" | "latency_arbitrage" | "high_frequency_abuse";
  level: "low" | "medium" | "high";
  description: string;
  detectedAt: string;
}

// ============================================================
// 4. KYC 文档
// ============================================================
export type DocumentType = "id_card" | "passport" | "drivers_license";
export type VerificationStatus = "not_submitted" | "pending" | "verified" | "rejected";

export interface KYCDocument {
  id: string;
  clientId: string;
  type: DocumentType;
  documentNumber: string;
  fullName: string;
  nationality: string;
  dateOfBirth: string;
  expiryDate: string;
  status: VerificationStatus;
  imageUrl: string;
  ocrResult?: OCRResult;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface OCRResult {
  extractedName: string;
  extractedNumber: string;
  extractedNationality: string;
  extractedDateOfBirth: string;
  extractedExpiryDate: string;
  confidence: number;
  mismatches: string[];
}

export interface KYCRiskIndicator {
  type: "ocr_mismatch" | "duplicate_document" | "blacklist_match" | "expired_document";
  level: "low" | "medium" | "high";
  description: string;
}

// ============================================================
// 5. 设备
// ============================================================
export interface ClientDevice {
  id: string;
  clientId: string;
  ipAddress: string;
  country: string;
  city?: string;
  deviceId: string;
  browser: string;
  os: string;
  timezone: string;
  lastUsedAt: string;
  isRisky: boolean;
  isCurrent: boolean;
}

// ============================================================
// 6. 客户申请记录（原"审批 Case"，2026-05-16 重新定位）
//
// 语义变化：从「运营要处理的 Case」翻转为「客户主动发起的申请」。
// 同一份数据，视角不同：CRM 运营看到的是"该客户向平台发起过哪些请求，
// 哪些处理了哪些还没处理"，所以类型空间需要覆盖客户能发起的所有动作。
//
// 类型分组：
//   合规类:    kyc_review / resubmission_review / video_verification / kyc_upgrade
//   资金类:    deposit_request / withdrawal_review
//   账户类:    leverage_change / account_unfreeze / account_close
//   业务类:    copy_trading_apply / signal_provider_apply / ib_apply
//   营销类:    bonus_claim / promo_claim
//   服务类:    complaint / refund_request
// ============================================================
export type CaseType =
  // 合规
  | "kyc_review"
  | "resubmission_review"
  | "video_verification"
  | "kyc_upgrade"
  // 资金
  | "deposit_request"
  | "withdrawal_review"
  // 账户
  | "leverage_change"
  | "account_unfreeze"
  | "account_close"
  // 业务
  | "copy_trading_apply"
  | "signal_provider_apply"
  | "ib_apply"
  // 营销
  | "bonus_claim"
  | "promo_claim"
  // 服务
  | "complaint"
  | "refund_request";

export type CaseStatus = "pending" | "in_review" | "approved" | "rejected" | "escalated";

/** Bucket：用「未处理 / 已处理」二分申请记录。 */
export type ApplicationBucket = "open" | "closed";

/** Pure: 把 CaseStatus 映射到 open/closed 桶。Escalated 仍视为未处理
 *  （已升级但运营还没给出结论），保持与"待运营响应"语义一致。 */
export function bucketOfStatus(s: CaseStatus): ApplicationBucket {
  if (s === "approved" || s === "rejected") return "closed";
  return "open"; // pending / in_review / escalated
}

export interface CaseItem {
  id: string;
  caseId: string;
  clientId: string;
  type: CaseType;
  status: CaseStatus;
  priority: "low" | "medium" | "high" | "urgent";
  sla: string;
  reviewer?: string;
  /** 处理结论的简要描述（已处理时显示）。 */
  resolution?: string;
  /** 申请涉及的金额（资金类申请用）。 */
  amount?: number;
  /** 客户发起时附带的说明文字。 */
  requestNote?: string;
  createdAt: string;
  updatedAt: string;
  /** 处理完成时间（approved / rejected 时填）。 */
  closedAt?: string;
  comments: CaseComment[];
}

export interface CaseComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

// ============================================================
// 7. 客服工单
// ============================================================
export type TicketType = "financial" | "kyc" | "withdrawal" | "complaint" | "risk_appeal" | "technical";
export type TicketStatus = "open" | "in_progress" | "waiting_customer" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface Ticket {
  id: string;
  ticketId: string;
  clientId: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  subject: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  author: string;
  isStaff: boolean;
  content: string;
  attachments?: string[];
  createdAt: string;
}

// ============================================================
// 8. 权限
// ============================================================
export interface ClientPermission {
  key: string;
  label: string;
  value: boolean | string | number;
  type: "toggle" | "select" | "number";
  options?: { label: string; value: string | number }[];
  category: string;
}

// ============================================================
// 9. 协议
// ============================================================
/**
 * 客户协议 — 与 CLM 模块的 AgreementRecord 字段对齐（2026-05-17）.
 *
 * 字段语义（保持与 `@/types/clm.AgreementRecord` 一致，方便 CLM ↔ CRM
 * 互通时直接 mapping，不用再写 adapter）：
 *   - `agreementType` 是 CRM 内部业务分类（client_agreement / risk_disclosure 等）
 *   - `name` 是面向用户展示的协议名（Client Agreement / 风险披露书）
 *   - `language` / `signatureType` / `forceResign` 来自 CLM 协议管理
 */
export interface ClientAgreement {
  id: string;
  clientId: string;
  /** 业务类型（CRM 分类）— client_agreement / risk_disclosure / privacy_policy / aml_declaration / ... */
  agreementType: string;
  /** 展示名 — 例如 "Client Agreement" / "风险披露书"。与 CLM 一致。 */
  name: string;
  version: string;
  signedAt: string;
  signedIp: string;
  /** 签署时使用的语言 — 例如 "English" / "中文"。 */
  language: string;
  /** 签署方式 — 手写电子签 / 输入文字签名。 */
  signatureType: "handwritten" | "text";
  /** PDF 存档地址。 */
  pdfUrl?: string;
  /** 协议有更新需要客户重新签署时为 true。 */
  forceResign?: boolean;
  status: "signed" | "pending" | "expired";
}

// ============================================================
// 10. 时间线事件
// ============================================================
export type TimelineEventType =
  | "registered"
  | "kyc_submitted"
  | "kyc_approved"
  | "kyc_rejected"
  | "deposit"
  | "withdrawal"
  | "trade"
  | "login"
  | "account_frozen"
  | "account_unfrozen"
  | "permission_updated"
  | "ticket_created"
  | "ticket_replied"
  | "case_created"
  | "case_resolved"
  | "note_added"
  | "device_added"
  | "agreement_signed";

export interface TimelineEvent {
  id: string;
  clientId: string;
  type: TimelineEventType;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  operator?: string;
  timestamp: string;
}

// ============================================================
// 10.5 客户里程碑（Lifecycle Milestones）
// ============================================================

/**
 * 客户生命周期"里程碑" — 用来在审计 / 客户档案场景里直观回看：
 *   "这位客户走完了多少节点？还差什么？"
 *
 * 跟 TimelineEvent 的区别：
 *   - TimelineEvent = 全部活动事件流（细粒度，几十上百条）
 *   - ClientMilestone = 生命旅程的关键节点（粗粒度，<= 20 条）
 *     · 已达成的有 achievedAt
 *     · 未达成的也展示，给运营"还差什么"的提示
 *
 * 例：注册 → 邮箱验证 → 首次登录 → KYC 提交 → KYC L1 通过 → FTD → 首次交易
 *      → KYC L2 → 升 VIP → 首位被推荐客户 FTD → 一周年 → ...
 */
export type MilestoneStatus = "achieved" | "in_progress" | "pending" | "missed";

/** 用枚举字符串而不是 LucideIcon，方便 mock 数据生成（避免循环依赖）。 */
export type MilestoneIcon =
  | "user-plus"     // 注册
  | "mail-check"    // 邮箱验证
  | "log-in"        // 首次登录
  | "shield-check"  // KYC 通过
  | "shield-x"      // KYC 被拒
  | "id-card"       // KYC 提交
  | "arrow-down"    // 入金
  | "arrow-up"      // 出金
  | "trending-up"   // 交易
  | "crown"         // VIP
  | "rocket"        // 业绩跃升
  | "users"         // IB / 推荐
  | "ban"           // 冻结
  | "unlock"        // 解冻
  | "file-signature" // 协议签署
  | "gift"          // 奖励
  | "calendar-clock" // 周年 / 注册满 N 年
  | "alert-triangle"; // 风控干预

export type MilestoneWeight = "low" | "medium" | "high";

export interface ClientMilestone {
  id: string;
  /** 稳定 key — UI 用来去重 / 跳过；类似 "registered" / "ftd" / "vip_status"。 */
  key: string;
  title: string;
  description?: string;
  /** 状态 — achieved 时一定有 achievedAt；in_progress / pending 时可附 progress。 */
  status: MilestoneStatus;
  /** 完成时间。pending / in_progress 时为空。 */
  achievedAt?: string;
  /** 图标 enum。 */
  icon: MilestoneIcon;
  /** 重要程度，用来视觉权重 / 排序兜底。 */
  weight: MilestoneWeight;
  /** 跳到对应模块的 URL（可选）。 */
  href?: string;
  /** 仅 in_progress / pending 时显示的进度条。 */
  progress?: {
    current: number;
    target: number;
    unit: string;
    label: string;
  };
  /** 额外强调信息：FTD 显示金额、首单显示品种 / 手数。 */
  highlight?: string;
}

// ============================================================
// 11. 审计日志
// ============================================================
export interface AuditLog {
  id: string;
  clientId: string;
  operator: string;
  action: string;
  targetField: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
  ipAddress: string;
}

// ============================================================
// 12. 风险关系
// ============================================================
export interface RiskRelationship {
  targetClientId: string;
  targetClientName: string;
  relationshipType: "shared_ip" | "shared_device" | "shared_bank" | "shared_crypto_wallet" | "same_name";
  strength: number;
  details: string;
  detectedAt: string;
}

// ============================================================
// 13. 风险因子
// ============================================================
export interface RiskFactor {
  name: string;
  score: number;
  maxScore: number;
  level: "low" | "medium" | "high";
  description: string;
}

// ============================================================
// 14. 生命周期阶段
// ============================================================
export interface LifecycleStageInfo {
  stage: "registered" | "verified" | "ftd" | "active_trader" | "inactive" | "churn";
  label: string;
  reachedAt?: string;
  isCurrent: boolean;
}

// ============================================================
// 15. 用户价值指标
// ============================================================
export interface UserValueMetrics {
  netDeposit: number;
  currentBalance: number;
  equity: number;
  totalLots: number;
  openPositions: number;
  totalProfit: number;
  totalProfitPercent: number;
}

// ============================================================
// 16. 快速操作
// ============================================================
export type QuickActionType =
  | "freeze_account"
  | "unfreeze_account"
  | "restrict_withdrawal"
  | "allow_withdrawal"
  | "request_resubmission"
  | "adjust_leverage"
  | "modify_permissions"
  | "add_note"
  | "create_ticket"
  | "send_notification";

export interface QuickAction {
  type: QuickActionType;
  label: string;
  description: string;
  icon: string;
  variant: "default" | "danger" | "warning";
  requiresConfirmation: boolean;
}

// ============================================================
// 16.5. 客户钱包（CRM 层钱包，与 MT 交易账户独立）
// ============================================================
/**
 * 平台钱包：客户在 broker 平台的「内部账户」，与 MT 交易账户解耦。
 * 入金先进钱包，再从钱包划转到 MT 账户。
 *
 * v1 只支持 USD 单币种（产品决策，2026-05-16）；保留 currency 字段为
 * 未来多币种扩展埋点。
 */
export interface ClientWallet {
  id: string;
  clientId: string;
  /** ISO 4217 — v1 固定为 "USD"。 */
  currency: string;
  /** 钱包总余额（含冻结部分）。 */
  balance: number;
  /** 已冻结金额（提款审核中 / 风控冻结等）。 */
  frozen: number;
  /** 可用余额 = balance - frozen（CRM 计算字段，便于 UI 直接消费）。 */
  available: number;
  /** 最近一次有资金流动的时间。 */
  lastTransactionAt?: string;
  /** 24 小时净流入（含入金 - 出金 + 划转）。用于钱包卡片趋势提示。 */
  flow24h?: number;
  /** 钱包状态。frozen = 整个钱包被冻结，不可入/出/划转。 */
  status: "active" | "frozen";
}

// ============================================================
// 17. Client Detail 聚合数据
// ============================================================
export interface ClientDetailData {
  user: BackofficeUser;
  accounts: TradingAccount[];
  /** 平台钱包（v1 仅 USD）。 */
  wallets: ClientWallet[];
  funds: FundRecord[];
  trades: TradeRecord[];
  tradingStats: TradingStats;
  kycDocuments: KYCDocument[];
  kycRiskIndicators: KYCRiskIndicator[];
  devices: ClientDevice[];
  cases: CaseItem[];
  tickets: Ticket[];
  permissions: ClientPermission[];
  agreements: ClientAgreement[];
  timeline: TimelineEvent[];
  /** 客户生命周期里程碑（达成 + 未达成）。 */
  milestones: ClientMilestone[];
  notes: ClientNote[];
  auditLogs: AuditLog[];
  riskRelationships: RiskRelationship[];
  riskFactors: RiskFactor[];
  lifecycleStages: LifecycleStageInfo[];
  valueMetrics: UserValueMetrics;
}

// ============================================================
// 18. 内部笔记（复用并扩展）
// ============================================================
export interface ClientNote {
  id: string;
  clientId: string;
  content: string;
  author: string;
  authorName: string;
  mentions: string[];
  isPinned: boolean;
  noteType: "general" | "risk" | "sales" | "followup";
  createdAt: string;
}
