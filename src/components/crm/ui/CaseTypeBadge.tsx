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
  edd:                 { tone: "error",   label: "EDD" },
  source_of_wealth:    { tone: "warning", label: "SoW" },
  agreement_signing:   { tone: "neutral", label: "Agreement" },
  manual_review:       { tone: "neutral", label: "Manual" },
  re_verification:     { tone: "indigo",  label: "Re-Verify" },
};

export function CaseTypeBadge({ type, className }: CaseTypeBadgeProps) {
  const cfg = config[type];
  return (
    <BadgeBase tone={cfg.tone} dot={false} className={className}>
      {cfg.label}
    </BadgeBase>
  );
}
