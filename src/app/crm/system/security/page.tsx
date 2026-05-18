"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield,
  Lock,
  Globe,
  Key,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import {
  Button,
  PageHeader,
  Card,
} from "@/components/crm/ui";
import {
  useToast,
  Switch,
} from "@/components/ui";
import { useSecurityStore } from "@/store/crm/securityStore";
import type { SecuritySettings, UpdateSecuritySettingsRequest } from "@/types/backoffice/security";

// Boolean 类型的设置字段
type BooleanSettingKey = keyof Omit<
  Pick<SecuritySettings, 
    | "enforceOtp" 
    | "enforceTwoFactor" 
    | "passwordRequireUppercase" 
    | "passwordRequireLowercase" 
    | "passwordRequireNumbers" 
    | "passwordRequireSymbols" 
    | "ipWhitelistEnabled" 
    | "ipBlacklistEnabled" 
    | "geoRestrictionEnabled"
  >,
  never
>;

// Number 类型的设置字段
type NumberSettingKey = keyof Omit<
  Pick<SecuritySettings,
    | "maxLoginFailures"
    | "lockoutDurationMinutes"
    | "sessionTimeoutMinutes"
    | "passwordMinLength"
    | "passwordExpiryDays"
    | "passwordHistoryCount"
  >,
  never
>;

