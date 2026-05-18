"use client";

import { useState, useEffect } from "react";

export interface TenantBrand {
  id: string;
  name: string;
  brandName: string | null;
  slogan: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  subdomain: string | null;
  customDomain: string | null;
}

/**
 * 获取并应用租户品牌配置
 * - 动态替换 CSS 品牌色变量
 * - 替换页面标题和 favicon
 */
export function useTenantBrand() {
  const [brand, setBrand] = useState<TenantBrand | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tenant/brand")
      .then((r) => r.json())
      .then((data) => {
        if (data.brand) {
          setBrand(data.brand);
          applyBrand(data.brand);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { brand, loading };
}

/**
 * 应用品牌配置到页面
 */
function applyBrand(brand: TenantBrand) {
  // Apply primary color
  if (brand.primaryColor) {
    document.documentElement.style.setProperty("--tp-brand-primary", brand.primaryColor);
    // Also update accent if it's the default
    const currentAccent = getComputedStyle(document.documentElement).getPropertyValue("--tp-accent").trim();
    if (!currentAccent || currentAccent === "#1a73e8") {
      document.documentElement.style.setProperty("--tp-accent", brand.primaryColor);
    }
  }

  // Update page title
  if (brand.brandName) {
    const originalTitle = document.title;
    if (!originalTitle.includes(brand.brandName)) {
      document.title = `${brand.brandName} - ${originalTitle}`;
    }
  }

  // Update favicon
  if (brand.faviconUrl) {
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = brand.faviconUrl;
  }
}

/**
 * 判断当前是否为白标模式（完全自定义品牌）
 */
export function isWhiteLabelMode(brand: TenantBrand | null): boolean {
  if (!brand) return false;
  return !!brand.logoUrl && !!brand.brandName && brand.brandName !== "TradePass";
}
