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
    const segments = await prisma.clientSegment.findMany({ orderBy: { createdAt: "desc" } });
    const items = segments.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description ?? undefined,
      filter: safeJSON<Record<string, unknown>>(s.filter) ?? {},
      isDynamic: s.isDynamic,
      userCount: s.userCount,
      createdAt: s.createdAt.toISOString(),
    }));
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("GET /api/crm/segments failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load segments" }, { status: 500 });
  }
});

export const POST = requireRole([...ROLES_WRITE], async (req: NextRequest) => {
  let body: { name?: string; description?: string; filter?: unknown; isDynamic?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.name) {
    return NextResponse.json({ success: false, error: "name required" }, { status: 400 });
  }
  try {
    const seg = await prisma.clientSegment.create({
      data: {
        name: body.name,
        description: body.description ?? null,
        filter: JSON.stringify(body.filter ?? {}),
        isDynamic: body.isDynamic ?? true,
      },
    });
    return NextResponse.json({
      success: true,
      item: { ...seg, filter: body.filter ?? {}, createdAt: seg.createdAt.toISOString() },
    });
  } catch (error) {
    console.error("POST /api/crm/segments failed:", error);
    return NextResponse.json({ success: false, error: "Failed to create segment" }, { status: 500 });
  }
});

function safeJSON<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
