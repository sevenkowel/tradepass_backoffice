/**
 * GET /api/crm/integrations/sumsub/applicant-status?applicantId=…
 *
 * Sumsub-side verification status. The signing happens in
 * `@/lib/integrations/sumsub` (uses node:crypto), so this must be a
 * server route — never inline in a client component.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { getApplicantStatus } from "@/lib/integrations";

const ROLES_READ = [
  "admin",
  "compliance_officer",
  "risk_manager",
  "support_agent",
] as const;

export const GET = requireRole([...ROLES_READ], async (req: NextRequest) => {
  const applicantId = req.nextUrl.searchParams.get("applicantId");
  if (!applicantId) {
    return NextResponse.json(
      { success: false, error: "Missing applicantId" },
      { status: 400 }
    );
  }
  try {
    const data = await getApplicantStatus(applicantId);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
});
