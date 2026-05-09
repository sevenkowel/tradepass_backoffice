import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { aggregateClientDetail, detailIncludeShape } from "@/lib/crm/clients/detail-mapper";

export const GET = requireRole(
  ["admin", "compliance_officer", "support_agent", "risk_manager", "finance_officer", "viewer"],
  async (req: NextRequest) => {
    const parts = req.nextUrl.pathname.split("/").filter(Boolean);
    const id = parts[parts.length - 2]; // .../clients/[id]/detail

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: detailIncludeShape,
      });
      if (!user) {
        return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
      }

      const since90d = new Date(Date.now() - 90 * 24 * 3600_000);

      const [notes, devices, agreements, cases, tickets, timeline, auditLogs, tagAssigns, riskEvents] =
        await Promise.all([
          prisma.clientNote.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 100 }),
          prisma.clientDevice.findMany({ where: { userId: id }, orderBy: { lastUsedAt: "desc" } }),
          prisma.clientAgreement.findMany({ where: { userId: id }, orderBy: { signedAt: "desc" } }),
          prisma.crmCase.findMany({ where: { userId: id }, orderBy: { updatedAt: "desc" } }),
          prisma.crmTicket.findMany({ where: { userId: id }, orderBy: { updatedAt: "desc" } }),
          prisma.crmTimelineEvent.findMany({
            where: { userId: id },
            orderBy: { createdAt: "desc" },
            take: 200,
          }),
          prisma.crmAuditLog.findMany({
            where: { userId: id },
            orderBy: { createdAt: "desc" },
            take: 200,
          }),
          prisma.clientTagAssignment.findMany({
            where: { userId: id },
            include: { tag: true },
          }),
          prisma.riskEvent.findMany({ where: { userId: id, createdAt: { gte: since90d } } }),
        ]);

      const detail = aggregateClientDetail({
        user,
        notes,
        devices,
        agreements,
        cases,
        tickets,
        timeline,
        auditLogs,
        tagNames: tagAssigns.map((ta) => ta.tag.name),
        riskEvents,
      });

      return NextResponse.json({ success: true, detail });
    } catch (error) {
      console.error("GET /api/crm/clients/[id]/detail failed:", error);
      return NextResponse.json(
        { success: false, error: "Failed to load client detail" },
        { status: 500 }
      );
    }
  }
);
