'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AISignal, TradeDirection } from '@/lib/trade/types';
import { useAISignals } from '@/lib/trade/hooks/useMarketData';
import { SignalList } from './SignalList';

export function AISignalsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<TradeDirection | 'all'>('all');

  const { signals, isLoading } = useAISignals();

  // 过滤信号
  const filteredSignals =
    filter === 'all'
      ? signals
      : signals.filter((s) => s.direction === filter);

  // 统计
  const stats = {
    total: signals.length,
    buy: signals.filter((s) => s.direction === 'buy').length,
    sell: signals.filter((s) => s.direction === 'sell').length,
    neutral: signals.filter((s) => s.direction === 'neutral').length,
  };

  // 处理交易
  const handleTrade = useCallback(
    (signal: AISignal) => {
      router.push(`/portal/markets/${signal.symbol}/trade?action=${signal.direction}`);
    },
    [router]
  );

  const filterButtons = [
    { value: 'all', label: '全部', count: stats.total, icon: BarChart3 },
    { value: 'buy', label: '买入', count: stats.buy, icon: TrendingUp },
    { value: 'sell', label: '卖出', count: stats.sell, icon: TrendingDown },
    { value: 'neutral', label: '中性', count: stats.neutral, icon: Minus },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  AI交易信号
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  AI驱动的智能交易建议，实时分析市场机会
                </p>
              </div>
            </div>

            {/* 统计卡片 */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="text-xs text-emerald-600 dark:text-emerald-400">买入信号</div>
                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                  {stats.buy}
                </div>
              </div>
              <div className="px-4 py-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                <div className="text-xs text-rose-600 dark:text-rose-400">卖出信号</div>
                <div className="text-lg font-bold text-rose-700 dark:text-rose-400">
                  {stats.sell}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* 筛选按钮 */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value as TradeDirection | 'all')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                filter === btn.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              )}
            >
              <btn.icon className="w-4 h-4" />
              <span>{btn.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 text-xs rounded-full',
                  filter === btn.value
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                )}
              >
                {btn.count}
              </span>
            </button>
          ))}
        </div>

        {/* 信号列表 */}
        <SignalList
          signals={filteredSignals}
          isLoading={isLoading}
          onTrade={handleTrade}
        />
      </div>
    </div>
  );
}
