"use client";

import { TrendingUp, Wallet, Banknote, Activity, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, EnhancedDataTable, type Column } from "@/components/crm/ui";
import { LineChartComponent } from "@/components/crm/charts/Charts";
import { cn } from "@/lib/utils";

const FLOW = [
  { day: "Mon", deposit: 1_980_000, withdrawal: 1_240_000 },
  { day: "Tue", deposit: 2_100_000, withdrawal: 1_360_000 },
  { day: "Wed", deposit: 1_840_000, withdrawal: 1_540_000 },
  { day: "Thu", deposit: 2_550_000, withdrawal: 1_180_000 },
  { day: "Fri", deposit: 2_200_000, withdrawal: 1_320_000 },
  { day: "Sat", deposit: 1_510_000, withdrawal:   980_000 },
  { day: "Sun", deposit: 2_300_000, withdrawal: 1_100_000 },
];

interface ReserveRow {
  channel: string;
  available: number;
  inFlight: number;
  reserve: number;
  health: "Healthy" | "Tight" | "Critical";
}

const RESERVES: ReserveRow[] = [
  { channel: "Bank Wire (USD)",    available: 12_500_000, inFlight: 540_000, reserve: 8.4,  health: "Healthy" },
  { channel: "USDT TRC20",         available: 8_200_000,  inFlight: 880_000, reserve: 4.2,  health: "Healthy" },
  { channel: "USDT ERC20",         available: 1_800_000,  inFlight: 210_000, reserve: 3.6,  health: "Tight" },
  { channel: "DOKU IDR (in IDR)",  available: 280_000_000_000, inFlight: 6_600_000_000, reserve: 5.1,  health: "Healthy" },
  { channel: "SEPA EUR",           available: 3_800_000,  inFlight: 320_000, reserve: 5.0,  health: "Healthy" },
  { channel: "Visa Card",          available: 950_000,    inFlight: 180_000, reserve: 1.2,  health: "Critical" },
];

const HEALTH_FG = {
  Healthy:  { text: "text-emerald-700", dot: "bg-emerald-500" },
  Tight:    { text: "text-amber-700",   dot: "bg-amber-500"   },
  Critical: { text: "text-red-700",     dot: "bg-red-500"     },
} as const;

export default function TreasuryPage() {
  const cols: Column<ReserveRow>[] = [
    { key: "channel",   title: "Channel",        minWidth: "200px", render: (r) => <span className="text-xs font-medium text-slate-800">{r.channel}</span> },
    { key: "available", title: "Available",      width: "180px", align: "right", render: (r) => <span className="text-xs tabular-nums">${r.available.toLocaleString()}</span> },
    { key: "inflight",  title: "In-Flight",      width: "150px", align: "right", render: (r) => <span className="text-xs tabular-nums text-amber-700">${r.inFlight.toLocaleString()}</span> },
    { key: "reserve",   title: "Reserve Ratio",  width: "130px", align: "right", render: (r) => (
      <span className={cn("text-xs font-semibold tabular-nums",
        r.health === "Healthy" ? "text-emerald-700" : r.health === "Tight" ? "text-amber-700" : "text-red-700")}>{r.reserve}x</span>
    ) },
    { key: "health", title: "Health", width: "120px", render: (r) => {
      const h = HEALTH_FG[r.health];
      return <span className={cn("inline-flex items-center gap-1.5 text-xs", h.text)}><span className={cn("w-1.5 h-1.5 rounded-full", h.dot)} />{r.health}</span>;
    } },
  ];

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Funds" }, { label: "Treasury" }]} />
      <PageHeader title="Treasury" description="CFO 视角 — 资金池、备用金、跨通道头寸、汇率敞口" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Big label="Total AUM"            value="$98.4M" tone="primary" icon={<Wallet className="w-5 h-5" />} />
        <Big label="Available for Payout" value="$32.0M" tone="emerald" icon={<Banknote className="w-5 h-5" />} />
        <Big label="In-Flight Funds"      value="$5.3M"  tone="amber"   icon={<Activity className="w-5 h-5" />} />
        <Big label="Reserve Coverage"     value="5.5x"   tone="emerald" icon={<TrendingUp className="w-5 h-5" />} />
      </div>

      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">7 日资金流</h3>
        <LineChartComponent
          data={FLOW as unknown as Record<string, unknown>[]}
          xKey="day"
          yKeys={[
            { key: "deposit",    name: "Deposit",    color: "#10b981" },
            { key: "withdrawal", name: "Withdrawal", color: "#f97316" },
          ]}
          height={260}
        />
      </Card>

      <Card padding="none">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">通道备用金与在途头寸</h3>
            <p className="text-xs text-slate-500 mt-0.5">Reserve = Available / Avg Daily Payout · 行业建议 ≥ 3x</p>
          </div>
          <Link href="/crm/funds/channels/wallet" className="text-xs text-primary hover:underline">查看通道详情 →</Link>
        </div>
        <EnhancedDataTable<ReserveRow> columns={cols} data={RESERVES} keyExtractor={(r) => r.channel} tableId="funds-treasury-reserves" />
      </Card>

      <Card className="!p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-800">Visa Card 备用金告警</p>
            <p className="text-xs text-slate-600 mt-1">
              Reserve ratio 1.2x 低于安全阈值 (3x)。建议从其它通道调拨 $500k 至 Visa Card 备用账户。
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Big({ label, value, tone, icon }: { label: string; value: string; tone: "primary" | "emerald" | "amber"; icon: React.ReactNode }) {
  const text = tone === "primary" ? "text-primary" : tone === "emerald" ? "text-emerald-700" : "text-amber-700";
  return (
    <Card className="!p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className={cn("text-2xl font-semibold tabular-nums mt-1", text)}>{value}</p>
        </div>
        <div className={cn("w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center", text)}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
