"use client";

import { useState } from "react";
import {
  Shield,
  Search,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  FileText,
  Wallet,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { EnhancedDataTable, Column, RowAction } from "@/components/crm/ui/EnhancedDataTable";
import { cn } from "@/lib/utils";

// Types
interface NBPClaim {
  id: string;
  userName: string;
  userId: string;
  accountId: string;
  claimAmount: number;
  currency: string;
  negativeBalance: number;
  cause: string;
  status: "pending" | "approved" | "rejected" | "processing";
  submittedAt: string;
  processedAt?: string;
  processedBy?: string;
  rejectionReason?: string;
  notes?: string;
}

// Mock data
const mockClaims: NBPClaim[] = [
  {
    id: "NBP001",
    userName: "John Smith",
    userId: "USR-001",
    accountId: "ACC-8823",
    claimAmount: 2500,
    currency: "USD",
    negativeBalance: -2500,
    cause: "剧烈波动导致账户爆仓",
    status: "pending",
    submittedAt: "2024-03-15 10:00:00",
    notes: "XAU/USD 在非农数据发布后剧烈波动150点",
  },
  {
    id: "NBP002",
    userName: "Sarah Johnson",
    userId: "USR-002",
    accountId: "ACC-9912",
    claimAmount: 800,
    currency: "USD",
    negativeBalance: -800,
    cause: "加密货币闪崩",
    status: "approved",
    submittedAt: "4-03-14 16:30:00",
    processedAt: "2024-03-15 09:00:00",
    processedBy: "admin_risk",
    notes: "BTC/USD 在5分钟内下跌12%",
  },
  {
    id: "NBP003",
    userName: "Michael Brown",
    userId: "USR-003",
    accountId: "ACC-3345",
    claimAmount: 15000,
    currency: "USD",
    negativeBalance: -15000,
    cause: "地缘政治事件引发市场跳空",
    status: "rejected",
    submittedAt: "2024-03-13 08:00:00",
    processedAt: "2024-03-14 14:00:00",
    processedBy: "admin_risk",
    rejectionReason: "客户在事件前已收到风险警告，且持仓过重",
  },
  {
    id: "NBP004",
    userName: "Emma Wilson",
    userId: "USR-004",
    accountId: "ACC-5567",
    claimAmount: 320,
    currency: "USD",
    negativeBalance: -320,
    cause: "流动性不足导致滑点过大",
    status: "processing",
    submittedAt: "2024-03-12 11:00:00",
    notes: "小众货币对在低流动性时段出现大幅滑点",
  },
  {
    id: "NBP005",
    userName: "David Lee",
    userId: "USR-005",
    accountId: "ACC-7789",
    claimAmount: 5000,
    currency: "USD",
    negativeBalance: -5000,
    cause: "杠杆过高导致爆仓后余额为负",
    status: "approved",
    submittedAt: "2024-03-10 14:00:00",
    processedAt: "2024-03-11 10:00:00",
    processedBy: "system",
  },
];

const statusConfig = {
  pending: { label: "待审核", color: "text-amber-600", bg: "bg-amber-100", icon: Clock },
  approved: { label: "已通过", color: "text-emerald-600", bg: "bg-emerald-100", icon: CheckCircle },
  rejected: { label: "已拒绝", color: "text-red-600", bg: "bg-red-100", icon: XCircle },
  processing: { label: "处理中", color: "text-blue-600", bg: "bg-blue-100", icon: Shield },
};

export default function NBPProtectionPage() {
  const [claims] = useState<NBPClaim[]>(mockClaims);
  const [filterStatus, setFilterStatus] = useState<"all" | NBPClaim["status"]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<NBPClaim | null>(null);

  const filteredClaims = claims.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.userName.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: claims.length,
    pending: claims.filter((c) => c.status === "pending").length,
    totalAmount: claims.filter((c) => c.status === "approved").reduce((acc, c) => acc + c.claimAmount, 0),
    approved: claims.filter((c) => c.status === "approved").length,
  };

  const columns: Column<NBPClaim>[] = [
    {
      key: "status",
      title: "状态",
      width: "110px",
      render: (row) => {
        const cfg = statusConfig[row.status];
        const Icon = cfg.icon;
        return (
          <div className="flex items-center gap-2">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", cfg.bg)}>
              <Icon className={cn("w-4 h-4", cfg.color)} />
            </div>
            <span className={cn("text-sm font-medium", cfg.color)}>{cfg.label}</span>
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
          <p className="text-xs text-gray-500 font-mono">{row.accountId}</p>
        </div>
      ),
    },
    {
      key: "claimAmount",
      title: "申请金额",
      width: "120px",
      align: "right",
      render: (row) => (
        <span className="text-sm font-bold text-red-600">-${row.claimAmount.toLocaleString()}</span>
      ),
    },
    {
      key: "negativeBalance",
      title: "负余额",
      width: "110px",
      align: "right",
      render: (row) => <span className="text-sm font-mono text-red-600">{row.negativeBalance}</span>,
    },
    {
      key: "cause",
      title: "原因",
      render: (row) => <span className="text-sm text-gray-600">{row.cause}</span>,
    },
    {
      key: "submittedAt",
      title: "申请时间",
      width: "150px",
      render: (row) => <span className="text-sm text-gray-500">{row.submittedAt}</span>,
    },
  ];

  const rowActions: RowAction<NBPClaim>[] = [
    {
      label: "查看详情",
      icon: <FileText className="w-4 h-4" />,
      onClick: (row) => setSelectedClaim(row),
    },
    {
      label: "通过",
      icon: <CheckCircle className="w-4 h-4" />,
      onClick: () => {},
      disabled: (row) => row.status !== "pending",
    },
    {
      label: "拒绝",
      icon: <XCircle className="w-4 h-4" />,
      onClick: () => {},
      variant: "danger",
      disabled: (row) => row.status !== "pending",
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "风控" }, { label: "负余额保护" }]} />

      <PageHeader
        title="负余额保护"
        description="管理负余额保护理赔申请"
        actions={
          <Button variant="secondary">
            <FileText className="w-4 h-4" />
            导出报表
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-500">总申请</p>
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
              <p className="text-sm text-gray-500">待审核</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
              <p className="text-sm text-gray-500">已通过</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">${stats.totalAmount.toLocaleString()}</p>
              <p className="text-sm text-gray-500">已赔付总额</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索用户或申请号..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部状态</option>
            <option value="pending">待审核</option>
            <option value="processing">处理中</option>
            <option value="approved">已通过</option>
            <option value="rejected">已拒绝</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <EnhancedDataTable
        columns={columns}
        data={filteredClaims}
        keyExtractor={(row) => row.id}
        searchable={false}
        rowActions={rowActions}
        onRowClick={setSelectedClaim}
        emptyText="暂无理赔申请"
      />

      {/* Detail Modal */}
      {selectedClaim && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedClaim(null)} />
          <div className="fixed inset-x-4 top-[10%] max-w-lg mx-auto bg-white rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">理赔详情</h2>
                <p className="text-sm text-gray-500 font-mono">{selectedClaim.id}</p>
              </div>
              <button onClick={() => setSelectedClaim(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="text-center p-6 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl text-white">
                <p className="text-sm opacity-80">负余额金额</p>
                <p className="text-4xl font-bold mt-1">${Math.abs(selectedClaim.negativeBalance).toLocaleString()}</p>
                <p className="text-sm opacity-80 mt-1">申请赔付: ${selectedClaim.claimAmount.toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">用户</p>
                  <p className="text-sm font-medium">{selectedClaim.userName}</p>
                  <p className="text-xs text-gray-500 font-mono">{selectedClaim.userId}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">交易账户</p>
                  <p className="text-sm font-mono">{selectedClaim.accountId}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">状态</p>
                  <span className={cn("text-sm font-medium", statusConfig[selectedClaim.status].color)}>
                    {statusConfig[selectedClaim.status].label}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">申请时间</p>
                  <p className="text-sm">{selectedClaim.submittedAt}</p>
                </div>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600 mb-1">事件原因</p>
                <p className="text-sm text-red-800">{selectedClaim.cause}</p>
              </div>

              {selectedClaim.notes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">备注</p>
                  <p className="text-sm">{selectedClaim.notes}</p>
                </div>
              )}

              {selectedClaim.processedAt && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">处理时间</p>
                    <p className="text-sm">{selectedClaim.processedAt}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">处理人</p>
                    <p className="text-sm">{selectedClaim.processedBy}</p>
                  </div>
                </div>
              )}

              {selectedClaim.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600 mb-1">拒绝原因</p>
                  <p className="text-sm text-red-800">{selectedClaim.rejectionReason}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 p-6 border-t bg-gray-50">
              {selectedClaim.status === "pending" && (
                <>
                  <Button className="flex-1">
                    <CheckCircle className="w-4 h-4" />
                    通过申请
                  </Button>
                  <Button variant="danger" className="flex-1">
                    <XCircle className="w-4 h-4" />
                    拒绝申请
                  </Button>
                </>
              )}
              {selectedClaim.status !== "pending" && (
                <Button variant="secondary" className="w-full" onClick={() => setSelectedClaim(null)}>
                  关闭
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
