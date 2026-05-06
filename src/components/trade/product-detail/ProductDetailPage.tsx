'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduct, useProductDetail } from '@/lib/trade/hooks/useMarketData';
import { useNews } from '@/lib/trade/hooks/useMarketData';
import { useTradeSettingsStore } from '@/lib/trade/store/tradeSettingsStore';
import { ProductHeader } from './ProductHeader';
import { StickyTradeHeader } from './StickyTradeHeader';
import { ExpandableStatsBar } from './ExpandableStatsBar';
import { FundamentalDrivers } from './FundamentalDrivers';
import { SeasonalPatterns } from './SeasonalPatterns';
import { ProductSpecifications } from './ProductSpecifications';
import { AISignalCard } from './AISignalCard';
import { SentimentCard } from './SentimentCard';
import { TechnicalCard } from './TechnicalCard';
import { FundamentalCard } from './FundamentalCard';
import { NewsPanel } from './NewsPanel';
import { TradePanel } from '../trade-panel/TradePanel';
import { TradingViewChart } from '../chart/TradingViewChart';
import { TradeSettingsPanel } from '../settings/TradeSettingsPanel';
import { TradeOnboardingModal } from '../onboarding/TradeOnboardingModal';
import { EconomicCalendar } from '../calendar/EconomicCalendar';
import { MarginCalculator } from '../calculator/MarginCalculator';

interface ProductDetailPageProps {
  symbol: string;
}

