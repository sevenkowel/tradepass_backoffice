"use client";

import { useState } from "react";
import {
  CheckCircle, XCircle, RefreshCw,
  MessageSquare, ExternalLink, Play, Pause,
  ArrowUpRight, Ban, ChevronDown,
  Shield, Monitor, Wifi, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CLMCase, RiskAssessment } from "@/types/clm";
import type { AutoReviewResult } from "@/types/clm/detail";

interface DecisionPanelProps {
  caseItem: CLMCase;
  riskAssessment?: RiskAssessment;
  autoReview?: AutoReviewResult;
  onApprove: (notes?: string) => void;
  onReject: (reason: string) => void;
  onResubmit: (reason: string) => void;
  onEscalate: (reason: string) => void;
  onAssign: () => void;
  onAccept?: () => void;
  onHold?: (reason: string) => void;
  onRejectBlacklist?: (reason: string) => void;
  onAddNote: () => void;
  onViewCustomer: () => void;
  className?: string;
}

const resubmissionReasons = [
  "Document Blurry",
  "Document Expired",
  "Name Mismatch",
  "Address Mismatch",
  "Face Mismatch",
  "Video Not Clear",
  "Missing Required Field",
  "Additional Documents Needed",
];

const holdReasons = [
  "Waiting external confirmation",
  "Waiting supervisor approval",
  "Waiting AML provider",
  "Pending additional documents",
];

type ConfirmAction = "approve" | "reject" | "resubmit" | "escalate" | "accept" | "hold" | "reject_blacklist" | null;

