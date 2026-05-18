"use client";

/**
 * Wallet Withdrawals — list page (v2.2)
 *
 * Client → External (Bank/Crypto/E-Wallet) withdrawals.
 *
 * Layout follows Client List spec:
 *   Breadcrumb → KPI strip (clickable) → single-row Toolbar →
 *   EnhancedDataTable → full-screen detail page on click
 *
 * Spec: docscc/产品文档/2026-05-17-funds-module-design-v2.1.md §6.2 / §9
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpCircle, Clock, AlertTriangle, ShieldAlert, Download,
  SlidersHorizontal,
} from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, EnhancedDataTable, type Column } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  mockWalletWithdrawals, walletWithdrawalStats,
  type WalletWithdrawal,
} from "@/lib/mock/funds/v2/withdrawals-wallet";
import {
  STATUS_FG, currentStep,
  type MoneyRequestStatus,
} from "@/lib/mock/funds/v2/approvals";
import { RISK_FG, KYC_TIER_FG } from "@/lib/mock/funds/v2/entities";
import { channelById, CHANNEL_CATEGORY_FG, walletChannels } from "@/lib/mock/funds/v2/channels";
import { FundsFilterDrawer, type FilterField } from "@/components/crm/funds/FundsFilterDrawer";
import { demoExport } from "@/components/crm/funds/use-funds-toast";

/* AML chip colors local to this list (small inline map). */
const AML_FG = {
  Pass:    { text: "text-emerald-700", dot: "bg-emerald-500" },
  Hit:     { text: "text-red-700",     dot: "bg-red-500"     },
  Pending: { text: "text-slate-600",   dot: "bg-slate-400"   },
} as const;

interface KpiCardDef {
  key: string;
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone?: "error" | "warn" | "info";
  /** Filter patch to apply on click. */
  apply: Partial<FiltersState> | null;
}

interface FiltersState {
  status: MoneyRequestStatus | "all";
  risk: "Critical" | "High" | "Medium" | "Low" | "all";
  aml: "Pass" | "Hit" | "Pending" | "all";
  channelIds: string[];
  amount: { min?: number; max?: number };
  onlyMine: boolean;
  onlyOverdue: boolean;
  onlyAmlHit: boolean;
}

const DEFAULT_FILTERS: FiltersState = {
  status: "all", risk: "all", aml: "all",
  channelIds: [], amount: {},
  onlyMine: false, onlyOverdue: false, onlyAmlHit: false,
};

const FILTER_FIELDS: FilterField[] = [
  { key: "status", label: "状态", type: "select", options: [
    { value: "Pending", label: "Pending" }, { value: "In Progress", label: "In Progress" },
    { value: "On Hold", label: "On Hold" }, { value: "Completed", label: "Completed" },
    { value: "Rejected", label: "Rejected" },
  ]},
  { key: "risk", label: "风险等级", type: "select", options: [
    { value: "Critical", label: "Critical" }, { value: "High", label: "High" },
    { value: "Medium", label: "Medium" }, { value: "Low", label: "Low" },
  ]},
  { key: "aml", label: "AML 状态", type: "select", options: [
    { value: "Pass", label: "Pass" }, { value: "Hit", label: "Hit" }, { value: "Pending", label: "Pending" },
  ]},
  { key: "channelIds", label: "通道", type: "multiselect",
    options: walletChannels.map((c) => ({ value: c.id, label: c.name })),
  },
  { key: "amount", label: "金额范围 (USD)", type: "range", rangeHint: "$0 - $100k" },
  { key: "onlyOverdue", label: "仅显示超 SLA", type: "toggle" },
  { key: "onlyAmlHit",  label: "仅显示 AML 命中", type: "toggle" },
];

