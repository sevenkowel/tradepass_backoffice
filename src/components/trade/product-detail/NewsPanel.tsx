'use client';

import { Newspaper, ExternalLink, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarketNews } from '@/lib/trade/types';

interface NewsPanelProps {
  news: MarketNews[];
  isLoading?: boolean;
}

const sentimentLabels = {
  bullish: '利好',
  bearish: '利空',
  neutral: '中性',
};

const sentimentColors = {
  bullish: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
  bearish: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20',
  neutral: 'text-slate-500 bg-slate-100 dark:bg-slate-700',
};

export function NewsPanel({ news, isLoading }: NewsPanelProps) {
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse flex space-x-4">
          <div className="h-4 w-4 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">暂无相关资讯</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {news.map((item) => (
        <div
          key={item.id}
          className="group p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer">
                {item.title}
              </h4>
              {item.summary && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {item.summary}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-slate-400">{item.source}</span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  {formatTime(item.publishedAt)}
                </span>
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded',
                    sentimentColors[item.sentiment]
                  )}
                >
                  {sentimentLabels[item.sentiment]}
                </span>
              </div>
            </div>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
