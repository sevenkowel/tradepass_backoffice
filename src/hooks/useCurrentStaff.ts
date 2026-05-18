"use client";

/**
 * Canonical hooks for "who is the currently signed-in CRM operator?"
 *
 * Wherever you used to write `"staff-001"` (or any other hard-coded staff
 * id), call `useCurrentStaffId()` instead. The hook reads from the same
 * authStore that powers the TopBar, so the value is always consistent
 * with what the user sees.
 *
 * Usage:
 *
 *   const staffId = useCurrentStaffId();
 *   await caseService.approve(caseId, staffId);
 *
 * For the full record (display name, role, etc.), call `useCurrentStaff()`.
 */

import { useAuthStore } from "@/store/crm/authStore";
import type { AdminUser } from "@/types/backoffice";

/** Returns the full signed-in admin record, or `null` if no session. */
export function useCurrentStaff(): AdminUser | null {
  return useAuthStore((s) => s.user);
}

/**
 * Returns the signed-in operator's id.
 *
 * Falls back to a deterministic placeholder (`"staff-anonymous"`) when
 * there is no session, so callers don't have to defensive-null-check —
 * pages that legitimately allow anonymous use should be guarded by
 * `useAuthGuard` upstream and never see this fallback.
 */
export function useCurrentStaffId(): string {
  return useAuthStore((s) => s.user?.id ?? "staff-anonymous");
}

/** Returns the signed-in operator's display name (username). */
export function useCurrentStaffName(): string {
  return useAuthStore((s) => s.user?.username ?? "Unknown");
}
