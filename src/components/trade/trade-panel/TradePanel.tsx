'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Settings,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TradingProduct } from '@/lib/trade/types';
import { useTradeSettingsStore } from '@/lib/trade/store/tradeSettingsStore';
import { MarginCalculatorInline } from '../calculator/MarginCalculator';

interface TradePanelProps {
  product: TradingProduct;
  onSettingsClick?: () => void;
}

type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';
type ExpirationType = 'gtc' | 'today' | 'specify';

// Mock account data - replace with real data
const mockAccounts = [
  { id: 'MT5-8843201', type: 'Real', balance: 28400.5, equity: 29100.2, freeMargin: 24900, currency: 'USD' },
  { id: 'MT5-0099013', type: 'Demo', balance: 100000, equity: 102450, freeMargin: 102450, currency: 'USD' },
];

export function TradePanel({ product, onSettingsClick }: TradePanelProps) {
  const { tradeMode, defaultVolume, autoSLTP, defaultSLPoints, defaultTPPoints } = useTradeSettingsStore();
  const isProMode = tradeMode === 'pro';

  // State
  const [selectedAccount, setSelectedAccount] = useState(mockAccounts[0]);
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [volume, setVolume] = useState(defaultVolume);
  const [price, setPrice] = useState('');
  const [stopLoss, setStopLoss] = useState(autoSLTP ? String(defaultSLPoints) : '');
  const [takeProfit, setTakeProfit] = useState(autoSLTP ? String(defaultTPPoints) : '');
  const [expiration, setExpiration] = useState<ExpirationType>('gtc');
  const [trailingStop, setTrailingStop] = useState(false);
  const [trailingDistance, setTrailingDistance] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<'buy' | 'sell' | null>(null);

  // Calculate estimated values
  const calculations = useMemo(() => {
    const contractSize = product.contractSize || 100;
    const leverage = 100; // Default leverage
    const currentPrice = orderType === 'market' ? product.ask : parseFloat(price) || product.ask;

    const margin = (volume * contractSize * currentPrice) / leverage;
    const spreadCost = volume * contractSize * (product.spread * 0.01);

    return { margin, spreadCost };
  }, [volume, product, orderType, price]);

  // Handle order submission
  const handleOrder = useCallback((direction: 'buy' | 'sell') => {
    setPendingOrder(direction);
    setShowConfirm(true);
  }, []);

  const confirmOrder = useCallback(() => {
    if (!pendingOrder) return;

    console.log('Submitting order:', {
      symbol: product.symbol,
      direction: pendingOrder,
      orderType,
      volume,
      price: orderType === 'market' ? undefined : parseFloat(price),
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      trailingStop,
      trailingDistance: trailingStop ? parseFloat(trailingDistance) : undefined,
      expiration,
      account: selectedAccount.id,
    });

    setShowConfirm(false);
    setPendingOrder(null);
  }, [pendingOrder, product.symbol, orderType, volume, price, stopLoss, takeProfit, trailingStop, trailingDistance, expiration, selectedAccount.id]);

  // Get order type label
  const getOrderTypeLabel = (type: OrderType) => {
    const labels: Record<OrderType, string> = {
      market: '市价',
      limit: '限价',
      stop: '止损',
      stop_limit: '止损限价',
    };
    return labels[type];
  };

  // Get current price for display
  const getCurrentPrice = (direction: 'buy' | 'sell') => {
    if (orderType === 'market') {
      return direction === 'buy' ? product.ask : product.bid;
    }
    return parseFloat(price) || 0;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-slate-500" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">下单</h3>
        </div>
        <button
          onClick={onSettingsClick}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Account Selection */}
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">
            交易账户
          </label>
          <select
            value={selectedAccount.id}
            onChange={(e) => {
              const acc = mockAccounts.find((a) => a.id === e.target.value);
              if (acc) setSelectedAccount(acc);
            }}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
          >
            {mockAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.id} ({acc.type}) - ${acc.freeMargin.toFixed(2)} 可用
              </option>
            ))}
          </select>
        </div>

        {/* Order Type - Show all options in Pro mode, simplified in Beginner mode */}
        {isProMode ? (
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">
              订单类型
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['market', 'limit', 'stop', 'stop_limit'] as OrderType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={cn(
                    'px-3 py-2 text-xs font-medium rounded-lg border transition-colors',
                    orderType === type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  )}
                >
                  {getOrderTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              新手模式：使用市价单快速交易
            </p>
          </div>
        )}

        {/* Volume */}
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">
            交易手数
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value) || 0)}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg"
            />
            <select
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg"
            >
              <option value={0.01}>0.01</option>
              <option value={0.05}>0.05</option>
              <option value={0.1}>0.1</option>
              <option value={0.5}>0.5</option>
              <option value={1}>1.0</option>
              <option value={5}>5.0</option>
            </select>
          </div>
          {isProMode && (
            <p className="text-xs text-slate-400 mt-1">
              最小: {product.minVolume || 0.01} 最大: {product.maxVolume || 100}
            </p>
          )}
        </div>

        {/* Price Input for Limit/Stop orders */}
        {orderType !== 'market' && (
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">
              {orderType.includes('limit') ? '限价价格' : '触发价格'}
            </label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={`当前买价: ${product.ask}`}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg"
            />
          </div>
        )}

        {/* SL/TP */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">
              止损 (点)
            </label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="可选"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">
              止盈 (点)
            </label>
            <input
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="可选"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg"
            />
          </div>
        </div>

        {/* Advanced Options - Pro mode only */}
        {isProMode && (
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            >
              高级选项
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                {/* Expiration */}
                {orderType !== 'market' && (
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">
                      订单有效期
                    </label>
                    <select
                      value={expiration}
                      onChange={(e) => setExpiration(e.target.value as ExpirationType)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-lg"
                    >
                      <option value="gtc">GTC (永久有效)</option>
                      <option value="today">当日有效</option>
                      <option value="specify">指定时间</option>
                    </select>
                  </div>
                )}

                {/* Trailing Stop */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="trailingStop"
                      checked={trailingStop}
                      onChange={(e) => setTrailingStop(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    <label htmlFor="trailingStop" className="text-xs text-slate-700 dark:text-slate-300">
                      启用追踪止损
                    </label>
                  </div>
                  {trailingStop && (
                    <input
                      type="number"
                      value={trailingDistance}
                      onChange={(e) => setTrailingDistance(e.target.value)}
                      placeholder="追踪距离 (点)"
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-lg"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Margin Info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-2">
          <MarginCalculatorInline product={product} volume={volume} />
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">点差成本</span>
            <span className="text-slate-700 dark:text-slate-300">${calculations.spreadCost.toFixed(2)}</span>
          </div>
          {orderType !== 'market' && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">隔夜费</span>
              <span className="text-slate-700 dark:text-slate-300">
                多: {product.swapLong || 0} / 空: {product.swapShort || 0}
              </span>
            </div>
          )}
        </div>

        {/* Risk Warning */}
        {calculations.margin > selectedAccount.freeMargin * 0.2 && (
          <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              保证金占用超过可用资金的 20%，请注意风险控制
            </p>
          </div>
        )}

        {/* Buy/Sell Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOrder('buy')}
            className="py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors"
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>买入</span>
            </div>
            <div className="text-xs opacity-90 mt-0.5">
              {getCurrentPrice('buy').toFixed(product.digits || 2)}
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOrder('sell')}
            className="py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-semibold transition-colors"
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingDown className="w-4 h-4" />
              <span>卖出</span>
            </div>
            <div className="text-xs opacity-90 mt-0.5">
              {getCurrentPrice('sell').toFixed(product.digits || 2)}
            </div>
          </motion.button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && pendingOrder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-10"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full"
          >
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
              确认订单
            </h4>

            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">产品</span>
                <span className="font-medium">{product.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">方向</span>
                <span className={pendingOrder === 'buy' ? 'text-emerald-600' : 'text-rose-600'}>
                  {pendingOrder === 'buy' ? '买入' : '卖出'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">类型</span>
                <span>{getOrderTypeLabel(orderType)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">手数</span>
                <span>{volume}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">价格</span>
                <span>
                  {orderType === 'market'
                    ? getCurrentPrice(pendingOrder).toFixed(product.digits || 2)
                    : price || '市价'}
                </span>
              </div>
              {stopLoss && (
                <div className="flex justify-between">
                  <span className="text-slate-500">止损</span>
                  <span className="text-rose-600">{stopLoss} 点</span>
                </div>
              )}
              {takeProfit && (
                <div className="flex justify-between">
                  <span className="text-slate-500">止盈</span>
                  <span className="text-emerald-600">{takeProfit} 点</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">保证金</span>
                <span className="font-medium">${calculations.margin.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={confirmOrder}
                className={cn(
                  'flex-1 py-2 text-sm font-medium text-white rounded-lg',
                  pendingOrder === 'buy' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'
                )}
              >
                确认{pendingOrder === 'buy' ? '买入' : '卖出'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
