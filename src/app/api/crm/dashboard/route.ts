import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const [
      usersTotal,
      usersActive,
      tenantsTotal,
      tenantsTrial,
      licensesTotal,
      licensesActive,
      invoicesTotal,
      invoicesPaid,
      revenueAgg,
      recentUsers,
      recentTenants,
      pendingKycCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "active" } }),
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: "trial" } }),
      prisma.license.count(),
      prisma.license.count({ where: { status: "active" } }),
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: "paid" } }),
      prisma.invoice.aggregate({
        where: { status: "paid" },
        _sum: { amount: true },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, email: true, name: true, createdAt: true },
      }),
      prisma.tenant.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          createdAt: true,
          owner: { select: { email: true } },
        },
      }),
      // KYC pending count - fallback to 0 if table doesn't exist
      Promise.resolve(0),
    ]);

    return NextResponse.json({
      kpi: {
        users: { total: usersTotal, active: usersActive },
        tenants: { total: tenantsTotal, trial: tenantsTrial },
        licenses: { total: licensesTotal, active: licensesActive },
        invoices: {
          total: invoicesTotal,
          paid: invoicesPaid,
          revenue: revenueAgg._sum.amount || 0,
        },
        pendingKyc: pendingKycCount,
      },
      recentUsers,
      recentTenants,
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
