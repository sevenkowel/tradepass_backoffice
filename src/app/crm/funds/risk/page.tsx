"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert, Ban, Activity, FileText, Pencil } from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, EnhancedDataTable, type Column } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { isoMinusHour, isoMinusDay } from "@/lib/mock/funds/v2/entities";
import { demoCreate } from "@/components/crm/funds/use-funds-toast";

type Tab = "rules" | "screening" | "blacklist" | "velocity" | "aml";

interface RiskRule { id: string; scope: string; name: string; trigger: string; action: "Block" | "Hold" | "Flag" | "Score+"; enabled: boolean; hits24h: number }
interface WalletScreen { address: string; network: string; client: string; score: number; severity: "Severe" | "High" | "Medium" | "Low" | "Clean"; source: string; flaggedAt: string; context?: string }
interface BlackEntry { type: "Address" | "IBAN" | "Card BIN" | "Email" | "Country"; value: string; reason: string; addedAt: string; addedBy: string }
interface VelEvent { id: string; client: string; rule: string; triggeredAt: string; action: "Held" | "Approved (override)" | "Auto-rejected" }
interface AmlReport { id: string; client: string; amount: number; category: "SAR" | "STR" | "Internal Review"; status: "Drafted" | "Filed" | "Closed"; filedAt?: string; filedBy?: string }

const RULES: RiskRule[] = [
  { id: "FR-001", scope: "Deposit",    name: "Wallet score ≥ 75 (Severe)",            trigger: "AML.walletScore ≥ 75",    action: "Block",  enabled: true, hits24h: 3 },
  { id: "FR-002", scope: "Withdrawal", name: "Fast In-Out 24h",                       trigger: "lastDepositAt within 2h",  action: "Hold",   enabled: true, hits24h: 5 },
  { id: "FR-003", scope: "Withdrawal", name: "High profit Tier1/2",                    trigger: "PnL7d > 2000 AND tier ≤ 2", action: "Hold",   enabled: true, hits24h: 4 },
  { id: "FR-004", scope: "Both",       name: "Velocity 5+ txn / 24h",                  trigger: "txnCount24h ≥ 5",          action: "Hold",   enabled: true, hits24h: 18 },
  { id: "FR-005", scope: "Withdrawal", name: "New device + amount > $5k",              trigger: "newDevice && amount > 5000",action: "Flag",   enabled: true, hits24h: 2 },
  { id: "FR-006", scope: "Deposit",    name: "Duplicate amount within 1h",             trigger: "sameAmount within 1h",     action: "Flag",   enabled: false, hits24h: 0 },
];

const SCREEN: WalletScreen[] = [
  { address: "0x9aa1...8821", network: "ERC20", client: "USR-90123", score: 87, severity: "Severe",  source: "Chainalysis", flaggedAt: isoMinusHour(1), context: "Linked to known mixer" },
  { address: "TXfa98...4422", network: "TRC20", client: "USR-67890", score: 65, severity: "Medium",  source: "Chainalysis", flaggedAt: isoMinusHour(2), context: "Sibling sanctioned" },
  { address: "TXza...4422",   network: "TRC20", client: "USR-23456", score: 12, severity: "Clean",   source: "Chainalysis", flaggedAt: isoMinusHour(4) },
  { address: "TXbc...5678",   network: "TRC20", client: "USR-12345", score: 8,  severity: "Clean",   source: "TRM",         flaggedAt: isoMinusHour(8) },
];

const BL: BlackEntry[] = [
  { type: "Address", value: "0xabad...0000",      reason: "OFAC sanctioned",          addedAt: isoMinusDay(45),  addedBy: "system" },
  { type: "IBAN",    value: "GB22 ROYL 0040 ...", reason: "Card fraud chargeback",     addedAt: isoMinusDay(20),  addedBy: "fin_002" },
  { type: "Card BIN",value: "BIN 414738",          reason: "High dispute rate",         addedAt: isoMinusDay(60),  addedBy: "fin_001" },
  { type: "Email",   value: "*@disposable-mail.net", reason: "Throwaway domain",       addedAt: isoMinusDay(90),  addedBy: "fin_001" },
  { type: "Country", value: "IR",                  reason: "OFAC sanctioned",          addedAt: isoMinusDay(180), addedBy: "system" },
];

const VEL: VelEvent[] = [
  { id: "VEL-001", client: "USR-67890", rule: "FR-002 Fast In-Out",     triggeredAt: isoMinusHour(1.2), action: "Held" },
  { id: "VEL-002", client: "USR-01234", rule: "FR-004 Velocity 5+",     triggeredAt: isoMinusHour(0.5), action: "Held" },
  { id: "VEL-003", client: "USR-23456", rule: "FR-003 High profit",     triggeredAt: isoMinusHour(3),    action: "Approved (override)" },
  { id: "VEL-004", client: "USR-34567", rule: "FR-001 Wallet Severe",   triggeredAt: isoMinusHour(1),    action: "Auto-rejected" },
];

