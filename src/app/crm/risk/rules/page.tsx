"use client";

import { useState } from "react";
import {
  Shield,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Clock,
  X,
  Edit3,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { EnhancedDataTable, Column, RowAction } from "@/components/crm/ui/EnhancedDataTable";
import { cn } from "@/lib/utils";

// Types
interface RiskRule {
  id: string;
  name: string;
  description: string;
  category: "trading" | "funds" | "compliance" | "system";
  condition: string;
  action: string;
  severity: "low" | "medium" | "high" | "critical";
  isActive: boolean;
  triggerCount: number;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
}

// Mock data
const mockRules: RiskRule[] = [
  {
    id: "RR001",
    name: "大额入金风控",
    description: "单笔入金超过 $10,000 触发人工审核",
    category: "funds",
    condition: "deposit.amount >= 10000",
    action: "冻结资金，通知风控专员人工审核",
    severity: "medium",
    isActive: true,
    triggerCount: 23,
    lastTriggered: "2024-03-15 14:30:00",
    createdAt: "2024-01-01",
    updatedAt: "2024-03-01",
  },
  {
    id: "RR002",
    name: "异常交易频率",
    description: "同一账户1分钟内开仓超过10笔",
    category: "trading",
    condition: "orders.count_per_minute > 10",
    action: "限制开仓，发送告警通知",
    severity: "high",
    isActive: true,
    triggerCount: 5,
    lastTriggered: "2024-03-14 09:15:00",
    createdAt: "2024-01-01",
    updatedAt: "2024-02-15",
  },
  {
    id: "RR003",
    name: "同IP多账户",
    description: "同一IP地址下注册超过5个账户",
    category: "compliance",
    condition: "accounts.per_ip > 5",
    action: "标记所有关联账户，触发KYC复核",
    severity: "high",
    isActive: true,
    triggerCount: 12,
    lastTriggered: "2024-03-13 16:45:00",
    createdAt: "2024-01-15",
    updatedAt: "2024-03-10",
  },
  {
    id: "RR004",
    name: "负余额预警",
    description: "账户净值低于保证金要求的50%",
    category: "trading",
    condition: "equity / margin_required < 0.5",
    action: "发送强平预警通知",
    severity: "critical",
    isActive: true,
    triggerCount: 156,
    lastTriggered: "2024-03-15 10:20:00",
    createdAt: "2024-01-01",
    updatedAt: "2024-03-05",
  },
  {
    id: "RR005",
    name: "出金账户不一致",
    description: "出金银行账户与注册姓名不符",
    category: "funds",
    condition: "withdrawal.bank_name != user.registered_name",
    action: "拒绝出金，要求补充证明材料",
    severity: "medium",
    isActive: true,
    triggerCount: 8,
    lastTriggered: "2024-03-12 11:00:00",
    createdAt: "2024-02-01",
    updatedAt: "2024-03-01",
  },
  {
    id: "RR006",
    name: "制裁名单筛查",
    description: "用户或交易对手匹配制裁名单",
    category: "compliance",
    condition: "name_match(sanctions_list) > 0.8",
    action: "冻结账户，通知合规团队",
    severity: "critical",
    isActive: true,
    triggerCount: 1,
    lastTriggered: "2024-03-10 08:00:00",
    createdAt: "2024-01-01",
    updatedAt: "2024-03-01",
  },
  {
    id: "RR007",
    name: "系统DDoS检测",
    description: "单IP请求频率超过阈值",
    category: "system",
    condition: "requests.per_second > 1000",
    action: "临时封禁IP，启用限流",
    severity: "high",
    isActive: false,
    triggerCount: 3,
    lastTriggered: "2024-02-28 22:00:00",
    createdAt: "2024-01-01",
    updatedAt: "2024-02-28",
  },
];

const categoryConfig = {
  trading: { label: "交易", color: "text-blue-600", bg: "bg-blue-100" },
  funds: { label: "资金", color: "text-emerald-600", bg: "bg-emerald-100" },
  compliance: { label: "合规", color: "text-violet-600", bg: "bg-violet-100" },
  system: { label: "系统", color: "text-gray-600", bg: "bg-gray-100" },
};

const severityConfig = {
  low: { label: "低", color: "text-blue-600", bg: "bg-blue-100", dot: "bg-blue-500" },
  medium: { label: "中", color: "text-amber-600", bg: "bg-amber-100", dot: "bg-amber-500" },
  high: { label: "高", color: "text-orange-600", bg: "bg-orange-100", dot: "bg-orange-500" },
  critical: { label: "严重", color: "text-red-600", bg: "bg-red-100", dot: "bg-red-500" },
};

export default function RiskRulesPage() {
  const [rules, setRules] = useState<RiskRule[]>(mockRules);
  const [filterCategory, setFilterCategory] = useState<"all" | RiskRule["category"]>("all");
  const [filterSeverity, setFilterSeverity] = useState<"all" | RiskRule["severity"]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRule, setSelectedRule] = useState<RiskRule | null>(null);

  const filteredRules = rules.filter((r) => {
    if (filterCategory !== "all" && r.category !== filterCategory) return false;
    if (filterSeverity !== "all" && r.severity !== filterSeverity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: rules.length,
    active: rules.filter((r) => r.isActive).length,
    critical: rules.filter((r) => r.severity === "critical" && r.isActive).length,
    totalTriggers: rules.reduce((acc, r) => acc + r.triggerCount, 0),
  };

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)));
  };

  const columns: Column<RiskRule>[] = [
    {
      key: "name",
      title: "规则名称",
      render: (row) => (
        <div>
          <p className="text-sm font-medium">{row.name}</p>
          <p className="text-xs text-gray-500">{row.id}</p>
        </div>
      ),
    },
    {
      key: "category",
      title: "分类",
      width: "80px",
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
      key: "severity",
      title: "级别",
      width: "80px",
      render: (row) => {
        const cfg = severityConfig[row.severity];
        return (
          <div className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full", cfg.dot)} />
            <span className={cn("text-xs font-medium", cfg.color)}>{cfg.label}</span>
          </div>
        );
      },
    },
    {
      key: "condition",
      title: "触发条件",
      render: (row) => <span className="text-sm font-mono text-gray-600">{row.condition}</span>,
    },
    {
      key: "triggerCount",
      title: "触发次数",
      width: "90px",
      align: "right",
      render: (row) => (
        <span className={cn("text-sm font-medium", row.triggerCount > 10 ? "text-red-600" : "text-gray-600")}>
          {row.triggerCount}
        </span>
      ),
    },
    {
      key: "isActive",
      title: "状态",
      width: "80px",
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); toggleRule(row.id); }}
          className={cn("w-10 h-5 rounded-full transition-colors relative", row.isActive ? "bg-blue-600" : "bg-gray-300")}
        >
          <div className={cn("w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform", row.isActive ? "translate-x-5" : "translate-x-0.5")} />
        </button>
      ),
    },
  ];

  const rowActions: RowAction<RiskRule>[] = [
    {
      label: "编辑",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: (row) => setSelectedRule(row),
    },
    {
      label: "停用",
      icon: <ToggleLeft className="w-4 h-4" />,
      onClick: (row) => toggleRule(row.id),
      disabled: (row) => !row.isActive,
    },
    {
      label: "启用",
      icon: <ToggleRight className="w-4 h-4" />,
      onClick: (row) => toggleRule(row.id),
      disabled: (row) => row.isActive,
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "风控" }, { label: "风控规则" }]} />

      <PageHeader
        title="风控规则"
        description="配置和管理自动化风控规则"
        actions={
          <Button>
            <Plus className="w-4 h-4" />
            新建规则
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
              <p className="text-sm text-gray-500">总规则</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
              <p className="text-sm text-gray-500">已启用</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              <p className="text-sm text-gray-500">严重级规则</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.totalTriggers}</p>
              <p className="text-sm text-gray-500">总触发次数</p>
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
            placeholder="搜索规则名称或描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as typeof filterCategory)}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部分类</option>
            <option value="trading">交易</option>
            <option value="funds">资金</option>
            <option value="compliance">合规</option>
            <option value="system">系统</option>
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as typeof filterSeverity)}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部级别</option>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
            <option value="critical">严重</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <EnhancedDataTable
        columns={columns}
        data={filteredRules}
        keyExtractor={(row) => row.id}
        searchable={false}
        rowActions={rowActions}
        onRowClick={setSelectedRule}
        emptyText="暂作风控规则"
      />

      {/* Detail Modal */}
      {selectedRule && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedRule(null)} />
          <div className="fixed inset-x-4 top-[10%] max-w-lg mx-auto bg-white rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">{selectedRule.name}</h2>
                <p className="text-sm text-gray-500 font-mono">{selectedRule.id}</p>
              </div>
              <button onClick={() => setSelectedRule(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">描述</p>
                <p className="text-sm">{selectedRule.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">分类</p>
                  <span className={cn("text-sm font-medium", categoryConfig[selectedRule.category].color)}>
                    {categoryConfig[selectedRule.category].label}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">严重级别</p>
                  <div className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full", severityConfig[selectedRule.severity].dot)} />
                    <span className={cn("text-sm font-medium", severityConfig[selectedRule.severity].color)}>
                      {severityConfig[selectedRule.severity].label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600 mb-1">触发条件</p>
                <p className="text-sm font-mono text-red-800">{selectedRule.condition}</p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-600 mb-1">执行动作</p>
                <p className="text-sm text-blue-800">{selectedRule.action}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 mb-1">触发次数</p>
                  <p className="text-xl font-bold">{selectedRule.triggerCount}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 mb-1">状态</p>
                  <span className={cn("text-sm font-medium", selectedRule.isActive ? "text-emerald-600" : "text-gray-400")}>
                    {selectedRule.isActive ? "已启用" : "已停用"}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 mb-1">最近触发</p>
                  <p className="text-sm">{selectedRule.lastTriggered || "从未"}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-6 border-t bg-gray-50">
              <Button className="flex-1">
                <Edit3 className="w-4 h-4" />
                编辑规则
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedRule(null)}>
                关闭
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
