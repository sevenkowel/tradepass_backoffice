/**
 * 用户资料 Store
 */

import { create } from "zustand";
import type { UserProfile, LoginHistory, UpdateProfileRequest, ChangePasswordRequest, TwoFactorStatus } from "@/types/backoffice/profile";
import { profileApi } from "@/lib/backoffice/mock-profile";

interface UserProfileState {
  // 数据
  profile: UserProfile | null;
  loginHistory: LoginHistory[];
  twoFactorStatus: TwoFactorStatus | null;
  
  // 加载状态
  isLoadingProfile: boolean;
  isUpdatingProfile: boolean;
  isChangingPassword: boolean;
  isLoadingHistory: boolean;
  isLoadingTwoFactor: boolean;
  isUploadingAvatar: boolean;
  
  // 错误
  error: string | null;
  
  // 操作
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<boolean>;
  changePassword: (data: ChangePasswordRequest) => Promise<{ success: boolean; message: string }>;
  fetchLoginHistory: (limit?: number) => Promise<void>;
  fetchTwoFactorStatus: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<string | null>;
  clearError: () => void;
}

export const useUserProfileStore = create<UserProfileState>((set, get) => ({
  // 初始状态
  profile: null,
  loginHistory: [],
  twoFactorStatus: null,
  isLoadingProfile: false,
  isUpdatingProfile: false,
  isChangingPassword: false,
  isLoadingHistory: false,
  isLoadingTwoFactor: false,
  isUploadingAvatar: false,
  error: null,

  // 获取用户资料
  fetchProfile: async () => {
    set({ isLoadingProfile: true, error: null });
    try {
      const profile = await profileApi.getCurrentUser();
      set({ profile, isLoadingProfile: false });
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : "获取用户资料失败", 
        isLoadingProfile: false 
      });
    }
  },

  // 更新用户资料
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true, error: null });
    try {
      const updatedProfile = await profileApi.updateProfile(data);
      set({ profile: updatedProfile, isUpdatingProfile: false });
      return true;
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : "更新用户资料失败", 
        isUpdatingProfile: false 
      });
      return false;
    }
  },

  // 修改密码
  changePassword: async (data) => {
    set({ isChangingPassword: true, error: null });
    try {
      const result = await profileApi.changePassword(data);
      set({ isChangingPassword: false });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "修改密码失败";
      set({ error: message, isChangingPassword: false });
      return { success: false, message };
    }
  },

  // 获取登录历史
  fetchLoginHistory: async (limit = 10) => {
    set({ isLoadingHistory: true, error: null });
    try {
      const history = await profileApi.getLoginHistory(limit);
      set({ loginHistory: history, isLoadingHistory: false });
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : "获取登录历史失败", 
        isLoadingHistory: false 
      });
    }
  },

  // 获取 2FA 状态
  fetchTwoFactorStatus: async () => {
    set({ isLoadingTwoFactor: true, error: null });
    try {
      const status = await profileApi.getTwoFactorStatus();
      set({ twoFactorStatus: status, isLoadingTwoFactor: false });
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : "获取 2FA 状态失败", 
        isLoadingTwoFactor: false 
      });
    }
  },

  // 上传头像
  uploadAvatar: async (file) => {
    set({ isUploadingAvatar: true, error: null });
    try {
      const result = await profileApi.uploadAvatar(file);
      // 更新本地 profile
      const { profile } = get();
      if (profile) {
        set({ 
          profile: { ...profile, avatar: result.url }, 
          isUploadingAvatar: false 
        });
      }
      return result.url;
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : "上传头像失败", 
        isUploadingAvatar: false 
      });
      return null;
    }
  },

  // 清除错误
  clearError: () => set({ error: null }),
}));
