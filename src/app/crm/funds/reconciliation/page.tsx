"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Link2, AlertTriangle, CheckCircle2, Download, FileText,
} from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, EnhancedDataTable, type Column } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { demoExport } from "@/components/crm/funds/use-funds-toast";

type Tab = "internal" | "external" | "reports";

interface MTReconRow {
  id: string;
  date: string;
  txn: string;
  crmAmount: number;
  mtAmount: number;
  delta: number;
  status: "Auto Matched" | "Manual Matched" | "Unmatched" | "Disputed";
  note?: string;
}

interface PSPReconRow {
  id: string;
  channel: string;
  pspRef: string;
  pspAmount: number;
  crmRef?: string;
  crmAmount?: number;
  delta: number;
  status: "Auto Matched" | "Manual Matched" | "Unmatched" | "Disputed";
  note?: string;
}

interface DailyReportRow {
  channel: string;
  depositCount: number;
  depositAmount: number;
  withdrawalCount: number;
  withdrawalAmount: number;
  netFlow: number;
  successRate: number;
}

const MT_RECON: MTReconRow[] = [
  { id: "MR-1001", date: "2026-05-17", txn: "TD-2026-0001", crmAmount: 500,   mtAmount: 500,   delta: 0,   status: "Auto Matched" },
  { id: "MR-1002", date: "2026-05-17", txn: "TW-2026-0003", crmAmount: 25000, mtAmount: 25000, delta: 0,   status: "Auto Matched" },
  { id: "MR-1003", date: "2026-05-17", txn: "TD-2026-0003", crmAmount: 5000,  mtAmount: 5000,  delta: 0,   status: "Auto Matched" },
  { id: "MR-1004", date: "2026-05-17", txn: "TD-2026-0005", crmAmount: 5000,  mtAmount: 0,     delta: 5000,status: "Disputed",   note: "MT5 push failed (account suspended); offset adjustment posted" },
  { id: "MR-1005", date: "2026-05-17", txn: "TW-2026-0005", crmAmount: 2500,  mtAmount: 0,     delta: 2500,status: "Unmatched",  note: "Auto-rejected by margin policy; client refunded via wallet credit" },
];

const PSP_RECON: PSPReconRow[] = [
  { id: "PR-1001", channel: "Bank Wire",       pspRef: "WISE-X100A29", pspAmount: 15000, crmRef: "WW-2026-0001", crmAmount: 15000, delta: 0,    status: "Auto Matched" },
  { id: "PR-1002", channel: "USDT TRC20",      pspRef: "TRX-9988A12",  pspAmount: 800,   crmRef: "WW-2026-0002", crmAmount: 800,   delta: 0,    status: "Auto Matched" },
  { id: "PR-1003", channel: "DOKU IDR",        pspRef: "DOKU-X1A29",   pspAmount: 500,   crmRef: "WD-2026-0005", crmAmount: 500,   delta: 0,    status: "Auto Matched" },
  { id: "PR-1004", channel: "Bank Wire",       pspRef: "CHASE-99201",  pspAmount: 4800,                                       delta: 4800, status: "Unmatched", note: "Bank credit with memo 'transfer' — no UID match" },
  { id: "PR-1005", channel: "DOKU IDR",        pspRef: "DOKU-X1A30",   pspAmount: 1200,  crmRef: "WD-2026-0004", crmAmount: 1300, delta: -100,  status: "Disputed",   note: "PSP statement shows $100 less than internal — raised DOKU ticket #2244" },
  { id: "PR-1006", channel: "USDT ERC20",      pspRef: "0xff992...77cc", pspAmount: 80000, crmRef: "WD-2026-0004", crmAmount: 80000, delta: 0,  status: "Auto Matched" },
];

