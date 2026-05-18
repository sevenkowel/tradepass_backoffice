/**
 * Tenant Lifecycle Management Service
 * Handles trial expiration, grace period, auto-downgrade, and data retention
 */

import { prisma } from "@/lib/prisma";

export type LifecycleStatus =
  | "active_trial"      // Within 14-day trial
  | "grace_period"      // Trial expired, within 7-day grace
  | "expired"           // Grace period ended, downgraded to free
  | "active_paid"       // Active paid subscription
  | "unknown";

export interface TenantLifecycleState {
  status: LifecycleStatus;
  plan: string;
  trialEndsAt: Date | null;
  gracePeriodEndsAt: Date | null;
  retentionExpiresAt: Date | null;
  daysLeftInTrial: number;
  daysLeftInGrace: number;
  daysLeftInRetention: number;
  isExpired: boolean;
  isGracePeriod: boolean;
  isRetentionWarning: boolean;
  canAccessFeatures: boolean; // true if trial OR grace_period OR active_paid
}

/**
 * Get the lifecycle state of a tenant
 */
export async function getTenantLifecycleState(tenantId: string): Promise<TenantLifecycleState> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      dataRetention: true,
    },
  });

  if (!tenant) {
    return createUnknownState();
  }

  const sub = tenant.subscriptions[0];
  const now = Date.now();
  const trialEndsAt = tenant.trialEndsAt || sub?.trialEndsAt || null;
  const gracePeriodEndsAt = tenant.gracePeriodEndsAt || sub?.gracePeriodEndsAt || null;
  const retentionExpiresAt = tenant.retentionExpiresAt || null;

  const daysLeftInTrial = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now) / (1000 * 60 * 60 * 24))) : 0;
  const daysLeftInGrace = gracePeriodEndsAt && daysLeftInTrial <= 0
    ? Math.max(0, Math.ceil((gracePeriodEndsAt.getTime() - now) / (1000 * 60 * 60 * 24)))
    : 0;
  const daysLeftInRetention = retentionExpiresAt
    ? Math.max(0, Math.ceil((retentionExpiresAt.getTime() - now) / (1000 * 60 * 60 * 24)))
    : 0;

  const isExpired = daysLeftInTrial <= 0 && daysLeftInGrace <= 0;
  const isGracePeriod = daysLeftInTrial <= 0 && daysLeftInGrace > 0;
  const isRetentionWarning = daysLeftInRetention > 0 && daysLeftInRetention <= 14;

  let status: LifecycleStatus;
  if (sub?.status === "active" && sub.planName !== "free" && sub.planName !== "mvp") {
    status = "active_paid";
  } else if (isExpired) {
    status = "expired";
  } else if (isGracePeriod) {
    status = "grace_period";
  } else {
    status = "active_trial";
  }

  const canAccessFeatures = status === "active_trial" || status === "grace_period" || status === "active_paid";

  return {
    status,
    plan: tenant.plan,
    trialEndsAt,
    gracePeriodEndsAt,
    retentionExpiresAt,
    daysLeftInTrial,
    daysLeftInGrace,
    daysLeftInRetention,
    isExpired,
    isGracePeriod,
    isRetentionWarning,
    canAccessFeatures,
  };
}

function createUnknownState(): TenantLifecycleState {
  return {
    status: "unknown",
    plan: "unknown",
    trialEndsAt: null,
    gracePeriodEndsAt: null,
    retentionExpiresAt: null,
    daysLeftInTrial: 0,
    daysLeftInGrace: 0,
    daysLeftInRetention: 0,
    isExpired: true,
    isGracePeriod: false,
    isRetentionWarning: false,
    canAccessFeatures: false,
  };
}

/**
 * Check if a tenant has exceeded its resource limits (read-only mode)
 * Returns true if the tenant should be in read-only mode
 */
export async function checkTenantReadOnly(tenantId: string): Promise<{
  readOnly: boolean;
  reason?: string;
  exceededLimits?: { type: string; current: number; max: number }[];
}> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      members: true,
      _count: { select: { members: true } },
    },
  });

  if (!tenant) return { readOnly: false };

  // Only free/mvp expired tenants get read-only
  if (tenant.plan !== "free" && tenant.plan !== "mvp") return { readOnly: false };

  const currentUsers = (tenant._count?.members ?? 0) + 1; // +1 owner
  const exceeded: { type: string; current: number; max: number }[] = [];

  if (tenant.maxUsers > 0 && currentUsers > tenant.maxUsers) {
    exceeded.push({ type: "users", current: currentUsers, max: tenant.maxUsers });
  }

  // For MT accounts, we'd need to count them separately
  // Simplified: just check user limit for now

  if (exceeded.length > 0) {
    return {
      readOnly: true,
      reason: `超出套餐限额：${exceeded.map((e) => `${e.type} (${e.current}/${e.max})`).join(", ")}`,
      exceededLimits: exceeded,
    };
  }

  return { readOnly: false };
}

/**
 * Auto-downgrade a tenant when grace period ends
 */
export async function autoDowngradeTenant(tenantId: string): Promise<void> {
  const now = new Date();
  const retentionExpiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days retention

  await prisma.$transaction(async (tx) => {
    // Update tenant
    await tx.tenant.update({
      where: { id: tenantId },
      data: {
        plan: "free",
        maxUsers: 10,
        maxAccounts: 5,
        status: "expired",
        downgradeReason: "trial_expired",
        retentionExpiresAt,
      },
    });

    // Update subscription
    const sub = await tx.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    if (sub) {
      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: "expired",
          planName: "free",
          seatLimit: 10,
          features: JSON.stringify({ plan: "free", modules: ["portal", "kyc_basic", "funds_usdt"] }),
        },
      });
    }

    // Create/update data retention record
    await tx.tenantDataRetention.upsert({
      where: { tenantId },
      update: {
        status: "warning",
        retentionEndsAt: retentionExpiresAt,
      },
      create: {
        tenantId,
        status: "warning",
        retentionDays: 90,
        retentionEndsAt: retentionExpiresAt,
      },
    });

    // Create expired notification
    await tx.tenantNotification.create({
      data: {
        tenantId,
        type: "trial_expired",
        title: "试用已结束",
        content: "您的 14 天试用已结束，套餐已降级为 Free。请在 90 天内升级以保留所有数据。",
        channel: "both",
        metadata: JSON.stringify({ plan: "free", upgradeUrl: "/console/billing" }),
      },
    });
  });
}

