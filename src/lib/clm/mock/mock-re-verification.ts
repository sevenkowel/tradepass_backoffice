/**
 * Re-Verification Center mock seeds.
 *
 * Three pools — Requests / Templates / Rules — keep cross-references
 * coherent (a request that references `ruleId: "rrv-001"` actually has a
 * matching rule). Static pools are fine for development; the service
 * layer in `re-verification.service.ts` clones into a mutable in-memory
 * list so CRUD doesn't mutate the seed.
 */
import type {
  ReVerificationRequest,
  ReVerificationRule,
  ReVerificationTemplate,
} from "@/types/clm";

const now = Date.now();
const m = (mins: number) => new Date(now - mins * 60_000).toISOString();
const h = (hours: number) => new Date(now - hours * 3_600_000).toISOString();
const future = (hours: number) => new Date(now + hours * 3_600_000).toISOString();

/* ------------------------------------------------------------------------- */
/* Templates                                                                 */
/* ------------------------------------------------------------------------- */

export const mockReVerificationTemplates: ReVerificationTemplate[] = [
  {
    id: "rvt-001",
    name: "ID Expiration — Email",
    verificationType: "re_identity",
    channel: "email",
    subject: "Your identification document is about to expire",
    body:
      "Hi {userName},\n\n" +
      "Your identification document on file expires soon. To keep trading without interruption, please upload a current copy by {deadline}.\n\n" +
      "Open the verification page: {ctaUrl}\n\n" +
      "Thanks,\nCompliance Team",
    languages: ["en", "id", "vi"],
    active: true,
    updatedBy: "Compliance",
    updatedAt: h(24 * 7),
    createdAt: h(24 * 30),
  },
  {
    id: "rvt-002",
    name: "ID Expiration — Login Popup",
    verificationType: "re_identity",
    channel: "login_popup",
    body:
      "Your identification document expires soon. Please update it to keep your account active. " +
      "You have until {deadline} to complete this step.",
    languages: ["en", "id", "vi"],
    active: true,
    updatedBy: "Compliance",
    updatedAt: h(24 * 7),
    createdAt: h(24 * 30),
  },
  {
    id: "rvt-003",
    name: "Video Verification — Email",
    verificationType: "re_video",
    channel: "email",
    subject: "Quick video verification needed",
    body:
      "Hi {userName},\n\n" +
      "For account security, we need a short video confirmation. Please record a clip stating:\n" +
      "  \"I am {userName}. I understand the trading risks. This withdrawal is performed by myself.\"\n\n" +
      "Complete it here: {ctaUrl}\n\n" +
      "Thanks,\nCompliance Team",
    languages: ["en"],
    active: true,
    updatedBy: "Compliance",
    updatedAt: h(24 * 14),
    createdAt: h(24 * 60),
  },
  {
    id: "rvt-004",
    name: "Agreement Re-sign — Inbox",
    verificationType: "re_agreement",
    channel: "inbox",
    body:
      "We've updated our Client Agreement. Please review and re-sign by {deadline} to continue trading.",
    languages: ["en", "id", "vi", "th"],
    active: true,
    updatedBy: "Admin A",
    updatedAt: h(24 * 3),
    createdAt: h(24 * 90),
  },
  {
    id: "rvt-005",
    name: "Source of Wealth — Email",
    verificationType: "re_income",
    channel: "email",
    subject: "Source-of-wealth verification request",
    body:
      "Hi {userName},\n\n" +
      "Your account has been flagged for an enhanced compliance check. Please upload a recent income proof or source-of-wealth document by {deadline}.\n\n" +
      "Open the verification page: {ctaUrl}",
    languages: ["en"],
    active: true,
    updatedBy: "Compliance",
    updatedAt: h(24 * 5),
    createdAt: h(24 * 45),
  },
];

/* ------------------------------------------------------------------------- */
/* Auto-trigger rules (PRD §17.2)                                            */
/* ------------------------------------------------------------------------- */

