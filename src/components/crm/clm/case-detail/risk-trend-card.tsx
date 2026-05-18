"use client";

/**
 * RiskTrendCard (P2-B5) — 该客户的 30 天风险评分趋势.
 *
 * Mock 数据，deterministic by customerId（截图稳定）。等真后端有"客户
 * 风险评分时序"时，替换 makeMockSeries 为接口调用即可。
 */

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { Sparkline } from "@/components/crm/ui/Sparkline";

export function RiskTrendCard({
  customerId, currentScore,
}: {
  customerId: string;
  currentScore: number;
}) {
  const series = useMemo(
    () => buildSeries(customerId, currentScore),
    [customerId, currentScore],
  );

  const first = series[0];
  const last = series[series.length - 1];
  const delta = last - first;
  const trendUp = delta > 0;

  const toneColor =
    last >= 70 ? "text-red-700"
    : last >= 40 ? "text-amber-700"
    : "text-emerald-700";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
          Risk Score · 30d
        </p>
      </div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className={`text-lg font-bold tabular-nums ${toneColor}`}>{last}</span>
        <span className={`text-[11px] font-medium tabular-nums ${trendUp ? "text-red-600" : "text-emerald-600"}`}>
          {trendUp ? "↑" : "↓"} {Math.abs(delta)} from {first}
        </span>
      </div>
      <div className={`h-12 ${trendUp ? "text-red-500" : "text-emerald-500"}`}>
        <Sparkline data={series} width={240} height={48} className="w-full h-full" />
      </div>
      <p className="text-[10px] text-slate-400 mt-1 italic">
        Mocked series — replace with `riskService.getScoreHistory(customerId, 30)` when available.
      </p>
    </div>
  );
}

/** 生成 30 天 deterministic 序列，最后一点等于 currentScore。 */
function buildSeries(customerId: string, current: number): number[] {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < customerId.length; i++) {
    h = (h ^ customerId.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  const rand = () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const series: number[] = [];
  // 起点：与 current 拉开 5-25 的距离，方向随机
  const startDelta = Math.round(rand() * 25 + 5) * (rand() > 0.5 ? -1 : 1);
  let v = Math.max(0, Math.min(100, current + startDelta));
  series.push(v);
  for (let i = 1; i < 29; i++) {
    // 朝 current 缓慢回归 + 小波动
    const drift = (current - v) * 0.05 + (rand() - 0.5) * 6;
    v = Math.max(0, Math.min(100, v + drift));
    series.push(Math.round(v));
  }
  series.push(current);
  return series;
}
