"use client";

import { useState } from "react";
import {
  Shield,
  Ban,
  Clock,
  UserX,
  Globe,
  ShieldAlert,
  Search,
  Plus,
  AlertTriangle,
  X,
  Trash2,
} from "lucide-react";
import { Card, PageHeader, Button, EmptyState } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { EnhancedDataTable, Column, RowAction } from "@/components/crm/ui/EnhancedDataTable";
import { cn } from "@/lib/utils";

// Types
interface BlacklistEntry {
  id: string;
  type: "user" | "ip" | "device" | "email" | "entity";
  value: string;
  reason: string;
  category: "fraud" | "abuse" | "compliance" | "risk";
  addedAt: string;
  expiresAt?: string;
  addedBy: string;
  status: "active" | "expired" | "removed";
  notes?: string;
}

// Mock data
const mockBlacklist: BlacklistEntry[] = [
  {
    id: "BL001",
    type: "user",
    value: "USR-8823",
    reason: "可疑交易模式，涉嫌洗钱",
    category: "compliance",
    addedAt: "2024-03-15 10:00",
    addedBy: "admin_risk",
    status: "active",
    notes: "检测到频繁的大额出入金，触发 AML 规则",
  },
  {
    id: "BL002",
    type: "ip",
    value: "185.220.101.42",
    reason: "多次登录失败，疑似暴力破解",
    category: "abuse",
    addedAt: "2024-03-14 18:30",
    addedBy: "system",
    status: "active",
  },
  {
    id: "BL003",
    type: "email",
    value: "suspicious@tempmail.com",
    reason: "使用临时邮箱注册",
    category: "fraud",
    addedAt: "2024-03-13 09:15",
    addedBy: "admin_01",
    status: "active",
  },
  {
    id: "BL004",
    type: "entity",
    value: "Acme Trading Ltd",
    reason: "被列入制裁名单",
    category: "compliance",
    addedAt: "2024-03-10 14:00",
    addedBy: "compliance_team",
    status: "active",
    notes: "OFAC 制裁名单匹配",
  },
  {
    id: "BL005",
    type: "device",
    value: "fingerprint-a3f8...",
    reason: "关联多个被封禁账户",
    category: "fraud",
    addedAt: "2024-03-08 11:20",
    expiresAt: "2024-09-08 11:20",
    addedBy: "system",
    status: "active",
  },
  {
    id: "BL006",
    type: "user",
    value: "USR-3301",
    reason: "欺诈性出金申请",
    category: "fraud",
    addedAt: "2024-02-28 16:45",
    addedBy: "admin_02",
    status: "removed",
    notes: "已核实用户身份，误判解除",
  },
  {
    id: "BL007",
    type: "ip",
    value: "203.0.113.55",
    reason: "DDoS 攻击来源",
    category: "abuse",
    addedAt: "2024-02-20 08:00",
    expiresAt: "2024-03-20 08:00",
    addedBy: "system",
    status: "expired",
  },
];

const typeConfig = {
  user: { label: "用户", icon: UserX, color: "text-blue-600", bg: "bg-blue-100" },
  ip: { label: "IP", icon: Globe, color: "text-amber-600", bg: "bg-amber-100" },
  device: { label: "设备", icon: Shield, color: "text-violet-600", bg: "bg-violet-100" },
  email: { label: "邮箱", icon: ShieldAlert, color: "text-pink-600", bg: "bg-pink-100" },
  entity: { label: "实体", icon: Ban, color: "text-red-600", bg: "bg-red-100" },
};

const categoryConfig = {
  fraud: { label: "欺诈", color: "text-red-600", bg: "bg-red-100" },
  abuse: { label: "滥用", color: "text-amber-600", bg: "bg-amber-100" },
  compliance: { label: "Compliance", color: "text-blue-600", bg: "bg-blue-100" },
  risk: { label: "风险", color: "text-violet-600", bg: "bg-violet-100" },
};

const statusConfig = {
  active: { label: "生效中", color: "text-red-600", bg: "bg-red-100" },
  expired: { label: "已过期", color: "text-gray-500", bg: "bg-gray-100" },
  removed: { label: "已移除", color: "text-emerald-600", bg: "bg-emerald-100" },
};

