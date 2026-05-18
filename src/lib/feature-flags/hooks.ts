"use client";

import { useState, useEffect, useCallback } from "react";
import type { Plan } from "./defaults";

export interface FeatureCheckResult {
  available: boolean;
  requiresUpgrade: boolean;
  upgradeTarget?: Plan;
  reason?: string;
  loading: boolean;
}

/**
 * 检查单个功能是否可用
 */
export function useFeatureFlag(featureKey: string): FeatureCheckResult {
  const [result, setResult] = useState<FeatureCheckResult>({
    available: false,
    requiresUpgrade: false,
    loading: true,
  });

  useEffect(() => {
    fetch(`/api/features/check?key=${encodeURIComponent(featureKey)}`)
      .then((r) => r.json())
      .then((data) => {
        setResult({
          available: data.available ?? false,
          requiresUpgrade: data.requiresUpgrade ?? false,
          upgradeTarget: data.upgradeTarget,
          reason: data.reason,
          loading: false,
        });
      })
      .catch(() => {
        setResult({
          available: false,
          requiresUpgrade: false,
          loading: false,
          reason: "检查失败",
        });
      });
  }, [featureKey]);

  return result;
}

/**
 * 批量检查多个功能
 */
export function useFeatureFlags(featureKeys: string[]): Record<string, FeatureCheckResult> {
  const [results, setResults] = useState<Record<string, FeatureCheckResult>>({});

  useEffect(() => {
    if (featureKeys.length === 0) return;

    fetch("/api/features/check-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys: featureKeys }),
    })
      .then((r) => r.json())
      .then((data) => {
        const mapped: Record<string, FeatureCheckResult> = {};
        for (const key of featureKeys) {
          const item = data.results?.[key];
          mapped[key] = {
            available: item?.available ?? false,
            requiresUpgrade: item?.requiresUpgrade ?? false,
            upgradeTarget: item?.upgradeTarget,
            reason: item?.reason,
            loading: false,
          };
        }
        setResults(mapped);
      })
      .catch(() => {
        const mapped: Record<string, FeatureCheckResult> = {};
        for (const key of featureKeys) {
          mapped[key] = {
            available: false,
            requiresUpgrade: false,
            loading: false,
            reason: "检查失败",
          };
        }
        setResults(mapped);
      });
  }, [featureKeys.join(",")]);

  return results;
}
