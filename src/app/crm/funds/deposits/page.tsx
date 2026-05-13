"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  ChevronRight,
  X,
  Eye,
  Download,
  Building2,
  CreditCard,
  Wallet,
  History,
  Ban,
  Landmark,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";

// Types
interface DepositOrder {
  id: string;
  userId: string;
  userName: string;
  email: string;
  amount: number;
  currency: string;
  method: "bank_transfer" | "crypto" | "card" | "ewallet";
  methodName: string;
  status: "pending" | "approved" | "rejected" | "processing" | "completed";
  riskFlags: string[];
  submittedAt: string;
  processedAt?: string;
  reviewer?: string;
  rejectionReason?: string;
  txHash?: string;
  bankRef?: string;
  history: {
    action: string;
    time: string;
    by?: string;
  }[];
}

// Mock data
const mockDeposits: DepositOrder[] = [
  {
    id: "DP001",
    userId: "USR001",
    userName: "John Smith",
    email: "john.smith@email.com",
    amount: 5000,
    currency: "USD",
    method: "crypto",
    methodName: "USDT-TRC20",
    status: "pending",
    riskFlags: ["大额入金"],
    submittedAt: "2024-03-15 14:30",
    txHash: "TXbc1234...5678",
    history: [{ action: "用户提交存款", time: "2024-03-15 14:30" }],
  },
  {
    id: "DP002",
    userId: "USR002",
    userName: "Sarah Johnson",
    email: "sarah.j@email.com",
    amount: 1200,
    currency: "USD",
    method: "card",
    methodName: "Visa",
    status: "completed",
    riskFlags: [],
    submittedAt: "2024-03-15 13:45",
    processedAt: "2024-03-15 13:46",
    reviewer: "system",
    history: [
      { action: "用户提交存款", time: "2024-03-15 13:45" },
      { action: "自动审核通过", time: "2024-03-15 13:46" },
      { action: "已到账", time: "2024-03-15 13:46" },
    ],
  },
  {
    id: "DP003",
    userId: "USR003",
    userName: "Michael Brown",
    email: "m.brown@email.com",
    amount: 25000,
    currency: "USD",
    method: "bank_transfer",
    methodName: "SWIFT",
    status: "processing",
    riskFlags: ["大额入金", "首次大额", "银行转账"],
    submittedAt: "2024-03-15 12:00",
    processedAt: "2024-03-15 12:30",
    reviewer: "admin_01",
    bankRef: "REF-8823-1100",
    history: [
      { action: "用户提交存款", time: "2024-03-15 12:00" },
      { action: "触发风控审核", time: "2024-03-15 12:01" },
      { action: "审核通过", time: "2024-03-15 12:30", by: "admin_01" },
      { action: "银行处理中", time: "2024-03-15 12:31" },
    ],
  },
  {
    id: "DP004",
    userId: "USR004",
    userName: "Emma Wilson",
    email: "emma.w@email.com",
    amount: 800,
    currency: "USD",
    method: "ewallet",
    methodName: "PayPal",
    status: "completed",
    riskFlags: [],
    submittedAt: "2024-03-15 10:30",
    processedAt: "2024-03-15 10:31",
    reviewer: "system",
    history: [
      { action: "用户提交存款", time: "2024-03-15 10:30" },
      { action: "自动审核通过", time: "2024-03-15 10:31" },
      { action: "已到账", time: "2024-03-15 10:31" },
    ],
  },
  {
    id: "DP005",
    userId: "USR005",
    userName: "David Lee",
    email: "david.lee@email.com",
    amount: 1500,
    currency: "USD",
    method: "crypto",
    methodName: "BTC",
    status: "rejected",
    riskFlags: [],
    submittedAt: "2024-03-14 16:00",
    processedAt: "2024-03-14 17:00",
    reviewer: "admin_02",
    rejectionReason: "交易哈希无法验证，区块链上未找到对应交易",
    txHash: "bc1qxy...invalid",
    history: [
      { action: "用户提交存款", time: "2024-03-14 16:00" },
      { action: "拒绝", time: "2024-03-14 17:00", by: "admin_02" },
    ],
  },
  {
    id: "DP006",
    userId: "USR006",
    userName: "Lisa Chen",
    email: "lisa.chen@email.com",
    amount: 3200,
    currency: "USD",
    method: "card",
    methodName: "Mastercard",
    status: "approved",
    riskFlags: [],
    submittedAt: "2024-03-14 09:00",
    processedAt: "2024-03-14 09:05",
    reviewer: "system",
    history: [
      { action: "用户提交存款", time: "2024-03-14 09:00" },
      { action: "自动审核通过", time: "2024-03-14 09:05" },
      { action: "处理中", time: "2024-03-14 09:06" },
    ],
  },
];

