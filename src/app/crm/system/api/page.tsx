"use client";

import { useState } from "react";
import {
  Key,
  Search,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Clock,
  Shield,
  Globe,
  X,
  CheckCircle,
  Webhook,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { EnhancedDataTable, Column, RowAction } from "@/components/crm/ui/EnhancedDataTable";
import { cn } from "@/lib/utils";

// Types
interface APIKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  expiresAt?: string;
  lastUsed?: string;
  status: "active" | "revoked" | "expired";
  createdBy: string;
}

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  status: "active" | "inactive";
  lastDelivered?: string;
  failureCount: number;
}

// Mock data
const mockApiKeys: APIKey[] = [
  {
    id: "AK001",
    name: "Trading API - Production",
    key: "tp_live_...8f3a2b1c",
    prefix: "tp_live",
    scopes: ["trading", "account_read"],
    createdAt: "2024-03-01",
    expiresAt: "2025-03-01",
    lastUsed: "2024-03-15 14:30:00",
    status: "active",
    createdBy: "admin_01",
  },
  {
    id: "AK002",
    name: "Payment Gateway Integration",
    key: "tp_pay_...9e4d5f6a",
    prefix: "tp_pay",
    scopes: ["funds", "webhook"],
    createdAt: "2024-02-15",
    lastUsed: "2024-03-15 13:00:00",
    status: "active",
    createdBy: "admin_02",
  },
  {
    id: "AK003",
    name: "CRM Sync",
    key: "tp_crm_...7c2b8d9e",
    prefix: "tp_crm",
    scopes: ["users", "kyc"],
    createdAt: "2024-01-20",
    expiresAt: "2024-07-20",
    lastUsed: "2024-03-14 10:00:00",
    status: "active",
    createdBy: "admin_01",
  },
  {
    id: "AK004",
    name: "Old Reporting API",
    key: "tp_rep_...1a5b6c7d",
    prefix: "tp_rep",
    scopes: ["reports"],
    createdAt: "2023-06-01",
    status: "revoked",
    createdBy: "admin_03",
  },
];

const mockWebhooks: WebhookConfig[] = [
  {
    id: "WH001",
    url: "https://partner.com/webhooks/deposit",
    events: ["deposit.completed", "deposit.rejected"],
    status: "active",
    lastDelivered: "2024-03-15 14:30:00",
    failureCount: 0,
  },
  {
    id: "WH002",
    url: "https://crm.internal.com/api/webhook",
    events: ["user.registered", "kyc.completed"],
    status: "active",
    lastDelivered: "2024-03-15 14:00:00",
    failureCount: 2,
  },
  {
    id: "WH003",
    url: "https://old-system.com/hook",
    events: ["order.filled"],
    status: "inactive",
    failureCount: 15,
  },
];

const statusConfig = {
  active: { label: "正常", color: "text-emerald-600", bg: "bg-emerald-100" },
  revoked: { label: "已撤销", color: "text-gray-500", bg: "bg-gray-100" },
  expired: { label: "已过期", color: "text-red-600", bg: "bg-red-100" },
};