const DAILY: DailyReportRow[] = [
  { channel: "DOKU IDR",       depositCount: 12, depositAmount: 412_000, withdrawalCount: 4,  withdrawalAmount: 28_000, netFlow: 384_000,  successRate: 98.4 },
  { channel: "USDT TRC20",     depositCount: 89, depositAmount: 880_000, withdrawalCount: 43, withdrawalAmount: 560_000, netFlow: 320_000, successRate: 99.1 },
  { channel: "USDT ERC20",     depositCount: 7,  depositAmount: 210_000, withdrawalCount: 3,  withdrawalAmount: 84_000,  netFlow: 126_000, successRate: 92.0 },
  { channel: "Bank Wire",      depositCount: 38, depositAmount: 540_000, withdrawalCount: 18, withdrawalAmount: 210_000, netFlow: 330_000, successRate: 86.3 },
  { channel: "PIX BRL",        depositCount: 22, depositAmount: 240_000, withdrawalCount: 9,  withdrawalAmount: 78_000,  netFlow: 162_000, successRate: 98.9 },
  { channel: "Visa Card",      depositCount: 15, depositAmount: 180_000, withdrawalCount: 0,  withdrawalAmount: 0,        netFlow: 180_000, successRate: 96.7 },
];

const STATUS_FG = {
  "Auto Matched":   { text: "text-emerald-700", dot: "bg-emerald-500" },
  "Manual Matched": { text: "text-blue-700",    dot: "bg-blue-500"    },
  "Unmatched":      { text: "text-red-700",     dot: "bg-red-500"     },
  "Disputed":       { text: "text-amber-700",   dot: "bg-amber-500"   },
} as const;

export default function ReconciliationPage() {
  const [tab, setTab] = useState<Tab>("internal");

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Funds" }, { label: "Reconciliation" }]} />
      <PageHeader title="Reconciliation" description="3 步标准对账流程：内部 (CRM ↔ MT) → 外部 (CRM ↔ PSP) → 日/周/月报"
        actions={<Button variant="secondary" onClick={() => demoExport("对账记录")}><Download className="w-4 h-4" />Export</Button>}
      />

      <div className="flex items-center gap-1 border-b border-slate-200">
        <TabBtn label="① 内部对账 (CRM ↔ MT)" active={tab === "internal"} onClick={() => setTab("internal")} />
        <TabBtn label="② 外部对账 (CRM ↔ PSP)" active={tab === "external"} onClick={() => setTab("external")} />
        <TabBtn label="③ 报表 (日/周/月)" active={tab === "reports"} onClick={() => setTab("reports")} />
      </div>

      {tab === "internal" && <InternalTab />}
      {tab === "external" && <ExternalTab />}
      {tab === "reports" && <ReportsTab />}
    </div>
  );
}

function InternalTab() {
  const cols: Column<MTReconRow>[] = [
    { key: "id", title: "Recon ID", width: "110px", render: (r) => <span className="text-xs font-mono text-primary">{r.id}</span> },
    { key: "date", title: "Date", width: "110px", render: (r) => <span className="text-xs">{r.date}</span> },
    { key: "txn", title: "Internal Txn", width: "160px", render: (r) => <span className="text-xs font-mono">{r.txn}</span> },
    { key: "crm", title: "CRM Amount", width: "120px", align: "right", render: (r) => <span className="text-xs tabular-nums">${r.crmAmount.toLocaleString()}</span> },
    { key: "mt",  title: "MT Amount",  width: "120px", align: "right", render: (r) => <span className="text-xs tabular-nums">${r.mtAmount.toLocaleString()}</span> },
    { key: "delta", title: "Δ", width: "100px", align: "right", render: (r) => {
      if (r.delta === 0) return <span className="text-xs text-emerald-700 tabular-nums">$0</span>;
      return <span className="text-xs tabular-nums text-red-700">${r.delta.toLocaleString()}</span>;
    } },
    { key: "status", title: "Status", width: "140px", render: (r) => {
      const s = STATUS_FG[r.status];
      return <span className={cn("inline-flex items-center gap-1.5 text-xs", s.text)}><span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />{r.status}</span>;
    } },
    { key: "note", title: "Note", minWidth: "240px", render: (r) => <span className="text-xs text-slate-500">{r.note || "—"}</span> },
  ];
  return (
    <Card padding="none">
      <div className="px-4 py-3 border-b border-slate-100 text-xs text-slate-600">
        第一步：先确保 CRM 钱包/账户流水与 MT5 Manager 数据一致。差异源于 broker 内部失误（推送失败、状态不一致等）。
      </div>
      <EnhancedDataTable<MTReconRow> columns={cols} data={MT_RECON} keyExtractor={(r) => r.id} tableId="funds-recon-mt" emptyText="无对账记录" />
    </Card>
  );
}

