"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Key, CheckCircle2, XCircle, Loader2, Shield } from "lucide-react";
import { Button, PageHeader, Card } from "@/components/crm/ui";
import { useToast, Label, Switch } from "@/components/ui";
import { useSecurityStore } from "@/store/crm/securityStore";
import type { SecuritySettings, UpdateSecuritySettingsRequest } from "@/types/backoffice/security";

// Boolean 类型的密码策略字段
type PasswordBooleanKey = keyof Omit<
  Pick<SecuritySettings,
    | "passwordRequireUppercase"
    | "passwordRequireLowercase"
    | "passwordRequireNumbers"
    | "passwordRequireSymbols"
  >,
  never
>;

// Number 类型的密码策略字段
type PasswordNumberKey = keyof Omit<
  Pick<SecuritySettings,
    | "passwordMinLength"
    | "passwordExpiryDays"
    | "passwordHistoryCount"
  >,
  never
>;

export default function PasswordPolicyPage() {
  const { toast } = useToast();
  const { settings, isLoadingSettings, fetchSettings, updateSettings } = useSecurityStore();
  const [localSettings, setLocalSettings] = useState(settings);

  // Load data
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Sync local settings
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Handle toggle
  const handleToggle = async (key: PasswordBooleanKey, value: boolean) => {
    if (!localSettings) return;

    setLocalSettings({ ...localSettings, [key]: value });

    const result = await updateSettings({ [key]: value } as UpdateSecuritySettingsRequest);
    if (result) {
      toast({
        title: "设置已更新",
        description: "密码策略已成功保存",
      });
    }
  };

  // Handle slider change
  const handleSliderChange = (key: PasswordNumberKey, value: number) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, [key]: value });
  };

  const handleSliderCommit = async (key: PasswordNumberKey, value: number) => {
    const result = await updateSettings({ [key]: value } as UpdateSecuritySettingsRequest);
    if (result) {
      toast({
        title: "设置已更新",
        description: "密码策略已成功保存",
      });
    }
  };

  if (isLoadingSettings || !localSettings) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link href="/crm/system/security" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回安全管理
      </Link>

      {/* Page Header */}
      <PageHeader title="密码策略" description="配置员工账户密码的复杂度和安全规则" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password Requirements */}
        <Card className="!p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">密码复杂度</h3>
              <p className="text-sm text-slate-500">设置密码必须包含的字符类型</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Min Length */}
            <div>
              <div className="flex justify-between mb-2">
                <p className="font-medium text-slate-900 dark:text-white">最小长度</p>
                <span className="text-sm text-slate-600">{localSettings.passwordMinLength} 位</span>
              </div>
              <input
                type="range"
                min={6}
                max={32}
                value={localSettings.passwordMinLength}
                onChange={(e) => handleSliderChange("passwordMinLength", parseInt(e.target.value))}
                onMouseUp={(e) => handleSliderCommit("passwordMinLength", parseInt((e.target as HTMLInputElement).value))}
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">建议至少 8 位</p>
            </div>

            {/* Require Uppercase */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">要求大写字母</p>
                <p className="text-sm text-slate-500">密码必须包含至少一个大写字母 (A-Z)</p>
              </div>
              <Switch
                checked={localSettings.passwordRequireUppercase}
                onCheckedChange={(checked) => handleToggle("passwordRequireUppercase", checked)}
              />
            </div>

            {/* Require Lowercase */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">要求小写字母</p>
                <p className="text-sm text-slate-500">密码必须包含至少一个小写字母 (a-z)</p>
              </div>
              <Switch
                checked={localSettings.passwordRequireLowercase}
                onCheckedChange={(checked) => handleToggle("passwordRequireLowercase", checked)}
              />
            </div>

            {/* Require Numbers */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">要求数字</p>
                <p className="text-sm text-slate-500">密码必须包含至少一个数字 (0-9)</p>
              </div>
              <Switch
                checked={localSettings.passwordRequireNumbers}
                onCheckedChange={(checked) => handleToggle("passwordRequireNumbers", checked)}
              />
            </div>

            {/* Require Symbols */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">要求特殊字符</p>
                <p className="text-sm text-slate-500">密码必须包含至少一个特殊字符 (!@#$%^&*)</p>
              </div>
              <Switch
                checked={localSettings.passwordRequireSymbols}
                onCheckedChange={(checked) => handleToggle("passwordRequireSymbols", checked)}
              />
            </div>
          </div>
        </Card>

        {/* Password Expiration */}
        <Card className="!p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">密码过期策略</h3>
              <p className="text-sm text-slate-500">控制密码的有效期和重用规则</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Password Expiry */}
            <div>
              <div className="flex justify-between mb-2">
                <p className="font-medium text-slate-900 dark:text-white">密码过期时间</p>
                <span className="text-sm text-slate-600">{localSettings.passwordExpiryDays} 天</span>
              </div>
              <input
                type="range"
                min={0}
                max={365}
                step={30}
                value={localSettings.passwordExpiryDays}
                onChange={(e) => handleSliderChange("passwordExpiryDays", parseInt(e.target.value))}
                onMouseUp={(e) => handleSliderCommit("passwordExpiryDays", parseInt((e.target as HTMLInputElement).value))}
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">
                {localSettings.passwordExpiryDays === 0
                  ? "密码永不过期"
                  : `密码将在 ${localSettings.passwordExpiryDays} 天后过期，需要强制更换`}
              </p>
            </div>

            {/* Password History */}
            <div>
              <div className="flex justify-between mb-2">
                <p className="font-medium text-slate-900 dark:text-white">历史密码限制</p>
                <span className="text-sm text-slate-600">{localSettings.passwordHistoryCount} 个</span>
              </div>
              <input
                type="range"
                min={0}
                max={24}
                value={localSettings.passwordHistoryCount}
                onChange={(e) => handleSliderChange("passwordHistoryCount", parseInt(e.target.value))}
                onMouseUp={(e) => handleSliderCommit("passwordHistoryCount", parseInt((e.target as HTMLInputElement).value))}
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">
                {localSettings.passwordHistoryCount === 0
                  ? "允许重复使用历史密码"
                  : `禁止重复使用最近 ${localSettings.passwordHistoryCount} 个历史密码`}
              </p>
            </div>
          </div>
        </Card>

        {/* Policy Preview */}
        <Card className="!p-6 lg:col-span-2">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">策略预览</h3>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-3">符合当前策略的密码示例：</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {localSettings.passwordRequireUppercase ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-sm text-slate-700">包含大写字母</span>
              </div>
              <div className="flex items-center gap-2">
                {localSettings.passwordRequireLowercase ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-sm text-slate-700">包含小写字母</span>
              </div>
              <div className="flex items-center gap-2">
                {localSettings.passwordRequireNumbers ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-sm text-slate-700">包含数字</span>
              </div>
              <div className="flex items-center gap-2">
                {localSettings.passwordRequireSymbols ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-sm text-slate-700">包含特殊字符</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm text-slate-700">至少 {localSettings.passwordMinLength} 个字符</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                示例密码: <code className="px-2 py-1 bg-white rounded border font-mono">MyP@ssw0rd123</code>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
