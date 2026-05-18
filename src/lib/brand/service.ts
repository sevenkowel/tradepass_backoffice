// 服务端品牌配置获取服务

import { prisma } from "@/lib/prisma";
import { BrandConfig, DEFAULT_BRAND } from "./types";

/**
 * 根据租户 ID 获取品牌配置
 * 优先从 TenantConfig.brand 读取，其次从 Tenant 字段读取
 */
export async function getTenantBrandById(tenantId: string): Promise<BrandConfig> {
  try {
    // 并行获取 Tenant 和 TenantConfig
    const [tenant, tenantConfig] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          name: true,
          brandName: true,
          slogan: true,
          logoUrl: true,
          faviconUrl: true,
          primaryColor: true,
          subdomain: true,
        },
      }),
      prisma.tenantConfig.findUnique({
        where: { tenantId },
        select: { brand: true },
      }),
    ]);

    if (!tenant) {
      return DEFAULT_BRAND;
    }

    // 解析 TenantConfig 中的 brand JSON
    let configBrand: Partial<BrandConfig> = {};
    if (tenantConfig?.brand) {
      try {
        configBrand = JSON.parse(tenantConfig.brand);
      } catch {
        configBrand = {};
      }
    }

    // 合并配置：TenantConfig.brand > Tenant 字段 > 默认值
    return {
      brandName: configBrand.brandName || tenant.brandName || tenant.name || DEFAULT_BRAND.brandName,
      slogan: configBrand.slogan || tenant.slogan || DEFAULT_BRAND.slogan,
      logoUrl: configBrand.logoUrl || tenant.logoUrl || DEFAULT_BRAND.logoUrl,
      faviconUrl: configBrand.faviconUrl || tenant.faviconUrl || DEFAULT_BRAND.faviconUrl,
      primaryColor: configBrand.primaryColor || tenant.primaryColor || DEFAULT_BRAND.primaryColor,
      subdomain: configBrand.subdomain || tenant.subdomain || DEFAULT_BRAND.subdomain,
    };
  } catch (error) {
    console.error("[getTenantBrandById] error:", error);
    return DEFAULT_BRAND;
  }
}

/**
 * 根据子域名获取品牌配置
 */
export async function getTenantBrandBySubdomain(subdomain: string): Promise<BrandConfig> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain },
      select: { id: true },
    });

    if (!tenant) {
      return DEFAULT_BRAND;
    }

    return getTenantBrandById(tenant.id);
  } catch (error) {
    console.error("[getTenantBrandBySubdomain] error:", error);
    return DEFAULT_BRAND;
  }
}

/**
 * 获取租户品牌首字母（用于无 Logo 时的 fallback）
 */
export function getBrandInitials(brandName: string): string {
  return brandName
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
