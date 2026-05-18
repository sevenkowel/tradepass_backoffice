/**
 * CLM Case Types
 * Core data model for Compliance Lifecycle Management
 */

import type { CLMCustomerSnapshot } from "./customer";
import type { CLMAuditLog } from "./audit";

/**
 * CLM Case type vocabulary — **compliance-scoped only**.
 *
 * CLM's positioning is user-profile / identity-data review. Financial
 * operation reviews (deposits, withdrawals, trade anomalies) live in
 * their own domains (Treasury / Risk). Adding a type here implies the
 * Review Queue, Workspace KPIs, SLA monitoring, and Audit Trail all
 * consider it a compliance task — so this list stays narrow.
 *
 * Notably absent: `withdrawal_review` / `deposit_review`. Those used
 * to live here; they were moved out so the Review Queue stays the
 * compliance inbox without case-by-case filtering.
 */
export type CLMCaseType =
  | "kyc"
  | "poa"
  | "liveness"
  | "video_verification"
  | "edd"
  | "source_of_wealth"
  | "agreement_signing"
  | "manual_review"
  // Phase 4 / PRD-driven: every Re-Verification request spawns a case
  // of this type once the user submits. The case type is stable across
  // the seven sub-types (re_identity / re_liveness / …) — sub-type lives
  // on the linked `ReVerificationRequest`.
  | "re_verification";

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
/**
 * Outcome of the automated pre-review pipeline as a list-page filter
 * value. The full detail object lives in `detail.ts` as `AutoReviewResult`.
 */
export type AutoReviewVerdict = "pass" | "reject" | "pending" | "not_checked";

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
  autoReviewResult?: AutoReviewVerdict;

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
  type:
    | "id_document"
    | "poa"               // proof of address
    | "income_proof"      // payslip / tax return / bank statement
    | "liveness_image"
    | "liveness_video"
    | "bank_account"
    | "agreement";
  label: string;
  url: string;
  thumbnailUrl?: string;
  ocrResult?: OCRResult;
  /**
   * Fields the user confirmed / manually entered during the KYC form.
   * Keys match OCRResult field names (e.g. "extractedName").
   * When a value differs from ocrResult, the UI highlights the mismatch.
   */
  userSubmittedFields?: Record<string, string>;
  status: "submitted" | "verified" | "rejected";
  submittedAt: string;
  /**
   * 3rd-party authenticity check (Sumsub / Onfido / Jumio / internal).
   * Optional — not every material type is sent to a provider.
   */
  verification?: import("@/types/core/third-party-verification").ThirdPartyVerification;
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
  /**
   * Optional 6-axis explainable breakdown. When present, UI prefers
   * rendering this over the legacy flat `*Risk` enums above. Produced
   * by `lib/risk-engine` — see `RiskProfile` in `@/types/core`.
   */
  factors?: import("@/types/core/risk-profile").RiskFactor[];
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
  /** When set, this comment is a reply to the given timeline event or
   *  comment id. Used by the timeline UI to draw a thread indent and
   *  the connector arrow back to the parent. */
  parentId?: string;
}

/**
 * Timeline event categories — drives icon + colour + grouping in the UI.
 *
 * - `submission` (blue): customer-side action (submit / resubmit)
 * - `system`     (slate): automated check (OCR / AML / risk engine / routing)
 * - `assignment` (purple): case ownership transfer (assigned / accepted / escalated)
 * - `comment`    (slate): internal note from a reviewer
 * - `decision`   (emerald/red): terminal verdict (approve / reject / blacklist)
 */
export type TimelineEventCategory =
  | "submission"
  | "system"
  | "assignment"
  | "comment"
  | "decision";

/**
 * Outcome of a `decision` event. Drives the badge colour shown on the
 * right edge of the timeline row. `metadata.result` carries this when
 * `category === "decision"`.
 */
export type TimelineDecisionResult =
  | "approved"
  | "rejected"
  | "resubmit_requested"
  | "escalated"
  | "blacklisted"
  | "auto_approved"
  | "auto_rejected";

/** Structured metadata the timeline UI knows how to render specially.
 *  The `metadata` field is still loose `Record<string, unknown>`-shaped
 *  so producers can add domain bits beyond these. */
export interface TimelineMetadata {
  /** For `decision` events. */
  result?: TimelineDecisionResult;
  /** Reviewer-supplied justification. Rendered as a quoted block. */
  reason?: string;
  /** Optional headline numeric (risk score, OCR confidence, …). */
  score?: number;
  [key: string]: unknown;
}

export interface CaseTimelineEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  description: string;
  /** Visual category for the timeline UI. Defaults to `system` if absent. */
  category?: TimelineEventCategory;
  metadata?: TimelineMetadata;
  /** When set, this event is a thread reply to the given event id. The
   *  timeline UI renders this with indent + parent connector. Currently
   *  only `category === "comment"` events use this. */
  parentId?: string;
}

export interface CaseListParams {
  caseType?: CLMCaseType;
  riskLevel?: RiskLevel;
  country?: string;
  amlStatus?: AMLStatus;
  slaStatus?: SLACaseStatus;
  status?: CLMCaseStatus;
  /**
   * Restrict the result to a set of statuses. Used by Review Queue to
   * keep its "hot inbox" semantics (`pending / reviewing / escalated /
   * resubmission`) regardless of which user-facing filter is active.
   */
  statusIn?: CLMCaseStatus[];
  /**
   * Restrict the result to a set of case types. The Review Queue uses
   * this to scope itself to KYC-related work only — withdrawal /
   * deposit reviews belong to Treasury, not the compliance inbox.
   * The user-facing Task-Type filter narrows further inside this set.
   */
  typeIn?: CLMCaseType[];
  /**
   * Filter by how the case was resolved:
   *   - `auto`    → status ∈ { auto_approved, auto_rejected }
   *   - `manual`  → status ∈ { approved, rejected } (reviewer-decided)
   *   - `pending` → still open (status ∈ active set)
   *
   * Encoded as a separate enum rather than `statusIn` so the Cases page
   * can offer a one-tap "Show me everything the engine decided" filter.
   */
  decisionMode?: "auto" | "manual" | "pending";
  assignee?: "unassigned" | "me" | string;
  search?: string;
  startDate?: string;
  endDate?: string;
  customerTier?: string;
  priority?: Priority;
  sourceChannel?: SourceChannel;
  autoReviewResult?: AutoReviewVerdict;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
