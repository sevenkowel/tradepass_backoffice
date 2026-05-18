import { NextRequest, NextResponse } from "next/server";
import { approvalService } from "@/lib/approval/approvalService";
import { slaEngine } from "@/lib/approval/slaEngine";
import type { TaskListQuery } from "@/types/approval";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const view      = searchParams.get("view")      ?? undefined;
    const search    = searchParams.get("search")    ?? undefined;
    const country   = searchParams.get("country")   ?? undefined;
    const dateFrom  = searchParams.get("dateFrom")  ?? undefined;
    const dateTo    = searchParams.get("dateTo")    ?? undefined;
    const assignee  = searchParams.get("assignee")  ?? undefined;
    const page      = Math.max(1, parseInt(searchParams.get("page")     ?? "1",  10));
    const pageSize  = Math.min(100, parseInt(searchParams.get("pageSize") ?? "20", 10));
    const sortBy    = (searchParams.get("sortBy")    ?? "createdAt") as TaskListQuery["sortBy"];
    const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";

    const typeParam    = searchParams.get("type");
    const statusParam  = searchParams.get("status");
    const riskParam    = searchParams.get("riskLevel");
    const slaParam     = searchParams.get("slaStatus");

    const baseQuery: TaskListQuery = {
      page, pageSize, sortBy, sortOrder,
      ...(search    && { search }),
      ...(typeParam  && { type: typeParam as any }),
      ...(statusParam && { status: statusParam.split(",") as any }),
      ...(riskParam   && { riskLevel: riskParam.split(",") as any }),
      ...(slaParam    && { slaStatus: slaParam.split(",") as any }),
      ...(assignee    && { assignee: assignee as any }),
      ...(country     && { country }),
      ...(dateFrom    && { dateFrom }),
      ...(dateTo      && { dateTo }),
    };

    let result;
    switch (view) {
      case "my-tasks":        result = approvalService.getMyTasks(baseQuery);           break;
      case "pending-queue":   result = approvalService.getPendingQueue(baseQuery);      break;
      case "sla-warning":     result = approvalService.getSlaWarningTasks(baseQuery);   break;
      case "high-risk":       result = approvalService.getHighRiskTasks(baseQuery);     break;
      case "escalated":       result = approvalService.getEscalatedTasks(baseQuery);    break;
      case "re-verification": result = approvalService.getReVerificationTasks(baseQuery); break;
      default:                result = approvalService.getTasks(baseQuery);
    }

    const items = result.items.map((task) => ({
      ...task,
      slaSnapshot: slaEngine.computeSnapshot(task),
    }));

    return NextResponse.json({
      success:  true,
      items,
      total:    result.total,
      page:     result.page,
      pageSize: result.pageSize,
    });
  } catch (err) {
    console.error("[API] GET /api/approvals/tasks", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
