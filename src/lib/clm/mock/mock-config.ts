/**
 * Mock seeds for the CLM Configuration screens.
 *
 * Kept in one file rather than per-entity so the cross-references
 * (template counts, agreement bundles) stay coherent.
 */
import type {
  ConfigAgreement,
  ConfigTemplate,
  KYCForm,
  KYCLevelConfig,
  KYCPolicy,
  WorkflowRule,
} from "@/types/clm";

const now = new Date().toISOString();
const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

/* ------------------------------------------------------------------------- */
/* Policies                                                                  */
/* ------------------------------------------------------------------------- */

export const mockPolicies: KYCPolicy[] = [
  {
    id: "pol-001",
    name: "Indonesia Passport POA",
    type: "document",
    country: "ID",
    status: "active",
    priority: 1,
    rule: "IF country = Indonesia AND document_type = Passport THEN poa_required = true",
    description: "Passport-based Indonesian KYC needs proof-of-address as a second document.",
    category: "review",
    updatedBy: "Admin A",
    updatedAt: "2026-05-01T08:00:00Z",
    createdAt: "2026-02-01T08:00:00Z",
  },
  {
    id: "pol-002",
    name: "AML Hit Auto Escalate",
    type: "aml",
    country: "Global",
    status: "active",
    priority: 10,
    rule: "IF aml_status = Hit THEN assign_to = Senior Reviewer AND priority = Critical",
    description: "Anything matching the watchlist routes straight to senior reviewers.",
    category: "escalation",
    updatedBy: "Senior Reviewer",
    updatedAt: "2026-04-20T09:00:00Z",
    createdAt: "2026-01-15T09:00:00Z",
  },
  {
    id: "pol-003",
    name: "Large Deposit Video KYC",
    type: "deposit",
    country: "Global",
    status: "active",
    priority: 5,
    rule: "IF deposit_amount > 10000000 IDR AND video_verification != Approved THEN trigger_case = Video Verification",
    description: "Large first-time deposits force a video KYC step before the funds settle.",
    category: "review",
    updatedBy: "Admin B",
    updatedAt: "2026-05-05T10:00:00Z",
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "pol-004",
    name: "Auto Approve Low Risk",
    type: "auto_review",
    country: "Global",
    status: "active",
    priority: 3,
    rule: "IF ocr_confidence >= 90 AND aml_status = Pass AND face_match_score >= 85 THEN auto_approve = true",
    description: "Cleanest cases skip the review queue entirely.",
    category: "automation",
    updatedBy: "System",
    updatedAt: "2026-03-15T11:00:00Z",
    createdAt: "2025-12-01T11:00:00Z",
  },
  {
    id: "pol-005",
    name: "High-Risk Country EDD",
    type: "risk",
    country: "AE",
    status: "draft",
    priority: 8,
    rule: "IF country = UAE THEN edd_required = true AND manual_review = true",
    description: "Enhanced due diligence applies to all UAE clients.",
    category: "risk",
    updatedBy: "Compliance Admin",
    updatedAt: "2026-05-07T12:00:00Z",
    createdAt: "2026-05-07T12:00:00Z",
  },
  {
    id: "pol-006",
    name: "Indonesia Team Routing",
    type: "country",
    country: "ID",
    status: "active",
    priority: 2,
    rule: "IF country = ID THEN assign_to_team = ID Review Team",
    description: "Indonesian users always land in the regional team's queue.",
    category: "routing",
    updatedBy: "Admin A",
    updatedAt: "2026-04-25T08:00:00Z",
    createdAt: "2026-01-25T08:00:00Z",
  },
  {
    id: "pol-007",
    name: "VIP SLA",
    type: "account",
    country: "Global",
    status: "active",
    priority: 4,
    rule: "IF account_class = VIP THEN sla = 30m",
    description: "VIP cases settle within 30 minutes.",
    category: "sla",
    updatedBy: "Compliance",
    updatedAt: "2026-03-10T08:00:00Z",
    createdAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "pol-008",
    name: "Tier-3 Auto-Withdrawal",
    type: "withdrawal",
    country: "Global",
    status: "active",
    priority: 1,
    rule: "IF kyc_level >= tier3 THEN auto_withdrawal = enabled",
    description: "Tier 3 and above unlock automated withdrawal.",
    category: "permission",
    updatedBy: "System",
    updatedAt: "2026-02-15T08:00:00Z",
    createdAt: "2025-11-15T08:00:00Z",
  },
];

/* ------------------------------------------------------------------------- */
/* Levels                                                                    */
/* ------------------------------------------------------------------------- */

type Perm = "Yes" | "No" | "Limited";
const Y: Perm = "Yes";
const N: Perm = "No";
const L: Perm = "Limited";

