/**
 * Mock data — Fund Monitoring (the real-time risk dashboard)
 *
 * 5 monitoring categories, each surfaced as a counter widget plus an
 * alert stream. Spec: §7.5 of the Funds module PRD.
 */

export type MonitorCategory =
  | "large_deposits"
  | "large_withdrawals"
  | "velocity"
  | "aml"
  | "channel_failures"
  | "auto_failures";

export interface MonitorCounter {
  key: MonitorCategory;
  label: string;
  today: number;
  yesterday: number;
  trend: "up" | "down" | "flat";
  threshold: string;
}

export interface MonitorAlert {
  id: string;
  category: MonitorCategory;
  severity: "info" | "warn" | "error";
  message: string;
  at: string;            // ISO
  ref?: string;
  amount?: number;
  client?: string;
}

const NOW = new Date("2026-05-17T14:30:00.000Z");
const isoMinusMin = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString();

export const monitorCounters: MonitorCounter[] = [
  { key: "large_deposits",    label: "Large Deposits",    today: 12, yesterday: 9,  trend: "up",   threshold: "≥ $10,000" },
  { key: "large_withdrawals", label: "Large Withdrawals", today: 5,  yesterday: 8,  trend: "down", threshold: "≥ $10,000" },
  { key: "velocity",          label: "Velocity",          today: 18, yesterday: 14, trend: "up",   threshold: "≥ 5 / 24h / client" },
  { key: "aml",               label: "AML Hits",          today: 4,  yesterday: 2,  trend: "up",   threshold: "Score ≥ 75" },
  { key: "channel_failures",  label: "Channel Failures",  today: 22, yesterday: 18, trend: "up",   threshold: "Failure rate ≥ 10%" },
  { key: "auto_failures",     label: "Auto Decision Failures", today: 9, yesterday: 11, trend: "down", threshold: "Auto-Hold or Auto-Reject" },
];

export const monitorAlerts: MonitorAlert[] = [
  { id: "ALR-1", category: "aml",               severity: "error", message: "AML hit on incoming deposit DEP-00006",
    at: isoMinusMin(35),  ref: "DEP-00006", amount: 80_000, client: "USR-90123" },
  { id: "ALR-2", category: "large_withdrawals", severity: "warn",  message: "Withdrawal $50k pending review beyond SLA",
    at: isoMinusMin(60),  ref: "WTH-00001", amount: 50_000, client: "USR-12345" },
  { id: "ALR-3", category: "velocity",          severity: "warn",  message: "Velocity threshold breached for USR-67890",
    at: isoMinusMin(70),  client: "USR-67890" },
  { id: "ALR-4", category: "channel_failures",  severity: "warn",  message: "Bank Wire failure rate 14% over last hour",
    at: isoMinusMin(120) },
  { id: "ALR-5", category: "auto_failures",     severity: "info",  message: "Auto-withdrawal rejected 4 in last hour (cooldown not elapsed)",
    at: isoMinusMin(180) },
  { id: "ALR-6", category: "large_deposits",    severity: "info",  message: "Large deposit $80k USDT — Crypto AML screening passed",
    at: isoMinusMin(360), ref: "DEP-00006", amount: 80_000 },
  { id: "ALR-7", category: "aml",               severity: "error", message: "Wallet screening severe: source mixer (Chainalysis)",
    at: isoMinusMin(35),  ref: "DEP-00006", client: "USR-90123" },
  { id: "ALR-8", category: "channel_failures",  severity: "error", message: "USDT ERC20 confirmation lag · avg 18m (target 8m)",
    at: isoMinusMin(150) },
  { id: "ALR-9", category: "velocity",          severity: "info",  message: "Fast-In-Out trigger: deposit→withdrawal in 2h",
    at: isoMinusMin(70),  ref: "WTH-00006", client: "USR-67890" },
];

export const SEVERITY_FG = {
  info:  { text: "text-slate-600", dot: "bg-slate-400" },
  warn:  { text: "text-amber-700", dot: "bg-amber-500" },
  error: { text: "text-red-700",   dot: "bg-red-500"   },
};

export const TREND_FG: Record<MonitorCounter["trend"], { text: string; symbol: string }> = {
  up:   { text: "text-red-600",     symbol: "↑" },
  down: { text: "text-emerald-600", symbol: "↓" },
  flat: { text: "text-slate-500",   symbol: "→" },
};
