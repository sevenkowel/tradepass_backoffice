"use client";

/**
 * useReviewQueueCount — keeps a global count of cases that still need
 * operator action (status ∈ pending / reviewing / escalated / resubmission).
 *
 * Drives the Sidebar's "Review Queue" badge so operators see at a
 * glance how much work is queued, without having to open the page.
 *
 * The count refreshes:
 *   - Once on mount.
 *   - Every 60 s on a low-priority interval.
 *   - On demand via the returned `refresh()` (e.g. after batch approve).
 *
 * Hook is hoisted into Sidebar; downstream consumers don't need to do
 * anything special. If the request fails the hook silently keeps the
 * last known value rather than blocking the UI.
 */

import { useCallback, useEffect, useState } from "react";
import { caseService } from "@/lib/clm/services";
import type { CLMCaseStatus } from "@/types/clm";

const ACTIVE_STATUSES: CLMCaseStatus[] = [
  "pending",
  "reviewing",
  "escalated",
  "resubmission",
];

const REFRESH_MS = 60_000;

export function useReviewQueueCount(): { count: number; refresh: () => void } {
  const [count, setCount] = useState<number>(0);

  const refresh = useCallback(async () => {
    try {
      const r = await caseService.list({
        page: 1,
        pageSize: 1,
        statusIn: ACTIVE_STATUSES,
      });
      setCount(r.total);
    } catch {
      /* swallow — keep last known count */
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return { count, refresh };
}
