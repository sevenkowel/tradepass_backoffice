import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/user/me
 * 获取当前登录用户信息（Mock 模式）
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 从 cookie 中获取用户信息
  const mockUser = req.cookies.get("mock_user_role")?.value;
  const tenantId = req.cookies.get("portal_tenant")?.value;

  // Mock 模式：返回默认用户信息
  // 注册 API 设置了 token 和 portal_tenant，这里根据 token 返回用户
  const mockUserData = {
    id: "user-" + token.slice(-8),
    email: "user@tradepass.io",
    name: "TradePass User",
    role: mockUser || "tenant_owner",
    status: "active",
    tenantId: tenantId || "",
  };

  return NextResponse.json({ user: mockUserData });
}
