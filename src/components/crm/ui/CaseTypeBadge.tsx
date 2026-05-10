"use client";

import type { CLMCaseType } from "@/types/clm";
import { BadgeBase, type BadgeTone } from "./BadgeBase";

interface CaseTypeBadgeProps {
  type: CLMCaseType;
  className?: string;
}

/** Tone mapping is informational only — no dot, type badges are categorical. */
const config: Record<CLMCaseType, { tone: BadgeTone; label: string }> = {
  kyc:                 { tone: "primary", label: "KYC" },
  poa:                 { tone: "purple",  label: "POA" },
  liveness:            { tone: "teal",    label: "Liveness" },
  video_verification:  { tone: "indigo",  label: "Video" },
  withdrawal_review:   { tone: "orange",  label: "Withdrawal" },
  edd:                 { tone: "error",   label: "EDD" },
  source_of_wealth:    { tone: "warning", label: "SoW" },
  agreement_signing:   { tone: "neutral", label: "Agreement" },
  risk_recheck:        { tone: "rose",    label: "Risk" },
  manual_review:       { tone: "neutral", label: "Manual" },
};

export function CaseTypeBadge({ type, className }: CaseTypeBadgeProps) {
  const cfg = config[type];
  return (
    <BadgeBase tone={cfg.tone} dot={false} className={className}>
      {cfg.label}
    </BadgeBase>
  );
}
