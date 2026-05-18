"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  Shield,
  CheckCircle2,
  XCircle,
  Copy,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Button,
  PageHeader,
  Card,
  EmptyState,
  FilterBar,
  EnhancedDataTable,
  type Column,
  type RowAction,
} from "@/components/crm/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  useToast,
} from "@/components/ui";
import { RoleForm } from "@/components/crm/roles/RoleForm";
import { PagePermissionGuard } from "@/components/crm/roles/PermissionGuard";
import { useRoleStore } from "@/store/crm/roleStore";
import type { Role } from "@/types/backoffice/role";

export default function RolesPage() {
  return (
    <PagePermissionGuard module="system" action="admin">
      <RolesPageContent />
    </PagePermissionGuard>
  );
}

function RolesPageContent() {
  const { toast } = useToast();
  const {
    roles,
    isLoadingRoles,
    fetchRoles,
    deleteRole,
    setCurrentRole,
    currentRole,
  } = useRoleStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load roles on mount
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Filter roles
  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      !searchQuery ||
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || role.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle edit
  const handleEdit = (role: Role) => {
    setCurrentRole(role);
    setIsFormOpen(true);
  };

  // Handle create
  const handleCreate = () => {
    setCurrentRole(null);
    setIsFormOpen(true);
  };

  // Handle form success
  const handleFormSuccess = useCallback(() => {
    fetchRoles({ keyword: searchQuery, status: statusFilter });
    toast({
      title: currentRole ? "角色已更新" : "角色已创建",
      description: currentRole
        ? "角色信息已成功保存"
        : "新角色已成功添加到系统中",
    });
  }, [fetchRoles, searchQuery, statusFilter, currentRole, toast]);

  // Handle delete click
  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!roleToDelete) return;

    setIsDeleting(true);
    try {
      const success = await deleteRole(roleToDelete.id);
      if (success) {
        toast({
          title: "角色已删除",
          description: `角色 "${roleToDelete.name}" 已成功删除`,
        });
        setIsDeleteDialogOpen(false);
        setRoleToDelete(null);
      } else {
        toast({
          title: "删除失败",
          description: roleToDelete.isSystem
            ? "系统预设角色无法删除"
            : roleToDelete.userCount > 0
            ? "该角色下还有关联用户，无法删除"
            : "删除角色时发生错误",
          variant: "error",
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle copy role
  const handleCopy = (role: Role) => {
    setCurrentRole({
      ...role,
      id: "",
      name: `${role.name} (复制)`,
      isSystem: false,
      userCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsFormOpen(true);
  };

  // Toggle role status
  const handleToggleStatus = async (role: Role) => {
    const { updateRole } = useRoleStore.getState();
    const newStatus = role.status === "active" ? "inactive" : "active";
    const result = await updateRole(role.id, { status: newStatus });
    if (result) {
      toast({
        title: newStatus === "active" ? "角色已启用" : "角色已禁用",
        description: `角色 "${role.name}" 已${
          newStatus === "active" ? "启用" : "禁用"
        }`,
      });
    }
  };

  // Table columns
  const columns: Column<Role>[] = [
    {
      key: "name",
      title: "角色名称",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{row.name}</p>
          <p className="text-xs text-slate-500 truncate max-w-xs">{row.description || "-"}</p>
        </div>
      ),
    },
    {
      key: "permissions",
      title: "权限数",
      width: "100px",
      align: "center",
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
          {row.permissions.reduce((sum, p) => sum + p.actions.length, 0)} 项
        </span>
      ),
    },
    {
      key: "userCount",
      title: "用户数",
      width: "100px",
      align: "center",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-slate-900 dark:text-white">{row.userCount}</span>
      ),
    },
    {
      key: "status",
      title: "状态",
      width: "120px",
      align: "center",
      render: (row) => (
        <button
          onClick={() => handleToggleStatus(row)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            row.status === "active"
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {row.status === "active" ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              启用
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3" />
              禁用
            </>
          )}
        </button>
      ),
    },
    {
      key: "isSystem",
      title: "类型",
      width: "100px",
      align: "center",
      render: (row) =>
        row.isSystem ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-slate-200 text-slate-600">
            系统
          </span>
        ) : (
          <span className="text-xs text-slate-400">自定义</span>
        ),
    },
  ];

  // Row actions
  const rowActions: RowAction<Role>[] = [
    {
      label: "编辑",
      icon: <Edit2 className="w-4 h-4" />,
      onClick: handleEdit,
    },
    {
      label: "复制",
      icon: <Copy className="w-4 h-4" />,
      onClick: handleCopy,
    },
    {
      label: "删除",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDeleteClick,
      variant: "danger",
      disabled: (row) => row.isSystem || row.userCount > 0,
    },
  ];

  // Filter options
  const filterOptions = [
    {
      key: "status",
      label: "状态",
      type: "select" as const,
      options: [
        { label: "全部", value: "all" },
        { label: "已启用", value: "active" },
        { label: "已禁用", value: "inactive" },
      ],
      value: statusFilter,
      onChange: (value: string) => setStatusFilter(value as "all" | "active" | "inactive"),
    },
  ];

  // Calculate stats
  const activeRoles = roles.filter((r) => r.status === "active").length;
  const totalUsers = roles.reduce((sum, r) => sum + r.userCount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="角色管理"
        description="管理系统角色和权限配置"
        actions={
          <div className="flex gap-3">
            <Button variant="secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              导出
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4" />
              创建角色
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="!p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">总角色数</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{roles.length}</p>
          <p className="text-xs text-slate-400 mt-1">系统预设 + 自定义</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">已启用</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeRoles}</p>
          <p className="text-xs text-emerald-600 mt-1">
            {roles.length > 0 ? Math.round((activeRoles / roles.length) * 100) : 0}% 启用率
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">关联用户</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalUsers}</p>
          <p className="text-xs text-slate-400 mt-1">所有角色用户总和</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">系统角色</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {roles.filter((r) => r.isSystem).length}
          </p>
          <p className="text-xs text-slate-400 mt-1">不可删除</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filterOptions}
        searchable
        searchKeys={["name", "description"]}
        searchPlaceholder="搜索角色名称或描述..."
      />

      {/* Data Table */}
      <Card padding="none">
        {isLoadingRoles ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredRoles.length === 0 ? (
          <EmptyState
            icon={<Shield className="w-6 h-6" />}
            title="暂无角色数据"
            description={
              searchQuery || statusFilter !== "all"
                ? "请调整筛选条件"
                : "点击上方按钮创建第一个角色"
            }
          />
        ) : (
          <EnhancedDataTable<Role>
            columns={columns}
            data={filteredRoles}
            keyExtractor={(row) => row.id}
            rowActions={rowActions}
            emptyText="暂无角色数据"
          />
        )}
      </Card>

      {/* Role Form Dialog */}
      <RoleForm
        role={currentRole}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              确认删除角色
            </DialogTitle>
            <DialogDescription className="pt-4">
              您确定要删除角色 <strong>&quot;{roleToDelete?.name}&quot;</strong> 吗？
              <p className="mt-2 text-sm text-slate-500">
                此操作不可撤销。如果该角色下有关联用户，将无法删除。
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              取消
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              确认删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
