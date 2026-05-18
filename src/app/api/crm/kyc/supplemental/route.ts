/**
 * Backoffice 补充认证 API
 * POST: 发起补充认证请求
 * GET: 获取补充认证审核列表
 */

import { NextRequest, NextResponse } from "next/server";
import { supplementalKYCService } from "@/lib/kyc/supplemental-service";
import type { InitiateSupplementalKYCRequest } from "@/lib/kyc/supplemental-types";
import type { SupplementalKYCType, VerificationStage } from "@/lib/kyc/supplemental-types";

// ============================================================
// POST - 发起补充认证请求
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      type,
      requiredStages,
      reason,
      notes,
      deadline,
      restrictions,
      targetTier,
      notifyUser = true,
    } = body as InitiateSupplementalKYCRequest;

    // 验证必填字段
    if (!userId || !type || !requiredStages || requiredStages.length === 0 || !reason) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: userId, type, requiredStages, reason" },
        { status: 400 }
      );
    }

    // 验证类型
    const validTypes: SupplementalKYCType[] = [
      "document_expiry",
      "risk_control",
      "manual_review",
      "aml_compliance",
      "large_withdrawal",
      "tier_upgrade",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // 验证阶段
    const validStages: VerificationStage[] = ["identity", "liveness", "address", "questionnaire"];
    for (const stage of requiredStages) {
      if (!validStages.includes(stage)) {
        return NextResponse.json(
          { success: false, error: `Invalid stage: ${stage}` },
          { status: 400 }
        );
      }
    }

    // TODO: 获取当前管理员用户信息
    const adminUserId = "admin-001"; // 临时，实际应从 session 获取
    const adminUserName = "Admin User"; // 临时

    const result = await supplementalKYCService.initiateSupplementalKYC(
      {
        userId,
        type,
        requiredStages,
        reason,
        notes,
        deadline,
        restrictions,
        targetTier,
        notifyUser,
      },
      adminUserId,
      adminUserName
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to initiate supplemental KYC:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================================
// GET - 获取补充认证审核列表
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as "pending" | "in_progress" | "completed" | "all" | null;
    const type = searchParams.get("type") as SupplementalKYCType | null;
    const regionCode = searchParams.get("regionCode");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await supplementalKYCService.listSupplementalReview(
      status || "all",
      type || undefined,
      (regionCode as import("@/lib/kyc/region-config").RegionCode) || undefined,
      page,
      limit
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Failed to list supplemental review:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
