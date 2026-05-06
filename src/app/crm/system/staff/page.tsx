"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Edit2,
  Trash2,
  Key,
  UserCheck,
  UserX,
  Shield,
  Users,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
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
import { StaffForm } from "@/components/crm/staff/StaffForm";
import { useStaffStore } from "@/store/crm/staffStore";
import { useRoleStore } from "@/store/crm/roleStore";
import { useDepartmentStore } from "@/store/crm/departmentStore";
import type { Staff, StaffStatus } from "@/types/backoffice/staff";

export default function StaffPage() {
  const { toast } = useToast();
  const {
    staff,
    isLoadingStaff,
    fetchStaff,
    deleteStaff,
    resetPassword,
    toggleStaffStatus,
    setCurrentStaff,
    currentStaff,
  } = useStaffStore();

  const { roles, fetchRoles } = useRoleStore();
  const { departments: allDepartments, fetchDepartments } = useDepartmentStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [staffToAction, setStaffToAction] = useState<Staff | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load data
  useEffect(() => {
    fetchStaff();
    fetchRoles();
    fetchDepartments();
  }, [fetchStaff, fetchRoles, fetchDepartments]);

  // Handle create
  const handleCreate = () => {
    setCurrentStaff(null);
    setIsFormOpen(true);
  };

  // Handle edit
  const handleEdit = (staffMember: Staff) => {
    setCurrentStaff(staffMember);
    setIsFormOpen(true);
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchStaff();
    toast({
      title: currentStaff ? "员工已更新" : "员工已创建",
      description: currentStaff
        ? "员工信息已成功保存"
        : "新员工已成功添加到系统中",
    });
  };

  // Handle delete click
  const handleDeleteClick = (staffMember: Staff) => {
    setStaffToAction(staffMember);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!staffToAction) return;

    setIsProcessing(true);
    try {
      const success = await deleteStaff(staffToAction.id);
      if (success) {
        toast({
          title: "员工已删除",
          description: `员工 "${staffToAction.fullName}" 已成功删除`,
        });
        setIsDeleteDialogOpen(false);
        setStaffToAction(null);
      } else {
        toast({
          title: "删除失败",
          description: "删除员工时发生错误",
          variant: "error",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reset password
  const handleResetPassword = async (staffMember: Staff) => {
    setStaffToAction(staffMember);
    setIsProcessing(true);
    try {
      const password = await resetPassword(staffMember.id);
      if (password) {
        setTempPassword(password);
        setIsResetPasswordDialogOpen(true);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (staffMember: Staff) => {
    const newStatus = staffMember.status === "active" ? "inactive" : "active";
    const success = await toggleStaffStatus(staffMember.id);
    if (success) {
      toast({
        title: newStatus === "active" ? "员工已启用" : "员工已禁用",
        description: `员工 "${staffMember.fullName}" 已${newStatus === "active" ? "启用" : "禁用"}`,
      });
    }
  };

  // Get status badge
  const getStatusBadge = (status: StaffStatus) => {
    const styles = {
      active: "bg-green-100 text-green-700",
      inactive: "bg-slate-100 text-slate-600",
      suspended: "bg-red-100 text-red-700",
    };
    const labels = {
      active: "启用",
      inactive: "禁用",
      suspended: "冻结",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // Table columns
  const columns: Column<Staff>[] = [
    {
      key: "fullName",
      title: "员工信息",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.email}`}
            alt={row.fullName}
            className="w-10 h-10 rounded-full bg-slate-100"
          />
          <div>
            <p className="font-medium text-slate-900 dark:text-white">{row.fullName}</p>
            <p className="text-xs text-slate-500">{row.email}</p>
            {row.nickname && <p className="text-xs text-slate-400">昵称: {row.nickname}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "gender",
      title: "性别",
      width: "60px",
      align: "center",
      render: (row) => {
        const labels: Record<string, string> = { male: "男", female: "女", secret: "-" };
        const colors: Record<string, string> = { male: "text-blue-600", female: "text-pink-600", secret: "text-slate-300" };
        return <span className={`text-sm ${colors[row.gender] || "text-slate-300"}`}>{labels[row.gender] || "-"}</span>;
      },
    },
    {
      key: "roleName",
      title: "角色",
      width: "120px",
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          {row.roleName}
        </span>
      ),
    },
    {
      key: "department",
      title: "部门",
      width: "120px",
      render: (row) => {
        const depts = (row.departmentIds || []).map((id) => allDepartments.find(d => d.id === id)).filter(Boolean) as { name: string; id: string }[];
        const primaryName = row.primaryDepartment
          ? allDepartments.find(d => d.id === row.primaryDepartment)?.name
          : null;
        const additional = depts.filter((d) => d.id !== row.primaryDepartment);
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-slate-600">
              {primaryName || depts[0]?.name || "-"}
            </span>
            {additional.length > 0 && (
              <span className="text-xs text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                +{additional.length}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      title: "状态",
      width: "100px",
      align: "center",
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: "lastLoginAt",
      title: "最后登录",
      width: "150px",
      render: (row) => (
        <div className="text-sm">
          {row.lastLoginAt ? (
            <>
              <p className="text-slate-900 dark:text-white">
                {new Date(row.lastLoginAt).toLocaleDateString("zh-CN")}
              </p>
              <p className="text-xs text-slate-500">{row.lastLoginIp}</p>
            </>
          ) : (
            <span className="text-slate-400">从未登录</span>
          )}
        </div>
      ),
    },
    {
      key: "twoFactorEnabled",
      title: "2FA",
      width: "80px",
      align: "center",
      render: (row) =>
        row.twoFactorEnabled ? (
          <Shield className="w-4 h-4 text-green-600 mx-auto" />
        ) : (
          <span className="text-slate-300">-</span>
        ),
    },
  ];

  // Row actions
  const rowActions: RowAction<Staff>[] = [
    {
      label: "查看详情",
      icon: <Eye className="w-4 h-4" />,
      onClick: (row) => {
        window.location.href = `/crm/system/staff/${row.id}`;
      },
    },
    {
      label: "编辑",
      icon: <Edit2 className="w-4 h-4" />,
      onClick: handleEdit,
    },
    {
      label: "重置密码",
      icon: <Key className="w-4 h-4" />,
      onClick: handleResetPassword,
    },
    {
      label: "启用/禁用",
      icon: <UserCheck className="w-4 h-4" />,
      onClick: handleToggleStatus,
    },
    {
      label: "删除",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDeleteClick,
      variant: "danger",
    },
  ];

  // Stats
  const activeCount = staff.filter((s) => s.status === "active").length;
  const inactiveCount = staff.filter((s) => s.status === "inactive").length;
  const suspendedCount = staff.filter((s) => s.status === "suspended").length;
  const twoFactorCount = staff.filter((s) => s.twoFactorEnabled).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="员工账户管理"
        description="管理系统员工账户、权限和安全设置"
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
              添加员工
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">总员工数</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{staff.length}</p>
          <p className="text-xs text-slate-400 mt-1">全部员工账户</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">在职员工</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
          <p className="text-xs text-emerald-600 mt-1">
            {staff.length > 0 ? Math.round((activeCount / staff.length) * 100) : 0}% 占比
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">已启用 2FA</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{twoFactorCount}</p>
          <p className="text-xs text-slate-400 mt-1">
            {staff.length > 0 ? Math.round((twoFactorCount / staff.length) * 100) : 0}% 覆盖率
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">异常账户</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{inactiveCount + suspendedCount}</p>
          <p className="text-xs text-slate-400 mt-1">禁用 + 冻结</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={[
          {
            key: "status",
            label: "状态",
            type: "select",
            options: [
              { label: "全部", value: "all" },
              { label: "启用", value: "active" },
              { label: "禁用", value: "inactive" },
              { label: "冻结", value: "suspended" },
            ],
          },
          {
            key: "department",
            label: "部门",
            type: "select",
            options: [{ label: "全部", value: "" }, ...allDepartments.filter(d => d.status === "active").map((d) => ({ label: d.name, value: d.id }))],
          },
        ]}
        searchable
        searchKeys={["fullName", "email"]}
        searchPlaceholder="搜索姓名或邮箱..."
      />

      {/* Data Table */}
      <Card padding="none">
        {isLoadingStaff ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : staff.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="暂无员工数据"
            description="点击上方按钮添加第一个员工"
          />
        ) : (
          <EnhancedDataTable<Staff>
            columns={columns}
            data={staff}
            keyExtractor={(row) => row.id}
            rowActions={rowActions}
            emptyText="暂无员工数据"
          />
        )}
      </Card>

      {/* Staff Form Dialog */}
      <StaffForm
        staff={currentStaff}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormSuccess}
        roles={roles}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              确认删除员工
            </DialogTitle>
            <DialogDescription className="pt-4">
              您确定要删除员工 <strong>&quot;{staffToAction?.fullName}&quot;</strong> 吗？
              <p className="mt-2 text-sm text-slate-500">
                此操作不可撤销。该员工的所有操作记录将被保留用于审计。
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setIsDeleteDialogOpen(false)} disabled={isProcessing}>
              取消
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={isProcessing}>
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              确认删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Key className="w-5 h-5" />
              密码已重置
            </DialogTitle>
            <DialogDescription className="pt-4">
              <p>员工 <strong>&quot;{staffToAction?.fullName}&quot;</strong> 的密码已重置。</p>
              <div className="mt-4 p-4 bg-slate-100 rounded-lg">
                <p className="text-sm text-slate-600 mb-2">临时密码：</p>
                <code className="block p-3 bg-white rounded border font-mono text-lg text-center select-all">
                  {tempPassword}
                </code>
                <p className="text-xs text-slate-500 mt-2">
                  请复制此密码并提供给员工。员工首次登录时需要修改密码。
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setIsResetPasswordDialogOpen(false)}>
              关闭
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
