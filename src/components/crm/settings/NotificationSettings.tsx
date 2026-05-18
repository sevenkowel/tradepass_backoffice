"use client";

import { Mail, Bell, Shield, Wallet, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserSettings } from "@/types/backoffice/settings";

interface NotificationSettingsProps {
  notifications: UserSettings["notifications"];
  onChange: (notifications: UserSettings["notifications"]) => void;
}

// Extracted to module level to avoid "Cannot create components during render"
interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        checked ? "bg-blue-600" : "bg-gray-200 dark:bg-slate-700",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

export function NotificationSettings({
  notifications,
  onChange,
}: NotificationSettingsProps) {
  const handleEmailToggle = () => {
    onChange({
      ...notifications,
      email: {
        ...notifications.email,
        enabled: !notifications.email.enabled,
      },
    });
  };

  const handleEmailItemToggle = (
    key: keyof Omit<UserSettings["notifications"]["email"], "enabled">
  ) => {
    onChange({
      ...notifications,
      email: {
        ...notifications.email,
        [key]: !notifications.email[key],
      },
    });
  };

  const handleInAppToggle = () => {
    onChange({
      ...notifications,
      inApp: !notifications.inApp,
    });
  };

  const emailItems = [
    {
      key: "kyc" as const,
      label: "KYC 审核通知",
      description: "有新的 KYC 申请需要审核时通知我",
      icon: Shield,
    },
    {
      key: "risk" as const,
      label: "风险告警通知",
      description: "账户风险指标异常时通知我",
      icon: Bell,
    },
    {
      key: "withdrawal" as const,
      label: "大额出金通知",
      description: "有大额出金申请需要审核时通知我",
      icon: Wallet,
    },
    {
      key: "announcement" as const,
      label: "系统公告通知",
      description: "系统发布重要公告时通知我",
      icon: Megaphone,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Email Master Toggle */}
      <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              邮件通知总开关
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              控制是否接收所有邮件通知
            </p>
          </div>
        </div>
        <Toggle checked={notifications.email.enabled} onChange={handleEmailToggle} />
      </div>

      {/* Email Notification Items */}
      <div className="space-y-3">
        {emailItems.map((item) => (
          <div
            key={item.key}
            className={cn(
              "flex items-center justify-between py-3",
              !notifications.email.enabled && "opacity-50"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              <div>
                <p
                  className={cn(
                    "font-medium",
                    notifications.email.enabled
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-slate-400"
                  )}
                >
                  {item.label}
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            </div>
            <Toggle
              checked={notifications.email[item.key]}
              onChange={() => handleEmailItemToggle(item.key)}
              disabled={!notifications.email.enabled}
            />
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 dark:border-slate-700" />

      {/* In-App Notifications */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              站内通知
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              在系统内接收实时通知提醒
            </p>
          </div>
        </div>
        <Toggle checked={notifications.inApp} onChange={handleInAppToggle} />
      </div>
    </div>
  );
}
