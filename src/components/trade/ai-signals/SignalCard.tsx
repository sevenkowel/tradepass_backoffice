'use client';

import { Sparkles, Target, Shield, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AISignal } from '@/lib/trade/types';
import { DirectionBadge } from '../shared/DirectionBadge';

interface SignalCardProps {
  signal: AISignal;
  onTrade?: () => void;
}

export function SignalCard({ signal, onTrade }: SignalCardProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isProfitable = signal.direction === 'buy' 
    ? signal.takeProfit > signal.entryPrice
    : signal.takeProfit < signal.entryPrice;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
      {/* 头部 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
              {signal.symbol}
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>{signal.signalType === 'intraday' ? '日内' : '波段'}</span>
              <span>·</span>
              <span>{signal.timeframe}</span>
            </div>
          </div>
        </div>
        <DirectionBadge
          direction={signal.direction}
          size="md"
        />
      </div>

      {/* 置信度 */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-slate-500">AI置信度</span>
          <span
            className={cn(
              'font-semibold',
              signal.confidence >= 75
                ? 'text-emerald-600 dark:text-emerald-400'
                : signal.confidence >= 50
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-500'
            )}
          >
            {signal.confidence}%
          </span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              signal.confidence >= 75
                ? 'bg-emerald-500'
                : signal.confidence >= 50
                ? 'bg-amber-500'
                : 'bg-slate-400'
            )}
            style={{ width: `${signal.confidence}%` }}
          />
        </div>
      </div>

      {/* 价格网格 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
            <Target className="w-3 h-3" />
            入场价
          </div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">
            {signal.entryPrice.toFixed(2)}
          </div>
        </div>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mb-1">
            <TrendingUp className="w-3 h-3" />
            止盈
          </div>
          <div className="font-semibold text-emerald-700 dark:text-emerald-400">
            {signal.takeProfit.toFixed(2)}
          </div>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
          <div className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 mb-1">
            <TrendingDown className="w-3 h-3" />
            止损
          </div>
          <div className="font-semibold text-rose-700 dark:text-rose-400">
            {signal.stopLoss.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 风险等级 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500">风险等级</span>
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              signal.riskLevel === 'low'
                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                : signal.riskLevel === 'medium'
                ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20'
            )}
          >
            {signal.riskLevel === 'low' ? '低' : signal.riskLevel === 'medium' ? '中' : '高'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Clock className="w-3 h-3" />
          {formatTime(signal.createdAt)}
        </div>
      </div>

      {/* 交易按钮 */}
      {onTrade && (
        <button
          onClick={onTrade}
          className={cn(
            'w-full py-2.5 text-sm font-semibold rounded-lg text-white transition-colors',
            signal.direction === 'buy'
              ? 'bg-emerald-500 hover:bg-emerald-600'
              : 'bg-rose-500 hover:bg-rose-600'
          )}
        >
          按此信号交易
        </button>
      )}
    </div>
  );
}
