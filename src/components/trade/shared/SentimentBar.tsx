'use client';

import { cn } from '@/lib/utils';
import type { SentimentData } from '@/lib/trade/types';

interface SentimentBarProps {
  sentiment: SentimentData;
  showCount?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function SentimentBar({
  sentiment,
  showCount = false,
  size = 'md',
  className,
}: SentimentBarProps) {
  const { longPercent, shortPercent, longCount, shortCount } = sentiment;

  return (
    <div className={cn('w-full', className)}>
      {/* 进度条 */}
      <div
        className={cn(
          'flex rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800',
          size === 'sm' ? 'h-1.5' : 'h-2'
        )}
      >
        <div
          className="bg-emerald-500 transition-all duration-500"
          style={{ width: `${longPercent}%` }}
        />
        <div
          className="bg-rose-500 transition-all duration-500"
          style={{ width: `${shortPercent}%` }}
        />
      </div>

      {/* 标签 */}
      <div className="flex justify-between mt-1 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            多 {longPercent}%
          </span>
          {showCount && (
            <span className="text-slate-400">({longCount.toLocaleString()})</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {showCount && (
            <span className="text-slate-400">({shortCount.toLocaleString()})</span>
          )}
          <span className="text-rose-600 dark:text-rose-400 font-medium">
            空 {shortPercent}%
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        </div>
      </div>
    </div>
  );
}
