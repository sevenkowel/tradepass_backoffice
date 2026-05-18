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
      // Position model doesn't have status field, filter by symbol or other
    }
    if (search) {
      where.OR = [
        { symbol: { contains: search, mode: "insensitive" } },
        { account: { mtLogin: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.position.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { account: { select: { mtLogin: true, user: { select: { name: true } } } } },
      }),
      prisma.position.count({ where }),
    ]);

    const formatted = items.map((p) => ({
      id: p.id,
      ticket: p.id.slice(0, 8).toUpperCase(),
      accountId: p.account?.mtLogin || "",
      username: p.account?.user?.name || "",
      symbol: p.symbol,
      type: p.type,
      volume: p.volume,
      openPrice: p.openPrice,
      currentPrice: p.currentPrice,
      profit: p.profit,
      swap: p.swap,
      status: "open" as const,
      openTime: p.openTime.toISOString(),
      createdAt: p.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, items: formatted, total, page, limit });
  } catch (error) {
    console.error("Positions API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
