"use client";

/** Transactions — unified ledger view (read-only). Aggregates all 5 flow types. */

import { useMemo, useState } from "react";
import { Download, SlidersHorizontal, ArrowRightLeft, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, EnhancedDataTable, type Column } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { mockWalletDeposits } from "@/lib/mock/funds/v2/deposits-wallet";
import { mockWalletWithdrawals } from "@/lib/mock/funds/v2/withdrawals-wallet";
import { mockTradingDeposits } from "@/lib/mock/funds/v2/deposits-trading";
import { mockTradingWithdrawals } from "@/lib/mock/funds/v2/withdrawals-trading";
import { mockTransfers } from "@/lib/mock/funds/v2/transfers";
import { demoExport, demoAction } from "@/components/crm/funds/use-funds-toast";

type TxnType = "Wallet Deposit" | "Wallet Withdrawal" | "Trading Deposit" | "Trading Withdrawal" | "Transfer";

interface UnifiedTxn {
  id: string;
  type: TxnType;
  client: string;
  clientId: string;
  amount: number;
  currency: string;
  amountUsd: number;
  channel: string;
  merchant?: string;
  merchantOrderId?: string;
  status: string;
  decision: "Auto" | "Manual";
  riskLevel: string;
  submittedAt: string;
  href: string;
}

