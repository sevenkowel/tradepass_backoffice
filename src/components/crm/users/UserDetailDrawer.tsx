"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  CreditCard,
  Wallet,
  BarChart3,
  Link2,
  MoreHorizontal,
  Ban,
  CheckCircle,
  Edit,
  Download,
  ExternalLink,
} from "lucide-react";
import type { BackofficeUser, KYCStatus } from "@/types/backoffice/user";

// Types
interface UserDetailDrawerProps {
  user: BackofficeUser | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "overview" | "accounts" | "funds" | "trades" | "kyc" | "ib";

const tabs: { key: TabType; label: string }[] = [
  { key: "overview", label: "概览" },
  { key: "accounts", label: "账户" },
  { key: "funds", label: "资金" },
  { key: "trades", label: "交易" },
  { key: "kyc", label: "KYC" },
  { key: "ib", label: "IB" },
];

const kycStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "待审核", color: "text-amber-600", bg: "bg-amber-100" },
  verified: { label: "已认证", color: "text-emerald-600", bg: "bg-emerald-100" },
  rejected: { label: "已拒绝", color: "text-red-600", bg: "bg-red-100" },
  not_submitted: { label: "未提交", color: "text-slate-500", bg: "bg-slate-100" },
  not_started: { label: "未开始", color: "text-slate-500", bg: "bg-slate-100" },
};

