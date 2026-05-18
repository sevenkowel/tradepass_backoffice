/**
 * Funds v2 — channel master data (Wallet + Trading)
 *
 * Channels are the building blocks of every flow row. Each carries:
 *   - direction support (deposit / withdrawal / both)
 *   - currency matrix (per-currency eligibility & limits)
 *   - operational status (online / degraded / maintenance)
 *   - performance metrics (24h success / avg processing)
 *   - fee structure (linked to fees.ts)
 *   - eligibility matrix (7-dim, see policies.ts)
 *
 * Spec: §6.2, §7.4 of v2.1 PRD
 */

export type ChannelKind = "Wallet" | "Trading";
export type ChannelDirection = "Deposit" | "Withdrawal" | "Both";
export type ChannelStatus = "Online" | "Degraded" | "Maintenance" | "Offline";
export type ChannelCategory = "Crypto" | "Bank Wire" | "E-Wallet" | "Card" | "Local PSP" | "Internal";

export interface ChannelCurrency {
  /** ISO 4217 or "USDT" / "USDC" etc. */
  currency: string;
  enabled: boolean;
  /** Decimal places for amounts on this currency. */
  decimals: number;
  /** Min single transaction amount in this currency. */
  minAmount: number;
  /** Max single transaction amount in this currency. */
  maxAmount: number;
  /** Daily cap per client (this currency only). */
  dailyCap: number;
}

export interface Channel {
  id: string;
  kind: ChannelKind;
  category: ChannelCategory;
  name: string;
  /** Merchant operator behind this channel (PSP company). */
  merchantName: string;
  direction: ChannelDirection;
  status: ChannelStatus;
  /** Supported currencies — each independently configurable. */
  currencies: ChannelCurrency[];
  /** 24h success rate %. */
  successRate24h: number;
  /** Average minutes from request → completion. */
  avgProcessingMin: number;
  /** Today's volume in USD equivalent. */
  todayVolumeUsd: number;
  /** Cutoff schedule (UTC). Inside cutoff = unavailable for deposits/withdrawals. */
  cutoffSchedule?: string;
  /** Linked Fees & Pricing config id. */
  feeConfigId: string;
}

/* ── Wallet Channels (in/out of client wallet) ────────────────── */

export const walletChannels: Channel[] = [
  {
    id: "WC-USDT-TRC20",
    kind: "Wallet", category: "Crypto", direction: "Both",
    name: "USDT · TRC20", merchantName: "Tron Network",
    status: "Online",
    currencies: [
      { currency: "USDT", enabled: true, decimals: 6, minAmount: 10, maxAmount: 100_000, dailyCap: 100_000 },
    ],
    successRate24h: 99.1, avgProcessingMin: 4, todayVolumeUsd: 880_000,
    feeConfigId: "FEE-CRYPTO-001",
  },
  {
    id: "WC-USDT-ERC20",
    kind: "Wallet", category: "Crypto", direction: "Both",
    name: "USDT · ERC20", merchantName: "Ethereum Network",
    status: "Degraded",
    currencies: [
      { currency: "USDT", enabled: true, decimals: 6, minAmount: 10, maxAmount: 200_000, dailyCap: 200_000 },
    ],
    successRate24h: 92.0, avgProcessingMin: 18, todayVolumeUsd: 210_000,
    feeConfigId: "FEE-CRYPTO-002",
  },
  {
    id: "WC-BANK-WIRE",
    kind: "Wallet", category: "Bank Wire", direction: "Both",
    name: "Bank Wire", merchantName: "Wise Global Settlement",
    status: "Online",
    currencies: [
      { currency: "USD", enabled: true, decimals: 2, minAmount: 100, maxAmount: 1_000_000, dailyCap: 500_000 },
      { currency: "EUR", enabled: true, decimals: 2, minAmount: 100, maxAmount: 1_000_000, dailyCap: 500_000 },
      { currency: "GBP", enabled: true, decimals: 2, minAmount: 100, maxAmount: 1_000_000, dailyCap: 500_000 },
      { currency: "JPY", enabled: true, decimals: 0, minAmount: 10_000, maxAmount: 100_000_000, dailyCap: 50_000_000 },
    ],
    successRate24h: 86.3, avgProcessingMin: 35, todayVolumeUsd: 540_000,
    cutoffSchedule: "Mon-Fri 02:00-04:00 UTC (settlement window)",
    feeConfigId: "FEE-WIRE-001",
  },
  {
    id: "WC-DOKU-IDR",
    kind: "Wallet", category: "Local PSP", direction: "Both",
    name: "DOKU Wallet", merchantName: "DOKU - PT XYZ Indonesia",
    status: "Online",
    currencies: [
      { currency: "IDR", enabled: true, decimals: 0, minAmount: 50_000, maxAmount: 50_000_000, dailyCap: 200_000_000 },
    ],
    successRate24h: 98.4, avgProcessingMin: 2, todayVolumeUsd: 412_000,
    feeConfigId: "FEE-PSP-DOKU",
  },
  {
    id: "WC-VISA",
    kind: "Wallet", category: "Card", direction: "Deposit",
    name: "Visa Card", merchantName: "Adyen",
    status: "Online",
    currencies: [
      { currency: "USD", enabled: true, decimals: 2, minAmount: 50, maxAmount: 10_000, dailyCap: 20_000 },
      { currency: "EUR", enabled: true, decimals: 2, minAmount: 50, maxAmount: 10_000, dailyCap: 20_000 },
    ],
    successRate24h: 96.7, avgProcessingMin: 1, todayVolumeUsd: 180_000,
    feeConfigId: "FEE-CARD-001",
  },
  {
    id: "WC-SEPA",
    kind: "Wallet", category: "Bank Wire", direction: "Both",
    name: "SEPA", merchantName: "Citadele Bank EU",
    status: "Online",
    currencies: [
      { currency: "EUR", enabled: true, decimals: 2, minAmount: 50, maxAmount: 200_000, dailyCap: 200_000 },
    ],
    successRate24h: 99.5, avgProcessingMin: 30, todayVolumeUsd: 320_000,
    feeConfigId: "FEE-WIRE-002",
  },
  {
    id: "WC-PIX-BRL",
    kind: "Wallet", category: "Local PSP", direction: "Both",
    name: "PIX", merchantName: "EBANX Brazil",
    status: "Online",
    currencies: [
      { currency: "BRL", enabled: true, decimals: 2, minAmount: 50, maxAmount: 50_000, dailyCap: 100_000 },
    ],
    successRate24h: 98.9, avgProcessingMin: 1, todayVolumeUsd: 240_000,
    feeConfigId: "FEE-PSP-PIX",
  },
];

