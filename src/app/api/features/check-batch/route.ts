import { NextRequest, NextResponse } from "next/server";
import { checkTenantFeature } from "@/lib/feature-flags/service";
import { getCurrentTenant } from "@/lib/api/tenant";

export async function POST(req: NextRequest) {
  const tenant = await getCurrentTenant(req);
  if (!tenant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const keys: string[] = body.keys || [];

  if (keys.length === 0) {
    return NextResponse.json({ error: "Feature keys required" }, { status: 400 });
  }

  const results: Record<string, any> = {};
  for (const key of keys) {
    results[key] = await checkTenantFeature(tenant.id, key);
  }

  return NextResponse.json({ results });
}
