/**
 * CLM Configuration Types — the data model behind the Phase 4 config pages.
 *
 * One file holds all six entity shapes because they share a common
 * lifecycle (`draft → active → retired`), the same actor/audit fields,
 * and the same CRUD surface. Splitting them across files would hide that
 * symmetry.
 *
 * Each entity is the persisted form of *one* row on its respective config
 * screen:
 *
 *   - KYCPolicy     — KYC Policies page (rule engine entries)
 *   - KYCLevel      — KYC Levels page (tiers + permission matrix)
 *   - KYCForm       — Forms & Fields page (per-country form templates)
 *   - ConfigTemplate — Templates page (regulator-bundle bookmarks)
 *   - ConfigAgreement — Agreements page (legal docs + versioning)
 *   - WorkflowRule  — Workflows page + Routing page (assignment + escalation)
 *
 * The `RoutingRule` type is an alias around `WorkflowRule` constrained to
 * `type: "routing"` — exposed under its own name because the dedicated
 * /crm/clm/routing editor wants the narrower contract.
 */

/** Status for any config entity. */
export type ConfigStatus = "draft" | "active" | "retired";

/** Common audit/identity fields every config entity carries. */
interface ConfigBase {
  id: string;
  status: ConfigStatus;
  /** Display priority; higher number → checked first. */
  priority?: number;
  updatedBy: string;
  updatedAt: string;
  createdAt: string;
}

/* ------------------------------------------------------------------------- */
/* KYC Policy                                                                */
/* ------------------------------------------------------------------------- */

export type KYCPolicyType =
  | "country"
  | "document"
  | "risk"
  | "aml"
  | "deposit"
  | "withdrawal"
  | "account"
  | "auto_review";

/**
 * PRD §7.5 — KYC Policies live in seven operator-facing buckets. The
 * sidebar of `/crm/clm/policies` filters by this category; the engine
 * itself doesn't care which bucket a policy is in.
 */
export type KYCPolicyCategory =
  | "review"
  | "risk"
  | "routing"
  | "escalation"
  | "sla"
  | "automation"
  | "permission";

export interface KYCPolicy extends ConfigBase {
  name: string;
  type: KYCPolicyType;
  /** Operator-facing category (PRD §7.5). Drives the policies sidebar. */
  category: KYCPolicyCategory;
  /** ISO country code or `"Global"`. */
  country: string;
  /** Pseudo-rule string: `IF <condition> THEN <action>`. Stored as text;
   *  the `/crm/clm/routing` editor parses it back into structured form. */
  rule: string;
  description?: string;
}

/* ------------------------------------------------------------------------- */
/* KYC Level                                                                 */
/* ------------------------------------------------------------------------- */

export interface KYCLevelConfig extends ConfigBase {
  name: string;
  /** Friendly label shown alongside the tier name. */
  label: string;
  /** Tailwind class pair for the badge (`bg-x-100 text-x-700`). */
  badgeClass: string;
  requiredSteps: string[];
  /** Map of permissionKey → "Yes" / "No" / "Limited" */
  permissions: Record<string, "Yes" | "No" | "Limited">;
  /** Live count maintained by the backend; mock services synthesise. */
  userCount: number;
}

/* ------------------------------------------------------------------------- */
/* KYC Form                                                                  */
/* ------------------------------------------------------------------------- */

export type KYCFormFieldType =
  | "text"
  | "select"
  | "date"
  | "file"
  | "ocr_upload"   // PRD §8.6.A — file upload that runs OCR
  | "boolean"
  | "number"
  | "checkbox";

/** PRD §8.6.B — conditional render rule. The engine evaluates `field op value`
 *  against the current submission and toggles `targetField` visibility. */
export interface FieldCondition {
  field: string;
  op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in";
  value: string | number | string[];
  /** What to do when the condition matches. */
  action: "show" | "hide" | "require" | "optional";
}

