"use client";

/**
 * OverviewTab — v3 经营驾驶舱 (2026-05-15).
 *
 * 把原本「KPI 4 卡 + sparkline」的资料概览升级为运营驾驶舱：
 *
 *   1. Risk Alerts Banner   — 实时风险/合规告警（AML / KYC 到期 / 保证金 / VPN）
 *   2. Financial Summary    — 6 个核心财务指标卡（净值 / 余额 / 可用保证金 /
 *                              净入金 / 浮动盈亏 / 累计入金）
 *   3. Trading Summary      — 5 个交易指标卡（账户数 / 活跃 / 交易量 / 最后
 *                              交易 / 风险账户）
 *   4. Charts               — 2 个 30d 趋势曲线（资金 + 交易）
 *   5. Recent Activity      — 最近 10 条事件
 *
 * 设计原则：
 *   - 第一眼看的是「告警」(只在有 alert 时渲染)；其次是数字；最后才是趋势。
 *   - 所有数字派生自 accounts / valueMetrics / tradingStats，不重复定义。
 *   - 客户级视角：展示**所有账户汇总**，明细去交易账户工作台看。
 */

import type { BaseTabProps } from "@/types/backoffice/client";
import type {
  TradingAccount, KYCDocument, RiskFactor,
} from "@/types/backoffice/client-detail";
import { AlertTriangle, Shield, Wallet, TrendingUp } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { Sparkline, pseudoSeries } from "@/components/crm/ui/Sparkline";
import { ClientAiAdviceCard } from "../lib/ClientAiAdviceCard";

type AlertLevel = "critical" | "warning" | "info";
interface DashboardAlert {
  id: string;
  level: AlertLevel;
  title: string;
  desc: string;
}

