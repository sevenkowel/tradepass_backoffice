/**
 * Audit Trail Hook
 * 记录 Client Detail 页的所有操作，用于合规审计
 */

import { useCallback } from "react";

export interface AuditAction {
  operator: string;
  action: string;
  targetField: string;
  oldValue?: string;
  newValue?: string;
  clientId: string;
  ipAddress?: string;
}

export function useAuditTrail() {
  const record = useCallback((action: AuditAction) => {
    // TODO: 接入后端 API
    console.log("[AUDIT]", {
      ...action,
      timestamp: new Date().toISOString(),
      ipAddress: action.ipAddress || "127.0.0.1",
    });
  }, []);

  return { record };
}

// 预定义的操作类型
export const AuditActions = {
  FREEZE_ACCOUNT: "冻结账户",
  UNFREEZE_ACCOUNT: "解冻账户",
  RESTRICT_WITHDRAWAL: "限制出金",
  ALLOW_WITHDRAWAL: "解除出金限制",
  KYC_APPROVE: "KYC 审核通过",
  KYC_REJECT: "KYC 审核拒绝",
  KYC_REQUEST_RESUBMISSION: "KYC 要求重新提交",
  UPDATE_LEVERAGE: "修改杠杆",
  UPDATE_PERMISSION: "修改权限",
  ADD_NOTE: "添加备注",
  CREATE_TICKET: "创建工单",
  SEND_NOTIFICATION: "发送通知",
  UPDATE_TAGS: "更新标签",
} as const;
