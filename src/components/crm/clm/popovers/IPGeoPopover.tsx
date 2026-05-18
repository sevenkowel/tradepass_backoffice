"use client";

/**
 * IPGeoPopover — hover-anchored popover with IP forensics.
 *
 * Used on Case Detail's customer card and Clients' Device Tab. Hovering
 * the IP text opens this popover; leaving the anchor (or popover) closes
 * it after a small delay so the user can move the cursor between them
 * without the card dismissing.
 *
 * Renders through a Portal into `document.body` so the popover always
 * sits above sticky sidebars / sticky table cells regardless of the
 * stacking context that contains the anchor.
 *
 * Mirrors `IBSummaryHover` — same enter/leave semantics, same close
 * delay, same close-on-scroll/resize. The two popovers used to differ
 * (click vs hover) for no good reason; aligning them keeps the customer
 * card consistent.
 */

import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { IPGeoInfo } from "@/types/core";

const POPOVER_WIDTH = 288; // 18rem (Tailwind w-72)
const HOVER_CLOSE_DELAY = 120;

function flagOf(country: string): string {
  if (!country || country.length !== 2) return "🌐";
  return country
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

interface Props {
  ip: string;
  geo: IPGeoInfo;
  className?: string;
}

export function IPGeoPopover({ ip, geo, className }: Props) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const computePos = useCallback(() => {
    const r = anchorRef.current?.getBoundingClientRect();
    if (!r) return;
    const margin = 8;
    const left = Math.max(margin, Math.min(r.left, window.innerWidth - POPOVER_WIDTH - margin));
    setPos({ top: r.bottom + 4, left });
  }, []);

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    computePos();
    setOpen(true);
  };
  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY);
  };

  // Close on scroll / resize so the card doesn't drift away from its anchor.
  useEffect(() => {
    if (!open) return;
    const onMove = () => setOpen(false);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  // Cancel any pending close timer on unmount so we don't toggle state
  // on a torn-down component.
  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <>
      <span
        ref={anchorRef}
        className={cn("relative inline-block", className)}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <span className="font-mono tabular-nums text-xs text-primary hover:underline underline-offset-2 cursor-pointer">
          {ip}
        </span>
      </span>
      {open && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-[100] w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-sm"
            style={{ top: pos.top, left: pos.left }}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl leading-none flex-shrink-0">{flagOf(geo.country)}</span>
                <div className="min-w-0">
                  <p className="font-mono tabular-nums text-xs text-slate-700 truncate">{geo.ip}</p>
                  <p className="text-[11px] text-slate-500 truncate">{geo.city}, {geo.countryName}</p>
                </div>
              </div>
              <ThreatChip score={geo.threatScore} />
            </div>

            <p className="text-[11px] text-slate-500 mb-3 truncate" title={geo.asn}>
              <span className="text-slate-400 mr-1.5">ASN</span>
              {geo.asn}
            </p>

            {(geo.isVpn || geo.isProxy || geo.isTor || geo.isHosting || geo.isMobile) && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {geo.isVpn && <Tag tone="warn">VPN</Tag>}
                {geo.isProxy && <Tag tone="warn">Proxy</Tag>}
                {geo.isTor && <Tag tone="danger">Tor</Tag>}
                {geo.isHosting && <Tag tone="warn">Hosting</Tag>}
                {geo.isMobile && <Tag tone="info">Mobile</Tag>}
              </div>
            )}

            <div className="border-t border-slate-100 pt-2.5">
              <p className="text-[11px] text-slate-500 mb-1.5">
                <span className="font-semibold text-slate-700 tabular-nums">{geo.registrationsFromThisIP}</span>{" "}
                account{geo.registrationsFromThisIP === 1 ? "" : "s"} registered from this IP
              </p>
              {geo.relatedUids.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {geo.relatedUids.slice(0, 6).map((uid) => (
                    <Link
                      key={uid}
                      href={`/crm/clients/${uid}`}
                      className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-primary transition-colors"
                    >
                      {uid}
                    </Link>
                  ))}
                  {geo.relatedUids.length > 6 && (
                    <span className="text-[10px] text-slate-400">
                      +{geo.relatedUids.length - 6} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function ThreatChip({ score }: { score: number }) {
  const tone =
    score >= 70 ? "bg-red-100 text-red-700" :
    score >= 40 ? "bg-amber-100 text-amber-700" :
    score >= 15 ? "bg-slate-100 text-slate-600" :
                  "bg-emerald-100 text-emerald-700";
  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold tabular-nums whitespace-nowrap", tone)}>
      Threat {score}
    </span>
  );
}

function Tag({
  tone,
  children,
}: {
  tone: "warn" | "danger" | "info";
  children: React.ReactNode;
}) {
  const cls =
    tone === "danger" ? "bg-red-100 text-red-700" :
    tone === "warn" ? "bg-amber-100 text-amber-700" :
    "bg-blue-100 text-blue-700";
  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", cls)}>
      {children}
    </span>
  );
}
