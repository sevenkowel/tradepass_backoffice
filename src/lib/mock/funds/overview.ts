/**
 * Mock data — Funds Overview (Operating Cockpit)
 *
 * Feeds the `/crm/funds` dashboard. Five surfaces:
 *
 *   1. AutomationHealth   — Auto Deposit / Auto Withdrawal / Channel
 *                           health summary cards
 *   2. TodayFlow          — Today's deposit / withdrawal / net / pending
 *                           / failed KPI strip
 *   3. ChannelStatus      — Per-channel live status with 24h success rate
 *   4. RiskFeed           — Last 24h alerts (timeline format)
 *   5. SevenDayTrend      — 7-day deposit-vs-withdrawal line chart series
 *
 * See `docscc/产品文档/2026-05-17-funds-module-design.md` §6.1 for the
 * layout that consumes this data.
 */

export interface AutomationStat {
  key: "auto_deposit" | "auto_withdrawal" | "channel_health";
  label: string;
  /** Headline value, e.g. "234 / 240" or "5 / 6 online". */
  primary: string;
  /** Sub-line, e.g. "97.5% success · 3m12s avg". */
  secondary: string;
  /** Health derived from the underlying numbers. */
  status: "healthy" | "warning" | "critical";
  /** Where the "→ configure" link points (sidebar route). */
  configHref: string;
}

export interface FlowStat {
  key: string;
  label: string;
  value: string;
  delta?: { label: string; tone: "up" | "down" | "neutral" };
}

export interface ChannelStatus {
  name: string;
  type: "Crypto" | "Bank" | "E-Wallet" | "Card";
  status: "NORMAL" | "WARNING" | "DELAYED" | "MAINTENANCE" | "OFFLINE";
  successRate24h: number;        // %
  avgProcessingMin: number;
  todayVolume: number;
}

export interface RiskEvent {
  id: string;
  at: string;                    // ISO
  severity: "info" | "warn" | "error";
  category: "Large WD" | "Large DP" | "AML" | "Velocity" | "Channel" | "Auto Failure";
  text: string;
  /** Optional deep-link to the source record (e.g. WTH-00003). */
  ref?: string;
}

export interface FlowPoint {
  day: string;                   // "Mon" / "Tue" …
  deposit: number;
  withdrawal: number;
}

/* ── Fixtures ──────────────────────────────────────────────────── */

const NOW = new Date("2026-05-17T14:30:00.000Z");
function isoMinusMin(min: number): string {
  return new Date(NOW.getTime() - min * 60_000).toISOString();
}

export const automationStats: AutomationStat[] = [
  {
    key: "auto_deposit",
    label: "Auto Deposit",
    primary: "234 / 240",
    secondary: "97.5% success · avg 3m12s",
    status: "healthy",
    configHref: "/crm/funds/policies",
  },
  {
    key: "auto_withdrawal",
    label: "Auto Withdrawal",
    primary: "89 / 98",
    secondary: "90.8% success · avg 8m",
    status: "warning",
    configHref: "/crm/funds/policies",
  },
  {
    key: "channel_health",
    label: "Channel Health",
    primary: "5 / 6 online",
    secondary: "1 channel warning",
    status: "warning",
    configHref: "/crm/funds/channels",
  },
];

export const todayFlow: FlowStat[] = [
  { key: "dep",     label: "Deposit",      value: "$2.30M", delta: { label: "+12% vs yesterday", tone: "up"   } },
  { key: "wd",      label: "Withdrawal",   value: "$1.10M", delta: { label: "-3% vs yesterday",   tone: "down" } },
  { key: "net",     label: "Net Flow",     value: "+$1.20M", delta: { label: "Healthy", tone: "up" } },
  { key: "pending", label: "Pending WD",   value: "32" },
  { key: "failed",  label: "Failed Txns",  value: "12", delta: { label: "Action needed", tone: "down" } },
];

