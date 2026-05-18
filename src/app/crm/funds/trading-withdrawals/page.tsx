"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpCircle, Clock, AlertTriangle, Download, SlidersHorizontal,
  Activity, ExternalLink, TrendingDown,
} from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, EnhancedDataTable, type Column } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  mockTradingWithdrawals, tradingWithdrawalStats,
  type TradingWithdrawal,
} from "@/lib/mock/funds/v2/withdrawals-trading";
import { STATUS_FG, currentStep, type MoneyRequestStatus } from "@/lib/mock/funds/v2/approvals";
import { RISK_FG, KYC_TIER_FG } from "@/lib/mock/funds/v2/entities";
import { tradingChannels } from "@/lib/mock/funds/v2/channels";
import { FundsFilterDrawer, type FilterField } from "@/components/crm/funds/FundsFilterDrawer";
import { demoExport } from "@/components/crm/funds/use-funds-toast";

interface FiltersState {
  status: MoneyRequestStatus | "all";
  destination: "Wallet (Internal)" | "External Direct" | "all";
  channelIds: string[];
  amount: { min?: number; max?: number };
  onlyMarginWarn: boolean;
  onlyOverdue: boolean;
}

const DEFAULT: FiltersState = { status: "all", destination: "all", channelIds: [], amount: {}, onlyMarginWarn: false, onlyOverdue: false };

