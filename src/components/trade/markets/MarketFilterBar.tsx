'use client';

import { Search, ArrowUpDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TradeDirection, SortField, SortOrder } from '@/lib/trade/types';

interface MarketFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  aiSignalFilter: TradeDirection | 'all';
  onAiSignalFilterChange: (filter: TradeDirection | 'all') => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField) => void;
}

const aiSignalOptions = [
  { value: 'all', label: '全部信号' },
  { value: 'buy', label: '买入' },
  { value: 'sell', label: '卖出' },
  { value: 'neutral', label: '中性' },
] as const;

export function MarketFilterBar({
  searchQuery,
  onSearchChange,
  aiSignalFilter,
  onAiSignalFilterChange,
  sortField,
  sortOrder,
  onSortChange,
}: MarketFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      {/* 搜索 */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="搜索产品代码或名称..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            'w-full pl-10 pr-4 py-2 text-sm rounded-md border',
            'border-slate-200 dark:border-slate-600',
            'bg-slate-50 dark:bg-slate-700',
            'text-slate-900 dark:text-slate-100',
            'placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          )}
        />
      </div>

      {/* AI信号筛选 */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={aiSignalFilter}
          onChange={(e) => onAiSignalFilterChange(e.target.value as TradeDirection | 'all')}
          className={cn(
            'px-3 py-2 text-sm rounded-md border',
            'border-slate-200 dark:border-slate-600',
            'bg-slate-50 dark:bg-slate-700',
            'text-slate-900 dark:text-slate-100',
            'focus:outline-none focus:ring-2 focus:ring-blue-500'
          )}
        >
          {aiSignalOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 排序 */}
      <button
        onClick={() => onSortChange('change')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border',
          'border-slate-200 dark:border-slate-600',
          'hover:bg-slate-50 dark:hover:bg-slate-700',
          sortField === 'change' && 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        )}
      >
        <ArrowUpDown className="w-4 h-4" />
        <span>涨跌幅</span>
        {sortField === 'change' && (
          <span className="text-xs text-slate-500">
            {sortOrder === 'desc' ? '↓' : '↑'}
          </span>
        )}
      </button>
    </div>
  );
}
