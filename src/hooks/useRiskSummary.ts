"use client";

/**
 * useRiskSummary — single derivation of "what's the risk story for this case?"
 *
 * The Case Detail page shows risk in three places (sidebar score,
 * RiskReferencePanel, UnifiedRiskPanel) which used to each pluck data
 * from `caseItem.riskAssessment` / `caseItem.autoReview` / top-level
 * fields independently. That meant three slightly different fall-back
 * chains for the same number.
 *
 * This hook centralizes that fall-back chain so all three panels
 * agree, and memoizes the result so re-renders stay cheap.
 */

import { useMemo } from "react";
import type { CLMCase, CaseDetail, AMLStatus, RiskLevel } from "@/types/clm";

export interface RiskSummary {
  riskScore: number;
  riskLevel: RiskLevel;
  amlStatus: AMLStatus;
  /** Aggregated indicators count (high + critical). */
  highRiskIndicators: number;
  /** True if any critical-level indicator exists. */
  hasCriticalFlag: boolean;
  /** Auto-review verdict if available. */
  autoVerdict?: "auto_pass" | "manual_review" | "auto_reject";
}

export function useRiskSummary(
  caseItem: (CLMCase & Partial<CaseDetail>) | null | undefined
): RiskSummary {
  return useMemo(() => {
    if (!caseItem) {
      return {
        riskScore: 0,
        riskLevel: "low",
        amlStatus: "not_checked",
        highRiskIndicators: 0,
        hasCriticalFlag: false,
      };
    }

    const ra = caseItem.riskAssessment;
    const ar = caseItem.autoReview;

    const riskScore =
      ra?.riskScore ?? ar?.riskEngineScore ?? 0;

    const riskLevel: RiskLevel =
      ra?.riskLevel ?? caseItem.riskLevel ?? "medium";

    const amlStatus: AMLStatus =
      ra?.amlStatus ?? ar?.amlResult ?? caseItem.amlStatus ?? "not_checked";

    const indicators = ra?.indicators ?? [];
    const highRiskIndicators = indicators.filter(
      (i) => i.level === "high" || i.level === "critical"
    ).length;
    const hasCriticalFlag = indicators.some((i) => i.level === "critical");

    return {
      riskScore,
      riskLevel,
      amlStatus,
      highRiskIndicators,
      hasCriticalFlag,
      autoVerdict: ar?.overall,
    };
  }, [caseItem]);
}
