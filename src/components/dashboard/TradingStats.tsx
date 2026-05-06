"use client";

import { TrendingUp, TrendingDown, BarChart3, Target, Calendar } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

interface TradingStatsData {
  pnl: number;
  volume: number;
  winRate: number;
  trades: number;
}

const mockStats: TradingStatsData = {
  pnl: 125.5,
  volume: 2.5,
  winRate: 65,
  trades: 12,
};

export function TradingStats() {
  const isProfit = mockStats.pnl >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 h-full"
    >
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
            <BarChart3 size={18} className="text-white" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">今日交易</h3>
        </div>
        <Link
          href="/portal/accounts/history"
          className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
        >
          历史记录
        </Link>
      </div>

      {/* 盈亏大数字 */}
      <div className="mb-4 p-4 rounded-xl bg-slate-50">
        <p className="text-xs text-slate-500 mb-1">今日盈亏</p>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${isProfit ? "text-emerald-600" : "text-rose-600"}`}>
            {isProfit ? "+" : ""}{formatCurrency(mockStats.pnl, "USD")}
          </span>
          {isProfit ? (
            <TrendingUp size={20} className="text-emerald-500" />
          ) : (
            <TrendingDown size={20} className="text-rose-500" />
          )}
        </div>
      </div>

      {/* 统计网格 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-xl bg-slate-50">
          <p className="text-xs text-slate-500 mb-1">交易量</p>
          <p className="text-lg font-semibold text-slate-900">{mockStats.volume}<span className="text-xs font-normal text-slate-400">手</span></p>
        </div>
        <div className="text-center p-3 rounded-xl bg-slate-50">
          <p className="text-xs text-slate-500 mb-1">胜率</p>
          <p className="text-lg font-semibold text-slate-900">{mockStats.winRate}<span className="text-xs font-normal text-slate-400">%</span></p>
        </div>
        <div className="text-center p-3 rounded-xl bg-slate-50">
          <p className="text-xs text-slate-500 mb-1">交易笔数</p>
          <p className="text-lg font-semibold text-slate-900">{mockStats.trades}</p>
        </div>
      </div>
    </motion.div>
  );
}