export default function WalletWithdrawalsListPage() {
  const router = useRouter();
  const [rows] = useState<WalletWithdrawal[]>(mockWalletWithdrawals);
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const stats = useMemo(() => walletWithdrawalStats(rows), [rows]);

  /* KPI strip — 6 clickable cards (client-list pattern). */
  const kpis: KpiCardDef[] = [
    { key: "total",     label: "Total",       value: rows.length,           icon: <ArrowUpCircle className="w-4 h-4 text-primary" />,
      apply: { status: "all", risk: "all", aml: "all", onlyMine: false, onlyOverdue: false, onlyAmlHit: false } },
    { key: "pending",   label: "Pending",     value: stats.pending,         icon: <Clock className="w-4 h-4 text-amber-600" />,         tone: "warn",
      apply: { status: "Pending" } },
    { key: "onhold",    label: "On Hold",     value: stats.onHold,          icon: <Clock className="w-4 h-4 text-slate-600" />,
      apply: { status: "On Hold" } },
    { key: "critical",  label: "Critical",    value: stats.critical,        icon: <AlertTriangle className="w-4 h-4 text-red-600" />,    tone: "error",
      apply: { risk: "Critical" } },
    { key: "amlhits",   label: "AML Hits",    value: stats.amlHits,         icon: <ShieldAlert className="w-4 h-4 text-red-600" />,      tone: "error",
      apply: { onlyAmlHit: true } },
    { key: "overdue",   label: "Overdue SLA", value: stats.overdue,         icon: <Clock className="w-4 h-4 text-orange-600" />,         tone: "warn",
      apply: { onlyOverdue: true } },
  ];

  /* Filtering pipeline. */
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filters.status !== "all" && r.status !== filters.status) return false;
      if (filters.risk   !== "all" && r.riskLevel !== filters.risk) return false;
      if (filters.aml    !== "all" && r.aml !== filters.aml) return false;
      if (filters.channelIds.length > 0 && !filters.channelIds.includes(r.channelId)) return false;
      if (filters.amount.min !== undefined && r.amountUsd < filters.amount.min) return false;
      if (filters.amount.max !== undefined && r.amountUsd > filters.amount.max) return false;
      if (filters.onlyOverdue && r.slaElapsedMinutes <= r.slaMinutes) return false;
      if (filters.onlyAmlHit  && r.aml !== "Hit") return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${r.id} ${r.client.id} ${r.client.name} ${r.merchantName} ${r.merchantOrderId || ""} ${r.beneficiary.label}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, filters, search]);

  /* Columns. */
  const columns: Column<WalletWithdrawal>[] = [
    {
      key: "id", title: "Request", width: "150px", hideable: false,
      render: (r) => <span className="text-xs font-mono text-primary">{r.id}</span>,
    },
    {
      key: "client", title: "Client", minWidth: "200px",
      render: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-slate-800">{r.client.name}</span>
          <span className="text-[11px] text-slate-500">
            <span className="font-mono">{r.client.id}</span>
            <span className="mx-1.5">·</span>
            <span className={KYC_TIER_FG[r.client.kycTier].text}>{r.client.kycTier}</span>
            <span className="mx-1.5">·</span>
            <span>{r.client.country}</span>
          </span>
        </div>
      ),
    },
    {
      key: "amount", title: "Amount", width: "130px", align: "right",
      render: (r) => (
        <div className="flex flex-col items-end">
          <span className="text-xs font-semibold text-slate-900 tabular-nums">
            {r.amount.toLocaleString()} {r.currency}
          </span>
          <span className="text-[11px] text-slate-500 tabular-nums">≈ ${r.amountUsd.toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: "method", title: "Payout Method", minWidth: "200px",
      render: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-700">{r.beneficiary.label}</span>
          <span className="text-[11px] text-slate-500">{r.beneficiary.type}</span>
        </div>
      ),
    },
    {
      key: "channel", title: "Channel", width: "140px",
      render: (r) => {
        const ch = channelById(r.channelId);
        if (!ch) return <span className="text-xs text-slate-400">{r.channelId}</span>;
        const cat = CHANNEL_CATEGORY_FG[ch.category];
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-700">{ch.name}</span>
            <span className={cn("inline-flex items-center gap-1 text-[11px]", cat.text)}>
              <span className={cn("w-1 h-1 rounded-full", cat.dot)} aria-hidden />
              {ch.category}
            </span>
          </div>
        );
      },
    },
    {
      key: "merchant", title: "Merchant · Order", minWidth: "180px",
      render: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-700">{r.merchantName}</span>
          <span className="text-[11px] font-mono text-slate-500">{r.merchantOrderId || "—"}</span>
        </div>
      ),
    },
    {
      key: "fee", title: "Fee", width: "100px", align: "right",
      render: (r) => (
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-700 tabular-nums">${r.fee.amount}</span>
          <span className="text-[11px] text-slate-500">{r.fee.paidBy}</span>
        </div>
      ),
    },
    {
      key: "status", title: "Status", width: "130px",
      render: (r) => {
        const s = STATUS_FG[r.status];
        const cs = currentStep(r.steps);
        return (
          <div className="flex flex-col gap-0.5">
            <span className={cn("inline-flex items-center gap-1.5 text-xs", s.text)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} aria-hidden />
              {r.status}
            </span>
            {cs && (
              <span className="text-[11px] text-slate-500 truncate">
                @ {cs.role}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "risk", title: "Risk", width: "90px",
      render: (r) => {
        const c = RISK_FG[r.riskLevel];
        return (
          <span className={cn("inline-flex items-center gap-1.5 text-xs", c.text)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} aria-hidden />
            {r.riskLevel}
          </span>
        );
      },
    },
    {
      key: "aml", title: "AML", width: "90px",
      render: (r) => {
        const c = AML_FG[r.aml];
        return (
          <span className={cn("inline-flex items-center gap-1.5 text-xs", c.text)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} aria-hidden />
            {r.aml}
          </span>
        );
      },
    },
    {
      key: "sla", title: "SLA", width: "100px",
      render: (r) => {
        if (r.status === "Completed" || r.status === "Rejected" || r.status === "Cancelled") {
          return <span className="text-xs text-slate-400">—</span>;
        }
        const left = r.slaMinutes - r.slaElapsedMinutes;
        if (left < 0) return <span className="text-xs text-red-700 tabular-nums">{Math.abs(left)}m over</span>;
        if (left < 15) return <span className="text-xs text-orange-700 tabular-nums">{left}m left</span>;
        return <span className="text-xs text-slate-500 tabular-nums">{left}m left</span>;
      },
    },
  ];

  /* Advanced filter count. */
  const advancedCount = [
    filters.status !== "all",
    filters.risk   !== "all",
    filters.aml    !== "all",
    filters.channelIds.length > 0,
    filters.amount.min !== undefined || filters.amount.max !== undefined,
    filters.onlyMine,
    filters.onlyOverdue,
    filters.onlyAmlHit,
  ].filter(Boolean).length;

  const patchFilters = (p: Partial<FiltersState>) => setFilters((prev) => ({ ...prev, ...p }));

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Funds" }, { label: "Wallet Withdrawals" }]} />

      <PageHeader
        title="Wallet Withdrawals"
        description="客户从钱包到外部 · 3 步审批 (Finance → Compliance → Treasury)"
      />

      {/* KPI strip — clickable */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(({ key, ...rest }) => (
          <KpiCard key={key} k={key} {...rest}
            active={
              (key === "pending"  && filters.status === "Pending")  ||
              (key === "onhold"   && filters.status === "On Hold")  ||
              (key === "critical" && filters.risk === "Critical")   ||
              (key === "amlhits"  && filters.onlyAmlHit)            ||
              (key === "overdue"  && filters.onlyOverdue)
            }
            onClick={() => rest.apply && patchFilters(rest.apply)}
          />
        ))}
      </div>

      {/* Toolbar — single row */}
      <div className="flex items-center gap-2">
        <div className="relative w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索 Request ID / 客户 / Merchant Order..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        {/* Quick chips */}
        <button
          onClick={() => patchFilters({ status: filters.status === "Pending" ? "all" : "Pending" })}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 h-9 text-xs font-medium rounded-lg border transition-colors",
            filters.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-300" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          )}
        >
          Pending {stats.pending}
        </button>
        <button
          onClick={() => patchFilters({ onlyAmlHit: !filters.onlyAmlHit })}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 h-9 text-xs font-medium rounded-lg border transition-colors",
            filters.onlyAmlHit ? "bg-red-50 text-red-700 border-red-300" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          )}
        >
          AML Hit {stats.amlHits}
        </button>
        <button
          onClick={() => patchFilters({ onlyOverdue: !filters.onlyOverdue })}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 h-9 text-xs font-medium rounded-lg border transition-colors",
            filters.onlyOverdue ? "bg-orange-50 text-orange-700 border-orange-300" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          )}
        >
          Overdue {stats.overdue}
        </button>

        <div className="flex-1" />

        <Button
          variant="secondary"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className={cn(advancedCount > 0 && "ring-2 ring-blue-200")}
        >
          <SlidersHorizontal className="w-4 h-4" />
          高级筛选
          {advancedCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-blue-100 text-primary text-[10px] font-semibold">
              {advancedCount}
            </span>
          )}
        </Button>
        <Button variant="secondary" onClick={() => demoExport("钱包出金列表")}><Download className="w-4 h-4" />Export</Button>
      </div>

      <FundsFilterDrawer
        open={advancedOpen}
        onClose={() => setAdvancedOpen(false)}
        fields={FILTER_FIELDS}
        values={filters as unknown as Record<string, unknown>}
        onChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v as never }))}
        onApply={() => setAdvancedOpen(false)}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* Table */}
      <Card padding="none">
        <EnhancedDataTable<WalletWithdrawal>
          columns={columns}
          data={filtered}
          keyExtractor={(r) => r.id}
          pagination pageSize={20}
          onRowClick={(r) => router.push(`/crm/funds/wallet-withdrawals/${r.id}`)}
          tableId="funds-wallet-withdrawals"
          emptyText="无匹配的钱包出金请求"
        />
      </Card>
    </div>
  );
}

/* ── KpiCard ──────────────────────────────────────────────────── */

function KpiCard({
  label, value, icon, tone, onClick, active, k: _k, apply: _apply,
}: Omit<KpiCardDef, "key"> & { k: string; onClick?: () => void; active?: boolean }) {
  const accent =
    tone === "error" ? "border-red-100"    :
    tone === "warn"  ? "border-amber-100"  :
                       "border-slate-200";
  return (
    <button onClick={onClick} className="text-left w-full">
      <Card className={cn("!p-3 hover:shadow-md transition-shadow", accent, active && "ring-2 ring-blue-200")}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">{icon}</div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 truncate">{label}</p>
            <p className="text-lg font-semibold text-slate-900 tabular-nums mt-0.5">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          </div>
        </div>
      </Card>
    </button>
  );
}

