/**
 * Backoffice 补充认证详情 API
 * GET: 获取补充认证请求详情
 * DELETE: 取消补充认证请求
 */

import { NextRequest, NextResponse } from "next/server";
import { supplementalKYCService } from "@/lib/kyc/supplemental-service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// ============================================================
// GET - 获取补充认证请求详情
// ============================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 从存储中获取请求
    // TODO: 实现获取单个请求的接口
    // 临时返回空

    return NextResponse.json({
      success: true,
      request: null,
    });
  } catch (error) {
    console.error("Failed to get supplemental request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - 取消补充认证请求
// ============================================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { success: false, error: "Cancellation reason is required" },
        { status: 400 }
      );
    }

    // TODO: 获取当前管理员用户信息
    const adminUserId = "admin-001"; // 临时

    const result = await supplementalKYCService.cancelSupplementalRequest(
      id,
      reason,
      adminUserId
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to cancel supplemental request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
