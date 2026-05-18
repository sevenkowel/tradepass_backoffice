import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  const membership = await prisma.tenantMember.findUnique({
    where: { tenantId_userId: { tenantId, userId: user.id } },
  });
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  if (!tenant || (!membership && tenant.ownerId !== user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

    const license = await prisma.license.findFirst({
      where: {
        tenantId,
        status: "active",
        productCode: "trade_pass_business",
      },
    });

  if (!license) {
    return NextResponse.json({ error: "No active license" }, { status: 403 });
  }

  return NextResponse.json({
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
    },
    license: {
      key: license.key,
      expiresAt: license.expiresAt,
    },
    role: membership?.role || "owner",
  });
}
