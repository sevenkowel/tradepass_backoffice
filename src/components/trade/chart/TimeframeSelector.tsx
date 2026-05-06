'use client';

import { cn } from '@/lib/utils';
import type { ChartTimeframe } from '@/lib/trade/types';

interface TimeframeSelectorProps {
  timeframes: { value: ChartTimeframe; label: string }[];
  activeTimeframe: ChartTimeframe;
  onTimeframeChange: (timeframe: ChartTimeframe) => void;
}

export function TimeframeSelector({
  timeframes,
  activeTimeframe,
  onTimeframeChange,
}: TimeframeSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      {timeframes.map((tf) => (
        <button
          key={tf.value}
          onClick={() => onTimeframeChange(tf.value)}
          className={cn(
            'px-2.5 py-1 text-xs font-medium rounded transition-colors',
            activeTimeframe === tf.value
              ? 'bg-blue-500 text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
          )}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );
}
