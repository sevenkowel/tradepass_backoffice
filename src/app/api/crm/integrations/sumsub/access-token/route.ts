/**
 * POST /api/crm/integrations/sumsub/access-token
 *
 * Issues a short-lived Sumsub WebSDK access token for the user-facing
 * verification flow. Body:
 *   { userId: string; levelName: string; ttlInSecs?: number }
 *
 * Tokens are minted server-side because the Sumsub API requires HMAC
 * signing with the secret key — never exposed to the browser.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { generateAccessToken } from "@/lib/integrations";

const ROLES_READ = [
  "admin",
  "compliance_officer",
  "support_agent",
] as const;

interface Body {
  userId?: string;
  levelName?: string;
  ttlInSecs?: number;
}

export const POST = requireRole([...ROLES_READ], async (req: NextRequest) => {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }
  if (!body.userId || !body.levelName) {
    return NextResponse.json(
      { success: false, error: "Missing userId / levelName" },
      { status: 400 }
    );
  }
  try {
    const token = await generateAccessToken({
      userId: body.userId,
      levelName: body.levelName,
      ttlInSecs: body.ttlInSecs,
    });
    return NextResponse.json({ success: true, data: token });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
});
