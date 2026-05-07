/**
 * Dashboard Banner 类型定义
 */

export type BannerType = "welcome_rewards" | "app_download";

export type BannerTheme = "blue" | "green" | "orange" | "red" | "purple" | "gold";

export interface BannerCondition {
  /** 新用户活动窗口（注册距今天数，-1 表示不限制） */
  registeredDaysAgo?: number;
  /** 尚未领取 Welcome Bonus */
  hasClaimedWelcomeBonus?: boolean;
}

export interface BannerConfig {
  id: string;
  type: BannerType;
  priority: number;
  title: string;
  description: string;
  ctaText?: string;
  ctaLink?: string;
  dismissible: boolean;
  theme: BannerTheme;
  conditions: BannerCondition;
}