export function ProductDetailPage({ symbol }: ProductDetailPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'news' | 'signals' | 'calendar' | 'specs' | 'drivers' | 'seasonal'>('overview');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // 获取用户设置
  const { hasSeenOnboarding, tradeMode, aiSignalEnabled, aiSignalTermsAccepted } = useTradeSettingsStore();

  // 首次访问检查
  useEffect(() => {
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, [hasSeenOnboarding]);

  // 获取产品数据
  const {
    product,
    isLoading: isProductLoading,
    toggleFavorite,
  } = useProduct(symbol, { autoRefresh: true });

  // 获取产品详情
  const { detail, isLoading: isDetailLoading } = useProductDetail(symbol);

  // 获取资讯
  const { news, isLoading: isNewsLoading } = useNews({ symbol, limit: 10 });

  // 处理返回
  const handleBack = useCallback(() => {
    router.push('/portal/markets');
  }, [router]);

  // 处理交易
  const handleTrade = useCallback(
    (direction: 'buy' | 'sell') => {
      // 实际项目中这里可以打开交易弹窗或跳转MT5
      console.log(`Trade ${direction} ${symbol}`);
    },
    [symbol]
  );

  // 检查是否显示 AI 信号
  const canShowAiSignal = aiSignalEnabled && aiSignalTermsAccepted;

  if (isProductLoading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-slate-500">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900">
      {/* 吸顶交易栏 - 滚动时显示 */}
      <StickyTradeHeader
        product={product}
        onTrade={handleTrade}
        onFavoriteToggle={toggleFavorite}
        onAlertClick={() => console.log('Price alert clicked')}
        onShareClick={() => console.log('Share clicked')}
      />

      {/* 产品Header */}
      <ProductHeader
        product={product}
        onBack={handleBack}
        onFavoriteToggle={toggleFavorite}
        onTrade={handleTrade}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      {/* 风险提示 */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>
              风险提示：差价合约（CFD）是杠杆产品，可能导致本金亏损。请确保您了解相关风险。
            </span>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* K线图 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <TradingViewChart symbol={symbol} height={400} />
            </div>

            {/* 可展开统计条 */}
            <ExpandableStatsBar product={product} detail={detail || undefined} />

            {/* AI洞察卡片 - 仅在启用时显示 */}
            {canShowAiSignal && detail?.aiSignals && detail.aiSignals[0] && (
              <AISignalCard
                signal={detail.aiSignals[0]}
                onTrade={() => handleTrade(detail.aiSignals[0].direction as 'buy' | 'sell')}
              />
            )}

            {/* 分析卡片网格 - 专业模式显示更多 */}
            <div className={cn(
              "grid gap-4",
              tradeMode === 'pro' ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
            )}>
              {detail?.sentiment && <SentimentCard sentiment={detail.sentiment} />}
              {detail?.technicalAnalysis && (
                <TechnicalCard analysis={detail.technicalAnalysis} />
              )}
              {tradeMode === 'pro' && detail?.fundamentalAnalysis && (
                <FundamentalCard analysis={detail.fundamentalAnalysis} />
              )}
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              {/* Tab 头部 */}
              <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                {[
                  { id: 'overview', label: '概览' },
                  { id: 'drivers', label: '基本面' },
                  { id: 'seasonal', label: '季节性' },
                  { id: 'news', label: '资讯' },
                  { id: 'signals', label: 'AI信号' },
                  { id: 'calendar', label: '财经日历' },
                  { id: 'specs', label: '产品规格' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={cn(
                      'px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab 内容 */}
              <div className="p-4">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* 快速规格概览 */}
                    {detail && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <p className="text-xs text-slate-500 dark:text-slate-400">合约大小</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {detail.contractSize}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <p className="text-xs text-slate-500 dark:text-slate-400">最小交易量</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {detail.minVolume} 手
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <p className="text-xs text-slate-500 dark:text-slate-400">保证金要求</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {detail.marginRequirement}%
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <p className="text-xs text-slate-500 dark:text-slate-400">交易时间</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {detail.tradingHours}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 隔夜利息 */}
                    {detail && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                          隔夜利息
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-500">多头持仓</span>
                            <span className={cn(
                              "text-sm font-medium",
                              detail.swapLong >= 0 ? "text-emerald-600" : "text-rose-600"
                            )}>
                              {detail.swapLong > 0 ? '+' : ''}{detail.swapLong}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-500">空头持仓</span>
                            <span className={cn(
                              "text-sm font-medium",
                              detail.swapShort >= 0 ? "text-emerald-600" : "text-rose-600"
                            )}>
                              {detail.swapShort > 0 ? '+' : ''}{detail.swapShort}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 产品描述 */}
                    {detail?.description && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                          产品简介
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {detail.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'drivers' && (
                  <div>
                    {detail?.fundamentalDrivers && detail.fundamentalDrivers.length > 0 ? (
                      <FundamentalDrivers drivers={detail.fundamentalDrivers} />
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h4 className="text-base font-medium text-slate-900 dark:text-slate-100 mb-2">
                          暂无基本面数据
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          该产品的基本面驱动因素分析正在准备中
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'seasonal' && (
                  <div>
                    {detail?.seasonalData ? (
                      <SeasonalPatterns data={detail.seasonalData} />
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h4 className="text-base font-medium text-slate-900 dark:text-slate-100 mb-2">
                          暂无季节性数据
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          该产品的季节性规律分析正在准备中
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'news' && (
                  <NewsPanel news={news} isLoading={isNewsLoading} />
                )}

                {activeTab === 'signals' && (
                  <div className="space-y-3">
                    {!canShowAiSignal ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <h4 className="text-base font-medium text-slate-900 dark:text-slate-100 mb-2">
                          AI 信号未启用
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">
                          启用 AI 交易信号，获取智能分析和交易建议
                        </p>
                        <button
                          onClick={() => setIsSettingsOpen(true)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          前往设置启用
                        </button>
                      </div>
                    ) : detail?.aiSignals && detail.aiSignals.length > 0 ? (
                      detail.aiSignals.map((signal) => (
                        <AISignalCard key={signal.id} signal={signal} />
                      ))
                    ) : (
                      <p className="text-center text-slate-500 py-8">
                        暂无活跃信号
                      </p>
                    )}
                  </div>
                )}

                {activeTab === 'calendar' && (
                  <EconomicCalendar product={product} />
                )}

                {activeTab === 'specs' && detail && (
                  <ProductSpecifications detail={detail} />
                )}
              </div>
            </div>
          </div>

          {/* 右侧边栏 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 交易面板 */}
            <TradePanel
              product={product}
              onSettingsClick={() => setIsSettingsOpen(true)}
            />

            {/* 保证金计算器 - 专业模式显示完整版 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <MarginCalculator product={product} />
            </div>

            {/* 财经日历 - 侧边栏紧凑版 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <EconomicCalendar product={product} compact />
            </div>
          </div>
        </div>
      </div>

      {/* 设置面板 */}
      <TradeSettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* 首次引导弹窗 */}
      <TradeOnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
}