/** Helper that prevents TS from narrowing `Y`/`N`/`L` literals to their
 *  exact string values, which would make the resulting object type
 *  incompatible with `Record<string, Perm>`. */
const perms = (m: Record<string, Perm>): Record<string, Perm> => m;

export const mockLevels: KYCLevelConfig[] = [
  {
    id: "tier0",
    name: "Tier 0",
    label: "Registered",
    badgeClass: "bg-slate-100 text-slate-700",
    requiredSteps: ["Region Selection"],
    permissions: perms({
      view_market: Y, create_demo: Y, submit_kyc: Y, create_real: N,
      deposit: N, withdraw: N, add_account: N, high_leverage: N,
      auto_withdrawal: N, copy_trading: N, api_access: N,
    }),
    userCount: 12,
    status: "active",
    priority: 0,
    updatedBy: "System",
    updatedAt: monthAgo,
    createdAt: monthAgo,
  },
  {
    id: "tier1",
    name: "Tier 1",
    label: "Basic",
    badgeClass: "bg-blue-100 text-blue-700",
    requiredSteps: ["Region", "Document Upload", "Liveness"],
    permissions: perms({
      view_market: Y, create_demo: Y, submit_kyc: Y, create_real: L,
      deposit: L, withdraw: N, add_account: N, high_leverage: N,
      auto_withdrawal: N, copy_trading: N, api_access: N,
    }),
    userCount: 45,
    status: "active",
    priority: 1,
    updatedBy: "System",
    updatedAt: monthAgo,
    createdAt: monthAgo,
  },
  {
    id: "tier2",
    name: "Tier 2",
    label: "Standard",
    badgeClass: "bg-violet-100 text-violet-700",
    requiredSteps: ["Region", "Document", "Liveness", "POA"],
    permissions: perms({
      view_market: Y, create_demo: Y, submit_kyc: Y, create_real: Y,
      deposit: Y, withdraw: L, add_account: L, high_leverage: N,
      auto_withdrawal: N, copy_trading: N, api_access: N,
    }),
    userCount: 28,
    status: "active",
    priority: 2,
    updatedBy: "System",
    updatedAt: monthAgo,
    createdAt: monthAgo,
  },
  {
    id: "tier3",
    name: "Tier 3",
    label: "Complete",
    badgeClass: "bg-amber-100 text-amber-700",
    requiredSteps: ["Region", "Document", "Liveness", "POA", "Experience", "Agreements"],
    permissions: perms({
      view_market: Y, create_demo: Y, submit_kyc: Y, create_real: Y,
      deposit: Y, withdraw: Y, add_account: Y, high_leverage: L,
      auto_withdrawal: Y, copy_trading: Y, api_access: N,
    }),
    userCount: 67,
    status: "active",
    priority: 3,
    updatedBy: "System",
    updatedAt: monthAgo,
    createdAt: monthAgo,
  },
  {
    id: "tier4",
    name: "Tier 4",
    label: "VIP",
    badgeClass: "bg-emerald-100 text-emerald-700",
    requiredSteps: ["All Steps + Video KYC + EDD"],
    permissions: perms({
      view_market: Y, create_demo: Y, submit_kyc: Y, create_real: Y,
      deposit: Y, withdraw: Y, add_account: Y, high_leverage: Y,
      auto_withdrawal: Y, copy_trading: Y, api_access: Y,
    }),
    userCount: 8,
    status: "active",
    priority: 4,
    updatedBy: "System",
    updatedAt: monthAgo,
    createdAt: monthAgo,
  },
];

/* ------------------------------------------------------------------------- */
/* Forms                                                                     */
/* ------------------------------------------------------------------------- */

