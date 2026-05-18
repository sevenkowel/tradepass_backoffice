"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Snowflake, Download, History as HistoryIcon } from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, EnhancedDataTable, type Column } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { clients, KYC_TIER_FG, RISK_FG, type ClientLite } from "@/lib/mock/funds/v2/entities";
import { actionDone, demoExport } from "@/components/crm/funds/use-funds-toast";

interface WalletRow {
  client: ClientLite;
  real: number;
  bonus: number;
  credit: number;
  reward: number;
  frozen: number;
  status: "Active" | "Frozen";
  statusReason?: string;
}

const ROWS: WalletRow[] = [
  { client: clients[0],  real: 15_800, bonus: 300,  credit: 0,    reward: 75,  frozen: 5_000, status: "Active", statusReason: "Pending withdrawal lock $5,000" },
  { client: clients[1],  real: 2_400,  bonus: 50,   credit: 0,    reward: 0,   frozen: 0,     status: "Active" },
  { client: clients[2],  real: 7_000,  bonus: 0,    credit: 0,    reward: 0,   frozen: 7_000, status: "Frozen", statusReason: "AML hit on WW-2026-0003" },
  { client: clients[3],  real: 3_500,  bonus: 0,    credit: 0,    reward: 0,   frozen: 1_200, status: "Active", statusReason: "Withdrawal processing $1,200" },
  { client: clients[4],  real: 5_000,  bonus: 200,  credit: 0,    reward: 0,   frozen: 4_900, status: "Active" },
  { client: clients[5],  real: 2_300,  bonus: 0,    credit: 0,    reward: 0,   frozen: 2_200, status: "Frozen", statusReason: "Fast-In-Out trigger" },
  { client: clients[6],  real: 12_000, bonus: 0,    credit: 0,    reward: 250, frozen: 0,     status: "Active" },
  { client: clients[7],  real: 700,    bonus: 30,   credit: 0,    reward: 0,   frozen: 0,     status: "Active" },
  { client: clients[8],  real: 0,      bonus: 320,  credit: 0,    reward: 0,   frozen: 0,     status: "Active" },
  { client: clients[9],  real: 3_100,  bonus: 0,    credit: 500,  reward: 0,   frozen: 3_000, status: "Active" },
];

