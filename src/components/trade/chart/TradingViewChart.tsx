'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChartTimeframe } from '@/lib/trade/types';
import { TimeframeSelector } from './TimeframeSelector';

interface TradingViewChartProps {
  symbol: string;
  height?: number;
}

const timeframes: { value: ChartTimeframe; label: string }[] = [
  { value: '1m', label: '1分' },
  { value: '5m', label: '5分' },
  { value: '15m', label: '15分' },
  { value: '30m', label: '30分' },
  { value: '1h', label: '1小时' },
  { value: '4h', label: '4小时' },
  { value: '1d', label: '日线' },
  { value: '1w', label: '周线' },
];

export function TradingViewChart({ symbol, height = 400 }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTimeframe, setActiveTimeframe] = useState<ChartTimeframe>('1h');
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 将symbol转换为TradingView格式
  const getTradingViewSymbol = (sym: string) => {
    const mapping: Record<string, string> = {
      'XAUUSD': 'OANDA:XAUUSD',
      'XAGUSD': 'OANDA:XAGUSD',
      'USOIL': 'TVC:USOIL',
      'UKOIL': 'TVC:UKOIL',
      'EURUSD': 'OANDA:EURUSD',
      'GBPUSD': 'OANDA:GBPUSD',
      'USDJPY': 'OANDA:USDJPY',
      'AUDUSD': 'OANDA:AUDUSD',
      'USDCAD': 'OANDA:USDCAD',
      'US30': 'TVC:DJI',
      'SPX500': 'TVC:SPX',
      'NAS100': 'TVC:IXIC',
      'GER40': 'XETR:DAX',
    };
    return mapping[sym] || `OANDA:${sym}`;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    setIsLoading(true);

    // 清理之前的widget
    containerRef.current.innerHTML = '';

    // 创建TradingView widget
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== 'undefined' && containerRef.current) {
        new window.TradingView.widget({
          container_id: containerRef.current.id,
          symbol: getTradingViewSymbol(symbol),
          interval: activeTimeframe,
          timezone: 'Asia/Shanghai',
          theme: 'dark',
          style: '1',
          locale: 'zh_CN',
          toolbar_bg: '#1a1d23',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          height: isFullscreen ? window.innerHeight - 100 : height,
          studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies'],
          show_popup_button: true,
          popup_width: '1000',
          popup_height: '650',
          autosize: false,
          loading_screen: { backgroundColor: '#0f1115' },
        });
        setIsLoading(false);
      }
    };

    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [symbol, activeTimeframe, height, isFullscreen]);

  return (
    <div className="relative">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <TimeframeSelector
          timeframes={timeframes}
          activeTimeframe={activeTimeframe}
          onTimeframeChange={setActiveTimeframe}
        />
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* 图表容器 */}
      <div
        ref={containerRef}
        id={`tradingview-chart-${symbol}`}
        style={{ height: isFullscreen ? window.innerHeight - 100 : height }}
        className={cn(
          'bg-slate-900',
          isFullscreen && 'fixed inset-0 z-50'
        )}
      />

      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-slate-400">加载图表...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// 添加TradingView类型声明
declare global {
  interface Window {
    TradingView: {
      widget: new (config: Record<string, unknown>) => void;
    };
  }
}
