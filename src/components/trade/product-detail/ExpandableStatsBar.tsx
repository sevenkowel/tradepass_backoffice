'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TradingProduct, ProductDetail } from '@/lib/trade/types';

interface ExpandableStatsBarProps {
  product: TradingProduct;
  detail?: ProductDetail;
}

interface StatItem {
  label: string;
  value: string | number;
  unit?: string;
  change?: number;
  isPositive?: boolean;
}

export function ExpandableStatsBar({ product, detail }: ExpandableStatsBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 核心统计数据（始终显示）
  const coreStats: StatItem[] = [
    {
      label: '开盘价',
      value: product.openPrice?.toFixed(product.digits || 2) || '-',
    },
    {
      label: '最高价',
      value: product.high24h.toFixed(product.digits || 2),
      isPositive: true,
    },
    {
      label: '最低价',
      value: product.low24h.toFixed(product.digits || 2),
      isPositive: false,
    },
    {
      label: '成交量',
      value: formatVolume(product.volume || 0),
    },
  ];

  // 扩展统计数据（展开后显示）
  const extendedStats: StatItem[] = [
    {
      label: '52周最高',
      value: detail?.high52w?.toFixed(product.digits || 2) || '-',
    },
    {
      label: '52周最低',
      value: detail?.low52w?.toFixed(product.digits || 2) || '-',
    },
    {
      label: '平均波动率',
      value: detail?.volatility ? `${(detail.volatility * 100).toFixed(1)}%` : '-',
    },
    {
      label: '换手率',
      value: detail?.turnover ? `${(detail.turnover * 100).toFixed(2)}%` : '-',
    },
    {
      label: '点差',
      value: product.spread.toFixed(1),
      unit: '点',
    },
    {
      label: '合约大小',
      value: product.contractSize || detail?.contractSize || '-',
    },
    {
      label: '最小交易量',
      value: product.minVolume || detail?.minVolume || '-',
      unit: '手',
    },
    {
      label: '最大交易量',
      value: product.maxVolume || detail?.maxVolume || '-',
      unit: '手',
    },
  ];

  // 计算 52 周范围位置
  const rangePosition = detail?.high52w && detail?.low52w
    ? ((product.bid - detail.low52w) / (detail.high52w - detail.low52w)) * 100
    : 50;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* 核心统计 */}
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {coreStats.map((stat, index) => (
            <div key={index} className="text-center sm:text-left">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                {stat.label}
              </p>
              <p className={cn(
                'text-sm font-semibold',
                stat.isPositive === true && 'text-emerald-600 dark:text-emerald-400',
                stat.isPositive === false && 'text-rose-600 dark:text-rose-400',
                stat.isPositive === undefined && 'text-slate-900 dark:text-slate-100'
              )}>
                {stat.value}
                {stat.unit && <span className="text-xs ml-0.5">{stat.unit}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* 52周范围可视化条 */}
        {detail?.high52w && detail?.low52w && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>52周范围</span>
              <span className="text-slate-400">
                {detail.low52w.toFixed(product.digits || 2)} - {detail.high52w.toFixed(product.digits || 2)}
              </span>
            </div>
            <div className="relative h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              {/* 范围条 */}
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-slate-200 to-emerald-500/20 dark:from-rose-500/30 dark:via-slate-600 dark:to-emerald-500/30" />
              {/* 当前位置指示器 */}
              <motion.div
                className="absolute top-0 w-1 h-full bg-blue-500 rounded-full"
                initial={{ left: '0%' }}
                animate={{ left: `${Math.min(Math.max(rangePosition, 0), 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>低点</span>
              <span className={cn(
                'font-medium',
                rangePosition > 50 ? 'text-emerald-600' : 'text-rose-600'
              )}>
                当前位于 {rangePosition.toFixed(1)}%
              </span>
              <span>高点</span>
            </div>
          </div>
        )}
      </div>

      {/* 展开/收起按钮 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-1 py-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-t border-slate-100 dark:border-slate-700 transition-colors"
      >
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {isExpanded ? '收起详情' : '查看更多'}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>

      {/* 扩展统计 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-slate-100 dark:border-slate-700">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {extendedStats.map((stat, index) => (
                  <div key={index} className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {stat.label}
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {stat.value}
                      {stat.unit && <span className="text-xs text-slate-500 ml-0.5">{stat.unit}</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 格式化成交量
function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(2)}B`;
  }
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(2)}M`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(2)}K`;
  }
  return volume.toString();
}
