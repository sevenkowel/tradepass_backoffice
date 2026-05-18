/**
 * Mock data — Funds Risk & Compliance
 *
 * The transaction-level rule store (separate from Risk Center which
 * is client-level). Includes wallet screening, blacklists, velocity
 * rule history, AML reports.
 *
 * Spec: `docscc/产品文档/2026-05-17-funds-module-design.md` §7.7
 */

export interface FundsRiskRule {
  id: string;
  scope: "Deposit" | "Withdrawal" | "Both";
  name: string;
  enabled: boolean;
  trigger: string;       // human-readable when-clause
  action: "Block" | "Hold" | "Flag" | "Score+";
  hits24h: number;
  lastTriggered?: string;
}

export interface WalletScreening {
  address: string;
  network: string;
  client: string;
  score: number;
  severity: "Severe" | "High" | "Medium" | "Low" | "Clean";
  source: "Chainalysis" | "TRM" | "Internal";
  flaggedAt: string;
  context?: string;
}

export interface BlacklistEntry {
  type: "Address" | "IBAN" | "Card" | "Email" | "Country";
  value: string;
  reason: string;
  addedAt: string;
  addedBy: string;
}

export interface VelocityEvent {
  id: string;
  client: string;
  rule: string;
  triggeredAt: string;
  action: "Held" | "Approved (override)" | "Auto-rejected";
}

export interface AmlReport {
  id: string;
  client: string;
  amount: number;
  category: "SAR" | "STR" | "Internal Review";
  status: "Drafted" | "Filed" | "Closed";
  filedAt?: string;
  filedBy?: string;
}

const NOW = new Date("2026-05-17T14:30:00.000Z");
const isoMinusH = (h: number) => new Date(NOW.getTime() - h * 3600_000).toISOString();
const isoMinusD = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();

export const SEVERITY_FG = {
  Severe: { text: "text-red-700",     dot: "bg-red-500"     },
  High:   { text: "text-orange-700",  dot: "bg-orange-500"  },
  Medium: { text: "text-amber-700",   dot: "bg-amber-500"   },
  Low:    { text: "text-blue-700",    dot: "bg-blue-500"    },
  Clean:  { text: "text-emerald-700", dot: "bg-emerald-500" },
};

export const ACTION_FG: Record<FundsRiskRule["action"], { text: string; dot: string }> = {
  Block:    { text: "text-red-700",    dot: "bg-red-500"    },
  Hold:     { text: "text-amber-700",  dot: "bg-amber-500"  },
  Flag:     { text: "text-blue-700",   dot: "bg-blue-500"   },
  "Score+": { text: "text-slate-600",  dot: "bg-slate-400"  },
};

export const mockRiskRules: FundsRiskRule[] = [
  { id: "FR-001", scope: "Deposit",    name: "Wallet score ≥ 75 (Chainalysis Severe)", enabled: true,
    trigger: "AML.walletScore >= 75", action: "Block", hits24h: 3, lastTriggered: isoMinusH(1) },
  { id: "FR-002", scope: "Withdrawal", name: "Fast In-Out (deposit→WD within 2h)",     enabled: true,
    trigger: "lastDepositAt within 2h", action: "Hold",  hits24h: 5, lastTriggered: isoMinusH(2) },
  { id: "FR-003", scope: "Withdrawal", name: "High profit (PnL > $2k in 7d, Tier1/2)", enabled: true,
    trigger: "PnL7d > 2000 AND tier IN (Tier1, Tier2)", action: "Hold",  hits24h: 4, lastTriggered: isoMinusH(0.7) },
  { id: "FR-004", scope: "Both",       name: "Velocity 5+ txn / 24h",                  enabled: true,
    trigger: "txnCount24h >= 5", action: "Hold",  hits24h: 18, lastTriggered: isoMinusH(0.3) },
  { id: "FR-005", scope: "Withdrawal", name: "New device + amount > $5k",              enabled: true,
    trigger: "newDevice AND amount > 5000", action: "Flag", hits24h: 2 },
  { id: "FR-006", scope: "Deposit",    name: "Duplicate amount within 1h",             enabled: false,
    trigger: "sameAmount within 1h", action: "Flag", hits24h: 0 },
];

export const mockWalletScreening: WalletScreening[] = [
  { address: "0x9aa1...8821", network: "ERC20", client: "USR-90123", score: 87, severity: "Severe",
    source: "Chainalysis", flaggedAt: isoMinusH(1), context: "Source linked to known mixer" },
  { address: "TXfa98...4422", network: "TRC20", client: "USR-67890", score: 65, severity: "Medium",
    source: "Chainalysis", flaggedAt: isoMinusH(2), context: "Sibling address sanctioned" },
  { address: "TXza...4422",   network: "TRC20", client: "USR-23456", score: 12, severity: "Clean",
    source: "Chainalysis", flaggedAt: isoMinusH(4) },
  { address: "TXbc...5678",   network: "TRC20", client: "USR-12345", score: 8,  severity: "Clean",
    source: "TRM",         flaggedAt: isoMinusH(8) },
];

export const mockBlacklist: BlacklistEntry[] = [
  { type: "Address",  value: "0xabad...0000",            reason: "OFAC sanctioned address",     addedAt: isoMinusD(45), addedBy: "system" },
  { type: "IBAN",     value: "GB22 ROYL 0040 ...",       reason: "Card fraud (chargeback)",     addedAt: isoMinusD(20), addedBy: "ops_002" },
  { type: "Card",     value: "BIN 414738",               reason: "High dispute rate (issuer)",  addedAt: isoMinusD(60), addedBy: "ops_001" },
  { type: "Email",    value: "*@disposable-mail.net",    reason: "Throwaway domain",            addedAt: isoMinusD(90), addedBy: "ops_001" },
  { type: "Country",  value: "IR",                       reason: "OFAC sanctioned country",     addedAt: isoMinusD(180),addedBy: "system" },
];

export const mockVelocity: VelocityEvent[] = [
  { id: "VEL-001", client: "USR-67890", rule: "FR-002 Fast In-Out",     triggeredAt: isoMinusH(1.2), action: "Held" },
  { id: "VEL-002", client: "USR-01234", rule: "FR-004 Velocity 5+ /24h", triggeredAt: isoMinusH(0.5), action: "Held" },
  { id: "VEL-003", client: "USR-23456", rule: "FR-003 High profit",      triggeredAt: isoMinusH(3),   action: "Approved (override)" },
  { id: "VEL-004", client: "USR-34567", rule: "FR-001 Wallet severe",    triggeredAt: isoMinusH(1),   action: "Auto-rejected" },
];

export const mockAmlReports: AmlReport[] = [
  { id: "SAR-2026-014", client: "USR-90123", amount: 80_000, category: "SAR",            status: "Drafted" },
  { id: "STR-2026-051", client: "USR-34567", amount: 6_500,  category: "STR",            status: "Filed",  filedAt: isoMinusH(20), filedBy: "ops_001" },
  { id: "IR-2026-201",  client: "USR-67890", amount: 2_200,  category: "Internal Review", status: "Closed", filedAt: isoMinusH(72), filedBy: "ops_002" },
];
