import { NextRequest, NextResponse } from "next/server";
import { defaultAuthConfig } from "@/lib/auth-config";

/**
 * GET /api/config/auth
 * 返回默认认证配置（Mock 模式）
 */
export async function GET(_request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: defaultAuthConfig,
  });
}

/**
 * PUT /api/config/auth
 * Mock 更新认证配置
 */
export async function PUT(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({
    success: true,
    data: body,
  });
}