const indonesiaSections: KYCForm["sections"] = [
  {
    key: "personal",
    label: "Personal Information",
    fields: [
      {
        key: "fullName",
        label: "Full Name",
        i18nLabels: { id: "Nama Lengkap", en: "Full Name" },
        type: "text",
        required: true,
        validation: { regex: "^[A-Za-z .'-]{2,}$" },
      },
      {
        key: "dob",
        label: "Date of Birth",
        type: "date",
        required: true,
      },
    ],
  },
  {
    key: "identity",
    label: "Identity Verification",
    fields: [
      {
        key: "nik",
        label: "NIK",
        type: "text",
        required: true,
        hint: "Indonesian national ID number — 16 digits",
        countries: ["ID"],
        validation: { regex: "^\\d{16}$" },
      },
      {
        key: "idCard",
        label: "ID Card",
        type: "ocr_upload",
        required: true,
        validation: { maxFileSize: 10_000_000, acceptedFileTypes: ["image/jpeg", "image/png", "application/pdf"] },
      },
    ],
  },
  {
    key: "address",
    label: "Address Verification",
    fields: [
      {
        key: "addressProof",
        label: "Proof of Address",
        type: "file",
        required: true,
        hint: "Utility bill or bank statement, less than 3 months old",
        validation: { maxFileSize: 10_000_000, acceptedFileTypes: ["application/pdf", "image/jpeg"] },
      },
    ],
  },
  {
    key: "financial",
    label: "Financial Information",
    fields: [
      {
        key: "annualIncome",
        label: "Annual Income",
        type: "select",
        required: true,
        options: [
          { label: "< $25k", value: "lt25k" },
          { label: "$25k–$100k", value: "25k_100k" },
          { label: "$100k–$500k", value: "100k_500k" },
          { label: "> $500k", value: "gt500k" },
        ],
      },
      {
        key: "incomeProof",
        label: "Income Proof",
        type: "file",
        required: false,
        // PRD §8.6.B — show this field only when annual income > $100k
        conditions: [
          { field: "annualIncome", op: "in", value: ["100k_500k", "gt500k"], action: "require" },
        ],
      },
    ],
  },
  {
    key: "disclaimer",
    label: "Declarations",
    fields: [
      {
        key: "isPEP",
        label: "Politically Exposed Person",
        type: "checkbox",
        required: true,
      },
      {
        key: "agreementSigned",
        label: "I have read and agree to the Client Agreement",
        type: "checkbox",
        required: true,
      },
    ],
  },
];

const vietnamSections: KYCForm["sections"] = [
  {
    key: "personal",
    label: "Personal Information",
    fields: [
      { key: "fullName", label: "Full Name", type: "text", required: true },
      {
        key: "cccd",
        label: "CCCD",
        type: "text",
        required: true,
        countries: ["VN"],
        validation: { regex: "^\\d{12}$" },
      },
      { key: "dob", label: "Date of Birth", type: "date", required: true },
    ],
  },
  {
    key: "identity",
    label: "Identity Verification",
    fields: [
      { key: "idCard", label: "ID Card", type: "ocr_upload", required: true },
    ],
  },
];

const eddSections: KYCForm["sections"] = [
  {
    key: "wealth",
    label: "Source of Wealth",
    fields: [
      { key: "occupation", label: "Occupation", type: "text", required: true },
      {
        key: "wealthSource",
        label: "Source of Wealth",
        type: "select",
        required: true,
        options: [
          { label: "Salary", value: "salary" },
          { label: "Business Income", value: "business" },
          { label: "Investment Returns", value: "investments" },
          { label: "Inheritance", value: "inheritance" },
          { label: "Other", value: "other" },
        ],
      },
    ],
  },
];

function flattenSections(sections: KYCForm["sections"]): KYCForm["fields"] {
  return sections.flatMap((s) => s.fields);
}

export const mockForms: KYCForm[] = [
  {
    id: "form-001",
    name: "New KYC - Indonesia",
    country: "ID",
    languages: ["en", "id"],
    sections: indonesiaSections,
    fields: flattenSections(indonesiaSections),
    status: "active",
    updatedBy: "Admin A",
    updatedAt: "2026-04-10T08:00:00Z",
    createdAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "form-002",
    name: "New KYC - Vietnam",
    country: "VN",
    languages: ["en", "vi"],
    sections: vietnamSections,
    fields: flattenSections(vietnamSections),
    status: "active",
    updatedBy: "Admin B",
    updatedAt: "2026-03-22T08:00:00Z",
    createdAt: "2026-01-22T08:00:00Z",
  },
  {
    id: "form-003",
    name: "EDD Supplement",
    country: "Global",
    languages: ["en"],
    sections: eddSections,
    fields: flattenSections(eddSections),
    status: "draft",
    updatedBy: "Compliance",
    updatedAt: "2026-05-08T08:00:00Z",
    createdAt: "2026-05-08T08:00:00Z",
  },
];

/* ------------------------------------------------------------------------- */
/* Templates (PRD §6 — Compliance Templates / Regulatory Engine)             */
/* ------------------------------------------------------------------------- */

import type {
  AMLRequirements,
  LeverageRule,
  RegulatoryRequirements,
  RiskControlRule,
  TemplateAgreementRules,
} from "@/types/clm";

const REG_FULL: RegulatoryRequirements = {
  identityVerification: true,
  livenessVerification: true,
  proofOfAddress: true,
  incomeProof: true,
  questionnaire: true,
  agreementSigning: true,
  pepDeclaration: true,
};

const REG_LIGHT: RegulatoryRequirements = {
  identityVerification: true,
  livenessVerification: true,
  proofOfAddress: false,
  incomeProof: false,
  questionnaire: false,
  agreementSigning: true,
  pepDeclaration: true,
};

