/**
 * Funds v2 — shared entity mocks
 *
 * Single source of truth for clients / operators / MT accounts that every
 * v2 funds page references. The previous version duplicated these inside
 * each page's local mock; v2 hoists them so wallet ↔ trading ↔ transfer
 * flows all reference the same identities.
 *
 * Spec: docscc/产品文档/2026-05-17-funds-module-design-v2.1.md §17.3
 */

/* ── Operators (3 roles) ──────────────────────────────────────── */

export type OperatorRole = "finance" | "treasury" | "compliance" | "marketing" | "ib_admin";

export interface Operator {
  id: string;
  name: string;
  role: OperatorRole;
  team?: string;
}

export const operators: Operator[] = [
  { id: "fin_001",  name: "Anna Chen",       role: "finance",    team: "Finance L1" },
  { id: "fin_002",  name: "Brian Park",      role: "finance",    team: "Finance L2 (Senior)" },
  { id: "fin_003",  name: "Diana Wu",        role: "finance",    team: "Finance L1" },
  { id: "trs_001",  name: "Carlos Mendoza",  role: "treasury",   team: "Treasury Day Desk" },
  { id: "trs_002",  name: "Sergei Volkov",   role: "treasury",   team: "Treasury Night Desk" },
  { id: "cmp_001",  name: "Aisha Khan",      role: "compliance", team: "Compliance" },
  { id: "cmp_002",  name: "Mark Rivera",     role: "compliance", team: "AML Specialist" },
  { id: "mkt_001",  name: "Emma Wilson",     role: "marketing",  team: "Growth" },
  { id: "ib_admin", name: "IB Admin",        role: "ib_admin",   team: "IB Ops" },
];

export const CURRENT_OPERATOR_ID = "fin_001"; // Anna Chen, default acting user

/* ── KYC tier ─────────────────────────────────────────────────── */
export type KYCTier = "Tier1" | "Tier2" | "Tier3";

/* ── Registration sources ─────────────────────────────────────── */
export const registrationSources = [
  { id: "fb_camp_summer2026",  label: "FB · Summer 2026" },
  { id: "google_ads_id",       label: "Google Ads · Indonesia" },
  { id: "google_ads_my",       label: "Google Ads · Malaysia" },
  { id: "referral_link_x",     label: "Referral · Telegram X" },
  { id: "organic_seo",         label: "Organic SEO" },
  { id: "ib_001_landing",      label: "IB-001 Landing" },
];

/* ── IB tree (双轨 直系 / 全树) ───────────────────────────────── */
export interface IBNode {
  id: string;
  name: string;
  parent?: string;
  /** Direct clients on this node (excludes downstream IB clients). */
  directClients: string[];
}

export const ibTree: IBNode[] = [
  { id: "IB-001", name: "Global FX Partners",       directClients: ["USR-12345", "USR-67890"] },
  { id: "IB-A",   name: "Indonesia Sub-IB",     parent: "IB-001", directClients: ["USR-45678"] },
  { id: "IB-B",   name: "Vietnam Sub-IB",       parent: "IB-001", directClients: ["USR-67890"] },
  { id: "IB-002", name: "Asia Frontier IB",         directClients: ["USR-78901"] },
];

/* Resolve clients under an IB node — either direct only or the full subtree. */
export function ibClients(rootId: string, mode: "direct" | "full"): string[] {
  const root = ibTree.find((n) => n.id === rootId);
  if (!root) return [];
  if (mode === "direct") return root.directClients;
  const all = new Set(root.directClients);
  const stack: string[] = [root.id];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const n of ibTree) {
      if (n.parent === cur) {
        n.directClients.forEach((c) => all.add(c));
        stack.push(n.id);
      }
    }
  }
  return Array.from(all);
}

/* ── Clients (shared across all funds pages) ──────────────────── */

