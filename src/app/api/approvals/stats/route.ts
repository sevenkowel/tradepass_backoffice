import { NextResponse } from "next/server";
import { approvalService } from "@/lib/approval/approvalService";
import { slaEngine } from "@/lib/approval/slaEngine";

export async function GET() {
  try {
    const stats = approvalService.getStats();
    const team  = approvalService.getTeamPerformance();

    // Compute active (non-terminal) pending count and exact overdue count
    // for the sidebar badge — derived from live task data.
    const { items: activeTasks } = approvalService.getTasks({
      status: ["pending", "on_hold"] as any,
      pageSize: 9999,
    });
    const pendingCount = activeTasks.length;
    const overdueCount = activeTasks.filter((t) => {
      const snap = slaEngine.computeSnapshot(t);
      return snap.isOverdue;
    }).length;

    return NextResponse.json({ success: true, stats, team, pendingCount, overdueCount });
  } catch (err) {
    console.error("[API] GET /api/approvals/stats", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
