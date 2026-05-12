/**
 * Mock seeds for the v2.0 simplified Configuration surface.
 *
 * Five pools — KYC flows, three rule families, and the Identity-module
 * system config. The shapes mirror the new PRD layout (Flows · Rules ·
 * Agreement Documents · System Modules); the older Policies / Levels /
 * Forms / Templates seeds in `mock-config.ts` stay untouched so the
 * orphaned routes (kept around for back-compat) still render.
 */
import type {
  AutoReviewRule,
  IdentityModuleConfig,
  KYCFlow,
  KYCFlowRoutingRule,
  POAModuleConfig,
  IncomeProofModuleConfig,
  LivenessModuleConfig,
  QuestionnaireModuleConfig,
} from "@/types/clm";

const m = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();
const h = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

/* ------------------------------------------------------------------------- */
/* KYC Flows                                                                 */
/* ------------------------------------------------------------------------- */

export const mockKycFlows: KYCFlow[] = [
  {
    id: "flow-001",
    name: "Standard Retail",
    description:
      "Baseline retail onboarding — document + liveness, plus a basic suitability questionnaire and the standard agreements.",
    contact: { enabled: true, requireMobileOtp: true, requireEmailOtp: true },
    identity: {
      documentVerification: true,
      liveness: true,
      selfie: true,
      forceCameraOnly: false,
    },
    proofOfAddress: { enabled: false },
    incomeProof: { enabled: false },
    questionnaire: { enabled: true },
    agreement: {
      enabled: true,
      agreementIds: ["agr-001", "agr-002"],
    },
    status: "active",
    updatedBy: "Admin A",
    updatedAt: h(24 * 14),
    createdAt: h(24 * 90),
  },
  {
    id: "flow-002",
    name: "EU Retail (CySEC)",
    description:
      "Strict onboarding for EU residents — adds proof of address and a stricter forced-camera capture for the selfie.",
    contact: { enabled: true, requireMobileOtp: true, requireEmailOtp: true },
    identity: {
      documentVerification: true,
      liveness: true,
      selfie: true,
      forceCameraOnly: true,
    },
    proofOfAddress: { enabled: true },
    incomeProof: { enabled: false },
    questionnaire: { enabled: true },
    agreement: {
      enabled: true,
      agreementIds: ["agr-001", "agr-002"],
    },
    status: "active",
    updatedBy: "Compliance",
    updatedAt: h(24 * 7),
    createdAt: h(24 * 60),
  },
  {
    id: "flow-003",
    name: "Enhanced Due Diligence",
    description:
      "Full EDD — every module enabled, including income proof. Used for high-risk jurisdictions and large-deposit pathways.",
    contact: { enabled: true, requireMobileOtp: true, requireEmailOtp: true },
    identity: {
      documentVerification: true,
      liveness: true,
      selfie: true,
      forceCameraOnly: true,
    },
    proofOfAddress: { enabled: true },
    incomeProof: { enabled: true },
    questionnaire: { enabled: true },
    agreement: {
      enabled: true,
      agreementIds: ["agr-001", "agr-002", "agr-003"],
    },
    status: "active",
    updatedBy: "Compliance",
    updatedAt: h(24 * 3),
    createdAt: h(24 * 30),
  },
  {
    id: "flow-004",
    name: "SVG Offshore (Simplified)",
    description:
      "Lightweight onboarding for SVG-licensed accounts — document only, no questionnaire or POA.",
    contact: { enabled: true, requireMobileOtp: false, requireEmailOtp: true },
    identity: {
      documentVerification: true,
      liveness: false,
      selfie: true,
      forceCameraOnly: false,
    },
    proofOfAddress: { enabled: false },
    incomeProof: { enabled: false },
    questionnaire: { enabled: false },
    agreement: {
      enabled: true,
      agreementIds: ["agr-001"],
    },
    status: "draft",
    updatedBy: "Admin C",
    updatedAt: m(40),
    createdAt: h(48),
  },
];

