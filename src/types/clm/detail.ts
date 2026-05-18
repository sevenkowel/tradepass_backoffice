/**
 * CLM Case Detail Types
 * Extended data for the Case Detail page (not included in list)
 */

import type { CLMCase, AMLStatus } from "./case";

// ============================================================
// ============================================================
// KYC Flow Steps — for Escalate modal
// ============================================================
export type KYCFlowStepId =
  | "phone_email"
  | "document"
  | "liveness"
  | "poa"
  | "income_proof"
  | "video_verification";

export const KYC_FLOW_STEP_LABELS: Record<KYCFlowStepId, string> = {
  phone_email:        "Phone / Email Verification",
  document:           "Identity Document",
  liveness:           "Liveness Check",
  poa:                "Proof of Address",
  income_proof:       "Income Proof",
  video_verification: "Video Verification",
};

export interface KYCFlowStepInfo {
  id: KYCFlowStepId;
  /** Whether this step is already part of the user's current KYC flow. */
  included: boolean;
  /** Whether the user has successfully completed this step. */
  completed: boolean;
}

// ============================================================
// Type-specific content — Liveness
// ============================================================
export interface LivenessResult {
  confidenceScore: number;        // 0–100
  passed: boolean;
  attemptCount: number;
  completedAt: string;
  provider: string;
  selfieImageUrl?: string;
  documentFaceImageUrl?: string;
}

// ============================================================
// Type-specific content — POA
// ============================================================
export interface POADetail {
  submittedDocumentType: string;
  documentUrl?: string;
  documentIssuedDate?: string;
  declaredAddress: string;
  extractedAddress?: string;
  /** null = not yet validated */
  addressMatch?: boolean | null;
}

// ============================================================
// Type-specific content — Video Verification
// ============================================================
export interface VideoChecklistItem {
  id: string;
  label: string;
  /** null = reviewer has not yet marked this item */
  passed: boolean | null;
}

export interface VideoVerificationDetail {
  videoUrl?: string;
  recordedAt: string;
  durationSeconds?: number;
  checklist: VideoChecklistItem[];
}

// ============================================================
// Submission Context — IP + device used to file this case
// ============================================================
/**
 * Snapshot of the request environment for THIS case submission
 * (separate from `PersonalInfo.registrationIp/Device` which is the
 * original account-registration snapshot).
 *
 * The `shared*AccountIds` arrays are populated by a backend look-up
 * over a recent window (e.g. 90 days) — they're the anti-fraud signal
 * the reviewer needs to spot multi-account abuse from a shared IP /
 * shared device fingerprint.
 */
export interface SubmissionContext {
  ip: string;
  device: string;
  submittedAt: string;
  /** Optional geo enrichment of `ip`. Use `lookupIPGeo()` in mocks. */
  ipGeo?: import("@/types/core").IPGeoInfo;
  /** Other accounts (UIDs) seen on this same IP in the recent window.
   *  Excludes the current case's customer. Empty = no duplication. */
  sharedIpAccountIds: string[];
  /** Other accounts on this same device fingerprint. */
  sharedDeviceAccountIds: string[];
}

// ============================================================
// CaseDetail — extends CLMCase with full detail data
// ============================================================
export interface CaseDetail extends CLMCase {
  personalInfo?: PersonalInfo;
  experience?: ExperienceInfo;
  agreements?: AgreementRecord[];
  disclaimer?: DisclaimerInfo;
  autoReview?: AutoReviewResult;
  manualReview?: ManualReviewInfo;
  reviewerHistory?: ReviewAction[];
  relationshipGraph?: RelationNode[];
  /** IP + device used to submit this case (separate from registration). */
  submission?: SubmissionContext;
  // ── Type-specific fields ─────────────────────────────────
  /** KYC cases: which flow steps are included + completion state. */
  kycFlowSteps?: KYCFlowStepInfo[];
  /** Liveness cases: face-match result. */
  livenessResult?: LivenessResult;
  /** POA cases: document + address comparison. */
  poaDetail?: POADetail;
  /** Video verification cases: checklist + recording. */
  videoVerification?: VideoVerificationDetail;
}

// ============================================================
// Personal Information (extended user info)
// ============================================================
export interface PersonalInfo {
  registrationTime: string;
  registrationIp?: string;
  registrationDevice?: string;
  registrationSource?: string;
  ibReferral?: string;
  ibName?: string;
  ibId?: string;
  emailMasked: string;
  phoneMasked: string;
}

// ============================================================
// Personal Experience Questionnaire
// ============================================================
export interface ExperienceInfo {
  family: {
    maritalStatus: string;
    dependents: number;
  };
  education: {
    level: string;
    field?: string;
  };
  employment: {
    status: string;
    occupation: string;
    employer?: string;
    position?: string;
  };
  financial: {
    annualIncome: string;
    netWorth: string;
    sourceOfFunds?: string;
  };
  trading: {
    years: string;
    products: string[];
    tradingFrequency?: string;
    leverageUnderstanding: boolean;
    riskUnderstanding: boolean;
    riskTolerance?: string;
  };
  declarations?: {
    isUSPerson: boolean;
    isPEP: boolean;
    isMilitary: boolean;
    isFinancialProfessional: boolean;
    hasCriminalRecord: boolean;
  };
}

// ============================================================
// Agreement Signing Records
// ============================================================
export interface AgreementRecord {
  id: string;
  name: string;
  version: string;
  signedAt: string;
  ipAddress: string;
  language: string;
  signatureType: "handwritten" | "text";
  pdfUrl?: string;
  forceResign?: boolean;
  status: "signed" | "pending" | "expired";
}

// ============================================================
// Disclaimer / Declarations
// ============================================================
export interface DisclaimerInfo {
  usPerson: boolean;
  pep: boolean;
  military: boolean;
  financialProfessional: boolean;
  criminalRecord: boolean;
  taxResidency: string;
  fatcaRelated: boolean;
  declarationsConfirmed: boolean;
}

// ============================================================
// Auto Review Engine Results
// ============================================================
export interface AutoReviewResult {
  ocrScore: number;
  ocrPassed: boolean;
  ocrDetails?: string[];
  amlResult: AMLStatus;
  amlDetails?: string[];
  faceMatchScore: number;
  faceMatchPassed: boolean;
  deviceRisk: "normal" | "suspicious" | "high";
  ipRisk: "normal" | "vpn" | "proxy" | "tor";
  riskEngineScore: number;
  overall: "auto_pass" | "manual_review" | "auto_reject";
}

// ============================================================
// Manual Review Info
// ============================================================
export interface ManualReviewInfo {
  reviewer: string;
  reviewerRole: string;
  duration: string;           // "4m 30s"
  decision?: string;
  escalationStatus?: "none" | "pending" | "resolved";
}

// ============================================================
// Review Action History
// ============================================================
export interface ReviewAction {
  id: string;
  action: string;
  actor: string;
  actorRole: string;
  timestamp: string;
  note?: string;
  previousStatus: string;
  newStatus: string;
}

// ============================================================
// Relationship Graph (for Risk Section)
// ============================================================
export interface RelationNode {
  type: "shared_ip" | "shared_device" | "shared_bank" | "shared_wallet";
  targetUid: string;
  targetName: string;
  strength: number;
  details: string;
}
