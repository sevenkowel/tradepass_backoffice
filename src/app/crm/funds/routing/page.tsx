"use client";

import { useMemo, useState } from "react";
import { Pencil, ChevronRight, GitBranch, Play, Plus, Check, ArrowRight } from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { demoCreate, demoEdit } from "@/components/crm/funds/use-funds-toast";

type RuleKind = "Wallet Deposit" | "Wallet Withdrawal" | "Trading Deposit" | "Trading Withdrawal";

interface SandboxInputs {
  country: string;
  kyc_tier: string;
  amount: number;
  currency: string;
  risk: string;
  source: string;
  user_tag: string;
  margin_after: number;
}

const DEFAULT_INPUTS: SandboxInputs = {
  country: "US", kyc_tier: "Tier2", amount: 500, currency: "USDT",
  risk: "Low", source: "Wallet", user_tag: "Standard", margin_after: 250,
};

interface RoutingRule {
  id: string;
  kind: RuleKind;
  priority: number;
  name: string;
  conditions: { field: string; op: string; value: string }[];
  target: string;
  enabled: boolean;
  fallback?: boolean;
}

const RULES: RoutingRule[] = [
  { id: "RR-W-001", kind: "Wallet Deposit",  priority: 10, name: "ID 客户小额 → DOKU", conditions: [{ field: "country", op: "eq", value: "ID" }, { field: "amount", op: "<", value: "$1,000" }], target: "DOKU IDR", enabled: true },
  { id: "RR-W-002", kind: "Wallet Deposit",  priority: 20, name: "Tier2+ 加密 → TRC20", conditions: [{ field: "kyc_tier", op: "in", value: "Tier2, Tier3" }, { field: "currency", op: "eq", value: "USDT" }], target: "USDT TRC20", enabled: true },
  { id: "RR-W-003", kind: "Wallet Deposit",  priority: 30, name: "Tier3 大额 → Bank Wire", conditions: [{ field: "kyc_tier", op: "eq", value: "Tier3" }, { field: "amount", op: ">", value: "$5,000" }], target: "Bank Wire", enabled: true },
  { id: "RR-W-DEF", kind: "Wallet Deposit",  priority: 999, name: "默认 — Visa Card",     conditions: [], target: "Visa Card", enabled: true, fallback: true },

  { id: "RR-WW-001", kind: "Wallet Withdrawal", priority: 10, name: "USDT 小额 → TRC20", conditions: [{ field: "currency", op: "eq", value: "USDT" }, { field: "amount", op: "<", value: "$10,000" }], target: "USDT TRC20", enabled: true },
  { id: "RR-WW-002", kind: "Wallet Withdrawal", priority: 20, name: "USDT 大额 → ERC20", conditions: [{ field: "currency", op: "eq", value: "USDT" }, { field: "amount", op: ">", value: "$10,000" }], target: "USDT ERC20", enabled: true },
  { id: "RR-WW-003", kind: "Wallet Withdrawal", priority: 30, name: "高风险 → 手动 Bank Wire", conditions: [{ field: "risk", op: "in", value: "Critical, High" }], target: "Bank Wire (manual)", enabled: true },
  { id: "RR-WW-DEF", kind: "Wallet Withdrawal", priority: 999, name: "默认 — Bank Wire",        conditions: [], target: "Bank Wire", enabled: true, fallback: true },

  { id: "RR-TD-001", kind: "Trading Deposit", priority: 10, name: "Wallet 内转 → MT (内部)", conditions: [{ field: "source", op: "eq", value: "Wallet" }], target: "Internal Transfer", enabled: true },
  { id: "RR-TD-002", kind: "Trading Deposit", priority: 20, name: "VIP 外部直入 → 直入通道",  conditions: [{ field: "kyc_tier", op: "eq", value: "Tier3" }, { field: "user_tag", op: "eq", value: "VIP" }], target: "Bank Wire Direct", enabled: true },

  { id: "RR-TW-001", kind: "Trading Withdrawal", priority: 10, name: "Low risk + margin OK → 自动内转", conditions: [{ field: "risk", op: "eq", value: "Low" }, { field: "margin_after", op: ">", value: "200%" }], target: "Internal (auto)", enabled: true },
  { id: "RR-TW-002", kind: "Trading Withdrawal", priority: 20, name: "High risk → 强制人工 + Bank Wire", conditions: [{ field: "risk", op: "in", value: "Critical, High" }], target: "Bank Wire (manual)", enabled: true },
];

function matchAmount(op: string, value: string, n: number): boolean {
  const num = parseFloat(value.replace(/[^0-9.]/g, ""));
  if (op === "<") return n < num;
  if (op === ">") return n > num;
  return true;
}
function matchCondition(field: string, op: string, value: string, inputs: SandboxInputs): boolean {
  const v = inputs[field as keyof SandboxInputs];
  if (op === "eq") return String(v) === value;
  if (op === "in") return value.split(",").map((s) => s.trim()).includes(String(v));
  if (op === "<" || op === ">") return matchAmount(op, value, Number(v) || 0);
  return false;
}
function findMatchingRule(rules: RoutingRule[], inputs: SandboxInputs): RoutingRule | null {
  const ordered = [...rules].sort((a, b) => a.priority - b.priority);
  for (const r of ordered) {
    if (!r.enabled) continue;
    if (r.fallback) return r;
    const ok = r.conditions.every((c) => matchCondition(c.field, c.op, c.value, inputs));
    if (ok) return r;
  }
  return null;
}

