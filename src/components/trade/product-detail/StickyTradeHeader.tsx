'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Star, Bell, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TradingProduct } from '@/lib/trade/types';

interface StickyTradeHeaderProps {
  product: TradingProduct;
  onTrade: (direction: 'buy' | 'sell') => void;
  onFavoriteToggle: () => void;
  onAlertClick?: () => void;
  onShareClick?: () => void;
}

// 价格变动方向类型
type PriceDirection = 'up' | 'down' | 'neutral';

export function StickyTradeHeader({
  product,
  onTrade,
  onFavoriteToggle,
  onAlertClick,
  onShareClick,
}: StickyTradeHeaderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [priceDirection, setPriceDirection] = useState<PriceDirection>('neutral');
  const [prevPrice, setPrevPrice] = useState(product.bid);
  const [isPulsing, setIsPulsing] = useState(false);

  const isPositive = product.changePercent >= 0;

  // 监听滚动位置
  useEffect(() => {
    const handleScroll = () => {
      // 滚动超过 200px 显示吸顶 Header
      setIsVisible(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 监听价格变化，触发脉冲动画
  useEffect(() => {
    if (product.bid !== prevPrice) {
      const direction = product.bid > prevPrice ? 'up' : 'down';
      setPriceDirection(direction);
      setIsPulsing(true);
      setPrevPrice(product.bid);

      // 300ms 后移除脉冲效果
      const timer = setTimeout(() => {
        setIsPulsing(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [product.bid, prevPrice]);

  const handleTrade = useCallback((direction: 'buy' | 'sell') => {
    onTrade(direction);
  }, [onTrade]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'fixed top-0 left-0 right-0 z-50',
            'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md',
            'border-b border-slate-200 dark:border-slate-700',
            'shadow-sm'
          )}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              {/* 左侧：产品信息 */}
              <div className="flex items-center gap-4">
                {/* 收藏按钮 */}
                <button
                  onClick={onFavoriteToggle}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    product.isFavorite
                      ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  )}
                >
                  <Star className={cn('w-4 h-4', product.isFavorite && 'fill-current')} />
                </button>

                {/* Symbol 和名称 */}
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {product.symbol}
                  </h2>
                  <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                    {product.shortName}
                  </span>
                </div>

                {/* 价格 */}
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-lg font-bold tabular-nums transition-colors duration-300',
                      isPulsing && priceDirection === 'up' && 'text-emerald-600',
                      isPulsing && priceDirection === 'down' && 'text-rose-600',
                      !isPulsing && 'text-slate-900 dark:text-slate-100'
                    )}
                  >
                    {product.bid.toFixed(product.digits || 2)}
                  </span>

                  {/* 涨跌幅 */}
                  <span
                    className={cn(
                      'flex items-center gap-0.5 text-xs font-medium',
                      isPositive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {isPositive ? '+' : ''}
                    {product.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* 右侧：操作按钮 */}
              <div className="flex items-center gap-2">
                {/* 价格提醒 */}
                <button
                  onClick={onAlertClick}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="价格提醒"
                >
                  <Bell className="w-4 h-4" />
                </button>

                {/* 分享 */}
                <button
                  onClick={onShareClick}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors hidden sm:flex"
                  title="分享"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {/* 分隔线 */}
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

                {/* 买卖按钮 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTrade('sell')}
                    className={cn(
                      'px-3 py-1.5 text-sm font-semibold rounded-lg',
                      'bg-rose-500 hover:bg-rose-600 text-white',
                      'transition-colors shadow-sm'
                    )}
                  >
                    卖出
                  </button>
                  <button
                    onClick={() => handleTrade('buy')}
                    className={cn(
                      'px-3 py-1.5 text-sm font-semibold rounded-lg',
                      'bg-emerald-500 hover:bg-emerald-600 text-white',
                      'transition-colors shadow-sm'
                    )}
                  >
                    买入
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 价格脉冲动画背景 */}
          {isPulsing && (
            <motion.div
              initial={{ opacity: 0.3 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'absolute inset-0 pointer-events-none',
                priceDirection === 'up' && 'bg-emerald-500/10',
                priceDirection === 'down' && 'bg-rose-500/10'
              )}
            />
          )}
        </motion.header>
      )}
    </AnimatePresence>
  );
}
