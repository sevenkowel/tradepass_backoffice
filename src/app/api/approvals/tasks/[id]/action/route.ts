import { NextRequest, NextResponse } from "next/server";
import { approvalService } from "@/lib/approval/approvalService";
import { slaEngine } from "@/lib/approval/slaEngine";
import type { ApprovalAction } from "@/types/approval";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json() as {
      action:      ApprovalAction;
      note?:       string;
      reason?:     string;
      assignToId?: string;
    };

    if (!body.action) {
      return NextResponse.json({ success: false, error: "action is required" }, { status: 400 });
    }

    const result = approvalService.performAction(id, body.action, {
      note:       body.note,
      reason:     body.reason,
      assignToId: body.assignToId,
    });

    if (!result.success || !result.task) {
      return NextResponse.json({ success: false, error: result.error ?? "Action failed" }, { status: 400 });
    }

    const slaSnapshot = slaEngine.computeSnapshot(result.task);
    return NextResponse.json({ success: true, task: { ...result.task, slaSnapshot } });
  } catch (err) {
    console.error("[API] POST /api/approvals/tasks/[id]/action", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
