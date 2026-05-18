"use client";

import { Pencil, Plus, Download } from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, EnhancedDataTable, type Column } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { demoCreate, demoEdit, demoExport } from "@/components/crm/funds/use-funds-toast";

interface FeeConfig {
  id: string;
  channelName: string;
  direction: "Deposit" | "Withdrawal";
  type: "Fixed" | "Percentage" | "Tiered";
  rate: string;
  paidBy: "Client" | "Broker" | "Split (50/50)";
  audience: "All Clients" | "VIP" | "Tier3" | "Tier2+" | "Campaign";
  validity: "Permanent" | "Promo";
  promoEnd?: string;
  enabled: boolean;
}

const FEES: FeeConfig[] = [
  { id: "FEE-CRYPTO-001",  channelName: "USDT TRC20",  direction: "Deposit",    type: "Fixed",      rate: "$0",          paidBy: "Broker",  audience: "All Clients", validity: "Permanent", enabled: true },
  { id: "FEE-CRYPTO-001W", channelName: "USDT TRC20",  direction: "Withdrawal", type: "Fixed",      rate: "$1.5",        paidBy: "Client",  audience: "All Clients", validity: "Permanent", enabled: true },
  { id: "FEE-CRYPTO-002",  channelName: "USDT ERC20",  direction: "Withdrawal", type: "Percentage", rate: "0.5% (min $5)",paidBy: "Client", audience: "All Clients", validity: "Permanent", enabled: true },
  { id: "FEE-WIRE-001",    channelName: "Bank Wire",   direction: "Deposit",    type: "Fixed",      rate: "$15",         paidBy: "Client",  audience: "All Clients", validity: "Permanent", enabled: true },
  { id: "FEE-WIRE-001W",   channelName: "Bank Wire",   direction: "Withdrawal", type: "Fixed",      rate: "$25",         paidBy: "Client",  audience: "All Clients", validity: "Permanent", enabled: true },
  { id: "FEE-WIRE-VIP",    channelName: "Bank Wire",   direction: "Withdrawal", type: "Fixed",      rate: "$0",          paidBy: "Broker",  audience: "VIP",         validity: "Permanent", enabled: true },
  { id: "FEE-PSP-DOKU",    channelName: "DOKU Wallet", direction: "Deposit",    type: "Fixed",      rate: "$0",          paidBy: "Broker",  audience: "All Clients", validity: "Permanent", enabled: true },
  { id: "FEE-CARD-001",    channelName: "Visa Card",   direction: "Deposit",    type: "Percentage", rate: "2.9% + $0.30",paidBy: "Broker",  audience: "All Clients", validity: "Permanent", enabled: true },
  { id: "FEE-PROMO-NEWYR", channelName: "All Channels", direction: "Deposit",   type: "Fixed",      rate: "$0",          paidBy: "Broker",  audience: "Campaign",    validity: "Promo",     promoEnd: "2026-06-30", enabled: true },
];

export default function FeesPage() {
  const cols: Column<FeeConfig>[] = [
    { key: "id", title: "ID", width: "150px", render: (r) => <span className="text-xs font-mono text-primary">{r.id}</span> },
    { key: "channel", title: "Channel", minWidth: "150px", render: (r) => <span className="text-xs font-medium text-slate-800">{r.channelName}</span> },
    { key: "direction", title: "Direction", width: "110px", render: (r) => <span className="text-xs">{r.direction}</span> },
    { key: "type", title: "Type", width: "110px", render: (r) => <span className="text-xs">{r.type}</span> },
    { key: "rate", title: "Rate", width: "140px", render: (r) => <span className="text-xs font-mono text-slate-700">{r.rate}</span> },
    { key: "paidBy", title: "Paid By", width: "120px", render: (r) => {
      const tone = r.paidBy === "Client" ? "text-amber-700" : r.paidBy === "Broker" ? "text-emerald-700" : "text-blue-700";
      return <span className={cn("text-xs", tone)}>{r.paidBy}</span>;
    } },
    { key: "audience", title: "Audience", width: "140px", render: (r) => <span className="text-xs">{r.audience}</span> },
    { key: "validity", title: "Validity", width: "140px", render: (r) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs">{r.validity}</span>
        {r.promoEnd && <span className="text-[11px] text-slate-500">until {r.promoEnd}</span>}
      </div>
    ) },
    { key: "actions", title: "", width: "100px", render: (r) => (
      <Button size="sm" variant="secondary" onClick={() => demoEdit(r.id)}>
        <Pencil className="w-3.5 h-3.5" />Edit
      </Button>
    ) },
  ];

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Funds" }, { label: "Fees & Pricing" }]} />
      <PageHeader title="Fees & Pricing" description="按通道差异化 · 客户/Broker 承担 · 支持 VIP / 促销规则"
        actions={<div className="flex gap-2">
          <Button variant="secondary" onClick={() => demoExport("费率配置")}><Download className="w-4 h-4" />Export</Button>
          <Button onClick={() => demoCreate("费率")}><Plus className="w-4 h-4" />New Fee</Button>
        </div>}
      />
      <Card padding="none">
        <EnhancedDataTable<FeeConfig> columns={cols} data={FEES} keyExtractor={(r) => r.id} tableId="funds-fees" />
      </Card>
    </div>
  );
}
