import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUserFromToken(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function getCurrentTenant(req: NextRequest) {
  const payload = await getCurrentUserFromToken(req);
  if (!payload) return null;

  try {
    // 1. 优先从 cookie 获取指定的租户（支持多租户切换）
    const tenantIdFromCookie = req.cookies.get("portal_tenant")?.value;
    if (tenantIdFromCookie) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantIdFromCookie },
      });
      // 验证用户是否属于该租户（owner 或 member）
      if (tenant && (tenant.ownerId === payload.userId || await prisma.tenantMember.findFirst({
        where: { tenantId: tenant.id, userId: payload.userId }
      }))) {
        return tenant;
      }
    }

    // 2. Try tenantMember first
    const member = await prisma.tenantMember.findFirst({
      where: { userId: payload.userId },
      include: { tenant: true },
    });
    if (member) return member.tenant;

    // 3. Fallback: user is owner of a tenant but no member record
    const owned = await prisma.tenant.findFirst({
      where: { ownerId: payload.userId },
    });
    if (owned) return owned;

    return null;
  } catch {
    return null;
  }
}