const AML_FULL: AMLRequirements = {
  sanctionScreening: true,
  pepScreening: true,
  adverseMedia: true,
  walletScreening: true,
  sourceOfWealth: true,
};

const AML_BASIC: AMLRequirements = {
  sanctionScreening: true,
  pepScreening: true,
  adverseMedia: false,
  walletScreening: false,
  sourceOfWealth: false,
};

const RISK_BASIC: RiskControlRule[] = [
  { id: "rc-001", label: "High-risk country → Force EDD", rule: "IF country IN high_risk_list THEN force_edd = true", enabled: true },
  { id: "rc-002", label: "Large withdrawal → Manual review", rule: "IF withdrawal_amount > 10000 USD THEN manual_review = true", enabled: true },
];

const RISK_FULL: RiskControlRule[] = [
  ...RISK_BASIC,
  { id: "rc-003", label: "Multi-account → Auto-investigate", rule: "IF shared_device OR shared_ip THEN open_investigation = true", enabled: true },
  { id: "rc-004", label: "VPN login → +20 risk score", rule: "IF login_via_vpn = true THEN risk_score += 20", enabled: false },
];

const LEV_RETAIL_30: LeverageRule[] = [
  { accountType: "Retail", maxLeverage: 30 },
  { accountType: "Professional", maxLeverage: 500 },
  { accountType: "VIP", maxLeverage: 500 },
  { accountType: "Institutional", maxLeverage: 1000 },
];

const LEV_OFFSHORE: LeverageRule[] = [
  { accountType: "Retail", maxLeverage: 200 },
  { accountType: "Professional", maxLeverage: 1000 },
  { accountType: "VIP", maxLeverage: 1000 },
  { accountType: "Institutional", maxLeverage: 2000 },
];

const AGR_RESIGN_12M: TemplateAgreementRules = {
  forceResign: true,
  resignIntervalMonths: 12,
  mandatoryLanguage: "en",
};

const AGR_NO_RESIGN: TemplateAgreementRules = {
  forceResign: false,
  resignIntervalMonths: 0,
  mandatoryLanguage: "en",
};

export const mockTemplates: ConfigTemplate[] = [
  {
    id: "tmp-001",
    name: "Indonesia - BAPPEBTI Standard",
    country: "ID",
    regulator: "BAPPEBTI",
    policiesCount: 8,
    formsCount: 3,
    agreementsCount: 4,
    version: "v1.0",
    status: "active",
    regulatoryRequirements: REG_FULL,
    amlRequirements: AML_FULL,
    riskControls: RISK_FULL,
    leverageRules: LEV_RETAIL_30,
    agreementRules: AGR_RESIGN_12M,
    updatedBy: "Admin A",
    updatedAt: "2026-04-01T08:00:00Z",
    createdAt: "2026-01-01T08:00:00Z",
  },
  {
    id: "tmp-002",
    name: "Vietnam - SBV Standard",
    country: "VN",
    regulator: "SBV",
    policiesCount: 6,
    formsCount: 2,
    agreementsCount: 3,
    version: "v1.0",
    status: "active",
    regulatoryRequirements: REG_FULL,
    amlRequirements: AML_BASIC,
    riskControls: RISK_BASIC,
    leverageRules: LEV_RETAIL_30,
    agreementRules: AGR_RESIGN_12M,
    updatedBy: "Admin B",
    updatedAt: "2026-03-15T08:00:00Z",
    createdAt: "2026-01-15T08:00:00Z",
  },
  {
    id: "tmp-003",
    name: "UAE - SCA Enhanced",
    country: "AE",
    regulator: "SCA",
    policiesCount: 12,
    formsCount: 4,
    agreementsCount: 6,
    version: "v1.0",
    status: "draft",
    regulatoryRequirements: REG_FULL,
    amlRequirements: AML_FULL,
    riskControls: RISK_FULL,
    leverageRules: LEV_RETAIL_30,
    agreementRules: AGR_RESIGN_12M,
    updatedBy: "Compliance",
    updatedAt: "2026-05-08T08:00:00Z",
    createdAt: "2026-05-01T08:00:00Z",
  },
  {
    id: "tmp-004",
    name: "SVG - Offshore Simplified",
    country: "VG",
    regulator: "SVG FSA",
    policiesCount: 4,
    formsCount: 2,
    agreementsCount: 2,
    version: "v1.0",
    status: "active",
    regulatoryRequirements: REG_LIGHT,
    amlRequirements: AML_BASIC,
    riskControls: RISK_BASIC,
    leverageRules: LEV_OFFSHORE,
    agreementRules: AGR_NO_RESIGN,
    updatedBy: "Admin C",
    updatedAt: "2026-02-20T08:00:00Z",
    createdAt: "2025-12-01T08:00:00Z",
  },
];

