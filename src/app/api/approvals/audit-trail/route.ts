import { NextRequest, NextResponse } from "next/server";
import { approvalService } from "@/lib/approval/approvalService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId") ?? undefined;
    const logs = approvalService.getAuditTrail(taskId);
    return NextResponse.json({ success: true, logs });
  } catch (err) {
    console.error("[API] GET /api/approvals/audit-trail", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
