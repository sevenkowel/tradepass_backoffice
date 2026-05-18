"use client";

import { useState, useEffect } from "react";
import { Loader2, Edit2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/crm/ui";
import type { UserProfile, UpdateProfileRequest } from "@/types/backoffice/profile";

interface ProfileEditFormProps {
  profile: UserProfile;
  onSave: (data: UpdateProfileRequest) => Promise<boolean>;
  isSaving?: boolean;
}

export function ProfileEditForm({ profile, onSave, isSaving }: ProfileEditFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: profile.fullName,
    phone: profile.phone || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 同步外部 profile 变化
  useEffect(() => {
    setFormData({
      fullName: profile.fullName,
      phone: profile.phone || "",
    });
  }, [profile]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "姓名不能为空";
    }
    
    if (formData.phone && !/^\+?[\d\s-]+$/.test(formData.phone)) {
      newErrors.phone = "手机号格式不正确";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    const success = await onSave({
      fullName: formData.fullName,
      phone: formData.phone || undefined,
    });
    
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: profile.fullName,
      phone: profile.phone || "",
    });
    setErrors({});
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          基本信息
        </h3>
        {!isEditing ? (
          <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4 mr-1" />
            编辑
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleCancel} disabled={isSaving}>
              <X className="w-4 h-4 mr-1" />
              取消
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-1" />
              )}
              保存
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            姓名
          </label>
          {isEditing ? (
            <>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={cn(
                  "w-full h-10 px-3 bg-white dark:bg-slate-900 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900",
                  errors.fullName
                    ? "border-red-300 focus:border-red-400"
                    : "border-gray-200 dark:border-slate-700 focus:border-blue-400"
                )}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-900 dark:text-white py-2">{profile.fullName}</p>
          )}
        </div>

        {/* Username (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            用户名
          </label>
          <p className="text-sm text-gray-500 dark:text-slate-400 py-2 font-mono">
            {profile.username}
          </p>
        </div>

        {/* Email (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            邮箱
          </label>
          <p className="text-sm text-gray-500 dark:text-slate-400 py-2">{profile.email}</p>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            手机号
          </label>
          {isEditing ? (
            <>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入手机号"
                className={cn(
                  "w-full h-10 px-3 bg-white dark:bg-slate-900 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900",
                  errors.phone
                    ? "border-red-300 focus:border-red-400"
                    : "border-gray-200 dark:border-slate-700 focus:border-blue-400"
                )}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-900 dark:text-white py-2">
              {profile.phone || "-"}
            </p>
          )}
        </div>

        {/* Department (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            部门
          </label>
          <p className="text-sm text-gray-500 dark:text-slate-400 py-2">
            {profile.department || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}
