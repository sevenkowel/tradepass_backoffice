/**
 * Mock data — Wallets (platform-level)
 *
 * Powers `/crm/funds/wallets`. Each client carries N wallets
 * (Real / Bonus / Credit / Reward), each with its own balance,
 * frozen sub-balance, currency, and risk state. The page renders
 * the matrix so ops can find frozen / zero-balance / anomalous
 * wallets fast.
 *
 * Spec: `docscc/产品文档/2026-05-17-funds-module-design.md` §6.4
 */

export type WalletKind = "Real" | "Bonus" | "Credit" | "Reward";
export type WalletStatus = "Active" | "Frozen" | "Closed";

export interface ClientWallets {
  userId: string;
  userName: string;
  kycTier: "Tier1" | "Tier2" | "Tier3";
  country: string;
  risk: "Critical" | "High" | "Medium" | "Low";
  wallets: {
    kind: WalletKind;
    balance: number;
    frozen: number;
    currency: string;
    status: WalletStatus;
    /** Free-text reason, only populated when status !== "Active" */
    statusReason?: string;
    /** ISO of the last txn affecting this wallet. */
    lastActivity?: string;
  }[];
}

export const WALLET_KIND_FG: Record<WalletKind, { text: string; dot: string }> = {
  Real:   { text: "text-emerald-700", dot: "bg-emerald-500" },
  Bonus:  { text: "text-violet-700",  dot: "bg-violet-500"  },
  Credit: { text: "text-blue-700",    dot: "bg-blue-500"    },
  Reward: { text: "text-amber-700",   dot: "bg-amber-500"   },
};

export const WALLET_STATUS_FG: Record<WalletStatus, { text: string; dot: string }> = {
  Active: { text: "text-emerald-700", dot: "bg-emerald-500" },
  Frozen: { text: "text-red-700",     dot: "bg-red-500"     },
  Closed: { text: "text-slate-500",   dot: "bg-slate-400"   },
};

export const RISK_FG = {
  Critical: { text: "text-red-700",     dot: "bg-red-500"     },
  High:     { text: "text-orange-700",  dot: "bg-orange-500"  },
  Medium:   { text: "text-amber-700",   dot: "bg-amber-500"   },
  Low:      { text: "text-emerald-700", dot: "bg-emerald-500" },
};

const NOW = new Date("2026-05-17T14:30:00.000Z");
function isoMinusH(h: number): string {
  return new Date(NOW.getTime() - h * 3_600_000).toISOString();
}

export const mockWallets: ClientWallets[] = [
  {
    userId: "USR-12345", userName: "John Smith",
    kycTier: "Tier2", country: "US", risk: "Medium",
    wallets: [
      { kind: "Real",   balance: 15_800, frozen: 5_000, currency: "USD", status: "Active", lastActivity: isoMinusH(0.5),
        statusReason: "Pending withdrawal lock $5,000" },
      { kind: "Bonus",  balance: 300,    frozen: 0,     currency: "USD", status: "Active", lastActivity: isoMinusH(12) },
      { kind: "Credit", balance: 0,      frozen: 0,     currency: "USD", status: "Closed" },
      { kind: "Reward", balance: 75,     frozen: 0,     currency: "USD", status: "Active", lastActivity: isoMinusH(72) },
    ],
  },
  {
    userId: "USR-23456", userName: "Sarah Johnson",
    kycTier: "Tier2", country: "GB", risk: "Low",
    wallets: [
      { kind: "Real",  balance: 2_400, frozen: 0, currency: "USD", status: "Active", lastActivity: isoMinusH(0.2) },
      { kind: "Bonus", balance: 50,    frozen: 0, currency: "USD", status: "Active" },
    ],
  },
  {
    userId: "USR-34567", userName: "Michael Brown",
    kycTier: "Tier1", country: "RU", risk: "Critical",
    wallets: [
      { kind: "Real", balance: 7_000, frozen: 7_000, currency: "USD", status: "Frozen",
        statusReason: "AML hit on related withdrawal WTH-00003", lastActivity: isoMinusH(2.5) },
    ],
  },
  {
    userId: "USR-45678", userName: "Emma Wilson",
    kycTier: "Tier2", country: "AU", risk: "Low",
    wallets: [
      { kind: "Real",  balance: 3_500, frozen: 1_200, currency: "USD", status: "Active",
        statusReason: "Withdrawal processing $1,200", lastActivity: isoMinusH(1.5) },
      { kind: "Bonus", balance: 0,     frozen: 0,     currency: "USD", status: "Closed" },
    ],
  },
  {
    userId: "USR-56789", userName: "Carlos Mendez",
    kycTier: "Tier2", country: "MX", risk: "High",
    wallets: [
      { kind: "Real",  balance: 5_000, frozen: 4_900, currency: "USD", status: "Active",
        statusReason: "Pending withdrawal $4,900", lastActivity: isoMinusH(0.4) },
      { kind: "Bonus", balance: 200,   frozen: 0,     currency: "USD", status: "Active" },
    ],
  },
  {
    userId: "USR-67890", userName: "Vu Nguyen",
    kycTier: "Tier2", country: "VN", risk: "Critical",
    wallets: [
      { kind: "Real", balance: 2_300, frozen: 2_200, currency: "USD", status: "Frozen",
        statusReason: "Fast-In-Out trigger · manual review pending", lastActivity: isoMinusH(1.2) },
    ],
  },
  {
    userId: "USR-78901", userName: "Yuki Tanaka",
    kycTier: "Tier3", country: "JP", risk: "Low",
    wallets: [
      { kind: "Real",   balance: 12_000, frozen: 0,    currency: "USD", status: "Active", lastActivity: isoMinusH(24) },
      { kind: "Reward", balance: 250,    frozen: 0,    currency: "USD", status: "Active" },
    ],
  },
  {
    userId: "USR-89012", userName: "Lisa Chen",
    kycTier: "Tier1", country: "TW", risk: "Medium",
    wallets: [
      { kind: "Real",  balance: 700, frozen: 0, currency: "USD", status: "Active" },
      { kind: "Bonus", balance: 30,  frozen: 0, currency: "USD", status: "Active" },
    ],
  },
  {
    userId: "USR-90123", userName: "Aisha Khan",
    kycTier: "Tier2", country: "AE", risk: "Low",
    wallets: [
      { kind: "Real",  balance: 0,   frozen: 0, currency: "USD", status: "Active" },
      { kind: "Bonus", balance: 320, frozen: 0, currency: "USD", status: "Active", lastActivity: isoMinusH(2) },
    ],
  },
  {
    userId: "USR-01234", userName: "Andre Silva",
    kycTier: "Tier2", country: "BR", risk: "Medium",
    wallets: [
      { kind: "Real",  balance: 3_100, frozen: 3_000, currency: "USD", status: "Active",
        statusReason: "Cooldown hold $3,000", lastActivity: isoMinusH(0.3) },
      { kind: "Credit", balance: 500, frozen: 0, currency: "USD", status: "Active" },
    ],
  },
];

export function walletAggregates(rows: ClientWallets[]) {
  let totalReal = 0, totalFrozen = 0, totalBonus = 0, zeroBalanceClients = 0;
  for (const c of rows) {
    let clientTotal = 0;
    for (const w of c.wallets) {
      if (w.kind === "Real")  { totalReal  += w.balance; }
      if (w.kind === "Bonus") { totalBonus += w.balance; }
      totalFrozen += w.frozen;
      clientTotal += w.balance;
    }
    if (clientTotal === 0) zeroBalanceClients += 1;
  }
  return { totalReal, totalFrozen, totalBonus, zeroBalanceClients };
}
