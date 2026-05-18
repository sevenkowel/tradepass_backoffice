"use client";

import { useEffect, useState } from "react";
import { Settings, Loader2, RotateCcw, Save } from "lucide-react";
import { PageHeader, Card, Button } from "@/components/crm/ui";
import { ThemeSettings } from "@/components/crm/settings/ThemeSettings";
import { InterfaceSettings } from "@/components/crm/settings/InterfaceSettings";
import { NotificationSettings } from "@/components/crm/settings/NotificationSettings";
import { useUserSettingsStore } from "@/store/crm/userSettingsStore";
import { useCrmSidebarStore } from "@/store/crmSidebarStore";
import { useTheme } from "@/components/ui/ThemeProvider";
import { useToast } from "@/components/ui";
import type { UserSettings } from "@/types/backoffice/settings";

export default function SettingsPage() {
  const { toast } = useToast();
  const { setTheme: setAppTheme } = useTheme();
  const { setSidebarCollapsed: setCollapsed } = useCrmSidebarStore();

  const {
    settings,
    isLoading,
    isSaving,
    isResetting,
    fetchSettings,
    updateSettings,
    resetSettings,
  } = useUserSettingsStore();

  // 本地状态用于表单编辑
  const [localSettings, setLocalSettings] = useState<UserSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // 加载设置
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // 同步到本地状态
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  // 处理主题变更
  const handleThemeChange = (theme: UserSettings["theme"]) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, theme });
    setHasChanges(true);

    // 立即应用主题
    if (theme === "system") {
      setAppTheme("system");
    } else {
      setAppTheme(theme);
    }
  };

  // 处理侧边栏设置变更
  const handleSidebarChange = (collapsed: boolean) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, sidebarCollapsed: collapsed });
    setHasChanges(true);
  };

  // 处理分页大小变更
  const handlePageSizeChange = (size: UserSettings["tablePageSize"]) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, tablePageSize: size });
    setHasChanges(true);
  };

  // 处理通知设置变更
  const handleNotificationChange = (
    notifications: UserSettings["notifications"]
  ) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, notifications });
    setHasChanges(true);
  };

  // 保存设置
  const handleSave = async () => {
    if (!localSettings) return;

    const success = await updateSettings(localSettings);
    if (success) {
      // 应用设置
      setAppTheme(localSettings.theme);
      setCollapsed(localSettings.sidebarCollapsed);

      toast({
        title: "保存成功",
        description: "系统设置已更新",
      });
      setHasChanges(false);
    } else {
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "error",
      });
    }
  };

  // 重置设置
  const handleReset = async () => {
    const success = await resetSettings();
    if (success) {
      // 应用默认设置
      setAppTheme("system");
      setCollapsed(false);

      toast({
        title: "重置成功",
        description: "系统设置已恢复默认值",
      });
      setHasChanges(false);
    } else {
      toast({
        title: "重置失败",
        description: "请稍后重试",
        variant: "error",
      });
    }
  };

  if (isLoading || !localSettings) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="系统设置"
          description="自定义您的界面和通知偏好"
        />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="系统设置"
        description="自定义您的界面和通知偏好"
        actions={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handleReset}
              disabled={isResetting}
            >
              {isResetting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              恢复默认
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              保存设置
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interface Settings */}
        <Card className="!p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                界面设置
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                自定义系统界面外观
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <ThemeSettings
              theme={localSettings.theme}
              onChange={handleThemeChange}
            />

            <div className="border-t border-gray-100 dark:border-slate-700" />

            <InterfaceSettings
              sidebarCollapsed={localSettings.sidebarCollapsed}
              tablePageSize={localSettings.tablePageSize}
              onSidebarChange={handleSidebarChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="!p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                通知设置
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                管理您的通知偏好
              </p>
            </div>
          </div>

          <NotificationSettings
            notifications={localSettings.notifications}
            onChange={handleNotificationChange}
          />
        </Card>
      </div>
    </div>
  );
}
