/**
 * Client Detail Page Types
 * 扩展 BackofficeUser，提供 Client 360 各 Tab 所需的完整数据模型
 */

import type { BackofficeUser, RiskLevel } from "./user";

// ============================================================
// 1. 交易账户
// ============================================================
export interface TradingAccount {
  id: string;
  mtAccount: string;
  accountType: "Standard" | "ECN" | "PRO" | "VIP";
  leverage: string;
  status: "active" | "disabled" | "restricted";
  balance: number;
  equity: number;
  margin: number;
  marginLevel: string;
  group: string;
  createdAt: string;
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
  symbol: string;
  type: "buy" | "sell";
  volume: number;
  openPrice: number;
  closePrice?: number;
  profit?: number;
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
// 6. 审批 Case
// ============================================================
export type CaseType = "kyc_review" | "withdrawal_review" | "resubmission_review" | "video_verification";
export type CaseStatus = "pending" | "in_review" | "approved" | "rejected" | "escalated";

export interface CaseItem {
  id: string;
  caseId: string;
  clientId: string;
  type: CaseType;
  status: CaseStatus;
  priority: "low" | "medium" | "high" | "urgent";
  sla: string;
  reviewer?: string;
  createdAt: string;
  updatedAt: string;
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
export interface ClientAgreement {
  id: string;
  clientId: string;
  agreementType: string;
  version: string;
  signedAt: string;
  signedIp: string;
  pdfUrl: string;
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
// 17. Client Detail 聚合数据
// ============================================================
export interface ClientDetailData {
  user: BackofficeUser;
  accounts: TradingAccount[];
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