/** PRD §8.6.C — validation. Optional values use sensible defaults. */
export interface FieldValidation {
  /** Regex for `text` types (e.g., passport format). */
  regex?: string;
  /** Maximum file size in bytes for `file` / `ocr_upload`. */
  maxFileSize?: number;
  /** Allowed MIME types or extensions, e.g. `["image/jpeg", ".pdf"]`. */
  acceptedFileTypes?: string[];
  /** Numeric range for `number` types. */
  min?: number;
  max?: number;
}

export interface KYCFormField {
  key: string;
  label: string;
  /** Multi-language label overrides keyed by ISO code (PRD §8.6.E). */
  i18nLabels?: Record<string, string>;
  type: KYCFormFieldType;
  required: boolean;
  /** Free-text help shown below the input. */
  hint?: string;
  /** For `select`: the option list. */
  options?: { label: string; value: string }[];
  /** Conditional logic — empty array means "always show, required as declared". */
  conditions?: FieldCondition[];
  /** Validation rules. */
  validation?: FieldValidation;
  /** Country-specific override hint — e.g. `["ID"]` to show only for Indonesia. */
  countries?: string[];
}

/** PRD §8.5 — forms are organised into named sections (Account / Identity /
 *  Address / Financial / Trading Experience / Agreements / Disclaimer). */
export interface KYCFormSection {
  key: string;
  label: string;
  description?: string;
  fields: KYCFormField[];
}

export interface KYCForm extends ConfigBase {
  name: string;
  country: string;
  /** Languages this form is published in (ISO codes). */
  languages: string[];
  sections: KYCFormSection[];
  /** Legacy flat field list — kept as a derived view; new code reads
   *  `sections[].fields` instead. */
  fields: KYCFormField[];
}

/* ------------------------------------------------------------------------- */
/* Template (PRD §6 — Compliance Templates / Regulatory Engine)              */
/* ------------------------------------------------------------------------- */

/**
 * PRD §6.6.A — Regulatory Requirements. Each toggle declares whether the
 * jurisdiction mandates that step in the onboarding flow.
 */
export interface RegulatoryRequirements {
  identityVerification: boolean;
  livenessVerification: boolean;
  proofOfAddress: boolean;
  incomeProof: boolean;
  questionnaire: boolean;
  agreementSigning: boolean;
  pepDeclaration: boolean;
}

/** PRD §6.6.B — AML controls. Toggled per regulator. */
export interface AMLRequirements {
  sanctionScreening: boolean;
  pepScreening: boolean;
  adverseMedia: boolean;
  walletScreening: boolean;
  sourceOfWealth: boolean;
}

/** PRD §6.6.C — Risk controls. Free-form rules of the form
 *  `IF <condition> THEN <action>`, parsed elsewhere. Storing as a list of
 *  named entries keeps the template diffable across versions. */
export interface RiskControlRule {
  id: string;
  /** Reviewer-facing one-liner: e.g., "High-risk country → Force EDD". */
  label: string;
  /** Pseudo-syntax rule, kept in sync with the structured form on save. */
  rule: string;
  enabled: boolean;
}

/** PRD §6.6.D — Leverage caps per account class. Caps are integers
 *  representing the second number in a leverage ratio (e.g. `30` ↔ 1:30). */
export interface LeverageRule {
  accountType: "Retail" | "Professional" | "VIP" | "Institutional";
  maxLeverage: number;
}

/** PRD §6.6.E — Agreement-rebinding rules. */
export interface TemplateAgreementRules {
  /** When true, every agreement bound to this template re-signs on update. */
  forceResign: boolean;
  /** Months between mandatory re-signs (0 = never). */
  resignIntervalMonths: number;
  /** ISO code that must be the agreement's source-of-truth language. */
  mandatoryLanguage: string;
}

export interface ConfigTemplate extends ConfigBase {
  name: string;
  country: string;
  regulator: string;
  version: string;
  /** Counts of bundled child entities. Maintained by the backend; the UI
   *  surfaces them as headline stats on the template card. */
  policiesCount: number;
  formsCount: number;
  agreementsCount: number;

