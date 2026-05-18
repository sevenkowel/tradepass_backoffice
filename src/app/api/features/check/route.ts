import { NextRequest, NextResponse } from "next/server";
import { checkTenantFeature } from "@/lib/feature-flags/service";
import { getCurrentTenant } from "@/lib/api/tenant";

export async function GET(req: NextRequest) {
  const tenant = await getCurrentTenant(req);
  if (!tenant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Feature key required" }, { status: 400 });
  }

  const result = await checkTenantFeature(tenant.id, key);
  return NextResponse.json(result);
}
