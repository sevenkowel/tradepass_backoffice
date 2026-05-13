"use client";

import { useState } from "react";
import {
  Trophy,
  Search,
  Plus,
  Users,
  Star,
  ArrowUpRight,
  DollarSign,
  BarChart3,
  X,
  Edit3,
  Trash2,
  Crown,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { EnhancedDataTable, Column, RowAction } from "@/components/crm/ui/EnhancedDataTable";
import { cn } from "@/lib/utils";

// Types
interface UserLevel {
  id: string;
  name: string;
  level: number;
  color: string;
  icon: string;
  minDeposit: number;
  minVolume: number;
  spreadDiscount: number;
  commissionDiscount: number;
  withdrawalPriority: number;
  dedicatedManager: boolean;
  exclusiveEvents: boolean;
  userCount: number;
  description: string;
  benefits: string[];
}

// Mock data
const mockLevels: UserLevel[] = [
  {
    id: "LVL001",
    name: "普通会员",
    level: 1,
    color: "#6B7280",
    icon: "user",
    minDeposit: 0,
    minVolume: 0,
    spreadDiscount: 0,
    commissionDiscount: 0,
    withdrawalPriority: 1,
    dedicatedManager: false,
    exclusiveEvents: false,
    userCount: 3421,
    description: "所有注册用户默认等级",
    benefits: ["标准点差", "标准出金时效"],
  },
  {
    id: "LVL002",
    name: "白银会员",
    level: 2,
    color: "#94A3B8",
    icon: "silver",
    minDeposit: 1000,
    minVolume: 10,
    spreadDiscount: 5,
    commissionDiscount: 5,
    withdrawalPriority: 2,
    dedicatedManager: false,
    exclusiveEvents: false,
    userCount: 1234,
    description: "入金超过 $1,000 或月交易 10 手以上",
    benefits: ["点差优惠5%", "佣金优惠5%", "优先出金"],
  },
  {
    id: "LVL003",
    name: "黄金会员",
    level: 3,
    color: "#F59E0B",
    icon: "gold",
    minDeposit: 5000,
    minVolume: 50,
    spreadDiscount: 10,
    commissionDiscount: 10,
    withdrawalPriority: 3,
    dedicatedManager: true,
    exclusiveEvents: false,
    userCount: 456,
    description: "入金超过 $5,000 或月交易 50 手以上",
    benefits: ["点差优惠10%", "佣金优惠10%", "专属客户经理", "优先出金"],
  },
  {
    id: "LVL004",
    name: "铂金会员",
    level: 4,
    color: "#3B82F6",
    icon: "platinum",
    minDeposit: 20000,
    minVolume: 200,
    spreadDiscount: 15,
    commissionDiscount: 15,
    withdrawalPriority: 4,
    dedicatedManager: true,
    exclusiveEvents: true,
    userCount: 89,
    description: "入金超过 $20,000 或月交易 200 手以上",
    benefits: ["点差优惠15%", "佣金优惠15%", "专属客户经理", "VIP活动", "极速出金"],
  },
  {
    id: "LVL005",
    name: "钻石会员",
    level: 5,
    color: "#8B5CF6",
    icon: "diamond",
    minDeposit: 100000,
    minVolume: 1000,
    spreadDiscount: 25,
    commissionDiscount: 25,
    withdrawalPriority: 5,
    dedicatedManager: true,
    exclusiveEvents: true,
    userCount: 12,
    description: "入金超过 $100,000 或月交易 1000 手以上",
    benefits: ["点差优惠25%", "佣金优惠25%", "专属客户经理", "VIP活动", "极速出金", "定制化服务"],
  },
];

export default function UserLevelsPage() {
  const [levels] = useState<UserLevel[]>(mockLevels);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<UserLevel | null>(null);

  const filteredLevels = levels.filter((level) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return level.name.toLowerCase().includes(q) || level.description.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: levels.length,
    totalUsers: levels.reduce((acc, l) => acc + l.userCount, 0),
    vipUsers: levels.filter((l) => l.level >= 4).reduce((acc, l) => acc + l.userCount, 0),
    avgDiscount: Math.round(levels.reduce((acc, l) => acc + l.spreadDiscount, 0) / levels.length),
  };

  const columns: Column<UserLevel>[] = [
    {
      key: "level",
      title: "等级",
      width: "80px",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${row.color}20` }}
          >
            <span className="text-sm font-bold" style={{ color: row.color }}>
              {row.level}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "name",
      title: "等级名称",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4" style={{ color: row.color }} />
          <span className="text-sm font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      key: "userCount",
      title: "用户数",
      width: "100px",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm font-medium">{row.userCount.toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: "minDeposit",
      title: "最低入金",
      width: "120px",
      align: "right",
      render: (row) => (
        <span className="text-sm font-medium">
          {row.minDeposit > 0 ? `$${row.minDeposit.toLocaleString()}` : "-"}
        </span>
      ),
    },
    {
      key: "minVolume",
      title: "最低交易量",
      width: "120px",
      align: "right",
      render: (row) => (
        <span className="text-sm font-medium">
          {row.minVolume > 0 ? `${row.minVolume} 手/月` : "-"}
        </span>
      ),
    },
    {
      key: "spreadDiscount",
      title: "点差优惠",
      width: "100px",
      align: "right",
      render: (row) => (
        <span className={cn("text-sm font-bold", row.spreadDiscount > 0 ? "text-emerald-600" : "text-gray-400")}>
          {row.spreadDiscount > 0 ? `${row.spreadDiscount}%` : "-"}
        </span>
      ),
    },
    {
      key: "commissionDiscount",
      title: "佣金优惠",
      width: "100px",
      align: "right",
      render: (row) => (
        <span className={cn("text-sm font-bold", row.commissionDiscount > 0 ? "text-emerald-600" : "text-gray-400")}>
          {row.commissionDiscount > 0 ? `${row.commissionDiscount}%` : "-"}
        </span>
      ),
    },
    {
      key: "withdrawalPriority",
      title: "出金优先级",
      width: "110px",
      render: (row) => (
        <div className="flex items-center gap-1">
          {Array.from({ length: row.withdrawalPriority }).map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          ))}
        </div>
      ),
    },
  ];

  const rowActions: RowAction<UserLevel>[] = [
    {
      label: "编辑",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: (row) => setSelectedLevel(row),
    },
    {
      label: "删除",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => {},
      variant: "danger",
      disabled: (row) => row.level <= 1,
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "用户" }, { label: "用户等级" }]} />

      <PageHeader
        title="用户等级"
        description="配置用户等级体系和各等级权益"
        actions={
          <Button>
            <Plus className="w-4 h-4" />
            新建等级
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-500">等级数</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-sm text-gray-500">总用户</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <Crown className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-violet-600">{stats.vipUsers}</p>
              <p className="text-sm text-gray-500">VIP用户</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.avgDiscount}%</p>
              <p className="text-sm text-gray-500">平均优惠</p>
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
            placeholder="搜索等级名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <EnhancedDataTable
        columns={columns}
        data={filteredLevels}
        keyExtractor={(row) => row.id}
        searchable={false}
        rowActions={rowActions}
        onRowClick={setSelectedLevel}
        emptyText="暂无用户等级"
      />

      {/* Detail Modal */}
      {selectedLevel && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedLevel(null)} />
          <div className="fixed inset-x-4 top-[10%] max-w-lg mx-auto bg-white rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${selectedLevel.color}20` }}
                >
                  <Crown className="w-6 h-6" style={{ color: selectedLevel.color }} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{selectedLevel.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500 font-mono">{selectedLevel.id}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      Level {selectedLevel.level}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedLevel(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">描述</p>
                <p className="text-sm">{selectedLevel.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">用户数</p>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-lg font-bold">{selectedLevel.userCount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">最低入金</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-lg font-bold">
                      {selectedLevel.minDeposit > 0 ? `$${selectedLevel.minDeposit.toLocaleString()}` : "无限制"}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">最低交易量</p>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                    <span className="text-lg font-bold">
                      {selectedLevel.minVolume > 0 ? `${selectedLevel.minVolume} 手/月` : "无限制"}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">出金优先级</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: selectedLevel.withdrawalPriority }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-xs text-emerald-600 mb-1">点差优惠</p>
                  <p className="text-2xl font-bold text-emerald-700">{selectedLevel.spreadDiscount}%</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-600 mb-1">佣金优惠</p>
                  <p className="text-2xl font-bold text-blue-700">{selectedLevel.commissionDiscount}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">权益</p>
                <div className="flex flex-wrap gap-2">
                  {selectedLevel.benefits.map((benefit, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                      {benefit}
                    </span>
                  ))}
                  {selectedLevel.dedicatedManager && (
                    <span className="inline-flex items-center px-3 py-1.5 bg-violet-100 rounded-lg text-sm text-violet-700">
                      <Star className="w-3.5 h-3.5 mr-1" />
                      专属客户经理
                    </span>
                  )}
                  {selectedLevel.exclusiveEvents && (
                    <span className="inline-flex items-center px-3 py-1.5 bg-amber-100 rounded-lg text-sm text-amber-700">
                      <Trophy className="w-3.5 h-3.5 mr-1" />
                      VIP专属活动
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-6 border-t bg-gray-50">
              <Button className="flex-1">
                <Edit3 className="w-4 h-4" />
                编辑等级
              </Button>
              {selectedLevel.level > 1 && (
                <Button variant="danger" className="flex-1">
                  <Trash2 className="w-4 h-4" />
                  删除等级
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
