"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Globe, Fingerprint, Monitor, Wifi, Users, Shield, Ban, AlertTriangle } from "lucide-react";
import type { CLMCase, CaseDetail, AutoReviewResult } from "@/types/clm";

interface RiskReferencePanelProps {
  caseItem: CLMCase & Partial<CaseDetail>;
}

// Country risk mapping (simplified)
const countryRiskMap: Record<string, { level: string; color: string }> = {
  AE: { level: "Low", color: "success" },
  SG: { level: "Low", color: "success" },
  GB: { level: "Low", color: "success" },
  US: { level: "Low", color: "success" },
  CN: { level: "Medium", color: "warning" },
  RU: { level: "High", color: "danger" },
  IR: { level: "High", color: "danger" },
  KP: { level: "High", color: "danger" },
  PK: { level: "Medium", color: "warning" },
  NG: { level: "Medium", color: "warning" },
  BR: { level: "Low", color: "success" },
  IN: { level: "Low", color: "success" },
  HK: { level: "Low", color: "success" },
};

function getCountryRisk(country?: string): { level: string; color: "success" | "warning" | "danger" | "neutral" } {
  if (!country) return { level: "Unknown", color: "neutral" };
  const found = countryRiskMap[country];
  if (found) return found as { level: string; color: "success" | "warning" | "danger" | "neutral" };
  return { level: "Medium", color: "warning" };
}

function getStatusColor(value: string | undefined): "success" | "warning" | "danger" | "neutral" {
  if (!value) return "neutral";
  const v = value.toLowerCase();
  if (["pass", "normal", "clean", "low", "auto_pass", "verified", "safe"].includes(v)) return "success";
  if (["hit", "suspicious", "high", "vpn", "proxy", "tor", "auto_reject", "rejected", "blacklisted"].includes(v)) return "danger";
  if (["medium", "warning", "pending", "manual_review", "review"].includes(v)) return "warning";
  return "neutral";
}

