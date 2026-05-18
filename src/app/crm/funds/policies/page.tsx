"use client";

/**
 * Policies & Limits — v2.2 final
 *
 * 10 sub-categories grouped into 4 sections. Left nav + right panel pattern.
 * Each policy panel is read-only here (editing dialogs left as `Edit` buttons).
 */

import { useState } from "react";
import {
  ChevronRight, Pencil, Power, Check, X, Minus, CheckCircle2, ShieldAlert,
} from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, EnhancedDataTable, type Column } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { actionDone, demoEdit } from "@/components/crm/funds/use-funds-toast";

type CategoryKey =
  | "deposit_limits" | "withdrawal_limits" | "transfer_limits"
  | "withdrawal_rules" | "concurrency"
  | "crypto_security" | "account_cooldown"
  | "automation"
  | "channel_eligibility" | "transfer_rules"
  | "kyc_mapping" | "first_withdrawal" | "country_restrictions";

interface CategoryDef {
  key: CategoryKey;
  section: "Limits" | "Withdrawal Rules" | "Security" | "Automation" | "Eligibility" | "KYC & Country";
  label: string;
  description: string;
}

const CATEGORIES: CategoryDef[] = [
  { key: "deposit_limits",     section: "Limits", label: "Deposit Limits",     description: "Per-tier daily / monthly / per-txn caps" },
  { key: "withdrawal_limits",  section: "Limits", label: "Withdrawal Limits",  description: "Per-tier daily / monthly / per-txn caps" },
  { key: "transfer_limits",    section: "Limits", label: "Transfer Limits",    description: "5 transfer scenarios" },

  { key: "withdrawal_rules",   section: "Withdrawal Rules", label: "Withdrawal Rules",      description: "Holdings / Margin / Withdrawable formula / Decimals / Deduction" },
  { key: "concurrency",        section: "Withdrawal Rules", label: "Concurrency Limits",    description: "Pending caps per client / channel / platform" },

  { key: "crypto_security",    section: "Security", label: "Crypto Security",   description: "Address whitelist / chain whitelist / cooldown / confirms" },
  { key: "account_cooldown",   section: "Security", label: "Account Change Cooldown", description: "Behavior per field after key info change" },

  { key: "automation",         section: "Automation", label: "Automation Rules", description: "Auto deposit / auto withdrawal / auto transfer conditions" },

  { key: "channel_eligibility",section: "Eligibility", label: "Channel Eligibility", description: "7-dim matrix + override" },
  { key: "transfer_rules",     section: "Eligibility", label: "Transfer Rules",     description: "5 scenarios — limits / FX / P2P controls" },

  { key: "kyc_mapping",        section: "KYC & Country", label: "KYC Tier Mapping",     description: "Tier → funds permission matrix" },
  { key: "first_withdrawal",   section: "KYC & Country", label: "First Withdrawal Rule", description: "Force manual on first WD" },
  { key: "country_restrictions",section: "KYC & Country", label: "Country Restrictions", description: "Allow / hold / block per ISO country" },
];

