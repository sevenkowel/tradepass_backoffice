"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownCircle, Clock, AlertTriangle, Download, SlidersHorizontal,
  Zap, ExternalLink,
} from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, EnhancedDataTable, type Column } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  mockTradingDeposits, tradingDepositStats,
  type TradingDeposit,
} from "@/lib/mock/funds/v2/deposits-trading";
import { STATUS_FG, currentStep, type MoneyRequestStatus } from "@/lib/mock/funds/v2/approvals";
import { RISK_FG, KYC_TIER_FG } from "@/lib/mock/funds/v2/entities";
import { tradingChannels } from "@/lib/mock/funds/v2/channels";
import { FundsFilterDrawer, type FilterField } from "@/components/crm/funds/FundsFilterDrawer";
import { demoExport } from "@/components/crm/funds/use-funds-toast";

interface FiltersState {
  status: MoneyRequestStatus | "all";
  source: "Wallet (Internal)" | "External Direct" | "all";
  channelIds: string[];
  amount: { min?: number; max?: number };
  onlyOverdue: boolean;
}

const DEFAULT: FiltersState = { status: "all", source: "all", channelIds: [], amount: {}, onlyOverdue: false };

const FILTER_FIELDS: FilterField[] = [
  { key: "status", label: "状态", type: "select", options: [
    { value: "Pending", label: "Pending" }, { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" }, { value: "Rejected", label: "Rejected" },
  ]},
  { key: "source", label: "来源", type: "select", options: [
    { value: "Wallet (Internal)", label: "Wallet 内转" },
    { value: "External Direct", label: "外部直入" },
  ]},
  { key: "channelIds", label: "通道", type: "multiselect",
    options: tradingChannels.map((c) => ({ value: c.id, label: c.name })),
  },
  { key: "amount", label: "金额范围 (USD)", type: "range" },
  { key: "onlyOverdue", label: "仅显示超 SLA", type: "toggle" },
];

export default function TradingDepositsListPage() {
  const router = useRouter();
  const [rows] = useState<TradingDeposit[]>(mockTradingDeposits);
  const [filters, setFilters] = useState<FiltersState>(DEFAULT);
  const [search, setSearch] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const stats = useMemo(() => tradingDepositStats(rows), [rows]);
  const filtered = useMemo(() => rows.filter((r) => {
    if (filters.status !== "all" && r.status !== filters.status) return false;
    if (filters.source !== "all" && r.source !== filters.source) return false;
    if (filters.channelIds.length > 0 && (!r.channelId || !filters.channelIds.includes(r.channelId))) return false;
    if (filters.amount.min !== undefined && r.amountUsd < filters.amount.min) return false;
    if (filters.amount.max !== undefined && r.amountUsd > filters.amount.max) return false;
    if (filters.onlyOverdue && r.slaElapsedMinutes <= r.slaMinutes) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!`${r.id} ${r.client.id} ${r.client.name} ${r.mtAccount.id}`.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [rows, filters, search]);
  const patch = (p: Partial<FiltersState>) => setFilters((prev) => ({ ...prev, ...p }));

  const columns: Column<TradingDeposit>[] = [
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
    { key: "mt", title: "MT Account", minWidth: "150px", render: (r) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-mono text-slate-700">{r.mtAccount.id}</span>
        <span className="text-[11px] text-slate-500">{r.mtAccount.platform} · {r.mtAccount.accountType}</span>
      </div>
    ) },
    { key: "amount", title: "Amount", width: "120px", align: "right", render: (r) => (
      <div className="flex flex-col items-end">
        <span className="text-xs font-semibold text-slate-900 tabular-nums">{r.amount.toLocaleString()} {r.currency}</span>
        <span className="text-[11px] text-slate-500 tabular-nums">≈ ${r.amountUsd.toLocaleString()}</span>
      </div>
    ) },
    { key: "source", title: "Source", width: "150px", render: (r) => (
      <span className={cn("inline-flex items-center gap-1.5 text-xs",
        r.source === "External Direct" ? "text-orange-700" : "text-slate-700")}>
        {r.source === "External Direct" ? <ExternalLink className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
        {r.source}
      </span>
    ) },
    { key: "merchant", title: "Merchant · Order", minWidth: "160px", render: (r) => r.merchantName ? (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-slate-700">{r.merchantName}</span>
        <span className="text-[11px] font-mono text-slate-500">{r.merchantOrderId}</span>
      </div>
    ) : <span className="text-xs text-slate-400">Internal</span> },
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
    { key: "sla", title: "SLA", width: "100px", render: (r) => {
      if (r.status === "Completed" || r.status === "Rejected") return <span className="text-xs text-slate-400">—</span>;
      const left = r.slaMinutes - r.slaElapsedMinutes;
      if (left < 0) return <span className="text-xs text-red-700 tabular-nums">{Math.abs(left)}m over</span>;
      return <span className={cn("text-xs tabular-nums", left < 15 ? "text-orange-700" : "text-slate-500")}>{left}m left</span>;
    } },
  ];

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Funds" }, { label: "Trading Deposits" }]} />
      <PageHeader title="Trading Deposits" description="客户钱包/外部资金 → MT 账户 · 内转默认自动 · 直入需 Treasury 确认" />

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi label="Total" value={rows.length} icon={<ArrowDownCircle className="w-4 h-4 text-primary" />} onClick={() => setFilters(DEFAULT)} />
        <Kpi label="Pending" value={stats.pending} icon={<Clock className="w-4 h-4 text-amber-600" />} tone="warn" onClick={() => patch({ status: "Pending" })} active={filters.status === "Pending"} />
        <Kpi label="External Direct" value={stats.externalDirect} icon={<ExternalLink className="w-4 h-4 text-orange-600" />} onClick={() => patch({ source: "External Direct" })} active={filters.source === "External Direct"} />
        <Kpi label="Completed 24h" value={stats.completed24h} icon={<Zap className="w-4 h-4 text-emerald-600" />} onClick={() => patch({ status: "Completed" })} active={filters.status === "Completed"} />
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
        <Button variant="secondary" onClick={() => demoExport("交易账户存款")}><Download className="w-4 h-4" />Export</Button>
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
        <EnhancedDataTable<TradingDeposit>
          columns={columns} data={filtered} keyExtractor={(r) => r.id}
          pagination pageSize={20}
          onRowClick={(r) => router.push(`/crm/funds/trading-deposits/${r.id}`)}
          tableId="funds-trading-deposits"
          emptyText="无匹配的交易账户存款请求"
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
