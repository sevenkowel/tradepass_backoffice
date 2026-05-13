"use client";

import { useState } from "react";
import {
  ShieldAlert,
  Search,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle,
  Clock,
  X,
  Filter,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { EnhancedDataTable, Column, RowAction } from "@/components/crm/ui/EnhancedDataTable";
import { cn } from "@/lib/utils";

// Types
interface ComplianceAlert {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  category: "aml" | "kyc" | "sanctions" | "fraud" | "market_abuse";
  status: "open" | "investigating" | "resolved" | "dismissed";
  target: string;
  targetType: string;
  triggeredAt: string;
  resolvedAt?: string;
  assignedTo?: string;
  resolution?: string;
}

// Mock data
const mockAlerts: ComplianceAlert[] = [
  {
    id: "CRA001",
    title: "可疑交易模式",
    description: "用户USR-8823在24小时内完成5笔大额入金，总计$50,000",
    severity: "warning",
    category: "aml",
    status: "investigating",
    target: "USR-8823",
    targetType: "用户",
    triggeredAt: "2024-03-15 14:00:00",
    assignedTo: "admin_risk",
  },
  {
    id: "CRA002",
    title: "制裁名单匹配",
    description: "检测到用户注册信息与OFAC制裁名单高度匹配",
    severity: "critical",
    category: "sanctions",
    status: "open",
    target: "USR-9901",
    targetType: "用户",
    triggeredAt: "2024-03-15 10:30:00",
  },
  {
    id: "CRA003",
    title: "KYC文档异常",
    description: "用户提交的身份证件疑似伪造，OCR置信度低于阈值",
    severity: "critical",
    category: "kyc",
    status: "investigating",
    target: "USR-5543",
    targetType: "用户",
    triggeredAt: "2024-03-14 16:00:00",
    assignedTo: "compliance_team",
  },
  {
    id: "CRA004",
    title: "操纵市场价格",
    description: "多个账户协同在同一时间点大量买卖XAU/USD",
    severity: "warning",
    category: "market_abuse",
    status: "resolved",
    target: "ACC-3321, ACC-3322",
    targetType: "交易账户",
    triggeredAt: "2024-03-13 09:00:00",
    resolvedAt: "2024-03-14 11:00:00",
    assignedTo: "admin_01",
    resolution: "确认为关联方账户，已限制交易权限",
  },
  {
    id: "CRA005",
    title: "重复注册",
    description: "同一设备指纹关联3个不同账户",
    severity: "info",
    category: "fraud",
    status: "dismissed",
    target: "USR-1102, USR-1103, USR-1104",
    targetType: "用户",
    triggeredAt: "2024-03-12 08:00:00",
    resolvedAt: "2024-03-12 10:00:00",
    resolution: "确认为家庭成员共用设备",
  },
  {
    id: "CRA006",
    title: "异常出金模式",
    description: "用户短时间内多次出金到不同银行账户",
    severity: "warning",
    category: "aml",
    status: "open",
    target: "USR-7765",
    targetType: "用户",
    triggeredAt: "2024-03-11 15:00:00",
  },
];

const severityConfig = {
  info: { label: "信息", color: "text-blue-600", bg: "bg-blue-100", icon: Info, dot: "bg-blue-500" },
  warning: { label: "警告", color: "text-amber-600", bg: "bg-amber-100", icon: AlertTriangle, dot: "bg-amber-500" },
  critical: { label: "严重", color: "text-red-600", bg: "bg-red-100", icon: AlertOctagon, dot: "bg-red-500" },
};

const categoryConfig = {
  aml: { label: "反洗钱", color: "text-blue-600", bg: "bg-blue-100" },
  kyc: { label: "KYC", color: "text-violet-600", bg: "bg-violet-100" },
  sanctions: { label: "制裁", color: "text-red-600", bg: "bg-red-100" },
  fraud: { label: "欺诈", color: "text-amber-600", bg: "bg-amber-100" },
  market_abuse: { label: "市场滥用", color: "text-emerald-600", bg: "bg-emerald-100" },
};

const statusConfig = {
  open: { label: "待处理", color: "text-red-600", bg: "bg-red-100" },
  investigating: { label: "调查中", color: "text-amber-600", bg: "bg-amber-100" },
  resolved: { label: "已解决", color: "text-emerald-600", bg: "bg-emerald-100" },
  dismissed: { label: "已忽略", color: "text-gray-500", bg: "bg-gray-100" },
};

export default function ComplianceRiskPage() {
  const [alerts] = useState<ComplianceAlert[]>(mockAlerts);
  const [filterSeverity, setFilterSeverity] = useState<"all" | ComplianceAlert["severity"]>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | ComplianceAlert["status"]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlert, setSelectedAlert] = useState<ComplianceAlert | null>(null);

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity !== "all" && a.severity !== filterSeverity) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.target.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: alerts.length,
    open: alerts.filter((a) => a.status === "open").length,
    critical: alerts.filter((a) => a.severity === "critical" && a.status !== "resolved" && a.status !== "dismissed").length,
    investigating: alerts.filter((a) => a.status === "investigating").length,
  };

  const columns: Column<ComplianceAlert>[] = [
    {
      key: "severity",
      title: "级别",
      width: "100px",
      render: (row) => {
        const cfg = severityConfig[row.severity];
        const Icon = cfg.icon;
        return (
          <div className="flex items-center gap-2">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", cfg.bg)}>
              <Icon className={cn("w-4 h-4", cfg.color)} />
            </div>
            <span className={cn("text-xs font-medium", cfg.color)}>{cfg.label}</span>
          </div>
        );
      },
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
      key: "title",
      title: "告警",
      render: (row) => (
        <div>
          <p className="text-sm font-medium">{row.title}</p>
          <p className="text-xs text-gray-500 line-clamp-1">{row.description}</p>
        </div>
      ),
    },
    {
      key: "target",
      title: "目标",
      width: "120px",
      render: (row) => (
        <div>
          <p className="text-sm font-mono">{row.target}</p>
          <p className="text-xs text-gray-500">{row.targetType}</p>
        </div>
      ),
    },
    {
      key: "status",
      title: "状态",
      width: "90px",
      render: (row) => {
        const cfg = statusConfig[row.status];
        return (
          <span className={cn("inline-flex items-center px-2 py-1 rounded-md text-xs font-medium", cfg.bg, cfg.color)}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: "triggeredAt",
      title: "时间",
      width: "150px",
      render: (row) => <span className="text-sm text-gray-500">{row.triggeredAt}</span>,
    },
  ];

  const rowActions: RowAction<ComplianceAlert>[] = [
    {
      label: "查看详情",
      icon: <ShieldAlert className="w-4 h-4" />,
      onClick: (row) => setSelectedAlert(row),
    },
    {
      label: "标记已解决",
      icon: <CheckCircle className="w-4 h-4" />,
      onClick: () => {},
      disabled: (row) => row.status === "resolved" || row.status === "dismissed",
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "合规" }, { label: "风控告警" }]} />

      <PageHeader
        title="风控告警"
        description="监控和管理合规风险告警"
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
              <ShieldAlert className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-500">总告警</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              <p className="text-sm text-gray-500">严重告警</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.open}</p>
              <p className="text-sm text-gray-500">待处理</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.investigating}</p>
              <p className="text-sm text-gray-500">调查中</p>
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
            placeholder="搜索告警标题或目标..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as typeof filterSeverity)}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部级别</option>
            <option value="info">信息</option>
            <option value="warning">警告</option>
            <option value="critical">严重</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部状态</option>
            <option value="open">待处理</option>
            <option value="investigating">调查中</option>
            <option value="resolved">已解决</option>
            <option value="dismissed">已忽略</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <EnhancedDataTable
        columns={columns}
        data={filteredAlerts}
        keyExtractor={(row) => row.id}
        searchable={false}
        rowActions={rowActions}
        onRowClick={setSelectedAlert}
        emptyText="暂无风控告警"
      />

      {/* Detail Modal */}
      {selectedAlert && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedAlert(null)} />
          <div className="fixed inset-x-4 top-[10%] max-w-lg mx-auto bg-white rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                {(() => {
                  const cfg = severityConfig[selectedAlert.severity];
                  const Icon = cfg.icon;
                  return (
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", cfg.bg)}>
                      <Icon className={cn("w-6 h-6", cfg.color)} />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-lg font-semibold">{selectedAlert.title}</h2>
                  <p className="text-sm text-gray-500 font-mono">{selectedAlert.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAlert(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600 mb-1">描述</p>
                <p className="text-sm text-red-800">{selectedAlert.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">分类</p>
                  <span className={cn("text-sm font-medium", categoryConfig[selectedAlert.category].color)}>
                    {categoryConfig[selectedAlert.category].label}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">严重级别</p>
                  <div className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full", severityConfig[selectedAlert.severity].dot)} />
                    <span className={cn("text-sm font-medium", severityConfig[selectedAlert.severity].color)}>
                      {severityConfig[selectedAlert.severity].label}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">目标</p>
                  <p className="text-sm font-mono">{selectedAlert.target}</p>
                  <p className="text-xs text-gray-500">{selectedAlert.targetType}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">状态</p>
                  <span className={cn("text-sm font-medium", statusConfig[selectedAlert.status].color)}>
                    {statusConfig[selectedAlert.status].label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">触发时间</p>
                  <p className="text-sm">{selectedAlert.triggeredAt}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">负责人</p>
                  <p className="text-sm">{selectedAlert.assignedTo || "未分配"}</p>
                </div>
              </div>

              {selectedAlert.resolvedAt && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-xs text-emerald-600 mb-1">解决时间</p>
                  <p className="text-sm text-emerald-800">{selectedAlert.resolvedAt}</p>
                </div>
              )}

              {selectedAlert.resolution && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">处理结果</p>
                  <p className="text-sm">{selectedAlert.resolution}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 p-6 border-t bg-gray-50">
              {selectedAlert.status !== "resolved" && selectedAlert.status !== "dismissed" && (
                <Button className="flex-1">
                  <CheckCircle className="w-4 h-4" />
                  标记已解决
                </Button>
              )}
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedAlert(null)}>
                关闭
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
