import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/api/tenant";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const tenant = await getCurrentTenant(req);
  if (!tenant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { appId } = await params;

  const app = await prisma.appCatalog.findUnique({
    where: { appId },
  });
  if (!app) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  // Check if already installed
  const existing = await prisma.tenantApp.findUnique({
    where: { tenantId_appId: { tenantId: tenant.id, appId } },
  });

  if (existing?.status === "installed") {
    return NextResponse.json({ error: "Already installed" }, { status: 400 });
  }

  // Create or update TenantApp
  await prisma.tenantApp.upsert({
    where: { tenantId_appId: { tenantId: tenant.id, appId } },
    update: {
      status: "installed",
      installedAt: new Date(),
      uninstalledAt: null,
    },
    create: {
      tenantId: tenant.id,
      appId,
      status: "installed",
    },
  });

  // Create license for the app (link to TradePass Business subscription)
  const subscription = await prisma.subscription.findFirst({
    where: { tenantId: tenant.id, status: "active" },
  });

  if (subscription) {
    await prisma.license.create({
      data: {
        key: `tp-${appId}-${tenant.id}-${Date.now()}`,
        tenantId: tenant.id,
        subscriptionId: subscription.id,
        productCode: appId,
        status: "active",
      },
    });
  }

  return NextResponse.json({ success: true });
}
