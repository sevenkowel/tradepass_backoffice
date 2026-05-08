"use client";

import { Suspense, useMemo } from "react";
import { Sidebar, TopBar } from "@/components/crm/layout";
import { useCrmSidebarStore } from "@/store/crmSidebarStore";
import { ToastContextProvider } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getBrandInitials } from "@/lib/utils";

const DEFAULT_BRAND = {
  brandName: "TradePass",
  slogan: "The Operating System for Modern Brokers",
  logoUrl: null as string | null,
  faviconUrl: null as string | null,
  primaryColor: "#1a73e8",
};

function BackofficeContent({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useCrmSidebarStore();
  const brandInitials = useMemo(() => getBrandInitials(DEFAULT_BRAND.brandName), []);

  return (
    <ToastContextProvider>
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <Sidebar brandInitials={brandInitials} />
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
  return <BackofficeContent>{children}</BackofficeContent>;
}
