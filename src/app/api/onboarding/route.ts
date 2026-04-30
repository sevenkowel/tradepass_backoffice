import { NextRequest, NextResponse } from "next/server";

// 内存存储 onboarding 数据（无需 LocalStorage，服务端 session 级别）
const store = new Map<string, any>();

export async function GET(req: NextRequest) {
  const tenantId = req.cookies.get("portal_tenant")?.value;
  if (!tenantId) {
    return NextResponse.json({ error: "No tenant found" }, { status: 401 });
  }

  let onboarding = store.get(tenantId);
  if (!onboarding) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    onboarding = {
      id: `onboarding-${tenantId}`,
      tenantId,
      status: "in_progress",
      step: 1,
      data: "{}",
      deadline: deadline.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.set(tenantId, onboarding);
  }

  return NextResponse.json({ onboarding });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const tenantId = req.cookies.get("portal_tenant")?.value;

  if (!token || !tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { step, data } = body;

  if (!step || step < 1 || step > 6) {
    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  }

  let onboarding = store.get(tenantId);
  if (!onboarding) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    onboarding = {
      id: `onboarding-${tenantId}`,
      tenantId,
      status: "in_progress",
      step: 1,
      data: "{}",
      deadline: deadline.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  onboarding.step = step;
  onboarding.data = JSON.stringify(data);
  onboarding.updatedAt = new Date().toISOString();
  store.set(tenantId, onboarding);

  return NextResponse.json({ onboarding });
}
