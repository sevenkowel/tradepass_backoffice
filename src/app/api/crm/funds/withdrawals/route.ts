/**
 * GET /api/crm/funds/withdrawals
 * Backoffice 出金审核列表
 *
 * Query params:
 *   status: pending | approved | rejected | processing | completed
 *   search: string
 *   page: number
 *   limit: number
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

export const GET = requireRole(
  ["admin", "compliance_officer", "finance_officer"],
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status") || undefined;
      const search = searchParams.get("search")?.toLowerCase();
      const page = parseInt(searchParams.get("page") || "1", 10);
      const limit = parseInt(searchParams.get("limit") || "20", 10);

      const where: Record<string, unknown> = { type: "withdrawal" };
      if (status && status !== "all") {
        where.status = status;
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
        amount: t.amount,
        fee: t.fee,
        netAmount: t.amount - t.fee,
        currency: t.currency,
        method: t.method || "unknown",
        methodName: getMethodName(t.method),
        status: t.status,
        address: t.address,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
        processedAt: t.processedAt?.toISOString() || null,
      }));

      return NextResponse.json({
        success: true,
        withdrawals: formatted,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Withdrawals API error:", error);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);

function getMethodName(method: string | null): string {
  const map: Record<string, string> = {
    usdt_trc20: "USDT-TRC20",
    usdt_erc20: "USDT-ERC20",
    bank_transfer: "Bank Transfer",
    stripe: "Credit Card",
    crypto: "Cryptocurrency",
  };
  return map[method || ""] || method || "Unknown";
}