export default function WalletsPage() {
  const [search, setSearch] = useState("");
  const [rowsState, setRowsState] = useState<WalletRow[]>(ROWS);

  const toggleFreeze = (clientId: string) => {
    setRowsState((prev) => prev.map((r) => {
      if (r.client.id !== clientId) return r;
      const next: WalletRow = {
        ...r,
        status: r.status === "Frozen" ? "Active" : "Frozen",
        statusReason: r.status === "Frozen" ? undefined : "由运营手动冻结",
      };
      actionDone(r.status === "Frozen" ? `${r.client.name} 钱包已解冻` : `${r.client.name} 钱包已冻结`);
      return next;
    }));
  };

  const filtered = useMemo(() => rowsState.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return `${r.client.id} ${r.client.name}`.toLowerCase().includes(q);
  }), [rowsState, search]);

  const totals = {
    real: rowsState.reduce((s, r) => s + r.real, 0),
    bonus: rowsState.reduce((s, r) => s + r.bonus, 0),
    frozen: rowsState.reduce((s, r) => s + r.frozen, 0),
  };

  const cols: Column<WalletRow>[] = [
    { key: "client", title: "Client", minWidth: "220px", render: (r) => (
      <Link href={`/crm/clients/${r.client.id}`} className="flex flex-col gap-0.5 hover:underline">
        <span className="text-xs font-medium text-slate-800">{r.client.name}</span>
        <span className="text-[11px] text-slate-500">
          <span className="font-mono">{r.client.id}</span>
          <span className="mx-1.5">·</span>
          <span className={KYC_TIER_FG[r.client.kycTier].text}>{r.client.kycTier}</span>
          <span className="mx-1.5">·</span>
          {r.client.country}
        </span>
      </Link>
    ) },
    { key: "real",   title: "Real",   align: "right", width: "130px", render: (r) => (
      <div className="flex flex-col items-end">
        <span className="text-xs font-semibold tabular-nums">${r.real.toLocaleString()}</span>
        {r.frozen > 0 && <span className="text-[11px] text-red-600 tabular-nums">-${r.frozen.toLocaleString()} frozen</span>}
      </div>
    ) },
    { key: "bonus",  title: "Bonus",  align: "right", width: "110px", render: (r) => <span className="text-xs tabular-nums">{r.bonus > 0 ? `$${r.bonus.toLocaleString()}` : "—"}</span> },
    { key: "credit", title: "Credit", align: "right", width: "110px", render: (r) => <span className="text-xs tabular-nums">{r.credit > 0 ? `$${r.credit.toLocaleString()}` : "—"}</span> },
    { key: "reward", title: "Reward", align: "right", width: "110px", render: (r) => <span className="text-xs tabular-nums">{r.reward > 0 ? `$${r.reward.toLocaleString()}` : "—"}</span> },
    { key: "risk", title: "Risk", width: "90px", render: (r) => {
      const c = RISK_FG[r.client.risk];
      return <span className={cn("inline-flex items-center gap-1.5 text-xs", c.text)}><span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />{r.client.risk}</span>;
    } },
    { key: "status", title: "Status", width: "180px", render: (r) => {
      const tone = r.status === "Frozen" ? "text-red-700" : "text-emerald-700";
      const dot  = r.status === "Frozen" ? "bg-red-500"   : "bg-emerald-500";
      return (
        <div className="flex flex-col gap-0.5">
          <span className={cn("inline-flex items-center gap-1.5 text-xs", tone)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />{r.status}
          </span>
          {r.statusReason && <span className="text-[11px] text-slate-500 truncate">{r.statusReason}</span>}
        </div>
      );
    } },
    { key: "actions", title: "", width: "180px", render: (r) => (
      <div className="flex gap-1">
        <Button size="sm" variant="secondary" onClick={() => toggleFreeze(r.client.id)}>
          <Snowflake className="w-3.5 h-3.5" />{r.status === "Frozen" ? "Unfreeze" : "Freeze"}
        </Button>
        <Link href={`/crm/funds/transactions?client=${r.client.id}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
          <HistoryIcon className="w-3.5 h-3.5" />Txns
        </Link>
      </div>
    ) },
  ];

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Funds" }, { label: "Wallets" }]} />
      <PageHeader title="Wallets" description="客户钱包矩阵 (Real / Bonus / Credit / Reward)"
        actions={<Button variant="secondary" onClick={() => demoExport("钱包矩阵")}><Download className="w-4 h-4" />Export</Button>}
      />
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
        <Card className="!p-3"><p className="text-xs text-slate-500">Total Real Balance</p><p className="text-xl font-semibold text-emerald-700 tabular-nums mt-0.5">${totals.real.toLocaleString()}</p></Card>
        <Card className="!p-3"><p className="text-xs text-slate-500">Total Bonus</p><p className="text-xl font-semibold text-violet-700 tabular-nums mt-0.5">${totals.bonus.toLocaleString()}</p></Card>
        <Card className="!p-3"><p className="text-xs text-slate-500">Total Frozen</p><p className="text-xl font-semibold text-red-700 tabular-nums mt-0.5">${totals.frozen.toLocaleString()}</p></Card>
        <Card className="!p-3"><p className="text-xs text-slate-500">Zero-balance Clients</p><p className="text-xl font-semibold tabular-nums mt-0.5">{ROWS.filter((r) => r.real + r.bonus + r.credit + r.reward === 0).length}</p></Card>
      </div>
      <div className="flex items-center gap-2">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索 客户..."
          className="w-80 h-9 px-3 rounded-lg border border-slate-200 text-sm" />
      </div>
      <Card padding="none">
        <EnhancedDataTable<WalletRow> columns={cols} data={filtered} keyExtractor={(r) => r.client.id} tableId="funds-wallets" />
      </Card>
    </div>
  );
}
