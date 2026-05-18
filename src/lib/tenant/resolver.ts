/**
 * Tenant Domain Resolver
 * 根据 subdomain / custom domain 解析租户信息
 */

import { prisma } from "@/lib/prisma";

export interface ResolvedTenant {
  id: string;
  name: string;
  brandName: string | null;
  slogan: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  subdomain: string | null;
  customDomain: string | null;
  customDomainVerified: boolean;
  plan: string;
}

/**
 * 根据 subdomain 查询租户
 */
export async function resolveTenantBySubdomain(subdomain: string): Promise<ResolvedTenant | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
    select: {
      id: true,
      name: true,
      brandName: true,
      slogan: true,
      logoUrl: true,
      faviconUrl: true,
      primaryColor: true,
      subdomain: true,
      customDomain: true,
      customDomainVerified: true,
      plan: true,
    },
  });

  return tenant;
}

/**
 * 根据 custom domain 查询租户
 */
export async function resolveTenantByDomain(domain: string): Promise<ResolvedTenant | null> {
  const tenant = await prisma.tenant.findFirst({
    where: {
      customDomain: domain,
      customDomainVerified: true,
    },
    select: {
      id: true,
      name: true,
      brandName: true,
      slogan: true,
      logoUrl: true,
      faviconUrl: true,
      primaryColor: true,
      subdomain: true,
      customDomain: true,
      customDomainVerified: true,
      plan: true,
    },
  });

  return tenant;
}

/**
 * 根据请求中的 subdomain cookie 或 header 解析租户
 */
export async function resolveTenantFromRequest(
  subdomain?: string | null,
  hostname?: string | null
): Promise<ResolvedTenant | null> {
  if (subdomain) {
    const tenant = await resolveTenantBySubdomain(subdomain);
    if (tenant) return tenant;
  }

  if (hostname) {
    // Try custom domain first
    const customTenant = await resolveTenantByDomain(hostname);
    if (customTenant) return customTenant;

    // Then try subdomain from hostname
    if (hostname.includes("tradepass.io")) {
      const sub = hostname.split(".")[0];
      if (sub && sub !== "www") {
        return resolveTenantBySubdomain(sub);
      }
    }
  }

  return null;
}
