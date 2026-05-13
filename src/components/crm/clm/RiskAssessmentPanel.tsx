"use client";

import { cn } from "@/lib/utils";
import { Shield, Globe, Monitor, Wifi, Banknote, Users, AlertTriangle } from "lucide-react";
import type { RiskAssessment, RiskIndicator } from "@/types/clm";

interface RiskAssessmentPanelProps {
  assessment: RiskAssessment;
  className?: string;
}

export function RiskAssessmentPanel({ assessment, className }: RiskAssessmentPanelProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Risk Score Header */}
      <div className="flex items-center gap-4">
        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold", {
          "bg-emerald-100 text-emerald-700": assessment.riskScore < 40,
          "bg-amber-100 text-amber-700": assessment.riskScore >= 40 && assessment.riskScore < 70,
          "bg-orange-100 text-orange-700": assessment.riskScore >= 70 && assessment.riskScore < 85,
          "bg-red-100 text-red-700": assessment.riskScore >= 85,
        })}>
          {assessment.riskScore}
        </div>
        <div>
          <p className="text-sm text-gray-500">Risk Score</p>
          <p className={cn("text-lg font-semibold", {
            "text-emerald-700": assessment.riskLevel === "low",
            "text-amber-700": assessment.riskLevel === "medium",
            "text-orange-700": assessment.riskLevel === "high",
            "text-red-700": assessment.riskLevel === "critical",
          })}>
            {assessment.riskLevel.charAt(0).toUpperCase() + assessment.riskLevel.slice(1)}
          </p>
        </div>
      </div>

      {/* Risk Factors Grid */}
      <div className="grid grid-cols-2 gap-2">
        <RiskFactorItem
          icon={<Shield className="w-3.5 h-3.5" />}
          label="AML"
          value={assessment.amlStatus}
          status={assessment.amlStatus === "hit" ? "bad" : assessment.amlStatus === "pass" ? "good" : "neutral"}
        />
        <RiskFactorItem
          icon={<Globe className="w-3.5 h-3.5" />}
          label="Country"
          value={assessment.countryRisk}
          status={assessment.countryRisk === "high" ? "bad" : assessment.countryRisk === "low" ? "good" : "neutral"}
        />
        <RiskFactorItem
          icon={<Monitor className="w-3.5 h-3.5" />}
          label="Device"
          value={assessment.deviceRisk}
          status={assessment.deviceRisk === "suspicious" ? "bad" : "good"}
        />
        <RiskFactorItem
          icon={<Wifi className="w-3.5 h-3.5" />}
          label="IP"
          value={assessment.ipRisk}
          status={assessment.ipRisk !== "normal" ? "bad" : "good"}
        />
        <RiskFactorItem
          icon={<Banknote className="w-3.5 h-3.5" />}
          label="Funding"
          value={assessment.fundingRisk}
          status={assessment.fundingRisk === "high" ? "bad" : "good"}
        />
        <RiskFactorItem
          icon={<Users className="w-3.5 h-3.5" />}
          label="Multi-Account"
          value={assessment.multiAccountRisk === "none" ? "None" : assessment.multiAccountRisk.replace("_", " ")}
          status={assessment.multiAccountRisk !== "none" ? "bad" : "good"}
        />
      </div>

      {/* Risk Indicators */}
      {assessment.indicators.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Alerts</h4>
          {assessment.indicators.map((indicator, i) => (
            <RiskIndicatorItem key={i} indicator={indicator} />
          ))}
        </div>
      )}
    </div>
  );
}

function RiskFactorItem({
  icon,
  label,
  value,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: "good" | "bad" | "neutral";
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      <span className={cn("text-gray-400", {
        "text-emerald-500": status === "good",
        "text-red-500": status === "bad",
      })}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 uppercase">{label}</p>
        <p className={cn("text-xs font-medium capitalize", {
          "text-emerald-700": status === "good",
          "text-red-700": status === "bad",
          "text-gray-700": status === "neutral",
        })}>
          {value}
        </p>
      </div>
    </div>
  );
}

function RiskIndicatorItem({ indicator }: { indicator: RiskIndicator }) {
  return (
    <div className={cn("flex items-start gap-2 p-2 rounded-lg", {
      "bg-red-50": indicator.level === "critical" || indicator.level === "high",
      "bg-amber-50": indicator.level === "medium",
      "bg-gray-50": indicator.level === "low",
    })}>
      <AlertTriangle className={cn("w-4 h-4 mt-0.5 flex-shrink-0", {
        "text-red-500": indicator.level === "critical" || indicator.level === "high",
        "text-amber-500": indicator.level === "medium",
        "text-gray-400": indicator.level === "low",
      })} />
      <p className={cn("text-xs", {
        "text-red-700": indicator.level === "critical" || indicator.level === "high",
        "text-amber-700": indicator.level === "medium",
        "text-gray-600": indicator.level === "low",
      })}>
        {indicator.description}
      </p>
    </div>
  );
}
