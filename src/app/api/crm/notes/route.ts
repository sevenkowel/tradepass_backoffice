/**
 * GET /api/crm/notes — global cross-client note feed.
 * Used by the Notes sub-page; filters can be added later as the feature grows.
 */
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

export const GET = requireRole([...ROLES_READ], async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "100", 10)));
  const noteType = searchParams.get("noteType") || undefined;
  const isPinned = searchParams.get("isPinned");

  try {
    const notes = await prisma.clientNote.findMany({
      where: {
        ...(noteType ? { noteType } : {}),
        ...(isPinned === "true" ? { isPinned: true } : {}),
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    const userIds = [...new Set(notes.map((n) => n.userId))];
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const items = notes.map((n) => ({
      id: n.id,
      clientId: n.userId,
      clientName: userMap.get(n.userId)?.name ?? "Unknown",
      clientEmail: userMap.get(n.userId)?.email ?? "",
      content: n.content,
      author: n.authorId,
      authorName: n.authorName,
      mentions: safeJSON<string[]>(n.mentions) ?? [],
      isPinned: n.isPinned,
      noteType: n.noteType,
      createdAt: n.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("GET /api/crm/notes failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load notes" }, { status: 500 });
  }
});

function safeJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
