"use client";

/**
 * KYC Step Guard — 客户端 Hook
 * 确保用户不能跳过前置步骤
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useKYCStore } from "./store";
import { checkStepPermission, type StepName } from "./guard";

const STEP_ROUTES: Record<StepName, string> = {
  region: "/portal/kyc",
  document: "/portal/kyc/document",
  liveness: "/portal/kyc/liveness",
  "address-proof": "/portal/kyc/address-proof",
  experience: "/portal/kyc/experience",
  agreement: "/portal/kyc/agreements",
};

interface GuardResult {
  allowed: boolean;
  redirectTo: string | null;
  checking: boolean;
}

/** 检查用户是否可以访问指定步骤 */
export function useKYCGuard(targetStep: StepName): GuardResult {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  const { kycData, regionCode, hasHydrated } = useKYCStore();

  useEffect(() => {
    // 等待 Zustand persist 从 localStorage 恢复完成
    if (!hasHydrated) return;

    const result = checkStepPermission(targetStep, regionCode, kycData);
    if (!result.allowed) {
      setRedirectTo(STEP_ROUTES[result.missingStep!]);
      setAllowed(false);
    } else {
      setAllowed(true);
    }
    setChecking(false);
  }, [targetStep, kycData, regionCode, hasHydrated]);

  // 如果检测到不允许，执行重定向
  useEffect(() => {
    if (!checking && redirectTo) {
      router.replace(redirectTo);
    }
  }, [checking, redirectTo, router]);

  return { allowed, redirectTo, checking };
}
