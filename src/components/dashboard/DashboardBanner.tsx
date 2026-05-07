"use client";

import { motion } from "framer-motion";
import { X, Gift, Smartphone } from "lucide-react";
import Link from "next/link";
import type { BannerConfig, BannerTheme } from "@/types/banner";
import { useBannerStore } from "@/store/bannerStore";

interface DashboardBannerProps {
  banner: BannerConfig;
}

const themeMap: Record<BannerTheme, {
  gradient: string;
  iconBg: string;
  iconColor: string;
  dismissHover: string;
}> = {
  blue: {
    gradient: "from-blue-500 to-indigo-600",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    dismissHover: "hover:bg-blue-50",
  },
  green: {
    gradient: "from-emerald-500 to-teal-600",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    dismissHover: "hover:bg-emerald-50",
  },
  orange: {
    gradient: "from-amber-500 to-orange-600",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    dismissHover: "hover:bg-amber-50",
  },
  red: {
    gradient: "from-rose-500 to-red-600",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    dismissHover: "hover:bg-rose-50",
  },
  purple: {
    gradient: "from-violet-500 to-purple-600",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    dismissHover: "hover:bg-violet-50",
  },
  gold: {
    gradient: "from-yellow-500 to-amber-600",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    dismissHover: "hover:bg-yellow-50",
  },
};

const bannerIcons: Record<string, typeof Gift> = {
  welcome_rewards: Gift,
  app_download: Smartphone,
};

export function DashboardBanner({ banner }: DashboardBannerProps) {
  const { dismiss } = useBannerStore();
  const theme = themeMap[banner.theme];
  const Icon = bannerIcons[banner.type] || Gift;

  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="mb-4"
    >
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${theme.gradient} shadow-lg`}
      >
        <div className="px-6 py-4 flex items-center gap-4">
          {/* 左侧图标 */}
          <div
            className={`w-12 h-12 rounded-xl ${theme.iconBg} flex items-center justify-center shrink-0`}
          >
            <Icon size={24} className={theme.iconColor} />
          </div>

          {/* 中间内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-base font-semibold text-white">{banner.title}</h3>
            </div>
            <p className="text-sm text-white/80">{banner.description}</p>
          </div>

          {/* 右侧 CTA */}
          {banner.ctaText && banner.ctaLink && (
            <Link
              href={banner.ctaLink}
              className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 bg-white text-sm font-semibold rounded-xl hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shadow-sm whitespace-nowrap"
              style={{ color: `var(--tp-primary, #0A2540)` }}
            >
              {banner.ctaText}
            </Link>
          )}

          {/* 关闭按钮 */}
          {banner.dismissible && (
            <button
              onClick={() => dismiss(banner.id)}
              className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white ${theme.dismissHover} transition-colors`}
              aria-label="Dismiss banner"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </motion.section>
  );
}
