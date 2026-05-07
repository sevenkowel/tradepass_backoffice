/**
 * Backoffice KYC 审核 API (真实化)
 * GET  /api/crm/kyc/review  - 获取 KYC 审核列表
 * POST /api/crm/kyc/review  - 执行审核操作（approve/reject/request_info）
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { requireCsrf } from "@/lib/security";
import { transitionKYCStatus } from "@/lib/kyc/state-machine";

// ─── GET 获取审核列表 ────────────────────────────────────────────────────────────

export const GET = requireRole(["admin", "compliance_officer"], async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const regionCode = searchParams.get("region");
  const riskLevel = searchParams.get("risk");
  const search = searchParams.get("search")?.toLowerCase();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const where: Record<string, unknown> = {};

  if (status && status !== "all") {
    where.status = status;
  }
  if (regionCode && regionCode !== "all") {
    where.regionCode = regionCode;
  }

  // Fetch ALL records for global stats (no filters except region if specified)
  const globalWhere: Record<string, unknown> = {};
  if (regionCode && regionCode !== "all") {
    globalWhere.regionCode = regionCode;
  }

  const allRecordsRaw = await prisma.kYCRecord.findMany({
    where: globalWhere,
    include: { user: { select: { id: true, email: true, name: true, phone: true } } },
    orderBy: { submittedAt: "desc" },
  });

  const allRecords = allRecordsRaw.map((r) => {
    const score = r.amlRiskScore ?? 0;
    const riskLevel = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
    const flags: string[] = [];
    if (r.ocrConfidence !== null && r.ocrConfidence < 0.85) flags.push("Low OCR confidence");
    if (!r.livenessPassed) flags.push("Liveness check failed");
    if (!r.amlPassed) flags.push("AML screening failed");

    return {
      id: r.id,
      userId: r.userId,
      userName: r.user?.name ?? "Unknown",
      email: r.user?.email ?? "",
      phone: r.user?.phone ?? "",
      regionCode: r.regionCode,
      country: r.regionCode,
      kycLevel: r.kycLevel,
      status: r.status,
      riskLevel,
      documentType: r.documentType ?? "",
      documentFrontUrl: r.documentFrontUrl ?? "",
      documentBackUrl: r.documentBackUrl ?? undefined,
      selfieUrl: r.selfieUrl ?? undefined,
      ocrConfidence: r.ocrConfidence ?? 0,
      livenessPassed: r.livenessPassed ?? false,
      submittedAt: r.submittedAt?.toISOString() ?? r.createdAt.toISOString(),
      reviewedAt: r.reviewedAt?.toISOString() ?? undefined,
      reviewedBy: r.reviewedBy ?? undefined,
      rejectionReason: r.rejectionReason ?? undefined,
      amlPassed: r.amlPassed ?? false,
      amlRiskScore: r.amlRiskScore ?? 0,
      flags,
      personalInfo: r.personalInfo ? (JSON.parse(r.personalInfo) as Record<string, string>) : undefined,
    };
  });

  // Global stats (always based on ALL records, not filtered)
  const stats = {
    total: allRecords.length,
    submitted: allRecords.filter((r) => r.status === "submitted").length,
    under_review: allRecords.filter((r) => r.status === "under_review").length,
    approved: allRecords.filter((r) => r.status === "approved").length,
    rejected: allRecords.filter((r) => r.status === "rejected").length,
    high_risk: allRecords.filter((r) => r.riskLevel === "high").length,
  };

  // Apply filters for list items
  let records = [...allRecords];

  if (status && status !== "all") {
    records = records.filter((r) => r.status === status);
  }
  if (riskLevel && riskLevel !== "all") {
    records = records.filter((r) => r.riskLevel === riskLevel);
  }
  if (search) {
    records = records.filter(
      (r) =>
        r.userName.toLowerCase().includes(search) ||
        r.email.toLowerCase().includes(search) ||
        r.userId.toLowerCase().includes(search) ||
        r.id.toLowerCase().includes(search)
    );
  }

  const total = records.length;
  const start = (page - 1) * limit;
  const items = records.slice(start, start + limit);

  return NextResponse.json({
    success: true,
    items,
    total,
    page,
    limit,
    stats,
  });
});

// ─── POST 执行审核操作 ──────────────────────────────────────────────────────────

export const POST = requireRole(["admin", "compliance_officer"], async (request: NextRequest) => {
  const csrfError = requireCsrf(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const { id, action, reason, notes } = body as {
      id: string;
      action: "approve" | "reject" | "request_info" | "start_review";
      reason?: string;
      notes?: string;
    };

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: id, action" },
        { status: 400 }
      );
    }

    const record = await prisma.kYCRecord.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    if (!record) {
      return NextResponse.json(
        { success: false, error: "KYC record not found" },
        { status: 404 }
      );
    }

    const currentUser = await getCurrentUser(request);
    const adminId = currentUser?.id ?? "unknown";

    switch (action) {
      case "start_review": {
        if (record.status !== "submitted") {
          return NextResponse.json(
            { success: false, error: "Can only start review for submitted applications" },
            { status: 400 }
          );
        }
        const result = await transitionKYCStatus(record.userId, "under_review", { reviewedBy: adminId });
        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }
        break;
      }

      case "approve": {
        if (!["submitted", "under_review"].includes(record.status)) {
          return NextResponse.json(
            { success: false, error: "Can only approve submitted or under-review applications" },
            { status: 400 }
          );
        }
        const result = await transitionKYCStatus(record.userId, "approved", { reviewedBy: adminId });
        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

        // Create MT account on approval
        await createMTAccount(record.userId, record.kycLevel);
        break;
      }

      case "reject": {
        if (!reason) {
          return NextResponse.json(
            { success: false, error: "Rejection reason is required" },
            { status: 400 }
          );
        }
        if (!["submitted", "under_review"].includes(record.status)) {
          return NextResponse.json(
            { success: false, error: "Can only reject submitted or under-review applications" },
            { status: 400 }
          );
        }
        const result = await transitionKYCStatus(record.userId, "rejected", {
          reviewedBy: adminId,
          rejectionReason: reason,
          notes,
        });
        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }
        break;
      }

      case "request_info": {
        if (!reason) {
          return NextResponse.json(
            { success: false, error: "Request information reason is required" },
            { status: 400 }
          );
        }
        const result = await transitionKYCStatus(record.userId, "supplemental_required", {
          reviewedBy: adminId,
          notes: reason,
        });
        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `KYC application ${action === "approve" ? "approved" : action === "reject" ? "rejected" : action === "start_review" ? "moved to review" : "flagged for more info"} successfully`,
    });
  } catch (error) {
    console.error("KYC review action failed:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function createMTAccount(userId: string, kycLevel: string) {
  const existing = await prisma.mTAccount.findFirst({ where: { userId } });
  if (existing) return; // already has account

  const leverage = kycLevel === "enhanced" ? 500 : kycLevel === "standard" ? 200 : 100;
  const mtLogin = `MT${Date.now().toString(36).toUpperCase()}`;

  await prisma.mTAccount.create({
    data: {
      userId,
      mtLogin,
      mtPassword: generateRandomPassword(),
      group: "standard",
      leverage,
      currency: "USD",
      status: "active",
    },
  });

  // Create default wallet
  await prisma.wallet.upsert({
    where: { userId_currency: { userId, currency: "USD" } },
    create: { userId, currency: "USD", balance: 0, frozen: 0, available: 0 },
    update: {},
  });
}

function generateRandomPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