const statusConfig = {
  pending: { label: "待审核", color: "text-amber-600", bg: "bg-amber-100", icon: Clock },
  approved: { label: "已批准", color: "text-blue-600", bg: "bg-blue-100", icon: CheckCircle },
  rejected: { label: "已拒绝", color: "text-red-600", bg: "bg-red-100", icon: XCircle },
  processing: { label: "处理中", color: "text-violet-600", bg: "bg-violet-100", icon: ArrowDownRight },
  completed: { label: "已完成", color: "text-emerald-600", bg: "bg-emerald-100", icon: CheckCircle },
};

const methodIcons = {
  bank_transfer: Building2,
  crypto: Wallet,
  card: CreditCard,
  ewallet: DollarSign,
};

export default function DepositOrdersPage() {
  const [deposits] = useState<DepositOrder[]>(mockDeposits);
  const [selectedOrder, setSelectedOrder] = useState<DepositOrder | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "processing" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleApprove = (order: DepositOrder) => {
    // TODO: call /api/backoffice/funds/deposits/approve
    setSelectedOrder(null);
  };

  const handleReject = (order: DepositOrder, reason: string) => {
    // TODO: call /api/backoffice/funds/deposits/reject
    setSelectedOrder(null);
  };

  const filteredOrders = deposits.filter((order) => {
    if (filter !== "all" && order.status !== filter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.userName.toLowerCase().includes(query) ||
        order.email.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const stats = {
    total: deposits.length,
    pending: deposits.filter((d) => d.status === "pending").length,
    todayAmount: deposits.filter((d) => d.status === "completed").reduce((acc, d) => acc + d.amount, 0),
    totalAmount: deposits.reduce((acc, d) => acc + d.amount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "资金管理" }, { label: "存款订单" }]} />

      {/* Page Header */}
      <PageHeader
        title="存款订单"
        description="审核和管理用户存款订单"
        actions={
          <div className="flex gap-3">
            <Button variant="secondary">
              <Download className="w-4 h-4" />
              导出记录
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <History className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              <p className="text-sm text-slate-500">总订单数</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-sm text-slate-500">待审核</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">${stats.todayAmount.toLocaleString()}</p>
              <p className="text-sm text-slate-500">今日入金</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">${stats.totalAmount.toLocaleString()}</p>
              <p className="text-sm text-slate-500">总入金金额</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索用户、邮箱或订单号..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {(["all", "pending", "processing", "approved", "completed", "rejected"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === status
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {status === "all" ? "全部" : statusConfig[status].label}
            </button>
          ))}
        </div>
      </div>

      {/* Deposit Orders List */}
      <div className="space-y-3">
        {filteredOrders.map((order) => {
          const status = statusConfig[order.status];
          const StatusIcon = status.icon;
          const MethodIcon = methodIcons[order.method];
          const hasRisk = order.riskFlags.length > 0;

          return (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-start justify-between">
                  {/* Left - User & Amount */}
                  <div className="flex items-start gap-4">
                    {/* Method Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      order.method === "crypto" ? "bg-amber-100" :
                      order.method === "bank_transfer" ? "bg-blue-100" :
                      "bg-slate-100"
                    }`}>
                      <MethodIcon className={`w-5 h-5 ${
                        order.method === "crypto" ? "text-amber-600" :
                        order.method === "bank_transfer" ? "text-blue-600" :
                        "text-slate-600"
                      }`} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {order.userName}
                        </h3>
                        {hasRisk && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded text-xs">
                            <AlertTriangle className="w-3 h-3" />
                            {order.riskFlags[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="font-mono">{order.userId}</span>
                        <span>•</span>
                        <span>{order.email}</span>
                        <span>•</span>
                        <span>{order.methodName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right - Amount & Status */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        ${order.amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">{order.currency}</div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-4 h-4 ${status.color}`} />
                        <span className={`text-sm font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {order.submittedAt}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Quick Actions for pending orders */}
              {order.status === "pending" && (
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); /* TODO: approve */ }}>
                    <CheckCircle className="w-4 h-4" />
                    通过
                  </Button>
                  <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); /* TODO: hold */ }}>
                    <Clock className="w-4 h-4" />
                    挂起
                  </Button>
                  <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); /* TODO: reject */ }}>
                    <XCircle className="w-4 h-4" />
                    拒绝
                  </Button>
                  <div className="flex-1" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    查看详情
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <DollarSign className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">暂无订单记录</p>
            <p className="text-sm">当前筛选条件下没有存款订单</p>
          </div>
        )}
      </div>

      {/* Detail Side Drawer */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-slate-800 shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    存款详情
                  </h2>
                  <p className="text-sm text-slate-500 font-mono">{selectedOrder.id}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Amount */}
                <div className="text-center p-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white">
                  <p className="text-sm opacity-80">存款金额</p>
                  <p className="text-4xl font-bold mt-1">
                    ${selectedOrder.amount.toLocaleString()}
                  </p>
                  <p className="text-sm opacity-80 mt-1">{selectedOrder.currency}</p>
                </div>

                {/* User Info */}
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                    用户信息
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-slate-500">用户名</span>
                      <span className="font-medium">{selectedOrder.userName}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-slate-500">邮箱</span>
                      <span className="font-medium">{selectedOrder.email}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-slate-500">用户ID</span>
                      <span className="font-mono">{selectedOrder.userId}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                    存款方式
                  </h3>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      {(() => {
                        const Icon = methodIcons[selectedOrder.method];
                        return <Icon className="w-5 h-5 text-slate-600" />;
                      })()}
                      <span className="font-medium">{selectedOrder.methodName}</span>
                    </div>
                    {selectedOrder.txHash && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">交易哈希</span>
                        <span className="font-mono">{selectedOrder.txHash}</span>
                      </div>
                    )}
                    {selectedOrder.bankRef && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">银行参考号</span>
                        <span className="font-mono">{selectedOrder.bankRef}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Risk Flags */}
                {selectedOrder.riskFlags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                      风控标记
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedOrder.riskFlags.map((flag) => (
                        <span
                          key={flag}
                          className="px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedOrder.rejectionReason && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                      拒绝原因
                    </h3>
                    <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {selectedOrder.rejectionReason}
                      </p>
                    </div>
                  </div>
                )}

                {/* History */}
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                    操作记录
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.history.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full" />
                        <div>
                          <p className="text-sm font-medium">{item.action}</p>
                          <p className="text-xs text-slate-500">
                            {item.time}
                            {item.by && ` • ${item.by}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedOrder.status === "pending" && (
                <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <Button
                    className="flex-1"
                    onClick={() => handleApprove(selectedOrder)}
                  >
                    <CheckCircle className="w-4 h-4" />
                    通过
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => handleReject(selectedOrder, "信息核实不通过")}
                  >
                    <XCircle className="w-4 h-4" />
                    拒绝
                  </Button>
                  <Button variant="secondary">
                    <Ban className="w-4 h-4" />
                    挂起
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
