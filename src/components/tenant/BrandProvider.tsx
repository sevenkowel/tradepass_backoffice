"use client";

import { useTenantBrand } from "@/hooks/useTenantBrand";

/**
 * 品牌提供者组件
 * 在应用顶层包裹，自动获取并应用租户品牌配置
 */
export function BrandProvider({ children }: { children: React.ReactNode }) {
  useTenantBrand();
  return <>{children}</>;
}
