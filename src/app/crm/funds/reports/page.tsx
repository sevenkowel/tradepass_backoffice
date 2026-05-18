"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, EnhancedDataTable, type Column } from "@/components/crm/ui";
import { LineChartComponent, BarChartComponent } from "@/components/crm/charts/Charts";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { demoExport } from "@/components/crm/funds/use-funds-toast";

type Tab = "dep" | "wd" | "channel" | "aml" | "auto" | "failure";

const DEP_TREND = [
  { day: "Mon", v: 1_980_000 }, { day: "Tue", v: 2_100_000 }, { day: "Wed", v: 1_840_000 },
  { day: "Thu", v: 2_550_000 }, { day: "Fri", v: 2_200_000 }, { day: "Sat", v: 1_510_000 },
  { day: "Sun", v: 2_300_000 },
];
const WD_TREND = [
  { day: "Mon", v: 1_240_000 }, { day: "Tue", v: 1_360_000 }, { day: "Wed", v: 1_540_000 },
  { day: "Thu", v: 1_180_000 }, { day: "Fri", v: 1_320_000 }, { day: "Sat", v: 980_000 },
  { day: "Sun", v: 1_100_000 },
];

interface ChannelSuccess { channel: string; success: number; volume: number; avgMin: number; }
const CHANNEL: ChannelSuccess[] = [
  { channel: "DOKU IDR",      success: 98.4, volume: 412_000, avgMin: 2 },
  { channel: "USDT TRC20",    success: 99.1, volume: 880_000, avgMin: 4 },
  { channel: "USDT ERC20",    success: 92.0, volume: 210_000, avgMin: 18 },
  { channel: "Bank Wire",     success: 86.3, volume: 540_000, avgMin: 35 },
  { channel: "Visa Card",     success: 96.7, volume: 180_000, avgMin: 1 },
];

interface AmlStat { category: string; hits: number; filed: number; }
const AML: AmlStat[] = [
  { category: "Wallet screening", hits: 14, filed: 4 },
  { category: "Sanctions",        hits: 2,  filed: 2 },
  { category: "Velocity",         hits: 41, filed: 3 },
  { category: "Large amount",     hits: 22, filed: 5 },
];

const AUTO_WD = [
  { day: "Mon", auto: 78, manual: 22 }, { day: "Tue", auto: 84, manual: 16 },
  { day: "Wed", auto: 81, manual: 19 }, { day: "Thu", auto: 90, manual: 10 },
  { day: "Fri", auto: 86, manual: 14 }, { day: "Sat", auto: 91, manual: 9 },
  { day: "Sun", auto: 89, manual: 11 },
];

interface FailureRow { reason: string; count: number; pct: number; }
const FAILURES: FailureRow[] = [
  { reason: "Channel downtime (Bank Wire)", count: 12, pct: 32 },
  { reason: "AML hit (auto-block)",         count: 9,  pct: 24 },
  { reason: "Insufficient margin level",    count: 6,  pct: 16 },
  { reason: "KYC tier limit exceeded",      count: 5,  pct: 14 },
  { reason: "Cooldown active",              count: 3,  pct: 8 },
  { reason: "Other",                        count: 2,  pct: 6 },
];

