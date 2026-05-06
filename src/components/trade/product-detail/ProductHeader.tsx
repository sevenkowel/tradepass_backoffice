'use client';

import { Star, ArrowLeft, TrendingUp, TrendingDown, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TradingProduct } from '@/lib/trade/types';
import { DirectionBadge } from '../shared/DirectionBadge';
import { useTradeSettingsStore } from '@/lib/trade/store/tradeSettingsStore';

interface ProductHeaderProps {
  product: TradingProduct;
  onBack: () => void;
  onFavoriteToggle: () => void;
  onTrade: (direction: 'buy' | 'sell') => void;
  onSettingsClick?: () => void;
}

export function ProductHeader({
  product,
  onBack,
  onFavoriteToggle,
  onTrade,
  onSettingsClick,
}: ProductHeaderProps) {
  const isPositive = product.changePercent >= 0;
  const { tradeMode, aiSignalEnabled } = useTradeSettingsStore();

  return (
    <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        {/* 返回按钮和设置 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
            返回行情
          </button>

          <div className="flex items-center gap-3">
            {/* AI 信号状态指示 */}
            {aiSignalEnabled && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  AI 信号已启用
                </span>
              </div>
            )}
            {/* 交易模式指示 */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {tradeMode === 'beginner' ? '新手模式' : '专业模式'}
              </span>
            </div>
            {/* 设置按钮 */}
            <button
              onClick={onSettingsClick}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="交易设置"
            >
              <Settings className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* 产品信息 */}
          <div className="flex items-start gap-4">
            <button
              onClick={onFavoriteToggle}
              className={cn(
                'p-2 rounded-lg transition-colors mt-1',
                product.isFavorite
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
                  : 'text-slate-300 hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              )}
            >
              <Star
                className={cn('w-5 h-5', product.isFavorite && 'fill-current')}
              />
            </button>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {product.symbol}
                </h1>
                <DirectionBadge
                  direction={product.aiSignal.direction}
                  size="sm"
                />
              </div>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                {product.name} · {product.shortName}
              </p>
            </div>
          </div>

          {/* 价格和涨跌幅 */}
          <div className="flex items-center gap-6">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {product.bid.toFixed(product.digits || 2)}
                </span>
                <span className="text-lg text-rose-600 dark:text-rose-400">
                  {product.ask.toFixed(product.digits || 2)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn(
                    'flex items-center gap-1 text-sm font-medium',
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
                  {isPositive ? '+' : ''}
                  {product.change.toFixed(2)} ({isPositive ? '+' : ''}
                  {product.changePercent.toFixed(2)}%)
                </span>
                <span className="text-sm text-slate-400">
                  点差 {product.spread.toFixed(1)}
                </span>
              </div>
            </div>

            {/* 交易按钮 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onTrade('buy')}
                className={cn(
                  'px-6 py-3 text-base font-semibold rounded-lg',
                  'bg-emerald-500 hover:bg-emerald-600 text-white',
                  'transition-colors shadow-sm'
                )}
              >
                买入
              </button>
              <button
                onClick={() => onTrade('sell')}
                className={cn(
                  'px-6 py-3 text-base font-semibold rounded-lg',
                  'bg-rose-500 hover:bg-rose-600 text-white',
                  'transition-colors shadow-sm'
                )}
              >
                卖出
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
