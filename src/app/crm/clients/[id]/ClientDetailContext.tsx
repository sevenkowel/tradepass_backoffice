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
