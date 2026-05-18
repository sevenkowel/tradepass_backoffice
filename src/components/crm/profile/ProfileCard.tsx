"use client";

import { useState } from "react";
import { User, Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/backoffice/profile";

interface ProfileCardProps {
  profile: UserProfile;
  onAvatarUpload?: (file: File) => Promise<string | null>;
  isUploading?: boolean;
}

export function ProfileCard({ profile, onAvatarUpload, isUploading }: ProfileCardProps) {
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);

  const handleAvatarClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && onAvatarUpload) {
        await onAvatarUpload(file);
      }
    };
    input.click();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex items-start gap-6">
        {/* Avatar */}
        <div
          className="relative"
          onMouseEnter={() => setIsHoveringAvatar(true)}
          onMouseLeave={() => setIsHoveringAvatar(false)}
        >
          <div
            className={cn(
              "w-20 h-20 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center",
              onAvatarUpload && "cursor-pointer"
            )}
            onClick={onAvatarUpload ? handleAvatarClick : undefined}
          >
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-blue-600" />
            )}
          </div>
          
          {/* Upload Overlay */}
          {onAvatarUpload && isHoveringAvatar && !isUploading && (
            <div
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center cursor-pointer"
              onClick={handleAvatarClick}
            >
              <Camera className="w-6 h-6 text-white" />
            </div>
          )}
          
          {/* Loading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {profile.fullName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {profile.email}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {profile.role.name}
            </span>
            {profile.department && (
              <span className="text-sm text-gray-500 dark:text-slate-400">
                {profile.department}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
