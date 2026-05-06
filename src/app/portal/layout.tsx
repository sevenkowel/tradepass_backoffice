import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { PortalShell } from "@/components/portal/layout/PortalShell";
import { TenantCookieSetter } from "@/components/portal/layout/TenantCookieSetter";
import { DevConfigProvider } from "@/lib/dev-config";
import { prisma } from "@/lib/prisma";
import { getTenantBrandById, BrandConfig } from "@/lib/brand";

/**
 * Demo Mode: 从 Host 头提取租户或使用默认租户
 */
function getTenantSubdomainFromHost(host: string): string | null {
  const hostname = host.split(":")[0];
  const parts = hostname.split(".");
  if (parts.length >= 3 && parts[parts.length - 1] === "localhost") {
    return parts[parts.length - 2];
  }
  return null;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      template: `%s | TradePass Portal`,
      default: "TradePass Portal",
    },
    description: "TradePass Client Portal - Manage your trading accounts.",
  };
}

// Demo 模式：获取或创建默认租户
async function getDemoTenant(tenantId?: string) {
  try {
    if (tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (tenant) return tenant;
    }
    // 返回第一个可用租户
    const tenants = await prisma.tenant.findMany({ take: 1 });
    if (tenants.length > 0) return tenants[0];
    return null;
  } catch {
    return null;
  }
}

export default async function PortalLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const cookieStore = await cookies();
  const headersList = await headers();
  const host = headersList.get("host") || "";

  let tenantId = cookieStore.get("portal_tenant")?.value;

  // 从子域名获取
  const subdomain = getTenantSubdomainFromHost(host);
  if (subdomain && !tenantId) {
    const tenant = await prisma.tenant.findUnique({ where: { subdomain } });
    if (tenant) tenantId = tenant.id;
  }

  // 从 URL 参数获取
  if (!tenantId && searchParams) {
    const params = await searchParams;
    const t = params.tenant;
    if (typeof t === "string") tenantId = t;
  }

  // Demo 模式：获取租户（不强制跳转）
  const tenant = await getDemoTenant(tenantId);

  // 获取品牌配置（使用默认）
  let brand: BrandConfig = {
    brandName: "TradePass",
    logoUrl: "/logo.svg",
    primaryColor: "#0ea5e9",
    faviconUrl: "/favicon.ico",
  };

  if (tenant) {
    try {
      brand = await getTenantBrandById(tenant.id);
    } catch {
      // 使用默认品牌
    }
  }

  return (
    <>
      <TenantCookieSetter />
      <DevConfigProvider>
        <PortalShell tenant={tenant || undefined} brand={brand}>
          {children}
        </PortalShell>
      </DevConfigProvider>
    </>
  );
}
