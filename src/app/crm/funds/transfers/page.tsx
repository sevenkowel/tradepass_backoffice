"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft, Clock, AlertTriangle, Download, SlidersHorizontal,
  Gift, ShieldAlert,
} from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, EnhancedDataTable, type Column } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  mockTransfers, transferStats,
  type TransferRow, type TransferScenario,
} from "@/lib/mock/funds/v2/transfers";
import { STATUS_FG, currentStep } from "@/lib/mock/funds/v2/approvals";
import { RISK_FG, KYC_TIER_FG } from "@/lib/mock/funds/v2/entities";
import { FundsFilterDrawer, type FilterField } from "@/components/crm/funds/FundsFilterDrawer";
import { demoExport } from "@/components/crm/funds/use-funds-toast";

type Tab = "All" | TransferScenario;

interface TransferFilters {
  risk: "Critical" | "High" | "Medium" | "Low" | "all";
  amount: { min?: number; max?: number };
  onlyCrossCurrency: boolean;
  onlyCrossPlatform: boolean;
}

const DEFAULT_TF: TransferFilters = { risk: "all", amount: {}, onlyCrossCurrency: false, onlyCrossPlatform: false };

const TF_FIELDS: FilterField[] = [
  { key: "risk", label: "风险等级", type: "select", options: [
    { value: "Critical", label: "Critical" }, { value: "High", label: "High" },
    { value: "Medium", label: "Medium" }, { value: "Low", label: "Low" },
  ]},
  { key: "amount", label: "金额范围 (USD)", type: "range" },
  { key: "onlyCrossCurrency", label: "仅显示跨币种", type: "toggle" },
  { key: "onlyCrossPlatform", label: "仅显示跨平台", type: "toggle" },
];

const TABS: Tab[] = [
  "All",
  "Account ↔ Account",
  "Wallet → Account",
  "Account → Wallet",
  "Wallet → Wallet (P2P)",
  "Bonus Injection",
];

