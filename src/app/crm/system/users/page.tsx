"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Key,
  Shield,
  User,
  Mail,
  Phone,
} from "lucide-react";
import {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
  Avatar,
  AvatarFallback,
} from "@/components/ui";
import { AdminForm } from "@/components/crm/roles/AdminForm";
import { PagePermissionGuard } from "@/components/crm/roles/PermissionGuard";
import { useAdminStore } from "@/store/crm/roleStore";
import { useRoleStore } from "@/store/crm/roleStore";
import type { AdminUser } from "@/types/backoffice/role";

export default function UsersPage() {
  return (
    <PagePermissionGuard module="system" action="admin">
      <UsersPageContent />
    </PagePermissionGuard>
  );
}

function UsersPageContent() {
  const { toast } = useToast();
  const { admins, isLoadingAdmins, fetchAdmins, deleteAdmin, toggleAdminStatus, resetPassword, setCurrentAdmin, currentAdmin } = useAdminStore();
  const { roles } = useRoleStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [adminToAction, setAdminToAction] = useState<AdminUser | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Load admins on mount
  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Filter admins
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      !searchQuery ||
      admin.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.realName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || admin.role.id === roleFilter;
    const matchesStatus = statusFilter === "all" || admin.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle edit
  const handleEdit = (admin: AdminUser) => {
    setCurrentAdmin(admin);
    setIsFormOpen(true);
  };

  // Handle create
  const handleCreate = () => {
    setCurrentAdmin(null);
    setIsFormOpen(true);
  };

  // Handle form success
  const handleFormSuccess = useCallback(() => {
    fetchAdmins({ keyword: searchQuery, roleId: roleFilter, status: statusFilter });
    toast({
      title: currentAdmin ? "管理员已更新" : "管理员已创建",
      description: currentAdmin ? "管理员信息已成功保存" : "新管理员已成功添加到系统中",
    });
  }, [fetchAdmins, searchQuery, roleFilter, statusFilter, currentAdmin, toast]);

  // Handle delete click
  const handleDeleteClick = (admin: AdminUser) => {
    setAdminToAction(admin);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!adminToAction) return;

    setIsProcessing(true);
    try {
      const success = await deleteAdmin(adminToAction.id);
      if (success) {
        toast({
          title: "管理员已删除",
          description: `管理员 "${adminToAction.username}" 已成功删除`,
        });
        setIsDeleteDialogOpen(false);
        setAdminToAction(null);
      } else {
        toast({
          title: "删除失败",
          description: adminToAction.role.id === "super_admin"
            ? "超级管理员账号无法删除"
            : "删除管理员时发生错误",
          variant: "error",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (admin: AdminUser) => {
    const result = await toggleAdminStatus(admin.id);
    if (result) {
      toast({
        title: result.status === "active" ? "管理员已启用" : "管理员已禁用",
        description: `管理员 "${result.username}" 已${result.status === "active" ? "启用" : "禁用"}`,
      });
    }
  };

  // Handle reset password click
  const handleResetPasswordClick = (admin: AdminUser) => {
    setAdminToAction(admin);
    setNewPassword("");
    setIsResetPasswordDialogOpen(true);
  };

  // Confirm reset password
  const confirmResetPassword = async () => {
    if (!adminToAction || !newPassword) return;

    setIsProcessing(true);
    try {
      const success = await resetPassword(adminToAction.id, newPassword);
      if (success) {
        toast({
          title: "密码已重置",
          description: `管理员 "${adminToAction.username}" 的密码已成功重置`,
        });
        setIsResetPasswordDialogOpen(false);
        setAdminToAction(null);
        setNewPassword("");
      } else {
        toast({
          title: "重置失败",
          description: "重置密码时发生错误",
          variant: "error",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate random password
  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--tp-fg)]">管理员管理</h1>
          <p className="text-sm text-[var(--tp-fg-muted)] mt-1">管理系统管理员账号和权限分配</p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          创建管理员
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--tp-fg-muted)]">总管理员</p>
              <p className="text-2xl font-bold text-[var(--tp-fg)]">{admins.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--tp-fg-muted)]">已启用</p>
              <p className="text-2xl font-bold text-[var(--tp-fg)]">
                {admins.filter((a) => a.status === "active").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--tp-fg-muted)]">角色类型</p>
              <p className="text-2xl font-bold text-[var(--tp-fg)]">{roles.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--tp-fg-muted)]" />
          <Input
            placeholder="搜索用户名、邮箱或姓名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="角色筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部角色</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">已启用</SelectItem>
            <SelectItem value="inactive">已禁用</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Admins Table */}
      <Card>
        <CardContent className="p-0">
          {isLoadingAdmins ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--tp-accent)]" />
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="w-12 h-12 text-[var(--tp-fg-muted)] mb-4" />
              <p className="text-lg font-medium text-[var(--tp-fg)]">暂无管理员数据</p>
              <p className="text-sm text-[var(--tp-fg-muted)] mt-1">
                {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                  ? "请调整筛选条件"
                  : "点击上方按钮创建第一个管理员"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--tp-fg)]">管理员</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--tp-fg)]">角色</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--tp-fg)]">联系方式</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--tp-fg)]">最后登录</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-[var(--tp-fg)]">状态</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[var(--tp-fg)]">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9">
                            <AvatarFallback className="bg-[var(--tp-accent)] text-white text-sm">
                              {admin.realName?.charAt(0) || admin.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-[var(--tp-fg)]">{admin.realName || admin.username}</div>
                            <div className="text-xs text-[var(--tp-fg-muted)]">@{admin.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{admin.role.name}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-[var(--tp-fg)]">
                            <Mail className="w-3.5 h-3.5 text-[var(--tp-fg-muted)]" />
                            {admin.email}
                          </div>
                          {admin.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-[var(--tp-fg-muted)]">
                              <Phone className="w-3.5 h-3.5" />
                              {admin.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-[var(--tp-fg)]">
                          {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString("zh-CN") : "从未登录"}
                        </div>
                        {admin.lastLoginIp && (
                          <div className="text-xs text-[var(--tp-fg-muted)]">IP: {admin.lastLoginIp}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(admin)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            admin.status === "active"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200"
                          }`}
                        >
                          {admin.status === "active" ? (
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
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(admin)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPasswordClick(admin)}>
                              <Key className="w-4 h-4 mr-2" />
                              重置密码
                            </DropdownMenuItem>
                            {admin.role.id !== "super_admin" && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(admin)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                删除
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Form Dialog */}
      <AdminForm admin={currentAdmin} open={isFormOpen} onOpenChange={setIsFormOpen} onSuccess={handleFormSuccess} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              确认删除管理员
            </DialogTitle>
            <DialogDescription className="pt-4">
              您确定要删除管理员 <strong>&quot;{adminToAction?.username}&quot;</strong> 吗？
              <p className="mt-2 text-sm text-[var(--tp-fg-muted)]">此操作不可撤销，删除后该管理员将无法登录系统。</p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isProcessing}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isProcessing}>
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
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              重置密码
            </DialogTitle>
            <DialogDescription className="pt-4">
              为管理员 <strong>&quot;{adminToAction?.username}&quot;</strong> 设置新密码
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <div className="flex gap-2">
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="输入新密码或点击生成"
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={generatePassword}>
                生成
              </Button>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)} disabled={isProcessing}>
                取消
              </Button>
              <Button onClick={confirmResetPassword} disabled={isProcessing || !newPassword}>
                {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                确认重置
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
