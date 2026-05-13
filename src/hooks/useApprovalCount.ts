"use client";

import { useCallback, useEffect, useState } from "react";
import { approvalService } from "@/lib/approval/service";

const REFRESH_MS = 60_000;

export function useApprovalCount(
  options: { enabled?: boolean } = {}
): { count: number; overdue: number; refresh: () => void } {
  const { enabled = true } = options;
  const [count, setCount] = useState(0);
  const [overdue, setOverdue] = useState(0);

  const refresh = useCallback(() => {
    if (!enabled) return;
    try {
      const total = approvalService.getTotalPending();
      const summary = approvalService.getSummary();
      const od =
        summary.kyc.overdue + summary.deposit.overdue + summary.withdrawal.overdue;
      setCount(total);
      setOverdue(od);
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