const AML: AmlReport[] = [
  { id: "SAR-2026-014", client: "USR-90123", amount: 80_000, category: "SAR",             status: "Drafted" },
  { id: "STR-2026-051", client: "USR-34567", amount: 6_500,  category: "STR",             status: "Filed",  filedAt: isoMinusHour(20), filedBy: "cmp_001" },
  { id: "IR-2026-201",  client: "USR-67890", amount: 2_200,  category: "Internal Review", status: "Closed", filedAt: isoMinusHour(72), filedBy: "cmp_002" },
];

export default function FundsRiskPage() {
  const [tab, setTab] = useState<Tab>("rules");
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Funds" }, { label: "Risk & Compliance" }]} />
      <PageHeader title="Risk & Compliance" description="资金交易级风控规则 + 钱包筛查 + 黑名单 + Velocity + AML 报告"
        actions={tab === "rules" ? <Button variant="secondary" onClick={() => demoCreate("风控规则")}><Pencil className="w-4 h-4" />New Rule</Button> : null}
      />

      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        <Tb label="Active Rules"       icon={ShieldCheck} active={tab === "rules"}     onClick={() => setTab("rules")}     count={RULES.filter((r) => r.enabled).length} />
        <Tb label="Wallet Screening"   icon={ShieldAlert} active={tab === "screening"} onClick={() => setTab("screening")} count={SCREEN.filter((s) => s.severity === "Severe" || s.severity === "High").length} />
        <Tb label="Blacklist"          icon={Ban}         active={tab === "blacklist"} onClick={() => setTab("blacklist")} count={BL.length} />
        <Tb label="Velocity History"   icon={Activity}    active={tab === "velocity"}  onClick={() => setTab("velocity")}  count={VEL.length} />
        <Tb label="AML Reports"        icon={FileText}    active={tab === "aml"}       onClick={() => setTab("aml")}       count={AML.filter((r) => r.status !== "Closed").length} />
      </div>

      {tab === "rules"     && <Tbl rows={RULES} keyFn={(r) => r.id} cols={rulesCols} />}
      {tab === "screening" && <Tbl rows={SCREEN} keyFn={(r) => r.address} cols={screenCols} />}
      {tab === "blacklist" && <Tbl rows={BL} keyFn={(r) => `${r.type}-${r.value}`} cols={blCols} />}
      {tab === "velocity"  && <Tbl rows={VEL} keyFn={(r) => r.id} cols={velCols} />}
      {tab === "aml"       && <Tbl rows={AML} keyFn={(r) => r.id} cols={amlCols} />}
    </div>
  );
}

function Tbl<T>({ rows, keyFn, cols }: { rows: T[]; keyFn: (r: T) => string; cols: Column<T>[] }) {
  return <Card padding="none"><EnhancedDataTable<T> columns={cols} data={rows} keyExtractor={keyFn} /></Card>;
}

function Tb({ label, icon: Icon, active, onClick, count }: { label: string; icon: any; active: boolean; onClick: () => void; count: number }) {
  return (
    <button onClick={onClick} className={cn(
      "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
      active ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700",
    )}>
      <Icon className="w-3.5 h-3.5" />{label}
      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums", active ? "bg-blue-100 text-primary" : "bg-slate-100 text-slate-500")}>{count}</span>
    </button>
  );
}

const ACTION_FG: Record<RiskRule["action"], { text: string; dot: string }> = {
  Block:    { text: "text-red-700",    dot: "bg-red-500" },
  Hold:     { text: "text-amber-700",  dot: "bg-amber-500" },
  Flag:     { text: "text-blue-700",   dot: "bg-blue-500" },
  "Score+": { text: "text-slate-600",  dot: "bg-slate-400" },
};

const SEV_FG = {
  Severe: { text: "text-red-700",     dot: "bg-red-500" },
  High:   { text: "text-orange-700",  dot: "bg-orange-500" },
  Medium: { text: "text-amber-700",   dot: "bg-amber-500" },
  Low:    { text: "text-blue-700",    dot: "bg-blue-500" },
  Clean:  { text: "text-emerald-700", dot: "bg-emerald-500" },
} as const;

const rulesCols: Column<RiskRule>[] = [
  { key: "id", title: "Rule", width: "100px", render: (r) => <span className="text-xs font-mono text-primary">{r.id}</span> },
  { key: "scope", title: "Scope", width: "100px", render: (r) => <span className="text-xs">{r.scope}</span> },
  { key: "name", title: "Name", minWidth: "240px", render: (r) => <span className="text-xs font-medium text-slate-800">{r.name}</span> },
  { key: "trigger", title: "Trigger", minWidth: "240px", render: (r) => <span className="text-xs font-mono text-slate-600">{r.trigger}</span> },
  { key: "action", title: "Action", width: "100px", render: (r) => {
    const a = ACTION_FG[r.action];
    return <span className={cn("inline-flex items-center gap-1.5 text-xs", a.text)}><span className={cn("w-1.5 h-1.5 rounded-full", a.dot)} />{r.action}</span>;
  } },
  { key: "hits", title: "Hits 24h", width: "100px", align: "right", render: (r) => <span className="text-xs tabular-nums">{r.hits24h}</span> },
  { key: "enabled", title: "Status", width: "100px", render: (r) => r.enabled
    ? <span className="text-xs text-emerald-700 inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active</span>
    : <span className="text-xs text-slate-400 inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-300" />Disabled</span>
  },
];

