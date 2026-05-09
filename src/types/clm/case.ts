/**
 * CLM Case Types
 * Core data model for Compliance Lifecycle Management
 */

export type CLMCaseType =
  | "kyc"
  | "poa"
  | "liveness"
  | "video_verification"
  | "withdrawal_review"
  | "edd"
  | "source_of_wealth"
  | "agreement_signing"
  | "risk_recheck"
  | "manual_review";

export type CLMCaseStatus =
  | "pending"
  | "reviewing"
  | "resubmission"
  | "escalated"
  | "approved"
  | "rejected"
  | "auto_approved"
  | "auto_rejected"
  | "cancelled"
  | "expired";

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type AMLStatus = "not_checked" | "pass" | "hit" | "pending";
export type SLACaseStatus = "normal" | "near_timeout" | "timeout";

export type KYCLevel = "tier0" | "tier1" | "tier2" | "tier3" | "tier4";
export type Priority = "normal" | "vip" | "high_risk" | "urgent";
export type SourceChannel = "website" | "ib" | "partner" | "mobile" | "api";
export type AutoReviewResult = "pass" | "reject" | "pending" | "not_checked";

export interface CLMCase {
  id: string;
  caseNo: string;
  customerId: string;
  customerName: string;
  customerUid: string;
  country: string;
  type: CLMCaseType;
  status: CLMCaseStatus;
  riskLevel: RiskLevel;
  amlStatus: AMLStatus;
  triggerSource: string;

  // 新增列表字段
  kycLevel?: KYCLevel;
  priority?: Priority;
  sourceChannel?: SourceChannel;
  autoReviewResult?: AutoReviewResult;

  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;

  slaMinutes: number;
  slaDueAt: string;
  slaStatus: SLACaseStatus;

  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;

  reviewDecision?: "approve" | "reject" | "resubmit" | "escalate";
  reviewReason?: string;
  resubmissionReason?: string;

  // 详情页展开数据（不参与列表）
  personalInfo?: import("./detail").PersonalInfo;
  experience?: import("./detail").ExperienceInfo;
  agreements?: import("./detail").AgreementRecord[];
  disclaimer?: import("./detail").DisclaimerInfo;
  autoReview?: import("./detail").AutoReviewResult;
  manualReview?: import("./detail").ManualReviewInfo;
  reviewerHistory?: import("./detail").ReviewAction[];
  relationshipGraph?: import("./detail").RelationNode[];
  customerSnapshot?: CLMCustomerSnapshot;
  submittedMaterials?: SubmittedMaterial[];
  riskAssessment?: RiskAssessment;
  comments?: CaseComment[];
  timeline?: CaseTimelineEvent[];
  auditLogs?: CLMAuditLog[];
}

export interface SubmittedMaterial {
  id: string;
  type: "id_document" | "poa" | "liveness_image" | "liveness_video" | "bank_account" | "agreement";
  label: string;
  url: string;
  thumbnailUrl?: string;
  ocrResult?: OCRResult;
  status: "submitted" | "verified" | "rejected";
  submittedAt: string;
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

export interface RiskAssessment {
  riskScore: number;
  riskLevel: RiskLevel;
  amlStatus: AMLStatus;
  countryRisk: "low" | "medium" | "high";
  deviceRisk: "normal" | "suspicious";
  ipRisk: "normal" | "vpn" | "proxy";
  fundingRisk: "normal" | "high";
  multiAccountRisk: "none" | "same_device" | "same_ip" | "same_bank";
  indicators: RiskIndicator[];
}

export interface RiskIndicator {
  type: string;
  level: "low" | "medium" | "high" | "critical";
  description: string;
}

export interface CaseComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  mentions: string[];
  isInternal: boolean;
  createdAt: string;
}

export interface CaseTimelineEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface CaseListParams {
  caseType?: CLMCaseType;
  riskLevel?: RiskLevel;
  country?: string;
  amlStatus?: AMLStatus;
  slaStatus?: SLACaseStatus;
  status?: CLMCaseStatus;
  assignee?: "unassigned" | "me" | string;
  search?: string;
  startDate?: string;
  endDate?: string;
  customerTier?: string;
  priority?: Priority;
  sourceChannel?: SourceChannel;
  autoReviewResult?: AutoReviewResult;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
