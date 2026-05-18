/**
 * Backoffice 证件过期检查 API
 * POST: 为用户发起证件过期更新请求
 * GET: 获取即将过期或已过期的用户列表
 */

import { NextRequest, NextResponse } from "next/server";
import { supplementalKYCService } from "@/lib/kyc/supplemental-service";

// ============================================================
// POST - 发起证件过期更新请求
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    // 先检查证件状态
    const check = await supplementalKYCService.checkDocumentExpiry(userId);

    if (!check.expired && !check.expiringSoon) {
      return NextResponse.json(
        {
          success: false,
          error: "Document is not expired or expiring soon",
          check,
        },
        { status: 400 }
      );
    }

    // TODO: 获取当前管理员用户信息
    const adminUserId = "admin-001"; // 临时
    const adminUserName = "Admin User"; // 临时

    const result = await supplementalKYCService.initiateDocumentExpiryRequest(
      userId,
      adminUserId,
      adminUserName
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      check,
      request: result.request,
    });
  } catch (error) {
    console.error("Failed to initiate document expiry request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================================
// GET - 获取证件过期用户列表
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all"; // "all" | "expired" | "expiring_soon"

    // TODO: 实现扫描所有用户的证件过期状态
    // 临时返回空列表

    return NextResponse.json({
      success: true,
      filter,
      users: [],
      total: 0,
    });
  } catch (error) {
    console.error("Failed to list document expiry users:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