export function UserDetailDrawer({ user, isOpen, onClose }: UserDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isFrozen, setIsFrozen] = useState(false);

  if (!user) return null;

  const kycConfig = kycStatusConfig[user.kycStatus] || { label: "未知", color: "text-slate-500", bg: "bg-slate-100" };

  // Mock data for tabs
  const mockAccounts = [
    { id: "MT001", type: "MT5 Standard", balance: 12500.50, equity: 12847.30, margin: 625.00, marginLevel: "205.6%" },
    { id: "MT002", type: "MT5 ECN", balance: 8340.20, equity: 8150.80, margin: 400.00, marginLevel: "203.7%" },
  ];

  const mockFunds = [
    { type: "入金", amount: 15000, method: "Wire Transfer", time: "2024-03-01 10:30" },
    { type: "出金", amount: -2500, method: "Bank Card", time: "2024-02-28 15:45" },
    { type: "入金", amount: 5000, method: "Crypto", time: "2024-02-25 09:15" },
  ];

  const mockTrades = [
    { id: "T001", symbol: "XAUUSD", type: "买入", volume: 0.5, price: 2034.50, profit: 125.50, time: "10:30:25" },
    { id: "T002", symbol: "EURUSD", type: "卖出", volume: 1.0, price: 1.0875, profit: -45.20, time: "10:15:10" },
    { id: "T003", symbol: "BTCUSD", type: "买入", volume: 0.1, price: 67450.00, profit: 320.00, time: "09:58:33" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-4xl bg-white dark:bg-slate-800 shadow-2xl z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  {isFrozen && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <Ban className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {user.name}
                    </h2>
                    {isFrozen && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded text-xs font-medium">
                        已冻结
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <span className="font-mono">{user.uid}</span>
                    <span>•</span>
                    <span className={`${kycConfig.color}`}>{kycConfig.label}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <Edit className="w-5 h-5 text-slate-500" />
                </button>
                <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <Download className="w-5 h-5 text-slate-500" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => setIsFrozen(!isFrozen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  isFrozen
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                <Ban className="w-4 h-4" />
                {isFrozen ? "解冻账户" : "冻结账户"}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium text-sm hover:bg-blue-200 transition-colors">
                <CreditCard className="w-4 h-4" />
                调整余额
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                <Mail className="w-4 h-4" />
                发送消息
              </button>
              <div className="flex-1" />
              <button className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-6 border-b border-slate-200 dark:border-slate-700">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                      基本信息
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <div>
                          <div className="text-xs text-slate-500">邮箱</div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <div>
                          <div className="text-xs text-slate-500">手机</div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {user.phone || "未绑定"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <div>
                          <div className="text-xs text-slate-500">地区</div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {user.country || "未知"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <div>
                          <div className="text-xs text-slate-500">注册时间</div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                        <Wallet className="w-4 h-4" />
                        <span className="text-xs font-medium">账户余额</span>
                      </div>
                      <div className="text-xl font-bold text-slate-900 dark:text-white">
                        $20,840.70
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-xs font-medium">账户净值</span>
                      </div>
                      <div className="text-xl font-bold text-slate-900 dark:text-white">
                        $20,998.10
                      </div>
                    </div>
                    <div className="bg-violet-50 dark:bg-violet-950/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 mb-1">
                        <Shield className="w-4 h-4" />
                        <span className="text-xs font-medium">信用等级</span>
                      </div>
                      <div className="text-xl font-bold text-slate-900 dark:text-white">
                        VIP {user.level}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                      用户标签
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {["高频交易", "VIP客户", "IB推荐人", "风险偏好型"].map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                      <button className="px-3 py-1 border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded-full text-sm hover:border-slate-400 transition-colors">
                        + 添加标签
                      </button>
                    </div>
                  </div>

                  {/* Referrer */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Link2 className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-500">推荐人</div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          user_1892 (IB_001)
                        </div>
                      </div>
                    </div>
                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      查看详情
                    </button>
                  </div>
                </div>
              )}

              {/* Accounts Tab */}
              {activeTab === "accounts" && (
                <div className="space-y-3">
                  {mockAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-slate-900 dark:text-white">
                            {account.id}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs">
                            {account.type}
                          </span>
                        </div>
                        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                          管理
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">余额</div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            ${account.balance.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">净值</div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            ${account.equity.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">保证金</div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            ${account.margin.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">保证金比例</div>
                          <div
                            className={`font-semibold ${
                              parseFloat(account.marginLevel) > 150
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }`}
                          >
                            {account.marginLevel}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Funds Tab */}
              {activeTab === "funds" && (
                <div className="space-y-3">
                  {mockFunds.map((fund, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            fund.amount > 0
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {fund.amount > 0 ? "+" : ""}${Math.abs(fund.amount)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {fund.type}
                          </div>
                          <div className="text-xs text-slate-500">
                            {fund.method} • {fund.time}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`font-semibold ${
                          fund.amount > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {fund.amount > 0 ? "+" : ""}${Math.abs(fund.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Trades Tab */}
              {activeTab === "trades" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-7 gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-medium text-slate-500">
                    <div>时间</div>
                    <div>订单号</div>
                    <div>品种</div>
                    <div>类型</div>
                    <div className="text-right">数量</div>
                    <div className="text-right">开仓价</div>
                    <div className="text-right">盈亏</div>
                  </div>
                  {mockTrades.map((trade) => (
                    <div
                      key={trade.id}
                      className="grid grid-cols-7 gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm"
                    >
                      <div className="text-slate-500">{trade.time}</div>
                      <div className="font-mono text-slate-600 dark:text-slate-400">
                        {trade.id}
                      </div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {trade.symbol}
                      </div>
                      <div>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            trade.type === "买入"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {trade.type}
                        </span>
                      </div>
                      <div className="text-right">{trade.volume}</div>
                      <div className="text-right font-mono">${trade.price}</div>
                      <div
                        className={`text-right font-medium ${
                          trade.profit >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {trade.profit >= 0 ? "+" : ""}${trade.profit}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* KYC Tab */}
              {activeTab === "kyc" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div
                      className={`w-12 h-12 ${kycConfig.bg} rounded-full flex items-center justify-center`}
                    >
                      <Shield className={`w-6 h-6 ${kycConfig.color}`} />
                    </div>
                    <div>
                      <div className="text-lg font-medium text-slate-900 dark:text-white">
                        KYC认证状态
                      </div>
                      <div className={`text-sm ${kycConfig.color}`}>
                        {kycConfig.label}
                      </div>
                    </div>
                    <div className="flex-1" />
                    {user.kycStatus === "pending" && (
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors">
                          通过
                        </button>
                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors">
                          拒绝
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                      <div className="text-xs text-slate-500 mb-2">身份证</div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          已上传
                        </span>
                      </div>
                    </div>
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                      <div className="text-xs text-slate-500 mb-2">地址证明</div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          已上传
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* IB Tab */}
              {activeTab === "ib" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-violet-50 dark:bg-violet-950/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/50 rounded-lg flex items-center justify-center">
                        <Link2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          IB推荐人
                        </div>
                        <div className="text-xs text-slate-500">IB_001</div>
                      </div>
                    </div>
                    <button className="text-sm text-violet-600 dark:text-violet-400 hover:underline">
                      查看详情
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                      推荐统计
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          12
                        </div>
                        <div className="text-xs text-slate-500">推荐人数</div>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                        <div className="text-2xl font-bold text-emerald-600">
                          8
                        </div>
                        <div className="text-xs text-slate-500">活跃用户</div>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                        <div className="text-2xl font-bold text-violet-600">
                          $1,245
                        </div>
                        <div className="text-xs text-slate-500">累计佣金</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