/* ------------------------------------------------------------------------- */
/* Routing rules — KYC Flow assignment                                       */
/* ------------------------------------------------------------------------- */

export const mockKycFlowRoutingRules: KYCFlowRoutingRule[] = [
  {
    id: "fr-001",
    name: "EU residents → EU Retail",
    field: "country_of_residence",
    values: ["CY", "DE", "FR", "ES", "IT", "PT", "NL", "SE", "FI", "AT", "IE"],
    flowId: "flow-002",
    priority: 9,
    status: "active",
    updatedBy: "Compliance",
    updatedAt: h(24 * 14),
    createdAt: h(24 * 60),
  },
  {
    id: "fr-002",
    name: "High-risk countries → EDD",
    field: "country_of_residence",
    values: ["AE", "RU", "IR", "VG"],
    flowId: "flow-003",
    priority: 10,
    status: "active",
    updatedBy: "Compliance",
    updatedAt: h(24 * 7),
    createdAt: h(24 * 30),
  },
  {
    id: "fr-003",
    name: "Default → Standard Retail",
    field: "country_of_residence",
    values: ["*"],
    flowId: "flow-001",
    priority: 1,
    status: "active",
    updatedBy: "System",
    updatedAt: h(24 * 30),
    createdAt: h(24 * 120),
  },
  {
    id: "fr-004",
    name: "US passport holders → blocked",
    field: "passport_nationality",
    values: ["US"],
    flowId: "flow-002",
    priority: 8,
    status: "draft",
    updatedBy: "Compliance",
    updatedAt: m(120),
    createdAt: h(24),
  },
];

/* ------------------------------------------------------------------------- */
/* Auto-review rules                                                         */
/* ------------------------------------------------------------------------- */

export const mockAutoReviewRules: AutoReviewRule[] = [
  {
    id: "ar-001",
    name: "Clean signals → Auto-approve",
    logic: "and",
    conditions: [
      { field: "ocr_confidence", operator: "gte", value: 90 },
      { field: "face_match_score", operator: "gte", value: 85 },
      { field: "aml_status", operator: "eq", value: "pass" },
      { field: "risk_level", operator: "in", value: ["low", "medium"] },
    ],
    outcome: "auto_approve",
    priority: 3,
    status: "active",
    updatedBy: "System",
    updatedAt: h(24 * 30),
    createdAt: h(24 * 120),
  },
  {
    id: "ar-002",
    name: "AML hit or critical risk → Auto-reject",
    logic: "or",
    conditions: [
      { field: "aml_status", operator: "eq", value: "hit" },
      { field: "risk_level", operator: "eq", value: "critical" },
    ],
    outcome: "auto_reject",
    priority: 10,
    status: "active",
    updatedBy: "Senior Reviewer",
    updatedAt: h(24 * 14),
    createdAt: h(24 * 60),
  },
  {
    id: "ar-003",
    name: "Suspicious source → Manual review",
    logic: "and",
    conditions: [
      { field: "registration_source", operator: "eq", value: "api" },
      { field: "risk_level", operator: "in", value: ["medium", "high"] },
    ],
    outcome: "manual_review",
    priority: 7,
    status: "active",
    updatedBy: "Compliance",
    updatedAt: h(24 * 21),
    createdAt: h(24 * 60),
  },
];

/* ------------------------------------------------------------------------- */
/* System Modules — Identity verification config                             */
/* ------------------------------------------------------------------------- */

