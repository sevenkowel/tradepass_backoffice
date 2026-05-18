"use client";

import { motion } from "framer-motion";
import { TrendingDown, Users, CreditCard, Activity } from "lucide-react";

interface FunnelStage {
  name: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

interface ConversionFunnelProps {
  className?: string;
  data?: FunnelStage[];
}

const defaultData: FunnelStage[] = [
  { name: "访问", value: 10000, icon: <Users className="w-4 h-4" />, color: "bg-blue-500" },
  { name: "注册", value: 3500, icon: <Users className="w-4 h-4" />, color: "bg-indigo-500" },
  { name: "KYC认证", value: 2100, icon: <CreditCard className="w-4 h-4" />, color: "bg-violet-500" },
  { name: "首次入金", value: 840, icon: <CreditCard className="w-4 h-4" />, color: "bg-purple-500" },
  { name: "首笔交易", value: 630, icon: <Activity className="w-4 h-4" />, color: "bg-fuchsia-500" },
  { name: "活跃用户", value: 420, icon: <TrendingDown className="w-4 h-4" />, color: "bg-pink-500" },
];

export function ConversionFunnel({
  className = "",
  data = defaultData,
}: ConversionFunnelProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  const conversionRates = data.map((stage, index) => {
    if (index === 0) return { rate: 100, dropOff: 0 };
    const prevValue = data[index - 1].value;
    return {
      rate: Math.round((stage.value / prevValue) * 100),
      dropOff: prevValue - stage.value,
    };
  });

  const overallRate = Math.round(
    (data[data.length - 1].value / data[0].value) * 100
  );

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-violet-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white">
            转化漏斗
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            总体转化率
          </span>
          <span className="px-2 py-0.5 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 rounded-full text-sm font-medium">
            {overallRate}%
          </span>
        </div>
      </div>

      {/* Funnel */}
      <div className="p-4 space-y-3">
        {data.map((stage, index) => {
          const width = (stage.value / maxValue) * 100;
          const { rate, dropOff } = conversionRates[index];

          return (
            <div key={stage.name} className="relative">
              {/* Stage Row */}
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-8 h-8 ${stage.color} rounded-lg flex items-center justify-center text-white`}
                >
                  {stage.icon}
                </div>

                {/* Label & Bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {stage.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-slate-900 dark:text-white">
                        {stage.value.toLocaleString()}
                      </span>
                      {index > 0 && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">
                          {rate}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className={`h-full ${stage.color} rounded-full relative`}
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Drop-off indicator */}
              {index > 0 && dropOff > 0 && (
                <div className="ml-11 mt-1 text-xs text-red-500/70 dark:text-red-400/70">
                  流失 {dropOff.toLocaleString()} (↓{100 - rate}%)
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-3 gap-px bg-slate-200 dark:bg-slate-700 border-t border-slate-200 dark:border-slate-700">
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-center">
          <div className="text-lg font-semibold text-slate-900 dark:text-white">
            35%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            注册转化
          </div>
        </div>
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-center">
          <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            24%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            入金转化
          </div>
        </div>
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-center">
          <div className="text-lg font-semibold text-violet-600 dark:text-violet-400">
            4.2%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            整体转化
          </div>
        </div>
      </div>
    </div>
  );
}
