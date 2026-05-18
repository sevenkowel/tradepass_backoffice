/**
 * External integrations barrel.
 *
 * Public surface for the three Phase 4 / M10 integrations:
 *   - IP geolocation     (`getIPGeo` async; `lookupIPGeo` sync mock)
 *   - Risk Engine        (`fetchRiskProfile` async; `lookupRiskProfile` sync mock)
 *   - Sumsub identity    (`createApplicant`, `getApplicantStatus`, `generateAccessToken`)
 *
 * Each integration's resolver consults `@/lib/integrations/config` to
 * decide between real and mock paths. Pages should not import from the
 * underlying mock modules directly — they go through this barrel so the
 * mock-vs-real switch is enforced at one boundary.
 */

export {
  USE_REAL_INTEGRATIONS,
  IPGEO_PROVIDER,
  ipGeoLive,
  riskEngineLive,
  sumsubLive,
} from "./config";

export type { IPGeoProvider } from "./config";

export { getIPGeo, lookupIPGeo } from "./ipgeo";
export { fetchRiskProfile, lookupRiskProfile } from "./risk-profile";
export {
  createApplicant,
  getApplicantStatus,
  generateAccessToken,
  type SumsubApplicantStatus,
  type SumsubReviewStatus,
  type SumsubReviewAnswer,
  type SumsubAccessToken,
} from "./sumsub";
