"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Key,
  BarChart3,
  Clock,
  Shield,
  AlertCircle,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/portal/widgets/PageHeader";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

// ─── Mock Data ─────────────────────────────────────────────
const accountData = {
  id: "MT5-8843201",
  type: "Real",
  server: "TradePass-Live",
  leverage: "1:100",
  currency: "USD",
  balance: 28400.5,
  equity: 29100.2,
  margin: 4520.8,
  freeMargin: 24579.4,
  marginLevel: 643.7,
  openPositions: 3,
  pendingOrders: 2,
  profit: 699.7,
  profitPercent: 2.46,
  createdAt: "Jan 15, 2025",
  lastLogin: "2 hours ago",
  status: "active",
};

const recentTrades = [
  { id: 1, symbol: "XAUUSD", type: "BUY", volume: 0.5, openPrice: 2320.5, currentPrice: 2334.5, profit: 700, time: "2h ago" },
  { id: 2, symbol: "EURUSD", type: "SELL", volume: 1.0, openPrice: 1.0920, currentPrice: 1.0882, profit: 380, time: "4h ago" },
  { id: 3, symbol: "GBPUSD", type: "BUY", volume: 0.3, openPrice: 1.2650, currentPrice: 1.2640, profit: -30, time: "6h ago" },
];

// ─── Components ────────────────────────────────────────────
function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: string;
  subValue?: string;
  icon: any;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon size={18} className={iconColor} />
        </div>
        <div>
          <p className="text-xs text-gray-400">{title}</p>
          <p className="text-lg font-bold text-gray-800">{value}</p>
          {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
        </div>
      </div>
    </div>
  );
}

function TradeRow({ trade }: { trade: (typeof recentTrades)[0] }) {
  const isProfit = trade.profit >= 0;
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded border",
            trade.type === "BUY"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          )}
        >
          {trade.type}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{trade.symbol}</p>
          <p className="text-xs text-gray-400">{trade.volume} lot</p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn("text-sm font-bold", isProfit ? "text-emerald-600" : "text-red-600")}>
          {isProfit ? "+" : ""}{formatCurrency(trade.profit)}
        </p>
        <p className="text-xs text-gray-400">{trade.time}</p>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function AccountDetailPage() {
  const params = useParams();
  const [copied, setCopied] = useState(false);

  const copyAccountId = () => {
    navigator.clipboard.writeText(accountData.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/portal/accounts/accounts"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Accounts
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-800">{accountData.id}</h1>
            <button
              onClick={copyAccountId}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {copied ? (
                <Check size={16} className="text-emerald-600" />
              ) : (
                <Copy size={16} className="text-gray-400" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-lg border",
                accountData.type === "Real"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-purple-50 text-purple-700 border-purple-200"
              )}
            >
              {accountData.type}
            </span>
            <span className="text-xs text-gray-400">{accountData.server}</span>
            <span className="text-xs text-gray-300">•</span>
            <span className="text-xs text-gray-400">{accountData.leverage}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs font-medium px-3 py-1.5 rounded-lg border",
              accountData.status === "active"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-gray-50 text-gray-600 border-gray-200"
            )}
          >
            {accountData.status === "active" ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Balance"
          value={formatCurrency(accountData.balance)}
          icon={Wallet}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Equity"
          value={formatCurrency(accountData.equity)}
          subValue={`+${formatPercent(accountData.profitPercent)}`}
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Margin"
          value={formatCurrency(accountData.margin)}
          icon={BarChart3}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Free Margin"
          value={formatCurrency(accountData.freeMargin)}
          icon={Wallet}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Actions & Info */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border-2 border-gray-200 p-5"
          >
            <h2 className="font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/portal/wallet/transfer">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">
                  <ArrowDownToLine size={18} className="text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Deposit to Account</span>
                  <ChevronRight size={16} className="ml-auto text-gray-400" />
                </div>
              </Link>
              <Link href="/portal/wallet/transfer">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                  <ArrowUpFromLine size={18} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Withdraw to Wallet</span>
                  <ChevronRight size={16} className="ml-auto text-gray-400" />
                </div>
              </Link>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                <Key size={18} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Reset Password</span>
                <ChevronRight size={16} className="ml-auto text-gray-400" />
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                <RefreshCw size={18} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Refresh Connection</span>
                <ChevronRight size={16} className="ml-auto text-gray-400" />
              </button>
            </div>
          </motion.div>

          {/* Account Info */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border-2 border-gray-200 p-5"
          >
            <h2 className="font-bold text-gray-800 mb-4">Account Info</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Margin Level</span>
                <span className="text-sm font-semibold text-emerald-600">
                  {formatPercent(accountData.marginLevel)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Open Positions</span>
                <span className="text-sm font-semibold text-gray-800">
                  {accountData.openPositions}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Pending Orders</span>
                <span className="text-sm font-semibold text-gray-800">
                  {accountData.pendingOrders}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Created</span>
                <span className="text-sm text-gray-600">{accountData.createdAt}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Last Login</span>
                <span className="text-sm text-gray-600">{accountData.lastLogin}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Recent Trades */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-2xl border-2 border-gray-200 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Open Positions</h2>
            <Link
              href="/portal/accounts/positions"
              className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
            >
              View All
            </Link>
          </div>
          <div>
            {recentTrades.map((trade) => (
              <TradeRow key={trade.id} trade={trade} />
            ))}
          </div>

          {/* MT5 Download */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                <BarChart3 size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">Trade on MT5</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Download MetaTrader 5 for desktop or mobile to start trading.
                </p>
                <div className="flex gap-2 mt-3">
                  <button className="text-xs font-semibold text-blue-600 bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                    Download MT5
                  </button>
                  <button className="text-xs font-semibold text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                    Server Info
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
