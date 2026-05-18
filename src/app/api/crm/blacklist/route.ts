import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { requireCsrf } from "@/lib/security";

export const GET = requireRole(["admin", "compliance_officer", "risk_manager"], async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (type && type !== "all") where.type = type;
  if (search) {
    where.value = { contains: search, mode: "insensitive" };
  }

  const entries = await prisma.blacklistEntry.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, entries });
});

export const POST = requireRole(["admin", "compliance_officer"], async (req: NextRequest) => {
  const csrfError = requireCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const { type, value, reason, source = "manual" } = body;

    if (!type || !value) {
      return NextResponse.json({ error: "Missing type or value" }, { status: 400 });
    }

    const entry = await prisma.blacklistEntry.create({
      data: { type, value, reason, source },
    });

    return NextResponse.json({ success: true, entry });
  } catch (err) {
    console.error("Blacklist create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