export interface ClientLite {
  id: string;
  name: string;
  kycTier: KYCTier;
  country: string;
  /** Risk class (combined behavioral + AML). */
  risk: "Critical" | "High" | "Medium" | "Low";
  /** Acquisition source (one of registrationSources.id). */
  registrationSource: string;
  /** IB referral chain (last entry = direct IB). Empty array = direct registration. */
  referralChain: string[];
  /** Role of this client. Most are `client`; some are `ib` themselves. */
  role: "client" | "ib" | "vip";
  /** Free-text tags (e.g. "scalper", "newbie", "high-volume"). */
  tags: string[];
}

export const clients: ClientLite[] = [
  { id: "USR-12345", name: "John Smith",     kycTier: "Tier2", country: "US", risk: "Medium",
    registrationSource: "ib_001_landing",    referralChain: ["IB-001"],         role: "client", tags: ["high-volume"] },
  { id: "USR-23456", name: "Sarah Johnson",  kycTier: "Tier2", country: "GB", risk: "Low",
    registrationSource: "google_ads_my",     referralChain: [],                  role: "client", tags: [] },
  { id: "USR-34567", name: "Michael Brown",  kycTier: "Tier1", country: "RU", risk: "Critical",
    registrationSource: "referral_link_x",   referralChain: [],                  role: "client", tags: ["high-risk"] },
  { id: "USR-45678", name: "Emma Wilson",    kycTier: "Tier2", country: "AU", risk: "Low",
    registrationSource: "fb_camp_summer2026",referralChain: ["IB-A", "IB-001"],  role: "client", tags: [] },
  { id: "USR-56789", name: "Carlos Mendez",  kycTier: "Tier2", country: "MX", risk: "High",
    registrationSource: "google_ads_id",     referralChain: [],                  role: "client", tags: ["scalper"] },
  { id: "USR-67890", name: "Vu Nguyen",      kycTier: "Tier2", country: "VN", risk: "Critical",
    registrationSource: "ib_001_landing",    referralChain: ["IB-B", "IB-001"],  role: "client", tags: ["high-risk"] },
  { id: "USR-78901", name: "Yuki Tanaka",    kycTier: "Tier3", country: "JP", risk: "Low",
    registrationSource: "organic_seo",       referralChain: ["IB-002"],          role: "vip",    tags: ["vip"] },
  { id: "USR-89012", name: "Lisa Chen",      kycTier: "Tier1", country: "TW", risk: "Medium",
    registrationSource: "google_ads_my",     referralChain: [],                  role: "client", tags: ["newbie"] },
  { id: "USR-90123", name: "Aisha Khan",     kycTier: "Tier2", country: "AE", risk: "Low",
    registrationSource: "organic_seo",       referralChain: [],                  role: "client", tags: [] },
  { id: "USR-01234", name: "Andre Silva",    kycTier: "Tier2", country: "BR", risk: "Medium",
    registrationSource: "google_ads_id",     referralChain: [],                  role: "client", tags: ["scalper"] },
];

export function clientById(id: string): ClientLite | undefined {
  return clients.find((c) => c.id === id);
}

/* ── MT trading accounts ──────────────────────────────────────── */

export type MTPlatform = "MT4" | "MT5" | "TradePass";
export type MTAccountType = "Standard" | "Cents" | "ECN" | "VIP";

export interface MTAccount {
  id: string;
  clientId: string;
  platform: MTPlatform;
  accountType: MTAccountType;
  currency: "USD" | "EUR" | "USDT";
  leverage: number;
  /** Live snapshot (mock — in real CRM comes from MT5 Manager API). */
  equity: number;
  balance: number;
  usedMargin: number;
  freeMargin: number;
  /** % — equity / used margin × 100. ∞ when no open positions. */
  marginLevel: number;
  openPositions: number;
  /** Float-PnL of the open positions (negative = client losing). */
  floatingPnL: number;
  status: "Active" | "Frozen" | "Closed";
}

