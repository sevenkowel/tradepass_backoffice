/**
 * Banner Store - Zustand + persist
 * 管理 DevTool override 开关 + 用户手动关闭状态
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BannerType } from "@/types/banner";

export interface BannerState {
  // DevTool override：key 为 BannerType，value null = 自动，true/false = 强制
  overrides: Record<BannerType, boolean | null>;

  // 用户手动关闭的 banner（session 级，刷新即恢复）
  dismissed: Record<string, boolean>;

  // Welcome Rewards 专用
  welcomeRegisteredDays: number; // DevTool 模拟：注册距今天数
  welcomeClaimed: boolean;       // 是否已领取

  // 叠加模式（默认开启）
  stackMode: boolean;

  // Actions
  setOverride: (type: BannerType, enabled: boolean | null) => void;
  dismiss: (id: string) => void;
  resetDismissed: () => void;
  setWelcomeRegisteredDays: (days: number) => void;
  setWelcomeClaimed: (claimed: boolean) => void;
  setStackMode: (enabled: boolean) => void;
}

export const useBannerStore = create<BannerState>()(
  persist(
    (set) => ({
      overrides: {
        welcome_rewards: null,
        app_download: null,
      },
      dismissed: {},
      welcomeRegisteredDays: 7,
      welcomeClaimed: false,
      stackMode: true,

      setOverride: (type, enabled) =>
        set((s) => ({
          overrides: { ...s.overrides, [type]: enabled },
        })),

      dismiss: (id) =>
        set((s) => ({
          dismissed: { ...s.dismissed, [id]: true },
        })),

      resetDismissed: () => set({ dismissed: {} }),

      setWelcomeRegisteredDays: (days) =>
        set({ welcomeRegisteredDays: days }),

      setWelcomeClaimed: (claimed) =>
        set({ welcomeClaimed: claimed }),

      setStackMode: (enabled) => set({ stackMode: enabled }),
    }),
    {
      name: "tradepass-banner-store",
      partialize: (s) => ({
        overrides: s.overrides,
        welcomeRegisteredDays: s.welcomeRegisteredDays,
        welcomeClaimed: s.welcomeClaimed,
        stackMode: s.stackMode,
        // 不持久化 dismissed，session 级
      }),
    }
  )
);
