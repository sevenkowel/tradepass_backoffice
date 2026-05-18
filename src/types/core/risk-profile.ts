/**
 * RiskProfile — single source of truth for "how risky is this client?".
 *
 * Currently three modules each calculate a risk story of their own:
 *   - Clients module shows a flat number (`riskScore`) on a client.
 *   - CLM Case Detail computes a 6-axis breakdown inside `RiskAssessment`.
 *   - Risk Center runs trade-time alerting rules that don't feed back.
 *
 * This shared contract lets all three modules read the *same* shape and
 * reasoning, with weighted scoring + per-factor evidence so reviewers
 * understand why a number is what it is.
 *
 * Design principles:
 *   - **Explainable**: every factor carries a `reasoning` sentence and an
 *     `evidence` map so the UI can expand a row and show what's underneath.
 *   - **Stable IDs**: factor `key`s are an enum (`country`, `aml`, …) so
 *     UI can render specific icons / popovers without prop drilling.
 *   - **Versioned**: a `version` field lets the engine rerun on demand
 *     without losing history. Snapshots written to a Case stay frozen.
 */

import type { RiskLevel, AMLStatus } from "@/types/clm";

/** Stable factor identifiers — keep in sync with `lib/risk-engine/config.ts`. */
export type RiskFactorKey =
  | "country"      // 注册国家 / 居住国家的合规等级
  | "identity"     // 证件认证 + OCR + 人脸匹配
  | "device_ip"    // 设备指纹 + IP 归属 + VPN/proxy
  | "ib_source"    // 推荐 IB 的历史质量
  | "aml"          // 反洗钱命名单匹配
  | "blacklist";   // 内部黑名单匹配

/** A single factor contributing to the overall risk score. */
export interface RiskFactor {
  key: RiskFactorKey;
  label: string;
  /** 0–100, single-axis score. */
  score: number;
  /** Weight in the overall composite (0–1). Sum of weights ≤ 1. */
  weight: number;
  /** Discrete bucket for badge colour. */
  level: RiskLevel;
  /** Reviewer-facing one-liner explaining the score. */
  reasoning: string;
  /**
   * Structured evidence for the audit trail and for UI to render
   * factor-specific detail blocks (e.g. AML hit list, IP geo info).
   * Keys are factor-specific; consumers pattern-match on `key`.
   */
  evidence: Record<string, unknown>;
}

/** Overall risk profile of a client (or a case-time snapshot of it). */
export interface RiskProfile {
  /** UID of the client this profile describes. */
  clientId: string;
  /** Bumped each time the engine re-evaluates. */
  version: number;
  /** Σ(score × weight) of factors, rounded to integer. */
  overallScore: number;
  /** Bucket derived from `overallScore`. */
  riskLevel: RiskLevel;
  /** AML status (kept top-level so hit cases can short-circuit auto-approve). */
  amlStatus: AMLStatus;
  /** All factor evaluations in display order. */
  factors: RiskFactor[];
  /** ISO timestamp the engine last evaluated this profile. */
  calculatedAt: string;
  /** Optional ISO expiry — when set, consumers may flag the profile as stale. */
  expiresAt?: string;
  /** Engine version / actor that produced this evaluation. */
  evaluatedBy: string;
}
