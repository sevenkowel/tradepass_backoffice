'use client';

import { Globe, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FundamentalAnalysis } from '@/lib/trade/types';

interface FundamentalCardProps {
  analysis: FundamentalAnalysis;
}

const impactLabels = {
  positive: '利好',
  negative: '利空',
  neutral: '中性',
};

const impactColors = {
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-rose-600 dark:text-rose-400',
  neutral: 'text-slate-500',
};

const impactBgColors = {
  positive: 'bg-emerald-50 dark:bg-emerald-900/20',
  negative: 'bg-rose-50 dark:bg-rose-900/20',
  neutral: 'bg-slate-100 dark:bg-slate-700',
};

export function FundamentalCard({ analysis }: FundamentalCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
          <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
          基本面
        </h3>
      </div>

      {/* 关键因素 */}
      <div className="space-y-2 mb-4">
        {analysis.factors.map((factor, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
          >
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {factor.name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {factor.description}
              </div>
            </div>
            <div className="text-right">
              <div
                className={cn(
                  'text-sm font-semibold',
                  impactColors[factor.impact]
                )}
              >
                {factor.value}
              </div>
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded',
                  impactBgColors[factor.impact],
                  impactColors[factor.impact]
                )}
              >
                {impactLabels[factor.impact]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 事件日程 */}
      {(analysis.lastEvent || analysis.nextEvent) && (
        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-700">
          {analysis.lastEvent && (
            <div className="flex items-start gap-2 text-sm">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <span className="text-slate-500">上次事件：</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {analysis.lastEvent}
                </span>
              </div>
            </div>
          )}
          {analysis.nextEvent && (
            <div className="flex items-start gap-2 text-sm">
              <Calendar className="w-4 h-4 text-blue-400 mt-0.5" />
              <div>
                <span className="text-slate-500"> upcoming：</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {analysis.nextEvent}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 总结 */}
      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {analysis.summary}
        </p>
      </div>
    </div>
  );
}