/* ------------------------------------------------------------------------- */
/* Agreements (with versions + signing requirements + reading controls)      */
/* ------------------------------------------------------------------------- */

import type {
  AgreementContent,
  AgreementVersion,
  ReadingControls,
  SignatureRecord,
  SigningRequirements,
} from "@/types/clm";

const STRICT_READ: ReadingControls = {
  minReadSeconds: 30,
  requireScrollToBottom: true,
};

const LIGHT_READ: ReadingControls = {
  minReadSeconds: 10,
  requireScrollToBottom: false,
};

const FULL_SIGNING: SigningRequirements = {
  checkbox: true,
  typedName: true,
  handwrittenSignature: true,
  captureIp: true,
  captureGeo: true,
};

const BASIC_SIGNING: SigningRequirements = {
  checkbox: true,
  typedName: false,
  handwrittenSignature: false,
  captureIp: true,
  captureGeo: false,
};

/** Convenience for the seed: every agreement gets at least an English
 *  body. We keep the legalese terse on purpose; real bodies are imported. */
const clientAgreementEN: AgreementContent = {
  language: "en",
  body: `# Client Agreement

This Client Agreement ("Agreement") is entered into by and between Tradepass Markets Ltd. ("Broker") and the undersigned client ("Client") and governs the Client's use of the Broker's trading services.

## 1. Account Eligibility
The Client represents that they are at least 18 years old and not a resident of any jurisdiction where the use of these services is unlawful.

## 2. Trading Authorization
The Client authorises the Broker to execute orders on their behalf, subject to the rules of the relevant exchanges and applicable regulation.

## 3. Risk Acknowledgement
The Client acknowledges that trading leveraged products carries a substantial risk of loss and that past performance is not indicative of future results.

## 4. Fees and Charges
The Client agrees to pay all applicable spreads, commissions, swap charges, and overnight financing fees as published on the Broker's website.

## 5. Communications
The Broker may communicate with the Client by email, in-app inbox, or telephone using the contact details on file. The Client must keep these details current.

## 6. Termination
Either party may terminate this Agreement on 7 days' written notice. The Broker may terminate immediately for breach, fraud, or regulatory reasons.

## 7. Governing Law
This Agreement is governed by the laws of Mauritius. Any dispute will be resolved by the competent courts of Mauritius.

By signing below, the Client confirms that they have read, understood, and agree to be bound by every provision of this Agreement.`,
};

const clientAgreementID: AgreementContent = {
  language: "id",
  body: `# Perjanjian Klien

Perjanjian Klien ini ("Perjanjian") dibuat oleh dan antara Tradepass Markets Ltd. ("Pialang") dan klien yang bertanda tangan di bawah ini ("Klien") dan mengatur penggunaan layanan perdagangan Pialang oleh Klien.

## 1. Kelayakan Akun
Klien menyatakan bahwa mereka berusia minimal 18 tahun dan bukan penduduk yurisdiksi di mana penggunaan layanan ini melanggar hukum.

## 2. Otorisasi Perdagangan
Klien memberi wewenang kepada Pialang untuk melaksanakan order atas nama mereka, tunduk pada aturan bursa terkait dan peraturan yang berlaku.

## 3. Pengakuan Risiko
Klien mengakui bahwa perdagangan produk dengan leverage memiliki risiko kerugian yang signifikan dan kinerja masa lalu bukan indikasi hasil masa depan.

## 4. Biaya dan Tarif
Klien setuju untuk membayar semua spread, komisi, biaya swap, dan biaya pembiayaan semalam yang berlaku sebagaimana dipublikasikan di situs web Pialang.

## 5. Komunikasi
Pialang dapat berkomunikasi dengan Klien melalui email, inbox aplikasi, atau telepon menggunakan detail kontak yang tersimpan.

## 6. Penghentian
Salah satu pihak dapat mengakhiri Perjanjian ini dengan pemberitahuan tertulis 7 hari sebelumnya. Pialang dapat mengakhiri segera untuk pelanggaran, penipuan, atau alasan regulasi.

## 7. Hukum yang Berlaku
Perjanjian ini diatur oleh hukum Mauritius. Setiap perselisihan akan diselesaikan oleh pengadilan yang berwenang di Mauritius.

Dengan menandatangani di bawah ini, Klien mengkonfirmasi telah membaca, memahami, dan setuju untuk terikat oleh setiap ketentuan Perjanjian ini.`,
};

