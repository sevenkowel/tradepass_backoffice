"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Eye, Ban, Wallet, Loader2 } from "lucide-react";
import { Card, PageHeader, Button, StatusBadge, LevelBadge, EnhancedDataTable, type Column, type RowAction } from "@/components/crm/ui";
import { FilterBar } from "@/components/crm/ui/FilterBar";
import { UserDetailDrawer } from "@/components/crm/users/UserDetailDrawer";
import { Breadcrumb } from "@/components/crm/layout";
import type { BackofficeUser } from "@/types/backoffice";

export default function UsersPage() {
  const [users, setUsers] = useState<BackofficeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pendingKyc: 0,
    frozen: 0,
  });

  const [selectedUser, setSelectedUser] = useState<BackofficeUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/crm/users");
      const data = await res.json();
      if (data.success) {
        const items = data.items || [];
        setUsers(items);
        const active = items.filter((u: BackofficeUser) => u.status === "active").length;
        const pendingKyc = items.filter((u: BackofficeUser) => u.kycStatus === "pending" || u.kycStatus === "not_submitted").length;
        const frozen = items.filter((u: BackofficeUser) => u.status === "frozen").length;
        setStats({
          total: data.total || items.length,
          active,
          pendingKyc,
          frozen,
        });
      } else {
        setError(data.error || "加载失败");
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(`网络错误: ${err instanceof Error ? err.message : "请稍后重试"}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRowClick = (user: BackofficeUser) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  const columns: Column<BackofficeUser>[] = [
    {
      key: "uid",
      title: "UID",
      width: "100px",
      sortable: true,
      render: (row) => (
        <Link href={`/crm/users/${row.id}`} className="font-mono text-blue-600 hover:underline">
          {row.uid}
        </Link>
      ),
    },
    {
      key: "name",
      title: "用户名",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{row.name}</p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: "level",
      title: "等级",
      width: "100px",
      render: (row) => <LevelBadge level={row.level} />,
    },
    {
      key: "balance",
      title: "余额",
      width: "120px",
      align: "right",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-slate-900 dark:text-white">
          ${row.balance.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      title: "状态",
      width: "100px",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "kycStatus",
      title: "KYC",
      width: "120px",
      render: (row) => <StatusBadge status={row.kycStatus} />,
    },
    {
      key: "createdAt",
      title: "注册时间",
      width: "150px",
      sortable: true,
      render: (row) => (
        <span className="text-slate-600 dark:text-slate-400">{new Date(row.createdAt).toLocaleDateString("zh-CN")}</span>
      ),
    },
  ];

  const rowActions: RowAction<BackofficeUser>[] = [
    {
      label: "查看详情",
      icon: <Eye className="w-4 h-4" />,
      onClick: handleRowClick,
    },
    {
      label: "调整余额",
      icon: <Wallet className="w-4 h-4" />,
      onClick: () => {},
    },
    {
      label: "冻结账户",
      icon: <Ban className="w-4 h-4" />,
      onClick: () => {},
      variant: "danger",
      disabled: (row) => row.status === "frozen",
    },
  ];

  const filterOptions = [
    { key: "status", label: "状态", type: "select" as const, options: [
      { label: "正常", value: "active" },
      { label: "冻结", value: "frozen" },
      { label: "待激活", value: "pending" },
    ]},
    { key: "kyc", label: "KYC 状态", type: "select" as const, options: [
      { label: "已认证", value: "verified" },
      { label: "待审核", value: "pending" },
      { label: "已拒绝", value: "rejected" },
      { label: "未提交", value: "not_submitted" },
    ]},
    { key: "level", label: "等级", type: "select" as const, options: [
      { label: "Standard", value: "standard" },
      { label: "VIP", value: "vip" },
      { label: "Premium", value: "premium" },
      { label: "Enterprise", value: "enterprise" },
    ]},
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "用户管理" }, { label: "用户列表" }]} />

      {/* Page Header */}
      <PageHeader
        title="用户管理"
        description="管理平台用户、KYC认证和账户设置"
        actions={
          <div className="flex gap-3">
            <Button variant="secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              导出
            </Button>
            <Button>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              添加用户
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="!p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">总用户数</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}% 活跃` : "暂无数据"}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">活跃用户</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.active}</p>
          <p className="text-xs text-slate-500 mt-1">{stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}%` : "-"}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">待审核 KYC</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingKyc}</p>
          <p className="text-xs text-amber-600 mt-1">
            {stats.pendingKyc > 0 ? "需要处理" : "暂无"}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">冻结账户</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.frozen}</p>
          <p className="text-xs text-slate-500 mt-1">{stats.total > 0 ? `${((stats.frozen / stats.total) * 100).toFixed(1)}%` : "-"}</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filterOptions}
        searchable
        searchKeys={["uid", "name", "email"]}
        searchPlaceholder="搜索 UID、用户名或邮箱..."
      />

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
          <span className="font-medium">加载失败：</span>
          {error}
          <button onClick={fetchUsers} className="ml-auto text-red-700 underline hover:no-underline">
            重试
          </button>
        </div>
      )}

      {/* Data Table */}
      <Card padding="none">
        <EnhancedDataTable<BackofficeUser>
          columns={columns}
          data={users}
          keyExtractor={(row) => row.id}
          selectable
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          rowActions={rowActions}
          onRowClick={handleRowClick}
          emptyText={loading ? "" : "暂无用户数据"}
          exportable
          onExport={() => {}}
          loading={loading}
        />
      </Card>

      {/* User Detail Drawer */}
      <UserDetailDrawer
        user={selectedUser}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
