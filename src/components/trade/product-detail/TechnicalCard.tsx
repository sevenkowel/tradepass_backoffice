'use client';

import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TechnicalAnalysis } from '@/lib/trade/types';
import { DirectionBadge } from '../shared/DirectionBadge';

interface TechnicalCardProps {
  analysis: TechnicalAnalysis;
}

const indicatorLabels: Record<string, string> = {
  'RSI (14)': 'RSI',
  'MACD': 'MACD',
  'MA20': 'MA20',
  'MA50': 'MA50',
  'Bollinger': '布林带',
};

export function TechnicalCard({ analysis }: TechnicalCardProps) {
  const scoreColor =
    analysis.overallScore >= 70
      ? 'text-emerald-600 dark:text-emerald-400'
      : analysis.overallScore >= 40
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-rose-600 dark:text-rose-400';

  const scoreBgColor =
    analysis.overallScore >= 70
      ? 'bg-emerald-100 dark:bg-emerald-900/30'
      : analysis.overallScore >= 40
      ? 'bg-amber-100 dark:bg-amber-900/30'
      : 'bg-rose-100 dark:bg-rose-900/30';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
            <BarChart3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            技术面
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <DirectionBadge direction={analysis.trend} size="sm" />
        </div>
      </div>

      {/* 综合评分 */}
      <div className="flex items-center gap-4 mb-5">
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            scoreBgColor
          )}
        >
          <span className={cn('text-xl font-bold', scoreColor)}>
            {analysis.overallScore}
          </span>
        </div>
        <div>
          <div className="text-sm text-slate-500">综合评分</div>
          <div className={cn('font-semibold', scoreColor)}>
            {analysis.trend === 'bullish'
              ? '看涨'
              : analysis.trend === 'bearish'
              ? '看跌'
              : '中性'}
          </div>
        </div>
      </div>

      {/* 指标列表 */}
      <div className="space-y-2">
        {analysis.indicators.map((indicator, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {indicatorLabels[indicator.name] || indicator.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {indicator.value}
              </span>
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded',
                  indicator.signal === 'bullish'
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                    : indicator.signal === 'bearish'
                    ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-700'
                )}
              >
                {indicator.description}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 总结 */}
      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {analysis.summary}
        </p>
      </div>
    </div>
  );
}
