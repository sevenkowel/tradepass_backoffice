/**
 * Backoffice 用户 KYC 详情 API
 * GET: 获取用户 KYC 详情（包含补充认证状态）
 */

import { NextRequest, NextResponse } from "next/server";
import { supplementalKYCService } from "@/lib/kyc/supplemental-service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// ============================================================
// GET - 获取用户 KYC 详情
// ============================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: userId } = await params;

    // 获取用户补充认证状态
    const supplementalStatus = await supplementalKYCService.getUserSupplementalStatus(userId);

    // TODO: 获取用户完整 KYC 信息
    // 临时返回补充认证状态

    return NextResponse.json({
      success: true,
      userId,
      supplementalStatus,
      // TODO: 添加完整的 KYC 信息
      kycStatus: null,
    });
  } catch (error) {
    console.error("Failed to get user KYC:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
