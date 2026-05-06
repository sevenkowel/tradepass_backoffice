"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  Key,
  UserCheck,
  UserX,
  Shield,
  ShieldOff,
  Clock,
  MapPin,
  Monitor,
  Globe,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Button,
  PageHeader,
  Card,
  EmptyState,
  EnhancedDataTable,
  type Column,
} from "@/components/crm/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  useToast,
  Badge,
} from "@/components/ui";
import { StaffForm } from "@/components/crm/staff/StaffForm";
import { useStaffStore } from "@/store/crm/staffStore";
import { useRoleStore } from "@/store/crm/roleStore";
import { useDepartmentStore } from "@/store/crm/departmentStore";
import type { Staff, StaffLoginLog, StaffStatus } from "@/types/backoffice/staff";

export default function StaffDetailPage() {
  const params = useParams();
  const staffId = params.id as string;
  const { toast } = useToast();

  const {
    currentStaff,
    loginLogs,
    isLoadingStaff,
    isLoadingLogs,
    fetchStaffById,
    fetchLoginLogs,
    resetPassword,
    reset2fa,
    toggleStaffStatus,
    setCurrentStaff,
  } = useStaffStore();

  const { roles, fetchRoles } = useRoleStore();
  const { departments: deptList, fetchDepartments } = useDepartmentStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isReset2faDialogOpen, setIsReset2faDialogOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load data
  useEffect(() => {
    fetchStaffById(staffId);
    fetchLoginLogs({ staffId });
    fetchRoles();
    fetchDepartments();
  }, [staffId, fetchStaffById, fetchLoginLogs, fetchRoles, fetchDepartments]);

  // Handle edit
  const handleEdit = () => {
    setIsFormOpen(true);
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchStaffById(staffId);
    toast({
      title: "员工已更新",
      description: "员工信息已成功保存",
    });
  };

  // Handle reset password
  const handleResetPassword = async () => {
    if (!currentStaff) return;
    setIsProcessing(true);
    try {
      const password = await resetPassword(currentStaff.id);
      if (password) {
        setTempPassword(password);
        setIsResetPasswordDialogOpen(true);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reset 2FA
  const handleReset2faClick = () => {
    if (!currentStaff) return;
    setIsReset2faDialogOpen(true);
  };

  const handleConfirmReset2fa = async () => {
    if (!currentStaff) return;
    setIsReset2faDialogOpen(false);
    setIsProcessing(true);
    try {
      const success = await reset2fa(currentStaff.id);
      if (success) {
        toast({
          title: "2FA 已重置",
          description: `员工 "${currentStaff.fullName}" 的双重验证已清除`,
        });
        fetchStaffById(staffId);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async () => {
    if (!currentStaff) return;
    const newStatus = currentStaff.status === "active" ? "inactive" : "active";
    const success = await toggleStaffStatus(currentStaff.id);
    if (success) {
      toast({
        title: newStatus === "active" ? "员工已启用" : "员工已禁用",
        description: `员工 "${currentStaff.fullName}" 已${newStatus === "active" ? "启用" : "禁用"}`,
      });
      fetchStaffById(staffId);
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

  // Login log columns
  const logColumns: Column<StaffLoginLog>[] = [
    {
      key: "createdAt",
      title: "时间",
      width: "180px",
      render: (row) => (
        <div className="text-sm">
          <p className="text-slate-900 dark:text-white">
            {new Date(row.createdAt).toLocaleDateString("zh-CN")}
          </p>
          <p className="text-xs text-slate-500">
            {new Date(row.createdAt).toLocaleTimeString("zh-CN")}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      title: "状态",
      width: "100px",
      render: (row) =>
        row.status === "success" ? (
          <span className="inline-flex items-center gap-1 text-green-600 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            成功
          </span>
        ) : row.status === "failed" ? (
          <span className="inline-flex items-center gap-1 text-amber-600 text-sm">
            <XCircle className="w-4 h-4" />
            失败
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            拦截
          </span>
        ),
    },
    {
      key: "ip",
      title: "IP 地址",
      width: "120px",
      render: (row) => <span className="font-mono text-sm text-slate-600">{row.ip}</span>,
    },
    {
      key: "location",
      title: "位置",
      width: "150px",
      render: (row) => (
        <div className="flex items-center gap-1 text-sm text-slate-600">
          <MapPin className="w-3 h-3" />
          {row.location || "未知"}
        </div>
      ),
    },
    {
      key: "browser",
      title: "设备信息",
      render: (row) => (
        <div className="text-sm">
          <div className="flex items-center gap-1 text-slate-700">
            <Globe className="w-3 h-3" />
            {row.browser || "未知浏览器"}
          </div>
          <div className="flex items-center gap-1 text-slate-500 text-xs">
            <Monitor className="w-3 h-3" />
            {row.os || "未知系统"}
          </div>
        </div>
      ),
    },
    {
      key: "failReason",
      title: "备注",
      render: (row) =>
        row.failReason ? (
          <span className="text-sm text-red-600">{row.failReason}</span>
        ) : (
          <span className="text-sm text-slate-400">-</span>
        ),
    },
  ];

  if (isLoadingStaff && !currentStaff) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!currentStaff) {
    return (
      <div className="space-y-6">
        <Link href="/crm/system/staff" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回员工列表
        </Link>
        <EmptyState icon={<AlertCircle className="w-6 h-6" />} title="员工不存在" description="该员工可能已被删除" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link href="/crm/system/staff" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回员工列表
      </Link>

      {/* Page Header */}
      <PageHeader
        title={currentStaff.fullName}
        description={currentStaff.email}
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleEdit}>
              <Edit2 className="w-4 h-4" />
              编辑
            </Button>
            <Button variant="secondary" onClick={handleResetPassword} disabled={isProcessing}>
              <Key className="w-4 h-4" />
              重置密码
            </Button>
            {currentStaff.twoFactorEnabled && (
              <Button variant="secondary" onClick={handleReset2faClick} disabled={isProcessing}>
                <ShieldOff className="w-4 h-4" />
                重置 2FA
              </Button>
            )}
            <Button
              variant={currentStaff.status === "active" ? "danger" : "primary"}
              onClick={handleToggleStatus}
              disabled={isProcessing}
            >
              {currentStaff.status === "active" ? (
                <>
                  <UserX className="w-4 h-4" />
                  禁用
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  启用
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* Profile Card */}
      <Card className="!p-6">
        <div className="flex items-start gap-6">
          <img
            src={currentStaff.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentStaff.email}`}
            alt={currentStaff.fullName}
            className="w-24 h-24 rounded-2xl bg-slate-100"
          />
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-slate-500">昵称</p>
              <p className="text-slate-900 dark:text-white">{currentStaff.nickname || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">性别</p>
              <p className="text-slate-900 dark:text-white">{
                currentStaff.gender === "male" ? "男" :
                currentStaff.gender === "female" ? "女" : "保密"
              }</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">角色</p>
              <p className="text-slate-900 dark:text-white">{currentStaff.roleName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">部门</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {(currentStaff.departmentIds || []).length > 0 ? (
                  currentStaff.departmentIds.map((deptId: string) => {
                    const dept = deptList?.find((d: { id: string }) => d.id === deptId);
                    const isPrimary = deptId === currentStaff.primaryDepartment;
                    return (
                      <span key={deptId} className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${
                        isPrimary ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-600"
                      }`}>
                        {dept?.name || deptId}
                        {isPrimary && <span className="ml-0.5 text-[10px]">默认</span>}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">状态</p>
              <div className="mt-1">{getStatusBadge(currentStaff.status)}</div>
            </div>
            <div>
              <p className="text-sm text-slate-500">手机号</p>
              <p className="text-slate-900 dark:text-white">{currentStaff.phone || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">2FA 状态</p>
              <div className="flex items-center gap-1 mt-1">
                {currentStaff.twoFactorEnabled ? (
                  <>
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 text-sm">已启用</span>
                  </>
                ) : (
                  <span className="text-slate-400 text-sm">未启用</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">创建时间</p>
              <p className="text-slate-900 dark:text-white">
                {new Date(currentStaff.createdAt).toLocaleDateString("zh-CN")}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">最后登录</p>
              <p className="text-slate-900 dark:text-white">
                {currentStaff.lastLoginAt
                  ? new Date(currentStaff.lastLoginAt).toLocaleString("zh-CN")
                  : "从未登录"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Login History */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-500" />
          登录历史
        </h2>
        <Card padding="none">
          {isLoadingLogs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : loginLogs.length === 0 ? (
            <EmptyState icon={<Clock className="w-6 h-6" />} title="暂无登录记录" description="该员工尚未登录系统" />
          ) : (
            <EnhancedDataTable<StaffLoginLog>
              columns={logColumns}
              data={loginLogs}
              keyExtractor={(row) => row.id}
              emptyText="暂无登录记录"
            />
          )}
        </Card>
      </div>

      {/* Staff Form Dialog */}
      <StaffForm staff={currentStaff} open={isFormOpen} onOpenChange={setIsFormOpen} onSuccess={handleFormSuccess} roles={roles} />

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Key className="w-5 h-5" />
              密码已重置
            </DialogTitle>
            <DialogDescription className="pt-4">
              <p>
                员工 <strong>&quot;{currentStaff.fullName}&quot;</strong> 的密码已重置。
              </p>
              <div className="mt-4 p-4 bg-slate-100 rounded-lg">
                <p className="text-sm text-slate-600 mb-2">临时密码：</p>
                <code className="block p-3 bg-white rounded border font-mono text-lg text-center select-all">{tempPassword}</code>
                <p className="text-xs text-slate-500 mt-2">请复制此密码并提供给员工。员工首次登录时需要修改密码。</p>
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

      {/* Reset 2FA Confirm Dialog */}
      <Dialog open={isReset2faDialogOpen} onOpenChange={setIsReset2faDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <ShieldOff className="w-5 h-5" />
              重置双重验证
            </DialogTitle>
            <DialogDescription className="pt-4">
              <p className="text-sm text-slate-600">
                确认重置 <strong>&quot;{currentStaff?.fullName}&quot;</strong> 的双重验证？
              </p>
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                <p>此操作将：</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>清除当前 2FA 绑定</li>
                  <li>员工下次登录需重新绑定 2FA</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setIsReset2faDialogOpen(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleConfirmReset2fa}>
              确认重置
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
