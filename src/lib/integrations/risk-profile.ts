/**
 * Risk Engine integration.
 *
 * The Phase 1 design parked the engine behind `lookupRiskProfile()` —
 * synchronous, mock-only. This module is the async wrapper that the real
 * backend Risk Engine plugs into without forcing pages to refactor their
 * rendering pipeline (they can keep the sync mock until they're ready).
 *
 * Wire format:
 *   POST `${RISK_ENGINE_BASE_URL}/profiles/lookup`
 *   body: { clientId, baseScore, amlStatus }
 *   →  RiskProfile (matches `@/types/core` exactly)
 */

import type { RiskProfile } from "@/types/core";
import type { AMLStatus } from "@/types/clm";
import { lookupRiskProfile as mockLookup } from "@/lib/risk-engine/mock-risk-profiles";
import {
  RISK_ENGINE_API_KEY,
  RISK_ENGINE_BASE_URL,
  riskEngineLive,
} from "./config";

interface FetchInput {
  clientId: string;
  baseScore: number;
  amlStatus: AMLStatus;
}

/** Async resolver — real provider or mock fallback. */
export async function fetchRiskProfile(input: FetchInput): Promise<RiskProfile> {
  if (!riskEngineLive()) {
    return mockLookup(input.clientId, input.baseScore, input.amlStatus);
  }
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (RISK_ENGINE_API_KEY) headers["Authorization"] = `Bearer ${RISK_ENGINE_API_KEY}`;
    const resp = await fetch(`${RISK_ENGINE_BASE_URL}/profiles/lookup`, {
      method: "POST",
      headers,
      body: JSON.stringify(input),
      cache: "no-store",
    });
    if (!resp.ok) throw new Error(`risk-engine ${resp.status}`);
    const data = (await resp.json()) as RiskProfile;
    return data;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[risk-engine] fetch failed, falling back to mock:", err);
    }
    return mockLookup(input.clientId, input.baseScore, input.amlStatus);
  }
}

/** Sync helper — returns the mock profile. */
export { lookupRiskProfile } from "@/lib/risk-engine/mock-risk-profiles";
