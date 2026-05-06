// CRM Layout - Demo Mode (完全开放)

import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getTenantBrandById } from "@/lib/brand";
import { BrandProvider, BrandConfig } from "@/lib/brand";
import ClientLayout from "./ClientLayout";

function getTenantSubdomainFromHost(host: string): string | null {
  const hostname = host.split(":")[0];
  const parts = hostname.split(".");
  if (parts.length >= 3 && parts[parts.length - 1] === "localhost") {
    return parts[parts.length - 2];
  }
  return null;
}

async function getDemoTenant(tenantId?: string) {
  try {
    if (tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (tenant) return tenant;
    }
    const tenants = await prisma.tenant.findMany({ take: 1 });
    if (tenants.length > 0) return tenants[0];
    return null;
  } catch {
    return null;
  }
}

export async function generateMetadata() {
  return {
    title: {
      template: `%s | TradePass CRM`,
      default: "TradePass CRM",
    },
    description: "TradePass CRM - Manage your brokerage operations.",
  };
}

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
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

  // Demo 模式：获取租户（不强制跳转）
  const tenant = await getDemoTenant(tenantId);

  // 获取品牌配置
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
    <BrandProvider brand={brand}>
      <ClientLayout>{children}</ClientLayout>
    </BrandProvider>
  );
}
