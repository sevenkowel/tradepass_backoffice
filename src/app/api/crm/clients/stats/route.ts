import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

export const GET = requireRole(
  ["admin", "compliance_officer", "support_agent", "risk_manager", "finance_officer", "viewer"],
  async (_req: NextRequest) => {
    try {
      const [total, active, frozen, kycPending, kycNotStarted, kycNull, ftdAccountUserIds, highRiskKyc] =
        await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { status: "active" } }),
          prisma.user.count({ where: { status: "suspended" } }),
          prisma.user.count({ where: { kycStatus: { in: ["pending", "in_review"] } } }),
          prisma.user.count({ where: { kycStatus: { in: ["not_started", "not_submitted"] } } }),
          prisma.user.count({ where: { kycStatus: null } }),
          prisma.mTAccount.findMany({
            where: { balance: { gt: 0 } },
            select: { userId: true },
            distinct: ["userId"],
          }),
          prisma.kYCRecord.count({ where: { amlRiskScore: { gte: 60 } } }),
        ]);

      const kycNotSubmitted = kycNotStarted + kycNull;

      return NextResponse.json({
        success: true,
        total,
        active,
        frozen,
        pendingKyc: kycPending + kycNotSubmitted,
        ftdCount: ftdAccountUserIds.length,
        highRisk: highRiskKyc,
      });
    } catch (error) {
      console.error("GET /api/crm/clients/stats failed:", error);
      return NextResponse.json(
        { success: false, error: "Failed to load stats" },
        { status: 500 }
      );
    }
  }
);
