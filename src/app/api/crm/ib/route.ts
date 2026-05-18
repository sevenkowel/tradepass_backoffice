import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

export const GET = requireRole(["admin"], async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.toLowerCase();
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: Record<string, unknown> = {};
    if (status && status !== "all") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.iBPartner.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.iBPartner.count({ where }),
    ]);

    const formatted = items.map((ib) => ({
      id: ib.id,
      userId: ib.userId,
      name: ib.user?.name || "Unknown",
      email: ib.user?.email || "",
      code: ib.code,
      level: ib.level === 1 ? "manager" : ib.level === 2 ? "ib" : "sub_ib",
      status: ib.status,
      totalClients: ib.totalClients,
      totalCommission: ib.totalCommission,
      commissionRate: ib.commissionRate,
      createdAt: ib.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, items: formatted, total, page, limit });
  } catch (error) {
    console.error("IB API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
