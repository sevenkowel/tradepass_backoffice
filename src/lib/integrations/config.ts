/**
 * Integration configuration — single source for the env knobs that decide
 * whether each external dependency runs against a real provider or a mock.
 *
 * Three classes of integration:
 *   - **IP geolocation** (MaxMind / IPQualityScore / ipinfo)
 *   - **Risk Engine**     (internal microservice / FICO-style score API)
 *   - **Sumsub**          (third-party identity verification)
 *
 * Each integration's resolver checks two things in order:
 *   1. Is the master flag `USE_REAL_INTEGRATIONS === false`? → mock.
 *   2. Does the per-integration credential exist? → real, else mock.
 *
 * Pages and services never read these env vars directly — they call into
 * `@/lib/integrations` and trust the resolver's decision.
 */

/** Master switch — turns off every real integration regardless of creds.
 *  Defaults to mock (true) for safety so a misconfigured deploy doesn't
 *  hammer paid third-party APIs. */
export const USE_REAL_INTEGRATIONS: boolean =
  process.env.NEXT_PUBLIC_USE_REAL_INTEGRATIONS === "true";

/* ------------------------------------------------------------------------- */
/* IP geolocation                                                            */
/* ------------------------------------------------------------------------- */

export type IPGeoProvider = "ipinfo" | "ipqs" | "ipapi" | "mock";

export const IPGEO_PROVIDER: IPGeoProvider =
  (process.env.NEXT_PUBLIC_IPGEO_PROVIDER as IPGeoProvider | undefined) ?? "mock";

/** Server-side only — keep out of the client bundle. */
export const IPGEO_API_KEY: string | undefined = process.env.IPGEO_API_KEY;

/** True when the IP geo path should hit the real provider. */
export function ipGeoLive(): boolean {
  return USE_REAL_INTEGRATIONS && IPGEO_PROVIDER !== "mock" && Boolean(IPGEO_API_KEY);
}

/* ------------------------------------------------------------------------- */
/* Risk Engine                                                               */
/* ------------------------------------------------------------------------- */

export const RISK_ENGINE_BASE_URL: string =
  process.env.NEXT_PUBLIC_RISK_ENGINE_BASE ?? "/api/risk-engine";

/** Optional API key — internal microservice may use mTLS instead. */
export const RISK_ENGINE_API_KEY: string | undefined =
  process.env.RISK_ENGINE_API_KEY;

export function riskEngineLive(): boolean {
  return USE_REAL_INTEGRATIONS && Boolean(RISK_ENGINE_BASE_URL);
}

/* ------------------------------------------------------------------------- */
/* Sumsub                                                                    */
/* ------------------------------------------------------------------------- */

export const SUMSUB_BASE_URL: string =
  process.env.SUMSUB_BASE_URL ?? "https://api.sumsub.com";

export const SUMSUB_APP_TOKEN: string | undefined = process.env.SUMSUB_APP_TOKEN;
export const SUMSUB_SECRET_KEY: string | undefined = process.env.SUMSUB_SECRET_KEY;

export function sumsubLive(): boolean {
  return (
    USE_REAL_INTEGRATIONS &&
    Boolean(SUMSUB_APP_TOKEN) &&
    Boolean(SUMSUB_SECRET_KEY)
  );
}
