/**
 * Re-Verification Center — data model.
 *
 * Implements the PRD at `2026-05-10-task-8/CLM-ReVerification-System-PRD.md`
 * (Continuous Compliance Engine). Operators trigger one of seven
 * re-verification types against one or many users; the system creates a
 * Case (reusing the existing Review Queue), notifies the user across
 * configurable channels, optionally restricts what they can do, and
 * tracks SLA + outcome.
 *
 * Design notes:
 *   - **One request per (user, type)**: each row in `ReVerificationRequest`
 *     covers a single user. Bulk triggers fan out into N rows so SLA and
 *     restrictions can vary per user, and so each row has a 1:1 mapping
 *     to the case it spawns.
 *   - **Reuse the case workflow**: `caseId` links to a `CLMCase` of type
 *     `re_verification` once the user submits. Approval / reject /
 *     resubmit / escalate logic stays in the existing Review Queue.
 *   - **Templates are slot-based**: each template is keyed by
 *     `(verificationType, channel)` so the trigger drawer can
 *     auto-suggest the right body when the operator picks a type.
 *   - **Rules are workflow-shaped**: re-uses the same `WorkflowCondition`
 *     vocabulary as `WorkflowRule` — the engine that fires these rules
 *     is the same one that runs CLM auto-routing.
 */

import type { WorkflowCondition } from "./config";

/* ------------------------------------------------------------------------- */
/* Verification type (PRD §7)                                                */
/* ------------------------------------------------------------------------- */

/**
 * The seven re-verification types. Their IDs use `re_*` prefixes so they
 * never collide with the parallel `CLMCaseType` vocabulary (the case
 * itself is always typed `re_verification`; this is the *sub-type*).
 */
export type ReVerificationType =
  | "re_identity"        // §7.1 — expired / mismatched ID
  | "re_liveness"        // §7.2 — risk-driven liveness re-check
  | "re_address"         // §7.3 — POA refresh
  | "re_income"          // §7.4 — income / source-of-wealth proof
  | "re_agreement"       // §7.5 — agreement re-sign
  | "re_questionnaire"   // §7.6 — suitability re-confirmation
  | "re_video";          // §7.7 — script-read video verification

/* ------------------------------------------------------------------------- */
/* Trigger source                                                            */
/* ------------------------------------------------------------------------- */

/** How the request came into being. */
export type ReVerificationTrigger = "manual" | "automatic";

/**
 * Coarse reason taxonomy for filter chips. Free-text justification still
 * lives on the request itself; this is just for the list-view filter.
 */
export type ReVerificationTriggerReason =
  | "document_expired"
  | "aml_hit"
  | "risk_escalation"
  | "device_risk"
  | "vpn_country_switch"
  | "large_withdrawal"
  | "large_deposit"
  | "agreement_update"
  | "policy_update"
  | "long_inactivity"
  | "fraud_investigation"
  | "manual_request";

/* ------------------------------------------------------------------------- */
/* Restrictions (PRD §12)                                                    */
/* ------------------------------------------------------------------------- */

/** §12.1 — restriction severity. */
export type RestrictionLevel =
  | "soft_reminder"       // notification only
  | "important"           // login popup
  | "blocking"            // restrict operations
  | "full_restriction";   // disable account access

/** §12.2 — which capabilities the restriction touches. */
export type RestrictionScope =
  | "login"
  | "deposit"
  | "withdrawal"
  | "trading"
  | "copy_trading"
  | "promotions";

/** §12.3 — when the restriction starts. */
export type RestrictionEffective =
  | { kind: "immediate" }
  | { kind: "delayed_hours"; hours: number }
  | { kind: "scheduled_iso"; at: string };

export interface RestrictionConfig {
  level: RestrictionLevel;
  /** Empty array = no scope-level limits; the level alone applies. */
  scopes: RestrictionScope[];
  effective: RestrictionEffective;
  /** Hours within which the user must complete the verification.
   *  Drives the SLA timer + the automatic escalation if overdue. */
  validityHours: number;
  /** §12.5 — when overdue, automatically escalate the level. Undefined
   *  means "no auto-escalation". */
  expirationEscalation?: {
    toLevel: RestrictionLevel;
    /** Optional: extra scopes to add when escalating. */
    addScopes?: RestrictionScope[];
  };
}

/* ------------------------------------------------------------------------- */
/* Notifications (PRD §13)                                                   */
/* ------------------------------------------------------------------------- */

/** §13.1 — supported delivery channels. */
export type NotificationChannel = "email" | "inbox" | "push" | "login_popup";

/** §13.2 — popup behaviour when the channel is `login_popup`. */
export type PopupSeverity =
  | "info"        // closable
  | "warning"     // reminder
  | "important"   // strong reminder
  | "blocking"    // restrict operations
  | "hard_block"; // disable system access

export interface NotificationConfig {
  /** Active channels for this request. */
  channels: NotificationChannel[];
  /** When `login_popup` is in `channels`, this is required. */
  popupSeverity?: PopupSeverity;
  /** Slot reference into `ReVerificationTemplate.id`, optional — when
   *  empty the request renders an inline `customMessage`. */
  templateId?: string;
  /** Inline override if no template is selected. */
  customMessage?: string;
  /** Optional CTA URL pattern. `{userId}` is replaced server-side. */
  ctaUrl?: string;
}

/* ------------------------------------------------------------------------- */
/* Request lifecycle                                                         */
/* ------------------------------------------------------------------------- */

/**
 * Lifecycle of a single user's re-verification.
 *
 *   draft       — created in the trigger drawer but not yet submitted
 *   notified    — sent to the user, waiting for their submission
 *   submitted   — user has uploaded / completed; case opened in Review Queue
 *   in_review   — assigned to a reviewer (mirrors case.status)
 *   approved    — case approved; restrictions cleared
 *   rejected    — case rejected; either escalation or blacklist follows
 *   expired     — user didn't act in time; escalation kicks in
 *   cancelled   — operator cancelled before user submitted
 */
