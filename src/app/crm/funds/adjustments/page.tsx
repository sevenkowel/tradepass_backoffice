"use client";

import { Plus, Download } from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, EnhancedDataTable, type Column } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { isoMinusHour, isoMinusDay } from "@/lib/mock/funds/v2/entities";
import { demoCreate, demoExport } from "@/components/crm/funds/use-funds-toast";

interface Adj {
  id: string;
  client: string;
  clientId: string;
  kind: "Manual" | "IB Commission" | "Bonus Grant" | "Correction";
  direction: "Credit" | "Debit";
  wallet: "Real" | "Bonus" | "Credit";
  amount: number;
  status: "Pending" | "Approved" | "Posted" | "Rejected";
  reason: string;
  approvalRef?: string;
  createdAt: string;
  createdBy: string;
}

const ROWS: Adj[] = [
  { id: "ADJ-001", client: "John Smith",    clientId: "USR-12345", kind: "Correction",    direction: "Credit", wallet: "Real",  amount: 250,  status: "Posted",   reason: "Refund · double-charge on DEP-00002",     approvalRef: "TASK-1101", createdAt: isoMinusDay(1),  createdBy: "fin_001" },
  { id: "ADJ-002", client: "Vu Nguyen",     clientId: "USR-67890", kind: "IB Commission", direction: "Credit", wallet: "Real",  amount: 145,  status: "Pending",  reason: "IB rebate · May 2026 · settlement #042", approvalRef: "TASK-1102", createdAt: isoMinusHour(2), createdBy: "system" },
  { id: "ADJ-003", client: "Sarah Johnson", clientId: "USR-23456", kind: "Bonus Grant",   direction: "Credit", wallet: "Bonus", amount: 100,  status: "Posted",   reason: "Welcome bonus · NEWYR2026",              approvalRef: "TASK-1099", createdAt: isoMinusDay(2),  createdBy: "mkt_001" },
  { id: "ADJ-004", client: "Michael Brown", clientId: "USR-34567", kind: "Manual",        direction: "Debit",  wallet: "Real",  amount: 5000, status: "Pending",  reason: "Chargeback · Visa dispute 2026-05-12",   approvalRef: "TASK-1103", createdAt: isoMinusHour(0.5),createdBy: "fin_002" },
  { id: "ADJ-005", client: "Yuki Tanaka",   clientId: "USR-78901", kind: "IB Commission", direction: "Credit", wallet: "Real",  amount: 320,  status: "Posted",   reason: "IB rebate · April 2026 · #041",          approvalRef: "TASK-1098", createdAt: isoMinusDay(30), createdBy: "system" },
  { id: "ADJ-006", client: "Emma Wilson",   clientId: "USR-45678", kind: "Correction",    direction: "Debit",  wallet: "Bonus", amount: 50,   status: "Rejected", reason: "Bonus reversal · violation",             approvalRef: "TASK-1100", createdAt: isoMinusDay(2),  createdBy: "fin_001" },
  { id: "ADJ-007", client: "Andre Silva",   clientId: "USR-01234", kind: "Bonus Grant",   direction: "Credit", wallet: "Bonus", amount: 200,  status: "Approved", reason: "Q2 loyalty reward",                       approvalRef: "TASK-1104", createdAt: isoMinusHour(8), createdBy: "mkt_001" },
];

const STATUS_FG = {
  Pending:  { text: "text-amber-700",   dot: "bg-amber-500"   },
  Approved: { text: "text-blue-700",    dot: "bg-blue-500"    },
  Posted:   { text: "text-emerald-700", dot: "bg-emerald-500" },
  Rejected: { text: "text-red-700",     dot: "bg-red-500"     },
} as const;

export default function AdjustmentsPage() {
  const cols: Column<Adj>[] = [
    { key: "id", title: "ID", width: "120px", render: (r) => <span className="text-xs font-mono text-primary">{r.id}</span> },
    { key: "client", title: "Client", minWidth: "180px", render: (r) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-slate-800">{r.client}</span>
        <span className="text-[11px] font-mono text-slate-500">{r.clientId}</span>
      </div>
    ) },
    { key: "kind", title: "Kind", width: "140px", render: (r) => <span className="text-xs">{r.kind}</span> },
    { key: "amount", title: "Amount", width: "150px", align: "right", render: (r) => (
      <div className="flex flex-col items-end">
        <span className={cn("text-xs font-semibold tabular-nums", r.direction === "Credit" ? "text-emerald-700" : "text-red-700")}>
          {r.direction === "Credit" ? "+" : "-"}${r.amount.toLocaleString()}
        </span>
        <span className="text-[11px] text-slate-500">{r.wallet}</span>
      </div>
    ) },
    { key: "reason", title: "Reason", minWidth: "260px", render: (r) => <span className="text-xs text-slate-700">{r.reason}</span> },
    { key: "status", title: "Status", width: "120px", render: (r) => {
      const s = STATUS_FG[r.status];
      return <span className={cn("inline-flex items-center gap-1.5 text-xs", s.text)}><span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />{r.status}</span>;
    } },
    { key: "approval", title: "Approval", width: "140px", render: (r) => r.approvalRef ? (
      <a href={`/crm/approvals/${r.approvalRef}`} className="text-xs font-mono text-primary hover:underline">{r.approvalRef}</a>
    ) : <span className="text-xs text-slate-400">—</span> },
    { key: "created", title: "Created", width: "140px", render: (r) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-slate-700">{new Date(r.createdAt).toLocaleDateString()}</span>
        <span className="text-[11px] font-mono text-slate-500">{r.createdBy}</span>
      </div>
    ) },
  ];

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Funds" }, { label: "Adjustments" }]} />
      <PageHeader title="Adjustments" description="手动调账 / IB 佣金回流 / Bonus 注入 / 财务修正 — 全部走审批"
        actions={<div className="flex gap-2">
          <Button variant="secondary" onClick={() => demoExport("调账记录")}><Download className="w-4 h-4" />Export</Button>
          <Button onClick={() => demoCreate("调账")}><Plus className="w-4 h-4" />New Adjustment</Button>
        </div>}
      />
      <Card padding="none">
        <EnhancedDataTable<Adj> columns={cols} data={ROWS} keyExtractor={(r) => r.id} tableId="funds-adjustments" />
      </Card>
    </div>
  );
}
