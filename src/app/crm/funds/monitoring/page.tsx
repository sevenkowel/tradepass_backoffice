"use client";

import { useState } from "react";
import { AlertTriangle, ShieldAlert, Activity, AlertCircle, Zap, Wallet } from "lucide-react";
import Link from "next/link";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader } from "@/components/crm/ui";
import { cn } from "@/lib/utils";
import { isoMinusMin } from "@/lib/mock/funds/v2/entities";

type Category = "all" | "large_dp" | "large_wd" | "velocity" | "aml" | "channel" | "auto_fail";

interface MonitorEvent {
  id: string;
  category: Exclude<Category, "all">;
  severity: "info" | "warn" | "error";
  message: string;
  at: string;
  ref?: string;
  amount?: number;
  client?: string;
}

const COUNTERS = [
  { key: "large_dp" as const, label: "Large Deposits",       today: 12, yesterday: 9,  threshold: "≥ $10,000" },
  { key: "large_wd" as const, label: "Large Withdrawals",    today: 5,  yesterday: 8,  threshold: "≥ $10,000" },
  { key: "velocity" as const, label: "Velocity",             today: 18, yesterday: 14, threshold: "≥ 5 txn / 24h / client" },
  { key: "aml" as const,      label: "AML Hits",             today: 4,  yesterday: 2,  threshold: "Score ≥ 75" },
  { key: "channel" as const,  label: "Channel Failures",     today: 22, yesterday: 18, threshold: "Failure rate ≥ 10%" },
  { key: "auto_fail" as const,label: "Auto Decision Failures", today: 9, yesterday: 11, threshold: "Auto-Hold/Reject" },
];

const EVENTS: MonitorEvent[] = [
  { id: "ALR-1", category: "aml",       severity: "error", message: "AML hit on DEP-00006",                                     at: isoMinusMin(35),  ref: "WD-2026-0004", client: "USR-90123", amount: 80_000 },
  { id: "ALR-2", category: "large_wd",  severity: "warn",  message: "Withdrawal $50k pending review beyond SLA",                  at: isoMinusMin(60),  ref: "WW-2026-0001", client: "USR-12345", amount: 50_000 },
  { id: "ALR-3", category: "velocity",  severity: "warn",  message: "Velocity threshold breached for USR-67890",                   at: isoMinusMin(70),  client: "USR-67890" },
  { id: "ALR-4", category: "channel",   severity: "warn",  message: "Bank Wire failure rate 14% in last hour",                   at: isoMinusMin(120) },
  { id: "ALR-5", category: "auto_fail", severity: "info",  message: "Auto-withdrawal rejected 4 in last hour (cooldown)",         at: isoMinusMin(180) },
  { id: "ALR-6", category: "large_dp",  severity: "info",  message: "Large deposit $80k USDT — Crypto AML screening",            at: isoMinusMin(360), ref: "WD-2026-0004", amount: 80_000 },
  { id: "ALR-7", category: "aml",       severity: "error", message: "Wallet screening Severe: mixer linked",                     at: isoMinusMin(35),  ref: "WD-2026-0004", client: "USR-90123" },
  { id: "ALR-8", category: "channel",   severity: "error", message: "USDT ERC20 confirmation lag · avg 18m (target 8m)",          at: isoMinusMin(150) },
  { id: "ALR-9", category: "velocity",  severity: "info",  message: "Fast-In-Out: deposit→WD in 2h",                              at: isoMinusMin(70),  ref: "WW-2026-0006", client: "USR-67890" },
];

const SEV_FG = {
  info:  { text: "text-slate-600", dot: "bg-slate-400" },
  warn:  { text: "text-amber-700", dot: "bg-amber-500" },
  error: { text: "text-red-700",   dot: "bg-red-500"   },
};

const ICON: Record<Exclude<Category, "all">, React.ComponentType<{ className?: string }>> = {
  large_dp: Wallet, large_wd: AlertTriangle, velocity: Activity,
  aml: ShieldAlert, channel: Zap, auto_fail: AlertCircle,
};

export default function MonitoringPage() {
  const [active, setActive] = useState<Category>("all");
  const filtered = active === "all" ? EVENTS : EVENTS.filter((e) => e.category === active);

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Funds" }, { label: "Fund Monitoring" }]} />
      <PageHeader title="Fund Monitoring" description="实时资金风险监控 · 6 类指标 + alert feed" />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {COUNTERS.map((c) => {
          const Icon = ICON[c.key];
          const trend = c.today > c.yesterday ? "↑" : c.today < c.yesterday ? "↓" : "→";
          const trendTone = c.today > c.yesterday ? "text-red-600" : c.today < c.yesterday ? "text-emerald-600" : "text-slate-500";
          return (
            <button key={c.key} onClick={() => setActive(active === c.key ? "all" : c.key)}>
              <Card className={cn("!p-3 hover:shadow-md transition-all text-left", active === c.key && "ring-2 ring-blue-100 border-primary")}>
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 truncate">{c.label}</p>
                <p className="text-2xl font-semibold text-slate-900 tabular-nums leading-tight mt-1">{c.today}</p>
                <p className={cn("text-[11px] mt-1", trendTone)}>{trend} vs {c.yesterday}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{c.threshold}</p>
              </Card>
            </button>
          );
        })}
      </div>

      <Card padding="none">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-slate-800">Alerts</h3>
            <span className="text-xs text-slate-500">({filtered.length})</span>
          </div>
          {active !== "all" && (
            <button onClick={() => setActive("all")} className="text-xs text-primary hover:underline">Clear filter</button>
          )}
        </div>
        <ol className="divide-y divide-slate-100">
          {filtered.map((e) => {
            const sev = SEV_FG[e.severity];
            return (
              <li key={e.id} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50/60 transition-colors">
                <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0", sev.dot)} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-800"><span className={cn("font-medium mr-1.5", sev.text)}>{COUNTERS.find((c) => c.key === e.category)?.label}</span>{e.message}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                    <span>{new Date(e.at).toLocaleString()}</span>
                    {e.client && <span className="font-mono">{e.client}</span>}
                    {e.amount && <span className="tabular-nums">${e.amount.toLocaleString()}</span>}
                    {e.ref && (
                      <Link href={`/crm/funds/${e.ref.startsWith("WD") ? "wallet-deposits" : e.ref.startsWith("WW") ? "wallet-withdrawals" : "transactions"}/${e.ref}`}
                        className="text-primary font-mono hover:underline">{e.ref}</Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}
