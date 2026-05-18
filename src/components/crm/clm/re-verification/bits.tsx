"use client";

/**
 * Shared lookup tables and small primitives for the Re-Verification UI.
 * Keeping them in one file means the Requests / Templates / Rules /
 * History pages all render the same labels for the same vocabularies.
 */

import {
  IdCard,
  ScanFace,
  MapPin,
  Wallet,
  FileSignature,
  ClipboardList,
  Video,
  Mail,
  Inbox,
  Bell,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import type {
  NotificationChannel,
  ReVerificationStatus,
  ReVerificationTrigger,
  ReVerificationTriggerReason,
  ReVerificationType,
  RestrictionLevel,
  RestrictionScope,
} from "@/types/clm";

/* ------------------------------------------------------------------------- */
/* Verification type — icons, labels, and a colour family                    */
/* ------------------------------------------------------------------------- */

export const TYPE_META: Record<
  ReVerificationType,
  { label: string; icon: LucideIcon; tone: string; description: string }
> = {
  re_identity: {
    label: "Identity",
    icon: IdCard,
    tone: "bg-blue-50 text-blue-700",
    description: "Re-confirm a current government ID (expiry / mismatch).",
  },
  re_liveness: {
    label: "Liveness",
    icon: ScanFace,
    tone: "bg-violet-50 text-violet-700",
    description: "Selfie / face-match against the ID on file.",
  },
  re_address: {
    label: "Address",
    icon: MapPin,
    tone: "bg-emerald-50 text-emerald-700",
    description: "Recent proof-of-address (utility / bank statement).",
  },
  re_income: {
    label: "Source of Wealth",
    icon: Wallet,
    tone: "bg-amber-50 text-amber-700",
    description: "Income proof or source-of-wealth declaration.",
  },
  re_agreement: {
    label: "Agreement",
    icon: FileSignature,
    tone: "bg-slate-100 text-slate-700",
    description: "Re-sign updated client / risk / policy agreements.",
  },
  re_questionnaire: {
    label: "Questionnaire",
    icon: ClipboardList,
    tone: "bg-cyan-50 text-cyan-700",
    description: "Re-confirm suitability and trading experience.",
  },
  re_video: {
    label: "Video",
    icon: Video,
    tone: "bg-orange-50 text-orange-700",
    description: "Short scripted video confirmation by the user.",
  },
};

export const TYPE_ORDER: ReVerificationType[] = [
  "re_identity",
  "re_liveness",
  "re_address",
  "re_income",
  "re_agreement",
  "re_questionnaire",
  "re_video",
];

/* ------------------------------------------------------------------------- */
/* Status                                                                    */
/* ------------------------------------------------------------------------- */

export const STATUS_META: Record<
  ReVerificationStatus,
  { label: string; tone: string }
> = {
  draft:      { label: "Draft",       tone: "bg-slate-100 text-slate-600" },
  notified:   { label: "Notified",    tone: "bg-blue-100 text-blue-700" },
  submitted:  { label: "Submitted",   tone: "bg-amber-100 text-amber-700" },
  in_review:  { label: "In Review",   tone: "bg-violet-100 text-violet-700" },
  approved:   { label: "Approved",    tone: "bg-emerald-100 text-emerald-700" },
  rejected:   { label: "Rejected",    tone: "bg-red-100 text-red-700" },
  expired:    { label: "Expired",     tone: "bg-orange-100 text-orange-700" },
  cancelled:  { label: "Cancelled",   tone: "bg-slate-100 text-slate-500" },
};

export const ACTIVE_STATUSES: ReVerificationStatus[] = [
  "draft",
  "notified",
  "submitted",
  "in_review",
];

export const COMPLETED_STATUSES: ReVerificationStatus[] = [
  "approved",
  "rejected",
  "expired",
  "cancelled",
];

/* ------------------------------------------------------------------------- */
/* Trigger reason                                                            */
/* ------------------------------------------------------------------------- */

export const REASON_LABELS: Record<ReVerificationTriggerReason, string> = {
  document_expired: "Document expired",
  aml_hit: "AML hit",
  risk_escalation: "Risk escalation",
  device_risk: "Device risk",
  vpn_country_switch: "VPN country switch",
  large_withdrawal: "Large withdrawal",
  large_deposit: "Large deposit",
  agreement_update: "Agreement update",
  policy_update: "Policy update",
  long_inactivity: "Long inactivity",
  fraud_investigation: "Fraud investigation",
  manual_request: "Manual request",
};

export const REASON_ORDER: ReVerificationTriggerReason[] = [
  "document_expired",
  "aml_hit",
  "risk_escalation",
  "device_risk",
  "vpn_country_switch",
  "large_withdrawal",
  "large_deposit",
  "agreement_update",
  "policy_update",
  "long_inactivity",
  "fraud_investigation",
  "manual_request",
];

/* ------------------------------------------------------------------------- */
/* Restrictions                                                              */
/* ------------------------------------------------------------------------- */

export const RESTRICTION_LEVEL_META: Record<
  RestrictionLevel,
  { label: string; description: string; tone: string }
> = {
  notice: {
    label: "Notice",
    description: "Notify only — no functional limit. App stays fully usable.",
    tone: "bg-slate-100 text-slate-700",
  },
  restrict: {
    label: "Restrict",
    description: "Locks the chosen scopes (deposit / withdrawal / …) until verified.",
    tone: "bg-orange-100 text-orange-700",
  },
  suspend: {
    label: "Suspend",
    description: "Locks the entire account until verified.",
    tone: "bg-red-100 text-red-700",
  },
};

export const RESTRICTION_LEVEL_ORDER: RestrictionLevel[] = ["notice", "restrict", "suspend"];

export const RESTRICTION_SCOPE_LABELS: Record<RestrictionScope, string> = {
  login: "Login",
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  trading: "Trading",
  copy_trading: "Copy trading",
  promotions: "Promotions",
};

export const RESTRICTION_SCOPE_ORDER: RestrictionScope[] = [
  "login",
  "deposit",
  "withdrawal",
  "trading",
  "copy_trading",
  "promotions",
];

/* ------------------------------------------------------------------------- */
/* Notifications                                                             */
/* ------------------------------------------------------------------------- */

export const CHANNEL_META: Record<
  NotificationChannel,
  { label: string; icon: LucideIcon; tone: string }
> = {
  email:        { label: "Email",         icon: Mail,           tone: "bg-blue-50 text-blue-700" },
  inbox:        { label: "Inbox",         icon: Inbox,          tone: "bg-slate-100 text-slate-700" },
  push:         { label: "Push",          icon: Bell,           tone: "bg-violet-50 text-violet-700" },
  login_popup:  { label: "Login Popup",   icon: AlertTriangle,  tone: "bg-amber-50 text-amber-700" },
};

export const CHANNEL_ORDER: NotificationChannel[] = [
  "email",
  "inbox",
  "push",
  "login_popup",
];

/* ------------------------------------------------------------------------- */
/* Trigger source label                                                      */
/* ------------------------------------------------------------------------- */

export const TRIGGER_LABELS: Record<ReVerificationTrigger, string> = {
  manual: "Manual",
  automatic: "Automatic",
};

/* ------------------------------------------------------------------------- */
/* Small UI primitives                                                       */
/* ------------------------------------------------------------------------- */

export function StatusPill({ status }: { status: ReVerificationStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${m.tone}`}>
      {m.label}
    </span>
  );
}

export function TypePill({ type }: { type: ReVerificationType }) {
  const m = TYPE_META[type];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${m.tone}`}>
      <Icon className="w-3 h-3" />
      {m.label}
    </span>
  );
}

export function fmtRel(iso?: string): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const min = Math.round(abs / 60_000);
  const future = diff < 0;
  if (min < 1) return "just now";
  if (min < 60) return future ? `in ${min}m` : `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return future ? `in ${h}h` : `${h}h ago`;
  const d = Math.round(h / 24);
  return future ? `in ${d}d` : `${d}d ago`;
}

/** Effective-time label, e.g. "Immediate" / "Delayed 24h" / "Scheduled 2026-05-15". */
export function fmtEffective(eff: { kind: string; hours?: number; at?: string }): string {
  if (eff.kind === "immediate") return "Immediate";
  if (eff.kind === "delayed_hours") return `Delayed ${eff.hours}h`;
  if (eff.kind === "scheduled_iso" && eff.at) {
    return `Scheduled ${new Date(eff.at).toLocaleDateString()}`;
  }
  return eff.kind;
}
