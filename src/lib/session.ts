import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { isTokenRevoked } from "@/lib/security";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  // S9: Check if token has been revoked (e.g. after password change / logout)
  if (isTokenRevoked(token)) return null;

  // MOCK_DB 模式：mock-token 不是 JWT，从 mockDB session store 查找用户
  if (process.env.MOCK_DB === "true" && token.startsWith("mock-token-")) {
    const { mockDB } = await import("@/lib/mock/mockDB");
    const session = mockDB.validateSession(token);
    if (!session) return null;
    const user = mockDB.findById("users", session.userId);
    if (!user || (user as Record<string, unknown>).status === "suspended") return null;
    return user as ReturnType<typeof prisma.user.findUnique> extends Promise<infer T> ? T : never;
  }

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user || user.status === "suspended") return null;
    return user;
  } catch {
    return null;
  }
}
