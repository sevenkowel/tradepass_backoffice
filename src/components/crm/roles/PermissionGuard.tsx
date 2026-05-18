"use client";

import { useAuthStore } from "@/store/crm";
import type { PermissionModule } from "@/types/backoffice/role";
import type { PermissionAction } from "@/types/backoffice/common";

interface PermissionGuardProps {
  module: PermissionModule;
  action?: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * 权限守卫组件
 * 根据用户权限决定是否渲染子组件
 */
export function PermissionGuard({
  module,
  action,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission } = useAuthStore();

  if (!hasPermission(module, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface PermissionButtonProps extends PermissionGuardProps {
  disabled?: boolean;
}

/**
 * 带权限检查的按钮包装器
 * 无权限时按钮会被禁用或隐藏
 */
export function PermissionButton({
  module,
  action,
  children,
  disabled,
}: PermissionButtonProps) {
  const { hasPermission } = useAuthStore();
  const hasAccess = hasPermission(module, action);

  if (!hasAccess) {
    return null;
  }

  // Clone the button element and add disabled prop
  return (
    <>
      {disabled !== undefined && React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ disabled?: boolean }>, { disabled })
        : children}
    </>
  );
}

import React from "react";

/**
 * 检查是否有权限的 Hook
 */
export function usePermission() {
  const { hasPermission, user } = useAuthStore();

  const check = (module: PermissionModule, action?: PermissionAction): boolean => {
    return hasPermission(module, action);
  };

  const isSuperAdmin = (): boolean => {
    return user?.role.id === "super_admin";
  };

  return { check, isSuperAdmin, user };
}

/**
 * 页面级权限守卫
 * 无权限时显示 403 页面
 */
interface PagePermissionGuardProps {
  module: PermissionModule;
  action?: PermissionAction;
  children: React.ReactNode;
}

export function PagePermissionGuard({
  module,
  action,
  children,
}: PagePermissionGuardProps) {
  const { check } = usePermission();

  if (!check(module, action)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <svg
            className="w-10 h-10 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[var(--tp-fg)] mb-2">访问被拒绝</h2>
        <p className="text-[var(--tp-fg-muted)] max-w-md">
          您没有权限访问此页面。如需访问，请联系超级管理员为您分配相应权限。
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
