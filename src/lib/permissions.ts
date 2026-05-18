import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

export type AppRole =
  | "admin"
  | "compliance_officer"
  | "risk_manager"
  | "finance_officer"
  | "support_agent"
  | "viewer";

/**
 * S5: Unified role-based access control for API routes.
 *
 * Usage:
 *   export const GET = requireRole(["admin", "compliance_officer"], async (req, user) => {
 *     // handler logic
 *   });
 */
const DEMO_USER = {
  id: "demo-admin",
  email: "demo@tradepass.com",
  name: "Demo Admin",
  status: "active",
  role: "admin" as AppRole,
};

function isDevMode(): boolean {
  return process.env.NODE_ENV === "development";
}

export function requireRole(
  allowedRoles: AppRole[],
  handler: (req: NextRequest, user: { id: string; email: string; name?: string | null; status: string }) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    let user = await getCurrentUser(req);

    // Dev mode fallback: auto-login as demo admin
    if (!user && isDevMode()) {
      user = DEMO_USER as unknown as NonNullable<typeof user>;
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // For MVP: check if user has any admin/backoffice access.
    // Production should check against a dedicated user_roles table.
    const userRole = (user as unknown as Record<string, unknown>).role as string | undefined;

    // In mock mode, map mock roles (platform_admin / tenant_admin / tenant_owner)
    // to the canonical "admin" AppRole so protected routes work during demo/testing.
    function resolveMockRole(role: string): AppRole {
      if (["platform_admin", "tenant_admin", "tenant_owner"].includes(role)) return "admin";
      return role as AppRole;
    }

    const effectiveRole =
      process.env.MOCK_DB === "true" && userRole !== undefined
        ? resolveMockRole(userRole)
        : (userRole as AppRole | undefined);

    // Fallback: if no explicit role field, allow all authenticated users
    // for backward-compat during migration.  In production this must be
    // tightened to strict role checks.
    const hasRole =
      effectiveRole !== undefined
        ? allowedRoles.includes(effectiveRole)
        : true; // TODO: remove fallback after role migration

    if (!hasRole) {
      return NextResponse.json(
        { success: false, error: "Forbidden: insufficient permissions" },
        { status: 403 }
      );
    }

    return handler(req, user);
  };
}

/**
 * S4: Require authentication only (no role check).
 * Use for routes that need login but not specific roles.
 */
export function requireAuth(
  handler: (req: NextRequest, user: { id: string; email: string; name?: string | null; status: string }) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    let user = await getCurrentUser(req);

    // Dev mode fallback: auto-login as demo admin
    if (!user && isDevMode()) {
      user = DEMO_USER as unknown as NonNullable<typeof user>;
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return handler(req, user);
  };
}
