"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Activity,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
// import { format } from "~/utils/format";

// Types
interface Order {
  id: string;
  symbol: string;
  type: "buy" | "sell";
  volume: number;
  price: number;
  profit: number;
  user: string;
  time: string;
}

interface RealTimeMonitorProps {
  className?: string;
}

// Mock real-time orders
const generateOrder = (): Order => {
  const symbols = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD", "NAS100"];
  const types: ("buy" | "sell")[] = ["buy", "sell"];
  const users = [
    "user_2847",
    "user_1923",
    "user_3056",
    "user_4182",
    "user_5291",
    "user_6147",
    "user_7284",
    "user_8392",
  ];

  return {
    id: `ORD${Date.now().toString(36).toUpperCase()}`,
    symbol: symbols[Math.floor(Math.random() * symbols.length)],
    type: types[Math.floor(Math.random() * types.length)],
    volume: Math.floor(Math.random() * 10 + 1) * 0.1,
    price: parseFloat((Math.random() * 2000 + 1000).toFixed(2)),
    profit: parseFloat((Math.random() * 500 - 100).toFixed(2)),
    user: users[Math.floor(Math.random() * users.length)],
    time: new Date().toLocaleTimeString("en-US", { hour12: false }),
  };
};

export function RealTimeMonitor({ className = "" }: RealTimeMonitorProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // Initialize with some orders
  useEffect(() => {
    const initialOrders = Array.from({ length: 8 }, () => generateOrder());
    setOrders(initialOrders);
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const newOrder = generateOrder();
      setOrders((prev) => [newOrder, ...prev.slice(0, 19)]);
    }, 2000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const stats = {
    totalOrders: orders.length,
    buyOrders: orders.filter((o) => o.type === "buy").length,
    sellOrders: orders.filter((o) => o.type === "sell").length,
    totalVolume: orders.reduce((acc, o) => acc + o.volume, 0),
  };

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">
            实时订单流
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />
              {stats.buyOrders} 买入
            </span>
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <ArrowDownRight className="w-3 h-3" />
              {stats.sellOrders} 卖出
            </span>
          </div>

          {/* Pause/Resume */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 text-slate-500 ${
                isPaused ? "" : "animate-spin"
              }`}
              style={{
                animationDuration: isPaused ? "0s" : "3s",
              }}
            />
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-6 gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 text-xs font-medium text-slate-500 dark:text-slate-400">
        <div>时间</div>
        <div>订单号</div>
        <div>品种</div>
        <div className="text-center">类型</div>
        <div className="text-right">数量</div>
        <div className="text-right">盈亏</div>
      </div>

      {/* Orders List */}
      <div className="max-h-80 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className={`grid grid-cols-6 gap-2 px-4 py-2.5 text-xs border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                index === 0 ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""
              }`}
            >
              {/* Time */}
              <div className="flex items-center text-slate-500 dark:text-slate-400">
                {order.time}
                {index === 0 && (
                  <span className="ml-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                )}
              </div>

              {/* Order ID */}
              <div className="flex items-center font-mono text-slate-600 dark:text-slate-300">
                {order.id.slice(0, 12)}...
              </div>

              {/* Symbol */}
              <div className="flex items-center font-medium text-slate-900 dark:text-white">
                {order.symbol}
              </div>

              {/* Type */}
              <div className="flex justify-center">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    order.type === "buy"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {order.type === "buy" ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {order.type === "buy" ? "买入" : "卖出"}
                </span>
              </div>

              {/* Volume */}
              <div className="flex items-center justify-end text-slate-700 dark:text-slate-300">
                {order.volume.toFixed(2)}
              </div>

              {/* Profit */}
              <div
                className={`flex items-center justify-end font-medium ${
                  Number(order.profit) >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {Number(order.profit) >= 0 ? "+" : ""}
                ${order.profit}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Activity className="w-8 h-8 mb-2 opacity-50" />
            <span>暂无订单数据</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400">
        <span>共 {stats.totalOrders} 笔订单</span>
        <span>总成交量: {stats.totalVolume.toFixed(2)} lots</span>
      </div>
    </div>
  );
}
