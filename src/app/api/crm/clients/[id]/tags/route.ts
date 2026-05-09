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

function clientIdFromPath(req: NextRequest): string | null {
  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  // .../clients/[id]/tags
  return parts[parts.length - 2] ?? null;
}

export const GET = requireRole([...ROLES_READ], async (req: NextRequest) => {
  const id = clientIdFromPath(req);
  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  try {
    const assignments = await prisma.clientTagAssignment.findMany({
      where: { userId: id },
      include: { tag: true },
    });
    return NextResponse.json({
      success: true,
      items: assignments.map((a) => ({
        id: a.tag.id,
        name: a.tag.name,
        color: a.tag.color,
        assignedAt: a.assignedAt.toISOString(),
        assignedBy: a.assignedBy ?? undefined,
      })),
    });
  } catch (error) {
    console.error("GET client tags failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load tags" }, { status: 500 });
  }
});

export const POST = requireRole([...ROLES_WRITE], async (req: NextRequest) => {
  const id = clientIdFromPath(req);
  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  let body: { tagNames?: string[] } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const tagNames = (body.tagNames ?? []).filter((n) => typeof n === "string" && n.length > 0);
  if (tagNames.length === 0) {
    return NextResponse.json({ success: false, error: "tagNames required" }, { status: 400 });
  }

  try {
    const tags = await prisma.clientTag.findMany({ where: { name: { in: tagNames } } });
    if (tags.length === 0) {
      return NextResponse.json({ success: false, error: "No matching tags" }, { status: 404 });
    }
    await Promise.all(
      tags.map((t) =>
        prisma.clientTagAssignment.upsert({
          where: { userId_tagId: { userId: id, tagId: t.id } },
          update: {},
          create: { userId: id, tagId: t.id, assignedBy: "system" },
        })
      )
    );
    return NextResponse.json({ success: true, added: tags.map((t) => t.name) });
  } catch (error) {
    console.error("POST client tags failed:", error);
    return NextResponse.json({ success: false, error: "Failed to add tags" }, { status: 500 });
  }
});

export const DELETE = requireRole([...ROLES_WRITE], async (req: NextRequest) => {
  const id = clientIdFromPath(req);
  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  let body: { tagNames?: string[] } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const tagNames = (body.tagNames ?? []).filter((n) => typeof n === "string");
  if (tagNames.length === 0) {
    return NextResponse.json({ success: false, error: "tagNames required" }, { status: 400 });
  }

  try {
    const tags = await prisma.clientTag.findMany({ where: { name: { in: tagNames } } });
    await prisma.clientTagAssignment.deleteMany({
      where: { userId: id, tagId: { in: tags.map((t) => t.id) } },
    });
    return NextResponse.json({ success: true, removed: tags.map((t) => t.name) });
  } catch (error) {
    console.error("DELETE client tags failed:", error);
    return NextResponse.json({ success: false, error: "Failed to remove tags" }, { status: 500 });
  }
});
