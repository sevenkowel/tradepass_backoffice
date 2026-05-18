import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe, isStripeConfigured } from "@/lib/stripe/config";

/**
 * Health Check Endpoint
 * Returns service status for database, Stripe, and overall system health.
 * Used by Docker health checks, load balancers, and monitoring systems.
 */
export async function GET(_req: NextRequest) {
  const checks: Record<string, { status: "ok" | "error"; latency: number; message?: string }> = {};
  let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";

  // 1. Database check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok", latency: Date.now() - dbStart };
  } catch (err: any) {
    checks.database = { status: "error", latency: Date.now() - dbStart, message: err.message };
    overallStatus = "unhealthy";
  }

  // 2. Stripe check (optional — app works without Stripe in dev)
  const stripeStart = Date.now();
  if (isStripeConfigured && stripe) {
    try {
      // Lightweight check: list customers with limit 1
      await stripe.customers.list({ limit: 1 });
      checks.stripe = { status: "ok", latency: Date.now() - stripeStart };
    } catch (err: any) {
      checks.stripe = { status: "error", latency: Date.now() - stripeStart, message: err.message };
      overallStatus = overallStatus === "healthy" ? "degraded" : overallStatus;
    }
  } else {
    checks.stripe = { status: "ok", latency: 0, message: "Not configured (dev mode)" };
  }

  // 3. Memory check
  const memUsage = process.memoryUsage();
  const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  if (memMB > 1024) {
    checks.memory = { status: "error", latency: 0, message: `High memory usage: ${memMB}MB` };
    overallStatus = overallStatus === "healthy" ? "degraded" : overallStatus;
  } else {
    checks.memory = { status: "ok", latency: 0, message: `${memMB}MB` };
  }

  const statusCode = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      checks,
    },
    { status: statusCode }
  );
}