export const mockReVerificationRules: ReVerificationRule[] = [
  {
    id: "rrv-001",
    name: "ID Expiring Within 7 Days",
    description: "Notify users whose ID expires soon and freeze withdrawals until they re-verify.",
    conditions: [
      { field: "id_expires_in_days", operator: "lte", value: 7 },
    ],
    action: {
      verificationType: "re_identity",
      restriction: {
        level: "important",
        scopes: ["withdrawal"],
        effective: { kind: "immediate" },
        validityHours: 24 * 7,
        expirationEscalation: { toLevel: "blocking", addScopes: ["trading"] },
      },
      notification: {
        channels: ["email", "inbox", "login_popup"],
        popupSeverity: "important",
        templateId: "rvt-001",
        ctaUrl: "/account/verification?type=identity",
      },
    },
    triggerKind: "continuous",
    scanFrequency: "daily",
    priority: 5,
    enabled: true,
    runCount: 184,
    lastFiredAt: h(2),
    updatedBy: "Compliance",
    updatedAt: h(24 * 14),
    createdAt: h(24 * 60),
  },
  {
    id: "rrv-002",
    name: "Large Withdrawal → Video Verification",
    description: "Any withdrawal request above 10,000 USD requires a fresh video confirmation.",
    conditions: [
      { field: "withdrawal_amount_usd", operator: "gt", value: 10_000 },
    ],
    action: {
      verificationType: "re_video",
      restriction: {
        level: "blocking",
        scopes: ["withdrawal"],
        effective: { kind: "immediate" },
        validityHours: 24 * 3,
      },
      notification: {
        channels: ["email", "inbox", "push"],
        templateId: "rvt-003",
        ctaUrl: "/account/verification?type=video",
      },
    },
    triggerKind: "event",
    priority: 9,
    enabled: true,
    runCount: 27,
    lastFiredAt: h(8),
    updatedBy: "Risk Manager",
    updatedAt: h(24 * 21),
    createdAt: h(24 * 90),
  },
  {
    id: "rrv-003",
    name: "VPN Country Switch → Re-Liveness",
    description: "Switching between countries via VPN flags an account-takeover risk.",
    conditions: [
      { field: "vpn_country_switch", operator: "eq", value: "true" },
    ],
    action: {
      verificationType: "re_liveness",
      restriction: {
        level: "important",
        scopes: ["login", "withdrawal"],
        effective: { kind: "immediate" },
        validityHours: 24,
      },
      notification: {
        channels: ["email", "login_popup"],
        popupSeverity: "blocking",
      },
    },
    triggerKind: "event",
    priority: 8,
    enabled: true,
    runCount: 12,
    lastFiredAt: h(48),
    updatedBy: "Risk Manager",
    updatedAt: h(24 * 21),
    createdAt: h(24 * 90),
  },
  {
    id: "rrv-004",
    name: "Agreement Updated → Re-sign",
    description: "When the Client Agreement publishes a new version, force every active user to re-sign.",
    conditions: [
      { field: "agreement_version_outdated", operator: "eq", value: "true" },
    ],
    action: {
      verificationType: "re_agreement",
      restriction: {
        level: "soft_reminder",
        scopes: [],
        effective: { kind: "delayed_hours", hours: 24 },
        validityHours: 24 * 14,
        expirationEscalation: { toLevel: "blocking", addScopes: ["deposit", "withdrawal"] },
      },
      notification: {
        channels: ["email", "inbox"],
        templateId: "rvt-004",
      },
    },
    triggerKind: "event",
    priority: 3,
    enabled: true,
    runCount: 1284,
    lastFiredAt: h(72),
    updatedBy: "Admin A",
    updatedAt: h(24 * 7),
    createdAt: h(24 * 120),
  },
  {
    id: "rrv-005",
    name: "AML Hit → Source of Wealth",
    description: "AML watchlist matches must justify their funds before any further withdrawal.",
    conditions: [
      { field: "aml_status", operator: "eq", value: "hit" },
    ],
    action: {
      verificationType: "re_income",
      restriction: {
        level: "blocking",
        scopes: ["withdrawal", "deposit"],
        effective: { kind: "immediate" },
        validityHours: 24 * 7,
      },
      notification: {
        channels: ["email", "inbox", "login_popup"],
        popupSeverity: "blocking",
        templateId: "rvt-005",
      },
    },
    triggerKind: "event",
    priority: 10,
    enabled: true,
    runCount: 9,
    lastFiredAt: h(36),
    updatedBy: "Senior Reviewer",
    updatedAt: h(24 * 14),
    createdAt: h(24 * 60),
  },
  // ── New: a second continuous rule so the tab demonstrates ──────────
  //  variety in the "Continuous Verification" category.
  {
    id: "rrv-006",
    name: "12-Month Inactivity → Refresh KYC",
    description:
      "Users who haven't logged in for 12 months get a refresh-KYC request before their next deposit settles.",
    conditions: [
      { field: "inactivity_days", operator: "gte", value: 365 },
    ],
    action: {
      verificationType: "re_identity",
      restriction: {
        level: "soft_reminder",
        scopes: [],
        effective: { kind: "immediate" },
        validityHours: 24 * 30,
        expirationEscalation: { toLevel: "important", addScopes: ["deposit", "withdrawal"] },
      },
      notification: {
        channels: ["email", "inbox"],
        templateId: "rvt-001",
        ctaUrl: "/account/verification?type=identity",
      },
    },
    triggerKind: "continuous",
    scanFrequency: "weekly",
    priority: 2,
    enabled: true,
    runCount: 41,
    lastFiredAt: h(24 * 6),
    updatedBy: "Compliance",
    updatedAt: h(24 * 30),
    createdAt: h(24 * 90),
  },
];

