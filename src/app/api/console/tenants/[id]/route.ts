import { NextRequest, NextResponse } from "next/server";
import { mockDB } from "@/lib/mock/mockDB";

/**
 * GET /api/console/tenants/:id
 * 获取租户详情（纯前端 Mock 模式）
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;

    // 从 MockDB 获取租户
    const tenant = mockDB.findById('tenants', tenantId);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // 构建品牌配置
    const brand = {
      brandName: tenant.name,
      logoUrl: tenant.logo || null,
      primaryColor: tenant.primaryColor || "#1a73e8",
    };

    // 获取订阅 (License)
    const licenses = mockDB.find('licenses', (l: any) => l.tenantId === tenantId);

    // 获取成员统计（从 users 集合中统计）
    const users = mockDB.find('users', (u: any) => u.tenantId === tenantId);
    const memberCount = users.length;

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.subdomain || tenant.id,
        subdomain: tenant.subdomain || tenant.id,
        status: tenant.status,
        plan: (tenant as any).subscription?.plan || "trial",
        createdAt: tenant.createdAt,
        brand,
        stats: {
          members: memberCount,
          subscriptions: licenses.length,
        },
        subscriptions: licenses.map((s: any) => ({
          id: s.id,
          productCode: s.type === 'MT4' ? 'mt4_license' : s.type === 'MT5' ? 'mt5_license' : 'ctrader_license',
          productName: `${s.type} License`,
          plan: "default",
          status: s.status,
          startsAt: s.createdAt,
          endsAt: s.expiresAt,
          autoRenew: false,
        })),
      },
    });
  } catch (error: any) {
    console.error("[tenant detail] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tenant" },
      { status: 500 }
    );
  }
}