const colorMap = {
  success: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
  danger: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200" },
  neutral: { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400", border: "border-slate-200" },
};

export function RiskReferencePanel({ caseItem }: RiskReferencePanelProps) {
  const [expandedIp, setExpandedIp] = useState(false);

  const riskScore = caseItem.riskAssessment?.riskScore ?? caseItem.autoReview?.riskEngineScore ?? 0;
  const riskLevel = caseItem.riskAssessment?.riskLevel ?? "medium";
  const autoReview = caseItem.autoReview;

  // 1. Country
  const countryRisk = getCountryRisk(caseItem.country);

  // 2. Identity Duplicate (mock from relationship graph)
  const hasDuplicates = (caseItem.relationshipGraph?.length ?? 0) > 0;
  const dupCount = caseItem.relationshipGraph?.length ?? 0;
  const dupColor = hasDuplicates ? "danger" : "success";

  // 3. Device / IP
  const ipRisk = autoReview?.ipRisk ?? "normal";
  const deviceRisk = autoReview?.deviceRisk ?? "normal";
  const hasIpIssue = ipRisk !== "normal" || deviceRisk !== "normal";
  const ipColor = hasIpIssue ? "warning" : "success";

  // 4. IB Relationship
  const hasIb = !!caseItem.personalInfo?.ibId;
  const ibColor = hasIb ? "warning" : "success";

  // 5. AML
  const aml = autoReview?.amlResult ?? caseItem.riskAssessment?.amlStatus ?? "pending";
  const amlColor = getStatusColor(aml);

  // 6. Blacklist (mock - no direct field, infer from risk indicators)
  const isBlacklisted = caseItem.riskAssessment?.indicators?.some(i =>
    i.description.toLowerCase().includes("blacklist") || i.description.toLowerCase().includes("blocked")
  ) ?? false;
  const blacklistColor = isBlacklisted ? "danger" : "success";

  // Critical alerts
  const alerts = caseItem.riskAssessment?.indicators ?? [];

  const scoreColor = riskScore < 40 ? "success" : riskScore < 70 ? "warning" : riskScore < 85 ? "danger" : "danger";
  const scoreBg = colorMap[scoreColor].bg;
  const scoreText = colorMap[scoreColor].text;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
      {/* Overall Risk Score */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold", scoreBg, scoreText)}>
          {riskScore}
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Risk Score</p>
          <p className={cn("text-sm font-bold capitalize", scoreText)}>
            {riskLevel.replace(/_/g, " ")}
          </p>
        </div>
      </div>

      {/* Risk Factor List */}
      <div className="space-y-1.5">
        {/* 1. Country */}
        <RiskRow
          icon={<Globe size={13} />}
          label="Country"
          status={countryRisk.level}
          color={countryRisk.color}
          detail={caseItem.country}
        />

        {/* 2. Identity Duplicate */}
        <RiskRow
          icon={<Fingerprint size={13} />}
          label="Identity"
          status={hasDuplicates ? `${dupCount} duplicate(s)` : "Unique"}
          color={dupColor}
        />

        {/* 3. Device / IP — expandable */}
        <div>
          <button
            onClick={() => setExpandedIp(!expandedIp)}
            className={cn(
              "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors",
              colorMap[ipColor].bg
            )}
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Monitor size={13} className={colorMap[ipColor].text} />
                <Wifi size={13} className={colorMap[ipColor].text} />
              </div>
              <span className="font-medium text-slate-700">Device / IP</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={cn("font-semibold", colorMap[ipColor].text)}>
                {hasIpIssue ? "Issue" : "Normal"}
              </span>
              {expandedIp ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
            </div>
          </button>
          {expandedIp && (
            <div className="mt-1 mx-1 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5 text-xs">
              <IpDetailRow label="IP Address" value={caseItem.personalInfo?.registrationIp ?? "—"} />
              <IpDetailRow label="IP Risk" value={ipRisk} statusColor={getStatusColor(ipRisk)} />
              <IpDetailRow label="Device Risk" value={deviceRisk} statusColor={getStatusColor(deviceRisk)} />
              <IpDetailRow label="User Agent" value={caseItem.personalInfo?.registrationDevice ?? "—"} />
              {hasIpIssue && (
                <div className="pt-1 border-t border-slate-200">
                  <p className="text-[10px] text-amber-600 font-medium">
                    <AlertTriangle size={10} className="inline mr-1" />
                    {ipRisk !== "normal" ? `IP flagged as ${ipRisk}` : ""}
                    {deviceRisk !== "normal" ? `Device flagged as ${deviceRisk}` : ""}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. IB Relationship */}
        <RiskRow
          icon={<Users size={13} />}
          label="IB / Referral"
          status={hasIb ? caseItem.personalInfo?.ibName ?? "Has IB" : "None"}
          color={ibColor}
          detail={hasIb ? `ID: ${caseItem.personalInfo?.ibId}` : undefined}
        />

        {/* 5. AML */}
        <RiskRow
          icon={<Shield size={13} />}
          label="AML"
          status={aml.replace(/_/g, " ")}
          color={amlColor}
        />

        {/* 6. Blacklist */}
        <RiskRow
          icon={<Ban size={13} />}
          label="Blacklist"
          status={isBlacklisted ? "Hit" : "Clean"}
          color={blacklistColor}
        />
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <div className="pt-3 border-t border-slate-100 space-y-2">
          {alerts.slice(0, 2).map((alert, i) => {
            const alertColor = alert.level === "critical" ? "danger" : alert.level === "high" ? "danger" : "warning";
            return (
              <div key={i} className={cn("flex items-start gap-2 px-3 py-2 rounded-lg text-xs", colorMap[alertColor].bg, colorMap[alertColor].border, "border")}>
                <AlertTriangle size={13} className={cn("mt-0.5 flex-shrink-0", colorMap[alertColor].text)} />
                <div>
                  <p className={cn("font-semibold", colorMap[alertColor].text)}>
                    {alert.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

function RiskRow({
  icon,
  label,
  status,
  color,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  status: string;
  color: "success" | "warning" | "danger" | "neutral";
  detail?: string;
}) {
  const c = colorMap[color];
  return (
    <div className={cn("flex items-center justify-between px-2.5 py-2 rounded-lg", c.bg)}>
      <div className="flex items-center gap-2">
        <span className={cn(c.text)}>{icon}</span>
        <span className="text-xs font-medium text-slate-700">{label}</span>
      </div>
      <div className="text-right">
        <span className={cn("text-xs font-semibold", c.text)}>{status}</span>
        {detail && <p className="text-[10px] text-slate-400">{detail}</p>}
      </div>
    </div>
  );
}

function IpDetailRow({
  label,
  value,
  statusColor,
}: {
  label: string;
  value: string;
  statusColor?: "success" | "warning" | "danger" | "neutral";
}) {
  const vLower = value.toLowerCase();
  const computedColor = statusColor ?? getStatusColor(value);
  const c = colorMap[computedColor];

  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={cn("font-medium", c.text)}>{value}</span>
        <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
      </div>
    </div>
  );
}
