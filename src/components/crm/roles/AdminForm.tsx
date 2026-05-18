"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { useRoleStore } from "@/store/crm/roleStore";
import { useAdminStore } from "@/store/crm/roleStore";
import type {
  AdminUser,
  CreateAdminRequest,
  UpdateAdminRequest,
} from "@/types/backoffice/role";

interface AdminFormProps {
  admin?: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AdminForm({ admin, open, onOpenChange, onSuccess }: AdminFormProps) {
  const { roles } = useRoleStore();
  const { createAdmin, updateAdmin } = useAdminStore();
  const isEditing = !!admin;

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    realName: "",
    password: "",
    roleId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Reset form when admin changes
  useEffect(() => {
    if (admin) {
      setFormData({
        username: admin.username,
        email: admin.email,
        phone: admin.phone || "",
        realName: admin.realName || "",
        password: "",
        roleId: admin.role.id,
      });
    } else {
      setFormData({
        username: "",
        email: "",
        phone: "",
        realName: "",
        password: "",
        roleId: roles.find((r) => r.status === "active")?.id || "",
      });
    }
    setErrors({});
    setShowPassword(false);
  }, [admin, open, roles]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "用户名不能为空";
    } else if (formData.username.length < 3) {
      newErrors.username = "用户名至少3个字符";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "用户名只能包含字母、数字和下划线";
    }

    if (!formData.email.trim()) {
      newErrors.email = "邮箱不能为空";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "请输入有效的邮箱地址";
    }

    if (formData.phone && !/^\+?[\d\s-]+$/.test(formData.phone)) {
      newErrors.phone = "请输入有效的电话号码";
    }

    if (!isEditing && !formData.password) {
      newErrors.password = "密码不能为空";
    } else if (!isEditing && formData.password.length < 6) {
      newErrors.password = "密码至少6个字符";
    }

    if (!formData.roleId) {
      newErrors.roleId = "请选择角色";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      if (isEditing && admin) {
        const updates: UpdateAdminRequest = {};
        if (formData.email !== admin.email) updates.email = formData.email;
        if (formData.phone !== (admin.phone || "")) updates.phone = formData.phone;
        if (formData.realName !== (admin.realName || ""))
          updates.realName = formData.realName;
        if (formData.roleId !== admin.role.id) updates.roleId = formData.roleId;

        if (Object.keys(updates).length > 0) {
          const result = await updateAdmin(admin.id, updates);
          if (result) {
            onOpenChange(false);
            onSuccess?.();
          }
        } else {
          onOpenChange(false);
        }
      } else {
        const data: CreateAdminRequest = {
          username: formData.username,
          email: formData.email,
          phone: formData.phone || undefined,
          realName: formData.realName || undefined,
          password: formData.password,
          roleId: formData.roleId,
        };
        const result = await createAdmin(data);
        if (result) {
          onOpenChange(false);
          onSuccess?.();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password }));
    setShowPassword(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[var(--tp-fg)]">
            {isEditing ? "编辑管理员" : "创建管理员"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 mt-4">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" required>
              用户名
            </Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              placeholder="请输入用户名"
              error={errors.username}
              disabled={isSubmitting || isEditing}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" required>
              邮箱
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="请输入邮箱地址"
              error={errors.email}
              disabled={isSubmitting}
            />
          </div>

          {/* Real Name & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="realName">真实姓名</Label>
              <Input
                id="realName"
                value={formData.realName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, realName: e.target.value }))
                }
                placeholder="真实姓名"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">手机号码</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="手机号码"
                error={errors.phone}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Password */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password" required>
                初始密码
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="请输入初始密码"
                    error={errors.password}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--tp-fg-muted)] hover:text-[var(--tp-fg)]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                  disabled={isSubmitting}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role" required>
              角色
            </Label>
            <Select
              value={formData.roleId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, roleId: value }))
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择角色" />
              </SelectTrigger>
              {errors.roleId && <p className="text-sm text-red-500 mt-1">{errors.roleId}</p>}
              <SelectContent>
                {roles
                  .filter((r) => r.status === "active")
                  .map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "保存修改" : "创建管理员"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
