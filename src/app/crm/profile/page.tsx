"use client";

import { useEffect, useState } from "react";
import { User, Loader2 } from "lucide-react";
import { PageHeader, Card, EmptyState } from "@/components/crm/ui";
import { ProfileCard } from "@/components/crm/profile/ProfileCard";
import { ProfileEditForm } from "@/components/crm/profile/ProfileEditForm";
import { SecuritySettings } from "@/components/crm/profile/SecuritySettings";
import { LoginHistory } from "@/components/crm/profile/LoginHistory";
import { PasswordDialog } from "@/components/crm/profile/PasswordDialog";
import { useUserProfileStore } from "@/store/crm/userProfileStore";
import { useTwoFAStore } from "@/store/crm/twoFAStore";
import { useToast } from "@/components/ui";

export default function ProfilePage() {
  const { toast } = useToast();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const {
    profile,
    loginHistory,
    twoFactorStatus,
    isLoadingProfile,
    isUpdatingProfile,
    isChangingPassword,
    isLoadingHistory,
    isLoadingTwoFactor,
    isUploadingAvatar,
    fetchProfile,
    updateProfile,
    changePassword,
    fetchLoginHistory,
    fetchTwoFactorStatus,
    uploadAvatar,
  } = useUserProfileStore();

  const { fetchStatus: fetchTwoFAStatus, status: twoFAStoreStatus } = useTwoFAStore();

  // 加载数据
  useEffect(() => {
    fetchProfile();
    fetchLoginHistory(5);
    fetchTwoFactorStatus();
    fetchTwoFAStatus();
  }, [fetchProfile, fetchLoginHistory, fetchTwoFactorStatus, fetchTwoFAStatus]);

  // 处理 2FA 状态变化
  const handleTwoFAStatusChange = () => {
    fetchTwoFAStatus();
    fetchTwoFactorStatus();
  };

  // 处理保存个人资料
  const handleSaveProfile = async (data: { fullName?: string; phone?: string }) => {
    const success = await updateProfile(data);
    if (success) {
      toast({
        title: "保存成功",
        description: "个人资料已更新",
      });
    } else {
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "error",
      });
    }
    return success;
  };

  // 处理修改密码
  const handleChangePassword = async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    const result = await changePassword(data);
    if (result.success) {
      toast({
        title: "密码修改成功",
        description: result.message,
      });
    } else {
      toast({
        title: "密码修改失败",
        description: result.message,
        variant: "error",
      });
    }
    return result;
  };

  // 处理上传头像
  const handleAvatarUpload = async (file: File) => {
    const url = await uploadAvatar(file);
    if (url) {
      toast({
        title: "上传成功",
        description: "头像已更新",
      });
    } else {
      toast({
        title: "上传失败",
        description: "请稍后重试",
        variant: "error",
      });
    }
    return url;
  };

  if (isLoadingProfile || !profile) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="个人中心"
          description="管理您的个人账户信息和安全设置"
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
        title="个人中心"
        description="管理您的个人账户信息和安全设置"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          <ProfileCard
            profile={profile}
            onAvatarUpload={handleAvatarUpload}
            isUploading={isUploadingAvatar}
          />

          <SecuritySettings
            twoFactorStatus={twoFactorStatus ? {
              ...twoFactorStatus,
              backupCodesRemaining: twoFAStoreStatus?.backupCodesRemaining,
            } : null}
            isLoading={isLoadingTwoFactor}
            onChangePassword={() => setIsPasswordDialogOpen(true)}
            onTwoFAStatusChange={handleTwoFAStatusChange}
          />
        </div>

        {/* Right Column - Edit Form & History */}
        <div className="lg:col-span-2 space-y-6">
          <ProfileEditForm
            profile={profile}
            onSave={handleSaveProfile}
            isSaving={isUpdatingProfile}
          />

          <LoginHistory
            history={loginHistory}
            isLoading={isLoadingHistory}
            maxDisplay={5}
          />
        </div>
      </div>

      {/* Password Dialog */}
      <PasswordDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
        onSubmit={handleChangePassword}
        isSubmitting={isChangingPassword}
      />
    </div>
  );
}
