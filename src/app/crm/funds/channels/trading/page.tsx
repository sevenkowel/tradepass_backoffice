"use client";

import { useState } from "react";
import { Plus, Pencil, Power, Download, Filter } from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, EnhancedDataTable, type Column } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  tradingChannels, CHANNEL_STATUS_FG, CHANNEL_CATEGORY_FG, type Channel,
} from "@/lib/mock/funds/v2/channels";
import { ChannelEligibilityDrawer } from "@/components/crm/funds/ChannelEligibilityDrawer";
import { actionDone, demoCreate, demoEdit, demoExport } from "@/components/crm/funds/use-funds-toast";

export default function TradingChannelsPage() {
  const [eligibilityChannel, setEligibilityChannel] = useState<Channel | null>(null);
  const [channels, setChannels] = useState(tradingChannels);
  const togglePower = (id: string) => {
    setChannels((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      const nextStatus = c.status === "Online" ? "Maintenance" : c.status === "Maintenance" ? "Online" : c.status;
      actionDone(nextStatus === "Maintenance" ? `${c.name} 已停用` : `${c.name} 已启用`);
      return { ...c, status: nextStatus };
    }));
  };
  const cols: Column<Channel>[] = [
    { key: "name", title: "Channel", minWidth: "200px", render: (c) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-slate-800">{c.name}</span>
        <span className="text-[11px] font-mono text-slate-500">{c.id}</span>
      </div>
    ) },
    { key: "merchant", title: "Merchant", minWidth: "180px", render: (c) => <span className="text-xs text-slate-700">{c.merchantName}</span> },
    { key: "category", title: "Category", width: "120px", render: (c) => {
      const cat = CHANNEL_CATEGORY_FG[c.category];
      return <span className={cn("inline-flex items-center gap-1.5 text-xs", cat.text)}><span className={cn("w-1.5 h-1.5 rounded-full", cat.dot)} />{c.category}</span>;
    } },
    { key: "currencies", title: "Currencies", minWidth: "140px", render: (c) => (
      <div className="flex flex-wrap gap-1">{c.currencies.filter((cur) => cur.enabled).map((cur) => (
        <span key={cur.currency} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">{cur.currency}</span>
      ))}</div>
    ) },
    { key: "status", title: "Status", width: "120px", render: (c) => {
      const s = CHANNEL_STATUS_FG[c.status];
      return <span className={cn("inline-flex items-center gap-1.5 text-xs", s.text)}><span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />{c.status}</span>;
    } },
    { key: "success", title: "24h Success", width: "120px", align: "right", render: (c) => {
      const tone = c.successRate24h >= 95 ? "text-emerald-700" : c.successRate24h >= 85 ? "text-amber-700" : "text-red-700";
      return <span className={cn("text-xs tabular-nums", tone)}>{c.successRate24h}%</span>;
    } },
    { key: "volume", title: "Today Volume", width: "140px", align: "right", render: (c) => <span className="text-xs tabular-nums">${c.todayVolumeUsd.toLocaleString()}</span> },
    { key: "actions", title: "", width: "220px", render: (c) => (
      <div className="flex gap-1">
        <Button size="sm" variant="secondary" onClick={() => setEligibilityChannel(c)}>
          <Filter className="w-3.5 h-3.5" />Eligibility
        </Button>
        <Button size="sm" variant="secondary" onClick={() => demoEdit(c.name)}>
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button size="sm" variant="secondary" onClick={() => togglePower(c.id)}>
          <Power className="w-3.5 h-3.5" />
        </Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Funds" }, { label: "Trading Channels" }]} />
      <PageHeader title="Trading Channels" description="交易账户通道 (Internal + External Direct)"
        actions={<div className="flex gap-2">
          <Button variant="secondary" onClick={() => demoExport("Trading 通道")}><Download className="w-4 h-4" />Export</Button>
          <Button onClick={() => demoCreate("Trading 通道")}><Plus className="w-4 h-4" />New Channel</Button>
        </div>}
      />
      <Card padding="none">
        <EnhancedDataTable<Channel> columns={cols} data={channels} keyExtractor={(c) => c.id} tableId="funds-trading-channels" />
      </Card>

      <ChannelEligibilityDrawer
        open={eligibilityChannel !== null}
        onClose={() => setEligibilityChannel(null)}
        channel={eligibilityChannel}
      />
    </div>
  );
}
