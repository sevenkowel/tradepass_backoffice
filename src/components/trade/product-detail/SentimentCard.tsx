'use client';

import { Users } from 'lucide-react';
import type { SentimentData } from '@/lib/trade/types';
import { SentimentBar } from '../shared/SentimentBar';

interface SentimentCardProps {
  sentiment: SentimentData;
}

export function SentimentCard({ sentiment }: SentimentCardProps) {
  const dominantSide = sentiment.longPercent > sentiment.shortPercent ? 'long' : 'short';
  const dominantPercent =
    dominantSide === 'long' ? sentiment.longPercent : sentiment.shortPercent;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
          市场情绪
        </h3>
      </div>

      {/* 情绪条 */}
      <SentimentBar sentiment={sentiment} showCount={true} size="md" className="mb-4" />

      {/* 统计 */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        <div>
          <div className="text-xs text-slate-500 mb-1">多头持仓</div>
          <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            {sentiment.longCount.toLocaleString()}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 mb-1">空头持仓</div>
          <div className="text-lg font-semibold text-rose-600 dark:text-rose-400">
            {sentiment.shortCount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 情绪解读 */}
      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          市场情绪
          <span
            className={
              dominantSide === 'long'
                ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                : 'text-rose-600 dark:text-rose-400 font-medium'
            }
          >
            {dominantSide === 'long' ? '偏多' : '偏空'}
          </span>
          ，{dominantPercent}% 交易者持{dominantSide === 'long' ? '多' : '空'}头仓位。
        </p>
      </div>
    </div>
  );
}