function ExternalTab() {
  const cols: Column<PSPReconRow>[] = [
    { key: "id", title: "Recon ID", width: "110px", render: (r) => <span className="text-xs font-mono text-primary">{r.id}</span> },
    { key: "channel", title: "Channel", width: "140px", render: (r) => <span className="text-xs">{r.channel}</span> },
    { key: "pspRef", title: "PSP Ref", minWidth: "180px", render: (r) => <span className="text-xs font-mono text-slate-700">{r.pspRef}</span> },
    { key: "pspAmount", title: "PSP $", width: "120px", align: "right", render: (r) => <span className="text-xs tabular-nums">${r.pspAmount.toLocaleString()}</span> },
    { key: "crmRef", title: "Internal Ref", width: "160px", render: (r) => r.crmRef ? <span className="text-xs font-mono">{r.crmRef}</span> : <span className="text-xs text-amber-700">— Unmatched —</span> },
    { key: "crmAmount", title: "Internal $", width: "120px", align: "right", render: (r) => r.crmAmount !== undefined ? <span className="text-xs tabular-nums">${r.crmAmount.toLocaleString()}</span> : <span className="text-xs text-slate-400">—</span> },
    { key: "delta", title: "Δ", width: "100px", align: "right", render: (r) => {
      if (r.delta === 0) return <span className="text-xs text-emerald-700 tabular-nums">$0</span>;
      const tone = r.delta > 0 ? "text-red-700" : "text-orange-700";
      return <span className={cn("text-xs tabular-nums", tone)}>{r.delta > 0 ? "+" : ""}${r.delta.toLocaleString()}</span>;
    } },
    { key: "status", title: "Status", width: "140px", render: (r) => {
      const s = STATUS_FG[r.status];
      return <span className={cn("inline-flex items-center gap-1.5 text-xs", s.text)}><span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />{r.status}</span>;
    } },
    { key: "note", title: "Note", minWidth: "240px", render: (r) => <span className="text-xs text-slate-500">{r.note || "—"}</span> },
  ];
  return (
    <Card padding="none">
      <div className="px-4 py-3 border-b border-slate-100 text-xs text-slate-600">
        第二步：内部对账完成后，再对照各 PSP 清算单。差异源于通道延迟、手续费偏差、状态同步问题。
      </div>
      <EnhancedDataTable<PSPReconRow> columns={cols} data={PSP_RECON} keyExtractor={(r) => r.id} tableId="funds-recon-psp" emptyText="无对账记录" />
    </Card>
  );
}