export const channels: ChannelStatus[] = [
  { name: "DOKU",         type: "E-Wallet", status: "NORMAL",      successRate24h: 98.4, avgProcessingMin: 2,   todayVolume: 412_000 },
  { name: "USDT · TRC20", type: "Crypto",   status: "NORMAL",      successRate24h: 99.1, avgProcessingMin: 4,   todayVolume: 880_000 },
  { name: "USDT · ERC20", type: "Crypto",   status: "DELAYED",     successRate24h: 92.0, avgProcessingMin: 18,  todayVolume: 210_000 },
  { name: "Bank Wire",    type: "Bank",     status: "WARNING",     successRate24h: 86.3, avgProcessingMin: 35,  todayVolume: 540_000 },
  { name: "BCA",          type: "Bank",     status: "MAINTENANCE", successRate24h: 0,    avgProcessingMin: 0,   todayVolume: 0       },
  { name: "Visa Card",    type: "Card",     status: "NORMAL",      successRate24h: 96.7, avgProcessingMin: 1,   todayVolume: 180_000 },
];

export const riskEvents: RiskEvent[] = [
  { id: "RSK-1001", at: isoMinusMin(7),   severity: "warn",  category: "Large WD",     text: "Large withdrawal $50k pending review",            ref: "WTH-00001" },
  { id: "RSK-1002", at: isoMinusMin(45),  severity: "error", category: "AML",          text: "USR-34567 AML hit (score 87) — on hold",          ref: "WTH-00003" },
  { id: "RSK-1003", at: isoMinusMin(90),  severity: "warn",  category: "Velocity",     text: "USR-67890 Fast-In-Out · deposit 2h before WD",    ref: "WTH-00006" },
  { id: "RSK-1004", at: isoMinusMin(120), severity: "warn",  category: "Channel",      text: "Bank Wire failure rate 14% in last 1h",           ref: undefined },
  { id: "RSK-1005", at: isoMinusMin(180), severity: "info",  category: "Auto Failure", text: "Auto-withdraw rejected 4 in last hour (cooldown)" },
  { id: "RSK-1006", at: isoMinusMin(360), severity: "warn",  category: "Large DP",     text: "Large deposit $80k USDT — Crypto AML screening" },
  { id: "RSK-1007", at: isoMinusMin(720), severity: "info",  category: "Channel",      text: "BCA channel entered maintenance window" },
];

export const sevenDayTrend: FlowPoint[] = [
  { day: "Mon", deposit: 1_980_000, withdrawal: 1_240_000 },
  { day: "Tue", deposit: 2_100_000, withdrawal: 1_360_000 },
  { day: "Wed", deposit: 1_840_000, withdrawal: 1_540_000 },
  { day: "Thu", deposit: 2_550_000, withdrawal: 1_180_000 },
  { day: "Fri", deposit: 2_200_000, withdrawal: 1_320_000 },
  { day: "Sat", deposit: 1_510_000, withdrawal:   980_000 },
  { day: "Sun", deposit: 2_300_000, withdrawal: 1_100_000 },
];

/* ── Style maps (channel + severity dot+text colors) ──────────── */

export const CHANNEL_STATUS_FG: Record<ChannelStatus["status"], { text: string; dot: string }> = {
  NORMAL:      { text: "text-emerald-700", dot: "bg-emerald-500" },
  WARNING:     { text: "text-amber-700",   dot: "bg-amber-500"   },
  DELAYED:     { text: "text-orange-700",  dot: "bg-orange-500"  },
  MAINTENANCE: { text: "text-slate-600",   dot: "bg-slate-400"   },
  OFFLINE:     { text: "text-red-700",     dot: "bg-red-500"     },
};

export const AUTOMATION_STATUS_FG: Record<AutomationStat["status"], { text: string; dot: string; ring: string }> = {
  healthy:  { text: "text-emerald-700", dot: "bg-emerald-500", ring: "border-emerald-100 bg-emerald-50/40" },
  warning:  { text: "text-amber-700",   dot: "bg-amber-500",   ring: "border-amber-100 bg-amber-50/40" },
  critical: { text: "text-red-700",     dot: "bg-red-500",     ring: "border-red-100 bg-red-50/40" },
};

export const RISK_SEVERITY_FG: Record<RiskEvent["severity"], { text: string; dot: string }> = {
  info:  { text: "text-slate-600", dot: "bg-slate-400"  },
  warn:  { text: "text-amber-700", dot: "bg-amber-500"  },
  error: { text: "text-red-700",   dot: "bg-red-500"    },
};
