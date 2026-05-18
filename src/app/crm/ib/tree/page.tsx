"use client";

import { useState } from "react";
import {
  GitBranch,
  Users,
  DollarSign,
  Search,
  ChevronDown,
  ChevronRight,
  User,
  Crown,
  BarChart3,
} from "lucide-react";
import { Card, PageHeader } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { cn } from "@/lib/utils";

// Types
interface IBNode {
  id: string;
  name: string;
  level: "L1" | "L2" | "L3";
  parentId?: string;
  referralCount: number;
  totalClients: number;
  totalCommission: number;
  monthlyVolume: number;
  isExpanded?: boolean;
}

// Mock data
const mockNodes: IBNode[] = [
  { id: "IB-1001", name: "Global Partners Ltd", level: "L1", referralCount: 3, totalClients: 234, totalCommission: 45600, monthlyVolume: 1250, isExpanded: true },
  { id: "IB-2001", name: "Asia Trading Hub", level: "L2", parentId: "IB-1001", referralCount: 2, totalClients: 89, totalCommission: 18200, monthlyVolume: 420 },
  { id: "IB-3001", name: "Retail Network", level: "L3", parentId: "IB-2001", referralCount: 0, totalClients: 34, totalCommission: 5200, monthlyVolume: 120 },
  { id: "IB-3002", name: "Local Agent A", level: "L3", parentId: "IB-2001", referralCount: 0, totalClients: 21, totalCommission: 3100, monthlyVolume: 85 },
  { id: "IB-2002", name: "Europe FX Group", level: "L2", parentId: "IB-1001", referralCount: 1, totalClients: 67, totalCommission: 12800, monthlyVolume: 310 },
  { id: "IB-3003", name: "Sub Agent B", level: "L3", parentId: "IB-2002", referralCount: 0, totalClients: 15, totalCommission: 2100, monthlyVolume: 60 },
  { id: "IB-1002", name: "Premium Partners", level: "L1", referralCount: 1, totalClients: 156, totalCommission: 32100, monthlyVolume: 780 },
  { id: "IB-2003", name: "Africa Network", level: "L2", parentId: "IB-1002", referralCount: 0, totalClients: 45, totalCommission: 8900, monthlyVolume: 210 },
];

const levelConfig = {
  L1: { label: "L1", color: "text-blue-600", bg: "bg-blue-100", indent: 0 },
  L2: { label: "L2", color: "text-violet-600", bg: "bg-violet-100", indent: 32 },
  L3: { label: "L3", color: "text-amber-600", bg: "bg-amber-100", indent: 64 },
};

function buildTree(nodes: IBNode[]): IBNode[] {
  const rootNodes = nodes.filter((n) => !n.parentId);
  const result: IBNode[] = [];

  function addChildren(parentId: string, depth: number) {
    const children = nodes.filter((n) => n.parentId === parentId);
    for (const child of children) {
      result.push(child);
      if (child.isExpanded) {
        addChildren(child.id, depth + 1);
      }
    }
  }

  for (const root of rootNodes) {
    result.push(root);
    if (root.isExpanded) {
      addChildren(root.id, 1);
    }
  }

  return result;
}

export default function ReferralTreePage() {
  const [nodes, setNodes] = useState<IBNode[]>(mockNodes);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleExpand = (id: string) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, isExpanded: !n.isExpanded } : n)));
  };

  const treeNodes = buildTree(nodes);

  const filteredNodes = treeNodes.filter((n) => {
    if (searchQuery) {
      return n.name.toLowerCase().includes(searchQuery.toLowerCase()) || n.id.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const stats = {
    totalIBs: nodes.length,
    l1Count: nodes.filter((n) => n.level === "L1").length,
    totalClients: nodes.reduce((acc, n) => acc + n.totalClients, 0),
    totalCommission: nodes.reduce((acc, n) => acc + n.totalCommission, 0),
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "IB / Commission" }, { label: "推荐树" }]} />

      <PageHeader
        title="推荐树"
        description="查看和管理IB层级推荐网络结构"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalIBs}</p>
              <p className="text-sm text-gray-500">总IB数</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Crown className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.l1Count}</p>
              <p className="text-sm text-gray-500">L1 合作伙伴</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.totalClients.toLocaleString()}</p>
              <p className="text-sm text-gray-500">总客户数</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">${stats.totalCommission.toLocaleString()}</p>
              <p className="text-sm text-gray-500">总佣金</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索IB名称或ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tree */}
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-left">IB名称</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-center">层级</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-right">下级IB</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-right">客户数</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-right">月交易量</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-right">总佣金</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredNodes.map((node) => {
                const cfg = levelConfig[node.level];
                const hasChildren = nodes.some((n) => n.parentId === node.id);
                const isRoot = !node.parentId;
                return (
                  <tr
                    key={node.id}
                    className="hover:bg-gray-50"
                    style={{ paddingLeft: cfg.indent }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" style={{ marginLeft: isRoot ? 0 : cfg.indent }}>
                        {hasChildren && (
                          <button
                            onClick={() => toggleExpand(node.id)}
                            className="p-0.5 rounded hover:bg-gray-200"
                          >
                            {node.isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        )}
                        {!hasChildren && <div className="w-5" />}
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", cfg.bg)}>
                          <User className={cn("w-4 h-4", cfg.color)} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{node.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{node.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("inline-flex items-center px-2 py-1 rounded-md text-xs font-bold", cfg.bg, cfg.color)}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium">{node.referralCount}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-medium">{node.totalClients}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-medium">{node.monthlyVolume.toLocaleString()} lot</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-emerald-600">${node.totalCommission.toLocaleString()}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
