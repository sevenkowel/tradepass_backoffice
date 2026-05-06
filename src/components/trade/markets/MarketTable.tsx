'use client';

import { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TradingProduct } from '@/lib/trade/types';
import { MarketRow } from './MarketRow';

interface MarketTableProps {
  products: TradingProduct[];
  isLoading: boolean;
  onFavoriteToggle: (symbol: string) => void;
  onTradeClick: (symbol: string, direction: 'buy' | 'sell') => void;
  onRowClick: (symbol: string) => void;
}

// 表头组件 - 静态，不需要重渲染
const TableHeader = memo(function TableHeader() {
  return (
    <thead>
      <tr className="border-b border-slate-200 dark:border-slate-700">
        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          产品
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          价格
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          涨跌幅
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          情绪指数
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          AI信号
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          操作
        </th>
      </tr>
    </thead>
  );
});

// 空状态组件
const EmptyState = memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
      <p className="text-lg font-medium">暂无产品</p>
      <p className="text-sm mt-1">请调整筛选条件</p>
    </div>
  );
});

// 加载状态组件
const LoadingState = memo(function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <span className="ml-2 text-slate-500">加载中...</span>
    </div>
  );
});

export const MarketTable = memo(function MarketTable({
  products,
  isLoading,
  onFavoriteToggle,
  onTradeClick,
  onRowClick,
}: MarketTableProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (products.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <TableHeader />
        <tbody>
          {products.map((product) => (
            <MarketRow
              key={product.id}
              product={product}
              onFavoriteToggle={onFavoriteToggle}
              onTradeClick={onTradeClick}
              onRowClick={onRowClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
});
