"use client";

import { useEffect } from "react";
import { ConsoleLayout } from "@/components/console/layout";
import { useTenantStore } from "@/store/tenantStore";

export default function ConsoleRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentTenant, setCurrentTenant, setTenants } = useTenantStore();

  useEffect(() => {
    async function initTenant() {
      try {
        const res = await fetch("/api/console/tenants");
        const data = await res.json();
        if (data.tenants?.length > 0) {
          setTenants(data.tenants);
          if (!currentTenant) {
            setCurrentTenant(data.tenants[0]);
          }
        }
      } catch {
        // ignore
      }
    }
    initTenant();
  }, []);

  return (
    <ConsoleLayout portalUrl="/portal">
      {children}
    </ConsoleLayout>
  );
}
