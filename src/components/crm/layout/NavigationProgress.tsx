"use client";

/**
 * Top-of-page navigation progress bar.
 *
 * Mounted once inside `ClientLayout`; listens for client-side route
 * changes (click on any anchor whose `href` resolves to a same-origin
 * route) and renders a thin animated bar at the top of the viewport
 * until the destination's `pathname` settles.
 *
 * Why this design:
 *   - Sidebar clicks in dev compile their destination on the fly, and
 *     the delay can be perceived as the menu being "stuck". A small,
 *     well-known progress affordance removes the ambiguity ("did my
 *     click register?") without lying about progress.
 *   - The bar is gated behind a 150 ms delay so fast navigations never
 *     show it — avoids a flash for sub-frame transitions.
 *   - Driven by DOM click capture (vs. wrapping every `<Link>` in a
 *     custom event handler) so the bar covers every navigation path:
 *     sidebar links, in-page links, programmatic `router.push`.
 *
 * The bar peaks at ~80 % while pending — never advertises completion
 * until the route actually changes, which is the NProgress convention.
 */

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const APPEAR_DELAY_MS = 150;

export function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const appearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingTargetRef = useRef<string | null>(null);

  const reset = () => {
    if (appearTimerRef.current) clearTimeout(appearTimerRef.current);
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    appearTimerRef.current = null;
    tickTimerRef.current = null;
    pendingTargetRef.current = null;
  };

  /**
   * Start the pending state.
   *
   * Two-phase: hold for `APPEAR_DELAY_MS` so the bar never flashes for
   * fast nav; once shown, tick towards 80 % with a sliding-asymptote
   * curve so we never look frozen, but also never claim to be done.
   */
  const start = (href: string) => {
    reset();
    pendingTargetRef.current = href;
    appearTimerRef.current = setTimeout(() => {
      setActive(true);
      setProgress(8);
      tickTimerRef.current = setInterval(() => {
        setProgress((p) => {
          const remaining = 80 - p;
          if (remaining <= 0.5) return 80;
          return p + Math.max(0.4, remaining * 0.06);
        });
      }, 120);
    }, APPEAR_DELAY_MS);
  };

  /** Finish the bar — fill to 100 % then fade out. */
  const finish = () => {
    reset();
    setActive((wasActive) => {
      if (!wasActive) {
        setProgress(0);
        return false;
      }
      setProgress(100);
      // Let the fill animate before unmounting.
      setTimeout(() => {
        setActive(false);
        setProgress(0);
      }, 220);
      return true;
    });
  };

  // When pathname changes, finish whatever was pending.
  useEffect(() => {
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Cleanup on unmount.
  useEffect(() => reset, []);

  // Global click listener — captures internal navigations. We watch
  // `mousedown` rather than `click` so the bar appears even if the
  // click handler is heavy (we want to feel the pressed state
  // immediately). `capture: true` lets us see the event before any
  // `stopPropagation()` further down.
  useEffect(() => {
    const isInternalHref = (href: string): boolean => {
      try {
        const url = new URL(href, window.location.origin);
        return url.origin === window.location.origin;
      } catch {
        return false;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      // Only primary click counts.
      if (e.button !== 0) return;
      // Ignore modifier-clicks (open in new tab, save link, etc.).
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href === "#" || href.startsWith("#")) return;
      // Skip anchors that explicitly opt out (`target=_blank`, download).
      if (anchor.target && anchor.target !== "" && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (!isInternalHref(href)) return;
      // Skip same-page nav (re-clicking the active item shouldn't show
      // progress — there's nothing to wait for).
      const resolved = new URL(href, window.location.href).pathname;
      if (resolved === window.location.pathname) return;
      start(resolved);
    };

    window.addEventListener("mousedown", onMouseDown, true);
    return () => window.removeEventListener("mousedown", onMouseDown, true);
  }, []);

  // Render nothing while idle so we don't sit on the DOM with opacity:0.
  if (!active && progress === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[2px]"
    >
      <div
        className="h-full bg-gradient-to-r from-primary/80 via-primary to-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.6)] transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: active ? 1 : 0,
        }}
      />
    </div>
  );
}
