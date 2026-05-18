import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

const ROLES_READ = [
  "admin",
  "compliance_officer",
  "support_agent",
  "risk_manager",
  "finance_officer",
  "viewer",
] as const;

const ROLES_WRITE = ["admin", "compliance_officer", "support_agent"] as const;

export const GET = requireRole([...ROLES_READ], async (_req: NextRequest) => {
  try {
    const tags = await prisma.clientTag.findMany({ orderBy: { name: "asc" } });
    const counts = await prisma.clientTagAssignment.groupBy({
      by: ["tagId"],
      _count: { _all: true },
    });
    const countMap = new Map(counts.map((c) => [c.tagId, c._count._all]));
    const items = tags.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      description: t.description ?? undefined,
      isSystem: t.isSystem,
      autoRule: t.autoRule ? safeJSON(t.autoRule) : undefined,
      userCount: countMap.get(t.id) ?? 0,
      createdAt: t.createdAt.toISOString(),
    }));
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("GET /api/crm/tags failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load tags" }, { status: 500 });
  }
});

export const POST = requireRole([...ROLES_WRITE], async (req: NextRequest) => {
  let body: { name?: string; color?: string; description?: string; isSystem?: boolean; autoRule?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.name) {
    return NextResponse.json({ success: false, error: "Tag name required" }, { status: 400 });
  }
  try {
    const tag = await prisma.clientTag.create({
      data: {
        name: body.name,
        color: body.color ?? "#94a3b8",
        description: body.description ?? null,
        isSystem: body.isSystem ?? false,
        autoRule: body.autoRule ? JSON.stringify(body.autoRule) : null,
      },
    });
    return NextResponse.json({ success: true, item: { ...tag, userCount: 0, createdAt: tag.createdAt.toISOString() } });
  } catch (error) {
    if (error instanceof Error && /Unique constraint/i.test(error.message)) {
      return NextResponse.json({ success: false, error: "Tag name already exists" }, { status: 409 });
    }
    console.error("POST /api/crm/tags failed:", error);
    return NextResponse.json({ success: false, error: "Failed to create tag" }, { status: 500 });
  }
});

function safeJSON(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}
