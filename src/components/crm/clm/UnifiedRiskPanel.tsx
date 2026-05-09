"use client";

import { cn } from "@/lib/utils";
import {
  Shield, Globe, Monitor, Wifi, Banknote, Users,
  AlertTriangle, CheckCircle, XCircle, Eye,
} from "lucide-react";
import type { RiskAssessment } from "@/types/clm";
import type { AutoReviewResult } from "@/types/clm/detail";
import type { RiskIndicator } from "@/types/clm";

interface UnifiedRiskPanelProps {
  riskAssessment?: RiskAssessment;
  autoReview?: AutoReviewResult;
  className?: string;
}

export function UnifiedRiskPanel({ riskAssessment, autoReview, className }: UnifiedRiskPanelProps) {
  if (!riskAssessment && !autoReview) return null;

  const hasRisk = !!riskAssessment;
  const hasAuto = !!autoReview;

  // Overall auto review config
  const autoConfig = hasAuto
    ? {
        auto_pass: { label: "Auto Passed", color: "text-emerald-700", bg: "bg-emerald-100", icon: CheckCircle },
        manual_review: { label: "Manual Review Required", color: "text-amber-700", bg: "bg-amber-100", icon: AlertTriangle },
        auto_reject: { label: "Auto Rejected", color: "text-red-700", bg: "bg-red-100", icon: XCircle },
      }[autoReview.overall]
    : null;

  const AutoIcon = autoConfig?.icon;

  return (
    <div className={cn("space-y-5", className)}>
      {/* Header: Risk Score + Auto Review Result side by side */}
      <div className="flex items-center gap-4 flex-wrap">
        {hasRisk && (
          <div className="flex items-center gap-3">
            <div
              className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold", {
                "bg-emerald-100 text-emerald-700": riskAssessment.riskScore < 40,
                "bg-amber-100 text-amber-700": riskAssessment.riskScore >= 40 && riskAssessment.riskScore < 70,
                "bg-orange-100 text-orange-700": riskAssessment.riskScore >= 70 && riskAssessment.riskScore < 85,
                "bg-red-100 text-red-700": riskAssessment.riskScore >= 85,
              })}
            >
              {riskAssessment.riskScore}
            </div>
            <div>
              <p className="text-xs text-gray-500">Risk Score</p>
              <p
                className={cn("text-base font-semibold", {
                  "text-emerald-700": riskAssessment.riskLevel === "low",
                  "text-amber-700": riskAssessment.riskLevel === "medium",
                  "text-orange-700": riskAssessment.riskLevel === "high",
                  "text-red-700": riskAssessment.riskLevel === "critical",
                })}
              >
                {riskAssessment.riskLevel.charAt(0).toUpperCase() + riskAssessment.riskLevel.slice(1)}
              </p>
            </div>
          </div>
        )}

        {hasAuto && autoConfig && AutoIcon && (
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${autoConfig.bg}`}>
            <AutoIcon className={`w-5 h-5 ${autoConfig.color}`} />
            <div>
              <p className={`text-sm font-semibold ${autoConfig.color}`}>{autoConfig.label}</p>
              <p className={`text-xs ${autoConfig.color} opacity-80`}>Engine Score: {autoReview.riskEngineScore}</p>
            </div>
          </div>
        )}
      </div>

      {/* Unified Checks Grid — deduplicated */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {/* AML — merged from both sources */}
        <CheckItem
          icon={<Shield className="w-3.5 h-3.5" />}
          label="AML"
          value={hasRisk ? riskAssessment.amlStatus : hasAuto ? autoReview.amlResult : "—"}
          status={
            (hasRisk && riskAssessment.amlStatus === "hit") || (hasAuto && autoReview.amlResult === "hit")
              ? "bad"
              : (hasRisk && riskAssessment.amlStatus === "pass") || (hasAuto && autoReview.amlResult === "pass")
                ? "good"
                : "neutral"
          }
          subValue={hasAuto ? `Engine: ${autoReview.amlResult}` : undefined}
        />

        {/* Country Risk — RiskAssessment only */}
        {hasRisk && (
          <CheckItem
            icon={<Globe className="w-3.5 h-3.5" />}
            label="Country"
            value={riskAssessment.countryRisk}
            status={riskAssessment.countryRisk === "high" ? "bad" : riskAssessment.countryRisk === "low" ? "good" : "neutral"}
          />
        )}

        {/* Device — merged */}
        <CheckItem
          icon={<Monitor className="w-3.5 h-3.5" />}
          label="Device"
          value={hasRisk ? riskAssessment.deviceRisk : hasAuto ? autoReview.deviceRisk : "—"}
          status={
            (hasRisk && riskAssessment.deviceRisk === "suspicious") || (hasAuto && autoReview.deviceRisk !== "normal")
              ? "bad"
              : "good"
          }
          subValue={hasAuto && hasRisk ? `Engine: ${autoReview.deviceRisk}` : undefined}
        />

        {/* IP — merged */}
        <CheckItem
          icon={<Wifi className="w-3.5 h-3.5" />}
          label="IP"
          value={hasRisk ? riskAssessment.ipRisk : hasAuto ? autoReview.ipRisk : "—"}
          status={
            (hasRisk && riskAssessment.ipRisk !== "normal") || (hasAuto && autoReview.ipRisk !== "normal")
              ? "bad"
              : "good"
          }
          subValue={hasAuto && hasRisk ? `Engine: ${autoReview.ipRisk}` : undefined}
        />

        {/* Funding — RiskAssessment only */}
        {hasRisk && (
          <CheckItem
            icon={<Banknote className="w-3.5 h-3.5" />}
            label="Funding"
            value={riskAssessment.fundingRisk}
            status={riskAssessment.fundingRisk === "high" ? "bad" : "good"}
          />
        )}

        {/* Multi-Account — RiskAssessment only */}
        {hasRisk && (
          <CheckItem
            icon={<Users className="w-3.5 h-3.5" />}
            label="Multi-Account"
            value={riskAssessment.multiAccountRisk === "none" ? "None" : riskAssessment.multiAccountRisk.replace("_", " ")}
            status={riskAssessment.multiAccountRisk !== "none" ? "bad" : "good"}
          />
        )}

        {/* OCR — AutoReview only */}
        {hasAuto && (
          <CheckItem
            icon={<Eye className="w-3.5 h-3.5" />}
            label="OCR"
            value={`${Math.round(autoReview.ocrScore * 100)}%`}
            status={autoReview.ocrPassed ? "good" : "bad"}
            passed={autoReview.ocrPassed}
          />
        )}

        {/* Face Match — AutoReview only */}
        {hasAuto && (
          <CheckItem
            icon={<Users className="w-3.5 h-3.5" />}
            label="Face Match"
            value={`${Math.round(autoReview.faceMatchScore * 100)}%`}
            status={autoReview.faceMatchPassed ? "good" : "bad"}
            passed={autoReview.faceMatchPassed}
          />
        )}
      </div>

      {/* Risk Indicators / Alerts */}
      {hasRisk && riskAssessment.indicators.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Risk Alerts</h4>
          {riskAssessment.indicators.map((indicator, i) => (
            <RiskIndicatorItem key={i} indicator={indicator} />
          ))}
        </div>
      )}
    </div>
  );
}

function CheckItem({
  icon,
  label,
  value,
  status,
  subValue,
  passed,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: "good" | "bad" | "neutral";
  subValue?: string;
  passed?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
      <span
        className={cn("flex-shrink-0", {
          "text-emerald-500": status === "good",
          "text-red-500": status === "bad",
          "text-gray-400": status === "neutral",
        })}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 uppercase">{label}</p>
        <div className="flex items-center gap-1.5">
          <p
            className={cn("text-xs font-medium capitalize", {
              "text-emerald-700": status === "good",
              "text-red-700": status === "bad",
              "text-gray-700": status === "neutral",
            })}
          >
            {value}
          </p>
          {passed !== undefined && (
            passed ? (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            )
          )}
        </div>
        {subValue && <p className="text-[10px] text-gray-400">{subValue}</p>}
      </div>
    </div>
  );
}

function RiskIndicatorItem({ indicator }: { indicator: RiskIndicator }) {
  return (
    <div
      className={cn("flex items-start gap-2 p-2.5 rounded-xl", {
        "bg-red-50": indicator.level === "critical" || indicator.level === "high",
        "bg-amber-50": indicator.level === "medium",
        "bg-gray-50": indicator.level === "low",
      })}
    >
      <AlertTriangle
        className={cn("w-4 h-4 mt-0.5 flex-shrink-0", {
          "text-red-500": indicator.level === "critical" || indicator.level === "high",
          "text-amber-500": indicator.level === "medium",
          "text-gray-400": indicator.level === "low",
        })}
      />
      <p
        className={cn("text-xs", {
          "text-red-700": indicator.level === "critical" || indicator.level === "high",
          "text-amber-700": indicator.level === "medium",
          "text-gray-600": indicator.level === "low",
        })}
      >
        {indicator.description}
      </p>
    </div>
  );
}
