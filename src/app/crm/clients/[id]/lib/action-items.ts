/**
 * Decision-style action items for the Client Detail page.
 *
 * Replaces the old "here are 8 KPI cards, you figure out what to do"
 * pattern with a top-of-page panel that *tells* the operator what
 * specifically needs their attention right now.
 *
 * Each item carries a severity (danger / warning / info), a one-line
 * description, and an optional href that drops the operator straight
 * onto the relevant tab.
 *
 * Derivation is intentionally simple — these are observable signals
 * the operator can act on from the data we already have. Add more rules
 * here as new signals get plumbed through (e.g. fund flow anomalies).
 */
import type { ClientDetailData } from "@/types/backoffice/client-detail";

export type ActionSeverity = "danger" | "warning" | "info";

export interface ActionItem {
  id: string;
  severity: ActionSeverity;
  title: string;
  /** Optional hint shown after the title (compact metadata). */
  meta?: string;
  /** Route or query suffix to jump to the relevant tab. */
  href?: string;
  /** Verb for the CTA button — defaults to a tab name when href is set. */
  cta?: string;
}

/** Derive the list of "things needing attention" for the given client. */
export function deriveActionItems(data: ClientDetailData): ActionItem[] {
  const items: ActionItem[] = [];
  const { user, cases, tickets, kycRiskIndicators, riskRelationships } = data;

  // 1. Frozen account — most severe operational state.
  if (user.status === "frozen") {
    items.push({
      id: "account-frozen",
      severity: "danger",
      title: "Account frozen",
      meta: "Withdrawals and trading blocked",
      href: "?tab=permissions",
      cta: "Review",
    });
  }

  // 2. KYC needs review.
  if (user.kycStatus === "pending") {
    const submittedDate = data.kycDocuments?.[0]?.expiryDate
      ? null
      : data.kycDocuments?.[0];
    const days = submittedDate
      ? Math.max(0, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000))
      : 0;
    items.push({
      id: "kyc-pending",
      severity: days > 5 ? "danger" : "warning",
      title: "KYC review pending",
      meta: days > 0 ? `${days} day${days === 1 ? "" : "s"}` : undefined,
      href: "?tab=kyc",
      cta: "Review",
    });
  } else if (user.kycStatus === "rejected") {
    items.push({
      id: "kyc-rejected",
      severity: "danger",
      title: "KYC rejected — needs follow-up",
      href: "?tab=kyc",
      cta: "Review",
    });
  }

  // 3. High-risk score.
  if (user.riskLevel === "critical") {
    items.push({
      id: "risk-critical",
      severity: "danger",
      title: "Critical risk score",
      meta: user.riskScore ? `${user.riskScore} / 100` : undefined,
      href: "?tab=risk",
      cta: "Investigate",
    });
  } else if (user.riskLevel === "high") {
    items.push({
      id: "risk-high",
      severity: "warning",
      title: "High risk score",
      meta: user.riskScore ? `${user.riskScore} / 100` : undefined,
      href: "?tab=risk",
      cta: "Investigate",
    });
  }

  // 4. KYC risk indicators flagged by the document review.
  const highKycRisks = kycRiskIndicators?.filter((k) => k.level === "high") ?? [];
  if (highKycRisks.length > 0) {
    items.push({
      id: "kyc-high-risk-indicators",
      severity: "warning",
      title: `${highKycRisks.length} high-risk KYC indicator${highKycRisks.length === 1 ? "" : "s"}`,
      meta: highKycRisks.slice(0, 1).map((k) => k.description).join(""),
      href: "?tab=kyc",
      cta: "Review",
    });
  }

  // 5. Open compliance cases.
  const openCases = cases.filter(
    (c) => c.status === "pending" || c.status === "in_review",
  );
  if (openCases.length > 0) {
    items.push({
      id: "open-cases",
      severity: openCases.some((c) => c.priority === "urgent") ? "danger" : "warning",
      title: `${openCases.length} open compliance case${openCases.length === 1 ? "" : "s"}`,
      href: "?tab=cases",
      cta: "Review",
    });
  }

  // 6. Open support tickets.
  const openTickets = tickets.filter(
    (t) => t.status === "open" || t.status === "in_progress",
  );
  if (openTickets.length > 0) {
    items.push({
      id: "open-tickets",
      severity: "info",
      title: `${openTickets.length} open ticket${openTickets.length === 1 ? "" : "s"}`,
      href: "?tab=tickets",
      cta: "View",
    });
  }

  // 7. Linked high-risk clients.
  const highRiskLinks = riskRelationships.length;
  if (highRiskLinks >= 3) {
    items.push({
      id: "many-relationships",
      severity: "warning",
      title: `Linked to ${highRiskLinks} other client${highRiskLinks === 1 ? "" : "s"}`,
      meta: "Possible ring activity",
      href: `/crm/clients/relationships?clientId=${user.id}`,
      cta: "View graph",
    });
  }

  return items;
}

/** Pick the worst severity in a set of items — used to colour the panel border. */
export function summariseSeverity(items: ActionItem[]): ActionSeverity | null {
  if (items.length === 0) return null;
  if (items.some((i) => i.severity === "danger")) return "danger";
  if (items.some((i) => i.severity === "warning")) return "warning";
  return "info";
}
