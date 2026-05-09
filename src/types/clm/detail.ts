/**
 * CLM Case Detail Types
 * Extended data for the Case Detail page (not included in list)
 */

import type { CLMCase, AMLStatus } from "./case";

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
