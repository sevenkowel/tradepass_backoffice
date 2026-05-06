'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { AssetClass } from '@/lib/trade/types';

interface CategoryTabsProps {
  activeTab: AssetClass | 'favorites';
  onTabChange: (tab: AssetClass | 'favorites') => void;
  counts?: Record<string, number>;
}

const tabs = [
  { id: 'forex', label: '外汇', labelEn: 'Forex' },
  { id: 'indices', label: '指数', labelEn: 'Indices' },
  { id: 'commodities', label: '大宗商品', labelEn: 'Commodities' },
  { id: 'favorites', label: '自选', labelEn: 'Favorites' },
] as const;

// 单个 Tab 按钮组件 - 使用 memo 避免不必要的重渲染
const TabButton = memo(function TabButton({
  tab,
  isActive,
  count,
  onClick,
}: {
  tab: typeof tabs[number];
  isActive: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative px-4 py-2 text-sm font-medium rounded-md transition-colors',
        'hover:text-slate-900 dark:hover:text-slate-100',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/20',
        isActive
          ? 'text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 shadow-sm'
          : 'text-slate-500 dark:text-slate-400'
      )}
    >
      <span className="hidden sm:inline">{tab.label}</span>
      <span className="sm:hidden">{tab.labelEn}</span>
      {count !== undefined && (
        <span className="ml-1.5 text-xs text-slate-400">
          ({count})
        </span>
      )}
    </button>
  );
});

export const CategoryTabs = memo(function CategoryTabs({
  activeTab,
  onTabChange,
  counts,
}: CategoryTabsProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          count={counts?.[tab.id]}
          onClick={() => onTabChange(tab.id as AssetClass | 'favorites')}
        />
      ))}
    </div>
  );
});
