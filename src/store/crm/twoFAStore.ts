/**
 * 2FA 状态管理 Store
 * 使用 Zustand 管理 2FA 状态和操作
 */

import { create } from "zustand";
import {
  TwoFactorStatus,
  Enable2FAInitResponse,
  Enable2FAVerifyResponse,
  ViewBackupCodesResponse,
  RegenerateBackupCodesResponse,
  TwoFactorError,
} from "@/types/backoffice/twofa";
import {
  getTwoFactorStatus,
  initEnableTwoFactor,
  verifyAndEnableTwoFactor,
  disableTwoFactor,
  viewBackupCodes,
  regenerateBackupCodes,
  reconfigureTwoFactor,
} from "@/lib/backoffice/mock-twofa";

interface TwoFAState {
  // 状态
  status: TwoFactorStatus | null;
  isLoading: boolean;
  isLoadingAction: boolean;
  error: TwoFactorError | null;

  // 启用流程临时数据
  setupData: Enable2FAInitResponse | null;
  backupCodes: string[] | null;

  // Actions
  fetchStatus: () => Promise<void>;
  initSetup: (password: string) => Promise<boolean>;
  verifySetup: (code: string) => Promise<boolean>;
  disable: (password: string, code: string) => Promise<boolean>;
  viewBackupCodes: (password: string) => Promise<string[] | null>;
  regenerateBackupCodes: (password: string, code: string) => Promise<string[] | null>;
  reconfigure: (password: string, code: string) => Promise<boolean>;
  clearSetup: () => void;
  clearError: () => void;
}

export const useTwoFAStore = create<TwoFAState>((set, get) => ({
  // 初始状态
  status: null,
  isLoading: false,
  isLoadingAction: false,
  error: null,
  setupData: null,
  backupCodes: null,

  // 获取 2FA 状态
  fetchStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const status = await getTwoFactorStatus();
      set({ status, isLoading: false });
    } catch (err) {
      set({
        error: {
          type: "INVALID_CODE",
          message: "获取 2FA 状态失败",
        },
        isLoading: false,
      });
    }
  },

  // 初始化启用 2FA
  initSetup: async (password: string) => {
    set({ isLoadingAction: true, error: null });
    try {
      const result = await initEnableTwoFactor(password);
      if (result.success && result.data) {
        set({
          setupData: result.data,
          isLoadingAction: false,
        });
        return true;
      } else {
        set({
          error: result.error || null,
          isLoadingAction: false,
        });
        return false;
      }
    } catch (err) {
      set({
        error: {
          type: "INVALID_CODE",
          message: "初始化失败，请重试",
        },
        isLoadingAction: false,
      });
      return false;
    }
  },

  // 验证并启用 2FA
  verifySetup: async (code: string) => {
    set({ isLoadingAction: true, error: null });
    try {
      const result = await verifyAndEnableTwoFactor(code);
      if (result.success && result.data) {
        set({
          backupCodes: result.data.backupCodes,
          status: {
            enabled: true,
            createdAt: new Date().toISOString(),
            backupCodesRemaining: result.data.backupCodes.length,
          },
          isLoadingAction: false,
        });
        return true;
      } else {
        set({
          error: result.error || null,
          isLoadingAction: false,
        });
        return false;
      }
    } catch (err) {
      set({
        error: {
          type: "INVALID_CODE",
          message: "验证失败，请重试",
        },
        isLoadingAction: false,
      });
      return false;
    }
  },

  // 禁用 2FA
  disable: async (password: string, code: string) => {
    set({ isLoadingAction: true, error: null });
    try {
      const result = await disableTwoFactor(password, code);
      if (result.success) {
        set({
          status: { enabled: false },
          isLoadingAction: false,
        });
        return true;
      } else {
        set({
          error: result.error || null,
          isLoadingAction: false,
        });
        return false;
      }
    } catch (err) {
      set({
        error: {
          type: "INVALID_CODE",
          message: "禁用失败，请重试",
        },
        isLoadingAction: false,
      });
      return false;
    }
  },

  // 查看备份码
  viewBackupCodes: async (password: string) => {
    set({ isLoadingAction: true, error: null });
    try {
      const result = await viewBackupCodes(password);
      if (result.success && result.data) {
        set({
          backupCodes: result.data.backupCodes,
          isLoadingAction: false,
        });
        return result.data.backupCodes;
      } else {
        set({
          error: result.error || null,
          isLoadingAction: false,
        });
        return null;
      }
    } catch (err) {
      set({
        error: {
          type: "INVALID_PASSWORD",
          message: "查看备份码失败",
        },
        isLoadingAction: false,
      });
      return null;
    }
  },

  // 重新生成备份码
  regenerateBackupCodes: async (password: string, code: string) => {
    set({ isLoadingAction: true, error: null });
    try {
      const result = await regenerateBackupCodes(password, code);
      if (result.success && result.data) {
        set({
          backupCodes: result.data.backupCodes,
          status: {
            ...get().status!,
            backupCodesRemaining: result.data.backupCodes.length,
          },
          isLoadingAction: false,
        });
        return result.data.backupCodes;
      } else {
        set({
          error: result.error || null,
          isLoadingAction: false,
        });
        return null;
      }
    } catch (err) {
      set({
        error: {
          type: "INVALID_CODE",
          message: "重新生成备份码失败",
        },
        isLoadingAction: false,
      });
      return null;
    }
  },

  // 重新配置 2FA
  reconfigure: async (password: string, code: string) => {
    set({ isLoadingAction: true, error: null });
    try {
      const result = await reconfigureTwoFactor(password, code);
      if (result.success && result.data) {
        set({
          setupData: result.data,
          isLoadingAction: false,
        });
        return true;
      } else {
        set({
          error: result.error || null,
          isLoadingAction: false,
        });
        return false;
      }
    } catch (err) {
      set({
        error: {
          type: "INVALID_CODE",
          message: "重新配置失败",
        },
        isLoadingAction: false,
      });
      return false;
    }
  },

  // 清除启用流程数据
  clearSetup: () => {
    set({
      setupData: null,
      backupCodes: null,
    });
  },

  // 清除错误
  clearError: () => {
    set({ error: null });
  },
}));
