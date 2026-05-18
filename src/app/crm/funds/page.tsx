"use client";

/**
 * Funds Overview — v2.2 Cockpit
 *
 * Hero: AUM at a glance + 7-day trend.
 * 4 role-based sections (Treasury / Operations / Compliance / Growth)
 * accessible via top tab switcher.
 */

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle, Activity,
  AlertTriangle, ShieldAlert, Clock, ChevronRight, Wallet,
  Users, Zap, DollarSign, Network, Globe,
} from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader } from "@/components/crm/ui";
import { LineChartComponent } from "@/components/crm/charts/Charts";
import { cn } from "@/lib/utils";

type Section = "treasury" | "operations" | "compliance" | "growth";

const SEVEN_DAY = [
  { day: "Mon", deposit: 1_980_000, withdrawal: 1_240_000 },
  { day: "Tue", deposit: 2_100_000, withdrawal: 1_360_000 },
  { day: "Wed", deposit: 1_840_000, withdrawal: 1_540_000 },
  { day: "Thu", deposit: 2_550_000, withdrawal: 1_180_000 },
  { day: "Fri", deposit: 2_200_000, withdrawal: 1_320_000 },
  { day: "Sat", deposit: 1_510_000, withdrawal:   980_000 },
  { day: "Sun", deposit: 2_300_000, withdrawal: 1_100_000 },
];

export default function FundsOverviewPage() {
  const [section, setSection] = useState<Section>("treasury");
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Funds" }, { label: "Overview" }]} />
      <PageHeader title="Funds Overview" description="Money operating cockpit — 角色化驾驶舱" />

      {/* Hero — Money at a glance */}
      <Card className="!p-4 lg:!p-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <HeroStat label="AUM (USD)"        value="$98.4M" delta="+1.2%" deltaTone="up" />
          <HeroStat label="Net Flow (24h)"   value="+$1.2M" delta="vs +$0.9M Yesterday" deltaTone="up" />
          <HeroStat label="Pending Funds"    value="$5.3M"  delta="32 requests" deltaTone="neutral" />
          <HeroStat label="Failed Today"     value="12"     delta="$48k value" deltaTone="down" />
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <LineChartComponent
            data={SEVEN_DAY as unknown as Record<string, unknown>[]}
            xKey="day"
            yKeys={[
              { key: "deposit",    name: "Deposit",    color: "#10b981" },
              { key: "withdrawal", name: "Withdrawal", color: "#f97316" },
            ]}
            height={220}
          />
        </div>
      </Card>

      {/* Role switcher */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <TabBtn label="Treasury (CFO)"     active={section === "treasury"}     onClick={() => setSection("treasury")} />
        <TabBtn label="Operations (COO)"   active={section === "operations"}   onClick={() => setSection("operations")} />
        <TabBtn label="Compliance (CCO)"   active={section === "compliance"}   onClick={() => setSection("compliance")} />
        <TabBtn label="Growth (CRO/CMO)"   active={section === "growth"}       onClick={() => setSection("growth")} />
      </div>

      {section === "treasury"   && <TreasurySection />}
      {section === "operations" && <OperationsSection />}
      {section === "compliance" && <ComplianceSection />}
      {section === "growth"     && <GrowthSection />}
    </div>
  );
}

/* ── Sections ──────────────────────────────────────────────────── */

function TreasurySection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <Card className="!p-4 lg:col-span-2">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">资金池规模 (USD)</h3>
        <div className="grid grid-cols-2 gap-3">
          <PoolCard kind="Real"   value={80_000_000} color="text-emerald-700" />
          <PoolCard kind="Bonus"  value={4_120_000}  color="text-violet-700" />
          <PoolCard kind="Credit" value={2_000_000}  color="text-blue-700" />
          <PoolCard kind="Reward" value={75_000}     color="text-amber-700" />
        </div>
      </Card>

      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">资金分布</h3>
        <ul className="space-y-2 text-xs">
          <DistRow label="客户钱包" value="$86.2M" pct={87.5} color="bg-emerald-500" />
          <DistRow label="MT 平台"   value="$12.2M" pct={12.4} color="bg-blue-500" />
          <DistRow label="通道在途" value="$5.3M"  pct={5.4}  color="bg-amber-500" />
          <DistRow label="备用金"   value="$2.0M"  pct={2.0}  color="bg-violet-500" />
        </ul>
      </Card>

      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">7-Day 净流入</h3>
        <p className="text-3xl font-semibold text-emerald-700 tabular-nums">+$8.4M</p>
        <p className="text-xs text-slate-500 mt-1">7d avg: +$1.2M/day · 30d avg: +$1.05M/day</p>
        <Link href="/crm/funds/reconciliation" className="text-xs text-primary mt-3 inline-flex items-center gap-1 hover:underline">
          View daily reports <ChevronRight className="w-3 h-3" />
        </Link>
      </Card>

      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">现金流准备金</h3>
        <KvRow label="可用出金能力" value="$32.0M" tone="emerald" />
        <KvRow label="T+1 预计提款" value="$5.8M" />
        <KvRow label="预留覆盖率"   value="5.5x"   tone="emerald" />
        <Link href="/crm/funds/treasury" className="text-xs text-primary mt-3 inline-flex items-center gap-1 hover:underline">
          Open Treasury <ChevronRight className="w-3 h-3" />
        </Link>
      </Card>

      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">汇率收益 (24h)</h3>
        <p className="text-3xl font-semibold text-emerald-700 tabular-nums">+$42k</p>
        <p className="text-xs text-slate-500 mt-1">业务汇率 vs 基础汇率折算差</p>
        <Link href="/crm/funds/rate-center" className="text-xs text-primary mt-3 inline-flex items-center gap-1 hover:underline">
          Open Rate Center <ChevronRight className="w-3 h-3" />
        </Link>
      </Card>
    </div>
  );
}

function OperationsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <AutomationCard label="Auto Deposit" rate={97.5} success="234 / 240" avg="3m12s" tone="emerald" />
      <AutomationCard label="Auto Withdrawal" rate={90.8} success="89 / 98" avg="8m" tone="amber" />
      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Channel Health</h3>
        <p className="text-3xl font-semibold text-amber-700 tabular-nums">5 / 6</p>
        <p className="text-xs text-amber-600 mt-1">1 channel in degraded mode (USDT ERC20)</p>
      </Card>

      <Card className="!p-4 lg:col-span-2">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">积压队列</h3>
        <div className="grid grid-cols-3 gap-3">
          <QueueCard label="Treasury Pending" value={18} tone="amber" />
          <QueueCard label="Finance Pending"  value={9}  tone="amber" />
          <QueueCard label="Compliance Pending" value={4}  tone="red" />
        </div>
        <p className="text-xs text-slate-500 mt-3">SLA breached: 3 requests over budget</p>
      </Card>

      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">人均处理量 (24h)</h3>
        <ul className="space-y-2 text-xs">
          <li className="flex justify-between"><span>Anna Chen</span><span className="font-semibold tabular-nums">14</span></li>
          <li className="flex justify-between"><span>Brian Park</span><span className="font-semibold tabular-nums">11</span></li>
          <li className="flex justify-between"><span>Carlos Mendoza</span><span className="font-semibold tabular-nums">8</span></li>
          <li className="flex justify-between"><span>Aisha Khan</span><span className="font-semibold tabular-nums">6</span></li>
        </ul>
      </Card>
    </div>
  );
}

function ComplianceSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3 inline-flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600" />AML 命中 (24h)
        </h3>
        <p className="text-3xl font-semibold text-red-700 tabular-nums">4</p>
        <ul className="mt-3 space-y-1 text-xs text-slate-700">
          <li>Severe: 2 · High: 1 · Medium: 1</li>
        </ul>
      </Card>

      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">大额交易 (≥$10k)</h3>
        <p className="text-3xl font-semibold text-amber-700 tabular-nums">17</p>
        <p className="text-xs text-slate-500 mt-1">$2.8M 累计 · 8 跨境</p>
      </Card>

      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">未结挂起 &gt; 24h</h3>
        <p className="text-3xl font-semibold text-red-700 tabular-nums">3</p>
        <p className="text-xs text-slate-500 mt-1">需 Compliance 介入</p>
      </Card>

      <Card className="!p-4 lg:col-span-3">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">异常模式触发次数 (24h)</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <PatternCard label="Fast In-Out"   value={5} />
          <PatternCard label="High Profit"   value={4} />
          <PatternCard label="Velocity"      value={18} />
          <PatternCard label="New Device"    value={6} />
          <PatternCard label="IP Anomaly"    value={3} />
        </div>
      </Card>

      <Card className="!p-4 lg:col-span-2">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">SAR / STR 提交进度</h3>
        <div className="grid grid-cols-3 gap-3">
          <PatternCard label="SAR (本月)"    value={1} />
          <PatternCard label="STR (本月)"    value={3} />
          <PatternCard label="Internal Review" value={5} />
        </div>
      </Card>

      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">黑名单命中 (24h)</h3>
        <p className="text-3xl font-semibold text-red-700 tabular-nums">2</p>
      </Card>
    </div>
  );
}

function GrowthSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">FTD (首次入金, 今日)</h3>
        <p className="text-3xl font-semibold text-emerald-700 tabular-nums">42</p>
        <p className="text-xs text-slate-500 mt-1">$28.5k · avg $678 per client</p>
      </Card>

      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">复入金率 (本月)</h3>
        <p className="text-3xl font-semibold text-blue-700 tabular-nums">68.4%</p>
        <p className="text-xs text-slate-500 mt-1">vs 62.1% 上月</p>
      </Card>

      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">平均存款金额</h3>
        <p className="text-3xl font-semibold text-slate-900 tabular-nums">$2,840</p>
        <p className="text-xs text-emerald-600 mt-1">↑ 4.5% MoM</p>
      </Card>

      <Card className="!p-4 lg:col-span-2">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">地区表现 (24h Net Flow)</h3>
        <div className="space-y-2 text-xs">
          <RegionRow region="🇮🇩 Indonesia"  flow={+412_000} />
          <RegionRow region="🇻🇳 Vietnam"    flow={+220_000} />
          <RegionRow region="🇲🇾 Malaysia"   flow={+180_000} />
          <RegionRow region="🇧🇷 Brazil"     flow={+162_000} />
          <RegionRow region="🇯🇵 Japan"      flow={+150_000} />
          <RegionRow region="🇷🇺 Russia"     flow={-65_000}  />
        </div>
      </Card>

      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">IB 渠道</h3>
        <KvRow label="IB-001 全树 deposits" value="$580k" tone="emerald" />
        <KvRow label="IB-002 deposits"       value="$120k" />
        <KvRow label="本月 IB 佣金"          value="$8.4k" />
      </Card>

      <Card className="!p-4 lg:col-span-3">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">流失指标</h3>
        <div className="grid grid-cols-3 gap-3">
          <PatternCard label="净流出客户"  value={3} />
          <PatternCard label="清户 (本月)" value={1} />
          <PatternCard label="休眠 > 60d"  value={48} />
        </div>
      </Card>
    </div>
  );
}

/* ── Helper components ─────────────────────────────────────────── */

function HeroStat({ label, value, delta, deltaTone }: { label: string; value: string; delta: string; deltaTone: "up" | "down" | "neutral" }) {
  const Icon = deltaTone === "up" ? TrendingUp : deltaTone === "down" ? TrendingDown : Clock;
  const tone = deltaTone === "up" ? "text-emerald-600" : deltaTone === "down" ? "text-red-600" : "text-slate-500";
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 tabular-nums leading-tight mt-1">{value}</p>
      <p className={cn("text-[11px] mt-1 inline-flex items-center gap-1", tone)}><Icon className="w-3 h-3" />{delta}</p>
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
      active ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700",
    )}>{label}</button>
  );
}

function PoolCard({ kind, value, color }: { kind: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-[11px] text-slate-500">{kind} Wallet</p>
      <p className={cn("text-xl font-semibold tabular-nums mt-1", color)}>${(value / 1_000_000).toFixed(2)}M</p>
    </div>
  );
}

function DistRow({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <li>
      <div className="flex justify-between mb-1">
        <span className="text-slate-700">{label}</span>
        <span className="font-semibold tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}

function KvRow({ label, value, tone }: { label: string; value: string; tone?: "emerald" }) {
  const text = tone === "emerald" ? "text-emerald-700" : "text-slate-900";
  return (
    <div className="flex items-center justify-between text-xs py-1">
      <span className="text-slate-500">{label}</span>
      <span className={cn("font-semibold tabular-nums", text)}>{value}</span>
    </div>
  );
}

function AutomationCard({ label, rate, success, avg, tone }: { label: string; rate: number; success: string; avg: string; tone: "emerald" | "amber" }) {
  const text = tone === "emerald" ? "text-emerald-700" : "text-amber-700";
  return (
    <Card className="!p-4">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">{label}</h3>
      <p className={cn("text-3xl font-semibold tabular-nums", text)}>{rate}%</p>
      <p className="text-xs text-slate-500 mt-1">{success} success · avg {avg}</p>
    </Card>
  );
}

function QueueCard({ label, value, tone }: { label: string; value: number; tone: "amber" | "red" }) {
  const text = tone === "amber" ? "text-amber-700" : "text-red-700";
  return (
    <div className={cn("rounded-lg border p-3", tone === "amber" ? "border-amber-200 bg-amber-50/40" : "border-red-200 bg-red-50/40")}>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className={cn("text-2xl font-semibold tabular-nums mt-1", text)}>{value}</p>
    </div>
  );
}

function PatternCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="text-xl font-semibold text-slate-900 tabular-nums mt-1">{value}</p>
    </div>
  );
}

function RegionRow({ region, flow }: { region: string; flow: number }) {
  return (
    <div className="flex items-center justify-between">
      <span>{region}</span>
      <span className={cn("font-semibold tabular-nums", flow >= 0 ? "text-emerald-700" : "text-red-700")}>
        {flow >= 0 ? "+" : ""}${flow.toLocaleString()}
      </span>
    </div>
  );
}