  // ── PRD-aligned structured config ────────────────────────────────────
  regulatoryRequirements: RegulatoryRequirements;
  amlRequirements: AMLRequirements;
  riskControls: RiskControlRule[];
  leverageRules: LeverageRule[];
  agreementRules: TemplateAgreementRules;
}

/* ------------------------------------------------------------------------- */
/* Agreement                                                                 */
/* ------------------------------------------------------------------------- */

export type AgreementType =
  | "client_agreement"
  | "risk_disclosure"
  | "privacy_policy"
  | "terms_of_service"
  | "edd_supplement"
  | "marketing_consent";

/* -- Per-version sub-shapes ----------------------------------------------- */

/**
 * One language's body for an agreement version. The legal team usually
 * authors the source language first (`mandatoryLanguage` on the bound
 * template) and translates afterwards — this is why each `AgreementContent`
 * is independently versioned alongside its parent.
 */
export interface AgreementContent {
  language: string;       // ISO code
  /** Markdown-flavoured plain text. The reader strips headings to size. */
  body: string;
  /** Optional in-line summary of what changed in this language for this
   *  version. Distinct from the version-level changelog. */
  notes?: string;
}

/** Reader-side unlock conditions before the user can sign. */
export interface ReadingControls {
  /** Minimum seconds the document must be on-screen before the Sign
   *  button enables. `0` disables the countdown. */
  minReadSeconds: number;
  /** When true, the user must scroll the body to the bottom before
   *  Sign enables. Combined with `minReadSeconds` via AND. */
  requireScrollToBottom: boolean;
}

/** What proof must be captured at the moment of signing. */
export interface SigningRequirements {
  /** "I have read and agree" tickbox — almost always on. */
  checkbox: boolean;
  /** Free-text name input that must match the user's KYC name. */
  typedName: boolean;
  /** Mouse / touch trace captured as PNG. */
  handwrittenSignature: boolean;
  /** Capture client IP at signing time (server-side). */
  captureIp: boolean;
  /** Capture coarse geo (country) from the IP. */
  captureGeo: boolean;
}

export type AgreementVersionStatus = "draft" | "active" | "retired";

/** Single version of an agreement. The whole legal team's working set —
 *  the body per language, the reading + signing rules, and the publish
 *  metadata — is captured here. Versions are immutable once published;
 *  drafts can be edited freely. */
export interface AgreementVersion {
  id: string;
  /** Display label. `v1.0` / `v1.1` / etc. */
  version: string;
  status: AgreementVersionStatus;
  contents: AgreementContent[];
  reading: ReadingControls;
  signing: SigningRequirements;
  /** What changed since the previous active version. Shown in the
   *  Versions tab + bound to the user-facing notification body. */
  changelog?: string;
  /** Set when status flips to `active`. */
  publishedAt?: string;
  publishedBy?: string;
  createdAt: string;
  createdBy: string;
}

/* -- Agreement (top-level) ----------------------------------------------- */

export interface ConfigAgreement extends ConfigBase {
  name: string;
  type: AgreementType;
  /** Display label for the active version. Kept as a flat string for
   *  back-compat with read-only callers; the source of truth is
   *  `versions[*].status === "active"`. */
  currentVersion: string;
  /** ISO codes the agreement is offered in. Should match the union of
   *  every active version's content languages. */
  languages: string[];
  /** ISO country code or `"Global"`. */
  country: string;
  /** When true, all already-signed users must re-sign. */
  forceResign: boolean;
  /** Number of users who have signed the *current* version. */
  signedCount: number;

  /** Full version history. The list view shows the active one; the
   *  detail page exposes the rest. */
  versions: AgreementVersion[];
  /** Convenience pointer — `versions[*].id` matching the active version. */
  activeVersionId?: string;
}

/* -- Signature audit record ----------------------------------------------- */

/**
 * One signing event. Persisted forever; never modified. The signature
 * trail in the Agreements detail page reads from this pool.
 */
export interface SignatureRecord {
  id: string;
  agreementId: string;
  versionId: string;
  /** Customer signing the agreement. */
  userId: string;
  userUid: string;
  userName: string;
  /** Which language's body the user actually read + signed. */
  language: string;

