/**
 * Trade Settings Store
 * 交易设置状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TradeMode = 'beginner' | 'pro';
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';

interface TradeSettings {
  // 交易模式
  tradeMode: TradeMode;
  // AI信号设置
  aiSignalEnabled: boolean;
  aiSignalTermsAccepted: boolean;
  // 默认订单设置
  defaultOrderType: OrderType;
  defaultVolume: number;
  autoSLTP: boolean;
  defaultSLPoints: number;
  defaultTPPoints: number;
  // 首次访问标记
  hasSeenOnboarding: boolean;
}

interface TradeSettingsActions {
  setTradeMode: (mode: TradeMode) => void;
  setAiSignalEnabled: (enabled: boolean) => void;
  acceptAiSignalTerms: () => void;
  setDefaultOrderType: (type: OrderType) => void;
  setDefaultVolume: (volume: number) => void;
  setAutoSLTP: (enabled: boolean) => void;
  setDefaultSLPoints: (points: number) => void;
  setDefaultTPPoints: (points: number) => void;
  completeOnboarding: () => void;
  resetSettings: () => void;
}

const defaultSettings: TradeSettings = {
  tradeMode: 'pro',  // 默认为专业模式，不再引导选择
  aiSignalEnabled: false,
  aiSignalTermsAccepted: false,
  defaultOrderType: 'market',
  defaultVolume: 0.1,
  autoSLTP: true,
  defaultSLPoints: 50,
  defaultTPPoints: 100,
  hasSeenOnboarding: true,  // 默认已完成引导，不再显示弹窗
};

export const useTradeSettingsStore = create<TradeSettings & TradeSettingsActions>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setTradeMode: (mode) => set({ tradeMode: mode }),

      setAiSignalEnabled: (enabled) => {
        if (enabled) {
          // 启用AI信号时检查是否已同意条款
          set((state) => ({
            aiSignalEnabled: state.aiSignalTermsAccepted ? true : false,
          }));
        } else {
          set({ aiSignalEnabled: false });
        }
      },

      acceptAiSignalTerms: () =>
        set({
          aiSignalTermsAccepted: true,
          aiSignalEnabled: true,
        }),

      setDefaultOrderType: (type) => set({ defaultOrderType: type }),

      setDefaultVolume: (volume) => set({ defaultVolume: volume }),

      setAutoSLTP: (enabled) => set({ autoSLTP: enabled }),

      setDefaultSLPoints: (points) => set({ defaultSLPoints: points }),

      setDefaultTPPoints: (points) => set({ defaultTPPoints: points }),

      completeOnboarding: () => set({ hasSeenOnboarding: true }),

      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'trade-settings-storage',
      version: 1,
    }
  )
);

// Hook for checking if AI signal can be shown
export function useCanShowAiSignal(): boolean {
  const { aiSignalEnabled, aiSignalTermsAccepted } = useTradeSettingsStore();
  return aiSignalEnabled && aiSignalTermsAccepted;
}

// Hook for getting effective order type based on mode
export function useEffectiveOrderType(): OrderType {
  const { tradeMode, defaultOrderType } = useTradeSettingsStore();
  // Beginner mode always uses market orders for simplicity
  if (tradeMode === 'beginner') return 'market';
  return defaultOrderType;
}
