"use client";

import { useState } from "react";
import {
  Tag,
  Search,
  Plus,
  Users,
  Filter,
  X,
  Trash2,
  Edit3,
  Hash,
  Palette,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { EnhancedDataTable, Column, RowAction } from "@/components/crm/ui/EnhancedDataTable";
import { cn } from "@/lib/utils";

// Types
interface UserTag {
  id: string;
  name: string;
  color: string;
  description: string;
  userCount: number;
  conditions: string;
  createdAt: string;
  updatedAt: string;
  isSystem: boolean;
}

// Mock data
const mockTags: UserTag[] = [
  {
    id: "TAG001",
    name: "高净值客户",
    color: "#8B5CF6",
    description: "账户净值超过 $50,000 的客户",
    userCount: 128,
    conditions: "净值 >= $50,000",
    createdAt: "2024-01-15",
    updatedAt: "2024-03-10",
    isSystem: true,
  },
  {
    id: "TAG002",
    name: "活跃交易者",
    color: "#10B981",
    description: "月均交易量超过 100 手的客户",
    userCount: 342,
    conditions: "月均交易量 >= 100手",
    createdAt: "2024-01-20",
    updatedAt: "2024-03-12",
    isSystem: true,
  },
  {
    id: "TAG003",
    name: "新手保护",
    color: "#F59E0B",
    description: "注册不满30天且首次入金的客户",
    userCount: 89,
    conditions: "注册时间 < 30天",
    createdAt: "2024-02-01",
    updatedAt: "2024-03-08",
    isSystem: true,
  },
  {
    id: "TAG004",
    name: "VIP",
    color: "#EF4444",
    description: "累计入金超过 $100,000 的顶级客户",
    userCount: 23,
    conditions: "累计入金 >= $100,000",
    createdAt: "2024-02-10",
    updatedAt: "2024-03-15",
    isSystem: false,
  },
  {
    id: "TAG005",
    name: "休眠账户",
    color: "#6B7280",
    description: "超过90天未登录或交易",
    userCount: 567,
    conditions: "最后活跃时间 > 90天",
    createdAt: "2024-02-15",
    updatedAt: "2024-03-14",
    isSystem: true,
  },
  {
    id: "TAG006",
    name: "促销活动",
    color: "#3B82F6",
    description: "参与Q1入金赠金活动的客户",
    userCount: 210,
    conditions: "手动标记",
    createdAt: "2024-03-01",
    updatedAt: "2024-03-20",
    isSystem: false,
  },
  {
    id: "TAG007",
    name: "KYC待完善",
    color: "#EC4899",
    description: "KYC信息不完整或待审核",
    userCount: 45,
    conditions: "KYC状态 != completed",
    createdAt: "2024-03-05",
    updatedAt: "2024-03-18",
    isSystem: true,
  },
];

export default function UserTagsPage() {
  const [tags] = useState<UserTag[]>(mockTags);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<UserTag | null>(null);

  const filteredTags = tags.filter((tag) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        tag.name.toLowerCase().includes(q) ||
        tag.description.toLowerCase().includes(q) ||
        tag.conditions.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: tags.length,
    system: tags.filter((t) => t.isSystem).length,
    custom: tags.filter((t) => !t.isSystem).length,
    totalUsers: tags.reduce((acc, t) => acc + t.userCount, 0),
  };

  const columns: Column<UserTag>[] = [
    {
      key: "name",
      title: "标签名称",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${row.color}20` }}
          >
            <Tag className="w-4 h-4" style={{ color: row.color }} />
          </div>
          <div>
            <p className="text-sm font-medium">{row.name}</p>
            <p className="text-xs text-gray-500">{row.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "description",
      title: "描述",
      render: (row) => <span className="text-sm text-gray-600">{row.description}</span>,
    },
    {
      key: "userCount",
      title: "用户数量",
      width: "110px",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm font-medium">{row.userCount}</span>
        </div>
      ),
    },
    {
      key: "conditions",
      title: "条件",
      width: "160px",
      render: (row) => (
        <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600">
          <Hash className="w-3 h-3 mr-1" />
          {row.conditions}
        </span>
      ),
    },
    {
      key: "isSystem",
      title: "类型",
      width: "90px",
      render: (row) => (
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
            row.isSystem
              ? "bg-blue-100 text-blue-600"
              : "bg-gray-100 text-gray-600"
          )}
        >
          {row.isSystem ? "系统" : "自定义"}
        </span>
      ),
    },
    {
      key: "updatedAt",
      title: "更新时间",
      width: "120px",
      render: (row) => <span className="text-sm text-gray-500">{row.updatedAt}</span>,
    },
  ];

  const rowActions: RowAction<UserTag>[] = [
    {
      label: "编辑",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: (row) => setSelectedTag(row),
    },
    {
      label: "删除",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => {},
      variant: "danger",
      disabled: (row) => row.isSystem,
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "用户" }, { label: "用户标签" }]} />

      <PageHeader
        title="用户标签"
        description="管理用户分群标签，用于精准营销和分析"
        actions={
          <Button>
            <Plus className="w-4 h-4" />
            新建标签
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Tag className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-500">总标签数</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Filter className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.system}</p>
              <p className="text-sm text-gray-500">系统标签</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <Palette className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-violet-600">{stats.custom}</p>
              <p className="text-sm text-gray-500">自定义标签</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.totalUsers}</p>
              <p className="text-sm text-gray-500">标签覆盖用户</p>
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
            placeholder="搜索标签名称或描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <EnhancedDataTable
        columns={columns}
        data={filteredTags}
        keyExtractor={(row) => row.id}
        searchable={false}
        rowActions={rowActions}
        onRowClick={setSelectedTag}
        emptyText="暂无用户标签"
      />

      {/* Detail Modal */}
      {selectedTag && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedTag(null)} />
          <div className="fixed inset-x-4 top-[10%] max-w-lg mx-auto bg-white rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${selectedTag.color}20` }}
                >
                  <Tag className="w-5 h-5" style={{ color: selectedTag.color }} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{selectedTag.name}</h2>
                  <p className="text-sm text-gray-500 font-mono">{selectedTag.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTag(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">描述</p>
                <p className="text-sm">{selectedTag.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">用户数量</p>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-lg font-bold">{selectedTag.userCount}</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">类型</p>
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                      selectedTag.isSystem
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {selectedTag.isSystem ? "系统标签" : "自定义标签"}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">条件</p>
                  <span className="inline-flex items-center text-sm">
                    <Hash className="w-3 h-3 mr-1 text-gray-400" />
                    {selectedTag.conditions}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">颜色</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: selectedTag.color }}
                    />
                    <span className="text-sm font-mono">{selectedTag.color}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">创建时间</p>
                  <p className="text-sm">{selectedTag.createdAt}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">更新时间</p>
                  <p className="text-sm">{selectedTag.updatedAt}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-6 border-t bg-gray-50">
              <Button className="flex-1">
                <Edit3 className="w-4 h-4" />
                编辑标签
              </Button>
              {!selectedTag.isSystem && (
                <Button variant="danger" className="flex-1">
                  <Trash2 className="w-4 h-4" />
                  删除标签
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
