/**
 * POST /api/crm/integrations/risk-profile
 *
 * Server-side proxy to the Risk Engine. Body:
 *   { clientId: string; baseScore: number; amlStatus: AMLStatus }
 * Returns a `RiskProfile`.
 *
 * Pages still call `lookupRiskProfile()` synchronously today; this
 * endpoint exists so the migration to a live engine doesn't require
 * shipping API keys to the browser.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { fetchRiskProfile } from "@/lib/integrations";
import type { AMLStatus } from "@/types/clm";

const ROLES_READ = [
  "admin",
  "compliance_officer",
  "risk_manager",
  "support_agent",
] as const;

interface Body {
  clientId?: string;
  baseScore?: number;
  amlStatus?: AMLStatus;
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
  if (!body.clientId || typeof body.baseScore !== "number" || !body.amlStatus) {
    return NextResponse.json(
      { success: false, error: "Missing clientId / baseScore / amlStatus" },
      { status: 400 }
    );
  }
  try {
    const profile = await fetchRiskProfile({
      clientId: body.clientId,
      baseScore: body.baseScore,
      amlStatus: body.amlStatus,
    });
    return NextResponse.json({ success: true, data: profile });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
});
