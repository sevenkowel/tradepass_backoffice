"use client";

import { cn } from "@/lib/utils";
import { Shield, AlertTriangle, CheckCircle, XCircle, Monitor, Wifi, Eye } from "lucide-react";
import type { AutoReviewResult } from "@/types/clm";

interface AutoReviewSectionProps {
  data: AutoReviewResult;
  className?: string;
}

export function AutoReviewSection({ data, className }: AutoReviewSectionProps) {
  const overallConfig = {
    auto_pass: { label: "Auto Passed", color: "text-emerald-700", bg: "bg-emerald-100", icon: CheckCircle },
    manual_review: { label: "Manual Review Required", color: "text-amber-700", bg: "bg-amber-100", icon: AlertTriangle },
    auto_reject: { label: "Auto Rejected", color: "text-red-700", bg: "bg-red-100", icon: XCircle },
  };

  const cfg = overallConfig[data.overall];
  const OverallIcon = cfg.icon;

  const checks = [
    { label: "OCR Score", value: `${Math.round(data.ocrScore * 100)}%`, passed: data.ocrPassed, icon: Eye },
    { label: "AML Result", value: data.amlResult, passed: data.amlResult === "pass", icon: Shield },
    { label: "Face Match", value: `${Math.round(data.faceMatchScore * 100)}%`, passed: data.faceMatchPassed, icon: Monitor },
    { label: "Device Risk", value: data.deviceRisk, passed: data.deviceRisk === "normal", icon: Monitor },
    { label: "IP Risk", value: data.ipRisk, passed: data.ipRisk === "normal", icon: Wifi },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-base font-semibold text-gray-900">Review Engine Results</h3>

      {/* Overall Verdict */}
      <div className={`flex items-center gap-3 p-4 rounded-xl ${cfg.bg}`}>
        <OverallIcon className={`w-6 h-6 ${cfg.color}`} />
        <div>
          <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
          <p className={`text-xs ${cfg.color} opacity-80`}>Risk Engine Score: {data.riskEngineScore}</p>
        </div>
      </div>

      {/* Individual Checks */}
      <div className="grid grid-cols-2 gap-2">
        {checks.map((check) => {
          const Icon = check.icon;
          return (
            <div key={check.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <Icon className="w-4 h-4 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 uppercase">{check.label}</p>
                <p className="text-xs font-medium text-gray-900">{check.value}</p>
              </div>
              {check.passed ? (
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
