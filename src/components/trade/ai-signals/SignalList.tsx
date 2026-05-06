'use client';

import { Loader2 } from 'lucide-react';
import type { AISignal } from '@/lib/trade/types';
import { SignalCard } from './SignalCard';

interface SignalListProps {
  signals: AISignal[];
  isLoading: boolean;
  onTrade?: (signal: AISignal) => void;
}

export function SignalList({ signals, isLoading, onTrade }: SignalListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-slate-500">加载信号...</span>
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
          暂无活跃信号
        </p>
        <p className="text-sm text-slate-500 mt-1">
          AI正在分析市场，请稍后查看
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {signals.map((signal) => (
        <SignalCard
          key={signal.id}
          signal={signal}
          onTrade={onTrade ? () => onTrade(signal) : undefined}
        />
      ))}
    </div>
  );
}
