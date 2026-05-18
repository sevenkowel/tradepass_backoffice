/**
 * GET /api/crm/funds/transactions
 * Backoffice 资金流水列表
 *
 * Query params:
 *   type: deposit | withdrawal | transfer | commission
 *   status: pending | processing | completed | failed | cancelled
 *   search: string
 *   page: number
 *   limit: number
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

export const GET = requireRole(
  ["admin", "compliance_officer", "finance_officer", "support_agent"],
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const type = searchParams.get("type") || undefined;
      const status = searchParams.get("status") || undefined;
      const search = searchParams.get("search")?.toLowerCase();
      const page = parseInt(searchParams.get("page") || "1", 10);
      const limit = parseInt(searchParams.get("limit") || "20", 10);

      const where: Record<string, unknown> = {};
      if (type && type !== "all") where.type = type;
      if (status && status !== "all") where.status = status;

      if (search) {
        where.OR = [
          { user: { name: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
          { id: { contains: search } },
        ];
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true, email: true } },
            wallet: { select: { currency: true } },
          },
        }),
        prisma.transaction.count({ where }),
      ]);

      const formatted = transactions.map((t) => ({
        id: t.id,
        userId: t.userId,
        userName: t.user?.name || "Unknown",
        email: t.user?.email || "",
        type: t.type,
        amount: t.amount,
        fee: t.fee,
        currency: t.currency,
        status: t.status,
        method: t.method,
        address: t.address,
        txHash: t.txHash,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
        processedAt: t.processedAt?.toISOString() || null,
      }));

      return NextResponse.json({
        success: true,
        transactions: formatted,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Transactions API error:", error);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
