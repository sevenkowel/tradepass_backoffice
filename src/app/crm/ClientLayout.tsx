"use client";

import { Suspense, useMemo } from "react";
import { Sidebar, TopBar } from "@/components/crm/layout";
import { useCrmSidebarStore } from "@/store/crmSidebarStore";
import { ToastContextProvider } from "@/components/ui";
import { cn } from "@/lib/utils";
import { TenantValidator } from "./TenantValidator";
import { useBrand } from "@/lib/brand";

// Demo 模式：跳过认证检查
function BackofficeContent({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useCrmSidebarStore();
  const brand = useBrand();

  // 计算品牌首字母
  const brandInitials = useMemo(() => {
    return brand.brandName
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [brand.brandName]);

  return (
    <ToastContextProvider>
      <div className="min-h-screen bg-gray-50">
        <TopBar brand={brand} brandInitials={brandInitials} />
        <Sidebar brand={brand} brandInitials={brandInitials} />
        <main
          className={cn(
            "min-h-[calc(100vh-64px)] transition-all duration-300",
            sidebarCollapsed ? "lg:ml-[80px]" : "lg:ml-[260px]"
          )}
        >
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </ToastContextProvider>
  );
}

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TenantValidator>
      <BackofficeContent>{children}</BackofficeContent>
    </TenantValidator>
  );
}