  signedAt: string;
  /** Whether the "I have read and agree" box was ticked. Should be true
   *  for every record (the UI prevents submission without it) but stored
   *  for completeness. */
  checkboxChecked: boolean;
  /** What the user typed when typed-name capture was required. */
  typedName?: string;
  /** PNG of the handwritten signature, base64-encoded. Empty when the
   *  agreement didn't require it. */
  signaturePngBase64?: string;

  /** Reading proof. */
  readSeconds: number;
  scrolledToBottom: boolean;

  /** Connection metadata at signing time. */
  ipAddress: string;
  userAgent: string;
  geoCountry?: string;

  /** SHA-256 over `(versionId + body + signature fields)` so an altered
   *  agreement is detectable after the fact. The mock seeds a static hash. */
  documentHash: string;
}

export interface SignatureListParams {
  agreementId?: string;
  versionId?: string;
  userId?: string;
  language?: string;
}

/* ------------------------------------------------------------------------- */
/* KYC Flow — simplified Configuration shape (PRD v2.0 §1)                   */
/* ------------------------------------------------------------------------- */

/**
 * A KYC Flow is the full onboarding journey a user completes after
 * registration. It collapses what used to be split across Policies +
 * Levels + Forms + Templates into a single configurable object: turn
 * each of the five modules on/off, pick which agreements bind, and
 * route users into it via `KYCFlowRoutingRule`.
 *
 * Identity verification is required by default (PRD §1.2.A); the rest
 * are optional. The flow doesn't carry per-country logic itself — the
 * routing rules pick which flow applies based on user attributes.
 */
export interface KYCFlowIdentityModule {
  /** Always true — kept on the shape so callers can branch
   *  uniformly across the five modules. */
  documentVerification: true;
  /** Capture a live face video instead of just a still selfie. */
  liveness: boolean;
  /** Require a selfie photo. */
  selfie: boolean;
  /** When `selfie` is true, force the user to use the camera (no album
   *  upload). PRD §1.2.A note. */
  forceCameraOnly: boolean;
}

export interface KYCFlowSimpleModule {
  enabled: boolean;
}

/**
 * Contact verification module — phone OTP + email OTP.
 *
 * Configured per Flow rather than as a global rule so different regions /
 * registration sources (which Routing assigns to different Flows) can
 * have different OTP requirements. Runtime is responsible for skipping
 * an OTP step if the user has already verified that channel.
 */
export interface KYCFlowContactModule {
  enabled: boolean;
  /** Force mobile OTP verification before proceeding. */
  requireMobileOtp: boolean;
  /** Force email OTP verification before proceeding. */
  requireEmailOtp: boolean;
}

export interface KYCFlowQuestionnaireModule extends KYCFlowSimpleModule {
  /** Optional reference to a KYCForm.id when the operator wants a
   *  specific questionnaire body. Empty = default suitability survey. */
  formId?: string;
}

export interface KYCFlowAgreementModule extends KYCFlowSimpleModule {
  /** Ordered list of `ConfigAgreement.id` values bound to this flow.
   *  PRD §1.2.E — agreements come from the Agreement Documents page. */
  agreementIds: string[];
}

export interface KYCFlow extends ConfigBase {
  name: string;
  description?: string;
  contact: KYCFlowContactModule;
  identity: KYCFlowIdentityModule;
  proofOfAddress: KYCFlowSimpleModule;
  incomeProof: KYCFlowSimpleModule;
  questionnaire: KYCFlowQuestionnaireModule;
  agreement: KYCFlowAgreementModule;
}

/* ------------------------------------------------------------------------- */
/* Routing & Workflow Rules (PRD v2.0 §2)                                    */
/* ------------------------------------------------------------------------- */

/** PRD §2.1.A — assign a Flow based on user attributes. The two
 *  out-of-the-box discriminators are `country_of_residence` and
 *  `passport_nationality`; more can be added through `field` without
 *  changing the rule shape. */
