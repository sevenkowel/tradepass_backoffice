// 客户端品牌配置 Hook
"use client";

import { useState, useEffect, useCallback } from "react";
import { BrandConfig, DEFAULT_BRAND } from "./types";

interface UseTenantBrandOptions {
  tenantId?: string;
  subdomain?: string;
}

/**
 * 客户端 Hook：获取租户品牌配置
 */
export function useTenantBrand(options: UseTenantBrandOptions = {}) {
  const { tenantId, subdomain } = options;
  const [brand, setBrand] = useState<BrandConfig>(DEFAULT_BRAND);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBrand = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 构建查询参数
      const params = new URLSearchParams();
      if (tenantId) params.set("tenantId", tenantId);
      if (subdomain) params.set("subdomain", subdomain);

      const res = await fetch(`/api/tenant/brand?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.data) {
        setBrand({
          ...DEFAULT_BRAND,
          ...data.data,
        });
      } else {
        setBrand(DEFAULT_BRAND);
      }
    } catch (err) {
      console.error("[useTenantBrand] error:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch brand"));
      setBrand(DEFAULT_BRAND);
    } finally {
      setLoading(false);
    }
  }, [tenantId, subdomain]);

  useEffect(() => {
    fetchBrand();
  }, [fetchBrand]);

  return {
    brand,
    loading,
    error,
    refetch: fetchBrand,
  };
}

/**
 * 生成动态主题色 CSS 变量样式
 */
export function generateBrandStyles(primaryColor: string): React.CSSProperties {
  return {
    ["--tp-accent" as string]: primaryColor,
    ["--tp-accent-rgb" as string]: hexToRgb(primaryColor),
  };
}

/**
 * HEX 转 RGB
 */
function hexToRgb(hex: string): string {
  // 移除 # 号
  const cleanHex = hex.replace("#", "");

  // 解析 RGB
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return "26, 115, 232"; // 默认蓝色
  }

  return `${r}, ${g}, ${b}`;
}

/**
 * 获取品牌首字母（用于无 Logo 时的 fallback）
 */
export function useBrandInitials(brandName: string): string {
  return brandName
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