const riskDisclosureEN: AgreementContent = {
  language: "en",
  body: `# Risk Disclosure Statement

Trading in financial instruments carries a high level of risk and may not be suitable for all investors. Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite.

## Leverage Risk
Leverage allows control of large positions with small capital. Adverse market movements can produce losses exceeding your initial deposit. Always trade with capital you can afford to lose.

## Market Risk
Markets can move sharply due to news, economic data, or geopolitical events. Liquidity may evaporate during volatile periods, leading to wider spreads and slippage on order execution.

## Counterparty Risk
You face risk that the broker or its hedging counterparties may default on their obligations. Tradepass holds client funds in segregated accounts at tier-1 banks to mitigate this exposure.

## Technology Risk
Internet, software, and exchange systems may fail. The broker is not liable for losses arising from system unavailability except where caused by gross negligence.

## Acknowledgement
By signing below, you confirm that you have read this disclosure, that you understand the nature of these risks, and that you accept them as a condition of trading.`,
};

const eddDeclarationEN: AgreementContent = {
  language: "en",
  body: `# Enhanced Due Diligence Declaration (UAE)

Pursuant to UAE SCA regulations, the undersigned client declares the following with respect to source of wealth and source of funds.

## Source of Wealth
The Client declares that their accumulated wealth derives from lawful sources, which may include but are not limited to: salary, business income, investment returns, inheritance, or sale of assets.

## Source of Funds
The Client declares that funds deposited into the trading account originate from the source(s) declared on the account opening application and that no deposit will be made from a third party.

## Politically Exposed Person Status
The Client declares whether they hold or have held within the last 12 months a prominent public function in any country, or are a close associate or family member of such a person.

## Sanctions
The Client declares that they are not the subject of UN, EU, OFAC, or other applicable sanctions and that they will notify the Broker immediately if their status changes.

## Acknowledgement
The Client understands that knowingly providing false information constitutes a serious offence and may result in account termination, asset freezing, and reporting to the relevant authorities.`,
};

const eddDeclarationAR: AgreementContent = {
  language: "ar",
  body: `# إقرار العناية الواجبة المعززة (الإمارات)

وفقاً للوائح هيئة الأوراق المالية والسلع في الإمارات العربية المتحدة، يُقرّ العميل الموقّع أدناه بما يلي بشأن مصدر الثروة ومصدر الأموال.

## مصدر الثروة
يُقرّ العميل بأن ثروته المتراكمة تأتي من مصادر مشروعة، والتي قد تشمل على سبيل المثال لا الحصر: الراتب، أو دخل الأعمال، أو عوائد الاستثمار، أو الميراث، أو بيع الأصول.

## مصدر الأموال
يُقرّ العميل بأن الأموال المودعة في حساب التداول تأتي من المصدر/المصادر المُصرَّح بها في طلب فتح الحساب، وأنه لن يتم أي إيداع من قبل طرف ثالث.

## وضع الشخص السياسي البارز
يُصرّح العميل بما إذا كان يشغل أو شغل خلال الـ 12 شهراً الماضية وظيفة عامة بارزة في أي دولة، أو كونه شريكاً مقرباً أو فرداً من عائلة شخص يشغل مثل هذه الوظيفة.

## العقوبات
يُقرّ العميل بأنه غير خاضع لعقوبات الأمم المتحدة أو الاتحاد الأوروبي أو OFAC أو أي عقوبات سارية أخرى، وأنه سيُبلغ الوسيط فوراً في حال تغيُّر وضعه.`,
};

/* -- Versions ------------------------------------------------------------- */

const clientAgreementVersions: AgreementVersion[] = [
  {
    id: "agrv-001",
    version: "v1.0",
    status: "retired",
    contents: [clientAgreementEN],
    reading: LIGHT_READ,
    signing: BASIC_SIGNING,
    changelog: "Initial publication.",
    publishedAt: "2025-09-15T08:00:00Z",
    publishedBy: "Admin A",
    createdAt: "2025-09-01T08:00:00Z",
    createdBy: "Admin A",
  },
  {
    id: "agrv-002",
    version: "v1.1",
    status: "retired",
    contents: [clientAgreementEN, clientAgreementID],
    reading: LIGHT_READ,
    signing: BASIC_SIGNING,
    changelog: "Added Bahasa Indonesia translation. Updated clause 4 (fees) to reference the published rate-card.",
    publishedAt: "2026-02-10T08:00:00Z",
    publishedBy: "Admin A",
    createdAt: "2026-01-25T08:00:00Z",
    createdBy: "Admin A",
  },
  {
    id: "agrv-003",
    version: "v1.2",
    status: "active",
    contents: [clientAgreementEN, clientAgreementID],
    reading: STRICT_READ,
    signing: { ...FULL_SIGNING, captureGeo: true },
    changelog: "Tightened reading controls (30s + scroll-bottom) and now require typed-name + handwritten signature on top of the checkbox.",
    publishedAt: "2026-04-15T08:00:00Z",
    publishedBy: "Admin A",
    createdAt: "2026-04-01T08:00:00Z",
    createdBy: "Admin A",
  },
];