export interface KYCFlowRoutingRule extends ConfigBase {
  name: string;
  /** Free-form attribute identifier. */
  field: "country_of_residence" | "passport_nationality" | string;
  /** Allowed values for the condition (`field IN values`). */
  values: string[];
  /** ID of the `KYCFlow` to apply when the condition matches. */
  flowId: string;
  /** Higher = evaluated first; first match wins. */
  priority: number;
}

/** PRD §2.1.B — auto-decision outcome. */
export type AutoReviewOutcome = "auto_approve" | "auto_reject" | "manual_review";

export interface AutoReviewRule extends ConfigBase {
  name: string;
  /** Combinator for evaluating `conditions`. Defaults to "and" when
   *  absent (legacy rules created before the AND/OR switch). Mixed
   *  nesting is NOT supported — use JSON advanced mode if the rule
   *  truly needs `(A AND B) OR C` style logic. */
  logic?: "and" | "or";
  /** Atomic conditions. Combined per `logic`. */
  conditions: WorkflowCondition[];
  outcome: AutoReviewOutcome;
  /** Higher priority rules fire first. */
  priority: number;
}

/* ------------------------------------------------------------------------- */
/* System Modules (PRD v2.0 §4 / SystemModules改版 v1.0)                     */
/* ------------------------------------------------------------------------- */

/** §4.1 Document Type Management. Controls which docs are allowed per
 *  country of residence + the expiry-check policy. */
export type DocumentTypeKind = "national_id" | "passport" | "drivers_license";

export interface DocumentTypePolicy {
  /** ISO country code. `"Global"` is the fallback when no country-
   *  specific policy is configured. */
  country: string;
  /** Document types allowed for residents of `country`. */
  allowedTypes: DocumentTypeKind[];
  /** Per-country back-side overrides. Omitting a kind inherits
   *  DocumentTypeDefaults.backSideRequired. */
  backSideOverrides?: Partial<Record<DocumentTypeKind, boolean>>;
}

/** Global defaults for each document type (back-side capture config). */
export interface DocumentTypeDefaults {
  kind: DocumentTypeKind;
  /** Show the back-side upload area at all. */
  backSideEnabled: boolean;
  /** Whether the back side is mandatory (only applies when enabled). */
  backSideRequired: boolean;
}

/** Per-type expiry rule — replaces the old global DocumentExpiryCheck. */
export interface DocumentTypeExpiryRule {
  kind: DocumentTypeKind;
  checkEnabled: boolean;
  /** Reject if document expires within this many months; 0 = reject only
   *  if already expired. */
  rejectIfExpiringWithinMonths: number;
}

/** File upload constraints applied to all identity document uploads. */
export interface DocumentUploadConfig {
  acceptedFormats: ("jpg" | "png" | "pdf")[];
  maxFileSizeMb: number;
  /** Hard ceiling per user regardless of time window. */
  maxRetryAttemptsPerUser: number;
  /** Rolling time window in hours (default 24). */
  retryWindowHours: number;
  /** Max attempts within the rolling window. */
  maxRetryAttemptsPerWindow: number;
  /** Flag if the same document number already exists on another account. */
  duplicateDocumentNumberCheck: boolean;
}

export interface IdentityModuleConfig extends ConfigBase {
  /** Per-country allowance table. */
  policies: DocumentTypePolicy[];
  /** Global back-side capture defaults, one entry per DocumentTypeKind. */
  documentTypeDefaults: DocumentTypeDefaults[];
  /** Per-type expiry rules. */
  expiryRules: DocumentTypeExpiryRule[];
  /** Upload constraints. */
  uploadConfig: DocumentUploadConfig;
}

/* -- POA module ----------------------------------------------------------- */

export type POADocumentKind =
  | "utility_bill"
  | "bank_statement"
  | "government_letter"
  | "tenancy_agreement"
  | "tax_document";

export interface POAModuleConfig extends ConfigBase {
  acceptedDocuments: POADocumentKind[];
  /** Max age of the document in months (e.g. 3 = must be ≤ 3 months old). */
  maxAgeMonths: number;
  acceptedFormats: ("jpg" | "png" | "pdf")[];
  maxFileSizeMb: number;
}

