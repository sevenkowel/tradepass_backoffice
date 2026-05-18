import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

export const GET = requireRole(["admin"], async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const ibId = searchParams.get("ibId");
    const period = searchParams.get("period");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (ibId) where.ibId = ibId;
    if (period) where.period = period;

    const [items, total] = await Promise.all([
      prisma.commissionRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          ibPartner: { include: { user: { select: { name: true, email: true } } } },
        },
      }),
      prisma.commissionRecord.count({ where }),
    ]);

    const formatted = items.map((c) => ({
      id: c.id,
      ibId: c.ibId,
      ibName: c.ibPartner?.user?.name || "",
      clientId: c.clientId,
      orderId: c.orderId,
      amount: c.amount,
      currency: c.currency,
      status: c.status,
      period: c.period,
      paidAt: c.paidAt?.toISOString(),
      createdAt: c.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, items: formatted, total, page, limit });
  } catch (error) {
    console.error("Commission list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
