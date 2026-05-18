/**
 * Approval Center — Per-type permission map (v2).
 *
 * v1 routed every approval through the `compliance` permission, which
 * meant a finance officer couldn't reach withdrawal approvals and a
 * support agent couldn't reach profile-change approvals without
 * over-broad compliance access. v2 splits the permission surface
 * per-task-type so each operator role sees only what it can act on.
 *
 * Mapping rationale:
 *   - kyc / re_verification / aml_review → `compliance` (KYC reviewers)
 *   - withdrawal / large_withdrawal / deposit → `funds` (finance officers)
 *   - leverage → `risk` (risk managers — exposure / margin impact)
 *   - partner → `accounts` (IB / partnership ops)
 *   - profile_change → `accounts` (support / account ops)
 *   - reward → `marketing` (campaign / promo team)
 *
 * Lookup contract:
 *   `canActOnType(userPermissions, type)` returns true if the user has
 *   the required permission with at least a `view` action. The Inbox
 *   and the All views use this to apply a **row-level filter** — there
 *   is no menu-level gate, because operators with limited scope still
 *   need to see "Inbox is empty" rather than be told their menu is
 *   missing items.
 *
 * See `docs/Approval-Center-v2-Architecture.md` §D4.
 */

import type { TaskType } from "@/types/approval";
import type { AdminUser } from "@/types/backoffice";
import type { PermissionModule } from "@/types/backoffice/role";

export const TYPE_PERMISSION: Record<TaskType, PermissionModule> = {
  kyc:              "compliance",
  re_verification:  "compliance",
  aml_review:       "compliance",
  withdrawal:       "funds",
  large_withdrawal: "funds",
  deposit:          "funds",
  leverage:         "risk",
  reward:           "marketing",
  partner:          "accounts",
  profile_change:   "accounts",
};

/** Does the operator hold a permission that allows acting on a task
 *  of this type? Super-admins (with the `*` wildcard) always pass. */
export function canActOnType(user: AdminUser | null, type: TaskType): boolean {
  if (!user) return false;
  const perms = user.role.permissions;
  const required = TYPE_PERMISSION[type];

  // Wildcard super-admin (the `*` module isn't in PermissionModule's
  // literal union but does exist at runtime in seeded super-admin
  // roles — same trick the Sidebar uses to detect super-admins).
  if (perms.some((p) => (p.module as string) === "*" && (p.actions as readonly string[]).includes("*"))) {
    return true;
  }
  // Specific module match
  const modulePerm = perms.find((p) => p.module === required);
  if (!modulePerm) return false;
  const actions = modulePerm.actions as readonly string[];
  return actions.includes("*") || actions.includes("view");
}

/** Returns the set of task types the operator can act on. Convenient
 *  for "only show these chips in the type filter" use cases. */
export function allowedTaskTypes(user: AdminUser | null): TaskType[] {
  return (Object.keys(TYPE_PERMISSION) as TaskType[]).filter((t) => canActOnType(user, t));
}
