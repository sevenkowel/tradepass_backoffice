'use client';

import { cn } from '@/lib/utils';

interface ConfidenceBarProps {
  confidence: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ConfidenceBar({
  confidence,
  size = 'md',
  showLabel = true,
  className,
}: ConfidenceBarProps) {
  // 根据置信度确定颜色
  const getColor = (value: number) => {
    if (value >= 75) return 'bg-emerald-500';
    if (value >= 50) return 'bg-amber-500';
    return 'bg-slate-400';
  };

  const getLabelColor = (value: number) => {
    if (value >= 75) return 'text-emerald-600 dark:text-emerald-400';
    if (value >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-slate-500';
  };

  const heightClass = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  };

  return (
    <div className={cn('w-full', className)}>
      {/* 进度条 */}
      <div
        className={cn(
          'w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden',
          heightClass[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            getColor(confidence)
          )}
          style={{ width: `${confidence}%` }}
        />
      </div>

      {/* 标签 */}
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className={cn('text-xs font-medium', getLabelColor(confidence))}>
            置信度 {confidence}%
          </span>
          <span className="text-xs text-slate-400">
            {confidence >= 75 ? '高' : confidence >= 50 ? '中' : '低'}
          </span>
        </div>
      )}
    </div>
  );
}
