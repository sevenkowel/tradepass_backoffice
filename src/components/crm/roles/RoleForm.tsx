"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Textarea,
} from "@/components/ui";
import { PermissionTree } from "./PermissionTree";
import { useRoleStore } from "@/store/crm/roleStore";
import type {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  Permission,
} from "@/types/backoffice/role";

interface RoleFormProps {
  role?: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RoleForm({ role, open, onOpenChange, onSuccess }: RoleFormProps) {
  const { permissionModules, createRole, updateRole } = useRoleStore();
  const isEditing = !!role;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as Permission[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when role changes
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description || "",
        permissions: role.permissions,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        permissions: [],
      });
    }
    setErrors({});
  }, [role, open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "角色名称不能为空";
    } else if (formData.name.length > 50) {
      newErrors.name = "角色名称不能超过50个字符";
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = "描述不能超过200个字符";
    }

    if (formData.permissions.length === 0) {
      newErrors.permissions = "请至少选择一项权限";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      if (isEditing && role) {
        const updates: UpdateRoleRequest = {};
        if (formData.name !== role.name) updates.name = formData.name;
        if (formData.description !== (role.description || ""))
          updates.description = formData.description;
        if (JSON.stringify(formData.permissions) !== JSON.stringify(role.permissions)) {
          updates.permissions = formData.permissions;
        }

        if (Object.keys(updates).length > 0) {
          const result = await updateRole(role.id, updates);
          if (result) {
            onOpenChange(false);
            onSuccess?.();
          }
        } else {
          onOpenChange(false);
        }
      } else {
        const data: CreateRoleRequest = {
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
        };
        const result = await createRole(data);
        if (result) {
          onOpenChange(false);
          onSuccess?.();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePermissionsChange = (permissions: Permission[]) => {
    setFormData((prev) => ({ ...prev, permissions }));
    if (errors.permissions && permissions.length > 0) {
      setErrors((prev) => ({ ...prev, permissions: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[var(--tp-fg)]">
            {isEditing ? "编辑角色" : "创建角色"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-[var(--tp-fg)] border-b border-gray-200 dark:border-gray-700 pb-2">
                基本信息
              </h3>

              <div className="space-y-2">
                <Label htmlFor="name" required>
                  角色名称
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="请输入角色名称，如：运营专员"
                  error={errors.name}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">角色描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="描述该角色的职责和权限范围"
                  rows={3}
                  error={errors.description}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-[var(--tp-fg)] border-b border-gray-200 dark:border-gray-700 pb-2">
                权限配置
              </h3>

              {errors.permissions && (
                <p className="text-sm text-red-500">{errors.permissions}</p>
              )}

              <PermissionTree
                modules={permissionModules}
                value={formData.permissions}
                onChange={handlePermissionsChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
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
              {isEditing ? "保存修改" : "创建角色"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
