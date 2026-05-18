"use client";

import { useState } from "react";
import {
  TrendingUp, RefreshCw, Pencil, History, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, EnhancedDataTable, type Column } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { actionDone, demoCreate, demoEdit, demoAction } from "@/components/crm/funds/use-funds-toast";

interface CurrencyPair {
  pair: string;
  base: string;
  quote: string;
  decimals: number;
  mid_a?: number;        // Google Finance
  mid_b?: number;        // Yahoo Finance
  reference: number;     // selected mid (median)
  spread: number;        // business spread (decimal, e.g. 0.005 = 0.5%)
  business: number;      // reference * (1 + spread)
  fetchedAt: string;
  layer: "Live (a+b)" | "Live (a only)" | "Live (b only)" | "Snapshot T-1h" | "T-1 Midpoint" | "DR Mode";
}

const NOW_ISO = "2026-05-17T14:30:00.000Z";

const PAIRS: CurrencyPair[] = [
  { pair: "USD/EUR",  base: "USD", quote: "EUR",  decimals: 4, mid_a: 0.9301,    mid_b: 0.9298,    reference: 0.9300, spread: 0.0050, business: 0.9347, fetchedAt: NOW_ISO, layer: "Live (a+b)" },
  { pair: "USD/JPY",  base: "USD", quote: "JPY",  decimals: 2, mid_a: 155.42,    mid_b: 155.51,    reference: 155.47, spread: 0.0030, business: 155.93, fetchedAt: NOW_ISO, layer: "Live (a+b)" },
  { pair: "USD/IDR",  base: "USD", quote: "IDR",  decimals: 0, mid_a: 16210,     mid_b: 16205,     reference: 16208,  spread: 0.0100, business: 16370,  fetchedAt: NOW_ISO, layer: "Live (a+b)" },
  { pair: "USDT/USD", base: "USDT",quote: "USD",  decimals: 4, mid_a: 0.9998,    mid_b: 0.9999,    reference: 0.9999, spread: 0.0000, business: 0.9999, fetchedAt: NOW_ISO, layer: "Live (a+b)" },
  { pair: "EUR/USDT", base: "EUR", quote: "USDT", decimals: 4, mid_a: 1.0750,    mid_b: 1.0755,    reference: 1.0752, spread: 0.0050, business: 1.0806, fetchedAt: NOW_ISO, layer: "Live (a+b)" },
  { pair: "USD/BRL",  base: "USD", quote: "BRL",  decimals: 4, mid_a: 5.1850,    mid_b: undefined, reference: 5.1850, spread: 0.0080, business: 5.2265, fetchedAt: NOW_ISO, layer: "Live (a only)" },
  { pair: "USD/VND",  base: "USD", quote: "VND",  decimals: 0, mid_a: undefined, mid_b: undefined, reference: 25_400, spread: 0.0150, business: 25_781, fetchedAt: "2026-05-17T13:30:00.000Z", layer: "Snapshot T-1h" },
];

const LAYER_FG: Record<CurrencyPair["layer"], { text: string; dot: string; label: string }> = {
  "Live (a+b)":     { text: "text-emerald-700", dot: "bg-emerald-500", label: "🟢 Live (Google + Yahoo)" },
  "Live (a only)":  { text: "text-amber-700",   dot: "bg-amber-500",   label: "🟡 Live (Google only)" },
  "Live (b only)":  { text: "text-amber-700",   dot: "bg-amber-500",   label: "🟡 Live (Yahoo only)" },
  "Snapshot T-1h":  { text: "text-orange-700",  dot: "bg-orange-500",  label: "🟠 Snapshot T-1h" },
  "T-1 Midpoint":   { text: "text-red-700",     dot: "bg-red-500",     label: "🔴 T-1 Midpoint (DR)" },
  "DR Mode":        { text: "text-red-700",     dot: "bg-red-500",     label: "🔴 DR Mode" },
};