export default function FundsReportsPage() {
  const [tab, setTab] = useState<Tab>("dep");
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Funds" }, { label: "Reports" }]} />
      <PageHeader title="Reports" description="资金报表内嵌 · 不跳出 Funds 模块"
        actions={<Button variant="secondary" onClick={() => demoExport("资金报表")}><Download className="w-4 h-4" />Export</Button>}
      />

      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {([
          ["dep",     "Deposit Trends"],
          ["wd",      "Withdrawal Trends"],
          ["channel", "Channel Success"],
          ["aml",     "AML Statistics"],
          ["auto",    "Auto WD Rate"],
          ["failure", "Failure Analysis"],
        ] as [Tab, string][]).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={cn(
            "px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
            tab === k ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700",
          )}>{label}</button>
        ))}
      </div>

      {tab === "dep" && (
        <Card className="!p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Deposit Volume (USD, 7d)</h3>
          <LineChartComponent data={DEP_TREND as unknown as Record<string, unknown>[]} xKey="day"
            yKeys={[{ key: "v", name: "Deposit", color: "#10b981" }]} height={280} />
        </Card>
      )}
      {tab === "wd" && (
        <Card className="!p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Withdrawal Volume (USD, 7d)</h3>
          <LineChartComponent data={WD_TREND as unknown as Record<string, unknown>[]} xKey="day"
            yKeys={[{ key: "v", name: "Withdrawal", color: "#f97316" }]} height={280} />
        </Card>
      )}
      {tab === "channel" && (
        <div className="space-y-3">
          <Card className="!p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Channel Success Rate</h3>
            <BarChartComponent data={CHANNEL as unknown as Record<string, unknown>[]} xKey="channel"
              yKeys={[{ key: "success", name: "Success %", color: "#3b82f6" }]} height={280} />
          </Card>
          <Card padding="none">
            <EnhancedDataTable<ChannelSuccess>
              columns={[
                { key: "channel", title: "Channel", minWidth: "160px", render: (r) => <span className="text-xs font-medium">{r.channel}</span> },
                { key: "success", title: "Success %", width: "120px", align: "right", render: (r) => <span className="text-xs tabular-nums">{r.success}%</span> },
                { key: "volume", title: "Volume (USD)", width: "150px", align: "right", render: (r) => <span className="text-xs tabular-nums">${r.volume.toLocaleString()}</span> },
                { key: "avg", title: "Avg Time (min)", width: "150px", align: "right", render: (r) => <span className="text-xs tabular-nums">{r.avgMin}</span> },
              ]}
              data={CHANNEL} keyExtractor={(r) => r.channel}
            />
          </Card>
        </div>
      )}
      {tab === "aml" && (
        <Card padding="none">
          <EnhancedDataTable<AmlStat>
            columns={[
              { key: "category", title: "Category", minWidth: "200px", render: (r) => <span className="text-xs font-medium">{r.category}</span> },
              { key: "hits", title: "Hits 7d", width: "120px", align: "right", render: (r) => <span className="text-xs tabular-nums">{r.hits}</span> },
              { key: "filed", title: "Filed", width: "120px", align: "right", render: (r) => <span className="text-xs tabular-nums">{r.filed}</span> },
              { key: "rate", title: "Filing Rate", width: "140px", align: "right", render: (r) => <span className="text-xs tabular-nums text-slate-500">{((r.filed / r.hits) * 100).toFixed(1)}%</span> },
            ]}
            data={AML} keyExtractor={(r) => r.category}
          />
        </Card>
      )}
      {tab === "auto" && (
        <Card className="!p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Auto vs Manual Withdrawal (7d)</h3>
          <BarChartComponent data={AUTO_WD as unknown as Record<string, unknown>[]} xKey="day"
            yKeys={[
              { key: "auto",   name: "Auto",   color: "#10b981" },
              { key: "manual", name: "Manual", color: "#f59e0b" },
            ]} height={280} />
        </Card>
      )}
      {tab === "failure" && (
        <Card padding="none">
          <EnhancedDataTable<FailureRow>
            columns={[
              { key: "reason", title: "Failure Reason", minWidth: "260px", render: (r) => <span className="text-xs">{r.reason}</span> },
              { key: "count", title: "Count", width: "120px", align: "right", render: (r) => <span className="text-xs tabular-nums">{r.count}</span> },
              { key: "pct", title: "% of total", width: "180px", align: "right", render: (r) => (
                <div className="flex items-center justify-end gap-2">
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-red-400" style={{ width: `${r.pct}%` }} /></div>
                  <span className="text-xs tabular-nums">{r.pct}%</span>
                </div>
              ) },
            ]}
            data={FAILURES} keyExtractor={(r) => r.reason}
          />
        </Card>
      )}
    </div>
  );
}