const FILTER_FIELDS: FilterField[] = [
  { key: "status", label: "状态", type: "select", options: [
    { value: "Pending", label: "Pending" }, { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" }, { value: "Rejected", label: "Rejected" },
  ]},
  { key: "destination", label: "目标", type: "select", options: [
    { value: "Wallet (Internal)", label: "Wallet 内转" },
    { value: "External Direct", label: "外部直出" },
  ]},
  { key: "channelIds", label: "通道", type: "multiselect",
    options: tradingChannels.map((c) => ({ value: c.id, label: c.name })),
  },
  { key: "amount", label: "金额范围 (USD)", type: "range" },
  { key: "onlyMarginWarn", label: "仅显示 Margin 警告", type: "toggle" },
  { key: "onlyOverdue", label: "仅显示超 SLA", type: "toggle" },
];

export default function TradingWithdrawalsListPage() {
  const router = useRouter();
  const [rows] = useState<TradingWithdrawal[]>(mockTradingWithdrawals);
  const [filters, setFilters] = useState<FiltersState>(DEFAULT);
  const [search, setSearch] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const stats = useMemo(() => tradingWithdrawalStats(rows), [rows]);
  const filtered = useMemo(() => rows.filter((r) => {
    if (filters.status !== "all" && r.status !== filters.status) return false;
    if (filters.destination !== "all" && r.destination !== filters.destination) return false;
    if (filters.channelIds.length > 0 && (!r.channelId || !filters.channelIds.includes(r.channelId))) return false;
    if (filters.amount.min !== undefined && r.amountUsd < filters.amount.min) return false;
    if (filters.amount.max !== undefined && r.amountUsd > filters.amount.max) return false;
    if (filters.onlyMarginWarn && !(r.marginLevelAfter > 0 && r.marginLevelAfter < 150)) return false;
    if (filters.onlyOverdue && r.slaElapsedMinutes <= r.slaMinutes) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!`${r.id} ${r.client.id} ${r.client.name} ${r.mtAccount.id}`.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [rows, filters, search]);
  const patch = (p: Partial<FiltersState>) => setFilters((prev) => ({ ...prev, ...p }));

  const columns: Column<TradingWithdrawal>[] = [
    { key: "id", title: "Request", width: "150px", render: (r) => <span className="text-xs font-mono text-primary">{r.id}</span> },
    { key: "client", title: "Client", minWidth: "200px", render: (r) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-slate-800">{r.client.name}</span>
        <span className="text-[11px] text-slate-500">
          <span className="font-mono">{r.client.id}</span>
          <span className="mx-1.5">·</span>
          <span className={KYC_TIER_FG[r.client.kycTier].text}>{r.client.kycTier}</span>
        </span>
      </div>
    ) },
    { key: "mt", title: "MT Account", minWidth: "180px", render: (r) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-mono text-slate-700">{r.mtAccount.id}</span>
        <span className="text-[11px] text-slate-500">Equity ${r.mtAccount.equity.toLocaleString()}</span>
      </div>
    ) },
    { key: "amount", title: "Amount", width: "120px", align: "right", render: (r) => (
      <div className="flex flex-col items-end">
        <span className="text-xs font-semibold text-slate-900 tabular-nums">${r.amount.toLocaleString()}</span>
        <span className="text-[11px] text-slate-500">{r.currency}</span>
      </div>
    ) },
    { key: "margin", title: "Margin After", width: "130px", render: (r) => {
      if (r.mtAccount.openPositions === 0) return <span className="text-xs text-slate-400">— (no positions)</span>;
      const after = r.marginLevelAfter;
      const tone = after < 100 ? "text-red-700" : after < 150 ? "text-orange-700" : after < 200 ? "text-amber-700" : "text-emerald-700";
      return (
        <span className={cn("inline-flex items-center gap-1 text-xs tabular-nums", tone)}>
          <span className="text-slate-500">{r.marginLevelBefore}%</span>
          <TrendingDown className="w-3 h-3" />
          <span className="font-semibold">{after}%</span>
        </span>
      );
    } },
    { key: "withdrawable", title: "Max Withdrawable", width: "150px", align: "right", render: (r) => (
      <div className="flex flex-col items-end">
        <span className="text-xs tabular-nums text-slate-800">${r.withdrawable.toLocaleString()}</span>
        <span className="text-[10px] text-slate-500">{r.formulaUsed.replace("Preset ", "")}</span>
      </div>
    ) },
    { key: "dest", title: "Destination", width: "150px", render: (r) => (
      <span className={cn("inline-flex items-center gap-1.5 text-xs",
        r.destination === "External Direct" ? "text-orange-700" : "text-slate-700")}>
        {r.destination === "External Direct" ? <ExternalLink className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
        {r.destination}
      </span>
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
      <Breadcrumb items={[{ label: "Funds" }, { label: "Trading Withdrawals" }]} />
      <PageHeader title="Trading Withdrawals" description="MT 账户 → 钱包/外部 · 核验 margin/positions/KYC → Treasury 付款" />

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi label="Total" value={rows.length} icon={<ArrowUpCircle className="w-4 h-4 text-primary" />} onClick={() => setFilters(DEFAULT)} />
        <Kpi label="Pending" value={stats.pending} icon={<Clock className="w-4 h-4 text-amber-600" />} tone="warn" onClick={() => patch({ status: "Pending" })} active={filters.status === "Pending"} />
        <Kpi label="Margin Warn" value={stats.marginWarn} icon={<TrendingDown className="w-4 h-4 text-orange-600" />} tone="warn" onClick={() => patch({ onlyMarginWarn: !filters.onlyMarginWarn })} active={filters.onlyMarginWarn} />
        <Kpi label="External Direct" value={rows.filter((r) => r.destination === "External Direct").length} icon={<ExternalLink className="w-4 h-4 text-blue-600" />} onClick={() => patch({ destination: "External Direct" })} active={filters.destination === "External Direct"} />
        <Kpi label="Rejected 24h" value={stats.rejected24h} icon={<AlertTriangle className="w-4 h-4 text-red-600" />} tone="error" onClick={() => patch({ status: "Rejected" })} active={filters.status === "Rejected"} />
        <Kpi label="Overdue SLA" value={stats.overdue} icon={<Clock className="w-4 h-4 text-orange-600" />} tone="warn" onClick={() => patch({ onlyOverdue: !filters.onlyOverdue })} active={filters.onlyOverdue} />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-80">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索 Request / 客户 / MT 账户..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="flex-1" />
        <Button variant="secondary" onClick={() => setAdvancedOpen(true)}><SlidersHorizontal className="w-4 h-4" />高级筛选</Button>
        <Button variant="secondary" onClick={() => demoExport("交易账户提款")}><Download className="w-4 h-4" />Export</Button>
      </div>

      <FundsFilterDrawer
        open={advancedOpen}
        onClose={() => setAdvancedOpen(false)}
        fields={FILTER_FIELDS}
        values={filters as unknown as Record<string, unknown>}
        onChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v as never }))}
        onApply={() => setAdvancedOpen(false)}
        onReset={() => setFilters(DEFAULT)}
      />

      <Card padding="none">
        <EnhancedDataTable<TradingWithdrawal>
          columns={columns} data={filtered} keyExtractor={(r) => r.id}
          pagination pageSize={20}
          onRowClick={(r) => router.push(`/crm/funds/trading-withdrawals/${r.id}`)}
          tableId="funds-trading-withdrawals"
          emptyText="无匹配的交易账户提款请求"
        />
      </Card>
    </div>
  );
}

function Kpi({ label, value, icon, tone, onClick, active }: { label: string; value: number; icon: React.ReactNode; tone?: "error" | "warn"; onClick?: () => void; active?: boolean }) {
  const accent = tone === "error" ? "border-red-100" : tone === "warn" ? "border-amber-100" : "border-slate-200";
  return (
    <button onClick={onClick} className="text-left w-full">
      <Card className={cn("!p-3 hover:shadow-md transition-shadow", accent, active && "ring-2 ring-blue-200")}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">{icon}</div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 truncate">{label}</p>
            <p className="text-lg font-semibold text-slate-900 tabular-nums mt-0.5">{value.toLocaleString()}</p>
          </div>
        </div>
      </Card>
    </button>
  );
}
