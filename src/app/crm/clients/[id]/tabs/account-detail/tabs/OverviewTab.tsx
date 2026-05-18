"use client";

/**
 * Overview Tab — 账户运营单页摘要
 *
 * 视觉层次（从上到下，按优先级）：
 *
 *   1. Account Profile          静态身份卡 — 9 个字段一行展示，定义"这是个什么账户"
 *   2. Risk + Financial         两列并排，KPI 级别，运营第一眼就要看到的数字
 *   3. Performance + Behavioral 两列并排，次级数据，决定"客户在怎么交易"
 *   4. (Alerts/Anomalies)       嵌在对应卡片底部，不占用顶部空间
 *
 * 设计原则：
 *   - 每个卡片只放 4-6 个最重要的字段，详细数据让用户去对应的 Tab。
 *   - 数字 emphasize 仅用于"看一眼就要做判断"的指标（Margin Level / Win Rate / 等）。
 *   - 颜色 tone 表示状态（绿=好，黄=注意，红=危险），不滥用。
 */

import { AlertTriangle, Shield, TrendingUp, Activity, IdCard } from "lucide-react";
import type {
  TradingAccount, AccountStatusBadge,
  RiskMetrics, FinancialMetrics, TradingPerformance, BehavioralSignals,
} from "@/types/backoffice/client-detail";
import { Section, Card, Metric, fmtMoney, fmtPct, timeAgo } from "../primitives";

interface Props {
  account: TradingAccount;
  badge: AccountStatusBadge;
  risk: RiskMetrics;
  financial: FinancialMetrics;
  performance: TradingPerformance;
  behavioral: BehavioralSignals;
}

