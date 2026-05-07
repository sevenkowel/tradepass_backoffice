"use client";

import { AnimatePresence } from "framer-motion";
import { DashboardBanner } from "./DashboardBanner";
import { useDevConfig } from "@/lib/dev-config";
import { getActiveBanners } from "@/lib/banner-config";
import { useBannerStore } from "@/store/bannerStore";

export function DashboardBannerList() {
  const { currentPerspective } = useDevConfig();
  // 订阅 Banner Store 变化，确保 DevTool 切换后自动刷新
  const bannerStore = useBannerStore((s) => ({
    overrides: s.overrides,
    welcomeRegisteredDays: s.welcomeRegisteredDays,
    welcomeClaimed: s.welcomeClaimed,
    dismissed: s.dismissed,
    stackMode: s.stackMode,
  }));
  const banners = getActiveBanners(currentPerspective, bannerStore);

  if (banners.length === 0) return null;

  return (
    <section>
      <AnimatePresence mode="popLayout">
        {banners.map((banner) => (
          <DashboardBanner key={banner.id} banner={banner} />
        ))}
      </AnimatePresence>
    </section>
  );
}
