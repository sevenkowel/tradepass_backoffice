'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AssetClass, TradeDirection, SortField, SortOrder, TradingProduct } from '@/lib/trade/types';
import { useProducts } from '@/lib/trade/hooks/useMarketData';
import { MarketService } from '@/lib/trade/services/marketService';
import { CategoryTabs } from './CategoryTabs';
import { MarketFilterBar } from './MarketFilterBar';
import { MarketTable } from './MarketTable';

// 静态数据，避免每次渲染重新计算
const STATIC_COUNTS = {
  forex: 5,
  indices: 4,
  commodities: 4,
};

// 使用 memo 优化组件重渲染
const MarketsPageContent = memo(function MarketsPageContent({
  products,
  isLoading,
  counts,
  onFavoriteToggle,
  onTradeClick,
  onRowClick,
}: {
  products: TradingProduct[];
  isLoading: boolean;
  counts: Record<string, number>;
  onFavoriteToggle: (symbol: string) => void;
  onTradeClick: (symbol: string, direction: 'buy' | 'sell') => void;
  onRowClick: (symbol: string) => void;
}) {
  return (
    <MarketTable
      products={products}
      isLoading={isLoading}
      onFavoriteToggle={onFavoriteToggle}
      onTradeClick={onTradeClick}
      onRowClick={onRowClick}
    />
  );
});

export function MarketsPage() {
  const router = useRouter();

  // 状态
  const [activeTab, setActiveTab] = useState<AssetClass | 'favorites'>('forex');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSignalFilter, setAiSignalFilter] = useState<TradeDirection | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('change');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 构建筛选条件 - 使用 useMemo 避免每次渲染重新创建
  const filter = useMemo(() => ({
    ...(activeTab !== 'favorites' && { assetClass: activeTab as AssetClass }),
    ...(activeTab === 'favorites' && { favoritesOnly: true }),
    ...(aiSignalFilter !== 'all' && { aiSignal: aiSignalFilter }),
    ...(searchQuery && { searchQuery }),
  }), [activeTab, aiSignalFilter, searchQuery]);

  const sort = useMemo(() => ({ field: sortField, order: sortOrder }), [sortField, sortOrder]);

  // 获取数据 - 减少自动刷新频率以提升性能
  const { products, isLoading, refetch } = useProducts({
    filter,
    sort,
    autoRefresh: true,
    refreshInterval: 10000, // 增加到 10 秒
  });

  // 处理排序变化
  const handleSortChange = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(field);
        setSortOrder('desc');
      }
    },
    [sortField, sortOrder]
  );

  // 处理收藏切换
  const handleFavoriteToggle = useCallback(async (symbol: string) => {
    await MarketService.toggleFavorite(symbol);
    refetch();
  }, [refetch]);

  // 处理交易点击
  const handleTradeClick = useCallback(
    (symbol: string, direction: 'buy' | 'sell') => {
      // 跳转到产品详情页，带上交易方向参数
      router.push(`/portal/markets/${symbol}/trade?action=${direction}`);
    },
    [router]
  );

  // 处理行点击
  const handleRowClick = useCallback(
    (symbol: string) => {
      router.push(`/portal/markets/${symbol}`);
    },
    [router]
  );

  // 计算各分类数量 - 使用 useMemo 缓存
  const counts = useMemo(() => ({
    ...STATIC_COUNTS,
    favorites: products.filter((p) => p.isFavorite).length,
  }), [products]);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  市场行情
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  实时追踪外汇、指数、大宗商品行情
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                AI信号已更新
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* 分类标签 */}
        <div className="mb-4">
          <CategoryTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={counts}
          />
        </div>

        {/* 筛选栏 */}
        <div className="mb-4">
          <MarketFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            aiSignalFilter={aiSignalFilter}
            onAiSignalFilterChange={setAiSignalFilter}
            sortField={sortField}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        </div>

        {/* 产品列表 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          <MarketsPageContent
            products={products}
            isLoading={isLoading}
            counts={counts}
            onFavoriteToggle={handleFavoriteToggle}
            onTradeClick={handleTradeClick}
            onRowClick={handleRowClick}
          />
        </div>
      </div>
    </div>
  );
}
