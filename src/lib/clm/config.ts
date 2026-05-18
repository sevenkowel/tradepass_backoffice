/**
 * CLM service configuration.
 *
 * Controls whether the CLM module talks to in-memory mock services
 * (default during development) or to a real backend over HTTP.
 *
 * Switch behavior with the `NEXT_PUBLIC_CLM_USE_MOCK` env var:
 *   - unset / `"true"` → mock mode  (default)
 *   - `"false"`        → real-API mode
 *
 * The decision is made once at module import time. To switch modes,
 * change the env var and restart the dev server.
 */

const flag = process.env.NEXT_PUBLIC_CLM_USE_MOCK;

/** True when CLM services should use in-memory mocks. */
export const USE_MOCK_API: boolean = flag !== "false";

/**
 * Base URL for the real CLM HTTP API. Only consulted when
 * `USE_MOCK_API` is false.
 */
export const CLM_API_BASE: string =
  process.env.NEXT_PUBLIC_CLM_API_BASE ?? "/api/clm";

/** Convenience helper for the API service implementations. */
export function clmEndpoint(path: string): string {
  const base = CLM_API_BASE.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}