function ReportsTab() {
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");

  const totalDeposit = DAILY.reduce((s, r) => s + r.depositAmount, 0);
  const totalWithdrawal = DAILY.reduce((s, r) => s + r.withdrawalAmount, 0);
  const totalNet = totalDeposit - totalWithdrawal;

  const channelCols: Column<DailyReportRow>[] = [
    { key: "channel", title: "Channel", minWidth: "160px", render: (r) => <span className="text-xs font-medium text-slate-800">{r.channel}</span> },
    { key: "depCount", title: "Deposits (count)", width: "130px", align: "right", render: (r) => <span className="text-xs tabular-nums">{r.depositCount}</span> },
    { key: "depAmt", title: "Deposits ($)", width: "140px", align: "right", render: (r) => <span className="text-xs tabular-nums">${r.depositAmount.toLocaleString()}</span> },
    { key: "wdCount", title: "Withdrawals (count)", width: "150px", align: "right", render: (r) => <span className="text-xs tabular-nums">{r.withdrawalCount}</span> },
    { key: "wdAmt", title: "Withdrawals ($)", width: "150px", align: "right", render: (r) => <span className="text-xs tabular-nums">${r.withdrawalAmount.toLocaleString()}</span> },
    { key: "net", title: "Net Flow", width: "130px", align: "right", render: (r) => (
      <span className={cn("text-xs font-semibold tabular-nums", r.netFlow >= 0 ? "text-emerald-700" : "text-red-700")}>
        {r.netFlow >= 0 ? "+" : ""}${r.netFlow.toLocaleString()}
      </span>
    ) },
    { key: "success", title: "Success Rate", width: "120px", align: "right", render: (r) => <span className="text-xs tabular-nums">{r.successRate}%</span> },
  ];

  const balanceRows = [
    { type: "Real Wallet",  open: 78_200_000, deposit: 1_800_000, withdrawal: 900_000, net: 900_000, close: 79_100_000 },
    { type: "Bonus Wallet", open:  4_100_000, deposit: 80_000,    withdrawal: 60_000,  net: 20_000,  close:  4_120_000 },
    { type: "Credit",       open:  2_000_000, deposit: 0,         withdrawal: 0,       net: 0,       close:  2_000_000 },
    { type: "MT5 Trading",  open: 11_800_000, deposit: 500_000,   withdrawal: 140_000, net: 360_000, close: 12_160_000 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b border-slate-200">
        {(["daily", "weekly", "monthly"] as const).map((t) => (
          <TabBtn key={t} label={t === "daily" ? "日报" : t === "weekly" ? "周报" : "月报"}
            active={reportType === t} onClick={() => setReportType(t)} />
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiSimple label="Deposits" value={`$${totalDeposit.toLocaleString()}`} tone="emerald" />
        <KpiSimple label="Withdrawals" value={`$${totalWithdrawal.toLocaleString()}`} tone="amber" />
        <KpiSimple label="Net Flow" value={`+$${totalNet.toLocaleString()}`} tone="emerald" />
        <KpiSimple label="Channels Reporting" value={DAILY.length} />
      </div>

      <Card padding="none">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">① 通道维度</h3>
          <Button size="sm" variant="secondary" onClick={() => demoExport("通道日报 CSV")}>
            <FileText className="w-3.5 h-3.5" />Export CSV
          </Button>
        </div>
        <EnhancedDataTable<DailyReportRow> columns={channelCols} data={DAILY} keyExtractor={(r) => r.channel} tableId="funds-recon-daily-channel" />
      </Card>

      <Card padding="none">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">② 余额维度</h3>
        </div>
        <div className="overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Account Type</th>
                <th className="px-3 py-2 font-medium text-right">Open Balance</th>
                <th className="px-3 py-2 font-medium text-right">Deposits</th>
                <th className="px-3 py-2 font-medium text-right">Withdrawals</th>
                <th className="px-3 py-2 font-medium text-right">Net Change</th>
                <th className="px-3 py-2 font-medium text-right">Close Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {balanceRows.map((r) => (
                <tr key={r.type}>
                  <td className="px-3 py-2 text-slate-800">{r.type}</td>
                  <td className="px-3 py-2 text-right tabular-nums">${r.open.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-emerald-700">+${r.deposit.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-red-700">-${r.withdrawal.toLocaleString()}</td>
                  <td className={cn("px-3 py-2 text-right tabular-nums font-semibold", r.net >= 0 ? "text-emerald-700" : "text-red-700")}>
                    {r.net >= 0 ? "+" : ""}${r.net.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">${r.close.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold">
                <td className="px-3 py-2">Total AUM</td>
                <td className="px-3 py-2 text-right tabular-nums">${balanceRows.reduce((s, r) => s + r.open, 0).toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums text-emerald-700">+${balanceRows.reduce((s, r) => s + r.deposit, 0).toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums text-red-700">-${balanceRows.reduce((s, r) => s + r.withdrawal, 0).toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums text-emerald-700">+${balanceRows.reduce((s, r) => s + r.net, 0).toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums">${balanceRows.reduce((s, r) => s + r.close, 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-slate-800">③ 客户维度</h3>
        <p className="text-xs text-slate-500 mt-1">Top 10 FTD / Top 10 Deposits / Top 10 Withdrawals / 异常事件 — 完整内容在 Reports 模块</p>
        <div className="mt-3 flex gap-2">
          <Link href="/crm/funds/reports" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50">View Top FTDs</Link>
          <Link href="/crm/funds/reports" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50">View Top Deposits</Link>
          <Link href="/crm/funds/monitoring" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50">View Anomalies</Link>
        </div>
      </Card>
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
      active ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700",
    )}>{label}</button>
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