/* -- Income Proof module -------------------------------------------------- */

export type IncomeDocumentKind =
  | "payslip"
  | "tax_return"
  | "bank_statement"
  | "audited_accounts"
  | "employer_letter";

export interface IncomeProofModuleConfig extends ConfigBase {
  acceptedDocuments: IncomeDocumentKind[];
  /** Required earnings-history window in months. */
  periodCoverageMonths: number;
  acceptedFormats: ("jpg" | "png" | "pdf")[];
  maxFileSizeMb: number;
}

/* -- Liveness Check module ------------------------------------------------ */

export type LivenessProvider = "tradepass" | "onfido" | "sumsub";

/** Provider-specific credentials. Only the fields relevant to the chosen
 *  provider need to be filled; others are ignored. */
export interface LivenessProviderConfig {
  /** onfido / sumsub: REST API key. */
  apiKey?: string;
  /** onfido only: webhook signing secret. */
  webhookSecret?: string;
  /** sumsub only: App Token (equivalent of API key). */
  appToken?: string;
  /** sumsub only: secret key for HMAC request signing. */
  secretKey?: string;
}

export interface LivenessModuleConfig extends ConfigBase {
  provider: LivenessProvider;
  /** Credentials for the chosen provider. Empty for "tradepass". */
  providerConfig: LivenessProviderConfig;
  /** Minimum face-match confidence score (0–100) to pass. */
  confidenceThreshold: number;
  /** How many attempts before the check is auto-failed. */
  maxAttempts: number;
}

/* -- Questionnaire module ------------------------------------------------- */

export type QuestionFieldType =
  | "text"
  | "select"
  | "multiselect"
  | "boolean"
  | "number"
  | "date";

export interface QuestionnaireField {
  id: string;
  label: string;
  type: QuestionFieldType;
  required: boolean;
  hint?: string;
  options?: { label: string; value: string }[];
  order: number;
}

export interface QuestionnaireModuleConfig extends ConfigBase {
  fields: QuestionnaireField[];
}

/* ------------------------------------------------------------------------- */
/* Workflow / Routing rule                                                   */
/* ------------------------------------------------------------------------- */

export type WorkflowType = "routing" | "escalation" | "auto_action" | "notification";

/** Atomic condition in a workflow rule. */
export interface WorkflowCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";
  value: string | number | string[];
}

/* ------------------------------------------------------------------------- */
/* Condition field vocabulary                                                */
/* ------------------------------------------------------------------------- */

/**
 * Drives the ConditionBuilder UI:
 *  - `kind` decides what input control to render for the value
 *  - `options` provides the dropdown choices for enum kinds
 *  - `operators` whitelists which operators are sensible for the field
 *
 * Adding a new field is a one-line change here; both the visual rows
 * and the JSON advanced mode read from this map.
 */
export type ConditionFieldKind = "enum" | "entity" | "number" | "boolean" | "text";

export interface ConditionFieldDef {
  key: string;
  label: string;
  kind: ConditionFieldKind;
  /** For `kind === "enum"` only. */
  options?: { value: string; label: string }[];
  /** For `kind === "entity"` only. The ConditionBuilder picks the
   *  matching async loader (e.g. `ib` → IB list). */
  entity?: "ib";
  /** Operators offered for this field. Defaults to all if omitted. */
  operators?: WorkflowCondition["operator"][];
}

