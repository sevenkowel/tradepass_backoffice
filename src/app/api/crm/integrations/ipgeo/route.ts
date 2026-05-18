/**
 * GET /api/crm/integrations/ipgeo?ip=…
 *
 * Server-side proxy to the IP geo integration. Pages that want live data
 * (rather than the legacy sync mock) call this endpoint; the resolver
 * picks the real provider when configured and falls back to the mock.
 *
 * Keeps the third-party API key out of the client bundle.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { getIPGeo } from "@/lib/integrations";

const ROLES_READ = [
  "admin",
  "compliance_officer",
  "support_agent",
  "risk_manager",
  "viewer",
] as const;

export const GET = requireRole([...ROLES_READ], async (req: NextRequest) => {
  const ip = req.nextUrl.searchParams.get("ip");
  if (!ip) {
    return NextResponse.json({ success: false, error: "Missing ip" }, { status: 400 });
  }
  try {
    const data = await getIPGeo(ip);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
});
