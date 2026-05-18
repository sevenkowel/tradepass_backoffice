// 品牌配置类型定义

export interface BrandConfig {
  brandName: string;
  slogan?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor: string;
  subdomain?: string | null;
}

// 默认品牌配置（作为 fallback）
export const DEFAULT_BRAND: BrandConfig = {
  brandName: "TradePass",
  slogan: "The Operating System for Modern Brokers",
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#1a73e8",
  subdomain: null,
};
