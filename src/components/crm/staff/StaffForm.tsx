"use client";

import { useState, useEffect } from "react";
import { X, Loader2, User, Mail, Phone, Building, Shield, Tag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import type { Staff, CreateStaffRequest, Gender } from "@/types/backoffice/staff";
import type { Role } from "@/types/backoffice/role";
import { useStaffStore } from "@/store/crm/staffStore";
import { useDepartmentStore } from "@/store/crm/departmentStore";

interface StaffFormProps {
  staff: Staff | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  roles: Role[];
}

const genderOptions: { value: Gender; label: string }[] = [
  { value: "male", label: "男" },
  { value: "female", label: "女" },
  { value: "secret", label: "保密" },
];

export function StaffForm({ staff, open, onOpenChange, onSuccess, roles }: StaffFormProps) {
  const { createStaff, updateStaff, isSubmitting } = useStaffStore();
  const { departments, fetchDepartments } = useDepartmentStore();
  const isEditing = !!staff;

  // Load departments on mount
  useEffect(() => {
    if (departments.length === 0) {
      fetchDepartments();
    }
  }, [departments.length, fetchDepartments]);

  const [formData, setFormData] = useState<CreateStaffRequest>({
    email: "",
    phone: "",
    fullName: "",
    nickname: "",
    gender: "secret",
    roleId: "",
    departmentIds: [],
    primaryDepartment: undefined,
    sendWelcomeEmail: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (staff) {
        setFormData({
          email: staff.email,
          phone: staff.phone || "",
          fullName: staff.fullName,
          nickname: staff.nickname || "",
          gender: staff.gender || "secret",
          roleId: staff.roleId,
          departmentIds: staff.departmentIds || [],
          primaryDepartment: staff.primaryDepartment,
          sendWelcomeEmail: false,
        });
      } else {
        setFormData({
          email: "",
          phone: "",
          fullName: "",
          nickname: "",
          gender: "secret",
          roleId: "",
          departmentIds: [],
          primaryDepartment: undefined,
          sendWelcomeEmail: true,
        });
      }
      setErrors({});
    }
  }, [open, staff]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "请输入邮箱";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "请输入有效的邮箱地址";
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = "请输入姓名";
    }

    if (!formData.roleId) {
      newErrors.roleId = "请选择角色";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const deptIds = formData.departmentIds || [];
    const primaryDept = formData.primaryDepartment || (deptIds.length > 0 ? deptIds[0] : undefined);

    if (isEditing && staff) {
      const result = await updateStaff(staff.id, {
        fullName: formData.fullName,
        nickname: formData.nickname,
        gender: formData.gender,
        phone: formData.phone,
        roleId: formData.roleId,
        departmentIds: deptIds,
        primaryDepartment: primaryDept,
      });
      if (result) {
        onSuccess();
      }
    } else {
      const result = await createStaff({
        ...formData,
        departmentIds: deptIds,
        primaryDepartment: primaryDept,
      });
      if (result) {
        onSuccess();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "编辑员工" : "添加员工"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "修改员工信息和角色权限" : "创建新员工账户，员工将通过邮件接收临时密码"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">
              姓名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="请输入员工姓名"
            />
            {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
          </div>

          {/* Nickname */}
          <div className="space-y-2">
            <Label htmlFor="nickname">昵称</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="例如：英文名或花名"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-slate-500">员工昵称，用于系统内显示替代姓名</p>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">性别</Label>
            <Select
              value={formData.gender}
              onValueChange={(value: Gender) => setFormData({ ...formData, gender: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择性别" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              邮箱 <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="请输入邮箱地址（用作登录账号）"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-slate-500">邮箱地址将作为员工登录账号</p>
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">手机号</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入手机号"
                className="pl-10"
              />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">
              角色 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.roleId}
              onValueChange={(value) => setFormData({ ...formData, roleId: value })}
            >
              <SelectTrigger className={errors.roleId ? "border-red-500" : ""}>
                <SelectValue placeholder="请选择角色" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roleId && <p className="text-sm text-red-500">{errors.roleId}</p>}
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label>部门（可多选）</Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-slate-50 min-h-[42px]">
              {formData.departmentIds.length === 0 ? (
                <span className="text-sm text-slate-400">暂未选择部门</span>
              ) : (
                formData.departmentIds.map((deptId) => {
                  const dept = departments.find((d) => d.id === deptId);
                  return (
                    <span
                      key={deptId}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        formData.primaryDepartment === deptId
                          ? "bg-blue-100 text-blue-700 border border-blue-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {dept?.name || deptId}
                      {formData.primaryDepartment === deptId && (
                        <span className="text-[10px] text-blue-500 ml-0.5">默认</span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            departmentIds: formData.departmentIds.filter((id) => id !== deptId),
                            primaryDepartment: formData.primaryDepartment === deptId
                              ? (formData.departmentIds.filter((id) => id !== deptId)[0] || undefined)
                              : formData.primaryDepartment,
                          });
                        }}
                        className="ml-0.5 text-slate-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  );
                })
              )}
            </div>
            {/* Add department dropdown */}
            <div className="flex flex-wrap gap-2">
              {departments
                .filter((d) => d.status === "active" && !formData.departmentIds.includes(d.id))
                .slice(0, 6)
                .map((dept) => (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => {
                      const newIds = [...formData.departmentIds, dept.id];
                      setFormData({
                        ...formData,
                        departmentIds: newIds,
                        primaryDepartment: formData.primaryDepartment || dept.id,
                      });
                    }}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      formData.departmentIds.includes(dept.id)
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    {dept.name}
                  </button>
                ))}
            </div>
            {formData.departmentIds.length > 1 && formData.primaryDepartment && (
              <p className="text-xs text-slate-400">
                点击标签标记为默认部门
              </p>
            )}
          </div>

          {/* Send Welcome Email */}
          {!isEditing && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sendWelcomeEmail"
                checked={formData.sendWelcomeEmail}
                onChange={(e) => setFormData({ ...formData, sendWelcomeEmail: e.target.checked })}
                className="rounded border-slate-300"
              />
              <Label htmlFor="sendWelcomeEmail" className="text-sm font-normal">
                发送欢迎邮件（包含临时密码）
              </Label>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "保存修改" : "创建员工"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
