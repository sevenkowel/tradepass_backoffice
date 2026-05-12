/**
 * Reviewer lookup — thin wrapper over mockStaff so the case-detail
 * Assignee hover popover can pull a reviewer's profile by id or by
 * the display name string that's already stored on the case row.
 */

import { mockStaff } from "@/lib/backoffice/mock-staff";

export interface ReviewerSummary {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
  /** Last login (synthetic stat for UI). */
  lastActiveAt?: string;
  /** Mock activity stat. */
  decisionsThisWeek: number;
  /** Mock activity stat. */
  pendingAssigned: number;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function toReviewer(
  staff: typeof mockStaff[number] | null | undefined,
  fallbackName: string,
  fallbackId?: string,
): ReviewerSummary {
  if (staff) {
    const h = hash(staff.id);
    return {
      id: staff.id,
      name: staff.fullName || staff.nickname || fallbackName,
      role: staff.roleName,
      email: staff.email,
      avatar: staff.avatar,
      lastActiveAt: staff.lastLoginAt,
      decisionsThisWeek: 12 + (h % 30),
      pendingAssigned: 1 + ((h >>> 4) % 6),
    };
  }
  const h = hash(fallbackId ?? fallbackName);
  return {
    id: fallbackId ?? fallbackName.toLowerCase().replace(/\s+/g, "-"),
    name: fallbackName,
    role: "Reviewer",
    email: `${fallbackName.toLowerCase().replace(/\s+/g, ".")}@tradepass.com`,
    decisionsThisWeek: 12 + (h % 30),
    pendingAssigned: 1 + ((h >>> 4) % 6),
  };
}

/** Look up a reviewer by either staff id or display name. Always returns
 *  a `ReviewerSummary` — synthesises a placeholder when nothing matches. */
export function lookupReviewer(idOrName: string): ReviewerSummary {
  const byId = mockStaff.find((s) => s.id === idOrName);
  if (byId) return toReviewer(byId, idOrName, idOrName);

  const lower = idOrName.toLowerCase();
  const byName = mockStaff.find(
    (s) =>
      s.fullName.toLowerCase() === lower ||
      (s.nickname ?? "").toLowerCase() === lower ||
      s.email.toLowerCase().startsWith(lower + "@")
  );
  return toReviewer(byName, idOrName);
}