export function OverviewTab({ account, risk, financial, performance, behavioral }: Props) {
  return (
    <div className="space-y-4">
      <ProfileSection account={account} />

      {/* 核心 KPI 两列并排 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RiskCard account={account} risk={risk} />
        <FinancialCard financial={financial} />
      </div>

      {/* 次级数据两列并排 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PerformanceCard performance={performance} currency={account.currency} />
        <BehavioralCard behavioral={behavioral} />
      </div>
    </div>
  );
}

/* ===================================================================== */
/* 0. Account Profile — 静态身份卡                                        */
/* ===================================================================== */

/** Server name → GMT offset 的粗略映射（broker server 通常用 GMT+2/+3）。 */
function serverTimezone(server: string): string {
  if (/Live-0?[12]/i.test(server))  return "GMT+3 (EEST)";
  if (/Demo/i.test(server))         return "GMT+2 (EET)";
  if (/East/i.test(server))         return "GMT+2 (EET)";
  return "GMT+3 (Server time)";
}

function ProfileSection({ account }: { account: TradingAccount }) {
  const statusTone =
    account.status === "active"     ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
    account.status === "restricted" ? "text-amber-700 bg-amber-50 border-amber-200" :
                                      "text-red-700 bg-red-50 border-red-200";
  const statusLabel =
    account.status === "active" ? "Active" :
    account.status === "restricted" ? "Restricted" : "Disabled";

  return (
    <Section
      title="Account Profile"
      action={<IdCard className="w-3.5 h-3.5 text-slate-300" />}
      dense
    >
      <Card>
        <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-3 text-sm">
          <ProfileField label="Type"      value={account.accountType} />
          <ProfileField label="Currency"  value={account.currency} mono />
          <ProfileField label="Mode"      value={account.tradingMode === "hedging" ? "Hedging" : "Netting"} />
          <ProfileField
            label="Status"
            value={
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border ${statusTone}`}>
                {statusLabel}
              </span>
            }
          />
          <ProfileField label="Leverage"  value={account.leverage} mono />
          <ProfileField label="Platform"  value={account.platform} />
          <ProfileField label="Server"    value={account.server} mono />
          <ProfileField label="Time Zone" value={serverTimezone(account.server)} />
          <ProfileField
            label="Created"
            value={new Date(account.createdAt).toLocaleDateString("en-US", {
              year: "numeric", month: "short", day: "numeric",
            })}
          />
        </dl>
      </Card>
    </Section>
  );
}

function ProfileField({
  label, value, mono = false,
}: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10.5px] font-medium uppercase tracking-wider text-slate-400">
        {label}
      </dt>
      <dd className={`mt-0.5 text-sm font-medium text-slate-800 truncate ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

/* ===================================================================== */
/* 1. Risk                                                                */
/* ===================================================================== */

function RiskCard({ account, risk }: { account: TradingAccount; risk: RiskMetrics }) {
  const riskTone =
    risk.riskLevel === "critical" ? "danger"
    : risk.riskLevel === "high" ? "danger"
    : risk.riskLevel === "medium" ? "warn"
    : "ok";

  const marginTone =
    risk.marginLevel < risk.stopoutLevel ? "danger"
    : risk.marginLevel < risk.marginCallLevel ? "danger"
    : risk.marginLevel < 300 ? "warn"
    : "ok";

  return (
    <Card padded={false}>
      <CardHeader icon={<Shield className="w-4 h-4 text-slate-500" />} title="Risk" />

      <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-4">
        <Metric
          label="Margin Level"
          value={risk.marginLevel >= 9999 ? "—" : `${risk.marginLevel.toFixed(0)}%`}
          sub={`Call ${risk.marginCallLevel}% · Stopout ${risk.stopoutLevel}%`}
          tone={marginTone}
          emphasize
        />
        <Metric
          label="Overall Risk"
          value={
            <span className="uppercase">
              {{ low: "Low", medium: "Medium", high: "High", critical: "Critical" }[risk.riskLevel]}
            </span>
          }
          sub="Real-time risk engine"
          tone={riskTone}
          emphasize
        />
        <Metric
          label="Buffer to Margin Call"
          value={fmtMoney(risk.bufferToMarginCall, account.currency)}
          sub={account.margin > 0 ? "Loss before call triggers" : "No open positions"}
          tone={risk.bufferToMarginCall < account.balance * 0.1 ? "warn" : "neutral"}
        />
        <Metric
          label="Max Symbol Exposure"
          value={fmtPct(risk.maxSymbolExposurePct)}
          sub={risk.maxSymbolExposurePct > 0.3 ? "Concentrated" : "Diversified"}
          tone={risk.maxSymbolExposurePct > 0.3 ? "warn" : "neutral"}
        />
      </div>

      {risk.alerts.length > 0 && (
        <div className="px-4 pb-3 pt-1 border-t border-slate-100 space-y-1.5">
          {risk.alerts.map((a) => (
            <div
              key={a.id}
              className={`flex items-start gap-2 text-xs px-2 py-1.5 rounded ${
                a.level === "critical" ? "bg-red-50 text-red-800"
                : a.level === "warning" ? "bg-amber-50 text-amber-800"
                : "bg-sky-50 text-sky-800"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="font-medium">{a.message}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{timeAgo(a.triggeredAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ===================================================================== */
/* 2. Financial                                                           */
/* ===================================================================== */

function FinancialCard({ financial }: { financial: FinancialMetrics }) {
  const f = financial;
  const totalPnL = f.realizedPnL + f.unrealizedPnL;
  return (
    <Card padded={false}>
      <CardHeader icon={<TrendingUp className="w-4 h-4 text-slate-500" />} title="Financial" />
      <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-4">
        <Metric label="Balance"     value={fmtMoney(f.balance, f.currency)} emphasize />
        <Metric label="Equity"      value={fmtMoney(f.equity,  f.currency)}
                sub="Incl. unrealized PnL" emphasize />
        <Metric label="Free Margin" value={fmtMoney(f.freeMargin, f.currency)} />
        <Metric label="Net Deposit" value={fmtMoney(f.netDeposit, f.currency)}
                sub={`In ${fmtMoney(f.totalDeposit, f.currency)} / Out ${fmtMoney(f.totalWithdrawal, f.currency)}`} />
        <Metric
          label="Total PnL"
          value={fmtMoney(totalPnL, f.currency)}
          sub={`Realized ${fmtMoney(f.realizedPnL, f.currency)} · Floating ${fmtMoney(f.unrealizedPnL, f.currency)}`}
          tone={totalPnL >= 0 ? "ok" : "danger"}
        />
        <Metric label="Fees & Swap"
                value={fmtMoney(-(Math.abs(f.commission) + Math.abs(f.swap)), f.currency)}
                sub={`Commission ${fmtMoney(f.commission, f.currency)} · Swap ${fmtMoney(f.swap, f.currency)}`}
                tone="warn" />
      </div>
    </Card>
  );
}

/* ===================================================================== */
/* 3. Trading Performance                                                 */
/* ===================================================================== */

function PerformanceCard({
  performance, currency,
}: { performance: TradingPerformance; currency: string }) {
  const p = performance;
  const winTone = p.winRate >= 0.55 ? "ok" : p.winRate >= 0.4 ? "neutral" : "warn";
  const pfTone  = p.profitFactor >= 1.5 ? "ok" : p.profitFactor >= 1 ? "neutral" : "warn";

  return (
    <Card padded={false}>
      <CardHeader icon={<TrendingUp className="w-4 h-4 text-slate-500" />} title="Performance" />
      <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-4">
        <Metric label="Win Rate"      value={fmtPct(p.winRate)} tone={winTone} emphasize
                sub={`${p.closedTrades} / ${p.totalTrades} closed`} />
        <Metric label="Profit Factor" value={p.profitFactor >= 99 ? "∞" : p.profitFactor.toFixed(2)}
                tone={pfTone} emphasize
                sub={`Avg Win ${fmtMoney(p.averageWin, currency)} / Loss ${fmtMoney(-p.averageLoss, currency)}`} />
        <Metric label="Total Lots"    value={p.totalLots.toLocaleString()}
                sub={`30d ${p.tradesLast30d} · 7d ${p.tradesLast7d}`} />
        <Metric label="Top Symbol"
                value={p.topSymbols[0]?.symbol ?? "—"}
                sub={p.topSymbols[0]
                  ? `${p.topSymbols[0].volume} lots · ${p.topSymbols[0].pnl >= 0 ? "+" : ""}${fmtMoney(p.topSymbols[0].pnl, currency)}`
                  : "No trades yet"}
                tone={p.topSymbols[0] && p.topSymbols[0].pnl >= 0 ? "ok" : "neutral"} />
      </div>

      {p.topSymbols.length > 1 && (
        <div className="px-4 pb-3 pt-1 border-t border-slate-100">
          <div className="text-[10.5px] font-medium uppercase tracking-wider text-slate-400 mb-1.5">
            Other Top Symbols
          </div>
          <div className="flex flex-wrap gap-1.5">
            {p.topSymbols.slice(1).map((s) => (
              <div
                key={s.symbol}
                className="px-2 py-1 bg-slate-50 rounded border border-slate-100 text-xs"
              >
                <span className="font-mono font-semibold text-slate-800">{s.symbol}</span>
                <span className="text-slate-500 ml-1.5">{s.volume}</span>
                <span className={`ml-1.5 font-medium ${s.pnl >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {s.pnl >= 0 ? "+" : ""}{fmtMoney(s.pnl, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ===================================================================== */
/* 4. Behavioral                                                          */
/* ===================================================================== */

function BehavioralCard({ behavioral }: { behavioral: BehavioralSignals }) {
  const b = behavioral;
  const holdStr =
    b.avgHoldingMinutes < 60 ? `${b.avgHoldingMinutes} min`
    : b.avgHoldingMinutes < 1440 ? `${(b.avgHoldingMinutes / 60).toFixed(1)} h`
    : `${(b.avgHoldingMinutes / 1440).toFixed(1)} d`;

  return (
    <Card padded={false}>
      <CardHeader icon={<Activity className="w-4 h-4 text-slate-500" />} title="Behavioral" />

      <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-4">
        <Metric
          label="Style"
          value={
            <span className="flex items-center gap-1 flex-wrap">
              {b.isEATrading && (
                <span className="px-1.5 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 rounded">
                  EA
                </span>
              )}
              {b.isHighFrequency && (
                <span className="px-1.5 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-700 rounded">
                  HF
                </span>
              )}
              {!b.isEATrading && !b.isHighFrequency && (
                <span className="text-sm text-slate-600">Manual</span>
              )}
            </span>
          }
          sub={!b.isEATrading && !b.isHighFrequency ? "No automation detected" : "Pattern detected"}
        />
        <Metric
          label="Avg. Holding Time"
          value={holdStr}
          sub={b.avgHoldingMinutes < 5 ? "Very short" : "Normal"}
          tone={b.avgHoldingMinutes < 5 ? "warn" : "neutral"}
        />
        <Metric
          label="After-hours / Weekend"
          value={fmtPct(b.afterHoursPct)}
          sub={b.afterHoursPct > 0.3 ? "Elevated" : "Normal"}
          tone={b.afterHoursPct > 0.3 ? "warn" : "neutral"}
        />
        <Metric
          label="Login → First Trade"
          value={b.lastLoginToTradeHours != null ? `${b.lastLoginToTradeHours} h` : "—"}
          sub="Reaction time"
        />
      </div>

      {b.detectedBehaviors.length > 0 && (
        <div className="px-4 pb-3 pt-1 border-t border-slate-100 space-y-1.5">
          {b.detectedBehaviors.map((bh, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 text-xs px-2 py-1.5 rounded ${
                bh.level === "high" ? "bg-red-50 text-red-800"
                : bh.level === "medium" ? "bg-amber-50 text-amber-800"
                : "bg-slate-50 text-slate-700"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="font-medium capitalize">{bh.type.replace(/_/g, " ")}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{bh.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ===================================================================== */
/* Shared card header                                                     */
/* ===================================================================== */

function CardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
      {icon}
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
    </div>
  );
}