export default function RoutingPage() {
  const [tab, setTab] = useState<RuleKind>("Wallet Deposit");
  const [inputs, setInputs] = useState<SandboxInputs>(DEFAULT_INPUTS);
  const rules = RULES.filter((r) => r.kind === tab);
  const matched = useMemo(() => findMatchingRule(rules, inputs), [rules, inputs]);

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Funds" }, { label: "Routing & Rules" }]} />
      <PageHeader title="Routing & Rules" description="动态通道选择 · 按优先级 · 支持 sandbox 测试"
        actions={<Button onClick={() => demoCreate("路由规则")}><Plus className="w-4 h-4" />New Rule</Button>}
      />

      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {(["Wallet Deposit", "Wallet Withdrawal", "Trading Deposit", "Trading Withdrawal"] as RuleKind[]).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={cn(
            "px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
            tab === k ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700",
          )}>{k}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {rules.map((r) => <RuleCard key={r.id} rule={r} matched={matched?.id === r.id} />)}
        </div>

        <Card className="!p-4 self-start lg:sticky lg:top-20">
          <div className="flex items-center gap-2 mb-3">
            <Play className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-slate-800">Trial Sandbox</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">输入虚拟交易参数，实时预览匹配规则。</p>

          <div className="space-y-2.5">
            <SandboxField label="Country" value={inputs.country} options={["US", "GB", "JP", "ID", "VN", "RU", "BR", "MX"]}
              onChange={(v) => setInputs({ ...inputs, country: v })} />
            <SandboxField label="KYC Tier" value={inputs.kyc_tier} options={["Tier1", "Tier2", "Tier3"]}
              onChange={(v) => setInputs({ ...inputs, kyc_tier: v })} />
            <SandboxField label="Currency" value={inputs.currency} options={["USDT", "USD", "EUR", "IDR", "BRL"]}
              onChange={(v) => setInputs({ ...inputs, currency: v })} />
            <SandboxField label="Risk" value={inputs.risk} options={["Critical", "High", "Medium", "Low"]}
              onChange={(v) => setInputs({ ...inputs, risk: v })} />
            <label className="block">
              <span className="text-[10px] text-slate-500 block mb-0.5">Amount (USD)</span>
              <input type="number" value={inputs.amount}
                onChange={(e) => setInputs({ ...inputs, amount: Number(e.target.value) })}
                className="w-full h-8 px-2 rounded border border-slate-200 text-xs tabular-nums" />
            </label>
            {tab === "Trading Deposit" && (
              <SandboxField label="Source" value={inputs.source} options={["Wallet", "External"]}
                onChange={(v) => setInputs({ ...inputs, source: v })} />
            )}
            {tab === "Trading Withdrawal" && (
              <label className="block">
                <span className="text-[10px] text-slate-500 block mb-0.5">Margin After (%)</span>
                <input type="number" value={inputs.margin_after}
                  onChange={(e) => setInputs({ ...inputs, margin_after: Number(e.target.value) })}
                  className="w-full h-8 px-2 rounded border border-slate-200 text-xs tabular-nums" />
              </label>
            )}
          </div>

          {/* Result */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">匹配结果</p>
            {matched ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">{matched.target}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  via <span className="font-mono">{matched.id}</span> · Priority {matched.priority}
                </p>
                <p className="text-xs text-slate-700">{matched.name}</p>
              </div>
            ) : (
              <p className="text-xs text-red-600">无规则匹配 — 交易将被拒</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SandboxField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] text-slate-500 block mb-0.5">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 px-2 rounded border border-slate-200 text-xs bg-white">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function RuleCard({ rule, matched }: { rule: RoutingRule; matched?: boolean }) {
  return (
    <Card className={cn("!p-4 transition-colors", matched && "border-emerald-300 bg-emerald-50/30 ring-2 ring-emerald-100")}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Priority {rule.priority}</span>
            {rule.fallback && <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Fallback</span>}
            {rule.enabled
              ? <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 inline-flex items-center gap-0.5"><Check className="w-3 h-3" />Active</span>
              : <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Disabled</span>}
            {matched && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 inline-flex items-center gap-0.5">
                <Check className="w-3 h-3" />Sandbox match
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mt-1">{rule.name}</h3>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{rule.id}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => demoEdit(rule.id)}>
          <Pencil className="w-3.5 h-3.5" />Edit
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-start gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">When</p>
          {rule.conditions.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Always (fallback)</p>
          ) : (
            <ul className="space-y-0.5">
              {rule.conditions.map((c, i) => (
                <li key={i} className="text-xs text-slate-700">
                  <span className="font-medium">{c.field}</span>{" "}
                  <span className="text-slate-500">{c.op}</span>{" "}
                  <span className="font-mono">{c.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 hidden md:block mt-2" />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Route to</p>
          <p className="text-sm font-semibold text-primary inline-flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5" />
            {rule.target}
          </p>
        </div>
      </div>
    </Card>
  );
}
