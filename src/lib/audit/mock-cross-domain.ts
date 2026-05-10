/**
 * Mock cross-domain audit entries — fills in the audit timeline for the
 * domains that don't yet emit GlobalAuditLog from a real producer:
 * compliance, funds, trading, staff, risk, system.
 *
 * Once the real backend lands, this file is deleted and each domain
 * publishes through its own producer.
 */
import type { GlobalAuditLog } from "@/types/core";

const now = Date.now();
const m = (mins: number) => new Date(now - mins * 60_000).toISOString();

export const mockCrossDomainAudit: GlobalAuditLog[] = [
  // Compliance
  {
    id: "g-comp-001",
    auditId: "AUD-100001",
    domain: "compliance",
    severity: "critical",
    action: "blacklist_added",
    actionLabel: "Added to Blacklist",
    actor: { id: "staff-005", name: "Compliance Team", role: "Compliance Lead" },
    target: { kind: "customer", id: "user-008", name: "Suspicious User" },
    clientId: "user-008",
    description: "User flagged for AML — added to blacklist",
    reason: "AML watchlist match (OFAC SDN)",
    changes: [{ field: "blacklist", oldValue: false, newValue: true }],
    ipAddress: "192.168.1.110",
    device: "Chrome / macOS",
    createdAt: m(5),
  },
  {
    id: "g-comp-002",
    auditId: "AUD-100002",
    domain: "compliance",
    severity: "info",
    action: "agreement_signed",
    actionLabel: "Agreement Signed",
    actor: { id: "user-001", name: "Zhang Wei" },
    target: { kind: "agreement", id: "agr-2026-q2", name: "Client Agreement v2.1" },
    clientId: "user-001",
    changes: [],
    ipAddress: "103.21.244.15",
    createdAt: m(35),
  },

  // Funds
  {
    id: "g-fund-001",
    auditId: "AUD-100003",
    domain: "funds",
    severity: "warning",
    action: "withdrawal_held",
    actionLabel: "Withdrawal Held",
    actor: { id: "staff-003", name: "Senior Reviewer", role: "Risk Manager" },
    target: { kind: "withdrawal", id: "wd-2026-091", name: "WD-2026-091" },
    clientId: "user-001",
    description: "$8,000 withdrawal held pending source-of-funds review",
    reason: "Large amount + frequent withdrawal pattern",
    changes: [{ field: "status", oldValue: "pending", newValue: "manual_review" }],
    ipAddress: "192.168.1.130",
    createdAt: m(15),
  },
  {
    id: "g-fund-002",
    auditId: "AUD-100004",
    domain: "funds",
    severity: "info",
    action: "deposit_completed",
    actionLabel: "Deposit Completed",
    actor: { id: "system", name: "System", role: "System" },
    target: { kind: "transaction", id: "tx-15001", name: "$15,000 wire" },
    clientId: "user-001",
    changes: [{ field: "status", oldValue: "processing", newValue: "completed" }],
    createdAt: m(180),
  },

  // Trading
  {
    id: "g-trade-001",
    auditId: "AUD-100005",
    domain: "trading",
    severity: "warning",
    action: "leverage_changed",
    actionLabel: "Leverage Group Updated",
    actor: { id: "staff-002", name: "Admin B", role: "Trading Admin" },
    target: { kind: "trading_group", id: "Group-A", name: "Group-A" },
    description: "Group max leverage raised from 1:100 to 1:200",
    changes: [{ field: "max_leverage", oldValue: "1:100", newValue: "1:200" }],
    ipAddress: "192.168.1.120",
    device: "Chrome / Windows",
    createdAt: m(140),
  },

  // Risk
  {
    id: "g-risk-001",
    auditId: "AUD-100006",
    domain: "risk",
    severity: "critical",
    action: "rule_triggered_critical",
    actionLabel: "Critical Rule Triggered",
    actor: { id: "system", name: "Risk Engine", role: "System" },
    target: { kind: "rule", id: "rule-margin-50", name: "Margin Call < 50%" },
    clientId: "user-014",
    description: "Account margin level dropped below 50% threshold",
    changes: [{ field: "margin_level", oldValue: "62%", newValue: "48%" }],
    createdAt: m(8),
  },

  // Staff
  {
    id: "g-staff-001",
    auditId: "AUD-100007",
    domain: "staff",
    severity: "warning",
    action: "account_locked",
    actionLabel: "Staff Account Locked",
    actor: { id: "system", name: "System", role: "System" },
    target: { kind: "staff", id: "staff-099", name: "ex.user@example.com" },
    description: "5 consecutive failed login attempts",
    changes: [{ field: "status", oldValue: "active", newValue: "locked" }],
    ipAddress: "94.142.241.1",
    createdAt: m(420),
  },

  // System
  {
    id: "g-sys-001",
    auditId: "AUD-100008",
    domain: "system",
    severity: "info",
    action: "scheduler_run",
    actionLabel: "Scheduled Job Run",
    actor: { id: "system", name: "Scheduler", role: "System" },
    target: { kind: "job", id: "job-aml-recheck", name: "Daily AML Re-check" },
    description: "Scanned 12,481 active accounts; 3 new matches",
    changes: [],
    createdAt: m(720),
  },
];