export default function SecurityPage() {
  const { toast } = useToast();
  const { settings, stats, isLoadingSettings, fetchSettings, updateSettings, fetchStats } = useSecurityStore();

  const [localSettings, setLocalSettings] = useState(settings);

  // Load data
  useEffect(() => {
    fetchSettings();
    fetchStats();
  }, [fetchSettings, fetchStats]);

  // Sync local settings
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Handle toggle
  const handleToggle = async (key: BooleanSettingKey, value: boolean) => {
    if (!localSettings) return;

    setLocalSettings({ ...localSettings, [key]: value });

    const result = await updateSettings({ [key]: value } as UpdateSecuritySettingsRequest);
    if (result) {
      toast({
        title: "设置已更新",
        description: "安全设置已成功保存",
      });
    }
  };

  // Handle slider change
  const handleSliderChange = async (key: NumberSettingKey, value: number) => {
    if (!localSettings) return;

    setLocalSettings({ ...localSettings, [key]: value });
  };

  const handleSliderCommit = async (key: NumberSettingKey, value: number) => {
    const result = await updateSettings({ [key]: value } as UpdateSecuritySettingsRequest);
    if (result) {
      toast({
        title: "设置已更新",
        description: "安全设置已成功保存",
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
      {/* Page Header */}
      <PageHeader
        title="安全管理"
        description="配置系统安全策略、访问控制和密码规则"
      />

      {/* Security Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Card className="!p-4">
            <p className="text-sm text-slate-500">今日登录</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalLoginsToday}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-sm text-slate-500">失败登录</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.failedLoginsToday}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-sm text-slate-500">拦截尝试</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.blockedAttemptsToday}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-sm text-slate-500">独立 IP</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.uniqueIpsToday}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-sm text-slate-500">可疑事件</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.suspiciousEventsToday}</p>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Login Security */}
        <Card className="!p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">登录安全</h3>
              <p className="text-sm text-slate-500">配置登录验证和会话管理</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Enforce OTP */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">强制 OTP</p>
                <p className="text-sm text-slate-500">所有员工登录时必须输入邮箱/短信验证码</p>
              </div>
              <Switch
                checked={localSettings.enforceOtp}
                onCheckedChange={(checked) => handleToggle("enforceOtp", checked)}
              />
            </div>

            {/* Enforce 2FA */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">强制 2FA</p>
                <p className="text-sm text-slate-500">所有员工必须启用双因素认证</p>
              </div>
              <Switch
                checked={localSettings.enforceTwoFactor}
                onCheckedChange={(checked) => handleToggle("enforceTwoFactor", checked)}
              />
            </div>

            {/* Max Login Failures */}
            <div>
              <div className="flex justify-between mb-2">
                <p className="font-medium text-slate-900 dark:text-white">最大登录失败次数</p>
                <span className="text-sm text-slate-600">{localSettings.maxLoginFailures} 次</span>
              </div>
              <input
                type="range"
                min={3}
                max={10}
                value={localSettings.maxLoginFailures}
                onChange={(e) => handleSliderChange("maxLoginFailures", parseInt(e.target.value))}
                onMouseUp={(e) => handleSliderCommit("maxLoginFailures", parseInt((e.target as HTMLInputElement).value))}
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">超过此次数将锁定账户</p>
            </div>

            {/* Lockout Duration */}
            <div>
              <div className="flex justify-between mb-2">
                <p className="font-medium text-slate-900 dark:text-white">锁定时长</p>
                <span className="text-sm text-slate-600">{localSettings.lockoutDurationMinutes} 分钟</span>
              </div>
              <input
                type="range"
                min={5}
                max={120}
                step={5}
                value={localSettings.lockoutDurationMinutes}
                onChange={(e) => handleSliderChange("lockoutDurationMinutes", parseInt(e.target.value))}
                onMouseUp={(e) => handleSliderCommit("lockoutDurationMinutes", parseInt((e.target as HTMLInputElement).value))}
                className="w-full"
              />
            </div>

            {/* Session Timeout */}
            <div>
              <div className="flex justify-between mb-2">
                <p className="font-medium text-slate-900 dark:text-white">会话超时</p>
                <span className="text-sm text-slate-600">{localSettings.sessionTimeoutMinutes} 分钟</span>
              </div>
              <input
                type="range"
                min={15}
                max={480}
                step={15}
                value={localSettings.sessionTimeoutMinutes}
                onChange={(e) => handleSliderChange("sessionTimeoutMinutes", parseInt(e.target.value))}
                onMouseUp={(e) => handleSliderCommit("sessionTimeoutMinutes", parseInt((e.target as HTMLInputElement).value))}
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">无操作后自动登出</p>
            </div>
          </div>
        </Card>

        {/* IP Restriction */}
        <Card className="!p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-green-100 text-green-600">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">IP 围栏</h3>
              <p className="text-sm text-slate-500">配置 IP 访问控制规则</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* IP Whitelist */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">IP 白名单</p>
                <p className="text-sm text-slate-500">仅允许指定 IP 段访问</p>
              </div>
              <Switch
                checked={localSettings.ipWhitelistEnabled}
                onCheckedChange={(checked) => handleToggle("ipWhitelistEnabled", checked)}
              />
            </div>

            {/* IP Blacklist */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">IP 黑名单</p>
                <p className="text-sm text-slate-500">阻止指定 IP 段访问</p>
              </div>
              <Switch
                checked={localSettings.ipBlacklistEnabled}
                onCheckedChange={(checked) => handleToggle("ipBlacklistEnabled", checked)}
              />
            </div>

            {/* Geo Restriction */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">地理位置限制</p>
                <p className="text-sm text-slate-500">限制特定国家/地区访问</p>
              </div>
              <Switch
                checked={localSettings.geoRestrictionEnabled}
                onCheckedChange={(checked) => handleToggle("geoRestrictionEnabled", checked)}
              />
            </div>

            {/* Manage IP Rules Button */}
            <Link href="/crm/system/security/ip-restriction">
              <Button variant="secondary" className="w-full mt-4">
                管理 IP 规则
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Password Policy */}
        <Card className="!p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">密码策略</h3>
              <p className="text-sm text-slate-500">配置密码复杂度和过期规则</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-700">最小长度</span>
              <span className="font-medium">{localSettings.passwordMinLength} 位</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-700">要求大写字母</span>
              {localSettings.passwordRequireUppercase ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-700">要求小写字母</span>
              {localSettings.passwordRequireLowercase ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-700">要求数字</span>
              {localSettings.passwordRequireNumbers ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-700">要求特殊字符</span>
              {localSettings.passwordRequireSymbols ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-700">密码过期时间</span>
              <span className="font-medium">{localSettings.passwordExpiryDays} 天</span>
            </div>
          </div>

          <Link href="/crm/system/security/password-policy">
            <Button variant="secondary" className="w-full mt-6">
              配置密码策略
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </Card>

        {/* Security Events */}
        <Card className="!p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-red-100 text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">安全事件</h3>
              <p className="text-sm text-slate-500">查看和处理安全告警</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">严重事件待处理</p>
                <p className="text-xs text-red-700">发现 1 个异地登录异常</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">中等风险事件</p>
                <p className="text-xs text-amber-700">2 个可疑活动待审核</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">已处理事件</p>
                <p className="text-xs text-green-700">今日已处理 5 个事件</p>
              </div>
            </div>
          </div>

          <Link href="/crm/system/security/logs">
            <Button variant="secondary" className="w-full mt-6">
              查看安全日志
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
