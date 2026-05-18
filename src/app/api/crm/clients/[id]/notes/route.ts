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
const ROLES_WRITE = ["admin", "compliance_officer", "support_agent", "risk_manager"] as const;

function clientIdFromPath(req: NextRequest): string | null {
  const parts = req.nextUrl.pathname.split("/").filter(Boolean);
  return parts[parts.length - 2] ?? null;
}

export const GET = requireRole([...ROLES_READ], async (req: NextRequest) => {
  const id = clientIdFromPath(req);
  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  try {
    const notes = await prisma.clientNote.findMany({
      where: { userId: id },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 100,
    });
    const items = notes.map((n) => ({
      id: n.id,
      clientId: n.userId,
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
    console.error("GET client notes failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load notes" }, { status: 500 });
  }
});

export const POST = requireRole([...ROLES_WRITE], async (req: NextRequest, operator) => {
  const id = clientIdFromPath(req);
  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  let body: {
    content?: string;
    mentions?: string[];
    noteType?: string;
    isPinned?: boolean;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.content || body.content.trim().length === 0) {
    return NextResponse.json({ success: false, error: "Content required" }, { status: 400 });
  }

  try {
    const operatorName = operator.name?.trim() || operator.email;
    const note = await prisma.clientNote.create({
      data: {
        userId: id,
        authorId: operator.id,
        authorName: operatorName,
        content: body.content.trim(),
        mentions: JSON.stringify(body.mentions ?? []),
        isPinned: body.isPinned ?? false,
        noteType: body.noteType ?? "general",
      },
    });

    // Log to timeline.
    await prisma.crmTimelineEvent.create({
      data: {
        userId: id,
        type: "note_added",
        title: "Internal note added",
        description: note.content.slice(0, 80),
        operatorId: operator.id,
      },
    });

    return NextResponse.json({
      success: true,
      item: {
        id: note.id,
        clientId: note.userId,
        content: note.content,
        author: note.authorId,
        authorName: note.authorName,
        mentions: safeJSON<string[]>(note.mentions) ?? [],
        isPinned: note.isPinned,
        noteType: note.noteType,
        createdAt: note.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("POST client note failed:", error);
    return NextResponse.json({ success: false, error: "Failed to add note" }, { status: 500 });
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
