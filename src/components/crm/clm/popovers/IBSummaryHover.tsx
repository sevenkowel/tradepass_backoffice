"use client";

/**
 * IBSummaryHover — hover-anchored card showing the Introducing Broker
 * who referred this client.
 *
 * Renders through a Portal into `document.body` so the card always
 * sits above sticky sidebars / sticky table cells regardless of the
 * stacking context that contains the anchor.
 */

import { createPortal } from "react-dom";
import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { IBSummary, IBTier } from "@/types/core";

const POPOVER_WIDTH = 288; // w-72
const PEER_KYC_PASS = 0.88;
const PEER_FRAUD = 0.04;
const HOVER_CLOSE_DELAY = 120;

const TIER_CHIP: Record<IBTier, string> = {
  standard: "bg-slate-100 text-slate-700",
  gold: "bg-amber-100 text-amber-700",
  platinum: "bg-violet-100 text-violet-700",
};

interface Props {
  ib: IBSummary;
  className?: string;
}

export function IBSummaryHover({ ib, className }: Props) {
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

  // Close on scroll/resize so the card doesn't drift away from its anchor.
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

  return (
    <>
      <span
        ref={anchorRef}
        className={cn("relative inline-block", className)}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <span className="text-primary hover:underline underline-offset-2 cursor-pointer">
          {ib.name}
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
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{ib.name}</p>
                <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                  {ib.id} · UID {ib.uid}
                </p>
              </div>
              <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", TIER_CHIP[ib.tier])}>
                {ib.tier}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <Stat label="Referred" value={ib.totalReferred} />
              <Stat label="Active" value={ib.activeReferred} />
              <Stat
                label="KYC pass"
                value={`${(ib.kycPassRate * 100).toFixed(0)}%`}
                hint={ib.kycPassRate < PEER_KYC_PASS ? "below peer" : "at/above peer"}
                tone={ib.kycPassRate < PEER_KYC_PASS ? "warn" : "ok"}
              />
              <Stat
                label="Fraud"
                value={`${(ib.fraudRate * 100).toFixed(1)}%`}
                hint={ib.fraudRate > PEER_FRAUD ? "above peer" : "at/below peer"}
                tone={ib.fraudRate > PEER_FRAUD ? "warn" : "ok"}
              />
            </div>

            <p className="text-[10px] text-slate-400 leading-snug mb-3">
              IB performance shown for context — apply the same standard
              to all clients, regardless of source.
            </p>

            <Link
              href={`/crm/clients/${ib.uid}`}
              className="block text-center text-xs text-primary hover:underline underline-offset-2 font-medium"
            >
              Open IB profile →
            </Link>
          </div>,
          document.body
        )}
    </>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="bg-slate-50 rounded-lg px-2.5 py-2">
      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-slate-900 tabular-nums leading-tight mt-0.5">
        {value}
      </p>
      {hint && (
        <p className={cn(
          "text-[10px] mt-0.5",
          tone === "warn" ? "text-amber-600" : "text-emerald-600"
        )}>
          {hint}
        </p>
      )}
    </div>
  );
}
