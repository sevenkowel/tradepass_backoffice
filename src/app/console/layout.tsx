"use client";

import { useEffect } from "react";
import { ConsoleLayout } from "@/components/console/layout";
import { useTenantStore } from "@/store/tenantStore";

// Demo 模式默认租户
const DEMO_TENANT = {
  id: "demo-tenant",
  name: "Demo Broker",
  slug: "demo-broker",
  subdomain: "demo",
  region: "VN" as const,
  plan: "growth" as const,
  status: "active" as const,
  ownerId: "demo-user-id",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  settings: {
    kycLevel: "standard" as const,
    features: ["trading", "copy_trading", "pamm"],
    branding: {
      companyName: "Demo Broker Ltd",
      primaryColor: "#3B82F6",
    },
  },
  onboardingStatus: "completed" as const,
  onboardingPhases: {
    branding: true,
    auth: true,
    kyc: true,
    payments: true,
    trading: true,
    accounts: true,
  },
  onboardingCompleted: true,
  onboardingCompletedAt: new Date().toISOString(),
  onboardingTasks: [],
};

export default function ConsoleRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentTenant, setCurrentTenant, setTenants } = useTenantStore();

  useEffect(() => {
    // Demo 模式：直接使用默认租户
    setTenants([DEMO_TENANT]);
    if (!currentTenant) {
      setCurrentTenant(DEMO_TENANT);
    }
  }, []);

  return (
    <ConsoleLayout portalUrl="/portal">
      {children}
    </ConsoleLayout>
  );
}