export default function RateCenterPage() {
  const [rows] = useState(PAIRS);
  const allHealthy = rows.every((r) => r.layer === "Live (a+b)");
  const degraded = rows.filter((r) => r.layer !== "Live (a+b)").length;

  const cols: Column<CurrencyPair>[] = [
    { key: "pair", title: "Pair", width: "100px", render: (r) => <span className="text-xs font-semibold text-slate-800">{r.pair}</span> },
    { key: "mid_a", title: "Google", width: "100px", align: "right", render: (r) => (
      r.mid_a !== undefined
        ? <span className="text-xs tabular-nums text-slate-700">{r.mid_a.toFixed(r.decimals)}</span>
        : <span className="text-xs text-slate-400">—</span>
    ) },
    { key: "mid_b", title: "Yahoo", width: "100px", align: "right", render: (r) => (
      r.mid_b !== undefined
        ? <span className="text-xs tabular-nums text-slate-700">{r.mid_b.toFixed(r.decimals)}</span>
        : <span className="text-xs text-slate-400">—</span>
    ) },
    { key: "ref", title: "Reference", width: "110px", align: "right", render: (r) => (
      <span className="text-xs font-semibold tabular-nums text-slate-900">{r.reference.toFixed(r.decimals)}</span>
    ) },
    { key: "spread", title: "Spread", width: "100px", align: "right", render: (r) => (
      <span className="text-xs tabular-nums text-slate-700">{(r.spread * 100).toFixed(2)}%</span>
    ) },
    { key: "business", title: "Business Rate", width: "120px", align: "right", render: (r) => (
      <span className="text-xs font-semibold tabular-nums text-primary">{r.business.toFixed(r.decimals)}</span>
    ) },
    { key: "layer", title: "Source Layer", width: "200px", render: (r) => {
      const l = LAYER_FG[r.layer];
      return <span className={cn("text-xs", l.text)}>{l.label}</span>;
    } },
    { key: "fetched", title: "Fetched At", width: "160px", render: (r) => <span className="text-xs text-slate-500 font-mono">{new Date(r.fetchedAt).toLocaleString()}</span> },
    { key: "actions", title: "", width: "120px", render: (r) => (
      <div className="flex gap-1">
        <Button size="sm" variant="secondary" onClick={() => demoEdit(`${r.pair} spread`)}>
          <Pencil className="w-3.5 h-3.5" />Spread
        </Button>
        <Button size="sm" variant="secondary" onClick={() => demoAction(`${r.pair} 历史曲线`)}>
          <History className="w-3.5 h-3.5" />
        </Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Funds" }, { label: "Rate Center" }]} />
      <PageHeader
        title="Rate Center"
        description="基础汇率 (Google + Yahoo 双源) → 业务汇率 (财务 spread) → 通道使用"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => actionDone("已刷新汇率")}><RefreshCw className="w-4 h-4" />Refresh</Button>
            <Button onClick={() => demoCreate("货币对")}><Pencil className="w-4 h-4" />New Pair</Button>
          </div>
        }
      />

      {/* Health banner */}
      <Card className={cn("!p-4 flex items-start gap-3",
        allHealthy ? "border-emerald-200 bg-emerald-50/40" : "border-amber-200 bg-amber-50/40")}>
        {allHealthy
          ? <CheckCircle2 className="w-5 h-5 mt-0.5 text-emerald-600 flex-shrink-0" />
          : <AlertTriangle className="w-5 h-5 mt-0.5 text-amber-600 flex-shrink-0" />}
        <div>
          <p className="text-sm font-medium text-slate-800">
            {allHealthy ? "所有货币对实时双源正常" : `${degraded} 个货币对降级，自动跨币审批已暂停`}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            灾备链：Live (a+b) → Live (a 或 b) → Snapshot T-1h → T-1 Midpoint (DR)
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiSimple label="Active Pairs" value={rows.filter((r) => r.layer.startsWith("Live")).length} tone="emerald" />
        <KpiSimple label="Snapshot Mode" value={rows.filter((r) => r.layer === "Snapshot T-1h").length} tone="amber" />
        <KpiSimple label="DR Mode" value={rows.filter((r) => r.layer === "T-1 Midpoint" || r.layer === "DR Mode").length} tone="red" />
        <KpiSimple label="Avg Spread" value={`${(rows.reduce((s, r) => s + r.spread, 0) / rows.length * 100).toFixed(2)}%`} />
      </div>

      <Card padding="none">
        <EnhancedDataTable<CurrencyPair>
          columns={cols} data={rows} keyExtractor={(r) => r.pair}
          tableId="funds-rate-center"
          emptyText="无货币对"
        />
      </Card>
    </div>
  );
}

function KpiSimple({ label, value, tone }: { label: string; value: number | string; tone?: "emerald" | "amber" | "red" }) {
  const text = tone === "emerald" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : tone === "red" ? "text-red-700" : "text-slate-900";
  return (
    <Card className="!p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={cn("text-xl font-semibold tabular-nums mt-0.5", text)}>{value}</p>
    </Card>
  );
}