export default function APIManagementPage() {
  const [apiKeys] = useState<APIKey[]>(mockApiKeys);
  const [webhooks] = useState<WebhookConfig[]>(mockWebhooks);
  const [activeTab, setActiveTab] = useState<"keys" | "webhooks">("keys");
  const [searchQuery, setSearchQuery] = useState("");
  const [showKey, setShowKey] = useState<Set<string>>(new Set());
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);

  const filteredKeys = apiKeys.filter((k) => {
    if (searchQuery) {
      return k.name.toLowerCase().includes(searchQuery.toLowerCase()) || k.prefix.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const stats = {
    totalKeys: apiKeys.length,
    activeKeys: apiKeys.filter((k) => k.status === "active").length,
    totalWebhooks: webhooks.length,
    activeWebhooks: webhooks.filter((w) => w.status === "active").length,
  };

  const toggleShowKey = (id: string) => {
    setShowKey((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const columns: Column<APIKey>[] = [
    {
      key: "name",
      title: "名称",
      render: (row) => (
        <div>
          <p className="text-sm font-medium">{row.name}</p>
          <p className="text-xs text-gray-500 font-mono">{row.id}</p>
        </div>
      ),
    },
    {
      key: "key",
      title: "API Key",
      render: (row) => (
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
            {showKey.has(row.id) ? row.key : row.key.replace(/\w/g, "*")}
          </code>
          <button onClick={() => toggleShowKey(row.id)} className="p-1 text-gray-400 hover:text-gray-600">
            {showKey.has(row.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      ),
    },
    {
      key: "scopes",
      title: "权限范围",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.scopes.map((s) => (
            <span key={s} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">{s}</span>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      title: "状态",
      width: "90px",
      render: (row) => {
        const cfg = statusConfig[row.status];
        return <span className={cn("inline-flex items-center px-2 py-1 rounded-md text-xs font-medium", cfg.bg, cfg.color)}>{cfg.label}</span>;
      },
    },
    {
      key: "lastUsed",
      title: "最近使用",
      width: "150px",
      render: (row) => <span className="text-sm text-gray-500">{row.lastUsed || "从未"}</span>,
    },
  ];

  const rowActions: RowAction<APIKey>[] = [
    {
      label: "复制",
      icon: <Copy className="w-4 h-4" />,
      onClick: () => {},
      disabled: (row) => row.status !== "active",
    },
    {
      label: "撤销",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => {},
      variant: "danger",
      disabled: (row) => row.status !== "active",
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "System" }, { label: "API管理" }]} />

      <PageHeader
        title="API管理"
        description="管理API密钥、权限和Webhook集成"
        actions={
          <Button>
            <Plus className="w-4 h-4" />
            新建{activeTab === "keys" ? "API Key" : "Webhook"}
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Key className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalKeys}</p>
              <p className="text-sm text-gray-500">API Keys</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.activeKeys}</p>
              <p className="text-sm text-gray-500">正常</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <Webhook className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-violet-600">{stats.totalWebhooks}</p>
              <p className="text-sm text-gray-500">Webhooks</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.activeWebhooks}</p>
              <p className="text-sm text-gray-500">活跃中</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("keys")}
          className={cn("flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors", activeTab === "keys" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600")}
        >
          <Key className="w-4 h-4" />
          API Keys
        </button>
        <button
          onClick={() => setActiveTab("webhooks")}
          className={cn("flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors", activeTab === "webhooks" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600")}
        >
          <Webhook className="w-4 h-4" />
          Webhooks
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === "keys" ? "搜索API Key名称..." : "搜索Webhook URL..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === "keys" ? (
        <EnhancedDataTable
          columns={columns}
          data={filteredKeys}
          keyExtractor={(row) => row.id}
          searchable={false}
          rowActions={rowActions}
          onRowClick={setSelectedKey}
          emptyText="暂无API Key"
        />
      ) : (
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">URL</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">事件</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">状态</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">最近推送</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-right">失败次数</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {webhooks.map((wh) => (
                <tr key={wh.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-mono">{wh.url}</p>
                    <p className="text-xs text-gray-500">{wh.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {wh.events.map((e) => (
                        <span key={e} className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-[10px]">{e}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("inline-flex items-center px-2 py-1 rounded-md text-xs font-medium", wh.status === "active" ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500")}>
                      {wh.status === "active" ? "正常" : "已停用"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{wh.lastDelivered || "从未"}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn("text-sm font-medium", wh.failureCount > 5 ? "text-red-600" : "text-gray-600")}>
                      {wh.failureCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Key Detail Modal */}
      {selectedKey && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedKey(null)} />
          <div className="fixed inset-x-4 top-[10%] max-w-lg mx-auto bg-white rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">{selectedKey.name}</h2>
                <p className="text-sm text-gray-500 font-mono">{selectedKey.id}</p>
              </div>
              <button onClick={() => setSelectedKey(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="p-3 bg-gray-100 rounded-lg">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono">{showKey.has(selectedKey.id) ? selectedKey.key : selectedKey.key.replace(/\w/g, "*")}</code>
                  <button onClick={() => toggleShowKey(selectedKey.id)} className="p-1 text-gray-400 hover:text-gray-600">
                    {showKey.has(selectedKey.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">状态</p>
                  <span className={cn("text-sm font-medium", statusConfig[selectedKey.status].color)}>{statusConfig[selectedKey.status].label}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">创建人</p>
                  <p className="text-sm">{selectedKey.createdBy}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">创建时间</p>
                  <p className="text-sm">{selectedKey.createdAt}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">过期时间</p>
                  <p className="text-sm">{selectedKey.expiresAt || "永不过期"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">权限范围</p>
                <div className="flex flex-wrap gap-2">
                  {selectedKey.scopes.map((s) => (
                    <span key={s} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm">{s}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-6 border-t bg-gray-50">
              {selectedKey.status === "active" && (
                <Button variant="danger" className="flex-1">
                  <Trash2 className="w-4 h-4" />
                  撤销密钥
                </Button>
              )}
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedKey(null)}>
                关闭
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