export type ReVerificationStatus =
  | "draft"
  | "notified"
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected"
  | "expired"
  | "cancelled";

/** A single re-verification request bound to one user. */
export interface ReVerificationRequest {
  id: string;
  /** Display ID, e.g. RV-2026-000123. */
  requestNo: string;

  // ── target ──────────────────────────────────────────────
  userId: string;
  userUid: string;
  userName: string;
  userEmail: string;
  country: string;

  // ── what + why ──────────────────────────────────────────
  type: ReVerificationType;
  trigger: ReVerificationTrigger;
  triggerReason: ReVerificationTriggerReason;
  /** Operator-supplied free text. Required for manual triggers. */
  reasonText: string;

  // ── how ─────────────────────────────────────────────────
  restriction: RestrictionConfig;
  notification: NotificationConfig;

  // ── tracking ────────────────────────────────────────────
  status: ReVerificationStatus;
  /** ISO. Computed from `restriction.validityHours` when the request is
   *  notified to the user. */
  deadlineAt?: string;
  /** Set once `status` >= "submitted". Foreign key into `CLMCase`. */
  caseId?: string;

  // ── audit ──────────────────────────────────────────────
  createdBy: string;
  createdByName: string;
  createdAt: string;
  notifiedAt?: string;
  submittedAt?: string;
  resolvedAt?: string;
  /** When `trigger === "automatic"`, the rule that fired. */
  ruleId?: string;
}

/* ------------------------------------------------------------------------- */
/* Templates (PRD §18)                                                       */
/* ------------------------------------------------------------------------- */

/** Reusable notification body, slotted by `(verificationType, channel)`. */
export interface ReVerificationTemplate {
  id: string;
  name: string;
  verificationType: ReVerificationType;
  channel: NotificationChannel;
  /** Subject line — only meaningful for `email`. */
  subject?: string;
  /** Body text. Supports `{userName}`, `{deadline}`, `{ctaUrl}` tokens. */
  body: string;
  /** ISO codes the body has been translated into. UI surfaces this so
   *  operators can pick a matching language at trigger time. */
  languages: string[];
  active: boolean;
  updatedBy: string;
  updatedAt: string;
  createdAt: string;
}

/* ------------------------------------------------------------------------- */
/* Auto rules (PRD §17)                                                      */
/* ------------------------------------------------------------------------- */

/**
 * How the rule's conditions are evaluated by the engine.
 *
 *   - **event**       — fired by a specific business event (login,
 *                       withdrawal request, AML callback, etc.). The
 *                       engine evaluates conditions at the moment the
 *                       event arrives.
 *   - **continuous**  — fired by a background scanner that walks every
 *                       active user on a schedule (e.g. nightly). Used
 *                       for *time-based* conditions like document expiry
 *                       and inactivity windows that no business event
 *                       would otherwise surface.
 *
 * The same `WorkflowCondition` vocabulary applies to both; only the
 * scheduling shape differs.
 */
export type ReVerificationTriggerKind = "event" | "continuous";

/** How often a `continuous` rule scans. Ignored for `event` rules. */
export type ReVerificationScanFrequency = "daily" | "weekly" | "monthly";

/**
 * An auto-trigger rule. Reuses `WorkflowCondition` from the workflows
 * engine so the same evaluation pipeline applies.
 *
 * Rule examples:
 *   continuous:
 *     - `id_expires_in_days <= 7`             → Re-IDV
 *     - `inactivity_days >= 365`              → Re-IDV
 *   event:
 *     - `withdrawal_amount > 10000 USD`       → Re-Video
 *     - `vpn_country_switch = true`           → Re-Liveness
 *     - `agreement_version_outdated = true`   → Re-Agreement
 *     - `aml_hit = true`                      → Re-Income
 */
export interface ReVerificationRule {
  id: string;
  name: string;
  description?: string;
  /** Conditions are AND-combined. Empty array = "always fire" (rare). */
  conditions: WorkflowCondition[];
  /** What re-verification to issue when conditions match. */
  action: {
    verificationType: ReVerificationType;
    /** Restriction defaults applied to every spawned request. The trigger
     *  flow can still override per-user values when invoked manually. */
    restriction: RestrictionConfig;
    notification: NotificationConfig;
  };
  /** When + how the engine runs this rule. Defaults to `event`. */
  triggerKind: ReVerificationTriggerKind;
  /** Required when `triggerKind === "continuous"`. Ignored otherwise. */
  scanFrequency?: ReVerificationScanFrequency;
  /** Higher = evaluated first. */
  priority: number;
  enabled: boolean;
  /** Counters maintained by the engine (mock generates them). */
  runCount?: number;
  lastFiredAt?: string;
  updatedBy: string;
  updatedAt: string;
  createdAt: string;
}

/* ------------------------------------------------------------------------- */
/* Service-input shapes                                                      */
/* ------------------------------------------------------------------------- */

/**
 * Input to the manual-trigger flow. `userIds` lets one drawer submission
 * fan out into N requests. The operator picks the type, restriction, and
 * notification once; the service replicates them per user.
 */
export interface ReVerificationCreateInput {
  userIds: string[];
  type: ReVerificationType;
  triggerReason: ReVerificationTriggerReason;
  reasonText: string;
  restriction: RestrictionConfig;
  notification: NotificationConfig;
}

export interface ReVerificationListParams {
  status?: ReVerificationStatus | ReVerificationStatus[];
  type?: ReVerificationType;
  trigger?: ReVerificationTrigger;
  triggerReason?: ReVerificationTriggerReason;
  userId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}