/**
 * Send trial reminder notifications
 * Called by cron job or API
 */
export async function sendTrialReminders(): Promise<{
  sent7d: number;
  sent3d: number;
  sent1d: number;
  expired: number;
  graceEnding: number;
}> {
  const now = new Date();
  const results = { sent7d: 0, sent3d: 0, sent1d: 0, expired: 0, graceEnding: 0 };

  const tenants = await prisma.tenant.findMany({
    where: {
      status: "trial",
      trialEndsAt: { not: null },
    },
    include: { subscriptions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  for (const tenant of tenants) {
    const trialEndsAt = tenant.trialEndsAt!;
    const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const graceEndsAt = tenant.gracePeriodEndsAt;
    const graceDaysLeft = graceEndsAt
      ? Math.ceil((graceEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Already expired - check if grace period ending
    if (daysLeft <= 0 && graceDaysLeft > 0 && graceDaysLeft <= 2) {
      const existing = await prisma.tenantNotification.findFirst({
        where: { tenantId: tenant.id, type: "grace_period_ending" },
      });
      if (!existing) {
        await prisma.tenantNotification.create({
          data: {
            tenantId: tenant.id,
            type: "grace_period_ending",
            title: "宽限期即将结束",
            content: `您的宽限期还剩 ${graceDaysLeft} 天，结束后将降级为 Free 套餐。请尽快升级以保留全部功能。`,
            channel: "both",
            metadata: JSON.stringify({ daysLeft: graceDaysLeft, upgradeUrl: "/console/billing" }),
          },
        });
        results.graceEnding++;
      }
    }

    // 7 days reminder
    if (daysLeft === 7) {
      const existing = await prisma.tenantNotification.findFirst({
        where: { tenantId: tenant.id, type: "trial_reminder_7d" },
      });
      if (!existing) {
        await prisma.tenantNotification.create({
          data: {
            tenantId: tenant.id,
            type: "trial_reminder_7d",
            title: "试用即将到期",
            content: "您的 TradePass Business 试用还剩 7 天。升级后可保留所有功能和数据。",
            channel: "both",
            metadata: JSON.stringify({ daysLeft: 7, upgradeUrl: "/console/billing" }),
          },
        });
        results.sent7d++;
      }
    }

    // 3 days reminder
    if (daysLeft === 3) {
      const existing = await prisma.tenantNotification.findFirst({
        where: { tenantId: tenant.id, type: "trial_reminder_3d" },
      });
      if (!existing) {
        await prisma.tenantNotification.create({
          data: {
            tenantId: tenant.id,
            type: "trial_reminder_3d",
            title: "试用即将到期（3天）",
            content: "您的试用将在 3 天后到期。到期后您有 7 天宽限期，之后将降级为 Free 套餐。",
            channel: "both",
            metadata: JSON.stringify({ daysLeft: 3, upgradeUrl: "/console/billing" }),
          },
        });
        results.sent3d++;
      }
    }

    // 1 day reminder
    if (daysLeft === 1) {
      const existing = await prisma.tenantNotification.findFirst({
        where: { tenantId: tenant.id, type: "trial_reminder_1d" },
      });
      if (!existing) {
        await prisma.tenantNotification.create({
          data: {
            tenantId: tenant.id,
            type: "trial_reminder_1d",
            title: "试用明天到期",
            content: "您的试用将在明天到期。请立即升级以保留完整功能，避免业务中断。",
            channel: "both",
            metadata: JSON.stringify({ daysLeft: 1, upgradeUrl: "/console/billing" }),
          },
        });
        results.sent1d++;
      }
    }

    // Expired - auto downgrade
    if (daysLeft <= 0 && graceDaysLeft <= 0 && tenant.plan !== "free") {
      await autoDowngradeTenant(tenant.id);
      results.expired++;
    }
  }

  return results;
}

/**
 * Extend trial for a tenant (admin/backoffice use)
 */
export async function extendTrial(tenantId: string, days: number): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { subscriptions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!tenant || !tenant.trialEndsAt) {
    throw new Error("Tenant not found or not in trial");
  }

  const newTrialEndsAt = new Date(tenant.trialEndsAt.getTime() + days * 24 * 60 * 60 * 1000);
  const newGracePeriodEndsAt = new Date(newTrialEndsAt.getTime() + 7 * 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: tenantId },
      data: {
        trialEndsAt: newTrialEndsAt,
        gracePeriodEndsAt: newGracePeriodEndsAt,
        status: "trial",
        downgradeReason: null,
      },
    });

    const sub = tenant.subscriptions[0];
    if (sub) {
      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: "trialing",
          trialEndsAt: newTrialEndsAt,
          gracePeriodEndsAt: newGracePeriodEndsAt,
        },
      });
    }

    await tx.tenantNotification.create({
      data: {
        tenantId,
        type: "trial_extended",
        title: "试用已延长",
        content: `您的试用已延长 ${days} 天，新的到期时间为 ${newTrialEndsAt.toLocaleDateString("zh-CN")}。`,
        channel: "in_app",
      },
    });
  });
}
