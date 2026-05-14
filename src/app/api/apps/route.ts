import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/api/tenant";
import {
  PRODUCT_CODES,
  PRODUCT_CONFIG,
  BASE_LAYER_CODE,
  type ProductCode,
} from "@/lib/products";

export async function GET(req: NextRequest) {
  const tenant = await getCurrentTenant(req);
  if (!tenant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Get tenant's active subscriptions (for extension products)
  const subscriptions = await prisma.subscription.findMany({
    where: {
      tenantId: tenant.id,
      status: { in: ["active", "trialing"] },
    },
    select: { productId: true, status: true },
  });
  const subscribedProductIds = new Set(subscriptions.map((s: { productId: string; status: string }) => s.productId));

  // 2. Get product details for subscribed products
  const subscribedProducts = await prisma.product.findMany({
    where: { id: { in: Array.from(subscribedProductIds) } },
  });
  const subscribedCodes = new Set(
    subscribedProducts.map((p) => p.code as ProductCode)
  );

  // 3. Business base layer is always considered "subscribed" for the tenant
  subscribedCodes.add(BASE_LAYER_CODE);

  // 4. Build module groups from PRODUCT_CONFIG
  const groups = PRODUCT_CODES.map((code) => {
    const config = PRODUCT_CONFIG[code];
    const isSubscribed = subscribedCodes.has(code);

    return {
      productCode: code,
      productName: config.name,
      shortName: config.shortName,
      isBaseLayer: config.isBaseLayer,
      isSubscribed,
      basePrice: config.basePrice,
      currency: config.currency,
      modules: config.modules.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        icon: m.icon,
        route: m.route,
        isAvailable: isSubscribed, // available if the parent product is subscribed
        isAddOn: m.isAddOn ?? false,
        addOnPrice: m.addOnPrice,
      })),
    };
  });

  // 5. Stats
  const installedCount = groups.reduce(
    (sum, g) => sum + g.modules.filter((m) => m.isAvailable).length,
    0
  );
  const totalModuleCount = groups.reduce(
    (sum, g) => sum + g.modules.length,
    0
  );

  return NextResponse.json({
    groups,
    stats: {
      installedModules: installedCount,
      totalModules: totalModuleCount,
      subscribedProducts: subscribedCodes.size,
      totalProducts: PRODUCT_CODES.length,
    },
  });
}
