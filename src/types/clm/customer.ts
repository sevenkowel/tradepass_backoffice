/**
 * CLM Customer Types
 * Compliance-focused customer profile
 */

import type { RiskLevel, AMLStatus } from "./case";

export interface CLMCustomerSnapshot {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  nationality: string;
  dateOfBirth: string;
  registrationDate: string;
  kycLevel: "tier0" | "tier1" | "tier2" | "tier3" | "tier4";
  accountStatus: "active" | "restricted" | "suspended" | "closed" | "blacklisted";
  totalCases: number;
  pendingCases: number;
  lastCaseType?: string;
  lastCaseStatus?: string;
}

export interface CLMCustomerKYCStatus {
  identityVerification: "approved" | "pending" | "failed" | "not_required";
  poa: "approved" | "pending" | "failed" | "not_required";
  liveness: "approved" | "pending" | "failed" | "not_required";
  videoVerification: "approved" | "pending" | "failed" | "not_required";
  agreementSigning: "signed" | "pending" | "expired";
}

export interface CLMCustomerDetail extends CLMCustomerSnapshot {
  kycStatus: CLMCustomerKYCStatus;
  riskProfile: import("./case").RiskAssessment;
}

export interface CLMCaseSummary {
  id: string;
  caseNo: string;
  type: import("./case").CLMCaseType;
  status: import("./case").CLMCaseStatus;
  result?: string;
  reviewer?: string;
  updatedAt: string;
}
