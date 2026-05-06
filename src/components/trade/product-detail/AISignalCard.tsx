'use client';

import { Sparkles, Target, Shield, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AISignal } from '@/lib/trade/types';
import { DirectionBadge } from '../shared/DirectionBadge';
import { ConfidenceBar } from '../shared/ConfidenceBar';

interface AISignalCardProps {
  signal: AISignal;
  onTrade?: () => void;
}

export function AISignalCard({ signal, onTrade }: AISignalCardProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500 rounded-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            AI交易信号
          </h3>
        </div>
        <span className="text-xs text-slate-500">
          {signal.signalType === 'intraday' ? '日内' : '波段'} · {signal.timeframe}
        </span>
      </div>

      {/* 方向 */}
      <div className="flex items-center gap-3 mb-4">
        <DirectionBadge
          direction={signal.direction}
          size="lg"
          className="px-4 py-2"
        />
        <div className="flex-1">
          <ConfidenceBar confidence={signal.confidence} size="sm" showLabel={false} />
        </div>
      </div>

      {/* 价格建议 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
            <Target className="w-3 h-3" />
            入场价
          </div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">
            {signal.entryPrice.toFixed(2)}
          </div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
          <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mb-1">
            止盈
          </div>
          <div className="font-semibold text-emerald-700 dark:text-emerald-400">
            {signal.takeProfit.toFixed(2)}
          </div>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-3">
          <div className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 mb-1">
            止损
          </div>
          <div className="font-semibold text-rose-700 dark:text-rose-400">
            {signal.stopLoss.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 分析理由 */}
      <div className="mb-4">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          {signal.reason}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {signal.factors.map((factor, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded"
            >
              {factor}
            </span>
          ))}
        </div>
      </div>

      {/* 底部信息 */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          生成于 {formatTime(signal.createdAt)}
        </div>
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          历史胜率 {signal.accuracy}%
        </div>
      </div>

      {/* CTA */}
      {onTrade && (
        <button
          onClick={onTrade}
          className={cn(
            'w-full py-2.5 text-sm font-semibold rounded-lg transition-colors',
            signal.direction === 'buy'
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
              : 'bg-rose-500 hover:bg-rose-600 text-white'
          )}
        >
          按此信号交易
        </button>
      )}
    </div>
  );
}