export const mockIdentityModuleConfig: IdentityModuleConfig = {
  id: "system-identity",
  policies: [
    { country: "ID", allowedTypes: ["national_id", "passport"] },
    { country: "VN", allowedTypes: ["national_id", "passport"] },
    { country: "TH", allowedTypes: ["national_id", "passport", "drivers_license"] },
    { country: "AE", allowedTypes: ["passport"] },
    { country: "Global", allowedTypes: ["passport"] },
  ],
  documentTypeDefaults: [
    { kind: "national_id",      backSideEnabled: true,  backSideRequired: true  },
    { kind: "passport",         backSideEnabled: false, backSideRequired: false },
    { kind: "drivers_license",  backSideEnabled: true,  backSideRequired: true  },
  ],
  expiryRules: [
    { kind: "passport",         checkEnabled: true,  rejectIfExpiringWithinMonths: 6 },
    { kind: "drivers_license",  checkEnabled: true,  rejectIfExpiringWithinMonths: 1 },
    { kind: "national_id",      checkEnabled: false, rejectIfExpiringWithinMonths: 0 },
  ],
  uploadConfig: {
    acceptedFormats: ["jpg", "png", "pdf"],
    maxFileSizeMb: 5,
    maxRetryAttemptsPerUser: 10,
    retryWindowHours: 24,
    maxRetryAttemptsPerWindow: 3,
    duplicateDocumentNumberCheck: true,
  },
  status: "active",
  updatedBy: "Compliance",
  updatedAt: h(24 * 30),
  createdAt: h(24 * 120),
};

export const mockPOAModuleConfig: POAModuleConfig = {
  id: "system-poa",
  acceptedDocuments: ["utility_bill", "bank_statement", "government_letter"],
  maxAgeMonths: 3,
  acceptedFormats: ["jpg", "png", "pdf"],
  maxFileSizeMb: 10,
  status: "active",
  updatedBy: "Compliance",
  updatedAt: h(24 * 30),
  createdAt: h(24 * 120),
};

export const mockIncomeProofModuleConfig: IncomeProofModuleConfig = {
  id: "system-income",
  acceptedDocuments: ["payslip", "tax_return", "bank_statement"],
  periodCoverageMonths: 3,
  acceptedFormats: ["jpg", "png", "pdf"],
  maxFileSizeMb: 10,
  status: "active",
  updatedBy: "Compliance",
  updatedAt: h(24 * 30),
  createdAt: h(24 * 120),
};

export const mockLivenessModuleConfig: LivenessModuleConfig = {
  id: "system-liveness",
  provider: "tradepass",
  providerConfig: {},
  confidenceThreshold: 80,
  maxAttempts: 3,
  status: "active",
  updatedBy: "Compliance",
  updatedAt: h(24 * 30),
  createdAt: h(24 * 120),
};

export const mockQuestionnaireModuleConfig: QuestionnaireModuleConfig = {
  id: "system-questionnaire",
  fields: [
    { id: "q1", label: "Employment Status",      type: "select",  required: true,  order: 1,
      options: [{ label: "Employed", value: "employed" }, { label: "Self-employed", value: "self_employed" }, { label: "Retired", value: "retired" }, { label: "Unemployed", value: "unemployed" }] },
    { id: "q2", label: "Annual Income (USD)",     type: "select",  required: true,  order: 2,
      options: [{ label: "< $25,000", value: "lt25k" }, { label: "$25,000 – $100,000", value: "25k_100k" }, { label: "> $100,000", value: "gt100k" }] },
    { id: "q3", label: "Source of Wealth",        type: "multiselect", required: true, order: 3,
      options: [{ label: "Employment", value: "employment" }, { label: "Investment", value: "investment" }, { label: "Inheritance", value: "inheritance" }, { label: "Business", value: "business" }] },
    { id: "q4", label: "Trading Experience",      type: "select",  required: true,  order: 4,
      options: [{ label: "None", value: "none" }, { label: "1–3 years", value: "1_3y" }, { label: "3–5 years", value: "3_5y" }, { label: "5+ years", value: "5plus" }] },
    { id: "q5", label: "Investment Objective",    type: "select",  required: true,  order: 5,
      options: [{ label: "Speculation", value: "speculation" }, { label: "Hedging", value: "hedging" }, { label: "Income", value: "income" }] },
    { id: "q6", label: "Risk Tolerance",          type: "select",  required: true,  order: 6,
      options: [{ label: "Low", value: "low" }, { label: "Medium", value: "medium" }, { label: "High", value: "high" }] },
  ],
  status: "active",
  updatedBy: "Compliance",
  updatedAt: h(24 * 30),
  createdAt: h(24 * 120),
};
