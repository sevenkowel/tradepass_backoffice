"use client";

import { useCallback, useEffect, useState } from "react";

const REFRESH_MS = 60_000;

export function useApprovalCount(
  options: { enabled?: boolean } = {}
): { count: number; overdue: number; refresh: () => void } {
  const { enabled = true } = options;
  const [count,  setCount]  = useState(0);
  const [overdue, setOverdue] = useState(0);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const res  = await fetch("/api/approvals/stats");
      const data = await res.json();
      if (data.success) {
        setCount(data.pendingCount  ?? 0);
        setOverdue(data.overdueCount ?? 0);
      }
    } catch {
      /* keep last known values */
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const id = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh, enabled]);

  return { count, overdue, refresh };
}
