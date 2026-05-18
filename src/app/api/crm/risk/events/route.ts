import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

export const GET = requireRole(["admin"], async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get("severity");
    const search = searchParams.get("search")?.toLowerCase();
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: Record<string, unknown> = {};
    if (severity && severity !== "all") {
      where.severity = severity;
    }
    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { type: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.riskEvent.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.riskEvent.count({ where }),
    ]);

    const formatted = items.map((r) => ({
      id: r.id,
      type: r.type,
      severity: r.severity,
      userId: r.userId,
      accountId: r.accountId,
      description: r.description || "",
      resolved: r.resolved,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, items: formatted, total, page, limit });
  } catch (error) {
    console.error("Risk events API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
