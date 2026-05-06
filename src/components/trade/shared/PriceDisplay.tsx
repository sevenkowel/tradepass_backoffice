'use client';

import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  bid: number;
  ask: number;
  digits?: number;
  size?: 'sm' | 'md' | 'lg';
  showSpread?: boolean;
  spread?: number;
  change?: number;
  changePercent?: number;
  className?: string;
}

const sizeConfig = {
  sm: {
    price: 'text-sm',
    label: 'text-xs',
    spread: 'text-xs',
  },
  md: {
    price: 'text-base',
    label: 'text-xs',
    spread: 'text-xs',
  },
  lg: {
    price: 'text-2xl font-bold',
    label: 'text-sm',
    spread: 'text-sm',
  },
};

export function PriceDisplay({
  bid,
  ask,
  digits = 5,
  size = 'md',
  showSpread = true,
  spread,
  change,
  changePercent,
  className,
}: PriceDisplayProps) {
  const formatPrice = (price: number) => {
    return price.toFixed(digits);
  };

  const isPositive = change !== undefined && change >= 0;

  return (
    <div className={cn('flex flex-col', className)}>
      {/* 价格 */}
      <div className="flex items-baseline gap-2">
        <div className="flex items-baseline gap-1">
          <span className={cn('text-slate-500', sizeConfig[size].label)}>B</span>
          <span className={cn('text-emerald-600 dark:text-emerald-400', sizeConfig[size].price)}>
            {formatPrice(bid)}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={cn('text-slate-500', sizeConfig[size].label)}>A</span>
          <span className={cn('text-rose-600 dark:text-rose-400', sizeConfig[size].price)}>
            {formatPrice(ask)}
          </span>
        </div>
      </div>

      {/* 点差和涨跌幅 */}
      {(showSpread || change !== undefined) && (
        <div className="flex items-center gap-2 mt-0.5">
          {showSpread && spread !== undefined && (
            <span className={cn('text-slate-400', sizeConfig[size].spread)}>
              点差: {spread.toFixed(1)}
            </span>
          )}
          {change !== undefined && changePercent !== undefined && (
            <span
              className={cn(
                sizeConfig[size].spread,
                isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {isPositive ? '+' : ''}
              {changePercent.toFixed(2)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
