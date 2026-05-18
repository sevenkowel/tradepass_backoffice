import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

const ROLES_WRITE = ["admin", "compliance_officer", "support_agent"] as const;

function idFromPath(req: NextRequest): string | null {
  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? null;
}

export const PATCH = requireRole([...ROLES_WRITE], async (req: NextRequest) => {
  const id = idFromPath(req);
  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  let body: { name?: string; color?: string; description?: string; autoRule?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const tag = await prisma.clientTag.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.color !== undefined ? { color: body.color } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.autoRule !== undefined
          ? { autoRule: body.autoRule ? JSON.stringify(body.autoRule) : null }
          : {}),
      },
    });
    return NextResponse.json({ success: true, item: { ...tag, createdAt: tag.createdAt.toISOString() } });
  } catch (error) {
    console.error("PATCH /api/crm/tags/[id] failed:", error);
    return NextResponse.json({ success: false, error: "Failed to update tag" }, { status: 500 });
  }
});

export const DELETE = requireRole([...ROLES_WRITE], async (req: NextRequest) => {
  const id = idFromPath(req);
  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  try {
    const existing = await prisma.clientTag.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    if (existing.isSystem) {
      return NextResponse.json(
        { success: false, error: "System tags cannot be deleted" },
        { status: 403 }
      );
    }
    await prisma.clientTag.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/crm/tags/[id] failed:", error);
    return NextResponse.json({ success: false, error: "Failed to delete tag" }, { status: 500 });
  }
});
