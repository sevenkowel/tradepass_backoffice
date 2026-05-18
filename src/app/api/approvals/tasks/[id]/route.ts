import { NextRequest, NextResponse } from "next/server";
import { approvalService } from "@/lib/approval/approvalService";
import { slaEngine } from "@/lib/approval/slaEngine";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = approvalService.getTask(id);
    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }
    const slaSnapshot  = slaEngine.computeSnapshot(task);
    const auditTrail   = approvalService.getAuditTrail(id);
    return NextResponse.json({ success: true, task: { ...task, slaSnapshot }, auditTrail });
  } catch (err) {
    console.error("[API] GET /api/approvals/tasks/[id]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
