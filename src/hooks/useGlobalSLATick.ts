"use client";

/**
 * useGlobalSLATick — single timer that drives all SLA countdown displays.
 *
 * Before this hook every `SLACell` ran its own `setInterval`. With 100+
 * cells on a busy review-queue page that meant 100+ timers and 100+
 * `setState` calls per tick. Now the page mounts a single ticker via
 * `useGlobalSLATick()` and each cell reads the returned monotonic count
 * (which only changes once per `interval`), letting `useMemo` /
 * `React.memo` cull most renders.
 *
 * Usage:
 *
 *   const tick = useGlobalSLATick();          // 10s default
 *   const sla = useMemo(() => computeSLA(slaDueAt), [slaDueAt, tick]);
 */

import { useEffect, useState } from "react";

export function useGlobalSLATick(intervalMs: number = 10_000): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return tick;
}
