'use client';

import { useState, useMemo } from 'react';
import { Calendar, Clock, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TradingProduct } from '@/lib/trade/types';

interface EconomicEvent {
  id: string;
  time: string;
  country: string;
  name: string;
  impact: 'high' | 'medium' | 'low';
  actual?: string;
  forecast?: string;
  previous?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
}

interface EconomicCalendarProps {
  product: TradingProduct;
  compact?: boolean;
}

// Mock data - replace with real API
const mockEvents: EconomicEvent[] = [
  {
    id: '1',
    time: '14:30',
    country: 'US',
    name: '非农就业人口',
    impact: 'high',
    actual: '180K',
    forecast: '175K',
    previous: '165K',
    sentiment: 'bullish',
  },
  {
    id: '2',
    time: '20:00',
    country: 'US',
    name: '美联储利率决议',
    impact: 'high',
    forecast: '5.25%',
    previous: '5.50%',
  },
  {
    id: '3',
    time: '次日 02:00',
    country: 'US',
    name: 'API原油库存',
    impact: 'medium',
    previous: '-2.5M',
  },
  {
    id: '4',
    time: '20:30',
    country: 'US',
    name: 'CPI月率',
    impact: 'high',
    forecast: '0.3%',
    previous: '0.2%',
  },
];

export function EconomicCalendar({ product, compact = false }: EconomicCalendarProps) {
  const [expanded, setExpanded] = useState(false);

  // Filter events relevant to the product
  const relevantEvents = useMemo(() => {
    // In real implementation, filter based on product correlations
    // For now, show all events
    return mockEvents;
  }, [product]);

  const displayEvents = compact && !expanded ? relevantEvents.slice(0, 3) : relevantEvents;

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              财经日历
            </h4>
          </div>
          <span className="text-xs text-slate-400">今日</span>
        </div>

        <div className="space-y-2">
          {displayEvents.map((event) => (
            <CompactEventItem key={event.id} event={event} />
          ))}
        </div>

        {relevantEvents.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 text-center py-1"
          >
            {expanded ? '收起' : `查看全部 ${relevantEvents.length} 个事件`}
          </button>
        )}
      </div>
    );
  }

  // Full version for tab view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          财经日历
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
            高影响
          </span>
          <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
            中影响
          </span>
          <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">
            低影响
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">时间</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">国家</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">事件</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">影响</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-slate-500">实际</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-slate-500">预测</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-slate-500">前值</th>
            </tr>
          </thead>
          <tbody>
            {relevantEvents.map((event) => (
              <tr
                key={event.id}
                className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <td className="py-3 px-3 text-sm text-slate-900 dark:text-slate-100">
                  {event.time}
                </td>
                <td className="py-3 px-3">
                  <span className="text-lg">{getCountryFlag(event.country)}</span>
                </td>
                <td className="py-3 px-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {event.name}
                    </p>
                    {event.sentiment && (
                      <span
                        className={cn(
                          'text-xs',
                          event.sentiment === 'bullish'
                            ? 'text-emerald-600'
                            : event.sentiment === 'bearish'
                            ? 'text-red-600'
                            : 'text-slate-500'
                        )}
                      >
                        {event.sentiment === 'bullish'
                          ? '利多'
                          : event.sentiment === 'bearish'
                          ? '利空'
                          : '中性'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <ImpactBadge impact={event.impact} />
                </td>
                <td className="py-3 px-3 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
                  {event.actual || '-'}
                </td>
                <td className="py-3 px-3 text-right text-sm text-slate-500">
                  {event.forecast || '-'}
                </td>
                <td className="py-3 px-3 text-right text-sm text-slate-500">
                  {event.previous || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <p>数据来源: Investing.com</p>
        <a
          href="#"
          className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
        >
          查看完整日历
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

// Compact event item for sidebar
function CompactEventItem({ event }: { event: EconomicEvent }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
      <div className="text-center min-w-[50px]">
        <p className="text-xs font-medium text-slate-900 dark:text-slate-100">{event.time}</p>
        <p className="text-xs text-slate-400">{event.country}</p>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900 dark:text-slate-100 truncate">{event.name}</p>
        <div className="flex items-center gap-2">
          <ImpactBadge impact={event.impact} size="sm" />
          {event.sentiment && (
            <span
              className={cn(
                'text-xs',
                event.sentiment === 'bullish'
                  ? 'text-emerald-600'
                  : event.sentiment === 'bearish'
                  ? 'text-red-600'
                  : 'text-slate-500'
              )}
            >
              {event.sentiment === 'bullish' ? '利多' : event.sentiment === 'bearish' ? '利空' : '中性'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Impact badge component
function ImpactBadge({
  impact,
  size = 'md',
}: {
  impact: 'high' | 'medium' | 'low';
  size?: 'sm' | 'md';
}) {
  const classes = {
    high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    low: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  };

  const labels = {
    high: '高',
    medium: '中',
    low: '低',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded font-medium',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        classes[impact]
      )}
    >
      {labels[impact]}
    </span>
  );
}

// Helper function to get country flag emoji
function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    US: '🇺🇸',
    EU: '🇪🇺',
    UK: '🇬🇧',
    JP: '🇯🇵',
    CN: '🇨🇳',
    AU: '🇦🇺',
    CA: '🇨🇦',
    CH: '🇨🇭',
  };
  return flags[country] || '🌍';
}