const screenCols: Column<WalletScreen>[] = [
  { key: "address", title: "Address", minWidth: "180px", render: (r) => <span className="text-xs font-mono">{r.address}</span> },
  { key: "network", title: "Network", width: "100px", render: (r) => <span className="text-xs">{r.network}</span> },
  { key: "client",  title: "Client",  width: "140px", render: (r) => <span className="text-xs font-mono">{r.client}</span> },
  { key: "score", title: "Score", width: "90px", align: "right", render: (r) => <span className="text-xs tabular-nums">{r.score}</span> },
  { key: "severity", title: "Severity", width: "110px", render: (r) => {
    const s = SEV_FG[r.severity];
    return <span className={cn("inline-flex items-center gap-1.5 text-xs", s.text)}><span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />{r.severity}</span>;
  } },
  { key: "source",  title: "Source",  width: "110px", render: (r) => <span className="text-xs">{r.source}</span> },
  { key: "context", title: "Context", minWidth: "220px", render: (r) => <span className="text-xs text-slate-500">{r.context || "—"}</span> },
];

const blCols: Column<BlackEntry>[] = [
  { key: "type", title: "Type", width: "120px", render: (r) => <span className="text-xs font-medium">{r.type}</span> },
  { key: "value", title: "Value", minWidth: "260px", render: (r) => <span className="text-xs font-mono">{r.value}</span> },
  { key: "reason", title: "Reason", minWidth: "240px", render: (r) => <span className="text-xs text-slate-500">{r.reason}</span> },
  { key: "added", title: "Added", width: "150px", render: (r) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs">{new Date(r.addedAt).toLocaleDateString()}</span>
      <span className="text-[11px] font-mono text-slate-500">{r.addedBy}</span>
    </div>
  ) },
];

const VEL_ACTION_FG = {
  "Held":                { text: "text-amber-700",   dot: "bg-amber-500" },
  "Approved (override)": { text: "text-emerald-700", dot: "bg-emerald-500" },
  "Auto-rejected":       { text: "text-red-700",     dot: "bg-red-500" },
} as const;
const velCols: Column<VelEvent>[] = [
  { key: "id", title: "Event", width: "110px", render: (r) => <span className="text-xs font-mono text-primary">{r.id}</span> },
  { key: "client", title: "Client", width: "140px", render: (r) => <span className="text-xs font-mono">{r.client}</span> },
  { key: "rule", title: "Rule", minWidth: "240px", render: (r) => <span className="text-xs">{r.rule}</span> },
  { key: "action", title: "Action", width: "180px", render: (r) => {
    const a = VEL_ACTION_FG[r.action];
    return <span className={cn("inline-flex items-center gap-1.5 text-xs", a.text)}><span className={cn("w-1.5 h-1.5 rounded-full", a.dot)} />{r.action}</span>;
  } },
  { key: "at", title: "Triggered", width: "180px", render: (r) => <span className="text-xs">{new Date(r.triggeredAt).toLocaleString()}</span> },
];

const AML_STATUS_FG = {
  Drafted: { text: "text-amber-700",   dot: "bg-amber-500" },
  Filed:   { text: "text-blue-700",    dot: "bg-blue-500" },
  Closed:  { text: "text-emerald-700", dot: "bg-emerald-500" },
} as const;
const amlCols: Column<AmlReport>[] = [
  { key: "id", title: "Report", width: "150px", render: (r) => <span className="text-xs font-mono text-primary">{r.id}</span> },
  { key: "category", title: "Category", width: "140px", render: (r) => <span className="text-xs font-medium">{r.category}</span> },
  { key: "client", title: "Client", width: "140px", render: (r) => <span className="text-xs font-mono">{r.client}</span> },
  { key: "amount", title: "Amount", width: "120px", align: "right", render: (r) => <span className="text-xs tabular-nums">${r.amount.toLocaleString()}</span> },
  { key: "status", title: "Status", width: "120px", render: (r) => {
    const s = AML_STATUS_FG[r.status];
    return <span className={cn("inline-flex items-center gap-1.5 text-xs", s.text)}><span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />{r.status}</span>;
  } },
  { key: "filed", title: "Filed", width: "160px", render: (r) => r.filedAt
    ? <div className="flex flex-col"><span className="text-xs">{new Date(r.filedAt).toLocaleDateString()}</span><span className="text-[11px] font-mono text-slate-500">{r.filedBy}</span></div>
    : <span className="text-xs text-slate-400">—</span>
  },
];
