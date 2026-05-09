/**
 * RBAC Permission Hook
 * 基于角色的权限检查
 */

import { useCallback } from "react";

export type UserRole = "admin" | "finance" | "risk" | "support" | "kyc" | "operations" | "compliance";

export interface PermissionRule {
  tab?: string;
  action?: string;
  roles: UserRole[];
}

// Tab 级权限配置
const TAB_PERMISSIONS: Record<string, UserRole[]> = {
  overview: ["admin", "finance", "risk", "support", "kyc", "operations", "compliance"],
  kyc: ["admin", "kyc", "compliance"],
  accounts: ["admin", "operations"],
  funds: ["admin", "finance", "risk"],
  trading: ["admin", "risk"],
  risk: ["admin", "risk", "compliance"],
  devices: ["admin", "risk", "support"],
  cases: ["admin", "kyc", "finance", "compliance"],
  tickets: ["admin", "support"],
  permissions: ["admin", "operations"],
  agreements: ["admin", "compliance"],
  timeline: ["admin", "finance", "risk", "support", "kyc", "operations", "compliance"],
  notes: ["admin", "finance", "risk", "support", "kyc", "operations", "compliance"],
  logs: ["admin", "compliance"],
};

// Action 级权限配置
const ACTION_PERMISSIONS: Record<string, UserRole[]> = {
  freeze_account: ["admin", "risk"],
  unfreeze_account: ["admin", "risk"],
  restrict_withdrawal: ["admin", "finance", "risk"],
  allow_withdrawal: ["admin", "finance", "risk"],
  kyc_approve: ["admin", "kyc"],
  kyc_reject: ["admin", "kyc"],
  adjust_leverage: ["admin", "operations"],
  modify_permissions: ["admin", "operations"],
  create_ticket: ["admin", "support"],
  send_notification: ["admin", "support", "operations"],
};

export function useRBAC(userRole?: UserRole) {
  const canAccessTab = useCallback(
    (tabKey: string): boolean => {
      if (!userRole) return false;
      const allowed = TAB_PERMISSIONS[tabKey];
      return allowed ? allowed.includes(userRole) : false;
    },
    [userRole]
  );

  const canPerformAction = useCallback(
    (action: string): boolean => {
      if (!userRole) return false;
      const allowed = ACTION_PERMISSIONS[action];
      return allowed ? allowed.includes(userRole) : false;
    },
    [userRole]
  );

  return { canAccessTab, canPerformAction, userRole };
}
