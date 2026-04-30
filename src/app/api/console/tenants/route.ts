import { NextRequest, NextResponse } from "next/server";

// Demo 租户数据
const DEMO_TENANTS = [
  {
    id: 'demo-broker',
    name: 'Demo Broker',
    slug: 'demo-broker',
    subdomain: 'demo',
    brandName: 'Demo Broker',
    logoUrl: '/logos/demo-broker.png',
    primaryColor: '#2563eb',
    status: 'active',
    plan: 'professional',
    ownerId: 'tenant-owner-1',
    region: 'ap-southeast-1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    trialEndsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    maxUsers: 100,
    maxAccounts: 500,
    onboardingLocked: false,
    onboardingCompletedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'acme-fx',
    name: 'Acme FX',
    slug: 'acme-fx',
    subdomain: 'acme',
    brandName: 'Acme FX',
    primaryColor: '#dc2626',
    status: 'trial',
    plan: 'mvp',
    ownerId: 'tenant-owner-2',
    region: 'ap-southeast-1',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    maxUsers: 10,
    maxAccounts: 5,
    onboardingLocked: true,
  },
];

export async function GET(_req: NextRequest) {
  // 直接返回 Demo 租户数据
  return NextResponse.json({ tenants: DEMO_TENANTS });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name } = body;

  // 创建一个新的 Demo 租户
  const newTenant = {
    id: `tenant-${Date.now()}`,
    name: name || 'New Broker',
    slug: `tenant-${Date.now().toString(36)}`,
    subdomain: `tenant-${Date.now().toString(36)}`,
    brandName: name || 'New Broker',
    primaryColor: '#2563eb',
    status: 'trial',
    plan: 'mvp',
    ownerId: 'demo-owner',
    region: 'ap-southeast-1',
    createdAt: new Date().toISOString(),
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    maxUsers: 10,
    maxAccounts: 5,
    onboardingLocked: false,
    onboardingCompletedAt: null,
  };

  const res = NextResponse.json({ tenant: newTenant });
  res.cookies.set("onboarding_completed", "false", { httpOnly: false, path: "/", maxAge: 86400 });
  res.cookies.set("portal_tenant", newTenant.id, { httpOnly: false, path: "/", maxAge: 86400 });

  return res;
}
