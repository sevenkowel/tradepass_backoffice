"use client";

import { useMemo } from "react";
import { Sidebar, TopBar } from "@/components/crm/layout";
import { NavigationProgress } from "@/components/crm/layout/NavigationProgress";
import { useCrmSidebarStore } from "@/store/crmSidebarStore";
import { ToastContextProvider } from "@/components/ui";
import { ToastBridge } from "@/components/crm/ToastBridge";
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
        {/* Forwards `useToastStore` events (Zustand) to the rendered
            shadcn toaster. Both APIs are in use across the codebase. */}
        <ToastBridge />
        {/* Top progress bar — gives instant feedback on slow nav so
            menu clicks never feel "stuck", especially in dev where the
            destination route compiles on demand. Mounted once at the
            CRM root so every page transition benefits. */}
        <NavigationProgress />
        <div className="min-h-screen bg-background">
          {/* TopBar now hosts the first-level icon tabs inline — the
              old standalone 48px TopNav row was removed so the chrome
              stays at a single 64px band. See docs/Top-Plus-Side-Nav.md. */}
          <TopBar />
          <Sidebar brandInitials={brandInitials} />
          <main
            className={cn(
              /* `pt-16` reserves space for the now-fixed TopBar (h-16);
                 since TopBar is out of normal flow, main would start
                 at y=0 and slide under it without this padding. */
              "pt-16 min-h-screen transition-all duration-300",
              sidebarCollapsed ? "lg:ml-[80px]" : "lg:ml-[220px]"
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
