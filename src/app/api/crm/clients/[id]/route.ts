import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { mapUserToClient, statusToPrisma } from "@/lib/crm/clients/mapper";
import type { UserStatus } from "@/types/backoffice/user";

const ROLES = [
  "admin",
  "compliance_officer",
  "support_agent",
  "risk_manager",
  "finance_officer",
  "viewer",
] as const;

const includeShape = {
  wallets: { select: { balance: true, frozen: true, currency: true } },
  mtAccounts: { select: { equity: true, balance: true } },
  kycRecord: { select: { amlRiskScore: true, kycLevel: true, status: true } },
} as const;

export const GET = requireRole([...ROLES], async (req: NextRequest) => {
  const id = req.nextUrl.pathname.split("/").filter(Boolean).pop();
  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({ where: { id }, include: includeShape });
    if (!user) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, item: mapUserToClient(user) });
  } catch (error) {
    console.error("GET /api/crm/clients/[id] failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load client" }, { status: 500 });
  }
});

export const PATCH = requireRole(
  ["admin", "compliance_officer", "support_agent"],
  async (req: NextRequest, operator) => {
    const id = req.nextUrl.pathname.split("/").filter(Boolean).pop();
    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

    let body: { status?: UserStatus } = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const updates: { status?: string } = {};
    if (body.status) {
      if (!["active", "frozen", "pending", "closed"].includes(body.status)) {
        return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
      }
      updates.status = statusToPrisma(body.status);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No updatable fields" }, { status: 400 });
    }

    try {
      const before = await prisma.user.findUnique({ where: { id }, select: { status: true } });
      const user = await prisma.user.update({ where: { id }, data: updates, include: includeShape });

      if (updates.status && before && before.status !== updates.status) {
        const operatorName = operator.name?.trim() || operator.email;
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
        await prisma.$transaction([
          prisma.crmAuditLog.create({
            data: {
              userId: id,
              operatorId: operator.id,
              operatorName,
              action: "client.status.update",
              targetField: "status",
              oldValue: before.status,
              newValue: updates.status,
              ipAddress: ip,
            },
          }),
          prisma.crmTimelineEvent.create({
            data: {
              userId: id,
              type: updates.status === "suspended" ? "account_frozen" : "account_unfrozen",
              title:
                updates.status === "suspended"
                  ? "Account frozen"
                  : "Account unfrozen",
              description: `Changed by ${operatorName}`,
              operatorId: operator.id,
            },
          }),
        ]);
      }

      return NextResponse.json({ success: true, item: mapUserToClient(user) });
    } catch (error) {
      console.error("PATCH /api/crm/clients/[id] failed:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update client" },
        { status: 500 }
      );
    }
  }
);
