import { NextRequest, NextResponse } from "next/server";
import { setSecureCookie } from "@/lib/security";
import { z } from "zod";

// Mock 模式检测
function isMockMode(req: NextRequest): boolean {
  return process.env.MOCK_DB === 'true' ||
         req.cookies.get('mock_mode')?.value === 'true' ||
         req.headers.get('x-mock-mode') === 'true';
}

const registerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(1),
  name: z.string().min(1),
  otpCode: z.string().optional(),
  skipVerification: z.boolean().optional(),
  tenantId: z.string().nullish(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { email, phone, password, name, tenantId } = parsed.data;

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Email or phone is required" },
        { status: 400 }
      );
    }

    // Mock 模式处理
    if (isMockMode(req)) {
      return handleMockRegister(req, { email, name, tenantId });
    }

    // 真实数据库模式
    return handleRealRegister(req, parsed.data);

  } catch (err) {
    console.error("Register error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: "Internal server error", detail: message }, { status: 500 });
  }
}

// Mock 模式注册处理
async function handleMockRegister(
  req: NextRequest,
  { email, name, tenantId }: { email?: string; name: string; tenantId?: string | null }
) {
  const { mockDB, generateId } = await import('@/lib/mock');
  
  // 检查邮箱是否已存在
  const users = mockDB.getCollection('users');
  if (email && users.some((u: any) => u.email === email)) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  let assignedTenantId = tenantId;

  // 如果没有 tenantId，创建新租户（官网注册场景）
  if (!assignedTenantId) {
    const newTenant = {
      id: generateId('tenant'),
      name: `${name}'s Broker`,
      subdomain: `tenant-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      status: 'trial',
      ownerId: '', // 会在创建用户后更新
    };
    mockDB.insert('tenants', newTenant);
    assignedTenantId = newTenant.id;
  }

  // 创建新用户
  const newUser = {
    id: generateId('user'),
    email: email || `user-${Date.now()}@demo.local`,
    name,
    role: tenantId ? 'user' : 'tenant_owner', // 有 tenantId 说明是 Portal 注册，否则是官网注册
    tenantId: assignedTenantId,
    createdAt: new Date().toISOString(),
    kycStatus: 'not_started',
    status: 'active',
  };

  mockDB.insert('users', newUser);

  // 如果是租户所有者，更新租户的 ownerId
  if (newUser.role === 'tenant_owner') {
    mockDB.update('tenants', assignedTenantId, { ownerId: newUser.id });
  }

  // 创建会话
  const token = `mock-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  mockDB.createSession(token, newUser.id, 24);
  mockDB.setCurrentUser(newUser.id);

  // 查找租户信息
  const tenant = mockDB.findById('tenants', assignedTenantId);

  const res = NextResponse.json({
    success: true,
    autoLogin: true,
    token,
    tenantId: assignedTenantId,
    subdomain: tenant?.subdomain,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    },
    message: "Registration successful. Redirecting to portal...",
  });

  setSecureCookie(res, "token", token, { 
    httpOnly: true, 
    maxAge: 24 * 60 * 60,
  });
  setSecureCookie(res, "onboarding_completed", newUser.role === 'tenant_owner' ? "false" : "true", { 
    maxAge: 24 * 60 * 60,
  });
  setSecureCookie(res, "portal_tenant", assignedTenantId, { 
    maxAge: 24 * 60 * 60,
  });

  return res;
}

// 真实数据库注册处理（原逻辑）
async function handleRealRegister(req: NextRequest, data: any) {
  const { prisma } = await import('@/lib/prisma');
  const { hashPassword, signToken } = await import('@/lib/auth');
  const { checkBlacklist } = await import('@/lib/risk/engine');
  const { verifyOTPCode } = await import('@/lib/otp');
  const { parseAuthConfig } = await import('@/lib/auth-config');

  const { email, phone, password, name, otpCode, skipVerification, tenantId } = data;

  // 读取租户认证配置
  let authConfig = parseAuthConfig(null);
  if (tenantId) {
    const tenantCfg = await prisma.tenantConfig.findUnique({
      where: { tenantId },
      select: { auth: true },
    });
    authConfig = parseAuthConfig(tenantCfg?.auth);
  }

  // 检查注册方式
  const registerMethod = email ? "email" : "phone";
  if (!authConfig.registerMethods.includes(registerMethod as "email" | "phone")) {
    return NextResponse.json(
      { error: `Registration via ${registerMethod} is not allowed` },
      { status: 403 }
    );
  }

  // 黑名单检查
  const blacklist = await checkBlacklist({ email: email || undefined, phone: phone || undefined });
  if (blacklist.blocked) {
    return NextResponse.json({ error: "Registration not allowed" }, { status: 403 });
  }

  // 检查邮箱/手机是否已注册
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
  }

  const isDevSkip = skipVerification === true && authConfig.allowSkipVerification;

  // 验证 OTP
  if (authConfig.emailVerificationRequired && email && !isDevSkip) {
    if (!otpCode) {
      return NextResponse.json(
        { error: "Email verification required", requireOtp: true, otpType: "email" },
        { status: 400 }
      );
    }
    if (!verifyOTPCode(otpCode)) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }
  }

  const passwordHash = await hashPassword(password);

  // 创建用户 + 租户
  const { user, tenant } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: email || `phone_${Date.now()}@placeholder.local`,
        phone: phone || null,
        passwordHash,
        name,
        status: isDevSkip ? "active" : "pending_verification",
      },
    });

    const tenantSlug = `tenant-${user.id.slice(0, 8)}`;
    const subdomainPrefix = name.toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
    const subdomain = `${subdomainPrefix}-${user.id.slice(0, 6)}`;
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const tenant = await tx.tenant.create({
      data: {
        name: name,
        slug: tenantSlug,
        ownerId: user.id,
        status: "trial",
        plan: "mvp",
        subdomain: subdomain,
        trialEndsAt,
      },
    });

    await tx.tenantOnboarding.create({
      data: {
        tenantId: tenant.id,
        status: "in_progress",
        step: 1,
      },
    });

    return { user, tenant };
  });

  if (isDevSkip) {
    const token = signToken({ userId: user.id, email: user.email });
    const res = NextResponse.json({
      success: true,
      autoLogin: true,
      token,
      tenantId: tenant.id,
      user: { id: user.id, email: user.email, name: user.name },
    });
    setSecureCookie(res, "token", token, { httpOnly: true });
    setSecureCookie(res, "portal_tenant", tenant.id, { });
    return res;
  }

  return NextResponse.json({
    success: true,
    message: "Registration successful. Please verify your contact information.",
    tenantId: tenant.id,
  });
}
