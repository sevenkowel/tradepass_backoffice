import { NextRequest, NextResponse } from "next/server";
import { approvalService } from "@/lib/approval/approvalService";
import type { ApprovalAction } from "@/types/approval";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      taskIds: string[];
      action:  ApprovalAction;
      note?:   string;
      reason?: string;
    };

    if (!body.taskIds?.length || !body.action) {
      return NextResponse.json(
        { success: false, error: "taskIds and action are required" },
        { status: 400 }
      );
    }

    const actor = approvalService.getCurrentReviewer();
    const result = approvalService.batchPerform({
      taskIds:  body.taskIds,
      action:   body.action,
      actorId:  actor?.id ?? "reviewer-1",
      note:     body.note,
      reason:   body.reason,
    });

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error("[API] POST /api/approvals/batch", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
