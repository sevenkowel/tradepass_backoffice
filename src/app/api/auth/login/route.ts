import { NextRequest, NextResponse } from "next/server";
import { setSecureCookie } from "@/lib/security";
import { z } from "zod";

// Mock 模式检测
function isMockMode(req: NextRequest): boolean {
  return req.cookies.get('mock_mode')?.value === 'true' || 
         req.headers.get('x-mock-mode') === 'true';
}

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(1),
  otpCode: z.string().length(6).optional(),
  loginStep: z.enum(["password", "2fa"]).optional().default("password"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, phone, password, otpCode, loginStep } = parsed.data;

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Email or phone is required" },
        { status: 400 }
      );
    }

    // Mock 模式处理
    if (isMockMode(req)) {
      return handleMockLogin(req, { email, password });
    }

    // 真实数据库模式（原逻辑保留）
    return handleRealLogin(req, { email, phone, password, otpCode, loginStep });

  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Mock 模式登录处理
async function handleMockLogin(
  req: NextRequest,
  { email, password }: { email?: string; password?: string }
) {
  // 忽略 password 参数，Mock 模式下无需验证密码
  void password;
  // 动态导入避免服务端加载
  const { mockDB } = await import('@/lib/mock');
  
  const users = mockDB.getCollection('users');
  const user = users.find((u: any) => u.email === email);

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // 创建会话 Token
  const token = `mock-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  mockDB.createSession(token, user.id, 24);
  mockDB.setCurrentUser(user.id);

  // 更新最后登录时间
  mockDB.update('users', user.id, { lastLoginAt: new Date().toISOString() });

  const res = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: 'active',
      kycStatus: user.kycStatus,
      kycLevel: user.kycLevel,
      twoFactorEnabled: false,
    },
    onboardingCompleted: user.role !== 'platform_admin',
    redirectTo: user.role === 'platform_admin' ? '/backoffice' : 
                user.role === 'tenant_owner' ? '/console' :
                user.role === 'tenant_admin' ? '/crm' : '/portal',
  });

  // 设置 Cookies（纯路径模式：不需要 domain）
  setSecureCookie(res, "token", token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60,
  });

  setSecureCookie(res, "onboarding_completed", "true", {
    maxAge: 24 * 60 * 60,
  });

  if (user.tenantId) {
    setSecureCookie(res, "portal_tenant", String(user.tenantId), {
      maxAge: 24 * 60 * 60,
    });
  }

  return res;
}

// 真实数据库登录处理（原逻辑）
async function handleRealLogin(
  req: NextRequest,
  { email, phone, password, otpCode, loginStep }: any
) {
  const { prisma } = await import('@/lib/prisma');
  const { verifyPassword, signToken } = await import('@/lib/auth');
  const { verify2FACode } = await import('@/lib/otp');
  const { generateCsrfToken, setCsrfCookie } = await import('@/lib/security');

  // 查找用户
  let user = null;
  if (email) {
    user = await prisma.user.findUnique({ where: { email } });
  } else if (phone) {
    user = await prisma.user.findFirst({ where: { phone } });
  }

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (user.status === "pending_verification") {
    return NextResponse.json(
      { error: "Please verify your email or phone first" },
      { status: 403 }
    );
  }

  if (user.status === "suspended") {
    return NextResponse.json(
      { error: "Account suspended. Please contact support." },
      { status: 403 }
    );
  }

  // 密码验证
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // 2FA 验证
  if (user.twoFactorEnabled && loginStep === "password") {
    return NextResponse.json({
      success: false,
      require2FA: true,
      message: "2FA code required",
      hint: "请输入当天 2FA 验证码（6位：YYMMDD）",
    }, { status: 403 });
  }

  if (user.twoFactorEnabled && loginStep === "2fa") {
    if (!otpCode) {
      return NextResponse.json(
        { success: false, require2FA: true, error: "2FA code required" },
        { status: 403 }
      );
    }
    const otpValid = verify2FACode(otpCode);
    if (!otpValid) {
      return NextResponse.json(
        { success: false, error: "Invalid 2FA code" },
        { status: 401 }
      );
    }
  }

  // 更新最后登录时间
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // 检查 onboarding 状态
  const tenant = await prisma.tenant.findFirst({
    where: { ownerId: user.id },
    include: { onboarding: true },
  });

  const onboardingCompleted = tenant?.onboarding?.status === "completed";

  const token = signToken({ userId: user.id, email: user.email });
  const csrfToken = generateCsrfToken();

  const res = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      kycStatus: user.kycStatus,
      twoFactorEnabled: user.twoFactorEnabled,
    },
    onboardingCompleted,
    redirectTo: onboardingCompleted ? "/portal" : "/console/onboarding",
  });

  setSecureCookie(res, "token", token, {
    httpOnly: true,
  });

  setSecureCookie(res, "onboarding_completed", onboardingCompleted ? "true" : "false", {
  });

  setCsrfCookie(res, csrfToken);

  if (tenant) {
    setSecureCookie(res, "portal_tenant", tenant.id, {});
  }

  return res;
}
