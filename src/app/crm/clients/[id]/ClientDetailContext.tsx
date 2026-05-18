"use client";

/**
 * ClientDetailContext — single source of truth for `/crm/clients/[id]/*`.
 *
 * Before this context, `layout.tsx` and `page.tsx` each called
 * `clientService.getDetail()` independently (2× requests every nav, no
 * cache, no shared mutation). The Provider lives in `layout.tsx` and
 * wraps every nested page; consumers (page, sidebar, tabs) read via
 * `useClientDetail()` and trigger refresh via `refresh()`.
 *
 * Anything that mutates client state (freeze, tag, approve) should
 * call `refresh()` after the mutation lands so every consumer rerenders
 * with a single shared fetch.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clientService } from "@/lib/crm/services/client.service";
import type { ClientDetailData } from "@/types/backoffice/client-detail";

interface ClientDetailContextValue {
  /** The full detail payload, or `null` until first fetch resolves. */
  detail: ClientDetailData | null;
  /** Loading state for the *initial* fetch only — refresh runs in the background. */
  loading: boolean;
  /** True when a background refresh is in flight (after first load). */
  refreshing: boolean;
  /** Re-fetch from the service. Call after any mutation. */
  refresh: () => Promise<void>;
  /** Manually overwrite the cached detail (useful for optimistic updates). */
  setDetail: (next: ClientDetailData | null) => void;
}

const Ctx = createContext<ClientDetailContextValue | null>(null);

interface ProviderProps {
  clientId: string;
  children: ReactNode;
}

export function ClientDetailProvider({ clientId, children }: ProviderProps) {
  const [detail, setDetail] = useState<ClientDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!clientId) return;
    setRefreshing(true);
    try {
      const data = await clientService.getDetail(clientId);
      setDetail(data);
    } finally {
      setRefreshing(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    setLoading(true);
    clientService
      .getDetail(clientId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  /**
   * 后台轮询刷新 (P2-13)。
   *   - 间隔 30s，仅在 document.visibility 为 "visible" 时触发
   *   - 离开 Tab → 自动暂停（节省带宽 + 避免不必要的告警）
   *   - 真后端实装 SSE/websocket 时把这段换成 useEventSource
   */
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    let timer: number | null = null;

    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const data = await clientService.getDetail(clientId);
        if (!cancelled) setDetail(data);
      } catch { /* ignore polling errors */ }
    };

    const start = () => {
      if (timer != null) return;
      timer = window.setInterval(tick, 30_000);
    };
    const stop = () => {
      if (timer != null) { clearInterval(timer); timer = null; }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [clientId]);

  const value = useMemo<ClientDetailContextValue>(
    () => ({ detail, loading, refreshing, refresh, setDetail }),
    [detail, loading, refreshing, refresh]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Read the current client detail. Throws if used outside the provider —
 * that's intentional, it surfaces wiring mistakes early.
 */
export function useClientDetail(): ClientDetailContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error(
      "useClientDetail must be used inside <ClientDetailProvider/> (mounted by /crm/clients/[id]/layout.tsx)."
    );
  }
  return ctx;
}
