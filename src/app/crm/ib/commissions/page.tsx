"use client";

import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Wallet,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { EnhancedDataTable, Column, RowAction } from "@/components/crm/ui/EnhancedDataTable";
import { cn } from "@/lib/utils";

// Types
interface CommissionRecord {
  id: string;
  ibId: string;
  ibName: string;
  ibLevel: "L1" | "L2" | "L3" | "Platform";
  clientId: string;
  clientName: string;
  orderId: string;
  symbol: string;
  volume: number;
  commission: number;
  currency: string;
  status: "pending" | "paid" | "disputed" | "cancelled";
  tradeDate: string;
  settlementDate?: string;
  notes?: string;
}

// Mock data
const mockRecords: CommissionRecord[] = [
  {
    id: "CM001",
    ibId: "IB-1001",
    ibName: "Global Partners Ltd",
    ibLevel: "L1",
    clientId: "USR-3301",
    clientName: "Michael Brown",
    orderId: "ORD-9921",
    symbol: "EUR/USD",
    volume: 1.5,
    commission: 15.0,
    currency: "USD",
    status: "paid",
    tradeDate: "2024-03-15 14:30:00",
    settlementDate: "2024-03-16 00:00:00",
  },
  {
    id: "CM002",
    ibId: "IB-1001",
    ibName: "Global Partners Ltd",
    ibLevel: "L1",
    clientId: "USR-4402",
    clientName: "Alice Wang",
    orderId: "ORD-9922",
    symbol: "GBP/USD",
    volume: 2.0,
    commission: 20.0,
    currency: "USD",
    status: "pending",
    tradeDate: "2024-03-15 13:45:00",
  },
  {
    id: "CM003",
    ibId: "IB-2001",
    ibName: "Asia Trading Hub",
    ibLevel: "L2",
    clientId: "USR-5503",
    clientName: "Robert Chen",
    orderId: "ORD-9923",
    symbol: "XAU/USD",
    volume: 0.5,
    commission: 5.0,
    currency: "USD",
    status: "paid",
    tradeDate: "2024-03-14 10:00:00",
    settlementDate: "2024-03-15 00:00:00",
  },
  {
    id: "CM004",
    ibId: "IB-3001",
    ibName: "Retail Network",
    ibLevel: "L3",
    clientId: "USR-6604",
    clientName: "Emma Davis",
    orderId: "ORD-9924",
    symbol: "USD/JPY",
    volume: 3.0,
    commission: 30.0,
    currency: "USD",
    status: "disputed",
    tradeDate: "2024-03-14 09:30:00",
    notes: "客户 disputing 佣金计算，需核实交易量",
  },
  {
    id: "CM005",
    ibId: "IB-1001",
    ibName: "Global Partners Ltd",
    ibLevel: "L1",
    clientId: "USR-3301",
    clientName: "Michael Brown",
    orderId: "ORD-9925",
    symbol: "BTC/USD",
    volume: 0.1,
    commission: 10.0,
    currency: "USD",
    status: "pending",
    tradeDate: "2024-03-13 16:00:00",
  },
  {
    id: "CM006",
    ibId: "IB-P001",
    ibName: "TradePass Platform",
    ibLevel: "Platform",
    clientId: "USR-7705",
    clientName: "James Wilson",
    orderId: "ORD-9926",
    symbol: "ETH/USD",
    volume: 1.0,
    commission: 8.0,
    currency: "USD",
    status: "cancelled",
    tradeDate: "2024-03-12 11:20:00",
    notes: "订单被取消，佣金作废",
  },
];

const levelConfig = {
  L1: { label: "L1", color: "text-blue-600", bg: "bg-blue-100" },
  L2: { label: "L2", color: "text-violet-600", bg: "bg-violet-100" },
  L3: { label: "L3", color: "text-amber-600", bg: "bg-amber-100" },
  Platform: { label: "平台", color: "text-emerald-600", bg: "bg-emerald-100" },
};

const statusConfig = {
  pending: { label: "待结算", color: "text-amber-600", bg: "bg-amber-100" },
  paid: { label: "已结算", color: "text-emerald-600", bg: "bg-emerald-100" },
  disputed: { label: "争议中", color: "text-red-600", bg: "bg-red-100" },
  cancelled: { label: "已取消", color: "text-gray-500", bg: "bg-gray-100" },
};

