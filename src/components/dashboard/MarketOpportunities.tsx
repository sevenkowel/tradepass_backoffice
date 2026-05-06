"use client";

import { TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Signal {
  id: string;
  symbol: string;
  direction: "buy" | "sell";
  entry: number;
  tp: number;
  sl: number;
  confidence: number;
}

const mockSignals: Signal[] = [
  {
    id: "1",
    symbol: "EURUSD",
    direction: "buy",
    entry: 1.082,
    tp: 1.09,
    sl: 1.078,
    confidence: 82,
  },
  {
    id: "2",
    symbol: "XAUUSD",
    direction: "sell",
    entry: 2035.5,
    tp: 2020.0,
    sl: 2045.0,
    confidence: 76,
  },
];

export function MarketOpportunities() {
  return (
    <section className="py-6 border-b border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">市场机会</h3>
        <Link
          href="/portal/ai-signals"
          className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-0.5"
        >
          全部信号
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="space-y-3">
        {mockSignals.map((signal) => (
          <div
            key={signal.id}
            className="p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {signal.symbol}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    signal.direction === "buy"
                      ? "text-green-700 bg-green-50"
                      : "text-red-700 bg-red-50"
                  }`}
                >
                  {signal.direction === "buy" ? "买入" : "卖出"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <TrendingUp size={12} />
                <span>置信度 {signal.confidence}%</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs mb-4">
              <div>
                <p className="text-gray-400 mb-0.5">入场</p>
                <p className="text-gray-900 font-medium">{signal.entry}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">止盈</p>
                <p className="text-green-600 font-medium">{signal.tp}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">止损</p>
                <p className="text-red-600 font-medium">{signal.sl}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/portal/ai-signals/${signal.id}`}
                className="flex-1 text-center px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded hover:bg-gray-50"
              >
                查看详情
              </Link>
              <Link
                href="/portal/accounts"
                className="flex-1 text-center px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded hover:bg-gray-800"
              >
                立即交易
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
