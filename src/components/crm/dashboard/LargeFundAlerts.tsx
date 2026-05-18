"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
} from "lucide-react";

// Types
interface LargeFund {
  id: string;
  type: "deposit" | "withdrawal";
  user: string;
  userName: string;
  amount: number;
  channel: string;
  time: string;
  status: "pending" | "approved" | "processing";
}

interface LargeFundAlertsProps {
  className?: string;
  threshold?: number;
  funds?: LargeFund[];
}

const defaultFunds: LargeFund[] = [
  {
    id: "TXN001",
    type: "deposit",
    user: "user_4827",
    userName: "Zhang Wei",
    amount: 125000,
    channel: "Wire Transfer",
    time: "3分钟前",
    status: "pending",
  },
  {
    id: "TXN002",
    type: "withdrawal",
    user: "user_3156",
    userName: "John Smith",
    amount: 78500,
    channel: "Crypto",
    time: "8分钟前",
    status: "pending",
  },
  {
    id: "TXN003",
    type: "deposit",
    user: "user_7291",
    userName: "Emma Wilson",
    amount: 95000,
    channel: "Bank Card",
    time: "15分钟前",
    status: "processing",
  },
  {
    id: "TXN004",
    type: "withdrawal",
    user: "user_1847",
    userName: "David Chen",
    amount: 45000,
    channel: "Wire Transfer",
    time: "22分钟前",
    status: "approved",
  },
  {
    id: "TXN005",
    type: "deposit",
    user: "user_5293",
    userName: "Sarah Johnson",
    amount: 68000,
    channel: "E-wallet",
    time: "28分钟前",
    status: "approved",
  },
];

export function LargeFundAlerts({
  className = "",
  threshold = 10000,
  funds = defaultFunds,
}: LargeFundAlertsProps) {
  const [filter, setFilter] = useState<"all" | "deposit" | "withdrawal">("all");

  const filteredFunds = funds.filter((f) => {
    if (f.amount < threshold) return false;
    if (filter === "all") return true;
    return f.type === filter;
  });

  const stats = {
    total: filteredFunds.length,
    deposits: filteredFunds.filter((f) => f.type === "deposit").length,
    withdrawals: filteredFunds.filter((f) => f.type === "withdrawal").length,
    totalAmount: filteredFunds.reduce((acc, f) => acc + f.amount, 0),
  };

  const statusConfig = {
    pending: {
      label: "待审核",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
    processing: {
      label: "处理中",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    approved: {
      label: "已批准",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
  };

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white">
            大额资金
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            &gt;${threshold.toLocaleString()}
          </span>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1">
          {(["all", "deposit", "withdrawal"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                filter === type
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {type === "all" ? "全部" : type === "deposit" ? "入金" : "出金"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-200 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-700">
        <div className="px-4 py-3 bg-white dark:bg-slate-800 text-center">
          <div className="text-lg font-semibold text-slate-900 dark:text-white">
            {stats.total}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            总笔数
          </div>
        </div>
        <div className="px-4 py-3 bg-white dark:bg-slate-800 text-center">
          <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            {stats.deposits}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            入金
          </div>
        </div>
        <div className="px-4 py-3 bg-white dark:bg-slate-800 text-center">
          <div className="text-lg font-semibold text-red-600 dark:text-red-400">
            {stats.withdrawals}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            出金
          </div>
        </div>
        <div className="px-4 py-3 bg-white dark:bg-slate-800 text-center">
          <div className="text-lg font-semibold text-slate-900 dark:text-white">
            ${(stats.totalAmount / 1000).toFixed(0)}K
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            总金额
          </div>
        </div>
      </div>

      {/* Fund List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700/50 max-h-64 overflow-y-auto">
        {filteredFunds.map((fund, index) => {
          const status = statusConfig[fund.status];

          return (
            <motion.div
              key={fund.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                  fund.type === "deposit"
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {fund.type === "deposit" ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {fund.userName}
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {fund.user}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  <span>{fund.channel}</span>
                  <span>•</span>
                  <span>{fund.time}</span>
                </div>
              </div>

              {/* Amount & Status */}
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-semibold ${
                    fund.type === "deposit"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {fund.type === "deposit" ? "+" : "-"}$
                  {fund.amount.toLocaleString()}
                </span>
                <span
                  className={`px-2 py-0.5 ${status.bg} ${status.color} rounded text-xs font-medium`}
                >
                  {status.label}
                </span>
              </div>
            </motion.div>
          );
        })}

        {filteredFunds.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Wallet className="w-8 h-8 mb-2 opacity-50" />
            <span>暂无大额资金记录</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
        <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          查看全部资金记录 →
        </button>
      </div>
    </div>
  );
}