export default function TransfersListPage() {
  const router = useRouter();
  const [rows] = useState<TransferRow[]>(mockTransfers);
  const [tab, setTab] = useState<Tab>("All");
  const [search, setSearch] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advFilters, setAdvFilters] = useState<TransferFilters>(DEFAULT_TF);

  const stats = useMemo(() => transferStats(rows), [rows]);
  const filtered = useMemo(() => rows.filter((r) => {
    if (tab !== "All" && r.scenario !== tab) return false;
    if (advFilters.risk !== "all" && r.riskLevel !== advFilters.risk) return false;
    if (advFilters.amount.min !== undefined && r.amountUsd < advFilters.amount.min) return false;
    if (advFilters.amount.max !== undefined && r.amountUsd > advFilters.amount.max) return false;
    if (advFilters.onlyCrossCurrency && !r.isCrossCurrency) return false;
    if (advFilters.onlyCrossPlatform && !r.isCrossPlatform) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!`${r.id} ${r.fromClient.id} ${r.fromClient.name} ${r.toClient.id} ${r.fromLabel} ${r.toLabel}`.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [rows, tab, search, advFilters]);

  const columns: Column<TransferRow>[] = [
    { key: "id", title: "Transfer", width: "140px", render: (r) => <span className="text-xs font-mono text-primary">{r.id}</span> },
    { key: "scenario", title: "Scenario", width: "160px", render: (r) => (
      <span className={cn("inline-flex items-center gap-1.5 text-xs",
        r.scenario === "Wallet → Wallet (P2P)" ? "text-orange-700" :
        r.scenario === "Bonus Injection"       ? "text-violet-700" :
                                                  "text-slate-700")}>
        {r.scenario === "Bonus Injection" ? <Gift className="w-3 h-3" /> :
         r.scenario === "Wallet → Wallet (P2P)" ? <ShieldAlert className="w-3 h-3" /> :
                                                   <ArrowRightLeft className="w-3 h-3" />}
        {r.scenario}
      </span>
    ) },
    { key: "flow", title: "From → To", minWidth: "260px", render: (r) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-slate-800 truncate">{r.fromLabel}</span>
        <span className="text-[11px] text-slate-500">→ {r.toLabel}</span>
      </div>
    ) },
    { key: "client", title: "Client(s)", minWidth: "200px", render: (r) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-slate-800">
          {r.fromClient.id === r.toClient.id ? r.fromClient.name : `${r.fromClient.name} → ${r.toClient.name}`}
        </span>
        <span className="text-[11px] font-mono text-slate-500">
          {r.fromClient.id === r.toClient.id ? r.fromClient.id : `${r.fromClient.id} → ${r.toClient.id}`}
        </span>
      </div>
    ) },
    { key: "amount", title: "Amount", width: "130px", align: "right", render: (r) => (
      <div className="flex flex-col items-end">
        <span className="text-xs font-semibold text-slate-900 tabular-nums">
          {r.amount.toLocaleString()} {r.currency}
        </span>
        <span className="text-[11px] text-slate-500 tabular-nums">≈ ${r.amountUsd.toLocaleString()}</span>
      </div>
    ) },
    { key: "tags", title: "Tags", width: "150px", render: (r) => (
      <div className="flex flex-wrap gap-1">
        {r.isCrossCurrency && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700">FX</span>}
        {r.isCrossPlatform && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">x-platform</span>}
        {r.fxRate !== undefined && <span className="text-[10px] font-mono text-slate-500">@ {r.fxRate}</span>}
      </div>
    ) },
    { key: "status", title: "Status", width: "130px", render: (r) => {
      const s = STATUS_FG[r.status];
      const cs = currentStep(r.steps);
      return (
        <div className="flex flex-col gap-0.5">
          <span className={cn("inline-flex items-center gap-1.5 text-xs", s.text)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
            {r.status}
          </span>
          {cs && <span className="text-[11px] text-slate-500 truncate">@ {cs.role}</span>}
        </div>
      );
    } },
    { key: "risk", title: "Risk", width: "90px", render: (r) => {
      const c = RISK_FG[r.riskLevel];
      return <span className={cn("inline-flex items-center gap-1.5 text-xs", c.text)}><span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />{r.riskLevel}</span>;
    } },
  ];

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Funds" }, { label: "Transfers" }]} />
      <PageHeader title="Transfers" description="内部资金调拨 · 5 种场景 · P2P 限 IB + Compliance" />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi label="Pending" value={stats.pending} icon={<Clock className="w-4 h-4 text-amber-600" />} tone="warn" />
        <Kpi label="Completed 24h" value={stats.completed24h} icon={<ArrowRightLeft className="w-4 h-4 text-emerald-600" />} />
        <Kpi label="P2P (IB-only)" value={stats.p2p} icon={<ShieldAlert className="w-4 h-4 text-orange-600" />} />
        <Kpi label="Cross-currency" value={stats.crossCurrency} icon={<ArrowRightLeft className="w-4 h-4 text-violet-600" />} />
        <Kpi label="Cross-platform" value={stats.crossPlatform} icon={<ArrowRightLeft className="w-4 h-4 text-blue-600" />} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            "px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
            tab === t ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700",
          )}>
            {t} {t === "All" ? `(${rows.length})` : `(${rows.filter((r) => r.scenario === t).length})`}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-80">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索 Transfer / 客户 / 账户..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="flex-1" />
        <Button variant="secondary" onClick={() => setAdvancedOpen(true)}><SlidersHorizontal className="w-4 h-4" />高级筛选</Button>
        <Button variant="secondary" onClick={() => demoExport("转账列表")}><Download className="w-4 h-4" />Export</Button>
      </div>

      <FundsFilterDrawer
        open={advancedOpen}
        onClose={() => setAdvancedOpen(false)}
        fields={TF_FIELDS}
        values={advFilters as unknown as Record<string, unknown>}
        onChange={(k, v) => setAdvFilters((prev) => ({ ...prev, [k]: v as never }))}
        onApply={() => setAdvancedOpen(false)}
        onReset={() => setAdvFilters(DEFAULT_TF)}
      />

      <Card padding="none">
        <EnhancedDataTable<TransferRow>
          columns={columns} data={filtered} keyExtractor={(r) => r.id}
          pagination pageSize={20}
          onRowClick={(r) => router.push(`/crm/funds/transfers/${r.id}`)}
          tableId="funds-transfers"
          emptyText="无匹配的转账记录"
        />
      </Card>
    </div>
  );
}

function Kpi({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone?: "warn" }) {
  const accent = tone === "warn" ? "border-amber-100" : "border-slate-200";
  return (
    <Card className={cn("!p-3", accent)}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500 truncate">{label}</p>
          <p className="text-lg font-semibold text-slate-900 tabular-nums mt-0.5">{value.toLocaleString()}</p>
        </div>
      </div>
    </Card>
  );
}
