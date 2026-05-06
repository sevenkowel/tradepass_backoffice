'use client';

import { memo } from 'react';
import { Star, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TradingProduct } from '@/lib/trade/types';
import { DirectionBadge } from '../shared/DirectionBadge';
import { SentimentBar } from '../shared/SentimentBar';

interface MarketRowProps {
  product: TradingProduct;
  onFavoriteToggle: (symbol: string) => void;
  onTradeClick: (symbol: string, direction: 'buy' | 'sell') => void;
  onRowClick: (symbol: string) => void;
}

export const MarketRow = memo(function MarketRow({
  product,
  onFavoriteToggle,
  onTradeClick,
  onRowClick,
}: MarketRowProps) {
  const isPositive = product.changePercent >= 0;

  return (
    <tr
      onClick={() => onRowClick(product.symbol)}
      className={cn(
        'group cursor-pointer transition-colors',
        'hover:bg-slate-50 dark:hover:bg-slate-800/50',
        'border-b border-slate-100 dark:border-slate-800 last:border-0'
      )}
    >
      {/* 收藏 + 产品信息 */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle(product.symbol);
            }}
            className={cn(
              'p-1 rounded transition-colors',
              product.isFavorite
                ? 'text-amber-500'
                : 'text-slate-300 hover:text-amber-400'
            )}
          >
            <Star
              className={cn('w-4 h-4', product.isFavorite && 'fill-current')}
            />
          </button>
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {product.symbol}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {product.shortName}
            </div>
          </div>
        </div>
      </td>

      {/* 价格 */}
      <td className="px-4 py-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {product.bid.toFixed(product.symbol.includes('JPY') ? 3 : 5)}
            </span>
            <span className="text-rose-600 dark:text-rose-400 font-medium">
              {product.ask.toFixed(product.symbol.includes('JPY') ? 3 : 5)}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            点差 {product.spread.toFixed(1)}
          </span>
        </div>
      </td>

      {/* 涨跌幅 */}
      <td className="px-4 py-4">
        <div
          className={cn(
            'flex items-center gap-1 font-medium',
            isPositive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>
            {isPositive ? '+' : ''}
            {product.changePercent.toFixed(2)}%
          </span>
        </div>
      </td>

      {/* 情绪指数 */}
      <td className="px-4 py-4 w-32">
        <SentimentBar sentiment={product.sentiment} size="sm" />
      </td>

      {/* AI信号 */}
      <td className="px-4 py-4">
        <DirectionBadge
          direction={product.aiSignal.direction}
          size="sm"
          className="whitespace-nowrap"
        />
      </td>

      {/* 交易按钮 - 始终显示 */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTradeClick(product.symbol, 'buy');
            }}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded',
              'bg-emerald-500 hover:bg-emerald-600 text-white',
              'transition-colors active:scale-95'
            )}
          >
            买入
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTradeClick(product.symbol, 'sell');
            }}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded',
              'bg-rose-500 hover:bg-rose-600 text-white',
              'transition-colors active:scale-95'
            )}
          >
            卖出
          </button>
        </div>
      </td>
    </tr>
  );
});
