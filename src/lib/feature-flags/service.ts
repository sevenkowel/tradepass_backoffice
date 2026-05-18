/**
 * Feature Flag 服务端服务
 * 结合系统默认值 + Tenant 数据库覆盖
 */

import { prisma } from "@/lib/prisma";
import {
  DEFAULT_FEATURE_FLAGS,
  getFeaturesForPlan,
  isFeatureAvailable,
  type Plan,
} from "./defaults";

export interface TenantFeatureState {
  key: string;
  enabled: boolean;
  requiresUpgrade: boolean;
  upgradeTarget?: Plan;
  reason?: string;
}

/**
 * 获取租户的所有功能状态
 */
export async function getTenantFeatures(
  tenantId: string
): Promise<TenantFeatureState[]> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });

  if (!tenant) return [];

  // 获取系统默认值（基于套餐）
  const defaults = getFeaturesForPlan(tenant.plan as Plan);

  // 获取 Tenant 数据库覆盖值
  const overrides = await prisma.tenantFeature.findMany({
    where: { tenantId },
  });

  // 合并默认值 + 覆盖值
  return defaults.map((def) => {
    const override = overrides.find((o) => o.featureKey === def.key);
    if (override) {
      return {
        key: def.key,
        enabled: override.enabled,
        requiresUpgrade: override.requiresUpgrade,
        upgradeTarget: (override.upgradeTarget as Plan) || def.upgradeTarget,
        reason: override.reason || undefined,
      };
    }
    return {
      key: def.key,
      enabled: def.enabled,
      requiresUpgrade: def.requiresUpgrade,
      upgradeTarget: def.upgradeTarget,
      reason: def.requiresUpgrade
        ? `需要升级至 ${def.upgradeTarget} 套餐`
        : undefined,
    };
  });
}

/**
 * 检查单个功能是否对租户可用
 */
export async function checkTenantFeature(
  tenantId: string,
  featureKey: string
): Promise<{ available: boolean; requiresUpgrade: boolean; upgradeTarget?: Plan; reason?: string }> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });

  if (!tenant) {
    return { available: false, requiresUpgrade: false, reason: "Tenant not found" };
  }

  // 检查 Tenant 数据库覆盖
  const override = await prisma.tenantFeature.findUnique({
    where: { tenantId_featureKey: { tenantId, featureKey } },
  });

  if (override) {
    return {
      available: override.enabled,
      requiresUpgrade: override.requiresUpgrade,
      upgradeTarget: (override.upgradeTarget as Plan) || undefined,
      reason: override.reason || undefined,
    };
  }

  // 使用系统默认值
  const available = isFeatureAvailable(featureKey, tenant.plan as Plan);
  const def = DEFAULT_FEATURE_FLAGS.find((f) => f.key === featureKey);

  return {
    available,
    requiresUpgrade: !available && !!def?.requiresUpgrade,
    upgradeTarget: def?.upgradeTarget,
    reason: !available ? `当前 ${tenant.plan} 套餐不包含此功能` : undefined,
  };
}

/**
 * 批量设置租户功能覆盖
 */
export async function setTenantFeatures(
  tenantId: string,
  features: { featureKey: string; enabled: boolean }[]
): Promise<void> {
  for (const f of features) {
    await prisma.tenantFeature.upsert({
      where: { tenantId_featureKey: { tenantId, featureKey: f.featureKey } },
      update: { enabled: f.enabled },
      create: {
        tenantId,
        featureKey: f.featureKey,
        enabled: f.enabled,
      },
    });
  }
}
