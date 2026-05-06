'use client';

import { useState } from 'react';
import { Wallet, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TradingProduct } from '@/lib/trade/types';

interface TradePanelProps {
  product: TradingProduct;
  defaultDirection?: 'buy' | 'sell';
}

export function TradePanel({ product, defaultDirection = 'buy' }: TradePanelProps) {
  const [direction, setDirection] = useState<'buy' | 'sell'>(defaultDirection);
  const [volume, setVolume] = useState(0.01);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  // 计算保证金（模拟）
  const margin = (product.bid * volume * 100000 * 0.02).toFixed(2);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 sticky top-4">
      {/* 账户选择 */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-slate-400" />
          <select className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none">
            <option>标准账户 #12345</option>
            <option>ECN账户 #67890</option>
          </select>
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-slate-500">余额</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            $10,250.00
          </span>
        </div>
      </div>

      {/* 买卖切换 */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setDirection('buy')}
            className={cn(
              'py-3 text-sm font-semibold rounded-lg transition-colors',
              direction === 'buy'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            )}
          >
            买入
          </button>
          <button
            onClick={() => setDirection('sell')}
            className={cn(
              'py-3 text-sm font-semibold rounded-lg transition-colors',
              direction === 'sell'
                ? 'bg-rose-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            )}
          >
            卖出
          </button>
        </div>

        {/* 价格显示 */}
        <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-4">
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">卖出</div>
            <div className="text-lg font-semibold text-rose-600 dark:text-rose-400">
              {product.bid.toFixed(product.digits || 2)}
            </div>
          </div>
          <div className="text-xs text-slate-400">
            点差 {product.spread.toFixed(1)}
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">买入</div>
            <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
              {product.ask.toFixed(product.digits || 2)}
            </div>
          </div>
        </div>

        {/* 手数 */}
        <div className="mb-4">
          <label className="block text-sm text-slate-500 mb-1.5">交易量（手）</label>
          <div className="flex items-center">
            <button
              onClick={() => setVolume(Math.max(0.01, volume - 0.01))}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-l-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              -
            </button>
            <input
              type="number"
              min={0.01}
              max={100}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value) || 0.01)}
              className="flex-1 px-3 py-2 text-center border-t border-b border-slate-200 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100"
            />
            <button
              onClick={() => setVolume(Math.min(100, volume + 0.01))}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-r-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              +
            </button>
          </div>
        </div>

        {/* 止损/止盈 */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-sm text-slate-500 mb-1.5">止损</label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder={`${product.bid * 0.99}`}
              className={cn(
                'w-full px-3 py-2 text-sm rounded-lg border',
                'border-slate-200 dark:border-slate-600',
                'bg-slate-50 dark:bg-slate-700/50',
                'text-slate-900 dark:text-slate-100',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1.5">止盈</label>
            <input
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder={`${product.ask * 1.01}`}
              className={cn(
                'w-full px-3 py-2 text-sm rounded-lg border',
                'border-slate-200 dark:border-slate-600',
                'bg-slate-50 dark:bg-slate-700/50',
                'text-slate-900 dark:text-slate-100',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
            />
          </div>
        </div>

        {/* 保证金信息 */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-4">
          <div className="flex items-center gap-1 text-sm text-slate-500">
            所需保证金
            <Info className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            ${margin}
          </span>
        </div>

        {/* 交易按钮 */}
        <button
          className={cn(
            'w-full py-3 text-base font-semibold rounded-lg text-white transition-colors',
            direction === 'buy'
              ? 'bg-emerald-500 hover:bg-emerald-600'
              : 'bg-rose-500 hover:bg-rose-600'
          )}
        >
          {direction === 'buy' ? '买入' : '卖出'} {product.symbol}
        </button>

        <p className="text-xs text-slate-400 text-center mt-3">
          点击交易将跳转至 MT5 执行
        </p>
      </div>
    </div>
  );
}
