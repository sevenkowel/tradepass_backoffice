"use client";

/**
 * IPGeoPopover — click-anchored popover with IP forensics.
 *
 * Used on Case Detail's customer card and Clients' Device Tab. Clicking
 * the IP text opens this popover; clicking outside closes it.
 *
 * Renders through a Portal into `document.body` so the popover always
 * sits above sticky sidebars / sticky table cells regardless of the
 * stacking context that contains the anchor.
 */

import { createPortal } from "react-dom";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { IPGeoInfo } from "@/types/core";
import { usePortalPopover } from "./usePortalPopover";

const POPOVER_WIDTH = 288; // 18rem (Tailwind w-72)

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
  const { anchorRef, popoverRef, open, pos, togglePopover } =
    usePortalPopover<HTMLButtonElement>({ width: POPOVER_WIDTH });

  return (
    <>
      <button
        ref={anchorRef}
        onClick={togglePopover}
        className={cn(
          "font-mono tabular-nums text-xs text-primary hover:underline underline-offset-2 cursor-pointer",
          className
        )}
      >
        {ip}
      </button>
      {open && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            className="fixed z-[100] w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-sm"
            style={{ top: pos.top, left: pos.left }}
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