export function DecisionPanel({
  caseItem, riskAssessment, autoReview,
  onApprove, onReject, onResubmit, onEscalate, onAssign,
  onAccept, onHold, onRejectBlacklist,
  onAddNote, onViewCustomer, className,
}: DecisionPanelProps) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [reason, setReason] = useState("");
  const [showRejectMenu, setShowRejectMenu] = useState(false);

  const isFinal = ["approved", "rejected", "auto_approved", "auto_rejected", "cancelled", "expired"].includes(caseItem.status);
  const isPending = caseItem.status === "pending";
  const isReviewing = caseItem.status === "reviewing" || caseItem.status === "escalated" || caseItem.status === "resubmission";

  const handleConfirm = () => {
    if (!confirmAction) return;
    switch (confirmAction) {
      case "approve": onApprove(reason || undefined); break;
      case "reject": onReject(reason); break;
      case "resubmit": onResubmit(reason); break;
      case "escalate": onEscalate(reason); break;
      case "accept": onAccept?.(); break;
      case "hold": onHold?.(reason); break;
      case "reject_blacklist": onRejectBlacklist?.(reason); break;
    }
    setConfirmAction(null);
    setReason("");
    setShowRejectMenu(false);
  };

  // Risk summary for sidebar card
  const riskScore = riskAssessment?.riskScore ?? autoReview?.riskEngineScore;
  const riskLevel = riskAssessment?.riskLevel;
  const hasRiskFlags = (riskAssessment && (riskAssessment.amlStatus === "hit" || riskAssessment.riskScore >= 70))
    || (autoReview && (autoReview.amlResult === "hit" || autoReview.overall === "auto_reject" || autoReview.deviceRisk !== "normal" || autoReview.ipRisk !== "normal"));

  const renderConfirmForm = () => {
    if (!confirmAction) return null;

    let title = "";
    let needsReason = true;
    let placeholder = "";
    let showSelect = false;
    let selectOptions: string[] = [];

    switch (confirmAction) {
      case "approve": title = "Confirm Approval"; needsReason = false; placeholder = "Optional notes..."; break;
      case "reject": title = "Confirm Rejection"; placeholder = "Required: reason for rejection"; break;
      case "resubmit": title = "Request Resubmission"; showSelect = true; selectOptions = resubmissionReasons; break;
      case "escalate": title = "Escalate Case"; placeholder = "Required: reason for escalation"; break;
      case "accept": title = "Accept Task"; needsReason = false; placeholder = "Optional notes..."; break;
      case "hold": title = "Hold Case"; showSelect = true; selectOptions = holdReasons; break;
      case "reject_blacklist": title = "Reject & Blacklist"; placeholder = "Required: reason for permanent rejection"; break;
    }

    return (
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mt-3">
        <h4 className="text-xs font-semibold text-gray-900 mb-2">{title}</h4>
        {showSelect ? (
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select reason...</option>
            {selectOptions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        ) : (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        )}
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={needsReason && !reason}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", {
              "bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50": confirmAction === "approve" || confirmAction === "accept",
              "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50": confirmAction === "reject" || confirmAction === "reject_blacklist",
              "bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50": confirmAction === "resubmit" || confirmAction === "hold",
              "bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-50": confirmAction === "escalate",
            })}
          >
            Confirm
          </button>
          <button
            onClick={() => { setConfirmAction(null); setReason(""); setShowRejectMenu(false); }}
            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  if (isFinal) {
    return (
      <div className={cn("p-4 bg-gray-50 rounded-xl border border-gray-200 text-center", className)}>
        <p className="text-sm text-gray-500 font-medium">Case has been {caseItem.status.replace(/_/g, " ")}</p>
        <div className="flex justify-center gap-2 mt-3">
          <button onClick={onAddNote} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50">
            <MessageSquare className="w-3.5 h-3.5" /> Add Note
          </button>
          <button onClick={onViewCustomer} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50">
            <ExternalLink className="w-3.5 h-3.5" /> View Customer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* ── Risk Summary ── */}
      {(riskScore !== undefined || hasRiskFlags) && (
        <div className="space-y-3">
          {/* Risk Score */}
          {riskScore !== undefined && (
            <div className="flex items-center gap-3">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold", {
                "bg-emerald-100 text-emerald-700": (riskAssessment?.riskScore ?? 0) < 40,
                "bg-amber-100 text-amber-700": (riskAssessment?.riskScore ?? 0) >= 40 && (riskAssessment?.riskScore ?? 0) < 70,
                "bg-orange-100 text-orange-700": (riskAssessment?.riskScore ?? 0) >= 70 && (riskAssessment?.riskScore ?? 0) < 85,
                "bg-red-100 text-red-700": (riskAssessment?.riskScore ?? 0) >= 85,
              })}>
                {riskScore}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase">Risk Score</p>
                <p className={cn("text-sm font-semibold", {
                  "text-emerald-700": riskLevel === "low",
                  "text-amber-700": riskLevel === "medium",
                  "text-orange-700": riskLevel === "high",
                  "text-red-700": riskLevel === "critical",
                })}>
                  {riskLevel ? riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1) : "Unknown"}
                </p>
              </div>
            </div>
          )}

          {/* Key Risk Items */}
          <div className="space-y-1.5">
            {/* AML */}
            <RiskItem
              icon={<Shield className="w-3 h-3" />}
              label="AML"
              value={(riskAssessment?.amlStatus ?? autoReview?.amlResult) || "—"}
              status={
                (riskAssessment?.amlStatus === "hit" || autoReview?.amlResult === "hit") ? "bad" :
                (riskAssessment?.amlStatus === "pass" || autoReview?.amlResult === "pass") ? "good" : "neutral"
              }
            />
            {/* Device */}
            <RiskItem
              icon={<Monitor className="w-3 h-3" />}
              label="Device"
              value={(riskAssessment?.deviceRisk ?? autoReview?.deviceRisk) || "—"}
              status={
                (riskAssessment?.deviceRisk === "suspicious" || autoReview?.deviceRisk !== "normal") ? "bad" :
                (riskAssessment?.deviceRisk || autoReview?.deviceRisk) ? "good" : "neutral"
              }
            />
            {/* IP */}
            <RiskItem
              icon={<Wifi className="w-3 h-3" />}
              label="IP"
              value={(riskAssessment?.ipRisk ?? autoReview?.ipRisk) || "—"}
              status={
                (riskAssessment?.ipRisk !== "normal" || autoReview?.ipRisk !== "normal") ? "bad" :
                (riskAssessment?.ipRisk || autoReview?.ipRisk) ? "good" : "neutral"
              }
            />
            {/* Auto Review */}
            {autoReview && (
              <RiskItem
                icon={<AlertTriangle className="w-3 h-3" />}
                label="Engine"
                value={autoReview.overall.replace(/_/g, " ")}
                status={autoReview.overall === "auto_reject" ? "bad" : autoReview.overall === "manual_review" ? "warning" : "good"}
              />
            )}
          </div>

          {/* Alerts count */}
          {(riskAssessment?.indicators.length ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-red-600">
              <AlertTriangle className="w-3 h-3" />
              {riskAssessment!.indicators.length} risk alert{riskAssessment!.indicators.length > 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}

      <div className="h-px bg-gray-100" />

      {/* ── Actions ── */}
      <div className="space-y-2">
        {/* Pending: Accept */}
        {isPending && onAccept && (
          <button
            onClick={() => setConfirmAction("accept")}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Play className="w-4 h-4" /> Accept Task
          </button>
        )}

        {/* Reviewing: Primary actions */}
        {isReviewing && (
          <div className="space-y-2">
            <button
              onClick={() => setConfirmAction("approve")}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <CheckCircle className="w-4 h-4" /> Approve
            </button>

            <div className="flex gap-2">
              {/* Reject with dropdown */}
              <div className="relative flex-1">
                <button
                  onClick={() => setConfirmAction("reject")}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white border-2 border-red-300 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-50 hover:border-red-400 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                {onRejectBlacklist && (
                  <>
                    <button
                      onClick={() => setShowRejectMenu(!showRejectMenu)}
                      className="absolute right-0 top-0 h-full px-1.5 border-l border-red-200 rounded-r-xl hover:bg-red-50"
                    >
                      <ChevronDown className="w-3 h-3 text-red-400" />
                    </button>
                    {showRejectMenu && (
                      <div className="absolute bottom-full left-0 mb-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-10">
                        <button
                          onClick={() => { setConfirmAction("reject"); setShowRejectMenu(false); }}
                          className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          Reject only
                        </button>
                        <button
                          onClick={() => { setConfirmAction("reject_blacklist"); setShowRejectMenu(false); }}
                          className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                        >
                          <Ban className="w-3 h-3" /> Reject & Blacklist
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={() => setConfirmAction("resubmit")}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white border-2 border-amber-300 text-amber-700 rounded-xl text-sm font-semibold hover:bg-amber-50 hover:border-amber-400 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Resubmit
              </button>
            </div>
          </div>
        )}

        {/* Secondary actions */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
          {isReviewing && onHold && (
            <button onClick={() => setConfirmAction("hold")} className="text-[11px] text-gray-500 hover:text-gray-700 transition-colors">
              Hold
            </button>
          )}
          {isReviewing && (
            <button onClick={() => setConfirmAction("escalate")} className="text-[11px] text-gray-500 hover:text-gray-700 transition-colors">
              Escalate
            </button>
          )}
          {!caseItem.assigneeId && isPending && (
            <button onClick={onAssign} className="text-[11px] text-gray-500 hover:text-gray-700 transition-colors">
              Assign
            </button>
          )}
          <button onClick={onAddNote} className="text-[11px] text-gray-500 hover:text-gray-700 transition-colors">
            Note
          </button>
          <button onClick={onViewCustomer} className="text-[11px] text-gray-500 hover:text-blue-600 transition-colors">
            Customer
          </button>
        </div>
      </div>

      {/* Confirmation */}
      {renderConfirmForm()}
    </div>
  );
}

function RiskItem({ icon, label, value, status }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: "good" | "bad" | "warning" | "neutral";
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-gray-500">
        <span className={cn({
          "text-emerald-500": status === "good",
          "text-red-500": status === "bad",
          "text-amber-500": status === "warning",
          "text-gray-400": status === "neutral",
        })}>{icon}</span>
        {label}
      </span>
      <span className={cn("font-medium capitalize", {
        "text-emerald-700": status === "good",
        "text-red-700": status === "bad",
        "text-amber-700": status === "warning",
        "text-gray-600": status === "neutral",
      })}>
        {value}
      </span>
    </div>
  );
}
