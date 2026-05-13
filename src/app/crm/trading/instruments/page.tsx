"use client";

import { useState } from "react";
import {
  BarChart3,
  Search,
  Plus,
  TrendingUp,
  DollarSign,
  Globe,
  Bitcoin,
  Wheat,
  Factory,
  X,
  Edit3,
  Eye,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { EnhancedDataTable, Column, RowAction } from "@/components/crm/ui/EnhancedDataTable";
import { cn } from "@/lib/utils";

// Types
interface Instrument {
  id: string;
  symbol: string;
  name: string;
  category: "forex" | "crypto" | "indices" | "commodities" | "stocks";
  spread: number;
  commission: number;
  swapLong: number;
  swapShort: number;
  contractSize: number;
  minVolume: number;
  maxVolume: number;
  volumeStep: number;
  marginRequirement: number;
  isActive: boolean;
  tradingHours: string;
}

// Mock data
const mockInstruments: Instrument[] = [
  {
    id: "INST001",
    symbol: "EURUSD",
    name: "EUR/USD",
    category: "forex",
    spread: 0.1,
    commission: 0,
    swapLong: -5.2,
    swapShort: 2.1,
    contractSize: 100000,
    minVolume: 0.01,
    maxVolume: 100,
    volumeStep: 0.01,
    marginRequirement: 0.2,
    isActive: true,
    tradingHours: "Mon 00:00 - Fri 23:59",
  },
  {
    id: "INST002",
    symbol: "GBPUSD",
    name: "GBP/USD",
    category: "forex",
    spread: 0.2,
    commission: 0,
    swapLong: -6.5,
    swapShort: 3.2,
    contractSize: 100000,
    minVolume: 0.01,
    maxVolume: 100,
    volumeStep: 0.01,
    marginRequirement: 0.2,
    isActive: true,
    tradingHours: "Mon 00:00 - Fri 23:59",
  },
  {
    id: "INST003",
    symbol: "BTCUSD",
    name: "Bitcoin/USD",
    category: "crypto",
    spread: 12.5,
    commission: 0,
    swapLong: -50,
    swapShort: -50,
    contractSize: 1,
    minVolume: 0.01,
    maxVolume: 10,
    volumeStep: 0.01,
    marginRequirement: 5,
    isActive: true,
    tradingHours: "24/7",
  },
  {
    id: "INST004",
    symbol: "XAUUSD",
    name: "Gold/USD",
    category: "commodities",
    spread: 0.15,
    commission: 0,
    swapLong: -8.5,
    swapShort: 4.2,
    contractSize: 100,
    minVolume: 0.01,
    maxVolume: 50,
    volumeStep: 0.01,
    marginRequirement: 0.5,
    isActive: true,
    tradingHours: "Mon 01:00 - Fri 23:59",
  },
  {
    id: "INST005",
    symbol: "US30",
    name: "US Wall Street 30",
    category: "indices",
    spread: 1.5,
    commission: 0,
    swapLong: -25,
    swapShort: -25,
    contractSize: 1,
    minVolume: 0.1,
    maxVolume: 100,
    volumeStep: 0.1,
    marginRequirement: 1,
    isActive: true,
    tradingHours: "Mon 01:00 - Fri 23:15",
  },
  {
    id: "INST006",
    symbol: "AAPL",
    name: "Apple Inc.",
    category: "stocks",
    spread: 0.05,
    commission: 0.02,
    swapLong: -5,
    swapShort: -5,
    contractSize: 1,
    minVolume: 1,
    maxVolume: 10000,
    volumeStep: 1,
    marginRequirement: 10,
    isActive: true,
    tradingHours: "Mon-Fri 16:30-23:00",
  },
];

const categoryConfig = {
  forex: { label: "外汇", icon: Globe, color: "text-blue-600", bg: "bg-blue-100" },
  crypto: { label: "加密货币", icon: Bitcoin, color: "text-amber-600", bg: "bg-amber-100" },
  indices: { label: "指数", icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-100" },
  commodities: { label: "商品", icon: Wheat, color: "text-emerald-600", bg: "bg-emerald-100" },
  stocks: { label: "股票", icon: Factory, color: "text-pink-600", bg: "bg-pink-100" },
};

export default function InstrumentsPage() {
  const [instruments] = useState<Instrument[]>(mockInstruments);
  const [filterCategory, setFilterCategory] = useState<"all" | Instrument["category"]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);

  const filteredInstruments = instruments.filter((i) => {
    if (filterCategory !== "all" && i.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: instruments.length,
    active: instruments.filter((i) => i.isActive).length,
    categories: new Set(instruments.map((i) => i.category)).size,
    avgSpread: (instruments.reduce((acc, i) => acc + i.spread, 0) / instruments.length).toFixed(2),
  };

  const columns: Column<Instrument>[] = [
    {
      key: "symbol",
      title: "品种",
      render: (row) => (
        <div className="flex items-center gap-3">
          {(() => {
            const cfg = categoryConfig[row.category];
            const Icon = cfg.icon;
            return (
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", cfg.bg)}>
                <Icon className={cn("w-4 h-4", cfg.color)} />
              </div>
            );
          })()}
          <div>
            <p className="text-sm font-bold font-mono">{row.symbol}</p>
            <p className="text-xs text-gray-500">{row.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      title: "分类",
      width: "90px",
      render: (row) => {
        const cfg = categoryConfig[row.category];
        return (
          <span className={cn("inline-flex items-center px-2 py-1 rounded-md text-xs font-medium", cfg.bg, cfg.color)}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "spread",
      title: "点差",
      width: "80px",
      align: "right",
      render: (row) => <span className="text-sm font-mono">{row.spread}</span>,
    },
    {
      key: "commission",
      title: "佣金",
      width: "80px",
      align: "right",
      render: (row) => <span className="text-sm">{row.commission > 0 ? `$${row.commission}` : "免佣"}</span>,
    },
    {
      key: "swap",
      title: "隔夜利息",
      width: "120px",
      render: (row) => (
        <div className="text-right text-xs">
          <span className={row.swapLong >= 0 ? "text-emerald-600" : "text-red-600"}>多: {row.swapLong}</span>
          <span className="mx-1 text-gray-300">|</span>
          <span className={row.swapShort >= 0 ? "text-emerald-600" : "text-red-600"}>空: {row.swapShort}</span>
        </div>
      ),
    },
    {
      key: "margin",
      title: "保证金",
      width: "90px",
      align: "right",
      render: (row) => <span className="text-sm font-mono">{row.marginRequirement}%</span>,
    },
    {
      key: "tradingHours",
      title: "交易时间",
      width: "160px",
      render: (row) => <span className="text-xs text-gray-500">{row.tradingHours}</span>,
    },
  ];

  const rowActions: RowAction<Instrument>[] = [
    {
      label: "查看详情",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => setSelectedInstrument(row),
    },
    {
      label: "编辑",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: (row) => setSelectedInstrument(row),
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "交易" }, { label: "交易品种" }]} />

      <PageHeader
        title="交易品种"
        description="管理交易品种及其交易参数"
        actions={
          <Button>
            <Plus className="w-4 h-4" />
            添加品种
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-500">总品种</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
              <p className="text-sm text-gray-500">已启用</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <Globe className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-violet-600">{stats.categories}</p>
              <p className="text-sm text-gray-500">分类数</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.avgSpread}</p>
              <p className="text-sm text-gray-500">平均点差</p>
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
            placeholder="搜索品种代码或名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "forex", "crypto", "indices", "commodities", "stocks"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg transition-colors",
                filterCategory === cat
                  ? "bg-slate-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {cat === "all" ? "全部" : categoryConfig[cat].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <EnhancedDataTable
        columns={columns}
        data={filteredInstruments}
        keyExtractor={(row) => row.id}
        searchable={false}
        rowActions={rowActions}
        onRowClick={setSelectedInstrument}
        emptyText="暂无交易品种"
      />

      {/* Detail Modal */}
      {selectedInstrument && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedInstrument(null)} />
          <div className="fixed inset-x-4 top-[10%] max-w-lg mx-auto bg-white rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                {(() => {
                  const cfg = categoryConfig[selectedInstrument.category];
                  const Icon = cfg.icon;
                  return (
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", cfg.bg)}>
                      <Icon className={cn("w-6 h-6", cfg.color)} />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-lg font-semibold font-mono">{selectedInstrument.symbol}</h2>
                  <p className="text-sm text-gray-500">{selectedInstrument.name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedInstrument(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">点差</p>
                  <p className="text-lg font-bold">{selectedInstrument.spread}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">佣金</p>
                  <p className="text-lg font-bold">{selectedInstrument.commission > 0 ? `$${selectedInstrument.commission}` : "免佣"}</p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-xs text-emerald-600 mb-1">隔夜利息（多）</p>
                  <p className={cn("text-lg font-bold", selectedInstrument.swapLong >= 0 ? "text-emerald-700" : "text-red-700")}>
                    {selectedInstrument.swapLong}
                  </p>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600 mb-1">隔夜利息（空）</p>
                  <p className={cn("text-lg font-bold", selectedInstrument.swapShort >= 0 ? "text-emerald-700" : "text-red-700")}>
                    {selectedInstrument.swapShort}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">合约大小</p>
                  <p className="text-sm font-medium">{selectedInstrument.contractSize.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">保证金要求</p>
                  <p className="text-sm font-medium">{selectedInstrument.marginRequirement}%</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">最小交易量</p>
                  <p className="text-sm font-medium">{selectedInstrument.minVolume} lot</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">最大交易量</p>
                  <p className="text-sm font-medium">{selectedInstrument.maxVolume} lot</p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">交易时间</p>
                <p className="text-sm">{selectedInstrument.tradingHours}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-6 border-t bg-gray-50">
              <Button className="flex-1">
                <Edit3 className="w-4 h-4" />
                编辑品种
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedInstrument(null)}>
                关闭
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
