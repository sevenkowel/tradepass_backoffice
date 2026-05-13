"use client";

import { useState } from "react";
import {
  Users,
  Search,
  Plus,
  Settings,
  BarChart3,
  Shield,
  X,
  Edit3,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { EnhancedDataTable, Column, RowAction } from "@/components/crm/ui/EnhancedDataTable";
import { cn } from "@/lib/utils";

// Types
interface AccountGroup {
  id: string;
  name: string;
  description: string;
  accountCount: number;
  maxLeverage: string;
  spreadType: "fixed" | "variable" | "raw";
  commission: number;
  execution: "STP" | "ECN" | "MM";
  marginCall: number;
  stopOut: number;
  swapFree: boolean;
  hedging: boolean;
  scalping: boolean;
  status: "active" | "inactive";
  symbols: string[];
}

// Mock data
const mockGroups: AccountGroup[] = [
  {
    id: "GRP001",
    name: "Standard",
    description: "标准账户组，适合大多数交易者",
    accountCount: 2341,
    maxLeverage: "1:500",
    spreadType: "variable",
    commission: 0,
    execution: "STP",
    marginCall: 100,
    stopOut: 50,
    swapFree: false,
    hedging: true,
    scalping: true,
    status: "active",
    symbols: ["Forex", "Crypto", "Indices", "Commodities"],
  },
  {
    id: "GRP002",
    name: "ECN Pro",
    description: "ECN原始点差，低佣金，适合高频交易者",
    accountCount: 567,
    maxLeverage: "1:200",
    spreadType: "raw",
    commission: 7,
    execution: "ECN",
    marginCall: 100,
    stopOut: 50,
    swapFree: false,
    hedging: true,
    scalping: true,
    status: "active",
    symbols: ["Forex", "Crypto", "Indices", "Commodities", "Stocks"],
  },
  {
    id: "GRP003",
    name: "Islamic",
    description: "无隔夜利息账户，符合伊斯兰教法",
    accountCount: 123,
    maxLeverage: "1:500",
    spreadType: "variable",
    commission: 0,
    execution: "STP",
    marginCall: 100,
    stopOut: 50,
    swapFree: true,
    hedging: true,
    scalping: true,
    status: "active",
    symbols: ["Forex", "Indices", "Commodities"],
  },
  {
    id: "GRP004",
    name: "VIP",
    description: "VIP客户专属，更低点差和更高杠杆",
    accountCount: 45,
    maxLeverage: "1:1000",
    spreadType: "raw",
    commission: 3,
    execution: "ECN",
    marginCall: 100,
    stopOut: 30,
    swapFree: false,
    hedging: true,
    scalping: true,
    status: "active",
    symbols: ["Forex", "Crypto", "Indices", "Commodities", "Stocks", "Futures"],
  },
  {
    id: "GRP005",
    name: "Demo",
    description: "模拟账户组，用于练习交易",
    accountCount: 890,
    maxLeverage: "1:500",
    spreadType: "fixed",
    commission: 0,
    execution: "MM",
    marginCall: 100,
    stopOut: 50,
    swapFree: false,
    hedging: true,
    scalping: true,
    status: "active",
    symbols: ["Forex", "Crypto", "Indices"],
  },
  {
    id: "GRP006",
    name: "Cent",
    description: "美分账户，适合小额入金交易者",
    accountCount: 678,
    maxLeverage: "1:1000",
    spreadType: "fixed",
    commission: 0,
    execution: "STP",
    marginCall: 100,
    stopOut: 50,
    swapFree: false,
    hedging: false,
    scalping: true,
    status: "active",
    symbols: ["Forex"],
  },
];

const executionConfig = {
  STP: { label: "STP", color: "text-blue-600", bg: "bg-blue-100" },
  ECN: { label: "ECN", color: "text-emerald-600", bg: "bg-emerald-100" },
  MM: { label: "MM", color: "text-gray-600", bg: "bg-gray-100" },
};

const spreadConfig = {
  fixed: { label: "固定", color: "text-blue-600", bg: "bg-blue-100" },
  variable: { label: "浮动", color: "text-amber-600", bg: "bg-amber-100" },
  raw: { label: "原始", color: "text-emerald-600", bg: "bg-emerald-100" },
};

export default function AccountGroupsPage() {
  const [groups] = useState<AccountGroup[]>(mockGroups);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<AccountGroup | null>(null);

  const filteredGroups = groups.filter((g) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: groups.length,
    totalAccounts: groups.reduce((acc, g) => acc + g.accountCount, 0),
    active: groups.filter((g) => g.status === "active").length,
    ecnGroups: groups.filter((g) => g.execution === "ECN").length,
  };

  const columns: Column<AccountGroup>[] = [
    {
      key: "name",
      title: "分组名称",
      render: (row) => (
        <div>
          <p className="text-sm font-medium">{row.name}</p>
          <p className="text-xs text-gray-500">{row.id}</p>
        </div>
      ),
    },
    {
      key: "accountCount",
      title: "账户数",
      width: "90px",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm font-medium">{row.accountCount.toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: "maxLeverage",
      title: "最大杠杆",
      width: "100px",
      render: (row) => <span className="text-sm font-mono font-medium">{row.maxLeverage}</span>,
    },
    {
      key: "spreadType",
      title: "点差类型",
      width: "90px",
      render: (row) => {
        const cfg = spreadConfig[row.spreadType];
        return (
          <span className={cn("inline-flex items-center px-2 py-1 rounded-md text-xs font-medium", cfg.bg, cfg.color)}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "commission",
      title: "佣金",
      width: "80px",
      align: "right",
      render: (row) => (
        <span className={cn("text-sm", row.commission > 0 ? "text-gray-900" : "text-gray-400")}>
          {row.commission > 0 ? `$${row.commission}/lot` : "免佣"}
        </span>
      ),
    },
    {
      key: "execution",
      title: "执行模式",
      width: "90px",
      render: (row) => {
        const cfg = executionConfig[row.execution];
        return (
          <span className={cn("inline-flex items-center px-2 py-1 rounded-md text-xs font-medium", cfg.bg, cfg.color)}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "features",
      title: "特性",
      width: "140px",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.swapFree && (
            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px]">免隔夜</span>
          )}
          {row.hedging && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">对冲</span>
          )}
          {row.scalping && (
            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px]">剥头皮</span>
          )}
        </div>
      ),
    },
  ];

  const rowActions: RowAction<AccountGroup>[] = [
    {
      label: "编辑",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: (row) => setSelectedGroup(row),
    },
    {
      label: "删除",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => {},
      variant: "danger",
      disabled: (row) => row.accountCount > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "账户" }, { label: "账户分组" }]} />

      <PageHeader
        title="账户分组"
        description="管理MT交易账户分组和交易参数配置"
        actions={
          <Button>
            <Plus className="w-4 h-4" />
            新建分组
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Settings className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-500">分组数</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalAccounts.toLocaleString()}</p>
              <p className="text-sm text-gray-500">总账户数</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
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
              <Shield className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-violet-600">{stats.ecnGroups}</p>
              <p className="text-sm text-gray-500">ECN分组</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索分组名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <EnhancedDataTable
        columns={columns}
        data={filteredGroups}
        keyExtractor={(row) => row.id}
        searchable={false}
        rowActions={rowActions}
        onRowClick={setSelectedGroup}
        emptyText="暂无账户分组"
      />

      {/* Detail Modal */}
      {selectedGroup && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedGroup(null)} />
          <div className="fixed inset-x-4 top-[10%] max-w-lg mx-auto bg-white rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">{selectedGroup.name}</h2>
                <p className="text-sm text-gray-500">{selectedGroup.description}</p>
              </div>
              <button onClick={() => setSelectedGroup(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">账户数</p>
                  <p className="text-lg font-bold">{selectedGroup.accountCount.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">最大杠杆</p>
                  <p className="text-lg font-bold font-mono">{selectedGroup.maxLeverage}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">点差类型</p>
                  <span className={cn("text-sm font-medium", spreadConfig[selectedGroup.spreadType].color)}>
                    {spreadConfig[selectedGroup.spreadType].label}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">佣金</p>
                  <p className="text-lg font-bold">
                    {selectedGroup.commission > 0 ? `$${selectedGroup.commission}/lot` : "免佣"}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">执行模式</p>
                  <span className={cn("text-sm font-medium", executionConfig[selectedGroup.execution].color)}>
                    {executionConfig[selectedGroup.execution].label}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">保证金/强平</p>
                  <p className="text-sm font-medium">{selectedGroup.marginCall}% / {selectedGroup.stopOut}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">交易品种</p>
                <div className="flex flex-wrap gap-2">
                  {selectedGroup.symbols.map((s) => (
                    <span key={s} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">特性</p>
                <div className="flex flex-wrap gap-2">
                  <span className={cn("px-3 py-1.5 rounded-lg text-sm", selectedGroup.swapFree ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-400")}>
                    免隔夜利息
                  </span>
                  <span className={cn("px-3 py-1.5 rounded-lg text-sm", selectedGroup.hedging ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400")}>
                    允许对冲
                  </span>
                  <span className={cn("px-3 py-1.5 rounded-lg text-sm", selectedGroup.scalping ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400")}>
                    允许剥头皮
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-6 border-t bg-gray-50">
              <Button className="flex-1">
                <Edit3 className="w-4 h-4" />
                编辑分组
              </Button>
              {selectedGroup.accountCount === 0 && (
                <Button variant="danger" className="flex-1">
                  <Trash2 className="w-4 h-4" />
                  删除分组
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
