import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auth/me
 * Mock 模式：返回当前登录用户信息
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Mock 模式：只要 token 存在就返回用户
  const tenantId = req.cookies.get("portal_tenant")?.value || "";
  const mockUserRole = req.cookies.get("mock_user_role")?.value || "tenant_owner";

  return NextResponse.json({
    user: {
      id: `user-${Date.now()}`,
      email: "user@tradepass.io",
      name: "TradePass User",
      role: mockUserRole,
      status: "active",
      tenantId,
    },
  });
}
