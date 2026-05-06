'use client';

import { cn } from '@/lib/utils';
import type { TradeDirection, TrendDirection } from '@/lib/trade/types';

interface DirectionBadgeProps {
  direction: TradeDirection | TrendDirection;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const directionConfig = {
  buy: {
    label: '买入',
    labelEn: 'Buy',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  sell: {
    label: '卖出',
    labelEn: 'Sell',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    textColor: 'text-rose-700 dark:text-rose-400',
    borderColor: 'border-rose-200 dark:border-rose-800',
  },
  bullish: {
    label: '看涨',
    labelEn: 'Bullish',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  bearish: {
    label: '看跌',
    labelEn: 'Bearish',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    textColor: 'text-rose-700 dark:text-rose-400',
    borderColor: 'border-rose-200 dark:border-rose-800',
  },
  neutral: {
    label: '中性',
    labelEn: 'Neutral',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    textColor: 'text-slate-600 dark:text-slate-400',
    borderColor: 'border-slate-200 dark:border-slate-700',
  },
};

const sizeConfig = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function DirectionBadge({
  direction,
  size = 'md',
  showLabel = true,
  className,
}: DirectionBadgeProps) {
  const config = directionConfig[direction];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-md border',
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeConfig[size],
        className
      )}
    >
      {showLabel && (
        <>
          <span className="hidden sm:inline">{config.label}</span>
          <span className="sm:hidden">{config.labelEn}</span>
        </>
      )}
    </span>
  );
}
