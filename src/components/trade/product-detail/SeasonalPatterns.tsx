'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// 月度统计数据
export interface MonthlyStat {
  month: number; // 1-12
  monthName: string;
  avgReturn: number; // 平均涨跌幅 (%)
  winRate: number; // 胜率 (0-1)
  avgVolatility: number; // 平均波动率 (%)
  sampleYears: number; // 样本年数
}

// 季节性数据
export interface SeasonalData {
  monthlyStats: MonthlyStat[];
  bestMonth: { month: number; avgReturn: number };
  worstMonth: { month: number; avgReturn: number };
  summary: string;
}

interface SeasonalPatternsProps {
  data: SeasonalData;
  currentMonth?: number; // 当前月份，用于高亮
}

export function SeasonalPatterns({ data, currentMonth = new Date().getMonth() + 1 }: SeasonalPatternsProps) {
  // 计算统计数据
  const stats = useMemo(() => {
    const positiveMonths = data.monthlyStats.filter(m => m.avgReturn > 0).length;
    const avgReturn = data.monthlyStats.reduce((sum, m) => sum + m.avgReturn, 0) / 12;
    const avgWinRate = data.monthlyStats.reduce((sum, m) => sum + m.winRate, 0) / 12;

    return {
      positiveMonths,
      avgReturn: avgReturn.toFixed(2),
      avgWinRate: (avgWinRate * 100).toFixed(1),
    };
  }, [data.monthlyStats]);

  // 获取当前月份数据
  const currentMonthData = data.monthlyStats.find(m => m.month === currentMonth);

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            季节性规律
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          基于 {data.monthlyStats[0]?.sampleYears || 20} 年历史数据
        </span>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">上涨月份</p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
            {stats.positiveMonths}/12
          </p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">月均收益</p>
          <p className={cn(
            'text-lg font-bold',
            parseFloat(stats.avgReturn) >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
          )}>
            {parseFloat(stats.avgReturn) >= 0 ? '+' : ''}{stats.avgReturn}%
          </p>
        </div>
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">平均胜率</p>
          <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
            {stats.avgWinRate}%
          </p>
        </div>
      </div>

      {/* 月度柱状图 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            月度平均涨跌幅
          </h4>
          {currentMonthData && (
            <div className={cn(
              'flex items-center gap-1 text-xs px-2 py-1 rounded-full',
              currentMonthData.avgReturn >= 0
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
            )}>
              {currentMonthData.avgReturn >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              本月历史平均: {currentMonthData.avgReturn >= 0 ? '+' : ''}{currentMonthData.avgReturn.toFixed(1)}%
            </div>
          )}
        </div>

        {/* 柱状图 */}
        <div className="flex items-end justify-between gap-1 h-32">
          {data.monthlyStats.map((stat, index) => {
            const isCurrentMonth = stat.month === currentMonth;
            const isPositive = stat.avgReturn >= 0;
            const height = Math.min(Math.abs(stat.avgReturn) * 8, 100); // 最大高度限制

            return (
              <motion.div
                key={stat.month}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(height, 5)}%` }}
                transition={{ delay: index * 0.05, duration: 0.5, ease: 'easeOut' }}
                className="flex-1 flex flex-col items-center gap-1"
              >
                {/* 胜率标签 (仅显示高胜率月份) */}
                {stat.winRate > 0.6 && (
                  <span className="text-[10px] text-slate-400">
                    {(stat.winRate * 100).toFixed(0)}%
                  </span>
                )}

                {/* 柱子 */}
                <div
                  className={cn(
                    'w-full max-w-8 rounded-t-sm transition-all duration-200',
                    isPositive
                      ? 'bg-emerald-400 dark:bg-emerald-500'
                      : 'bg-rose-400 dark:bg-rose-500',
                    isCurrentMonth && 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-800',
                    isCurrentMonth && (isPositive ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-rose-500 dark:bg-rose-400')
                  )}
                  style={{ height: '100%' }}
                  title={`${stat.monthName}: ${stat.avgReturn >= 0 ? '+' : ''}${stat.avgReturn.toFixed(2)}% (胜率 ${(stat.winRate * 100).toFixed(0)}%)`}
                />

                {/* 月份标签 */}
                <span className={cn(
                  'text-xs',
                  isCurrentMonth
                    ? 'font-bold text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400'
                )}>
                  {stat.monthName.replace('月', '')}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* 图例 */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-400 dark:bg-emerald-500" />
            <span className="text-xs text-slate-500 dark:text-slate-400">正收益</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-rose-400 dark:bg-rose-500" />
            <span className="text-xs text-slate-500 dark:text-slate-400">负收益</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500 ring-2 ring-blue-500/30" />
            <span className="text-xs text-slate-500 dark:text-slate-400">当前月份</span>
          </div>
        </div>
      </div>

      {/* 最佳/最差月份 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              历史最佳月份
            </span>
          </div>
          <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
            {data.bestMonth.month}月
          </p>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            平均 +{data.bestMonth.avgReturn.toFixed(1)}%
          </p>
        </div>

        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-100 dark:border-rose-900/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
              历史最差月份
            </span>
          </div>
          <p className="text-lg font-bold text-rose-800 dark:text-rose-200">
            {data.worstMonth.month}月
          </p>
          <p className="text-sm text-rose-600 dark:text-rose-400">
            平均 {data.worstMonth.avgReturn.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* 总结 */}
      <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg flex items-start gap-2">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {data.summary}
        </p>
      </div>
    </div>
  );
}

// 默认导出示例数据（用于 Mock）
export const mockGoldSeasonal: SeasonalData = {
  monthlyStats: [
    { month: 1, monthName: '1月', avgReturn: 2.8, winRate: 0.65, avgVolatility: 12.5, sampleYears: 20 },
    { month: 2, monthName: '2月', avgReturn: 1.5, winRate: 0.58, avgVolatility: 11.2, sampleYears: 20 },
    { month: 3, monthName: '3月', avgReturn: -0.3, winRate: 0.45, avgVolatility: 13.8, sampleYears: 20 },
    { month: 4, monthName: '4月', avgReturn: 0.8, winRate: 0.52, avgVolatility: 10.5, sampleYears: 20 },
    { month: 5, monthName: '5月', avgReturn: -0.5, winRate: 0.42, avgVolatility: 11.8, sampleYears: 20 },
    { month: 6, monthName: '6月', avgReturn: -1.2, winRate: 0.38, avgVolatility: 14.2, sampleYears: 20 },
    { month: 7, monthName: '7月', avgReturn: 1.2, winRate: 0.55, avgVolatility: 12.0, sampleYears: 20 },
    { month: 8, monthName: '8月', avgReturn: 2.1, winRate: 0.62, avgVolatility: 13.5, sampleYears: 20 },
    { month: 9, monthName: '9月', avgReturn: -0.5, winRate: 0.45, avgVolatility: 14.2, sampleYears: 20 },
    { month: 10, monthName: '10月', avgReturn: 1.8, winRate: 0.58, avgVolatility: 15.5, sampleYears: 20 },
    { month: 11, monthName: '11月', avgReturn: 0.6, winRate: 0.48, avgVolatility: 13.0, sampleYears: 20 },
    { month: 12, monthName: '12月', avgReturn: 1.2, winRate: 0.55, avgVolatility: 11.5, sampleYears: 20 },
  ],
  bestMonth: { month: 1, avgReturn: 2.8 },
  worstMonth: { month: 6, avgReturn: -1.2 },
  summary: '黄金历史上在1月表现最佳，平均涨幅2.8%，胜率65%。6月通常表现较弱，平均下跌1.2%。8月和10月也是表现较好的月份。建议关注季节性交易机会，特别是在年初和夏末时段。',
};
