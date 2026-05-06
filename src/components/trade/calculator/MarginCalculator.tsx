'use client';

import { useState, useMemo } from 'react';
import { Calculator, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TradingProduct } from '@/lib/trade/types';

interface MarginCalculatorProps {
  product: TradingProduct;
  accountBalance?: number;
  leverage?: number;
}

export function MarginCalculator({
  product,
  accountBalance = 10000,
  leverage = 100,
}: MarginCalculatorProps) {
  const [volume, setVolume] = useState(0.1);
  const [customPrice, setCustomPrice] = useState<number | null>(null);

  // Calculate margin and related values
  const calculations = useMemo(() => {
    const price = customPrice || product.ask;
    const contractSize = product.contractSize || 100; // Default 100 oz for gold
    const tickSize = product.tickSize || 0.01;

    // Margin = (Lot * Contract Size * Price) / Leverage
    const margin = (volume * contractSize * price) / leverage;

    // Pip value = Lot * Contract Size * Tick Size
    const pipValue = volume * contractSize * tickSize;

    // Risk percentage
    const riskPercent = accountBalance > 0 ? (margin / accountBalance) * 100 : 0;

    return {
      margin,
      pipValue,
      riskPercent,
      contractSize,
      tickSize,
    };
  }, [volume, customPrice, product, leverage, accountBalance]);

  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="w-4 h-4 text-slate-500" />
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          保证金计算器
        </h4>
      </div>

      {/* Volume Input */}
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">
          交易手数
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            min="0.01"
            max="100"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value) || 0)}
            className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
          />
          <select
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
          >
            <option value={0.01}>0.01</option>
            <option value={0.05}>0.05</option>
            <option value={0.1}>0.1</option>
            <option value={0.5}>0.5</option>
            <option value={1}>1.0</option>
          </select>
        </div>
      </div>

      {/* Price Input (optional) */}
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">
          计算价格 (可选)
        </label>
        <input
          type="number"
          step="0.01"
          value={customPrice || ''}
          onChange={(e) => setCustomPrice(e.target.value ? parseFloat(e.target.value) : null)}
          placeholder={`当前: ${product.ask}`}
          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 placeholder:text-slate-400"
        />
      </div>

      {/* Results */}
      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-600">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">所需保证金</span>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
            ${calculations.margin.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">每点价值</span>
          <span className="text-sm text-slate-700 dark:text-slate-300">
            ${calculations.pipValue.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">占账户比例</span>
          <span
            className={cn(
              'text-sm font-medium',
              calculations.riskPercent > 10
                ? 'text-red-500'
                : calculations.riskPercent > 5
                ? 'text-amber-500'
                : 'text-emerald-500'
            )}
          >
            {calculations.riskPercent.toFixed(1)}%
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">杠杆</span>
          <span className="text-sm text-slate-700 dark:text-slate-300">1:{leverage}</span>
        </div>
      </div>

      {/* Risk Warning */}
      {calculations.riskPercent > 10 && (
        <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <Info className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400">
            保证金占用超过账户 10%，请注意风险控制
          </p>
        </div>
      )}

      {/* Formula Note */}
      <p className="text-xs text-slate-400 dark:text-slate-500">
        公式: 保证金 = (手数 × {calculations.contractSize} × 价格) / {leverage}
      </p>
    </div>
  );
}

// Simplified version for inline display
export function MarginCalculatorInline({
  product,
  volume,
  leverage = 100,
}: {
  product: TradingProduct;
  volume: number;
  leverage?: number;
}) {
  const margin = useMemo(() => {
    const contractSize = product.contractSize || 100;
    return (volume * contractSize * product.ask) / leverage;
  }, [volume, product, leverage]);

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500 dark:text-slate-400">预估保证金</span>
      <span className="font-medium text-slate-900 dark:text-slate-100">
        ${margin.toFixed(2)}
      </span>
    </div>
  );
}