/* ------------------------------------------------------------------------- */
/* Requests                                                                  */
/* ------------------------------------------------------------------------- */

export const mockReVerificationRequests: ReVerificationRequest[] = [
  // Active: notified, awaiting user submission
  {
    id: "rvr-001",
    requestNo: "RV-2026-000001",
    userId: "user-001",
    userUid: "10028391",
    userName: "Zhang Wei",
    userEmail: "zhang.wei@example.com",
    country: "CN",
    type: "re_identity",
    trigger: "automatic",
    triggerReason: "document_expired",
    reasonText: "ID expires in 5 days. Auto-issued by Rule \"ID Expiring Within 7 Days\".",
    restriction: {
      level: "important",
      scopes: ["withdrawal"],
      effective: { kind: "immediate" },
      validityHours: 24 * 7,
      expirationEscalation: { toLevel: "blocking", addScopes: ["trading"] },
    },
    notification: {
      channels: ["email", "inbox", "login_popup"],
      popupSeverity: "important",
      templateId: "rvt-001",
      ctaUrl: "/account/verification?type=identity",
    },
    status: "notified",
    deadlineAt: future(24 * 6),
    createdBy: "system",
    createdByName: "System",
    createdAt: h(24),
    notifiedAt: h(23),
    ruleId: "rrv-001",
  },
  // Active: user submitted, in review
  {
    id: "rvr-002",
    requestNo: "RV-2026-000002",
    userId: "user-005",
    userUid: "10028395",
    userName: "Tran Quoc",
    userEmail: "tran.quoc@example.com",
    country: "VN",
    type: "re_video",
    trigger: "manual",
    triggerReason: "large_withdrawal",
    reasonText: "Pending withdrawal of $18,000. Video confirmation required before release.",
    restriction: {
      level: "blocking",
      scopes: ["withdrawal"],
      effective: { kind: "immediate" },
      validityHours: 24 * 3,
    },
    notification: {
      channels: ["email", "inbox", "push"],
      templateId: "rvt-003",
      ctaUrl: "/account/verification?type=video",
    },
    status: "in_review",
    deadlineAt: future(24 * 2),
    caseId: "case-rv-002",
    createdBy: "staff-002",
    createdByName: "Admin B",
    createdAt: h(20),
    notifiedAt: h(20),
    submittedAt: h(2),
  },
  // Active: notified, waiting
  {
    id: "rvr-003",
    requestNo: "RV-2026-000003",
    userId: "user-008",
    userUid: "10028398",
    userName: "Suspicious User",
    userEmail: "ex.user@example.com",
    country: "AE",
    type: "re_income",
    trigger: "automatic",
    triggerReason: "aml_hit",
    reasonText: "AML watchlist match (OFAC SDN). Source-of-wealth required before any further activity.",
    restriction: {
      level: "blocking",
      scopes: ["withdrawal", "deposit"],
      effective: { kind: "immediate" },
      validityHours: 24 * 7,
    },
    notification: {
      channels: ["email", "inbox", "login_popup"],
      popupSeverity: "blocking",
      templateId: "rvt-005",
    },
    status: "notified",
    deadlineAt: future(24 * 5),
    createdBy: "system",
    createdByName: "System",
    createdAt: h(36),
    notifiedAt: h(36),
    ruleId: "rrv-005",
  },
  // Active: liveness re-check
  {
    id: "rvr-004",
    requestNo: "RV-2026-000004",
    userId: "user-014",
    userUid: "10028414",
    userName: "Park Min-jun",
    userEmail: "park.minjun@example.com",
    country: "KR",
    type: "re_liveness",
    trigger: "automatic",
    triggerReason: "vpn_country_switch",
    reasonText: "Login from VPN egress (KR → NL). Re-liveness required.",
    restriction: {
      level: "important",
      scopes: ["login", "withdrawal"],
      effective: { kind: "immediate" },
      validityHours: 24,
    },
    notification: {
      channels: ["email", "login_popup"],
      popupSeverity: "blocking",
    },
    status: "notified",
    deadlineAt: future(20),
    createdBy: "system",
    createdByName: "System",
    createdAt: h(4),
    notifiedAt: h(4),
    ruleId: "rrv-003",
  },
  // Completed: approved
  {
    id: "rvr-005",
    requestNo: "RV-2026-000005",
    userId: "user-002",
    userUid: "10028392",
    userName: "Wang Fang",
    userEmail: "wang.fang@example.com",
    country: "CN",
    type: "re_address",
    trigger: "manual",
    triggerReason: "long_inactivity",
    reasonText: "Account dormant for 14 months. Address refresh requested before re-activation.",
    restriction: {
      level: "soft_reminder",
      scopes: [],
      effective: { kind: "immediate" },
      validityHours: 24 * 14,
    },
    notification: {
      channels: ["email", "inbox"],
    },
    status: "approved",
    caseId: "case-rv-005",
    createdBy: "staff-001",
    createdByName: "Admin A",
    createdAt: h(24 * 5),
    notifiedAt: h(24 * 5),
    submittedAt: h(24 * 3),
    resolvedAt: h(24 * 2),
  },
  // Completed: rejected
  {
    id: "rvr-006",
    requestNo: "RV-2026-000006",
    userId: "user-009",
    userUid: "10028409",
    userName: "Lee Ji-hoon",
    userEmail: "lee.jihoon@example.com",
    country: "KR",
    type: "re_video",
    trigger: "manual",
    triggerReason: "fraud_investigation",
    reasonText: "Open fraud investigation. Video verification rejected — face mismatch.",
    restriction: {
      level: "blocking",
      scopes: ["withdrawal", "trading"],
      effective: { kind: "immediate" },
      validityHours: 24 * 3,
    },
    notification: {
      channels: ["email", "inbox", "login_popup"],
      popupSeverity: "blocking",
    },
    status: "rejected",
    caseId: "case-rv-006",
    createdBy: "staff-003",
    createdByName: "Senior Reviewer",
    createdAt: h(24 * 8),
    notifiedAt: h(24 * 8),
    submittedAt: h(24 * 7),
    resolvedAt: h(24 * 6),
  },
  // Expired: user didn't act in time
  {
    id: "rvr-007",
    requestNo: "RV-2026-000007",
    userId: "user-013",
    userUid: "10028413",
    userName: "Aiko Tanaka",
    userEmail: "aiko.tanaka@example.com",
    country: "JP",
    type: "re_questionnaire",
    trigger: "manual",
    triggerReason: "policy_update",
    reasonText: "Suitability assessment outdated (last updated 18 months ago).",
    restriction: {
      level: "soft_reminder",
      scopes: [],
      effective: { kind: "immediate" },
      validityHours: 24 * 14,
    },
    notification: {
      channels: ["email", "inbox"],
    },
    status: "expired",
    createdBy: "staff-001",
    createdByName: "Admin A",
    createdAt: h(24 * 18),
    notifiedAt: h(24 * 18),
    resolvedAt: h(24 * 4),
  },
  // Cancelled by operator
  {
    id: "rvr-008",
    requestNo: "RV-2026-000008",
    userId: "user-007",
    userUid: "10028407",
    userName: "Chen Hao",
    userEmail: "chen.hao@example.com",
    country: "CN",
    type: "re_agreement",
    trigger: "manual",
    triggerReason: "agreement_update",
    reasonText: "Cancelled — user already re-signed via the bulk Tier 3 pre-flight notice.",
    restriction: {
      level: "soft_reminder",
      scopes: [],
      effective: { kind: "immediate" },
      validityHours: 24 * 14,
    },
    notification: {
      channels: ["email"],
    },
    status: "cancelled",
    createdBy: "staff-002",
    createdByName: "Admin B",
    createdAt: h(24 * 2),
    resolvedAt: h(24),
  },
];