const riskDisclosureVersions: AgreementVersion[] = [
  {
    id: "agrv-101",
    version: "v1.3",
    status: "active",
    contents: [riskDisclosureEN],
    reading: STRICT_READ,
    signing: FULL_SIGNING,
    changelog: "Refresh after the May rates update; force re-sign for active traders.",
    publishedAt: "2026-05-01T08:00:00Z",
    publishedBy: "Compliance",
    createdAt: "2026-04-20T08:00:00Z",
    createdBy: "Compliance",
  },
];

const eddDeclarationVersions: AgreementVersion[] = [
  {
    id: "agrv-201",
    version: "v1.0",
    status: "draft",
    contents: [eddDeclarationEN, eddDeclarationAR],
    reading: STRICT_READ,
    signing: FULL_SIGNING,
    changelog: "First UAE EDD draft; pending legal sign-off.",
    createdAt: "2026-05-09T08:00:00Z",
    createdBy: "Compliance",
  },
];

export const mockAgreements: ConfigAgreement[] = [
  {
    id: "agr-001",
    name: "Client Agreement",
    type: "client_agreement",
    currentVersion: "v1.2",
    languages: ["en", "id"],
    country: "Global",
    forceResign: false,
    signedCount: 1240,
    status: "active",
    versions: clientAgreementVersions,
    activeVersionId: "agrv-003",
    updatedBy: "Admin A",
    updatedAt: "2026-04-15T08:00:00Z",
    createdAt: "2025-09-15T08:00:00Z",
  },
  {
    id: "agr-002",
    name: "Risk Disclosure",
    type: "risk_disclosure",
    currentVersion: "v1.3",
    languages: ["en"],
    country: "Global",
    forceResign: true,
    signedCount: 980,
    status: "active",
    versions: riskDisclosureVersions,
    activeVersionId: "agrv-101",
    updatedBy: "Compliance",
    updatedAt: "2026-05-01T08:00:00Z",
    createdAt: "2025-08-01T08:00:00Z",
  },
  {
    id: "agr-003",
    name: "EDD Declaration (UAE)",
    type: "edd_supplement",
    currentVersion: "v1.0",
    languages: ["en", "ar"],
    country: "AE",
    forceResign: false,
    signedCount: 0,
    status: "draft",
    versions: eddDeclarationVersions,
    activeVersionId: undefined,
    updatedBy: "Compliance",
    updatedAt: "2026-05-09T08:00:00Z",
    createdAt: "2026-05-09T08:00:00Z",
  },
];

/* -- Signature audit pool ------------------------------------------------- */

/** Tiny PNG (a 1×1 transparent pixel) used as a placeholder so the mock
 *  doesn't ship a real captured signature. Real records carry a base64
 *  PNG of the SignaturePad's canvas. */
const PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export const mockSignatureRecords: SignatureRecord[] = [
  {
    id: "sig-001",
    agreementId: "agr-001",
    versionId: "agrv-003",
    userId: "user-001",
    userUid: "10028391",
    userName: "Zhang Wei",
    language: "en",
    signedAt: "2026-04-22T14:32:00Z",
    checkboxChecked: true,
    typedName: "Zhang Wei",
    signaturePngBase64: PIXEL_PNG_BASE64,
    readSeconds: 47,
    scrolledToBottom: true,
    ipAddress: "103.21.244.15",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15",
    geoCountry: "SG",
    documentHash: "sha256-mock-cb91a82fa3b4e0",
  },
  {
    id: "sig-002",
    agreementId: "agr-001",
    versionId: "agrv-003",
    userId: "user-002",
    userUid: "10028392",
    userName: "Wang Fang",
    language: "id",
    signedAt: "2026-04-25T09:15:00Z",
    checkboxChecked: true,
    typedName: "Wang Fang",
    signaturePngBase64: PIXEL_PNG_BASE64,
    readSeconds: 62,
    scrolledToBottom: true,
    ipAddress: "180.244.10.12",
    userAgent: "Mozilla/5.0 (Linux; Android 14; SM-S918B)",
    geoCountry: "ID",
    documentHash: "sha256-mock-71c2b3e5a094d2",
  },
  {
    id: "sig-003",
    agreementId: "agr-002",
    versionId: "agrv-101",
    userId: "user-001",
    userUid: "10028391",
    userName: "Zhang Wei",
    language: "en",
    signedAt: "2026-05-02T11:08:00Z",
    checkboxChecked: true,
    typedName: "Zhang Wei",
    signaturePngBase64: PIXEL_PNG_BASE64,
    readSeconds: 38,
    scrolledToBottom: true,
    ipAddress: "103.21.244.15",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15",
    geoCountry: "SG",
    documentHash: "sha256-mock-2a9e4b71d0f311",
  },
  {
    id: "sig-004",
    agreementId: "agr-001",
    versionId: "agrv-002",
    userId: "user-007",
    userUid: "10028407",
    userName: "Chen Hao",
    language: "en",
    signedAt: "2026-03-04T16:45:00Z",
    checkboxChecked: true,
    readSeconds: 14,
    scrolledToBottom: false,
    ipAddress: "118.122.51.4",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    geoCountry: "CN",
    documentHash: "sha256-mock-aa11bb22cc3344",
  },
];

