/**
 * IPGeoInfo — IP address forensics shared by Clients / CLM / Risk.
 *
 * Used by:
 *   - CLM Case Detail customer card → click IP → popover with geo + flags.
 *   - Clients Device Tab → list of registration / login IPs.
 *   - Risk Center Device & Security → cross-client IP search.
 *
 * In production this is a thin cache over a 3rd-party service
 * (MaxMind / IPQualityScore / IPInfo). In mock mode the data lives in
 * `lib/clm/mock/mock-ip-geo.ts`.
 */

export interface IPGeoInfo {
  ip: string;
  /** ISO 3166-1 alpha-2, e.g. "AE" */
  country: string;
  /** Country name in English for tooltips */
  countryName: string;
  city: string;
  /** Internet Service Provider / ASN organization */
  asn: string;

  // ── threat intel flags ───────────────────────────────────────
  isVpn: boolean;
  isProxy: boolean;
  isTor: boolean;
  isHosting: boolean;       // datacenter / cloud range
  isMobile: boolean;        // mobile carrier IP

  /** Composite threat score 0–100, higher = riskier. */
  threatScore: number;

  // ── platform-internal usage ─────────────────────────────────
  /** How many distinct accounts have ever registered from this IP. */
  registrationsFromThisIP: number;
  /** UIDs of accounts seen registering or logging in from this IP. */
  relatedUids: string[];

  /** ISO timestamp this record was fetched/refreshed. */
  observedAt: string;
}
