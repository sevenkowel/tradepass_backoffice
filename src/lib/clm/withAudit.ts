/**
 * `withAudit` — decorator that wraps a service method with audit-log emission.
 *
 * The CLM module ships an immutable audit trail (`/crm/approvals/audit-trail`).
 * Every mutating service call should record an entry. Rather than
 * sprinkle `auditService.log(...)` around inside `case.service.ts`,
 * compose it at the call site:
 *
 *   import { withAudit } from "@/lib/clm/withAudit";
 *
 *   const approve = withAudit(
 *     caseService.approve.bind(caseService),
 *     ({ args: [caseId, reviewerId] }) => ({
 *       action: "case_approved",
 *       targetType: "case",
 *       targetId: caseId,
 *       actorId: reviewerId,
 *     })
 *   );
 *
 *   await approve(caseId, staffId, notes);
 *
 * The decorator runs the original method, then — if it succeeds —
 * pushes an audit entry through `auditService`. Failures bubble up
 * unchanged so the caller can `try/catch` normally.
 *
 * NOTE: this is an opt-in helper, not a global middleware. Call sites
 * decide whether their action is audit-worthy. Read-only methods
 * (`list`, `getById`) should never be wrapped.
 */

import type {
  CLMAuditAction,
  CLMAuditTargetType,
} from "@/types/clm";

type AnyAsyncFn = (...args: unknown[]) => Promise<unknown>;

interface AuditPayloadFromCall<F extends AnyAsyncFn> {
  args: Parameters<F>;
  result: Awaited<ReturnType<F>>;
}

export interface AuditLogDraft {
  action: CLMAuditAction;
  targetType: CLMAuditTargetType;
  targetId: string;
  actorId: string;
  /** Optional human-readable reason for the action. */
  reason?: string;
  /** Optional snapshot of fields before the change. */
  previousValue?: Record<string, unknown>;
  /** Optional snapshot of fields after the change. */
  newValue?: Record<string, unknown>;
}

/** Resolver receives the call's args (and result) and returns the log draft. */
type AuditResolver<F extends AnyAsyncFn> = (
  ctx: AuditPayloadFromCall<F>
) => AuditLogDraft;

export function withAudit<F extends AnyAsyncFn>(
  fn: F,
  resolve: AuditResolver<F>
): F {
  // Lazy import so this module stays tree-shakeable for callers that
  // don't actually invoke audited methods.
  const wrapped = async (...args: Parameters<F>) => {
    const result = (await fn(...args)) as Awaited<ReturnType<F>>;
    try {
      const draft = resolve({ args, result });
      const { auditService } = await import("./services");
      // Best-effort. Mock service intentionally accepts loose shapes
      // until the real backend lands.
      const log = auditService as unknown as {
        log?: (entry: AuditLogDraft) => Promise<void>;
      };
      if (typeof log.log === "function") {
        await log.log(draft);
      }
    } catch (err) {
      // Audit failures must never break the parent call.
      // eslint-disable-next-line no-console
      console.warn("[withAudit] failed to emit audit log:", err);
    }
    return result;
  };
  return wrapped as F;
}
