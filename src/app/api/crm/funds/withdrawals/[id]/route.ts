/**
 * PATCH /api/crm/funds/withdrawals/:id
 * 审核出金请求（approve / reject）
 *
 * Body: { action: "approve" | "reject", reason?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

export const PATCH = requireRole(
  ["admin", "compliance_officer", "finance_officer"],
  async (request: NextRequest) => {
    try {
      // 从 URL 路径中解析 id
      const url = new URL(request.url);
      const pathParts = url.pathname.split("/");
      const id = pathParts[pathParts.length - 1];
      const body = await request.json();
      const { action, reason } = body;

      if (!action || !["approve", "reject"].includes(action)) {
        return NextResponse.json(
          { success: false, error: "Invalid action. Must be 'approve' or 'reject'" },
          { status: 400 }
        );
      }

      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: { wallet: true },
      });

      if (!transaction) {
        return NextResponse.json(
          { success: false, error: "Transaction not found" },
          { status: 404 }
        );
      }

      if (transaction.type !== "withdrawal") {
        return NextResponse.json(
          { success: false, error: "Not a withdrawal transaction" },
          { status: 400 }
        );
      }

      if (transaction.status !== "pending" && transaction.status !== "processing") {
        return NextResponse.json(
          { success: false, error: "Transaction already processed" },
          { status: 400 }
        );
      }

      if (action === "approve") {
        // 批准出金：扣除冻结金额，更新交易状态
        await prisma.$transaction([
          prisma.wallet.update({
            where: { id: transaction.walletId },
            data: {
              frozen: { decrement: transaction.amount },
              balance: { decrement: transaction.amount },
            },
          }),
          prisma.transaction.update({
            where: { id },
            data: {
              status: "completed",
              processedAt: new Date(),
              description: `${transaction.description} | Approved`,
            },
          }),
        ]);
      } else {
        // 拒绝出金：解冻资金，更新交易状态
        await prisma.$transaction([
          prisma.wallet.update({
            where: { id: transaction.walletId },
            data: {
              frozen: { decrement: transaction.amount },
              available: { increment: transaction.amount },
            },
          }),
          prisma.transaction.update({
            where: { id },
            data: {
              status: "failed",
              processedAt: new Date(),
              description: `${transaction.description} | Rejected: ${reason || "No reason provided"}`,
            },
          }),
        ]);
      }

      return NextResponse.json({
        success: true,
        message: `Withdrawal ${action}d successfully`,
      });
    } catch (error) {
      console.error("Withdrawal review error:", error);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
