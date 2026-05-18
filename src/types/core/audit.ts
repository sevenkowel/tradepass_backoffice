/**
 * GlobalAuditLog — single source of truth for "who did what, when, why".
 *
 * The CRM previously carried at least three separate audit shapes:
 *   - `@/types/clm/audit.ts → CLMAuditLog`               (rich CLM actor/target/changes)
 *   - `@/types/backoffice/client-detail.ts → AuditLog`   (client-scoped single-field diff)
 *   - inline shape in `/crm/compliance/audit/page.tsx`   (severity + module + before/after)
 *
 * Plus several near-duplicates: `backoffice/common.ts → AuditLog`,
 * `backoffice/staff.ts → StaffAuditLog`, and free-form timeline events. Any
 * given page therefore had to learn one of N shapes; cross-domain queries
 * (e.g. "show me everything that touched user-001 today") were impossible.
 *
 * `GlobalAuditLog` is the superset all three modules now serialise into. Each
 * legacy producer provides an adapter (`@/lib/audit/adapters.ts`); the
 * Audit Trail page reads only this shape, with a `domain` discriminator to
 * filter by source.
 *
 * Design rules:
 *   - **Domain-aware**: `domain` partitions logs by where the action ran
 *     (clients | clm | risk | staff | compliance | funds | trading | system).
 *   - **Severity-aware**: every log carries an info/warning/critical bucket
 *     so the table can colour rows without consulting the action vocabulary.
 *   - **Diff-aware**: `changes[]` is a normalised list of field diffs — works
 *     equally well for "single field changed" (legacy client log) and
 *     "many fields changed" (legacy CLM log).
 *   - **Loose action vocabulary**: `action` is a free-form string keyed by
 *     producers. The unified table renders `actionLabel` directly; only
 *     domain-specific UI cares about the underlying key.
 *
 * When the backend Audit Service lands, swap the in-memory aggregator in
 * `@/lib/audit/service.ts` for an HTTP call — UI stays unchanged.
 */

/**
 * Operational area the action took place in. Pages render an icon per
 * domain in the audit table (see Audit Trail).
 */
export type AuditDomain =
  | "clients"     // Clients module — client edits, KYC, tags, notes
  | "clm"         // CLM Center — case lifecycle (assigned/approved/rejected/etc)
  | "risk"        // Risk Center — rules, alerts, blacklists
  | "compliance"  // Compliance — agreements, policies, audits themselves
  | "funds"       // Treasury / withdrawals review
  | "trading"     // Trading config (leverage, groups, symbols)
  | "staff"       // Staff account / RBAC changes
  | "system";     // System-emitted events (auto-rules, schedulers)

/** Severity bucket — drives row colour and the optional KPI strip. */
export type AuditSeverity = "info" | "warning" | "critical";

/** Free-form key-value diff. Legacy single-field shape projects to a
 *  one-element array. */
export interface AuditChange {
  /** Field name as understood by the producer (e.g. "max_leverage"). */
  field: string;
  /** Optional human-readable label, falls back to `field` if missing. */
  label?: string;
  /** Previous value as a JSON-serialisable scalar / object. */
  oldValue?: unknown;
  /** New value as a JSON-serialisable scalar / object. */
  newValue?: unknown;
}

/** Who triggered the action. `system` is the conventional ID for automation. */
export interface AuditActor {
  id: string;
  name: string;
  /** Role at the time of the action — denormalised on purpose so old logs
   *  remain accurate even if the actor's role later changes. */
  role?: string;
}

/** What the action acted on. `kind` is domain-specific (case/customer/policy/...). */
export interface AuditTarget {
  /** Domain-specific type tag, e.g. "case" / "customer" / "policy". */
  kind: string;
  id: string;
  /** Optional human label (case number, customer name, …). */
  name?: string;
}

/**
 * Unified, domain-tagged audit record.
 *
 * Producers stamp records into this shape via adapters in
 * `@/lib/audit/adapters.ts`. Consumers (Audit Trail page, Client Detail
 * Logs tab, Case Detail history strip) all read this same shape.
 */
export interface GlobalAuditLog {
  /** Internal unique ID (UUID-ish). */
  id: string;
  /** Optional display ID (e.g. "AUD-000123"). */
  auditId?: string;

  domain: AuditDomain;
  severity: AuditSeverity;

  /** Stable action key (e.g. "case_approved", "client_leverage_updated").
   *  Convention: `<noun>_<verb>` snake_case. */
  action: string;
  /** Display label rendered directly in the table cell. */
  actionLabel: string;

  actor: AuditActor;
  target: AuditTarget;

  /** Optional client UID this log relates to. Lets the Audit Trail filter
   *  to "everything that touched this user" across domains. */
  clientId?: string;

  /** One-liner explaining the action (free text). */
  description?: string;
  /** Reviewer-supplied reason (rejection note, override justification, …). */
  reason?: string;

  /** Field diffs. Empty array if the action carries no diff (e.g. login). */
  changes: AuditChange[];

  /** Connection metadata at the time of the action. */
  ipAddress?: string;
  device?: string;
  userAgent?: string;

  /** ISO timestamp the action took place. */
  createdAt: string;
}

/** Parameters accepted by the unified audit list endpoint. */
export interface GlobalAuditListParams {
  domain?: AuditDomain;
  severity?: AuditSeverity;
  action?: string;
  actorId?: string;
  clientId?: string;
  targetKind?: string;
  targetId?: string;
  /** ISO range. */
  startDate?: string;
  endDate?: string;
  /** Free-text search across actor/target/description. */
  search?: string;
  page?: number;
  pageSize?: number;
}