export const CONDITION_FIELDS: ConditionFieldDef[] = [
  {
    key: "country",
    label: "Country",
    kind: "enum",
    options: [
      { value: "VN", label: "Vietnam" },
      { value: "TH", label: "Thailand" },
      { value: "ID", label: "Indonesia" },
      { value: "MY", label: "Malaysia" },
      { value: "PH", label: "Philippines" },
      { value: "SG", label: "Singapore" },
      { value: "JP", label: "Japan" },
      { value: "KR", label: "South Korea" },
      { value: "US", label: "United States" },
      { value: "GB", label: "United Kingdom" },
      { value: "DE", label: "Germany" },
      { value: "FR", label: "France" },
      { value: "AU", label: "Australia" },
    ],
    operators: ["eq", "neq", "in"],
  },
  {
    key: "registration_source",
    label: "Registration Source",
    kind: "enum",
    options: [
      { value: "web",        label: "Web" },
      { value: "mobile_app", label: "Mobile App" },
      { value: "api",        label: "API" },
      { value: "ib_invite",  label: "IB Invitation" },
      { value: "organic",    label: "Organic" },
    ],
    operators: ["eq", "neq", "in"],
  },
  {
    key: "ib_id",
    label: "Referring IB",
    kind: "entity",
    entity: "ib",
    operators: ["eq", "neq", "in"],
  },
  {
    key: "risk_level",
    label: "Risk Level",
    kind: "enum",
    options: [
      { value: "low",      label: "Low" },
      { value: "medium",   label: "Medium" },
      { value: "high",     label: "High" },
      { value: "critical", label: "Critical" },
    ],
  },
  {
    key: "kyc_level",
    label: "KYC Level",
    kind: "enum",
    options: [
      { value: "tier0", label: "Tier 0" },
      { value: "tier1", label: "Tier 1" },
      { value: "tier2", label: "Tier 2" },
      { value: "tier3", label: "Tier 3" },
    ],
  },
  {
    key: "aml_status",
    label: "AML Status",
    kind: "enum",
    options: [
      { value: "pending",  label: "Pending" },
      { value: "pass",     label: "Pass" },
      { value: "hit",      label: "Hit" },
      { value: "watchlist", label: "Watchlist" },
    ],
    operators: ["eq", "neq"],
  },
  {
    key: "ocr_confidence",
    label: "OCR Confidence",
    kind: "number",
    operators: ["eq", "gt", "gte", "lt", "lte"],
  },
  {
    key: "face_match_score",
    label: "Face Match Score",
    kind: "number",
    operators: ["eq", "gt", "gte", "lt", "lte"],
  },
  {
    key: "deposit_amount",
    label: "Deposit Amount",
    kind: "number",
    operators: ["gt", "gte", "lt", "lte"],
  },
  {
    key: "withdrawal_amount",
    label: "Withdrawal Amount",
    kind: "number",
    operators: ["gt", "gte", "lt", "lte"],
  },
  {
    key: "is_vpn",
    label: "IP via VPN",
    kind: "boolean",
    operators: ["eq"],
  },
];

export function getConditionFieldDef(key: string): ConditionFieldDef | undefined {
  return CONDITION_FIELDS.find((f) => f.key === key);
}

/** Action to execute when conditions match. */
export interface WorkflowAction {
  type:
    | "assign_to_team"
    | "assign_to_user"
    | "set_priority"
    | "set_status"
    | "send_notification"
    | "escalate"
    | "auto_approve"
    | "auto_reject";
  value: string;
}

export interface WorkflowRule extends ConfigBase {
  name: string;
  description?: string;
  type: WorkflowType;
  /** Combined with AND. The editor in /crm/clm/routing keeps the legacy
   *  `rule` string in sync for back-compat with read-only callers. */
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  /** Human-readable summary, regenerated whenever conditions/actions change. */
  rule: string;
  /** Run count + last fired (kept by the engine, mock synthesises). */
  runCount?: number;
  lastFiredAt?: string;
}

/** A routing rule is just a workflow with `type === "routing"`. The
 *  /crm/clm/routing page only ever reads this narrower shape. */
export type RoutingRule = WorkflowRule & { type: "routing" };

/* ------------------------------------------------------------------------- */
/* Service contract                                                          */
/* ------------------------------------------------------------------------- */

/** Input to create methods — every base field is server-generated. */
export type ConfigCreateInput<T extends ConfigBase> = Omit<
  T,
  "id" | "updatedBy" | "updatedAt" | "createdAt"
>;

/** Input to update methods — id required, every other field optional. */
export type ConfigUpdateInput<T extends ConfigBase> = Partial<Omit<T, "id">> & {
  id: string;
};