export default function CommissionRecordsPage() {
  const [records] = useState<CommissionRecord[]>(mockRecords);
  const [filterLevel, setFilterLevel] = useState<"all" | CommissionRecord["ibLevel"]>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | CommissionRecord["status"]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<CommissionRecord | null>(null);

  const filteredRecords = records.filter((r) => {
    if (filterLevel !== "all" && r.ibLevel !== filterLevel) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.ibName.toLowerCase().includes(q) ||
        r.clientName.toLowerCase().includes(q) ||
        r.orderId.toLowerCase().includes(q) ||
        r.symbol.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: records.length,
    totalCommission: records
      .filter((r) => r.status !== "cancelled")
      .reduce((acc, r) => acc + r.commission, 0),
    pending: records.filter((r) => r.status === "pending").length,
    disputed: records.filter((r) => r.status === "disputed").length,
  };

  const columns: Column<CommissionRecord>[] = [
    {
      key: "ibLevel",
      title: "层级",
      width: "80px",
      render: (row) => {
        const cfg = levelConfig[row.ibLevel];
        return (
          <span className={cn("inline-flex items-center px-2 py-1 rounded-md text-xs font-bold", cfg.bg, cfg.color)}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "ibName",
      title: "IB名称",
      render: (row) => (
        <div>
          <p className="text-sm font-medium">{row.ibName}</p>
          <p className="text-xs text-gray-500 font-mono">{row.ibId}</p>
        </div>
      ),
    },
    {
      key: "clientName",
      title: "客户",
      render: (row) => (
        <div>
          <p className="text-sm">{row.clientName}</p>
          <p className="text-xs text-gray-500 font-mono">{row.clientId}</p>
        </div>
      ),
    },
    {
      key: "symbol",
      title: "品种/订单",
      width: "140px",
      render: (row) => (
        <div>
          <p className="text-sm font-medium">{row.symbol}</p>
          <p className="text-xs text-gray-500 font-mono">{row.orderId}</p>
        </div>
      ),
    },
    {
      key: "volume",
      title: "交易量",
      width: "90px",
      align: "right",
      render: (row) => <span className="text-sm font-mono">{row.volume.toFixed(2)} lot</span>,
    },
    {
      key: "commission",
      title: "佣金",
      width: "100px",
      align: "right",
      render: (row) => (
        <span className={cn("text-sm font-bold", row.status === "cancelled" ? "text-gray-400 line-through" : "text-emerald-600")}>
          ${row.commission.toFixed(2)}
        </span>
      ),
    },
    {
      key: "status",
      title: "状态",
      width: "100px",
      render: (row) => {
        const cfg = statusConfig[row.status];
        return (
          <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium", cfg.bg, cfg.color)}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "tradeDate",
      title: "交易时间",
      width: "150px",
      render: (row) => <span className="text-sm text-gray-500">{row.tradeDate}</span>,
    },
  ];

  const rowActions: RowAction<CommissionRecord>[] = [
    {
      label: "查看详情",
      icon: <DollarSign className="w-4 h-4" />,
      onClick: (row) => setSelectedRecord(row),
    },
    {
      label: "结算",
      icon: <CheckCircle className="w-4 h-4" />,
      onClick: () => {},
      disabled: (row) => row.status !== "pending",
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "返佣" }, { label: "佣金记录" }]} />

      <PageHeader
        title="佣金记录"
        description="查看和管理IB佣金发放记录"
        actions={
          <Button variant="secondary">
            <Filter className="w-4 h-4" />
            导出报表
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{records.length}</p>
              <p className="text-sm text-gray-500">总记录</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">${stats.totalCommission.toFixed(2)}</p>
              <p className="text-sm text-gray-500">佣金总额</p>
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
              <p className="text-sm text-gray-500">待结算</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.disputed}</p>
              <p className="text-sm text-gray-500">争议中</p>
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
            placeholder="搜索IB、客户、订单或品种..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as typeof filterLevel)}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部层级</option>
            <option value="L1">L1</option>
            <option value="L2">L2</option>
            <option value="L3">L3</option>
            <option value="Platform">平台</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部状态</option>
            <option value="pending">待结算</option>
            <option value="paid">已结算</option>
            <option value="disputed">争议中</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <EnhancedDataTable
        columns={columns}
        data={filteredRecords}
        keyExtractor={(row) => row.id}
        searchable={false}
        rowActions={rowActions}
        onRowClick={setSelectedRecord}
        emptyText="暂无佣金记录"
      />

      {/* Detail Modal */}
      {selectedRecord && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedRecord(null)} />
          <div className="fixed inset-x-4 top-[10%] max-w-lg mx-auto bg-white rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">佣金详情</h2>
                <p className="text-sm text-gray-500 font-mono">{selectedRecord.id}</p>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="text-center p-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white">
                <p className="text-sm opacity-80">佣金金额</p>
                <p className="text-4xl font-bold mt-1">${selectedRecord.commission.toFixed(2)}</p>
                <p className="text-sm opacity-80 mt-1">{selectedRecord.currency}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">IB</p>
                  <p className="text-sm font-medium">{selectedRecord.ibName}</p>
                  <p className="text-xs text-gray-500 font-mono">{selectedRecord.ibId}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">层级</p>
                  <span className={cn("text-sm font-bold", levelConfig[selectedRecord.ibLevel].color)}>
                    {levelConfig[selectedRecord.ibLevel].label}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">客户</p>
                  <p className="text-sm font-medium">{selectedRecord.clientName}</p>
                  <p className="text-xs text-gray-500 font-mono">{selectedRecord.clientId}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">订单</p>
                  <p className="text-sm font-mono">{selectedRecord.orderId}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">品种</p>
                  <p className="text-sm font-medium">{selectedRecord.symbol}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">交易量</p>
                  <p className="text-sm font-medium">{selectedRecord.volume.toFixed(2)} lot</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">交易时间</p>
                  <p className="text-sm">{selectedRecord.tradeDate}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">结算时间</p>
                  <p className="text-sm">{selectedRecord.settlementDate || "-"}</p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">状态</p>
                <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium", statusConfig[selectedRecord.status].bg, statusConfig[selectedRecord.status].color)}>
                  {statusConfig[selectedRecord.status].label}
                </span>
              </div>

              {selectedRecord.notes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-600 mb-1">备注</p>
                  <p className="text-sm text-amber-800">{selectedRecord.notes}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 p-6 border-t bg-gray-50">
              {selectedRecord.status === "pending" && (
                <Button className="flex-1">
                  <Wallet className="w-4 h-4" />
                  结算佣金
                </Button>
              )}
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedRecord(null)}>
                关闭
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
