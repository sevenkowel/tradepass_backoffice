'use client';

import { useState } from 'react';
import { X, Bell, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AlertCondition, AlertChannel } from '@/lib/trade/types';

interface CreateAlertModalProps {
  symbol?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    symbol: string;
    condition: AlertCondition;
    targetValue: number;
    targetPercent?: number;
    channels: AlertChannel[];
  }) => void;
}

const conditions: { value: AlertCondition; label: string; icon: typeof TrendingUp }[] = [
  { value: 'above', label: '价格突破', icon: TrendingUp },
  { value: 'below', label: '价格跌破', icon: TrendingDown },
  { value: 'change_up', label: '涨幅超过', icon: TrendingUp },
  { value: 'change_down', label: '跌幅超过', icon: TrendingDown },
];

export function CreateAlertModal({
  symbol: initialSymbol = '',
  isOpen,
  onClose,
  onSubmit,
}: CreateAlertModalProps) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [condition, setCondition] = useState<AlertCondition>('above');
  const [value, setValue] = useState('');
  const [channels, setChannels] = useState<AlertChannel[]>(['app']);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numValue = parseFloat(value);
    if (!symbol || !numValue) return;

    const isPercentCondition = condition === 'change_up' || condition === 'change_down';

    onSubmit({
      symbol: symbol.toUpperCase(),
      condition,
      targetValue: isPercentCondition ? 0 : numValue,
      targetPercent: isPercentCondition ? numValue : undefined,
      channels,
    });

    // 重置表单
    setSymbol('');
    setValue('');
    setChannels(['app']);
    onClose();
  };

  const toggleChannel = (channel: AlertChannel) => {
    setChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const isPercentCondition = condition === 'change_up' || condition === 'change_down';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              创建价格预警
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 产品代码 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              产品代码
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="如：XAUUSD"
              className={cn(
                'w-full px-3 py-2 text-sm rounded-lg border',
                'border-slate-200 dark:border-slate-600',
                'bg-slate-50 dark:bg-slate-700/50',
                'text-slate-900 dark:text-slate-100',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              )}
            />
          </div>

          {/* 条件类型 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              预警条件
            </label>
            <div className="grid grid-cols-2 gap-2">
              {conditions.map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCondition(c.value)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors',
                      condition === c.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 目标值 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {isPercentCondition ? '涨跌幅 (%)' : '目标价格'}
            </label>
            <div className="relative">
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={isPercentCondition ? '如：2.5' : '如：2050.00'}
                step={isPercentCondition ? 0.1 : 0.01}
                className={cn(
                  'w-full px-3 py-2 text-sm rounded-lg border',
                  'border-slate-200 dark:border-slate-600',
                  'bg-slate-50 dark:bg-slate-700/50',
                  'text-slate-900 dark:text-slate-100',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                )}
              />
              {isPercentCondition && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  %
                </span>
              )}
            </div>
          </div>

          {/* 通知渠道 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              通知方式
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'app', label: 'App推送' },
                { value: 'email', label: '邮件' },
                { value: 'sms', label: '短信' },
              ].map((ch) => (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => toggleChannel(ch.value as AlertChannel)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-full border transition-colors',
                    channels.includes(ch.value as AlertChannel)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                  )}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!symbol || !value}
              className={cn(
                'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors',
                !symbol || !value
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              )}
            >
              创建预警
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
