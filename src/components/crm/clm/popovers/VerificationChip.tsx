"use client";

/**
 * VerificationChip — compact "Sumsub: 87 ✓" badge attached to a
 * submitted document. Click expands a popover listing the reasons
 * the verifier returned (the "why" behind the score).
 *
 * Renders the popover through a Portal so it always sits above sticky
 * sidebars / sticky table cells regardless of ancestor stacking context.
 */

import { createPortal } from "react-dom";
import { Check, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ThirdPartyVerification, VerificationStatus } from "@/types/core";
import { usePortalPopover } from "./usePortalPopover";

const POPOVER_WIDTH = 320; // w-80

const STATUS_TONE: Record<VerificationStatus, { chip: string; icon: typeof Check; iconCls: string; label: string }> = {
  pass:   { chip: "bg-emerald-100 text-emerald-700", icon: Check,       iconCls: "text-emerald-600", label: "Pass"   },
  review: { chip: "bg-amber-100 text-amber-700",     icon: AlertCircle, iconCls: "text-amber-600",   label: "Review" },
  fail:   { chip: "bg-red-100 text-red-700",         icon: X,           iconCls: "text-red-600",     label: "Fail"   },
};

const PROVIDER_LABEL: Record<string, string> = {
  sumsub:   "Sumsub",
  onfido:   "Onfido",
  jumio:    "Jumio",
  internal: "Internal",
};

interface Props {
  verification: ThirdPartyVerification;
  className?: string;
}

export function VerificationChip({ verification, className }: Props) {
  const { anchorRef, popoverRef, open, pos, togglePopover } =
    usePortalPopover<HTMLButtonElement>({ width: POPOVER_WIDTH });

  const tone = STATUS_TONE[verification.status];
  const Icon = tone.icon;
  const providerLabel = PROVIDER_LABEL[verification.provider] ?? verification.provider;

  return (
    <>
      <button
        ref={anchorRef}
        onClick={togglePopover}
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-opacity hover:opacity-90",
          tone.chip,
          className
        )}
      >
        <Icon className={cn("w-3 h-3", tone.iconCls)} />
        <span className="font-mono tabular-nums">{providerLabel}: {verification.score}</span>
      </button>
      {open && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            className="fixed z-[100] w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-sm"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="font-semibold text-slate-900">{providerLabel} Verification</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {new Date(verification.verifiedAt).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className={cn("text-2xl font-bold tabular-nums leading-none", tone.iconCls)}>
                  {verification.score}
                </p>
                <p className={cn("text-[10px] uppercase tracking-wider mt-0.5", tone.iconCls)}>
                  {tone.label}
                </p>
              </div>
            </div>

            {verification.reasons.length > 0 && (
              <ul className="space-y-1.5 mb-3">
                {verification.reasons.map((r, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            )}

            {verification.externalId && (
              <p className="text-[10px] font-mono tabular-nums text-slate-400 truncate">
                ref: {verification.externalId}
              </p>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
