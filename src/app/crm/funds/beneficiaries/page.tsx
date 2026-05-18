"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  UserCheck, Snowflake, Trash2, Download, SlidersHorizontal, Plus,
  CreditCard, Banknote, Smartphone, Coins,
} from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, EnhancedDataTable, type Column } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { clients, KYC_TIER_FG, isoMinusDay, isoMinusHour } from "@/lib/mock/funds/v2/entities";
import { actionDone, demoExport, demoCreate, demoAction } from "@/components/crm/funds/use-funds-toast";

type BeneficiaryType = "Bank" | "Card" | "EWallet" | "Crypto";
type Status = "Active" | "Pending" | "Frozen" | "Removed";

interface Beneficiary {
  id: string;
  clientId: string;
  clientName: string;
  type: BeneficiaryType;
  label: string;       // masked
  detail: string;      // full info for ops
  currency: string;
  status: Status;
  statusReason?: string;
  boundAt: string;
  lastUsedAt?: string;
  usageCount: number;
  usageVolume: number;
  riskScore: number;
}

const MOCK: Beneficiary[] = [
  { id: "BNF-0001", clientId: "USR-12345", clientName: "John Smith", type: "Bank",    label: "Chase Bank ****4567",   detail: "John Smith / Chase / Routing 021000021 / ****4567",          currency: "USD",  status: "Active", boundAt: isoMinusDay(120), lastUsedAt: isoMinusHour(0.5), usageCount: 18, usageVolume: 145_000, riskScore: 12 },
  { id: "BNF-0002", clientId: "USR-12345", clientName: "John Smith", type: "Crypto",  label: "TXbc...5678 (TRC20)",   detail: "TXbc1234567890abcdef5678",                                    currency: "USDT", status: "Active", boundAt: isoMinusDay(60),  lastUsedAt: isoMinusHour(3),    usageCount: 6,  usageVolume: 22_000,  riskScore: 22 },
  { id: "BNF-0003", clientId: "USR-23456", clientName: "Sarah Johnson", type: "Crypto", label: "TXza...4422 (TRC20)", detail: "TXza0987654321fedcba4422",                                    currency: "USDT", status: "Active", boundAt: isoMinusDay(180), lastUsedAt: isoMinusHour(0.5), usageCount: 24, usageVolume: 18_500,  riskScore: 8 },
  { id: "BNF-0004", clientId: "USR-34567", clientName: "Michael Brown", type: "Bank",  label: "Sberbank ****8901",     detail: "Michael Brown / Sberbank / SWIFT SABRRUMM / ****8901",       currency: "USD",  status: "Frozen", statusReason: "AML hit on WTH-2026-0003", boundAt: isoMinusDay(15), usageCount: 0, usageVolume: 0, riskScore: 87 },
  { id: "BNF-0005", clientId: "USR-45678", clientName: "Emma Wilson",   type: "EWallet", label: "DOKU ID-22001",       detail: "Emma Wilson / DOKU / ID-22001",                              currency: "IDR",  status: "Active", boundAt: isoMinusDay(45),  lastUsedAt: isoMinusHour(1.5),  usageCount: 12, usageVolume: 850_000, riskScore: 10 },
  { id: "BNF-0006", clientId: "USR-78901", clientName: "Yuki Tanaka",   type: "Bank",   label: "MUFG ****1122",         detail: "Yuki Tanaka / MUFG / SWIFT BOTKJPJT / ****1122",             currency: "JPY",  status: "Active", boundAt: isoMinusDay(365), lastUsedAt: isoMinusHour(60),   usageCount: 42, usageVolume: 880_000, riskScore: 6  },
  { id: "BNF-0007", clientId: "USR-89012", clientName: "Lisa Chen",     type: "Bank",   label: "CTBC Bank ****6677",    detail: "Lisa C. / CTBC / ****6677 (KYC name mismatch — pending)",    currency: "USD",  status: "Pending", statusReason: "KYC name mismatch — awaiting client correction", boundAt: isoMinusDay(2), usageCount: 0, usageVolume: 0, riskScore: 30 },
  { id: "BNF-0008", clientId: "USR-90123", clientName: "Aisha Khan",    type: "Crypto", label: "TXbz...9911 (TRC20)",   detail: "TXbz55009911",                                              currency: "USDT", status: "Active", boundAt: isoMinusDay(30), lastUsedAt: isoMinusHour(2), usageCount: 3, usageVolume: 950, riskScore: 10 },
  { id: "BNF-0009", clientId: "USR-01234", clientName: "Andre Silva",   type: "Bank",   label: "Itaú ****3344",         detail: "Andre Silva / Itaú / ****3344",                              currency: "BRL",  status: "Active", boundAt: isoMinusDay(90),  lastUsedAt: isoMinusHour(0.5),  usageCount: 8, usageVolume: 18_000, riskScore: 25 },
  { id: "BNF-0010", clientId: "USR-67890", clientName: "Vu Nguyen",     type: "Crypto", label: "TXfa...4422 (TRC20)",   detail: "TXfa98764422 (Fast In-Out flag)",                            currency: "USDT", status: "Frozen", statusReason: "Fast-In-Out pattern, Compliance review", boundAt: isoMinusDay(10), lastUsedAt: isoMinusHour(1.2), usageCount: 4, usageVolume: 8_400, riskScore: 65 },
];

