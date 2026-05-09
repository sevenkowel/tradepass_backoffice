import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { mapUserToClient, buildUserWhere } from "@/lib/crm/clients/mapper";
import type { Prisma } from "@prisma/client";

export const GET = requireRole(
  ["admin", "compliance_officer", "support_agent", "risk_manager", "finance_officer", "viewer"],
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    const where = buildUserWhere({
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      kycStatus: searchParams.get("kycStatus") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    });

    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const orderBy: Prisma.UserOrderByWithRelationInput =
      sortBy === "name" || sortBy === "email"
        ? { [sortBy]: sortOrder }
        : { createdAt: sortOrder };

    try {
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            wallets: { select: { balance: true, frozen: true, currency: true } },
            mtAccounts: { select: { equity: true, balance: true } },
            kycRecord: { select: { amlRiskScore: true, kycLevel: true, status: true } },
          },
        }),
        prisma.user.count({ where }),
      ]);

      // Optional in-memory filters that depend on derived fields
      const levelFilter = searchParams.get("level");
      const riskFilter = searchParams.get("riskLevel");
      const lifecycleFilter = searchParams.get("lifecycleStage");

      let items = users.map(mapUserToClient);

      if (levelFilter) items = items.filter((c) => c.level === levelFilter);
      if (riskFilter) items = items.filter((c) => c.riskLevel === riskFilter);
      if (lifecycleFilter) items = items.filter((c) => c.lifecycleStage === lifecycleFilter);

      return NextResponse.json({ success: true, items, total, page, pageSize });
    } catch (error) {
      console.error("GET /api/crm/clients failed:", error);
      return NextResponse.json(
        { success: false, error: "Failed to load clients" },
        { status: 500 }
      );
    }
  }
);
