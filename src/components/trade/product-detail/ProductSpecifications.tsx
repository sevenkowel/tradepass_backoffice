'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Info,
  Clock,
  Scale,
  DollarSign,
  Percent,
  ChevronDown,
  ChevronUp,
  Calendar,
  Building2,
  TrendingUp,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductDetail } from '@/lib/trade/types';

interface ProductSpecificationsProps {
  detail: ProductDetail;
}

type SpecGroup = 'trading' | 'costs' | 'schedule' | 'margin';

interface SpecItem {
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
  highlight?: boolean;
}

interface SpecSection {
  id: SpecGroup;
  title: string;
  icon: React.ElementType;
  items: SpecItem[];
}

export function ProductSpecifications({ detail }: ProductSpecificationsProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<SpecGroup>>(
    new Set(['trading', 'costs', 'schedule', 'margin'])
  );

  const toggleGroup = (group: SpecGroup) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedGroups(new Set(['trading', 'costs', 'schedule', 'margin']));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  const sections: SpecSection[] = [
    {
      id: 'trading',
      title: '交易规格',
      icon: Scale,
      items: [
        {
          label: '合约大小',
          value: detail.contractSize,
          unit: detail.symbol.includes('XAU') ? '盎司' : detail.symbol.includes('XAG') ? '盎司' : '单位',
          description: '每手交易的数量',
        },
        {
          label: '最小交易量',
          value: detail.minVolume,
          unit: '手',
          description: '单次交易的最小手数',
        },
        {
          label: '最大交易量',
          value: detail.maxVolume,
          unit: '手',
          description: '单次交易的最大手数',
        },
        {
          label: '小数位精度',
          value: detail.digits,
          unit: '位',
          description: '报价显示的小数位数',
        },
        {
          label: '最小价格变动',
          value: detail.tickSize || Math.pow(10, -detail.digits),
          unit: '点',
          description: '价格变动的最小单位',
        },
      ],
    },
    {
      id: 'costs',
      title: '交易成本',
      icon: DollarSign,
      items: [
        {
          label: '点差',
          value: detail.spread,
          unit: '点',
          description: '买入价和卖出价的差额',
          highlight: true,
        },
        {
          label: '隔夜利息（多）',
          value: detail.swapLong,
          unit: '',
          description: '持有多单过夜的费用',
        },
        {
          label: '隔夜利息（空）',
          value: detail.swapShort,
          unit: '',
          description: '持有空单过夜的费用',
        },
        {
          label: '保证金要求',
          value: detail.marginRequirement,
          unit: '%',
          description: '开仓所需保证金比例',
          highlight: true,
        },
      ],
    },
 {
      id: 'margin',
      title: '保证金与杠杆',
      icon: Shield,
      items: [
        {
          label: '杠杆比例',
          value: '1:100',
          unit: '',
          description: '默认交易杠杆',
          highlight: true,
        },
        {
          label: '保证金比例',
          value: '1%',
          unit: '',
          description: '每手所需保证金',
        },
        {
          label: '强平比例',
          value: '50%',
          unit: '',
          description: '保证金水平低于此比例将触发强平',
          highlight: true,
        },
        {
          label: '对冲保证金',
          value: '0%',
          unit: '',
          description: '对冲头寸不占用额外保证金',
        },
      ],
    },
    {
      id: 'schedule',
      title: '交易时间',
      icon: Clock,
      items: [
        {
          label: '交易时段',
          value: detail.tradingHours,
          unit: '',
          description: '该产品可交易的时间',
          highlight: true,
        },
        {
          label: '日盘',
          value: '06:00 - 05:00',
          unit: '(次日)',
          description: '主要交易时段',
        },
        {
          label: '结算时间',
          value: '05:00 - 06:00',
          unit: 'UTC',
          description: '每日结算和系统维护时间',
        },
        {
          label: '休市日',
          value: '周六、周日',
          unit: '',
          description: '周末休市',
        },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            产品规格
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 px-2 py-1"
          >
            全部展开
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1"
          >
            全部收起
          </button>
        </div>
      </div>

      {/* 规格分组 */}
      <div className="space-y-3">
        {sections.map((section) => {
          const isExpanded = expandedGroups.has(section.id);
          const Icon = section.icon;

          return (
            <div
              key={section.id}
              className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
            >
              {/* 分组标题 */}
              <button
                onClick={() => toggleGroup(section.id)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {section.title}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {/* 分组内容 */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {section.items.map((item, index) => (
                          <div
                            key={index}
                            className={cn(
                              'p-3 rounded-lg',
                              item.highlight
                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                : 'bg-slate-50 dark:bg-slate-700/30'
                            )}
                          >
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              {item.label}
                            </p>
                            <div className="flex items-baseline gap-1">
                              <span
                                className={cn(
                                  'text-lg font-semibold',
                                  item.highlight
                                    ? 'text-blue-700 dark:text-blue-300'
                                    : 'text-slate-900 dark:text-slate-100'
                                )}
                              >
                                {typeof item.value === 'number'
                                  ? item.value.toLocaleString()
                                  : item.value}
                              </span>
                              {item.unit && (
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                  {item.unit}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-slate-400 mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* 产品描述 */}
      {detail.description && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
            产品简介
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {detail.description}
          </p>
        </div>
      )}

      {/* 免责声明 */}
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
        以上信息仅供参考，实际交易参数以平台实时数据为准
      </p>
    </div>
  );
}