const STATUS_FG: Record<Status, { text: string; dot: string }> = {
  Active:  { text: "text-emerald-700", dot: "bg-emerald-500" },
  Pending: { text: "text-amber-700",   dot: "bg-amber-500"   },
  Frozen:  { text: "text-red-700",     dot: "bg-red-500"     },
  Removed: { text: "text-slate-400",   dot: "bg-slate-300"   },
};

const TYPE_ICON: Record<BeneficiaryType, React.ComponentType<{ className?: string }>> = {
  Bank: Banknote, Card: CreditCard, EWallet: Smartphone, Crypto: Coins,
};

export default function BeneficiariesPage() {
  const [rows, setRows] = useState<Beneficiary[]>(MOCK);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<BeneficiaryType | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");

  const toggleFreeze = (id: string) => {
    setRows((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const newStatus: Status = r.status === "Frozen" ? "Active" : "Frozen";
      actionDone(newStatus === "Frozen" ? `已冻结 ${r.label}` : `已解冻 ${r.label}`);
      return { ...r, status: newStatus, statusReason: newStatus === "Frozen" ? "由运营手动冻结" : undefined };
    }));
  };

  const removeOne = (id: string) => {
    setRows((prev) => prev.map((r) =>
      r.id === id ? { ...r, status: "Removed" as Status, statusReason: "已删除" } : r,
    ));
    actionDone("已标记删除");
  };

  const filtered = useMemo(() => rows.filter((r) => {
    if (type !== "all" && r.type !== type) return false;
    if (status !== "all" && r.status !== status) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!`${r.id} ${r.clientId} ${r.clientName} ${r.label}`.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [rows, type, status, search]);

  const stats = {
    total: rows.length,
    active: rows.filter((r) => r.status === "Active").length,
    pending: rows.filter((r) => r.status === "Pending").length,
    frozen: rows.filter((r) => r.status === "Frozen").length,
    highRisk: rows.filter((r) => r.riskScore >= 60).length,
  };

  const columns: Column<Beneficiary>[] = [
    { key: "id", title: "ID", width: "120px", render: (r) => <span className="text-xs font-mono text-primary">{r.id}</span> },
    { key: "client", title: "Client", minWidth: "180px", render: (r) => {
      const c = clients.find((x) => x.id === r.clientId);
      return (
        <Link href={`/crm/clients/${r.clientId}`} className="flex flex-col gap-0.5 hover:underline">
          <span className="text-xs font-medium text-slate-800">{r.clientName}</span>
          <span className="text-[11px] text-slate-500">
            <span className="font-mono">{r.clientId}</span>
            {c && <><span className="mx-1.5">·</span><span className={KYC_TIER_FG[c.kycTier].text}>{c.kycTier}</span></>}
          </span>
        </Link>
      );
    } },
    { key: "type", title: "Type", width: "100px", render: (r) => {
      const Icon = TYPE_ICON[r.type];
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
          <Icon className="w-3.5 h-3.5 text-slate-400" />
          {r.type}
        </span>
      );
    } },
    { key: "label", title: "Beneficiary (Masked)", minWidth: "220px", render: (r) => (
      <span className="text-xs text-slate-700 font-mono">{r.label}</span>
    ) },
    { key: "currency", title: "Currency", width: "100px", render: (r) => <span className="text-xs text-slate-700">{r.currency}</span> },
    { key: "status", title: "Status", width: "120px", render: (r) => {
      const s = STATUS_FG[r.status];
      return (
        <span className={cn("inline-flex items-center gap-1.5 text-xs", s.text)}>
          <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
          {r.status}
        </span>
      );
    } },
    { key: "usage", title: "Usage", width: "140px", align: "right", render: (r) => (
      <div className="flex flex-col items-end">
        <span className="text-xs tabular-nums">{r.usageCount} txns</span>
        <span className="text-[11px] text-slate-500 tabular-nums">${r.usageVolume.toLocaleString()}</span>
      </div>
    ) },
    { key: "risk", title: "Risk", width: "90px", align: "right", render: (r) => {
      const tone = r.riskScore >= 75 ? "text-red-700" : r.riskScore >= 50 ? "text-orange-700" : r.riskScore >= 25 ? "text-amber-700" : "text-emerald-700";
      return <span className={cn("text-xs font-semibold tabular-nums", tone)}>{r.riskScore}</span>;
    } },
    { key: "lastUsed", title: "Last Used", width: "150px", render: (r) => r.lastUsedAt
      ? <span className="text-xs text-slate-500">{new Date(r.lastUsedAt).toLocaleString()}</span>
      : <span className="text-xs text-slate-400">—</span>
    },
    { key: "actions", title: "", width: "180px", render: (r) => (
      <div className="flex gap-1">
        {r.status === "Active" && (
          <Button size="sm" variant="secondary" onClick={() => toggleFreeze(r.id)}>
            <Snowflake className="w-3.5 h-3.5" />Freeze
          </Button>
        )}
        {r.status === "Frozen" && (
          <Button size="sm" variant="secondary" onClick={() => toggleFreeze(r.id)}>
            <Snowflake className="w-3.5 h-3.5" />Unfreeze
          </Button>
        )}
        {r.status !== "Removed" && (
          <Button size="sm" variant="secondary" onClick={() => {
            if (confirm(`确认删除 ${r.label}?`)) removeOne(r.id);
          }}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    ) },
  ];

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Funds" }, { label: "Beneficiaries" }]} />
      <PageHeader title="Beneficiaries" description="客户收款方式管理 · 银行卡 / 信用卡 / 电子钱包 / 加密地址"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => demoExport("收款方式")}><Download className="w-4 h-4" />Export</Button>
            <Button onClick={() => demoCreate("收款方式")}><Plus className="w-4 h-4" />New Beneficiary</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiSimple label="Total"    value={stats.total} />
        <KpiSimple label="Active"   value={stats.active} tone="emerald" />
        <KpiSimple label="Pending"  value={stats.pending} tone="amber" />
        <KpiSimple label="Frozen"   value={stats.frozen} tone="red" />
        <KpiSimple label="High Risk (≥60)" value={stats.highRisk} tone="red" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative w-80">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索 ID / 客户 / 银行卡号 / 地址..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <select value={type} onChange={(e) => setType(e.target.value as any)}
          className="h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white">
          <option value="all">All Types</option>
          <option>Bank</option><option>Card</option><option>EWallet</option><option>Crypto</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as any)}
          className="h-9 px-3 rounded-lg border border-slate-200 text-sm bg-white">
          <option value="all">All Statuses</option>
          <option>Active</option><option>Pending</option><option>Frozen</option><option>Removed</option>
        </select>
        <div className="flex-1" />
        <Button variant="secondary" onClick={() => demoAction("打开高级筛选")}>
          <SlidersHorizontal className="w-4 h-4" />高级筛选
        </Button>
      </div>

      <Card padding="none">
        <EnhancedDataTable<Beneficiary>
          columns={columns} data={filtered} keyExtractor={(r) => r.id}
          pagination pageSize={20}
          tableId="funds-beneficiaries"
          emptyText="无匹配的收款方式"
        />
      </Card>
    </div>
  );
}

function KpiSimple({ label, value, tone }: { label: string; value: number; tone?: "emerald" | "amber" | "red" }) {
  const text = tone === "emerald" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : tone === "red" ? "text-red-700" : "text-slate-900";
  return (
    <Card className="!p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={cn("text-xl font-semibold tabular-nums mt-0.5", text)}>{value.toLocaleString()}</p>
    </Card>
  );
}
