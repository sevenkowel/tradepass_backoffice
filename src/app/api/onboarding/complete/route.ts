import { NextRequest, NextResponse } from "next/server";

// 与父级 route.ts 共享的 store（简单方案：相同 key 前缀引用）
const onboardingStore = new Map<string, any>();

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const tenantId = req.cookies.get("portal_tenant")?.value;

  if (!token || !tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 标记 onboarding 完成
  const res = NextResponse.json({
    onboarding: {
      id: `onboarding-${tenantId}`,
      tenantId,
      status: "completed",
      step: 6,
      completedSteps: JSON.stringify([1, 2, 3, 4, 5, 6]),
      isLocked: false,
      data: "{}",
    },
    redirectTo: "/console",
  });

  // 设置完成 cookie
  res.cookies.set("onboarding_completed", "true", {
    httpOnly: false,
    path: "/",
    maxAge: 86400,
  });

  return res;
}
