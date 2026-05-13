"use client";

import { useState } from "react";
import {
  Terminal,
  Search,
  Filter,
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Clock,
  X,
  RefreshCw,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { EnhancedDataTable, Column } from "@/components/crm/ui/EnhancedDataTable";
import { cn } from "@/lib/utils";

// Types
interface OperationLog {
  id: string;
  level: "info" | "warn" | "error" | "success";
  module: string;
  action: string;
  description: string;
  operator: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

// Mock data
const mockLogs: OperationLog[] = [
  {
    id: "LOG001",
    level: "info",
    module: "Auth",
    action: "用户登录",
    description: "管理员 admin_01 登录成功",
    operator: "admin_01",
    ip: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    timestamp: "2024-03-15 14:30:05",
    duration: 120,
  },
  {
    id: "LOG002",
    level: "success",
    module: "Funds",
    action: "存款审核",
    description: "通过存款订单 DP003，金额 $25,000",
    operator: "admin_risk",
    ip: "192.168.1.105",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    timestamp: "2024-03-15 14:28:00",
    duration: 350,
  },
  {
    id: "LOG003",
    level: "warn",
    module: "Risk",
    action: "异常登录",
    description: "检测到异常登录尝试，IP: 203.0.113.55",
    operator: "system",
    ip: "203.0.113.55",
    userAgent: "Unknown",
    timestamp: "2024-03-15 13:15:30",
  },
  {
    id: "LOG004",
    level: "error",
    module: "Trading",
    action: "订单执行失败",
    description: "订单 ORD-9921 执行超时，连接MT5服务器失败",
    operator: "system",
    ip: "127.0.0.1",
    userAgent: "TradePass-Worker/1.0",
    timestamp: "2024-03-15 12:45:10",
    duration: 30000,
    metadata: { errorCode: "MT5_TIMEOUT", retryCount: 3 },
  },
  {
    id: "LOG005",
    level: "info",
    module: "Users",
    action: "用户信息更新",
    description: "更新用户 USR-4401 的联系方式",
    operator: "admin_02",
    ip: "192.168.1.120",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    timestamp: "2024-03-15 11:20:00",
    duration: 85,
  },
  {
    id: "LOG006",
    level: "success",
    module: "Config",
    action: "配置更新",
    description: "KYC配置更新成功，版本 v2.3",
    operator: "system",
    ip: "127.0.0.1",
    userAgent: "TradePass-Worker/1.0",
    timestamp: "2024-03-15 09:00:00",
    duration: 45,
  },
  {
    id: "LOG007",
    level: "warn",
    module: "Funds",
    action: "出金待审核",
    description: "出金订单 WD-9921 触发大额审核规则",
    operator: "system",
    ip: "127.0.0.1",
    userAgent: "TradePass-Worker/1.0",
    timestamp: "2024-03-15 08:30:00",
  },
  {
    id: "LOG008",
    level: "error",
    module: "Payment",
    action: "支付回调失败",
    description: "USDT支付网关回调超时",
    operator: "system",
    ip: "127.0.0.1",
    userAgent: "TradePass-Worker/1.0",
    timestamp: "2024-03-14 23:45:00",
    duration: 15000,
    metadata: { gateway: "USDT-TRC20", txId: "TX8823" },
  },
  {
    id: "LOG009",
    level: "info",
    module: "KYC",
    action: "KYC提交",
    description: "用户 USR-5502 提交KYC文档",
    operator: "USR-5502",
    ip: "203.0.113.88",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)",
    timestamp: "2024-03-14 16:00:00",
    duration: 2300,
  },
  {
    id: "LOG010",
    level: "success",
    module: "Notification",
    action: "通知发送",
    description: "成功发送入金到账通知给 USR-4401",
    operator: "system",
    ip: "127.0.0.1",
    userAgent: "TradePass-Worker/1.0",
    timestamp: "2024-03-14 14:20:00",
    duration: 120,
  },
];

const levelConfig = {
  info: { label: "信息", icon: Info, color: "text-blue-600", bg: "bg-blue-100", dot: "bg-blue-500" },
  warn: { label: "警告", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-100", dot: "bg-amber-500" },
  error: { label: "错误", icon: XCircle, color: "text-red-600", bg: "bg-red-100", dot: "bg-red-500" },
  success: { label: "成功", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100", dot: "bg-emerald-500" },
};

export default function OperationLogsPage() {
  const [logs] = useState<OperationLog[]>(mockLogs);
  const [filterLevel, setFilterLevel] = useState<"all" | OperationLog["level"]>("all");
  const [filterModule, setFilterModule] = useState<"all" | string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<OperationLog | null>(null);

  const modules = Array.from(new Set(logs.map((l) => l.module)));

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== "all" && log.level !== filterLevel) return false;
    if (filterModule !== "all" && log.module !== filterModule) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q) ||
        log.operator.toLowerCase().includes(q) ||
        log.module.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: logs.length,
    error: logs.filter((l) => l.level === "error").length,
    warn: logs.filter((l) => l.level === "warn").length,
    success: logs.filter((l) => l.level === "success").length,
  };

  const columns: Column<OperationLog>[] = [
    {
      key: "level",
      title: "级别",
      width: "100px",
      render: (row) => {
        const cfg = levelConfig[row.level];
        const Icon = cfg.icon;
        return (
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", cfg.dot)} />
            <Icon className={cn("w-4 h-4", cfg.color)} />
            <span className={cn("text-xs font-medium", cfg.color)}>{cfg.label}</span>
          </div>
        );
      },
    },
    {
      key: "timestamp",
      title: "时间",
      width: "160px",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="text-sm text-gray-500">{row.timestamp}</span>
        </div>
      ),
    },
    {
      key: "module",
      title: "模块",
      width: "100px",
      render: (row) => (
        <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-700">
          {row.module}
        </span>
      ),
    },
    {
      key: "action",
      title: "操作",
      render: (row) => (
        <div>
          <p className="text-sm font-medium">{row.action}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{row.description}</p>
        </div>
      ),
    },
    {
      key: "operator",
      title: "操作人",
      width: "120px",
      render: (row) => <span className="text-sm font-medium text-gray-700">{row.operator}</span>,
    },
    {
      key: "ip",
      title: "IP",
      width: "130px",
      render: (row) => <span className="text-sm font-mono text-gray-500">{row.ip}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "系统" }, { label: "操作日志" }]} />

      <PageHeader
        title="操作日志"
        description="查看系统操作日志，排查问题和追踪变更"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary">
              <Filter className="w-4 h-4" />
              导出
            </Button>
            <Button variant="secondary">
              <RefreshCw className="w-4 h-4" />
              刷新
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-500">总记录</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.success}</p>
              <p className="text-sm text-gray-500">成功</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.warn}</p>
              <p className="text-sm text-gray-500">警告</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.error}</p>
              <p className="text-sm text-gray-500">错误</p>
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
            placeholder="搜索操作、描述或操作人..."
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
            <option value="all">全部级别</option>
            <option value="info">信息</option>
            <option value="success">成功</option>
            <option value="warn">警告</option>
            <option value="error">错误</option>
          </select>
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部模块</option>
            {modules.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <EnhancedDataTable
        columns={columns}
        data={filteredLogs}
        keyExtractor={(row) => row.id}
        searchable={false}
        onRowClick={setSelectedLog}
        emptyText="暂无操作日志"
      />

      {/* Detail Modal */}
      {selectedLog && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedLog(null)} />
          <div className="fixed inset-x-4 top-[10%] max-w-lg mx-auto bg-white rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                {(() => {
                  const cfg = levelConfig[selectedLog.level];
                  const Icon = cfg.icon;
                  return <Icon className={cn("w-6 h-6", cfg.color)} />;
                })()}
                <div>
                  <h2 className="text-lg font-semibold">{selectedLog.action}</h2>
                  <p className="text-sm text-gray-500 font-mono">{selectedLog.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className={cn("p-4 rounded-lg", levelConfig[selectedLog.level].bg, "bg-opacity-30")}>
                <p className="text-sm">{selectedLog.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">模块</p>
                  <span className="text-sm font-medium">{selectedLog.module}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">级别</p>
                  <span className={cn("text-sm font-medium", levelConfig[selectedLog.level].color)}>
                    {levelConfig[selectedLog.level].label}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">操作人</p>
                  <p className="text-sm font-medium">{selectedLog.operator}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">时间</p>
                  <p className="text-sm">{selectedLog.timestamp}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">IP地址</p>
                  <p className="text-sm font-mono">{selectedLog.ip}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">耗时</p>
                  <p className="text-sm">{selectedLog.duration ? `${selectedLog.duration}ms` : "-"}</p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">User-Agent</p>
                <p className="text-sm font-mono text-gray-600 break-all">{selectedLog.userAgent}</p>
              </div>

              {selectedLog.metadata && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">元数据</p>
                  <pre className="text-xs font-mono text-gray-600 overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50">
              <Button variant="secondary" className="w-full" onClick={() => setSelectedLog(null)}>
                关闭
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
