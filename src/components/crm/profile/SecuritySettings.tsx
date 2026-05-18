"use client";

import { Shield, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/crm/ui";
import { TwoFAManagementMenu } from "@/components/crm/twofa/TwoFAManagementMenu";
import type { TwoFactorStatus } from "@/types/backoffice/profile";

interface SecuritySettingsProps {
  twoFactorStatus: TwoFactorStatus | null;
  isLoading?: boolean;
  onChangePassword?: () => void;
  onTwoFAStatusChange?: () => void;
}

export function SecuritySettings({ 
  twoFactorStatus, 
  isLoading, 
  onChangePassword,
  onTwoFAStatusChange 
}: SecuritySettingsProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        安全设置
      </h3>

      <div className="space-y-3">
        {/* Password */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700">
              <Shield className="w-5 h-5 text-gray-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">登录密码</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                建议定期更换密码以保护账户安全
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={onChangePassword}>
            修改密码
          </Button>
        </div>

        {/* 2FA */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700">
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-gray-600 dark:text-slate-400 animate-spin" />
              ) : twoFactorStatus?.enabled ? (
                <ShieldCheck className="w-5 h-5 text-green-600" />
              ) : (
                <Shield className="w-5 h-5 text-gray-600 dark:text-slate-400" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                双因素认证 (2FA)
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {isLoading
                  ? "加载中..."
                  : twoFactorStatus?.enabled
                  ? `已启用 (TOTP)${twoFactorStatus.backupCodesRemaining !== undefined 
                      ? ` · 备份码剩余 ${twoFactorStatus.backupCodesRemaining} 个` 
                      : ""}`
                  : "未启用，建议开启以增强账户安全"}
              </p>
            </div>
          </div>
          <TwoFAManagementMenu onStatusChange={onTwoFAStatusChange} />
        </div>
      </div>
    </div>
  );
}
