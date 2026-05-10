"use client";

import { useMemo } from "react";
import { Sidebar, TopBar } from "@/components/crm/layout";
import { useCrmSidebarStore } from "@/store/crmSidebarStore";
import { ToastContextProvider } from "@/components/ui";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
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
    <LocaleProvider>
      <ToastContextProvider>
        <div className="min-h-screen bg-background">
          <TopBar />
          <Sidebar brandInitials={brandInitials} />
          <main
            className={cn(
              "min-h-[calc(100vh-64px)] transition-all duration-300",
              sidebarCollapsed ? "lg:ml-[80px]" : "lg:ml-[260px]"
            )}
          >
            {/* Outer page padding — kept tight on purpose: the CRM is a
                dense workspace, not a marketing surface. Pages like
                Case Detail use negative margins to reach the chrome
                edge; if you change these values, sync those overrides. */}
            <div className="p-3 lg:p-4">{children}</div>
          </main>
        </div>
      </ToastContextProvider>
    </LocaleProvider>
  );
}

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BackofficeContent>{children}</BackofficeContent>;
}
