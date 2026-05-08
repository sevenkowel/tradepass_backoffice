"use client";

/**
 * 开发者配置 Context
 * 用于开发环境切换视角、主题、布局等
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { UserPerspective, TradingAccount } from "@/types/user";
import { USER_PERSPECTIVES, getUserPerspective, getCurrentPerspective } from "./user-perspectives";

// 存储键
const STORAGE_KEY = "tradepass_dev_config";
const POSITION_KEY = "tradepass_dev_toolbox_position";

// 预设账户数据
const mockAccounts: Record<string, TradingAccount[]> = {
  single: [
    {
      id: "ACC-12345",
      type: "live",
      balance: 5230,
      equity: 5450,
      freeMargin: 3200,
      leverage: 500,
      currency: "USD",
    },
  ],
  multiple: [
    {
      id: "ACC-12345",
      type: "live",
      balance: 15230,
      equity: 15450,
      freeMargin: 8200,
      leverage: 500,
      currency: "USD",
    },
    {
      id: "ACC-67890",
      type: "live",
      balance: 12850,
      equity: 13120,
      freeMargin: 6200,
      leverage: 200,
      currency: "EUR",
    },
    {
      id: "ACC-54321",
      type: "live",
      balance: 1850000,
      equity: 1820000,
      freeMargin: 1200000,
      leverage: 100,
      currency: "JPY",
    },
  ],
};

// 开发者配置状态
export type RegisterMode = "A" | "B" | "C" | "D" | "E";

interface DevConfigState {
  currentPerspective: UserPerspective;
  toolboxOpen: boolean;
  toolboxPosition: { x: number; y: number };
  skipOtpVerification: boolean;
  forceContactOtp: boolean;
  preVerifiedPhone: string;
  preVerifiedEmail: string;
  accountCount: "single" | "multiple";
  registerMode: RegisterMode;
  captchaEnabled: boolean;
}

// Context 类型
interface DevConfigContextType extends DevConfigState {
  // 视角切换
  setPerspective: (id: string) => void;
  perspectives: UserPerspective[];

  // 工具箱控制
  setToolboxOpen: (open: boolean) => void;
  toggleToolbox: () => void;
  setToolboxPosition: (position: { x: number; y: number }) => void;
  resetToolboxPosition: () => void;

  // OTP 验证控制
  setSkipOtpVerification: (skip: boolean) => void;
  setForceContactOtp: (force: boolean) => void;
  setPreVerifiedPhone: (phone: string) => void;
  setPreVerifiedEmail: (email: string) => void;

  // 账户数量切换
  setAccountCount: (count: "single" | "multiple") => void;

  // 注册流程控制
  setRegisterMode: (mode: RegisterMode) => void;
  setCaptchaEnabled: (enabled: boolean) => void;
}

// 默认位置（右下角：right/bottom 偏移，正值表示距边缘的距离）
const DEFAULT_POSITION = { x: 20, y: 100 };

// 创建 Context
const DevConfigContext = createContext<DevConfigContextType | null>(null);

// 服务端安全的默认状态（SSR 和 hydration 阶段保持一致）
const DEFAULT_STATE: DevConfigState = {
  currentPerspective: getCurrentPerspective(),
  toolboxOpen: false,
  toolboxPosition: DEFAULT_POSITION,
  skipOtpVerification: false,
  forceContactOtp: false,
  preVerifiedPhone: "",
  preVerifiedEmail: "",
  accountCount: "single",
  registerMode: "A",
  captchaEnabled: false,
};

// Provider 组件
export function DevConfigProvider({ children }: { children: React.ReactNode }) {
  // 使用服务端安全的默认值初始化，避免 SSR/Client Hydration mismatch
  const [state, setState] = useState<DevConfigState>(DEFAULT_STATE);

  // 客户端挂载后从 localStorage 恢复状态（避免 SSR hydration mismatch）
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedPosition = localStorage.getItem(POSITION_KEY);

      const parsed = saved ? JSON.parse(saved) : {};
      const parsedPosition = savedPosition ? JSON.parse(savedPosition) : DEFAULT_POSITION;

      const basePerspective = parsed.currentPerspectiveId
        ? getUserPerspective(parsed.currentPerspectiveId)
        : getCurrentPerspective();
      
      const accountCount = parsed.accountCount ?? "single";

      setState({
        currentPerspective: {
          ...basePerspective,
          accounts: mockAccounts[accountCount],
        },
        toolboxOpen: parsed.toolboxOpen ?? false,
        toolboxPosition: parsedPosition,
        skipOtpVerification: parsed.skipOtpVerification ?? false,
        forceContactOtp: parsed.forceContactOtp ?? false,
        preVerifiedPhone: parsed.preVerifiedPhone ?? "",
        preVerifiedEmail: parsed.preVerifiedEmail ?? "",
        accountCount,
        registerMode: parsed.registerMode ?? "A",
        captchaEnabled: parsed.captchaEnabled ?? false,
      });
    } catch {
      // 读取失败时保持默认值
    }
  }, []);

  // 保存状态到 localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const toSave = {
      currentPerspectiveId: state.currentPerspective.id,
      toolboxOpen: state.toolboxOpen,
      skipOtpVerification: state.skipOtpVerification,
      forceContactOtp: state.forceContactOtp,
      preVerifiedPhone: state.preVerifiedPhone,
      preVerifiedEmail: state.preVerifiedEmail,
      accountCount: state.accountCount,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    localStorage.setItem(POSITION_KEY, JSON.stringify(state.toolboxPosition));

    // 同步 pre-verified 值到 kyc localStorage keys（供 ContactVerificationForm 读取）
    if (state.preVerifiedPhone) {
      localStorage.setItem("kyc_preverified_phone", state.preVerifiedPhone);
    } else {
      localStorage.removeItem("kyc_preverified_phone");
    }
    if (state.preVerifiedEmail) {
      localStorage.setItem("kyc_preverified_email", state.preVerifiedEmail);
    } else {
      localStorage.removeItem("kyc_preverified_email");
    }
  }, [state.currentPerspective.id, state.toolboxOpen, state.toolboxPosition, state.skipOtpVerification, state.forceContactOtp, state.preVerifiedPhone, state.preVerifiedEmail, state.accountCount]);

  // 设置视角
  const setPerspective = useCallback((id: string) => {
    const perspective = getUserPerspective(id);
    setState(prev => ({ 
      ...prev, 
      currentPerspective: {
        ...perspective,
        accounts: mockAccounts[prev.accountCount],
      }
    }));
  }, []);

  // 设置工具箱展开状态
  const setToolboxOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, toolboxOpen: open }));
  }, []);

  // 切换工具箱展开状态
  const toggleToolbox = useCallback(() => {
    setState(prev => ({ ...prev, toolboxOpen: !prev.toolboxOpen }));
  }, []);

  // 设置工具箱位置
  const setToolboxPosition = useCallback((position: { x: number; y: number }) => {
    setState(prev => ({ ...prev, toolboxPosition: position }));
  }, []);

  // 重置工具箱位置
  const resetToolboxPosition = useCallback(() => {
    setState(prev => ({ ...prev, toolboxPosition: DEFAULT_POSITION }));
  }, []);

  // OTP 验证控制
  const setSkipOtpVerification = useCallback((skip: boolean) => {
    setState(prev => ({ ...prev, skipOtpVerification: skip }));
  }, []);

  const setForceContactOtp = useCallback((force: boolean) => {
    setState(prev => ({ ...prev, forceContactOtp: force }));
  }, []);

  const setPreVerifiedPhone = useCallback((phone: string) => {
    setState(prev => ({ ...prev, preVerifiedPhone: phone }));
  }, []);

  const setPreVerifiedEmail = useCallback((email: string) => {
    setState(prev => ({ ...prev, preVerifiedEmail: email }));
  }, []);

  // 设置账户数量
  const setAccountCount = useCallback((count: "single" | "multiple") => {
    setState(prev => ({
      ...prev,
      accountCount: count,
      currentPerspective: {
        ...prev.currentPerspective,
        accounts: mockAccounts[count],
      }
    }));
  }, []);

  // 设置注册流程模式
  const setRegisterMode = useCallback((mode: RegisterMode) => {
    setState(prev => ({ ...prev, registerMode: mode }));
  }, []);

  // 设置人机验证开关
  const setCaptchaEnabled = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, captchaEnabled: enabled }));
  }, []);

  const value: DevConfigContextType = {
    ...state,
    setPerspective,
    perspectives: USER_PERSPECTIVES,
    setToolboxOpen,
    toggleToolbox,
    setToolboxPosition,
    resetToolboxPosition,
    setSkipOtpVerification,
    setForceContactOtp,
    setPreVerifiedPhone,
    setPreVerifiedEmail,
    setAccountCount,
    setRegisterMode,
    setCaptchaEnabled,
  };

  return (
    <DevConfigContext.Provider value={value}>
      {children}
    </DevConfigContext.Provider>
  );
}

// Hook
export function useDevConfig() {
  const context = useContext(DevConfigContext);
  if (!context) {
    throw new Error("useDevConfig must be used within DevConfigProvider");
  }
  return context;
}

// 判断是否在开发环境
export function isDevEnvironment(): boolean {
  return process.env.NODE_ENV === "development";
}

// Hook 版本 - 客户端安全
export function useIsDevEnvironment(): boolean {
  const [isDev, setIsDev] = useState(false);
  
  useEffect(() => {
    setIsDev(process.env.NODE_ENV === "development");
  }, []);
  
  return isDev;
}
