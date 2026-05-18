import { NextRequest, NextResponse } from "next/server";

// Demo 品牌数据
const DEMO_BRANDS: Record<string, any> = {
  'demo-broker': {
    brandName: 'Demo Broker',
    slogan: 'Trade with Confidence',
    logoUrl: null,
    faviconUrl: null,
    primaryColor: '#2563eb',
    subdomain: 'demo',
  },
  'acme-fx': {
    brandName: 'Acme FX',
    slogan: 'Global Forex Trading',
    logoUrl: null,
    faviconUrl: null,
    primaryColor: '#dc2626',
    subdomain: 'acme',
  },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");

  if (tenantId && DEMO_BRANDS[tenantId]) {
    return NextResponse.json({ success: true, data: DEMO_BRANDS[tenantId] });
  }

  // 默认品牌
  return NextResponse.json({
    success: true,
    data: {
      brandName: "TradePass",
      slogan: "The Operating System for Modern Brokers",
      logoUrl: null,
      faviconUrl: null,
      primaryColor: "#1a73e8",
      subdomain: null,
    },
  });
}
