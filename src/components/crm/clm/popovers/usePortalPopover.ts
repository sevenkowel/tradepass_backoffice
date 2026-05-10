"use client";

/**
 * usePortalPopover — shared positioning + click-outside logic for the
 * three popover components (IPGeoPopover, IBSummaryHover, VerificationChip).
 *
 * Why a portal: each popover's anchor lives inside a `position: sticky`
 * sidebar or other layout that creates its own stacking context. Even
 * with `z-50` the popover gets clipped or covered by neighbouring
 * sticky cells. Rendering into `document.body` bypasses every
 * intermediate stacking context.
 *
 * Behaviour:
 *   - Position is computed off the anchor's bounding rect on open.
 *   - Re-clamps horizontally so the popover never overflows the viewport.
 *   - Closes on click-outside or scroll (to avoid a stale anchor).
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface PopoverState {
  open: boolean;
  /** Top-left of the popover, in viewport coordinates. */
  pos: { top: number; left: number };
}

interface Options {
  /** Width of the popover in px (used for right-edge clamping). */
  width: number;
  /** Vertical gap (px) between the anchor and the popover. */
  gap?: number;
}

export function usePortalPopover<TAnchor extends HTMLElement>({ width, gap = 4 }: Options) {
  const anchorRef = useRef<TAnchor>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<PopoverState>({ open: false, pos: { top: 0, left: 0 } });

  const computePos = useCallback(() => {
    const r = anchorRef.current?.getBoundingClientRect();
    if (!r) return { top: 0, left: 0 };
    const margin = 8;
    const left = Math.max(margin, Math.min(r.left, window.innerWidth - width - margin));
    return { top: r.bottom + gap, left };
  }, [width, gap]);

  const open = useCallback(() => {
    setState({ open: true, pos: computePos() });
  }, [computePos]);

  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  const toggle = useCallback(() => {
    setState((s) => (s.open ? { ...s, open: false } : { open: true, pos: computePos() }));
  }, [computePos]);

  // Close on outside click or scroll/resize (anchor would drift otherwise).
  useEffect(() => {
    if (!state.open) return;
    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t)) return;
      if (popoverRef.current?.contains(t)) return;
      close();
    };
    const onScrollOrResize = () => close();
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [state.open, close]);

  return { anchorRef, popoverRef, ...state, openPopover: open, closePopover: close, togglePopover: toggle };
}
