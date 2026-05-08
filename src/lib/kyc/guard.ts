/**
 * KYC Step Guard — 服务端/客户端通用步骤守卫
 * 5 步流程: region → document → liveness → personal-info → agreement
 */

import type { RegionCode } from "./region-config";
import type { UserKYC } from "./types";

export type StepName = "region" | "document" | "liveness" | "personal-info" | "agreement";

/** 获取步骤列表 */
export function getEnabledSteps(_regionCode: RegionCode | null): StepName[] {
  return ["region", "document", "liveness", "personal-info", "agreement"];
}

/** 检查步骤是否完成 */
export function isStepComplete(step: StepName, kycData: Partial<UserKYC> | null): boolean {
  if (!kycData) return false;
  switch (step) {
    case "region":         return true;
    case "document":       return !!kycData.ocrData;
    case "liveness":       return !!kycData.livenessPassed;
    case "personal-info":  return !!kycData.personalInfo;
    case "agreement":      return !!(kycData.agreementsSigned && kycData.agreementsSigned.length > 0);
    default:               return false;
  }
}

/** 获取当前应该进入的步骤 */
export function getCurrentStepName(regionCode: RegionCode | null, kycData: Partial<UserKYC> | null): StepName {
  const steps = getEnabledSteps(regionCode);
  for (const step of steps) {
    if (!isStepComplete(step, kycData)) return step;
  }
  return steps[steps.length - 1]; // 所有步骤都完成了
}

export interface GuardResult {
  allowed: boolean;
  missingStep?: StepName;
  message: string;
}

/** 检查步骤权限 */
export function checkStepPermission(
  targetStep: StepName,
  regionCode: RegionCode | null,
  kycData: Partial<UserKYC> | null
): GuardResult {
  if (targetStep === "region") {
    return { allowed: true, message: "OK" };
  }

  if (!regionCode) {
    return { allowed: false, missingStep: "region", message: "请先选择地区" };
  }

  const steps = getEnabledSteps(regionCode);

  // 检查前序步骤是否完成
  for (const step of steps) {
    if (step === targetStep) break;
    if (!isStepComplete(step, kycData)) {
      return { allowed: false, missingStep: step, message: `请先完成"${step}"步骤` };
    }
  }

  return { allowed: true, message: "OK" };
}
