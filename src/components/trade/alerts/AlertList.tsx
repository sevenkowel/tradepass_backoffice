'use client';

import { Bell, BellOff, Trash2, Edit2, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PriceAlert, AlertCondition } from '@/lib/trade/types';

interface AlertListProps {
  alerts: PriceAlert[];
  onToggle: (alertId: string) => void;
  onDelete: (alertId: string) => void;
  onEdit: (alert: PriceAlert) => void;
}

const conditionLabels: Record<AlertCondition, string> = {
  above: '价格突破',
  below: '价格跌破',
  change_up: '涨幅超过',
  change_down: '跌幅超过',
};

const conditionIcons = {
  above: TrendingUp,
  below: TrendingDown,
  change_up: TrendingUp,
  change_down: TrendingDown,
};

export function AlertList({ alerts, onToggle, onDelete, onEdit }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Bell className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
          暂无价格预警
        </p>
        <p className="text-sm text-slate-500 mt-1">
          创建预警，及时掌握市场动态
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const ConditionIcon = conditionIcons[alert.condition];

        return (
          <div
            key={alert.id}
            className={cn(
              'flex items-center justify-between p-4 rounded-xl border transition-colors',
              alert.isActive
                ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50'
            )}
          >
            {/* 左侧信息 */}
            <div className="flex items-center gap-4">
              {/* 开关 */}
              <button
                onClick={() => onToggle(alert.id)}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  alert.isActive
                    ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-slate-400 bg-slate-100 dark:bg-slate-700'
                )}
              >
                {alert.isActive ? (
                  <Bell className="w-5 h-5" />
                ) : (
                  <BellOff className="w-5 h-5" />
                )}
              </button>

              {/* 产品信息 */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {alert.symbol}
                  </span>
                  <span
                    className={cn(
                      'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                      alert.condition.includes('up')
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20'
                    )}
                  >
                    <ConditionIcon className="w-3 h-3" />
                    {conditionLabels[alert.condition]}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {alert.targetPercent
                      ? `${alert.targetPercent}%`
                      : alert.targetValue?.toFixed(2) || '-'}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    通知：
                    {alert.channels.includes('app') && 'App '}
                    {alert.channels.includes('email') && '邮件 '}
                    {alert.channels.includes('sms') && '短信 '}
                  </span>
                </div>
              </div>
            </div>

            {/* 右侧操作 */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(alert)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(alert.id)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
