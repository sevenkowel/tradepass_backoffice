"use client";

import { AnimatePresence } from "framer-motion";
import { DashboardBanner } from "./DashboardBanner";
import { useDevConfig } from "@/lib/dev-config";
import { getActiveBanners } from "@/lib/banner-config";

export function DashboardBannerList() {
  const { currentPerspective } = useDevConfig();
  const banners = getActiveBanners(currentPerspective);

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
