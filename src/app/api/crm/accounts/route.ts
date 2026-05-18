import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

export const GET = requireRole(["admin", "compliance_officer"], async (request: NextRequest) => {
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
        { mtLogin: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.mTAccount.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.mTAccount.count({ where }),
    ]);

    const formatted = items.map((a) => ({
      id: a.id,
      accountId: a.mtLogin,
      userId: a.userId,
      username: a.user?.name || "Unknown",
      email: a.user?.email || "",
      type: "mt5" as const,
      status: a.status,
      balance: a.balance,
      equity: a.equity,
      margin: a.margin,
      freeMargin: a.freeMargin,
      leverage: a.leverage,
      currency: a.currency,
      group: a.group,
      createdAt: a.createdAt.toISOString(),
      lastTradeAt: a.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      items: formatted,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Accounts API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