export const mtAccounts: MTAccount[] = [
  { id: "MT5-100012", clientId: "USR-12345", platform: "MT5", accountType: "Standard", currency: "USD",
    leverage: 200, equity: 16200, balance: 16000, usedMargin: 4100, freeMargin: 12100, marginLevel: 395, openPositions: 3, floatingPnL: 200, status: "Active" },
  { id: "MT5-100013", clientId: "USR-23456", platform: "MT5", accountType: "Standard", currency: "USD",
    leverage: 100, equity: 1600, balance: 1600, usedMargin: 0, freeMargin: 1600, marginLevel: 0, openPositions: 0, floatingPnL: 0, status: "Active" },
  { id: "MT5-100014", clientId: "USR-34567", platform: "MT5", accountType: "Cents", currency: "USD",
    leverage: 500, equity: 7100, balance: 6800, usedMargin: 600, freeMargin: 6500, marginLevel: 1183, openPositions: 1, floatingPnL: 300, status: "Active" },
  { id: "MT5-100016", clientId: "USR-56789", platform: "MT5", accountType: "ECN", currency: "USD",
    leverage: 100, equity: 5800, balance: 5500, usedMargin: 4100, freeMargin: 1700, marginLevel: 141, openPositions: 4, floatingPnL: 300, status: "Active" },
  { id: "MT5-100017", clientId: "USR-67890", platform: "MT5", accountType: "Standard", currency: "USD",
    leverage: 200, equity: 2300, balance: 2300, usedMargin: 0, freeMargin: 2300, marginLevel: 0, openPositions: 0, floatingPnL: 0, status: "Active" },
  { id: "MT5-100018", clientId: "USR-01234", platform: "MT5", accountType: "Standard", currency: "USD",
    leverage: 100, equity: 3100, balance: 3000, usedMargin: 800, freeMargin: 2300, marginLevel: 388, openPositions: 2, floatingPnL: 100, status: "Active" },
  { id: "MT4-200001", clientId: "USR-78901", platform: "MT4", accountType: "VIP", currency: "USD",
    leverage: 100, equity: 50_000, balance: 50_000, usedMargin: 0, freeMargin: 50_000, marginLevel: 0, openPositions: 0, floatingPnL: 0, status: "Active" },
  { id: "TP-300001",  clientId: "USR-78901", platform: "TradePass", accountType: "VIP", currency: "USDT",
    leverage: 50,  equity: 25_000, balance: 25_000, usedMargin: 0, freeMargin: 25_000, marginLevel: 0, openPositions: 0, floatingPnL: 0, status: "Active" },
];

export function mtAccountsByClient(clientId: string): MTAccount[] {
  return mtAccounts.filter((a) => a.clientId === clientId);
}

export function mtAccountById(id: string): MTAccount | undefined {
  return mtAccounts.find((a) => a.id === id);
}

/* ── Shared style maps ────────────────────────────────────────── */

export const RISK_FG = {
  Critical: { text: "text-red-700",     dot: "bg-red-500"     },
  High:     { text: "text-orange-700",  dot: "bg-orange-500"  },
  Medium:   { text: "text-amber-700",   dot: "bg-amber-500"   },
  Low:      { text: "text-emerald-700", dot: "bg-emerald-500" },
} as const;

export const KYC_TIER_FG: Record<KYCTier, { text: string; dot: string }> = {
  Tier1: { text: "text-amber-700",  dot: "bg-amber-500"  },
  Tier2: { text: "text-blue-700",   dot: "bg-blue-500"   },
  Tier3: { text: "text-violet-700", dot: "bg-violet-500" },
};

/** Stable "now" so all mocks render reproducibly. */
export const NOW = new Date("2026-05-17T14:30:00.000Z");
export const isoMinusMin = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString();
export const isoMinusHour = (h: number) => new Date(NOW.getTime() - h * 3600_000).toISOString();
export const isoMinusDay = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();