/* ── Trading Channels (in/out of MT account) ──────────────────── */

export const tradingChannels: Channel[] = [
  {
    id: "TC-INTERNAL",
    kind: "Trading", category: "Internal", direction: "Both",
    name: "Internal Transfer (Wallet ↔ MT)", merchantName: "Internal",
    status: "Online",
    currencies: [
      { currency: "USD",  enabled: true, decimals: 2, minAmount: 1, maxAmount: 500_000, dailyCap: 500_000 },
      { currency: "USDT", enabled: true, decimals: 2, minAmount: 1, maxAmount: 500_000, dailyCap: 500_000 },
    ],
    successRate24h: 99.9, avgProcessingMin: 0, todayVolumeUsd: 1_240_000,
    feeConfigId: "FEE-INTERNAL-001",
  },
  {
    id: "TC-BANK-DIRECT",
    kind: "Trading", category: "Bank Wire", direction: "Both",
    name: "Bank Wire (Direct to MT)", merchantName: "Wise Global Settlement",
    status: "Online",
    currencies: [
      { currency: "USD", enabled: true, decimals: 2, minAmount: 500, maxAmount: 1_000_000, dailyCap: 500_000 },
      { currency: "EUR", enabled: true, decimals: 2, minAmount: 500, maxAmount: 1_000_000, dailyCap: 500_000 },
    ],
    successRate24h: 88.0, avgProcessingMin: 40, todayVolumeUsd: 96_000,
    cutoffSchedule: "Mon-Fri 02:00-04:00 UTC",
    feeConfigId: "FEE-WIRE-DIRECT",
  },
  {
    id: "TC-USDT-DIRECT",
    kind: "Trading", category: "Crypto", direction: "Both",
    name: "USDT · TRC20 (Direct to MT)", merchantName: "Tron Network",
    status: "Online",
    currencies: [
      { currency: "USDT", enabled: true, decimals: 6, minAmount: 100, maxAmount: 50_000, dailyCap: 50_000 },
    ],
    successRate24h: 99.0, avgProcessingMin: 5, todayVolumeUsd: 84_000,
    feeConfigId: "FEE-CRYPTO-DIRECT",
  },
];

export const allChannels = [...walletChannels, ...tradingChannels];

export function channelById(id: string): Channel | undefined {
  return allChannels.find((c) => c.id === id);
}

/* ── Style maps ───────────────────────────────────────────────── */

export const CHANNEL_STATUS_FG: Record<ChannelStatus, { text: string; dot: string }> = {
  Online:      { text: "text-emerald-700", dot: "bg-emerald-500" },
  Degraded:    { text: "text-amber-700",   dot: "bg-amber-500"   },
  Maintenance: { text: "text-slate-600",   dot: "bg-slate-400"   },
  Offline:     { text: "text-red-700",     dot: "bg-red-500"     },
};

export const CHANNEL_CATEGORY_FG: Record<ChannelCategory, { text: string; dot: string }> = {
  Crypto:      { text: "text-orange-700", dot: "bg-orange-500" },
  "Bank Wire": { text: "text-blue-700",   dot: "bg-blue-500"   },
  "E-Wallet":  { text: "text-violet-700", dot: "bg-violet-500" },
  Card:        { text: "text-slate-700",  dot: "bg-slate-500"  },
  "Local PSP": { text: "text-emerald-700",dot: "bg-emerald-500"},
  Internal:    { text: "text-slate-500",  dot: "bg-slate-400"  },
};