export default function BlacklistPage() {
  const [entries] = useState<BlacklistEntry[]>(mockBlacklist);
  const [filterType, setFilterType] = useState<"all" | BlacklistEntry["type"]>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | BlacklistEntry["status"]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<BlacklistEntry | null>(null);

  const filteredEntries = entries.filter((entry) => {
    if (filterType !== "all" && entry.type !== filterType) return false;
    if (filterStatus !== "all" && entry.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        entry.value.toLowerCase().includes(q) ||
        entry.reason.toLowerCase().includes(q) ||
        entry.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: entries.length,
    active: entries.filter((e) => e.status === "active").length,
    fraud: entries.filter((e) => e.category === "fraud" && e.status === "active").length,
    expired: entries.filter((e) => e.status === "expired").length,
  };

  const columns: Column<BlacklistEntry>[] = [
    {
      key: "type",
      title: "类型",
      width: "120px",
      render: (row) => {
        const cfg = typeConfig[row.type];
        const Icon = cfg.icon;
        return (
          <div className="flex items-center gap-2">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", cfg.bg)}>
              <Icon className={cn("w-4 h-4", cfg.color)} />
            </div>
            <span className="text-sm font-medium">{cfg.label}</span>
          </div>
        );
      },
    },
    {
      key: "value",
      title: "黑名单值",
      render: (row) => (
        <div>
          <p className="font-mono text-sm font-medium">{row.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{row.id}</p>
        </div>
      ),
    },
    {
      key: "category",
      title: "分类",
      width: "100px",
      render: (row) => {
        const cfg = categoryConfig[row.category];
        return (
          <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium", cfg.bg, cfg.color)}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "reason",
      title: "原因",
      render: (row) => <span className="text-sm text-gray-700">{row.reason}</span>,
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
      key: "addedAt",
      title: "添加时间",
      width: "150px",
      render: (row) => (
        <div className="text-sm text-gray-500">
          <p>{row.addedAt}</p>
          {row.expiresAt && (
            <p className="text-xs mt-0.5">到期: {row.expiresAt}</p>
          )}
        </div>
      ),
    },
  ];

  const rowActions: RowAction<BlacklistEntry>[] = [
    {
      label: "查看详情",
      icon: <Shield className="w-4 h-4" />,
      onClick: (row) => setSelectedEntry(row),
    },
    {
      label: "移除",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => {},
      variant: "danger",
      disabled: (row) => row.status === "removed",
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Compliance" }, { label: "黑名单" }]} />

      <PageHeader
        title="黑名单管理"
        description="管理被禁止的用户、IP、设备和实体"
        actions={
          <Button>
            <Plus className="w-4 h-4" />
            添加黑名单
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
              <p className="text-sm text-gray-500">总记录</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Ban className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.active}</p>
              <p className="text-sm text-gray-500">生效中</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.fraud}</p>
              <p className="text-sm text-gray-500">欺诈类</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">{stats.expired}</p>
              <p className="text-sm text-gray-500">已过期</p>
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
            placeholder="搜索黑名单值、原因或ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部类型</option>
            <option value="user">用户</option>
            <option value="ip">IP</option>
            <option value="device">设备</option>
            <option value="email">邮箱</option>
            <option value="entity">实体</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部状态</option>
            <option value="active">生效中</option>
            <option value="expired">已过期</option>
            <option value="removed">已移除</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <EnhancedDataTable
        columns={columns}
        data={filteredEntries}
        keyExtractor={(row) => row.id}
        searchable={false}
        rowActions={rowActions}
        onRowClick={setSelectedEntry}
        emptyText="暂无黑名单记录"
        emptyIcon={<Shield className="w-8 h-8 text-gray-300" />}
      />

      {/* Detail Modal */}
      {selectedEntry && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedEntry(null)}
          />
          <div className="fixed inset-x-4 top-[10%] max-w-lg mx-auto bg-white rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">黑名单详情</h2>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3">
                {(() => {
                  const cfg = typeConfig[selectedEntry.type];
                  const Icon = cfg.icon;
                  return (
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", cfg.bg)}>
                      <Icon className={cn("w-6 h-6", cfg.color)} />
                    </div>
                  );
                })()}
                <div>
                  <p className="text-lg font-mono font-medium">{selectedEntry.value}</p>
                  <p className="text-sm text-gray-500">{selectedEntry.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">分类</p>
                  <span className={cn("text-sm font-medium", categoryConfig[selectedEntry.category].color)}>
                    {categoryConfig[selectedEntry.category].label}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">状态</p>
                  <span className={cn("text-sm font-medium", statusConfig[selectedEntry.status].color)}>
                    {statusConfig[selectedEntry.status].label}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">添加人</p>
                  <p className="text-sm font-medium">{selectedEntry.addedBy}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">添加时间</p>
                  <p className="text-sm font-medium">{selectedEntry.addedAt}</p>
                </div>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600 mb-1">封禁原因</p>
                <p className="text-sm text-red-800">{selectedEntry.reason}</p>
              </div>

              {selectedEntry.notes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">备注</p>
                  <p className="text-sm">{selectedEntry.notes}</p>
                </div>
              )}

              {selectedEntry.expiresAt && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <p className="text-sm text-amber-700">到期时间: {selectedEntry.expiresAt}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 p-6 border-t bg-gray-50">
              {selectedEntry.status === "active" && (
                <Button variant="danger" className="flex-1">
                  <Trash2 className="w-4 h-4" />
                  移除黑名单
                </Button>
              )}
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedEntry(null)}>
                关闭
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