function buildUnified(): UnifiedTxn[] {
  const all: UnifiedTxn[] = [];
  mockWalletDeposits.forEach((r) => all.push({
    id: r.id, type: "Wallet Deposit", client: r.client.name, clientId: r.client.id,
    amount: r.amount, currency: r.currency, amountUsd: r.amountUsd,
    channel: r.channelId, merchant: r.merchantName, merchantOrderId: r.merchantOrderId,
    status: r.status, decision: r.matchMethod.startsWith("Auto") ? "Auto" : "Manual",
    riskLevel: r.riskLevel, submittedAt: r.submittedAt,
    href: `/crm/funds/wallet-deposits/${r.id}`,
  }));
  mockWalletWithdrawals.forEach((r) => all.push({
    id: r.id, type: "Wallet Withdrawal", client: r.client.name, clientId: r.client.id,
    amount: r.amount, currency: r.currency, amountUsd: r.amountUsd,
    channel: r.channelId, merchant: r.merchantName, merchantOrderId: r.merchantOrderId,
    status: r.status, decision: "Manual", riskLevel: r.riskLevel,
    submittedAt: r.submittedAt, href: `/crm/funds/wallet-withdrawals/${r.id}`,
  }));
  mockTradingDeposits.forEach((r) => all.push({
    id: r.id, type: "Trading Deposit", client: r.client.name, clientId: r.client.id,
    amount: r.amount, currency: r.currency, amountUsd: r.amountUsd,
    channel: r.channelId || "Internal", merchant: r.merchantName, merchantOrderId: r.merchantOrderId,
    status: r.status, decision: r.source === "Wallet (Internal)" ? "Auto" : "Manual",
    riskLevel: r.riskLevel, submittedAt: r.submittedAt,
    href: `/crm/funds/trading-deposits/${r.id}`,
  }));
  mockTradingWithdrawals.forEach((r) => all.push({
    id: r.id, type: "Trading Withdrawal", client: r.client.name, clientId: r.client.id,
    amount: r.amount, currency: r.currency, amountUsd: r.amountUsd,
    channel: r.channelId || "Internal", merchant: r.merchantName, merchantOrderId: r.merchantOrderId,
    status: r.status, decision: "Manual", riskLevel: r.riskLevel,
    submittedAt: r.submittedAt, href: `/crm/funds/trading-withdrawals/${r.id}`,
  }));
  mockTransfers.forEach((r) => all.push({
    id: r.id, type: "Transfer", client: r.fromClient.name, clientId: r.fromClient.id,
    amount: r.amount, currency: r.currency, amountUsd: r.amountUsd,
    channel: r.scenario, status: r.status, decision: "Manual",
    riskLevel: r.riskLevel, submittedAt: r.submittedAt,
    href: `/crm/funds/transfers/${r.id}`,
  }));
  return all.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export default function TransactionsPage() {
  const [data] = useState(() => buildUnified());
  const [type, setType] = useState<TxnType | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => data.filter((r) => {
    if (type !== "all" && r.type !== type) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!`${r.id} ${r.clientId} ${r.client} ${r.merchant || ""} ${r.merchantOrderId || ""}`.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [data, type, search]);

  const cols: Column<UnifiedTxn>[] = [
    { key: "id", title: "Txn ID", width: "150px", render: (r) => (
      <a href={r.href} className="text-xs font-mono text-primary hover:underline">{r.id}</a>
    ) },
    { key: "type", title: "Type", width: "150px", render: (r) => {
      const Icon = r.type.includes("Deposit") ? ArrowDownCircle : r.type.includes("Withdrawal") ? ArrowUpCircle : ArrowRightLeft;
      const tone = r.type.includes("Deposit") ? "text-emerald-700" : r.type.includes("Withdrawal") ? "text-orange-700" : "text-blue-700";
      return <span className={cn("inline-flex items-center gap-1.5 text-xs", tone)}><Icon className="w-3 h-3" />{r.type}</span>;
    } },
    { key: "client", title: "Client", minWidth: "180px", render: (r) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-slate-800">{r.client}</span>
        <span className="text-[11px] font-mono text-slate-500">{r.clientId}</span>
      </div>
    ) },
    { key: "amount", title: "Amount", width: "140px", align: "right", render: (r) => (
      <div className="flex flex-col items-end">
        <span className="text-xs font-semibold tabular-nums">{r.amount.toLocaleString()} {r.currency}</span>
        <span className="text-[11px] text-slate-500 tabular-nums">≈ ${r.amountUsd.toLocaleString()}</span>
      </div>
    ) },
    { key: "channel", title: "Channel", width: "150px", render: (r) => <span className="text-xs text-slate-700">{r.channel}</span> },
    { key: "merchant", title: "Merchant · Order", minWidth: "180px", render: (r) => r.merchant ? (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-slate-700">{r.merchant}</span>
        <span className="text-[11px] font-mono text-slate-500">{r.merchantOrderId || "—"}</span>
      </div>
    ) : <span className="text-xs text-slate-400">—</span> },
    { key: "decision", title: "Lane", width: "100px", render: (r) => <span className="text-xs">{r.decision}</span> },
    { key: "status", title: "Status", width: "130px", render: (r) => <span className="text-xs text-slate-700">{r.status}</span> },
    { key: "risk", title: "Risk", width: "90px", render: (r) => <span className="text-xs">{r.riskLevel}</span> },
    { key: "submitted", title: "Time", width: "160px", render: (r) => <span className="text-xs text-slate-500 font-mono">{new Date(r.submittedAt).toLocaleString()}</span> },
  ];

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Funds" }, { label: "Transactions" }]} />
      <PageHeader title="Transactions" description="统一资金流水中心 (ledger 视图，只读)"
        actions={<Button variant="secondary" onClick={() => demoExport("资金流水")}><Download className="w-4 h-4" />Export</Button>}
      />
      <div className="flex items-center gap-2">
        <div className="relative w-80">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索 Txn ID / 客户 / Merchant Order..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <select value={type} onChange={(e) => setType(e.target.value as any)}
          className="h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white">
          <option value="all">All Types</option>
          <option>Wallet Deposit</option><option>Wallet Withdrawal</option>
          <option>Trading Deposit</option><option>Trading Withdrawal</option>
          <option>Transfer</option>
        </select>
        <div className="flex-1" />
        <Button variant="secondary" onClick={() => demoAction("打开高级筛选")}>
          <SlidersHorizontal className="w-4 h-4" />高级筛选
        </Button>
      </div>
      <Card padding="none">
        <EnhancedDataTable<UnifiedTxn> columns={cols} data={filtered} keyExtractor={(r) => `${r.type}-${r.id}`}
          pagination pageSize={30} tableId="funds-transactions" emptyText="无流水" />
      </Card>
    </div>
  );
}
