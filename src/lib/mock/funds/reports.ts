/**
 * Mock data — Funds Reports (in-module reporting surfaces)
 *
 * Six report tabs. Each carries a small set of summary stats + a
 * chart-friendly series. Spec §7.9.
 */

export interface ReportSeries {
  label: string;
  data: { x: string; y: number }[];
}

export const depositTrend: ReportSeries = {
  label: "Deposit volume (USD, daily)",
  data: [
    { x: "Mon", y: 1_980_000 }, { x: "Tue", y: 2_100_000 }, { x: "Wed", y: 1_840_000 },
    { x: "Thu", y: 2_550_000 }, { x: "Fri", y: 2_200_000 }, { x: "Sat", y: 1_510_000 },
    { x: "Sun", y: 2_300_000 },
  ],
};

export const withdrawalTrend: ReportSeries = {
  label: "Withdrawal volume (USD, daily)",
  data: [
    { x: "Mon", y: 1_240_000 }, { x: "Tue", y: 1_360_000 }, { x: "Wed", y: 1_540_000 },
    { x: "Thu", y: 1_180_000 }, { x: "Fri", y: 1_320_000 }, { x: "Sat", y: 980_000 },
    { x: "Sun", y: 1_100_000 },
  ],
};

export interface ChannelSuccess {
  channel: string;
  success: number;     // % success rate
  volume: number;
  avgMin: number;
}

export const channelSuccess: ChannelSuccess[] = [
  { channel: "DOKU",         success: 98.4, volume: 412_000, avgMin: 2  },
  { channel: "USDT TRC20",   success: 99.1, volume: 880_000, avgMin: 4  },
  { channel: "USDT ERC20",   success: 92.0, volume: 210_000, avgMin: 18 },
  { channel: "Bank Wire",    success: 86.3, volume: 540_000, avgMin: 35 },
  { channel: "Visa Card",    success: 96.7, volume: 180_000, avgMin: 1  },
];

export interface AmlStat {
  category: "Wallet screening" | "Sanctions" | "Velocity" | "Large amount";
  hits: number;
  filed: number;
}

export const amlStats: AmlStat[] = [
  { category: "Wallet screening", hits: 14, filed: 4 },
  { category: "Sanctions",        hits: 2,  filed: 2 },
  { category: "Velocity",         hits: 41, filed: 3 },
  { category: "Large amount",     hits: 22, filed: 5 },
];

export interface AutoWdRate {
  day: string;
  auto: number;       // count
  manual: number;
}

export const autoWdRate: AutoWdRate[] = [
  { day: "Mon", auto: 78,  manual: 22 },
  { day: "Tue", auto: 84,  manual: 16 },
  { day: "Wed", auto: 81,  manual: 19 },
  { day: "Thu", auto: 90,  manual: 10 },
  { day: "Fri", auto: 86,  manual: 14 },
  { day: "Sat", auto: 91,  manual: 9  },
  { day: "Sun", auto: 89,  manual: 11 },
];

export interface FailureRow {
  reason: string;
  count: number;
  pct: number;
}

export const failureAnalysis: FailureRow[] = [
  { reason: "Channel downtime (Bank Wire)", count: 12, pct: 32 },
  { reason: "AML hit (auto-block)",         count: 9,  pct: 24 },
  { reason: "Insufficient margin level",    count: 6,  pct: 16 },
  { reason: "KYC tier limit exceeded",      count: 5,  pct: 14 },
  { reason: "Cooldown active",              count: 3,  pct: 8  },
  { reason: "Other",                        count: 2,  pct: 6  },
];
