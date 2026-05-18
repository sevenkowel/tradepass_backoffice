"use client";

import { Pencil, Plus, Download } from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, EnhancedDataTable, type Column } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { demoCreate, demoEdit, demoExport } from "@/components/crm/funds/use-funds-toast";

interface BankMaster {
  id: string;
  name: string;
  bankCode: string;
  country: string;
  swift: string;
  routing?: string;
  ibanRequired: boolean;
  intermediaryRequired: boolean;
  status: "Active" | "Inactive";
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

const BANKS: BankMaster[] = [
  { id: "BANK-001", name: "Chase Bank",      bankCode: "CHASUS33", country: "US", swift: "CHASUS33XXX", routing: "021000021", ibanRequired: false, intermediaryRequired: false, status: "Active", lastUpdatedBy: "fin_002", lastUpdatedAt: "2026-04-01" },
  { id: "BANK-002", name: "HSBC",            bankCode: "HSBCHKHH", country: "HK", swift: "HSBCHKHHHKH",  ibanRequired: false, intermediaryRequired: false, status: "Active", lastUpdatedBy: "fin_002", lastUpdatedAt: "2026-04-12" },
  { id: "BANK-003", name: "MUFG Bank",       bankCode: "BOTKJPJT", country: "JP", swift: "BOTKJPJTXXX",  ibanRequired: false, intermediaryRequired: false, status: "Active", lastUpdatedBy: "fin_002", lastUpdatedAt: "2026-04-15" },
  { id: "BANK-004", name: "Sberbank",        bankCode: "SABRRUMM", country: "RU", swift: "SABRRUMMXXX",  ibanRequired: false, intermediaryRequired: true,  status: "Inactive", lastUpdatedBy: "cmp_001", lastUpdatedAt: "2026-02-20" },
  { id: "BANK-005", name: "Itaú Unibanco",   bankCode: "ITAUBRSP", country: "BR", swift: "ITAUBRSPXXX",  ibanRequired: false, intermediaryRequired: false, status: "Active", lastUpdatedBy: "fin_002", lastUpdatedAt: "2026-05-01" },
  { id: "BANK-006", name: "CTBC Bank",       bankCode: "CTCBTWTP", country: "TW", swift: "CTCBTWTPXXX",  ibanRequired: false, intermediaryRequired: false, status: "Active", lastUpdatedBy: "fin_002", lastUpdatedAt: "2026-03-22" },
  { id: "BANK-007", name: "BBVA Mexico",     bankCode: "BCMRMXMM", country: "MX", swift: "BCMRMXMMXXX",  ibanRequired: false, intermediaryRequired: false, status: "Active", lastUpdatedBy: "fin_002", lastUpdatedAt: "2026-04-30" },
  { id: "BANK-008", name: "Citadele Bank",   bankCode: "PARXLV22", country: "LV", swift: "PARXLV22XXX",  ibanRequired: true,  intermediaryRequired: false, status: "Active", lastUpdatedBy: "fin_002", lastUpdatedAt: "2026-04-10" },
  { id: "BANK-009", name: "Wise (Online)",   bankCode: "TRWIGB22", country: "GB", swift: "TRWIGB22XXX",  ibanRequired: true,  intermediaryRequired: false, status: "Active", lastUpdatedBy: "fin_002", lastUpdatedAt: "2026-05-10" },
];

export default function BankMasterDataPage() {
  const cols: Column<BankMaster>[] = [
    { key: "id", title: "ID", width: "100px", render: (r) => <span className="text-xs font-mono text-primary">{r.id}</span> },
    { key: "name", title: "Bank", minWidth: "200px", render: (r) => <span className="text-xs font-medium text-slate-800">{r.name}</span> },
    { key: "country", title: "Country", width: "100px", render: (r) => <span className="text-xs font-mono">{r.country}</span> },
    { key: "swift", title: "SWIFT", minWidth: "140px", render: (r) => <span className="text-xs font-mono text-slate-700">{r.swift}</span> },
    { key: "routing", title: "Routing", width: "120px", render: (r) => r.routing ? <span className="text-xs font-mono">{r.routing}</span> : <span className="text-xs text-slate-400">—</span> },
    { key: "iban", title: "IBAN Req?", width: "100px", render: (r) => <span className="text-xs">{r.ibanRequired ? "Yes" : "No"}</span> },
    { key: "intermediary", title: "Intermediary?", width: "120px", render: (r) => <span className="text-xs">{r.intermediaryRequired ? "Yes" : "No"}</span> },
    { key: "status", title: "Status", width: "100px", render: (r) => {
      const tone = r.status === "Active" ? "text-emerald-700" : "text-slate-500";
      const dot = r.status === "Active" ? "bg-emerald-500" : "bg-slate-400";
      return <span className={cn("inline-flex items-center gap-1.5 text-xs", tone)}><span className={cn("w-1.5 h-1.5 rounded-full", dot)} />{r.status}</span>;
    } },
    { key: "updated", title: "Last Updated", width: "160px", render: (r) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-slate-700">{r.lastUpdatedAt}</span>
        <span className="text-[11px] font-mono text-slate-500">{r.lastUpdatedBy}</span>
      </div>
    ) },
    { key: "actions", title: "", width: "100px", render: (r) => (
      <Button size="sm" variant="secondary" onClick={() => demoEdit(`${r.id} · ${r.name}`)}>
        <Pencil className="w-3.5 h-3.5" />Edit
      </Button>
    ) },
  ];

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Funds" }, { label: "Bank Master Data" }]} />
      <PageHeader title="Bank Master Data" description="银行下拉清单 · 维护权限：Finance 总监 + Audit Trail"
        actions={<div className="flex gap-2">
          <Button variant="secondary" onClick={() => demoExport("银行清单")}><Download className="w-4 h-4" />Export</Button>
          <Button onClick={() => demoCreate("银行")}><Plus className="w-4 h-4" />New Bank</Button>
        </div>}
      />
      <Card padding="none">
        <EnhancedDataTable<BankMaster> columns={cols} data={BANKS} keyExtractor={(r) => r.id} tableId="funds-bank-master" />
      </Card>
    </div>
  );
}
