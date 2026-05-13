"use client";

import { useState, useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Card, PageHeader, Button, StatusBadge } from "@/components/crm/ui";
import { EnhancedDataTable, type Column } from "@/components/crm/ui";
import { FilterBar } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";

// Types
interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: "deposit" | "withdrawal" | "transfer" | "refund" | "fee";
  direction: "in" | "out";
  amount: number;
  currency: string;
  status: "success" | "pending" | "failed" | "processing";
  method?: string;
  fromAccount?: string;
  toAccount?: string;
  description?: string;
  createdAt: string;
  completedAt?: string;
}

// Mock data
const mockTransactions: Transaction[] = [
  {
    id: "TXN001",
    userId: "USR001",
    userName: "John Smith",
    type: "deposit",
    direction: "in",
    amount: 5000,
    currency: "USD",
    status: "success",
    method: "USDT-TRC20",
    description: "用户入金",
    createdAt: "2024-03-15 14:30",
    completedAt: "2024-03-15 14:31",
  },
  {
    id: "TXN002",
    userId: "USR002",
    userName: "Sarah Johnson",
    type: "withdrawal",
    direction: "out",
    amount: 1200,
    currency: "USD",
    status: "success",
    method: "Visa",
    description: "用户出金",
    createdAt: "2024-03-15 13:45",
    completedAt: "2024-03-15 13:46",
  },
  {
    id: "TXN003",
    userId: "USR003",
    userName: "Michael Brown",
    type: "transfer",
    direction: "out",
    amount: 2500,
    currency: "USD",
    status: "success",
    fromAccount: "MT5-8999999",
    toAccount: "Wallet-USD",
    description: "账户间转账",
    createdAt: "2024-03-15 12:00",
    completedAt: "2024-03-15 12:01",
  },
  {
    id: "TXN004",
    userId: "USR001",
    userName: "John Smith",
    type: "deposit",
    direction: "in",
    amount: 800,
    currency: "USD",
    status: "pending",
    method: "PayPal",
    description: "用户入金",
    createdAt: "2024-03-15 10:30",
  },
  {
    id: "TXN005",
    userId: "USR004",
    userName: "Emma Wilson",
    type: "withdrawal",
    direction: "out",
    amount: 3500,
    currency: "USD",
    status: "failed",
    method: "SWIFT",
    description: "银行信息不符",
    createdAt: "2024-03-14 16:00",
    completedAt: "2024-03-14 17:00",
  },
  {
    id: "TXN006",
    userId: "USR005",
    userName: "David Lee",
    type: "fee",
    direction: "out",
    amount: 15,
    currency: "USD",
    status: "success",
    description: "出金手续费",
    createdAt: "2024-03-14 09:00",
    completedAt: "2024-03-14 09:00",
  },
  {
    id: "TXN007",
    userId: "USR002",
    userName: "Sarah Johnson",
    type: "refund",
    direction: "in",
    amount: 200,
    currency: "USD",
    status: "success",
    description: "交易退款",
    createdAt: "2024-03-13 11:20",
    completedAt: "2024-03-13 11:21",
  },
  {
    id: "TXN008",
    userId: "USR006",
    userName: "Lisa Chen",
    type: "deposit",
    direction: "in",
    amount: 10000,
    currency: "USD",
    status: "processing",
    method: "BTC",
    description: "用户入金",
    createdAt: "2024-03-13 08:00",
  },
  {
    id: "TXN009",
    userId: "USR003",
    userName: "Michael Brown",
    type: "withdrawal",
    direction: "out",
    amount: 500,
    currency: "USD",
    status: "pending",
    method: "Skrill",
    description: "用户出金",
    createdAt: "2024-03-12 15:30",
  },
  {
    id: "TXN010",
    userId: "USR007",
    userName: "Robert Taylor",
    type: "transfer",
    direction: "out",
    amount: 3000,
    currency: "USD",
    status: "success",
    fromAccount: "Wallet-USD",
    toAccount: "MT4-7845321",
    description: "账户间转账",
    createdAt: "2024-03-12 10:00",
    completedAt: "2024-03-12 10:01",
  },
];

const typeConfig: Record<string, { label: string; icon: typeof ArrowDownLeft; color: string; bg: string }> = {
  deposit: { label: "入金", icon: ArrowDownLeft, color: "text-emerald-600", bg: "bg-emerald-100" },
  withdrawal: { label: "出金", icon: ArrowUpRight, color: "text-red-600", bg: "bg-red-100" },
  transfer: { label: "转账", icon: ArrowLeftRight, color: "text-blue-600", bg: "bg-blue-100" },
  refund: { label: "退款", icon: RefreshCw, color: "text-violet-600", bg: "bg-violet-100" },
  fee: { label: "手续费", icon: DollarSign, color: "text-slate-600", bg: "bg-slate-100" },
};