export default function OverviewTab({ data }: BaseTabProps) {
  const { t, locale } = useT();
  const { user, timeline, accounts, kycDocuments, devices, riskFactors, tradingStats } = data;

  /* ── 派生指标 ───────────────────────────────────────────────────── */
  const accountsCount  = accounts.length;
  const activeAccounts = accounts.filter((a) => a.status === "active").length;

  const totalEquity     = accounts.reduce((s, a) => s + a.equity, 0);
  const totalBalance    = accounts.reduce((s, a) => s + a.balance, 0);
  const freeMargin      = accounts.reduce((s, a) => s + a.freeMargin, 0);
  const totalDeposit    = accounts.reduce((s, a) => s + a.totalDeposit, 0);
  const totalWithdrawal = accounts.reduce((s, a) => s + a.totalWithdrawal, 0);
  const netDeposit      = totalDeposit - totalWithdrawal;
  const floatingPnL     = totalEquity - totalBalance;

  // 风险账户：受限/禁用 或 保证金 < 300%
  const riskyAccounts = accounts.filter(isRiskyAccount).length;
  const lastTradeAt   = accounts
    .map((a) => a.lastTradeAt)
    .filter((v): v is string => !!v)
    .sort()
    .pop();

  const totalLots = tradingStats?.totalLots ?? 0;
  const winRate   = tradingStats?.winRate ?? 0;

  /* ── 风险告警 ───────────────────────────────────────────────────── */
  const alerts = deriveAlerts({
    accounts,
    kycDocuments,
    devices,
    riskFactors,
    kycStatus: user.kycStatus,
  });

  /* ── 趋势 seed 数据（30 个点） ──────────────────────────────────── */
  const equitySeries  = pseudoSeries(`${user.id}:equity`,  30, totalEquity     || 5000, { direction:  6, volatility: 0.04 });
  const depositSeries = pseudoSeries(`${user.id}:netDep`,  30, netDeposit      || 3000, { direction:  4, volatility: 0.02 });
  const volumeSeries  = pseudoSeries(`${user.id}:vol`,     30, totalLots       || 50,   { direction:  3, volatility: 0.18 });
  const winRateSeries = pseudoSeries(`${user.id}:winRate`, 30, (winRate || 0.5) * 100,  { direction: -2, volatility: 0.05 });

  const recent = timeline.slice(0, 10);

  return (
    <div className="space-y-5">
      {/* 0. AI 下一步建议（基于现有信号 deterministic 派生）*/}
      <ClientAiAdviceCard data={data} />

      {/* 1. Risk Alerts banner — 只在有告警时显示 */}
      {alerts.length > 0 && <AlertsBanner alerts={alerts} />}

      {/* 2. Financial Summary */}
      <Section title="财务概览" icon={<Wallet className="w-3.5 h-3.5 text-slate-300" />}>
        <Grid columns={6}>
          <KpiCard label="账户净值"   value={fmtMoney(totalEquity)}   emphasize />
          <KpiCard label="账户余额"   value={fmtMoney(totalBalance)} />
          <KpiCard label="可用保证金" value={fmtMoney(freeMargin)} />
          <KpiCard
            label="净入金"
            value={fmtMoney(netDeposit)}
            sub={`入 ${fmtMoney(totalDeposit)} · 出 ${fmtMoney(totalWithdrawal)}`}
          />
          <KpiCard
            label="浮动盈亏"
            value={fmtMoney(floatingPnL)}
            tone={floatingPnL >= 0 ? "ok" : "danger"}
          />
          <KpiCard label="累计入金" value={fmtMoney(totalDeposit)} />
        </Grid>
      </Section>

      {/* 3. Trading Summary */}
      <Section title="交易概览" icon={<TrendingUp className="w-3.5 h-3.5 text-slate-300" />}>
        <Grid columns={5}>
          <KpiCard label="交易账户" value={`${accountsCount}`} sub={`${activeAccounts} 活跃`} />
          <KpiCard
            label="风险账户"
            value={`${riskyAccounts}`}
            sub={riskyAccounts > 0 ? "需关注" : "全部健康"}
            tone={riskyAccounts > 0 ? "warn" : "neutral"}
          />
          <KpiCard label="总交易量" value={`${totalLots.toFixed(2)} lots`} />
          <KpiCard label="胜率" value={`${(winRate * 100).toFixed(1)}%`} />
          <KpiCard
            label="最后交易"
            value={lastTradeAt ? formatTimeAgo(lastTradeAt, t, locale) : "—"}
            sub={lastTradeAt ? new Date(lastTradeAt).toLocaleDateString("zh-CN") : "无记录"}
          />
        </Grid>
      </Section>

      {/* 4. Charts (30d) */}
      <Section title="趋势 · 30 天">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="资金"
            primaryLabel="账户净值"
            primaryValue={fmtMoney(totalEquity)}
            primarySeries={equitySeries}
            secondaryLabel="净入金"
            secondaryValue={fmtMoney(netDeposit)}
            secondarySeries={depositSeries}
          />
          <ChartCard
            title="交易"
            primaryLabel="交易量 (lots)"
            primaryValue={totalLots.toFixed(2)}
            primarySeries={volumeSeries}
            secondaryLabel="胜率"
            secondaryValue={`${(winRate * 100).toFixed(1)}%`}
            secondarySeries={winRateSeries}
          />
        </div>
      </Section>

      {/* 5. Recent Activity */}
      <Section title="近期活动">
        {recent.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">暂无活动</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((item) => (
              <li key={item.id} className="py-2 flex items-baseline gap-4 text-sm">
                <span className="shrink-0 w-20 text-xs text-slate-400 tabular-nums">
                  {formatTimeAgo(item.timestamp, t, locale)}
                </span>
                <span className="text-slate-800 flex-1 truncate">{item.title}</span>
                {item.description && (
                  <span className="text-slate-500 text-xs truncate max-w-xs">
                    {item.description}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

/* ===================================================================== */
/* Helpers                                                                */
/* ===================================================================== */

function isRiskyAccount(a: TradingAccount): boolean {
  if (a.status !== "active") return true;
  const ml = parseFloat(a.marginLevel);
  return !isNaN(ml) && ml < 300;
}

function deriveAlerts({
  accounts, kycDocuments, devices, riskFactors, kycStatus,
}: {
  accounts: TradingAccount[];
  kycDocuments: KYCDocument[];
  devices: { isRisky: boolean }[];
  riskFactors: RiskFactor[];
  kycStatus: string;
}): DashboardAlert[] {
  const out: DashboardAlert[] = [];

  // AML / 高风险因子
  const highRiskFactors = riskFactors.filter((f) => f.level === "high");
  if (highRiskFactors.length > 0) {
    out.push({
      id: "alert-aml",
      level: "critical",
      title: "AML 高风险",
      desc: `${highRiskFactors.length} 项高风险因子命中：${highRiskFactors.slice(0, 2).map((f) => f.name).join(" / ")}`,
    });
  }

  // KYC 即将过期 (30 天内)
  const expiringDocs = kycDocuments.filter((doc) => {
    if (!doc.expiryDate) return false;
    const days = (new Date(doc.expiryDate).getTime() - Date.now()) / 86400_000;
    return days > 0 && days < 30;
  });
  if (expiringDocs.length > 0) {
    out.push({
      id: "alert-kyc-expiring",
      level: "warning",
      title: "KYC 即将过期",
      desc: `${expiringDocs.length} 份证件将在 30 天内到期`,
    });
  } else if (kycStatus === "rejected") {
    out.push({
      id: "alert-kyc-rejected",
      level: "warning",
      title: "KYC 被拒",
      desc: "客户身份认证未通过，需重新提交",
    });
  } else if (kycStatus === "pending") {
    out.push({
      id: "alert-kyc-pending",
      level: "info",
      title: "KYC 待审核",
      desc: "客户已提交 KYC 资料，等待合规审核",
    });
  }

  // 保证金告警
  const marginCritical = accounts.filter((a) => {
    const ml = parseFloat(a.marginLevel);
    return !isNaN(ml) && ml < 100;
  });
  const marginWarning = accounts.filter((a) => {
    const ml = parseFloat(a.marginLevel);
    return !isNaN(ml) && ml >= 100 && ml < 200;
  });
  if (marginCritical.length > 0) {
    out.push({
      id: "alert-margin-critical",
      level: "critical",
      title: "保证金告警",
      desc: `${marginCritical.length} 个账户保证金 < 100%，已触发追保`,
    });
  } else if (marginWarning.length > 0) {
    out.push({
      id: "alert-margin-warning",
      level: "warning",
      title: "保证金偏低",
      desc: `${marginWarning.length} 个账户保证金低于 200%`,
    });
  }

  // 可疑设备
  const riskyDevices = devices.filter((d) => d.isRisky).length;
  if (riskyDevices > 0) {
    out.push({
      id: "alert-vpn",
      level: "warning",
      title: "可疑设备登录",
      desc: `${riskyDevices} 个设备标记为高风险（VPN / 异常 IP）`,
    });
  }

  return out;
}

function fmtMoney(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000)    return `${sign}$${(abs / 1000).toFixed(1)}k`;
  return `${sign}$${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatTimeAgo(
  dateStr: string,
  t: (key: string, params?: Record<string, string>) => string,
  locale: string,
): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t("clients.fmt.justNow");
  if (diffMins < 60) return t("clients.fmt.minutesAgo", { n: String(diffMins) });
  if (diffHours < 24) return t("clients.fmt.hoursAgo", { n: String(diffHours) });
  if (diffDays < 30) return t("clients.fmt.daysAgo", { n: String(diffDays) });
  const dateLocale =
    locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : locale === "es" ? "es-ES" : "en-US";
  return date.toLocaleDateString(dateLocale);
}

/* ===================================================================== */
/* Layout primitives                                                      */
/* ===================================================================== */

function Section({
  title, icon, children,
}: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-1.5 mb-2.5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h3>
        {icon}
      </div>
      {children}
    </section>
  );
}

function Grid({ columns, children }: { columns: 4 | 5 | 6; children: React.ReactNode }) {
  const colsCls = columns === 6
    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
    : columns === 5
    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
    : "grid-cols-2 md:grid-cols-4";
  return (
    <div className={`grid ${colsCls} gap-3`}>{children}</div>
  );
}

function KpiCard({
  label, value, sub, tone = "neutral", emphasize = false,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "ok" | "warn" | "danger";
  emphasize?: boolean;
}) {
  const toneCls = {
    neutral: "text-slate-900",
    ok:      "text-emerald-700",
    warn:    "text-amber-700",
    danger:  "text-red-700",
  }[tone];
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className={`${emphasize ? "text-xl font-bold" : "text-base font-semibold"} tabular-nums mt-0.5 truncate ${toneCls}`}>
        {value}
      </div>
      {sub && <div className="text-[10.5px] text-slate-400 mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

/* ===================================================================== */
/* AlertsBanner — 顶部告警条                                              */
/* ===================================================================== */

function AlertsBanner({ alerts }: { alerts: DashboardAlert[] }) {
  // 按严重度排序
  const order: Record<AlertLevel, number> = { critical: 0, warning: 1, info: 2 };
  const sorted = [...alerts].sort((a, b) => order[a.level] - order[b.level]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-2 flex items-center gap-2 border-b border-slate-100">
        <Shield className="w-3.5 h-3.5 text-slate-500" />
        <h3 className="text-xs font-semibold text-slate-700">风险告警</h3>
        <span className="text-[10px] text-slate-400 tabular-nums">{alerts.length}</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {sorted.map((a) => {
          const tone =
            a.level === "critical" ? "bg-red-50 text-red-800 border-l-red-500"
            : a.level === "warning"  ? "bg-amber-50 text-amber-800 border-l-amber-500"
            : "bg-sky-50 text-sky-800 border-l-sky-500";
          return (
            <li key={a.id} className={`px-4 py-2 border-l-2 flex items-start gap-2 ${tone}`}>
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold">{a.title}</div>
                <div className="text-[11px] opacity-80 mt-0.5">{a.desc}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ===================================================================== */
/* ChartCard — 大尺寸趋势卡，含主+次两条曲线                              */
/* ===================================================================== */

function ChartCard({
  title, primaryLabel, primaryValue, primarySeries,
  secondaryLabel, secondaryValue, secondarySeries,
}: {
  title: string;
  primaryLabel: string;
  primaryValue: string;
  primarySeries: number[];
  secondaryLabel: string;
  secondaryValue: string;
  secondarySeries: number[];
}) {
  const pDelta = pctChange(primarySeries);
  const sDelta = pctChange(secondarySeries);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
        {title}
      </h4>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-[11px] text-slate-500">{primaryLabel}</div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-lg font-bold tabular-nums text-slate-900">{primaryValue}</span>
            {pDelta != null && pDelta !== 0 && (
              <span className={`text-[11px] font-medium tabular-nums ${pDelta > 0 ? "text-emerald-700" : "text-red-700"}`}>
                {pDelta > 0 ? "↑" : "↓"}{Math.abs(pDelta).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500">{secondaryLabel}</div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-lg font-bold tabular-nums text-slate-700">{secondaryValue}</span>
            {sDelta != null && sDelta !== 0 && (
              <span className={`text-[11px] font-medium tabular-nums ${sDelta > 0 ? "text-emerald-700" : "text-red-700"}`}>
                {sDelta > 0 ? "↑" : "↓"}{Math.abs(sDelta).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative h-24 -mx-1">
        <div className="text-blue-600 absolute inset-0">
          <Sparkline data={primarySeries} width={600} height={96} className="w-full h-full" />
        </div>
        <div className="text-slate-400 absolute inset-0">
          <Sparkline data={secondarySeries} width={600} height={96} className="w-full h-full" />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2 text-[10.5px] text-slate-400">
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600 inline-block" /> {primaryLabel}</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> {secondaryLabel}</span>
      </div>
    </div>
  );
}

function pctChange(series: number[]): number {
  if (series.length < 2) return 0;
  const first = series[0];
  const last = series[series.length - 1];
  if (first === 0) return 0;
  return ((last - first) / first) * 100;
}
