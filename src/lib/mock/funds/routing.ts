/**
 * Mock data — Routing Rules
 *
 * Decision tree that picks a deposit/withdrawal channel based on
 * country × KYC tier × amount × risk. Each rule has a priority
 * (lower = evaluated first), match conditions, and a target channel.
 *
 * Spec: `docscc/产品文档/2026-05-17-funds-module-design.md` §7.4
 */

export type RuleKind = "Deposit" | "Withdrawal";

export interface RoutingCondition {
  field: "country" | "kyc_tier" | "amount" | "risk" | "currency";
  op: "in" | "eq" | "gt" | "lt" | "between";
  value: string;       // human-readable encoding ("US, GB, JP", "> $5000", "Tier2,Tier3")
}

export interface RoutingRule {
  id: string;
  kind: RuleKind;
  name: string;
  priority: number;
  enabled: boolean;
  conditions: RoutingCondition[];
  targetChannel: string;
  fallback?: boolean;
  lastEditedAt: string;
  lastEditedBy: string;
}

const NOW = new Date("2026-05-17T14:30:00.000Z");
const isoMinusD = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();

export const mockRoutingRules: RoutingRule[] = [
  {
    id: "RR-001", kind: "Deposit", name: "Indonesia → DOKU for retail", priority: 10, enabled: true,
    conditions: [
      { field: "country",  op: "eq", value: "ID" },
      { field: "amount",   op: "lt", value: "$1,000" },
    ],
    targetChannel: "DOKU Wallet",
    lastEditedAt: isoMinusD(3),  lastEditedBy: "ops_001",
  },
  {
    id: "RR-002", kind: "Deposit", name: "Crypto for Tier2+", priority: 20, enabled: true,
    conditions: [
      { field: "kyc_tier", op: "in", value: "Tier2, Tier3" },
      { field: "currency", op: "eq", value: "USDT" },
    ],
    targetChannel: "USDT TRC20",
    lastEditedAt: isoMinusD(7),  lastEditedBy: "ops_002",
  },
  {
    id: "RR-003", kind: "Deposit", name: "Large bank wire for Tier3", priority: 30, enabled: true,
    conditions: [
      { field: "kyc_tier", op: "eq", value: "Tier3" },
      { field: "amount",   op: "gt", value: "$5,000" },
    ],
    targetChannel: "Bank Wire",
    lastEditedAt: isoMinusD(14), lastEditedBy: "ops_001",
  },
  {
    id: "RR-004", kind: "Deposit", name: "Default — Visa Card",      priority: 999, enabled: true,
    conditions: [], targetChannel: "Visa Card", fallback: true,
    lastEditedAt: isoMinusD(30), lastEditedBy: "system",
  },

  {
    id: "RR-101", kind: "Withdrawal", name: "Crypto withdrawals → TRC20", priority: 10, enabled: true,
    conditions: [
      { field: "currency", op: "eq", value: "USDT" },
      { field: "amount",   op: "lt", value: "$10,000" },
    ],
    targetChannel: "USDT TRC20",
    lastEditedAt: isoMinusD(5),  lastEditedBy: "ops_002",
  },
  {
    id: "RR-102", kind: "Withdrawal", name: "Large USDT → ERC20",         priority: 20, enabled: true,
    conditions: [
      { field: "currency", op: "eq", value: "USDT" },
      { field: "amount",   op: "gt", value: "$10,000" },
    ],
    targetChannel: "USDT ERC20",
    lastEditedAt: isoMinusD(5),  lastEditedBy: "ops_002",
  },
  {
    id: "RR-103", kind: "Withdrawal", name: "High-risk → manual bank wire", priority: 30, enabled: true,
    conditions: [
      { field: "risk",     op: "in", value: "Critical, High" },
    ],
    targetChannel: "Bank Wire (manual)",
    lastEditedAt: isoMinusD(2),  lastEditedBy: "ops_001",
  },
  {
    id: "RR-104", kind: "Withdrawal", name: "Default — Bank Wire",          priority: 999, enabled: true,
    conditions: [], targetChannel: "Bank Wire", fallback: true,
    lastEditedAt: isoMinusD(30), lastEditedBy: "system",
  },
];

/** Mock router — given a trial transaction, pick the first matching rule. */
export interface TrialTxn {
  kind: RuleKind;
  country: string;
  kycTier: "Tier1" | "Tier2" | "Tier3";
  amount: number;
  currency: string;
  risk: "Critical" | "High" | "Medium" | "Low";
}

export function pickRoute(rules: RoutingRule[], txn: TrialTxn): RoutingRule | null {
  const candidates = rules
    .filter((r) => r.kind === txn.kind && r.enabled)
    .sort((a, b) => a.priority - b.priority);
  for (const r of candidates) {
    if (matches(r, txn)) return r;
  }
  return null;
}

function matches(rule: RoutingRule, txn: TrialTxn): boolean {
  if (rule.fallback) return true;
  for (const c of rule.conditions) {
    if (!matchOne(c, txn)) return false;
  }
  return true;
}

function matchOne(c: RoutingCondition, txn: TrialTxn): boolean {
  const valNum = parseFloat(c.value.replace(/[^\d.]/g, ""));
  const list   = c.value.split(",").map((s) => s.trim());
  switch (c.field) {
    case "country":  return c.op === "eq" ? txn.country === c.value : list.includes(txn.country);
    case "kyc_tier": return c.op === "eq" ? txn.kycTier === c.value : list.includes(txn.kycTier);
    case "currency": return c.op === "eq" ? txn.currency === c.value : list.includes(txn.currency);
    case "risk":     return c.op === "eq" ? txn.risk === c.value     : list.includes(txn.risk);
    case "amount":
      if (c.op === "gt") return txn.amount >  valNum;
      if (c.op === "lt") return txn.amount <  valNum;
      return false;
    default: return false;
  }
}
