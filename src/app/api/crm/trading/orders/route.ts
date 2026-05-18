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
        { symbol: { contains: search, mode: "insensitive" } },
        { mtTicket: { contains: search, mode: "insensitive" } },
        { account: { mtLogin: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { account: { select: { mtLogin: true, user: { select: { name: true } } } } },
      }),
      prisma.order.count({ where }),
    ]);

    const formatted = items.map((o) => ({
      id: o.id,
      orderId: o.mtTicket || o.id.slice(0, 8).toUpperCase(),
      accountId: o.account?.mtLogin || "",
      username: o.account?.user?.name || "",
      symbol: o.symbol,
      type: o.type,
      volume: o.volume,
      openPrice: o.openPrice,
      closePrice: o.closePrice,
      profit: o.profit,
      swap: o.swap,
      commission: o.commission,
      status: o.status,
      openTime: o.openTime.toISOString(),
      closeTime: o.closeTime?.toISOString(),
      createdAt: o.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, items: formatted, total, page, limit });
  } catch (error) {
    console.error("Orders API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
