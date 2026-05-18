"use client";

import { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui";
import { Button } from "@/components/crm/ui";
import type { ChangePasswordRequest } from "@/types/backoffice/profile";

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ChangePasswordRequest) => Promise<{ success: boolean; message: string }>;
  isSubmitting?: boolean;
}

// Extracted to module level to avoid "Cannot create components during render"
interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
}

function PasswordInput({
  label,
  value,
  onChange,
  error,
  show,
  onToggle,
  placeholder,
}: PasswordInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full h-10 px-3 pr-10 bg-white dark:bg-slate-900 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900",
            error
              ? "border-red-300 focus:border-red-400"
              : "border-gray-200 dark:border-slate-700 focus:border-blue-400"
          )}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ChangePasswordRequest) => Promise<{ success: boolean; message: string }>;
  isSubmitting?: boolean;
}

export function PasswordDialog({ open, onOpenChange, onSubmit, isSubmitting }: PasswordDialogProps) {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = "请输入当前密码";
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = "请输入新密码";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "新密码至少需要 8 位";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = "新密码需要包含大小写字母和数字";
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "两次输入的密码不一致";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    
    if (!validate()) return;
    
    const result = await onSubmit({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword,
    });
    
    if (result.success) {
      // 重置表单
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      onOpenChange(false);
    } else {
      setSubmitError(result.message);
    }
  };

  const handleClose = () => {
    setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setErrors({});
    setSubmitError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">修改密码</DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-slate-400">
            请输入当前密码和新密码来修改您的登录密码
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 mt-4">
          <PasswordInput
            label="当前密码"
            value={formData.currentPassword}
            onChange={(v) => setFormData({ ...formData, currentPassword: v })}
            error={errors.currentPassword}
            show={showPassword.current}
            onToggle={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
            placeholder="请输入当前密码"
          />

          <PasswordInput
            label="新密码"
            value={formData.newPassword}
            onChange={(v) => setFormData({ ...formData, newPassword: v })}
            error={errors.newPassword}
            show={showPassword.new}
            onToggle={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
            placeholder="至少 8 位，包含大小写字母和数字"
          />

          <PasswordInput
            label="确认新密码"
            value={formData.confirmPassword}
            onChange={(v) => setFormData({ ...formData, confirmPassword: v })}
            error={errors.confirmPassword}
            show={showPassword.confirm}
            onToggle={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
            placeholder="请再次输入新密码"
          />

          {submitError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              确认修改
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
