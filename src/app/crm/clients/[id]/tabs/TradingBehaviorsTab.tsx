"use client";

/**
 * TradingBehaviorsTab — 交易风险行为（2026-05-16 新建）.
 *
 * 这块原本散落在「订单」Tab 顶部的统计区，运营反馈应该归到「风险与
 * 安全」域里——交易风险行为本质是风控判定，不是订单本身。
 *
 * 内容：
 *   - 行为画像 strip：EA 自动交易 / 高频 / 累计手数 / 胜率
 *   - Detected Behaviors 列表：arbitrage / tick scalping / latency arbitrage
 *     / high frequency abuse — 每条带严重度（high / medium / low）
 *
 * 数据全部派生自 `data.tradingStats`（detail-mapper 已经填好）。
 */

import type { BaseTabProps } from "@/types/backoffice/client";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function TradingBehaviorsTab({ data }: BaseTabProps) {
  const { t } = useT();
  const { tradingStats } = data;

  const hasHighRisk = tradingStats.riskBehaviors.some((b) => b.level === "high");
  const hasMidRisk  = tradingStats.riskBehaviors.some((b) => b.level === "medium");
  const overallTone: "danger" | "warn" | "default" =
    hasHighRisk ? "danger" : hasMidRisk ? "warn" : "default";

  return (
    <div className="space-y-6">
      {/* 概览说明 */}
      <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
        本页汇总客户的「交易行为画像」与风控引擎检测出的可疑模式（套利、
        tick scalping、延迟套利、高频滥用等）。所有数据按客户全部 MT 账户
        聚合后判定。
      </p>

      {/* 行为画像 strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-3xl border-t border-slate-100 pt-5">
        <Stat
          label={t("clients.detail.trading.totalLots")}
          value={`${tradingStats.totalLots} Lots`}
        />
        <Stat
          label={t("clients.detail.trading.winRate")}
          value={`${tradingStats.winRate}%`}
        />
        <Stat
          label={t("clients.detail.trading.eaTrading")}
          value={
            tradingStats.isEATrading
              ? t("clients.detail.trading.yes")
              : t("clients.detail.trading.no")
          }
          tone={tradingStats.isEATrading ? "warn" : "default"}
        />
        <Stat
          label={t("clients.detail.trading.highFreq")}
          value={
            tradingStats.isHighFrequency
              ? t("clients.detail.trading.yes")
              : t("clients.detail.trading.no")
          }
          tone={tradingStats.isHighFrequency ? "warn" : "default"}
        />
      </section>

      {/* Detected behaviors 列表 */}
      <section className="border-t border-slate-100 pt-5">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t("clients.detail.trading.riskBehaviors")}
          </h3>
          {tradingStats.riskBehaviors.length > 0 && (
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider ${
                overallTone === "danger" ? "text-red-600"
                  : overallTone === "warn" ? "text-amber-600"
                  : "text-slate-400"
              }`}
            >
              {tradingStats.riskBehaviors.length} 项检出
            </span>
          )}
        </div>

        {tradingStats.riskBehaviors.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            未检测到风险交易行为
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tradingStats.riskBehaviors.map((b, i) => (
              <li key={i} className="py-2 flex items-baseline gap-3 text-sm">
                <span
                  className={`shrink-0 w-14 text-[10px] uppercase tracking-wider font-bold ${
                    b.level === "high"   ? "text-red-600"
                      : b.level === "medium" ? "text-amber-600"
                      : "text-slate-400"
                  }`}
                >
                  {b.level}
                </span>
                <span className="font-medium text-slate-800 shrink-0">
                  {t(`clients.detail.trading.behavior.${b.type}`) ?? b.type}
                </span>
                <span className="text-slate-500 truncate flex-1">
                  {b.description}
                </span>
                <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                  {new Date(b.detectedAt).toLocaleDateString("zh-CN", {
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label, value, tone,
}: {
  label: string;
  value: string;
  tone?: "default" | "ok" | "warn" | "danger";
}) {
  const t = tone ?? "default";
  const cls = t === "danger" ? "text-red-700"
    : t === "warn" ? "text-amber-700"
    : t === "ok" ? "text-emerald-700"
    : "text-slate-900";
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}