export default function PoliciesPage() {
  const [active, setActive] = useState<CategoryKey>("withdrawal_rules");
  const current = CATEGORIES.find((c) => c.key === active)!;
  const grouped: Record<string, CategoryDef[]> = {};
  for (const c of CATEGORIES) (grouped[c.section] ??= []).push(c);

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Funds" }, { label: "Policies & Limits" }]} />
      <PageHeader
        title="Policies & Limits"
        description="所有自动化与限制规则的可视化配置 · 10 个子分类"
        actions={<Button variant="secondary" onClick={() => demoEdit(current.label)}><Pencil className="w-4 h-4" />Edit</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        <nav className="space-y-4">
          {Object.entries(grouped).map(([sec, items]) => (
            <div key={sec}>
              <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{sec}</p>
              <ul className="space-y-0.5">
                {items.map((c) => {
                  const isActive = c.key === active;
                  return (
                    <li key={c.key}>
                      <button onClick={() => setActive(c.key)}
                        className={cn("w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-colors text-sm",
                          isActive ? "bg-blue-50 text-primary" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}>
                        <span className={cn("truncate", isActive && "font-semibold")}>{c.label}</span>
                        <ChevronRight className={cn("w-3.5 h-3.5 flex-shrink-0", isActive ? "text-primary" : "text-slate-300")} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <Card padding="none">
          <header className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">{current.label}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{current.description}</p>
          </header>
          <div className="p-5">
            <Panel categoryKey={active} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Panel({ categoryKey }: { categoryKey: CategoryKey }) {
  switch (categoryKey) {
    case "deposit_limits":      return <TierLimitTable mode="Deposit" />;
    case "withdrawal_limits":   return <TierLimitTable mode="Withdrawal" />;
    case "transfer_limits":     return <TransferLimitsTable />;
    case "withdrawal_rules":    return <WithdrawalRulesPanel />;
    case "concurrency":         return <ConcurrencyPanel />;
    case "crypto_security":     return <CryptoSecurityPanel />;
    case "account_cooldown":    return <AccountCooldownPanel />;
    case "automation":          return <AutomationPanel />;
    case "channel_eligibility": return <ChannelEligibilityPanel />;
    case "transfer_rules":      return <TransferRulesPanel />;
    case "kyc_mapping":         return <KycMatrixPanel />;
    case "first_withdrawal":    return <FirstWithdrawalPanel />;
    case "country_restrictions":return <CountryRestrictionsPanel />;
  }
}

/* ── Panels ────────────────────────────────────────────────────── */

function TierLimitTable({ mode }: { mode: "Deposit" | "Withdrawal" }) {
  const rows = mode === "Deposit"
    ? [
      { tier: "Tier1", daily: 1_000,   monthly: 10_000,    perTxn: 1_000 },
      { tier: "Tier2", daily: 20_000,  monthly: 200_000,   perTxn: 20_000 },
      { tier: "Tier3", daily: 100_000, monthly: 1_500_000, perTxn: 100_000 },
    ]
    : [
      { tier: "Tier1", daily: 1_000,   monthly: 5_000,     perTxn: 1_000 },
      { tier: "Tier2", daily: 20_000,  monthly: 100_000,   perTxn: 10_000 },
      { tier: "Tier3", daily: 100_000, monthly: 1_000_000, perTxn: 50_000 },
    ];
  const cols: Column<typeof rows[0]>[] = [
    { key: "tier",    title: "KYC tier", width: "100px",                     render: (r) => <span className="text-xs font-semibold text-slate-800">{r.tier}</span> },
    { key: "perTxn",  title: "Per transaction", align: "right",              render: (r) => <span className="text-xs tabular-nums">${r.perTxn.toLocaleString()}</span> },
    { key: "daily",   title: "Daily cap",       align: "right",              render: (r) => <span className="text-xs tabular-nums">${r.daily.toLocaleString()}</span> },
    { key: "monthly", title: "Monthly cap",     align: "right",              render: (r) => <span className="text-xs tabular-nums">${r.monthly.toLocaleString()}</span> },
  ];
  return <EnhancedDataTable columns={cols} data={rows} keyExtractor={(r) => r.tier} />;
}

function TransferLimitsTable() {
  const rows = [
    { scenario: "Account ↔ Account", perTxn: 500_000, daily: 1_000_000, autoApprove: true, note: "Same beneficial owner — full auto" },
    { scenario: "Wallet → Account",  perTxn: 500_000, daily: 500_000,   autoApprove: true, note: "Wallet to MT internal" },
    { scenario: "Account → Wallet",  perTxn: 50_000,  daily: 100_000,   autoApprove: false, note: "Goes through Withdrawal Rules" },
    { scenario: "Wallet → Wallet (P2P)", perTxn: 10_000, daily: 20_000, autoApprove: false, note: "IB only + Compliance signoff" },
    { scenario: "Bonus Injection",   perTxn: 5_000,   daily: 50_000,    autoApprove: false, note: "Marketing → bonus wallet" },
  ];
  const cols: Column<typeof rows[0]>[] = [
    { key: "scenario", title: "Scenario", minWidth: "180px", render: (r) => <span className="text-xs font-medium text-slate-800">{r.scenario}</span> },
    { key: "perTxn",   title: "Per Txn",      align: "right",  render: (r) => <span className="text-xs tabular-nums">${r.perTxn.toLocaleString()}</span> },
    { key: "daily",    title: "Daily Cap",    align: "right",  render: (r) => <span className="text-xs tabular-nums">${r.daily.toLocaleString()}</span> },
    { key: "auto",     title: "Auto-Approve", width: "120px", render: (r) =>
      r.autoApprove
        ? <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Yes</span>
        : <span className="inline-flex items-center gap-1.5 text-xs text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Manual</span> },
    { key: "note",     title: "Note", minWidth: "240px", render: (r) => <span className="text-xs text-slate-500">{r.note}</span> },
  ];
  return <EnhancedDataTable columns={cols} data={rows} keyExtractor={(r) => r.scenario} />;
}

function WithdrawalRulesPanel() {
  return (
    <div className="space-y-4">
      <WithdrawableFormulaEditor />

      <div className="border-t border-slate-100 pt-4 space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">其他规则</h4>
        {[
          { label: "Holdings Interception",   value: "金额受限于 Withdrawable (推荐 B3)" },
          { label: "Margin Level Thresholds", value: "≥200% 通过 / 150-200% 警告 / 100-150% 强制人工 / <100% 拒" },
          { label: "Decimal Places",          value: "USD/EUR/GBP 2 · USDT-TRC20 6 · USDT-ERC20 8 · BTC 8" },
          { label: "Deduction Strategy",      value: "Same-Channel First (cross-channel → Manual + Compliance)" },
        ].map((s) => (
          <div key={s.label} className="flex items-start gap-3 p-3 rounded-lg border border-emerald-100 bg-emerald-50/40">
            <Power className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800">{s.label}</p>
              <p className="text-xs text-slate-600 mt-0.5">{s.value}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => demoEdit("规则")}><Pencil className="w-3.5 h-3.5" />Edit</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Withdrawable Formula 完整编辑器 ────────────────────────── */

type Preset = "A" | "B" | "C" | "D" | "DSL";

const PRESET_LABEL: Record<Preset, string> = {
  A:   "Preset A · Conservative",
  B:   "Preset B · Free Margin + Stop-Out (推荐)",
  C:   "Preset C · Closed Realized Only",
  D:   "Preset D · Available Balance",
  DSL: "Custom DSL (Finance + Compliance 双人复核)",
};

const PRESET_FORMULA: Record<Preset, string> = {
  A:   "Equity - UsedMargin × (1 + safetyBuffer)",
  B:   "Equity - UsedMargin × (100% / stopOutLevel)",
  C:   "min(Equity, Balance) - Bonus - Credit - PendingOrders",
  D:   "Balance - Bonus - Credit - PendingOrders - PendingWithdrawals",
  DSL: "",
};

interface CalcInputs {
  equity: number;
  balance: number;
  usedMargin: number;
  bonus: number;
  credit: number;
  pendingOrders: number;
  pendingWithdrawals: number;
  safetyBuffer: number;   // for A
  stopOutLevel: number;   // for B (50 = 50%)
  customDsl: string;
}

const DEFAULT_INPUT: CalcInputs = {
  equity: 16200, balance: 16000, usedMargin: 4100,
  bonus: 0, credit: 0, pendingOrders: 0, pendingWithdrawals: 0,
  safetyBuffer: 0.2, stopOutLevel: 50,
  customDsl: "// VIP 给 10% 额外额度\nif (UserTag == \"VIP\",\n  Equity - UsedMargin * 1.1,\n  Equity - UsedMargin * 1.3)",
};

function evaluateFormula(preset: Preset, i: CalcInputs): number {
  switch (preset) {
    case "A": return i.equity - i.usedMargin * (1 + i.safetyBuffer);
    case "B": return i.equity - i.usedMargin * (100 / i.stopOutLevel);
    case "C": return Math.min(i.equity, i.balance) - i.bonus - i.credit - i.pendingOrders;
    case "D": return i.balance - i.bonus - i.credit - i.pendingOrders - i.pendingWithdrawals;
    case "DSL": return i.equity - i.usedMargin * 1.3; // mock — real impl would parse the DSL
  }
}

const SAMPLE_HISTORY = [
  { id: "WW-2026-0001", client: "John Smith",   actual: 11500, equity: 16200, usedMargin: 4100, currentPreset: "B" as Preset },
  { id: "WW-2026-0003", client: "Michael Brown",actual: 6500,  equity: 7100,  usedMargin: 600,  currentPreset: "B" as Preset },
  { id: "WW-2026-0005", client: "Carlos Mendez",actual: 1500,  equity: 5800,  usedMargin: 4100, currentPreset: "B" as Preset },
];

function WithdrawableFormulaEditor() {
  const [active, setActive] = useState<Preset>("B");
  const [inputs, setInputs] = useState<CalcInputs>(DEFAULT_INPUT);

  const calc = (preset: Preset) => evaluateFormula(preset, inputs);
  const result = calc(active);

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Power className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-slate-900">Withdrawable Amount Formula</h3>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-primary font-semibold">DSL 改动需 Compliance 签</span>
      </div>

      {/* Preset selector */}
      <div className="space-y-2 mb-4">
        {(["A", "B", "C", "D", "DSL"] as Preset[]).map((p) => (
          <label
            key={p}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
              active === p ? "border-primary bg-white" : "border-slate-200 bg-white/50 hover:bg-white",
            )}
          >
            <input
              type="radio"
              name="preset"
              checked={active === p}
              onChange={() => setActive(p)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800">{PRESET_LABEL[p]}</p>
              {PRESET_FORMULA[p] && (
                <p className="text-xs font-mono text-slate-600 mt-1">{PRESET_FORMULA[p]}</p>
              )}
              {p === "B" && active === "B" && (
                <div className="mt-2 flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5">
                    <span className="text-slate-500">safetyBuffer:</span>
                    <input
                      type="number" step="0.1"
                      value={inputs.safetyBuffer}
                      onChange={(e) => setInputs({ ...inputs, safetyBuffer: Number(e.target.value) })}
                      className="w-20 h-7 px-2 rounded border border-slate-200 text-xs"
                    />
                  </label>
                  <label className="flex items-center gap-1.5">
                    <span className="text-slate-500">stopOutLevel:</span>
                    <input
                      type="number"
                      value={inputs.stopOutLevel}
                      onChange={(e) => setInputs({ ...inputs, stopOutLevel: Number(e.target.value) })}
                      className="w-20 h-7 px-2 rounded border border-slate-200 text-xs"
                    /> <span className="text-slate-500">%</span>
                  </label>
                </div>
              )}
              {p === "DSL" && active === "DSL" && (
                <div className="mt-2 space-y-2">
                  <p className="text-[11px] text-slate-500">
                    可用变量：Equity / Balance / UsedMargin / FreeMargin / Bonus / Credit / Pending / Floating / Realized / DailyWithdrawn / KYCTier / UserTag · 函数：min / max / clamp / if
                  </p>
                  <textarea
                    rows={6}
                    value={inputs.customDsl}
                    onChange={(e) => setInputs({ ...inputs, customDsl: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono bg-slate-900 text-emerald-300 focus:outline-none focus:border-blue-300"
                  />
                </div>
              )}
            </div>
          </label>
        ))}
      </div>

      {/* Live calculator */}
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">实时计算器</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <CalcInput label="Equity"        value={inputs.equity}        onChange={(v) => setInputs({ ...inputs, equity: v })} />
          <CalcInput label="Balance"       value={inputs.balance}       onChange={(v) => setInputs({ ...inputs, balance: v })} />
          <CalcInput label="Used Margin"   value={inputs.usedMargin}    onChange={(v) => setInputs({ ...inputs, usedMargin: v })} />
          <CalcInput label="Bonus"         value={inputs.bonus}         onChange={(v) => setInputs({ ...inputs, bonus: v })} />
          <CalcInput label="Credit"        value={inputs.credit}        onChange={(v) => setInputs({ ...inputs, credit: v })} />
          <CalcInput label="Pending Order" value={inputs.pendingOrders} onChange={(v) => setInputs({ ...inputs, pendingOrders: v })} />
          <CalcInput label="Pending WD"    value={inputs.pendingWithdrawals} onChange={(v) => setInputs({ ...inputs, pendingWithdrawals: v })} />
        </div>
        <div className="border-t border-slate-100 pt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-slate-500">Withdrawable (当前公式)</span>
            <span className="text-2xl font-semibold text-emerald-700 tabular-nums">${result.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* History sandbox */}
      <div className="rounded-lg border border-slate-200 bg-white p-3 mt-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">历史回算沙盒</h4>
        <p className="text-[11px] text-slate-500 mb-2">用最近 3 笔出金套用当前公式 ({active}) — 对比当时实际放款</p>
        <table className="w-full text-xs">
          <thead className="text-left text-slate-500 border-b border-slate-100">
            <tr>
              <th className="py-1.5 font-medium">Withdrawal ID</th>
              <th className="py-1.5 font-medium">Client</th>
              <th className="py-1.5 font-medium text-right">Actual (B)</th>
              <th className="py-1.5 font-medium text-right">New ({active})</th>
              <th className="py-1.5 font-medium text-right">Δ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {SAMPLE_HISTORY.map((h) => {
              const recalc = evaluateFormula(active, { ...inputs, equity: h.equity, usedMargin: h.usedMargin });
              const delta = recalc - h.actual;
              return (
                <tr key={h.id}>
                  <td className="py-1.5 font-mono text-primary">{h.id}</td>
                  <td className="py-1.5 text-slate-700">{h.client}</td>
                  <td className="py-1.5 text-right tabular-nums">${h.actual.toLocaleString()}</td>
                  <td className="py-1.5 text-right tabular-nums">${recalc.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className={cn("py-1.5 text-right tabular-nums font-semibold",
                    Math.abs(delta) < 100 ? "text-slate-500" : delta > 0 ? "text-emerald-700" : "text-red-700")}>
                    {delta >= 0 ? "+" : ""}${delta.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => { setInputs(DEFAULT_INPUT); setActive("B"); actionDone("已还原为默认"); }}>
          还原
        </Button>
        <Button onClick={() => actionDone(active === "DSL" ? "已提交 Compliance 复核" : `已应用 ${PRESET_LABEL[active]}`)}>
          {active === "DSL" ? "提交 Compliance 复核" : "应用为默认公式"}
        </Button>
      </div>
    </div>
  );
}

function CalcInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] text-slate-500 block mb-0.5">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className="w-full h-8 px-2 rounded border border-slate-200 text-xs tabular-nums focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100"
      />
    </label>
  );
}

function ConcurrencyPanel() {
  const rows = [
    { metric: "Pending deposits per client",   value: 3   },
    { metric: "Pending withdrawals per client", value: 2  },
    { metric: "Daily Pending累计 per client",   value: 10 },
    { metric: "Per-channel in-flight",          value: 50 },
    { metric: "Platform-wide in-flight WDs",    value: 200 },
  ];
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.metric} className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-800">{r.metric}</p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-slate-900 tabular-nums">{r.value}</span>
            <Button size="sm" variant="secondary" onClick={() => demoEdit("规则")}><Pencil className="w-3.5 h-3.5" />Edit</Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CryptoSecurityPanel() {
  const rules = [
    { label: "Address Whitelist", value: "自助≤$1k+24h cooldown / 人工>$1k 必审 (B-A3)", enabled: true },
    { label: "Chain Whitelist", value: "TRC20 / ERC20 / Polygon", enabled: true },
    { label: "Large USDT Threshold", value: "单笔 ≥ $10k → 强制人工 + Compliance", enabled: true },
    { label: "Chainalysis Integration", value: "Severe → 拒 · High → 挂起", enabled: true },
    { label: "Deposit-to-Withdrawal Cooldown", value: "USDT 充值后 24h 不可提币", enabled: true },
    { label: "Min Confirmations", value: "TRC20: 6 · ERC20: 12 · BTC: 6", enabled: true },
  ];
  return (
    <ul className="space-y-2">
      {rules.map((r) => (
        <li key={r.label} className="flex items-start gap-3 p-3 rounded-lg border border-emerald-100 bg-emerald-50/40">
          <Power className="w-4 h-4 mt-0.5 text-emerald-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800">{r.label}</p>
            <p className="text-xs text-slate-600 mt-0.5">{r.value}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => demoEdit("规则")}><Pencil className="w-3.5 h-3.5" />Edit</Button>
        </li>
      ))}
    </ul>
  );
}

function AccountCooldownPanel() {
  const rows = [
    { field: "登录密码",     cooldown: "24h", behavior: "Block",            tone: "red" },
    { field: "2FA 设备",     cooldown: "48h", behavior: "Block",            tone: "red" },
    { field: "邮箱",         cooldown: "24h", behavior: "Block",            tone: "red" },
    { field: "手机号",       cooldown: "24h", behavior: "Block",            tone: "red" },
    { field: "银行卡绑定",   cooldown: "24h", behavior: "Manual + Compliance", tone: "amber" },
    { field: "USDT 地址",    cooldown: "24h", behavior: "Manual + Compliance", tone: "amber" },
    { field: "KYC 重新提交", cooldown: "0h (immediate)", behavior: "Allow", tone: "emerald" },
  ];
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-3 py-2 font-medium">变更字段</th>
            <th className="px-3 py-2 font-medium">冷却期</th>
            <th className="px-3 py-2 font-medium">期内出金行为</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.field}>
              <td className="px-3 py-2 text-slate-800">{r.field}</td>
              <td className="px-3 py-2 font-mono">{r.cooldown}</td>
              <td className="px-3 py-2">
                <span className={cn("inline-flex items-center gap-1.5",
                  r.tone === "red"     ? "text-red-700"     :
                  r.tone === "amber"   ? "text-amber-700"   :
                                          "text-emerald-700")}>
                  <span className={cn("w-1.5 h-1.5 rounded-full",
                    r.tone === "red"     ? "bg-red-500" :
                    r.tone === "amber"   ? "bg-amber-500" :
                                            "bg-emerald-500")} />
                  {r.behavior}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AutomationPanel() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-emerald-200 p-4 bg-emerald-50/30">
        <h3 className="text-sm font-semibold text-slate-800">Auto Deposit (默认开启的降级模型)</h3>
        <p className="text-xs text-slate-600 mt-1">条件不满足时降级到人工</p>
        <ul className="mt-3 space-y-1 text-xs text-slate-700">
          <li>• AML 通过</li>
          <li>• 金额匹配（自动匹配置信度 ≥ 70%）</li>
          <li>• 客户钱包 Active 状态</li>
          <li>• 非首次大额 (Tier1=$500 / Tier2=$5,000 / Tier3=$50,000)</li>
          <li>• 来源通道在白名单</li>
          <li>• 加密充值确认数已达成</li>
        </ul>
      </div>
      <div className="rounded-lg border border-amber-200 p-4 bg-amber-50/30">
        <h3 className="text-sm font-semibold text-slate-800">Auto Withdrawal (默认人工的升级模型)</h3>
        <p className="text-xs text-slate-600 mt-1">全部满足才走自动</p>
        <ul className="mt-3 space-y-1 text-xs text-slate-700">
          <li>• 风险分 ≤ 25</li>
          <li>• KYC tier ≥ 2</li>
          <li>• 每日小额次数 (Tier1 禁 / Tier2 3×$2k / Tier3 5×$5k)</li>
          <li>• 通道在白名单 + 同通道历史 3 笔成功</li>
          <li>• 关键信息冷却期外</li>
          <li>• Margin level after ≥ 200%</li>
          <li>• Fast-In-Out 未触发 / AML pass</li>
        </ul>
      </div>
    </div>
  );
}

function ChannelEligibilityPanel() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-600">通道准入 7 维矩阵在 <a href="/crm/funds/channels/wallet" className="text-primary hover:underline">Wallet Channels</a> 和 <a href="/crm/funds/channels/trading" className="text-primary hover:underline">Trading Channels</a> 详情页编辑。</p>
      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-xs font-medium text-slate-800 mb-2">7 个维度</p>
        <ul className="space-y-1 text-xs text-slate-700">
          <li>1. Region (国家/地区)</li>
          <li>2. KYC Tier (Tier1/2/3)</li>
          <li>3. User Tag (VIP/scalper/...)</li>
          <li>4. User Role (Client/IB/VIP)</li>
          <li>5. MT Account Type (Standard/Cents/ECN/VIP)</li>
          <li>6. IB Affiliation (直系 or 全树)</li>
          <li>7. Registration Source (营销审批后的可选清单)</li>
        </ul>
      </div>
    </div>
  );
}

function TransferRulesPanel() {
  return <TransferLimitsTable />;
}

function KycMatrixPanel() {
  const cell = (v: "yes" | "no" | "limited") =>
    v === "yes" ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> :
    v === "no"  ? <X     className="w-4 h-4 text-slate-300 mx-auto" /> :
                  <Minus className="w-4 h-4 text-amber-500 mx-auto" />;
  const rows = [
    { permission: "Deposit fiat",        t1: "limited" as const, t2: "yes" as const,     t3: "yes" as const,     note: "Tier1 cap $1k/day" },
    { permission: "Deposit crypto",      t1: "no" as const,      t2: "yes" as const,     t3: "yes" as const,     note: "" },
    { permission: "Withdraw fiat",       t1: "limited" as const, t2: "yes" as const,     t3: "yes" as const,     note: "Tier1 first WD always manual" },
    { permission: "Withdraw crypto",     t1: "no" as const,      t2: "yes" as const,     t3: "yes" as const,     note: "" },
    { permission: "Trading deposits",    t1: "limited" as const, t2: "yes" as const,     t3: "yes" as const,     note: "" },
    { permission: "Trading withdrawals", t1: "no" as const,      t2: "yes" as const,     t3: "yes" as const,     note: "" },
    { permission: "Transfers (P2P)",     t1: "no" as const,      t2: "no" as const,      t3: "limited" as const, note: "Only if role=IB" },
    { permission: "Bonus conversion",    t1: "no" as const,      t2: "limited" as const, t3: "yes" as const,     note: "Subject to terms" },
    { permission: "External direct MT",  t1: "no" as const,      t2: "no" as const,      t3: "yes" as const,     note: "VIP only" },
  ];
  const cols: Column<typeof rows[0]>[] = [
    { key: "permission", title: "Permission", minWidth: "200px", render: (r) => <span className="text-xs text-slate-800">{r.permission}</span> },
    { key: "t1",   title: "Tier1", align: "center", width: "80px", render: (r) => cell(r.t1) },
    { key: "t2",   title: "Tier2", align: "center", width: "80px", render: (r) => cell(r.t2) },
    { key: "t3",   title: "Tier3", align: "center", width: "80px", render: (r) => cell(r.t3) },
    { key: "note", title: "Note", minWidth: "200px", render: (r) => <span className="text-xs text-slate-500">{r.note || "—"}</span> },
  ];
  return (
    <div className="space-y-3">
      <EnhancedDataTable columns={cols} data={rows} keyExtractor={(r) => r.permission} />
      <p className="text-[11px] text-slate-500">
        Legend: <Check className="inline w-3 h-3 text-emerald-600" /> Yes ·{" "}
        <Minus className="inline w-3 h-3 text-amber-500" /> Limited ·{" "}
        <X className="inline w-3 h-3 text-slate-300" /> No
      </p>
    </div>
  );
}

function FirstWithdrawalPanel() {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 p-4 rounded-lg border border-emerald-200 bg-emerald-50/40">
        <Power className="w-5 h-5 mt-0.5 text-emerald-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-800">First-Withdrawal Manual Review · Enabled</p>
          <p className="text-xs text-slate-600 mt-1">
            First withdrawal always routes to manual review regardless of risk / amount / channel.
            Captures the standard fraud pattern (deposit → small win → withdraw out).
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => demoEdit("规则")}><Pencil className="w-3.5 h-3.5" />Edit</Button>
      </div>
      <p className="text-xs text-slate-500">
        Disabling this rule is a high-impact change. Get sign-off from Compliance before flipping it off.
      </p>
    </div>
  );
}

function CountryRestrictionsPanel() {
  const rows = [
    { iso: "US", country: "United States", action: "allow",  note: "" },
    { iso: "GB", country: "United Kingdom", action: "allow", note: "" },
    { iso: "JP", country: "Japan",         action: "allow",  note: "" },
    { iso: "RU", country: "Russia",        action: "hold",   note: "Sanctions watch — manual review required" },
    { iso: "IR", country: "Iran",          action: "block",  note: "OFAC sanctioned" },
    { iso: "KP", country: "North Korea",   action: "block",  note: "OFAC sanctioned" },
    { iso: "CU", country: "Cuba",          action: "block",  note: "OFAC sanctioned" },
  ];
  const TONE: Record<string, { text: string; dot: string; label: string }> = {
    allow: { text: "text-emerald-700", dot: "bg-emerald-500", label: "Allow" },
    hold:  { text: "text-amber-700",   dot: "bg-amber-500",   label: "Hold (manual)" },
    block: { text: "text-red-700",     dot: "bg-red-500",     label: "Block" },
  };
  const cols: Column<typeof rows[0]>[] = [
    { key: "country", title: "Country", minWidth: "200px", render: (r) => (
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-slate-500">{r.iso}</span>
        <span className="text-xs text-slate-800">{r.country}</span>
      </div>
    ) },
    { key: "action", title: "Action", width: "180px", render: (r) => {
      const t = TONE[r.action];
      return <span className={cn("inline-flex items-center gap-1.5 text-xs", t.text)}>
        <span className={cn("w-1.5 h-1.5 rounded-full", t.dot)} />{t.label}
      </span>;
    } },
    { key: "note", title: "Note", minWidth: "240px", render: (r) => <span className="text-xs text-slate-500">{r.note || "—"}</span> },
  ];
  return <EnhancedDataTable columns={cols} data={rows} keyExtractor={(r) => r.iso} />;
}