export default function TransactionsPage() {
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const stats = useMemo(() => {
    const totalIn = transactions
      .filter((t) => t.direction === "in" && t.status === "success")
      .reduce((acc, t) => acc + t.amount, 0);
    const totalOut = transactions
      .filter((t) => t.direction === "out" && t.status === "success")
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      total: transactions.length,
      totalIn,
      totalOut,
      netFlow: totalIn - totalOut,
    };
  }, [transactions]);

  const filteredData = useMemo(() => {
    return transactions.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterType !== "all" && t.type !== filterType) return false;
      return true;
    });
  }, [transactions, filterStatus, filterType]);

  const columns: Column<Transaction>[] = [
    {
      key: "id",
      title: "交易ID",
      width: "120px",
      render: (row) => <span className="font-mono text-xs text-slate-500">{row.id}</span>,
    },
    {
      key: "type",
      title: "类型",
      width: "140px",
      render: (row) => {
        const config = typeConfig[row.type];
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center`}>
              <Icon className={`w-3.5 h-3.5 ${config.color}`} />
            </div>
            <span className="text-sm font-medium">{config.label}</span>
          </div>
        );
      },
    },
    {
      key: "userName",
      title: "用户",
      render: (row) => (
        <div>
          <p className="text-sm font-medium">{row.userName}</p>
          <p className="text-xs text-slate-500 font-mono">{row.userId}</p>
        </div>
      ),
    },
    {
      key: "amount",
      title: "金额",
      width: "140px",
      align: "right",
      sortable: true,
      render: (row) => (
        <span className={`text-sm font-bold ${row.direction === "in" ? "text-emerald-600" : "text-red-600"}`}>
          {row.direction === "in" ? "+" : "-"}${row.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: "method",
      title: "方式",
      width: "120px",
      render: (row) => (
        <span className="text-sm text-slate-600">{row.method || "-"}</span>
      ),
    },
    {
      key: "status",
      title: "状态",
      width: "100px",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "createdAt",
      title: "时间",
      width: "160px",
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm text-slate-700">{row.createdAt.split(" ")[0]}</p>
          <p className="text-xs text-slate-400">{row.createdAt.split(" ")[1]}</p>
        </div>
      ),
    },
    {
      key: "description",
      title: "备注",
      render: (row) => <span className="text-sm text-slate-500">{row.description}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "资金管理" }, { label: "交易记录" }]} />

      {/* Page Header */}
      <PageHeader
        title="交易记录"
        description="查看所有资金交易明细，包括入金、出金、转账和手续费"
        actions={
          <div className="flex gap-3">
            <Button variant="secondary">
              <Download className="w-4 h-4" />
              导出
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-500">总交易数</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">+${stats.totalIn.toLocaleString()}</p>
              <p className="text-sm text-slate-500">总流入</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">-${stats.totalOut.toLocaleString()}</p>
              <p className="text-sm text-slate-500">总流出</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${stats.netFlow >= 0 ? "text-blue-600" : "text-red-600"}`}>
                {stats.netFlow >= 0 ? "+" : ""}${stats.netFlow.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">净流量</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchable
        searchPlaceholder="搜索交易ID、用户或备注..."
        searchKeys={["id", "userName", "userId", "description"]}
        filters={[
          {
            key: "type",
            label: "交易类型",
            type: "select",
            value: filterType,
            onChange: setFilterType,
            options: [
              { label: "全部类型", value: "all" },
              { label: "入金", value: "deposit" },
              { label: "出金", value: "withdrawal" },
              { label: "转账", value: "transfer" },
              { label: "退款", value: "refund" },
              { label: "手续费", value: "fee" },
            ],
          },
          {
            key: "status",
            label: "状态",
            type: "select",
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { label: "全部状态", value: "all" },
              { label: "成功", value: "success" },
              { label: "处理中", value: "processing" },
              { label: "待处理", value: "pending" },
              { label: "失败", value: "failed" },
            ],
          },
        ]}
      />

      {/* Data Table */}
      <EnhancedDataTable
        columns={columns}
        data={filteredData}
        keyExtractor={(row) => row.id}
        searchable={false}
        pagination
        pageSize={10}
        emptyText="暂无交易记录"
        emptyIcon={<Wallet className="w-12 h-12" />}
        exportable
      />
    </div>
  );
}