/* ------------------------------------------------------------------------- */
/* Workflow rules                                                            */
/* ------------------------------------------------------------------------- */

export const mockWorkflows: WorkflowRule[] = [
  {
    id: "wf-001",
    name: "Indonesia Team Routing",
    description: "Route Indonesian users to ID Review Team",
    type: "routing",
    conditions: [{ field: "country", operator: "eq", value: "ID" }],
    actions: [{ type: "assign_to_team", value: "team-id-review" }],
    rule: "IF country = ID THEN assign_to_team = ID Review Team",
    priority: 1,
    runCount: 412,
    lastFiredAt: now,
    status: "active",
    updatedBy: "Admin A",
    updatedAt: "2026-04-25T08:00:00Z",
    createdAt: "2026-01-25T08:00:00Z",
  },
  {
    id: "wf-002",
    name: "Critical Risk Escalation",
    description: "Anything Critical → senior reviewer + alert",
    type: "escalation",
    conditions: [{ field: "risk_level", operator: "eq", value: "critical" }],
    actions: [
      { type: "assign_to_user", value: "staff-003" },
      { type: "set_priority", value: "critical" },
      { type: "send_notification", value: "compliance-lead" },
    ],
    rule: "IF risk_level = Critical THEN assign_to = Senior Reviewer AND priority = Critical AND notify Compliance Lead",
    priority: 10,
    runCount: 27,
    lastFiredAt: now,
    status: "active",
    updatedBy: "Senior Reviewer",
    updatedAt: "2026-04-20T08:00:00Z",
    createdAt: "2026-02-01T08:00:00Z",
  },
  {
    id: "wf-003",
    name: "AML Hit → Compliance",
    description: "Watchlist matches always route to compliance queue",
    type: "routing",
    conditions: [{ field: "aml_status", operator: "eq", value: "hit" }],
    actions: [{ type: "assign_to_team", value: "team-compliance" }],
    rule: "IF aml_status = Hit THEN assign_to_team = Compliance",
    priority: 9,
    runCount: 19,
    lastFiredAt: now,
    status: "active",
    updatedBy: "Compliance",
    updatedAt: "2026-05-01T08:00:00Z",
    createdAt: "2026-03-01T08:00:00Z",
  },
  {
    id: "wf-004",
    name: "Auto-Approve Clean Cases",
    description: "Skip the queue when every signal is green",
    type: "auto_action",
    conditions: [
      { field: "ocr_confidence", operator: "gte", value: 90 },
      { field: "face_match_score", operator: "gte", value: 85 },
      { field: "aml_status", operator: "eq", value: "pass" },
      { field: "risk_level", operator: "in", value: ["low", "medium"] },
    ],
    actions: [{ type: "auto_approve", value: "true" }],
    rule: "IF ocr_confidence >= 90 AND face_match_score >= 85 AND aml_status = Pass AND risk_level ∈ {low, medium} THEN auto_approve",
    priority: 3,
    runCount: 1432,
    lastFiredAt: now,
    status: "active",
    updatedBy: "System",
    updatedAt: "2026-03-15T08:00:00Z",
    createdAt: "2025-12-15T08:00:00Z",
  },
  {
    id: "wf-005",
    name: "Resubmission SLA Watch",
    description: "If a case stays in Resubmission > 48h, escalate.",
    type: "escalation",
    conditions: [
      { field: "status", operator: "eq", value: "resubmission" },
      { field: "hours_since_status_change", operator: "gt", value: 48 },
    ],
    actions: [
      { type: "escalate", value: "team-senior" },
      { type: "send_notification", value: "team-lead" },
    ],
    rule: "IF status = Resubmission AND hours_since_status_change > 48 THEN escalate to Senior Reviewers",
    priority: 5,
    runCount: 8,
    lastFiredAt: now,
    status: "draft",
    updatedBy: "Compliance",
    updatedAt: "2026-05-09T08:00:00Z",
    createdAt: "2026-05-09T08:00:00Z",
  },
];
