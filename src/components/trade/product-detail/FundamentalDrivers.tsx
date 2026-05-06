'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingDown,
  DollarSign,
  Landmark,
  Flame,
  Globe,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Info,
  TrendingUp,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 驱动因素影响程度
type ImpactLevel = 'high' | 'medium' | 'low';

// 驱动因素状态
type DriverStatus = 'bullish' | 'bearish' | 'neutral';

// 驱动因素数据结构
export interface FundamentalDriver {
  id: string;
  title: string;
  icon: 'TrendingDown' | 'DollarSign' | 'Landmark' | 'Flame' | 'Globe' | 'ArrowLeftRight';
  impact: ImpactLevel;
  description: string;
  currentStatus: DriverStatus;
  detail: string;
  updatedAt: string;
}

interface FundamentalDriversProps {
  drivers: FundamentalDriver[];
}

// 图标映射
const iconMap = {
  TrendingDown,
  DollarSign,
  Landmark,
  Flame,
  Globe,
  ArrowLeftRight,
};

// 影响程度配置
const impactConfig: Record<ImpactLevel, { label: string; color: string; bgColor: string }> = {
  high: {
    label: '高影响',
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
  },
  medium: {
    label: '中影响',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  },
  low: {
    label: '低影响',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-700/50',
  },
};

// 状态配置
const statusConfig: Record<DriverStatus, { label: string; icon: typeof TrendingUp; color: string; bgColor: string }> = {
  bullish: {
    label: '看涨',
    icon: TrendingUp,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  bearish: {
    label: '看跌',
    icon: TrendingDown,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
  },
  neutral: {
    label: '中性',
    icon: Minus,
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-700/50',
  },
};

export function FundamentalDrivers({ drivers }: FundamentalDriversProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            基本面驱动因素
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          共 {drivers.length} 个因素
        </span>
      </div>

      {/* Bento Grid 布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {drivers.map((driver, index) => {
          const Icon = iconMap[driver.icon];
          const impact = impactConfig[driver.impact];
          const status = statusConfig[driver.currentStatus];
          const StatusIcon = status.icon;
          const isExpanded = expandedId === driver.id;

          return (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'bg-white dark:bg-slate-800 rounded-xl border overflow-hidden',
                'border-slate-200 dark:border-slate-700',
                'hover:border-blue-300 dark:hover:border-blue-700',
                'transition-all duration-200 cursor-pointer',
                isExpanded && 'ring-2 ring-blue-500/20 border-blue-500'
              )}
              onClick={() => toggleExpand(driver.id)}
            >
              {/* 卡片头部 */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  {/* 图标 */}
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </div>

                  {/* 影响程度标签 */}
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    impact.bgColor,
                    impact.color
                  )}>
                    {impact.label}
                  </span>
                </div>

                {/* 标题 */}
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  {driver.title}
                </h4>

                {/* 描述 */}
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                  {driver.description}
                </p>

                {/* 状态标签 */}
                <div className="flex items-center justify-between mt-3">
                  <div className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-lg',
                    status.bgColor
                  )}>
                    <StatusIcon className={cn('w-3.5 h-3.5', status.color)} />
                    <span className={cn('text-xs font-medium', status.color)}>
                      {status.label}
                    </span>
                  </div>

                  {/* 展开指示器 */}
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </motion.div>
                </div>
              </div>

              {/* 展开内容 */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-100 dark:border-slate-700"
                  >
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50">
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {driver.detail}
                      </p>
                      <p className="text-xs text-slate-400 mt-3">
                        更新于 {driver.updatedAt}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// 默认导出示例数据（用于 Mock）
export const mockGoldDrivers: FundamentalDriver[] = [
  {
    id: 'real-rates',
    title: '实际利率',
    icon: 'TrendingDown',
    impact: 'high',
    description: '黄金不产生利息，实际利率上升会降低黄金吸引力',
    currentStatus: 'bearish',
    detail: '美国10年期TIPS收益率目前为 1.85%，处于近两年高位，对黄金构成压力。美联储维持高利率政策的预期持续压制金价。实际利率 = 名义利率 - 通胀预期，当前正值环境不利于无息资产。',
    updatedAt: '2025-05-05',
  },
  {
    id: 'usd-index',
    title: '美元指数',
    icon: 'DollarSign',
    impact: 'high',
    description: '黄金以美元计价，美元走强通常压制金价',
    currentStatus: 'bullish',
    detail: 'DXY 美元指数当前位于 104.5，处于上升通道。美元走强使得以美元计价的黄金对其他货币持有者变得更贵，抑制需求。关注美联储政策转向信号。',
    updatedAt: '2025-05-05',
  },
  {
    id: 'central-banks',
    title: '央行政策',
    icon: 'Landmark',
    impact: 'high',
    description: '全球央行购金量和货币政策影响金价',
    currentStatus: 'bullish',
    detail: '2024年Q3全球央行净购金量达 186 吨，中国、波兰、土耳其等国持续增持。央行购金为金价提供长期支撑，是去美元化趋势的重要体现。',
    updatedAt: '2025-05-04',
  },
  {
    id: 'inflation',
    title: '通胀预期',
    icon: 'Flame',
    impact: 'medium',
    description: '黄金是传统的通胀对冲工具',
    currentStatus: 'neutral',
    detail: '美国CPI同比增速回落至 3.2%，但仍高于美联储 2% 目标。通胀预期相对稳定，黄金作为通胀对冲的需求处于中性水平。关注能源价格对通胀的影响。',
    updatedAt: '2025-05-03',
  },
  {
    id: 'geopolitics',
    title: '地缘政治',
    icon: 'Globe',
    impact: 'medium',
    description: '避险需求推动黄金价格上涨',
    currentStatus: 'neutral',
    detail: '当前地缘风险指数处于中等水平。中东局势、俄乌冲突、台海问题等仍是潜在风险点，但市场已部分消化。避险需求对金价形成底部支撑。',
    updatedAt: '2025-05-02',
  },
  {
    id: 'etf-flows',
    title: 'ETF资金流向',
    icon: 'ArrowLeftRight',
    impact: 'low',
    description: '黄金ETF持仓变化反映机构情绪',
    currentStatus: 'bearish',
    detail: 'SPDR Gold Shares (GLD) 本周净流出 8.5 吨，机构持仓连续三周下降。高利率环境下持有黄金的机会成本上升，部分机构选择减持。',
    updatedAt: '2025-05-05',
  },
];
