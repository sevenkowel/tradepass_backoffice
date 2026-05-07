/**
 * Banner 配置与激活逻辑
 */

import type { BannerConfig } from "@/types/banner";
import type { UserPerspective } from "@/types/user";
import { useBannerStore } from "@/store/bannerStore";
import type { BannerState } from "@/store/bannerStore";

// Banner 注册表
const BANNER_REGISTRY: BannerConfig[] = [
  {
    id: "welcome_rewards",
    type: "welcome_rewards",
    priority: 50,
    title: "Welcome Rewards",
    description: "Complete your verification to claim your exclusive welcome bonus",
    ctaText: "Claim Now",
    ctaLink: "/portal/kyc",
    dismissible: true,
    theme: "blue",
    conditions: {},
  },
  {
    id: "app_download",
    type: "app_download",
    priority: 20,
    title: "Download TradePass App",
    description: "Trade smarter, anytime anywhere.",
    dismissible: true,
    theme: "green",
    conditions: {},
  },
];

// 检查单条 Banner 是否满足条件
function checkConditions(
  banner: BannerConfig,
  perspective: UserPerspective,
  welcomeRegisteredDays: number,
  welcomeClaimed: boolean
): boolean {
  const { conditions } = banner;

  if (banner.type === "welcome_rewards") {
    // 1. 注册时间在 30 天以内
    if (conditions.registeredDaysAgo !== undefined) {
      if (welcomeRegisteredDays > conditions.registeredDaysAgo) return false;
    }
    // 2. 尚未领取
    if (conditions.hasClaimedWelcomeBonus !== undefined) {
      if (welcomeClaimed === conditions.hasClaimedWelcomeBonus) return false;
    }
  }

  return true;
}

// 获取当前激活的 Banner 列表
export function getActiveBanners(
  perspective: UserPerspective,
  storeState?: Pick<BannerState, "overrides" | "welcomeRegisteredDays" | "welcomeClaimed" | "dismissed" | "stackMode">
): BannerConfig[] {
  const {
    overrides,
    welcomeRegisteredDays,
    welcomeClaimed,
    dismissed,
    stackMode,
  } = storeState ?? (useBannerStore.getState() as BannerState);

  const active: BannerConfig[] = [];

  for (const banner of BANNER_REGISTRY) {
    // 1. 检查 override
    const override = overrides[banner.type];
    if (override === false) continue; // 被 DevTool 强制关闭
    if (override === true) {
      if (!dismissed[banner.id]) {
        active.push(banner);
      }
      continue;
    }

    // 2. 自动模式：检查条件
    if (checkConditions(banner, perspective, welcomeRegisteredDays, welcomeClaimed)) {
      if (!dismissed[banner.id]) {
        active.push(banner);
      }
    }
  }

  // 3. 排序：按 priority 降序
  if (!stackMode && active.length > 1) {
    return [active.reduce((a, b) => (a.priority > b.priority ? a : b))];
  }

  return active.sort((a, b) => b.priority - a.priority);
}

export { BANNER_REGISTRY };
