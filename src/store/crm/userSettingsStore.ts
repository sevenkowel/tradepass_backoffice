/**
 * 用户设置 Store
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserSettings } from "@/types/backoffice/settings";
import { defaultUserSettings } from "@/types/backoffice/settings";
import { settingsApi } from "@/lib/backoffice/mock-settings";

interface UserSettingsState {
  // 数据
  settings: UserSettings;
  
  // 加载状态
  isLoading: boolean;
  isSaving: boolean;
  isResetting: boolean;
  
  // 错误
  error: string | null;
  
  // 操作
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<boolean>;
  updateInterfaceSettings: (settings: {
    theme?: UserSettings["theme"];
    sidebarCollapsed?: boolean;
    tablePageSize?: UserSettings["tablePageSize"];
  }) => Promise<boolean>;
  updateNotificationSettings: (settings: UserSettings["notifications"]) => Promise<boolean>;
  resetSettings: () => Promise<boolean>;
  clearError: () => void;
}

export const useUserSettingsStore = create<UserSettingsState>()(
  persist(
    (set, get) => ({
      // 初始状态
      settings: { ...defaultUserSettings },
      isLoading: false,
      isSaving: false,
      isResetting: false,
      error: null,

      // 获取设置
      fetchSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          const settings = await settingsApi.getSettings();
          set({ settings, isLoading: false });
        } catch (err) {
          set({ 
            error: err instanceof Error ? err.message : "获取设置失败", 
            isLoading: false 
          });
        }
      },

      // 更新设置
      updateSettings: async (newSettings) => {
        set({ isSaving: true, error: null });
        try {
          const updated = await settingsApi.updateSettings(newSettings);
          set({ settings: updated, isSaving: false });
          return true;
        } catch (err) {
          set({ 
            error: err instanceof Error ? err.message : "保存设置失败", 
            isSaving: false 
          });
          return false;
        }
      },

      // 更新界面设置
      updateInterfaceSettings: async (interfaceSettings) => {
        set({ isSaving: true, error: null });
        try {
          const updated = await settingsApi.updateInterfaceSettings(interfaceSettings);
          set({ settings: updated, isSaving: false });
          return true;
        } catch (err) {
          set({ 
            error: err instanceof Error ? err.message : "保存界面设置失败", 
            isSaving: false 
          });
          return false;
        }
      },

      // 更新通知设置
      updateNotificationSettings: async (notificationSettings) => {
        set({ isSaving: true, error: null });
        try {
          const updated = await settingsApi.updateNotificationSettings(notificationSettings);
          set({ settings: updated, isSaving: false });
          return true;
        } catch (err) {
          set({ 
            error: err instanceof Error ? err.message : "保存通知设置失败", 
            isSaving: false 
          });
          return false;
        }
      },

      // 重置设置
      resetSettings: async () => {
        set({ isResetting: true, error: null });
        try {
          const settings = await settingsApi.resetSettings();
          set({ settings, isResetting: false });
          return true;
        } catch (err) {
          set({ 
            error: err instanceof Error ? err.message : "重置设置失败", 
            isResetting: false 
          });
          return false;
        }
      },

      // 清除错误
      clearError: () => set({ error: null }),
    }),
    {
      name: "user-settings-storage",
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
