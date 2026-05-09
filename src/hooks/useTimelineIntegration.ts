/**
 * Timeline Integration Hook
 * 关键操作自动同步到 Timeline
 */

import { useCallback } from "react";
import type { TimelineEventType } from "@/types/backoffice/client-detail";

export interface TimelineEntry {
  clientId: string;
  type: TimelineEventType;
  title: string;
  description: string;
  operator?: string;
  metadata?: Record<string, unknown>;
}

export function useTimelineIntegration() {
  const addEvent = useCallback((entry: TimelineEntry) => {
    // TODO: 接入后端 API，写入 Timeline
    console.log("[TIMELINE]", {
      ...entry,
      id: `tl-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // 预定义的常用事件快捷方法
  const addAccountFrozen = useCallback(
    (clientId: string, operator?: string) =>
      addEvent({ clientId, type: "account_frozen", title: "账户冻结", description: "账户已被冻结", operator }),
    [addEvent]
  );

  const addAccountUnfrozen = useCallback(
    (clientId: string, operator?: string) =>
      addEvent({ clientId, type: "account_unfrozen", title: "账户解冻", description: "账户已解冻", operator }),
    [addEvent]
  );

  const addKycApproved = useCallback(
    (clientId: string, operator?: string) =>
      addEvent({ clientId, type: "kyc_approved", title: "KYC 审核通过", description: "身份验证已通过", operator }),
    [addEvent]
  );

  const addKycRejected = useCallback(
    (clientId: string, operator?: string) =>
      addEvent({ clientId, type: "kyc_rejected", title: "KYC 审核拒绝", description: "身份验证被拒绝", operator }),
    [addEvent]
  );

  const addPermissionUpdated = useCallback(
    (clientId: string, field: string, oldVal: string, newVal: string, operator?: string) =>
      addEvent({
        clientId,
        type: "permission_updated",
        title: "权限更新",
        description: `${field}: ${oldVal} → ${newVal}`,
        operator,
        metadata: { field, oldValue: oldVal, newValue: newVal },
      }),
    [addEvent]
  );

  return { addEvent, addAccountFrozen, addAccountUnfrozen, addKycApproved, addKycRejected, addPermissionUpdated };
}
