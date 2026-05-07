"use client";

import { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { DashboardBanner } from "./DashboardBanner";
import { useDevConfig } from "@/lib/dev-config";
import { getActiveBanners } from "@/lib/banner-config";
import { useBannerStore } from "@/store/bannerStore";

export function DashboardBannerList() {
  const { currentPerspective } = useDevConfig();
  // 订阅整个 Banner Store，确保 DevTool 切换后自动刷新
  const store = useBannerStore();
  const banners = useMemo(
    () =>
      getActiveBanners(currentPerspective, {
        overrides: store.overrides,
        welcomeRegisteredDays: store.welcomeRegisteredDays,
        welcomeClaimed: store.welcomeClaimed,
        dismissed: store.dismissed,
        stackMode: store.stackMode,
      }),
    [currentPerspective, store]
  );

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
