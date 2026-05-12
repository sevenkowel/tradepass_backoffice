/**
 * IP geolocation integration.
 *
 * Pages should import `getIPGeo(ip)` from `@/lib/integrations` rather than
 * the legacy `lookupIPGeo` mock helper. The async version transparently
 * routes to a real provider when configured and falls back to the mock
 * fixture set otherwise.
 *
 * Provider matrix:
 *   - `ipinfo` → https://ipinfo.io/{ip}/json?token=…
 *   - `ipqs`   → https://ipqualityscore.com/api/json/ip/{key}/{ip}
 *   - `ipapi`  → https://ipapi.co/{ip}/json/?key=…
 *   - `mock`   → in-memory fixtures (default for development)
 *
 * Each branch maps the wire format into the unified `IPGeoInfo` shape so
 * callers pattern-match on one type only. See `src/types/core/ip-geo.ts`.
 */

import type { IPGeoInfo } from "@/types/core";
import { lookupIPGeo as mockLookup } from "@/lib/clm/mock/mock-ip-geo";
import {
  IPGEO_API_KEY,
  IPGEO_PROVIDER,
  ipGeoLive,
} from "./config";

/* ------------------------------------------------------------------------- */
/* Provider response shapes — narrow enough to satisfy our needs             */
/* ------------------------------------------------------------------------- */

interface IpinfoResp {
  ip: string;
  country?: string;
  city?: string;
  region?: string;
  org?: string;
  privacy?: { vpn?: boolean; proxy?: boolean; tor?: boolean; hosting?: boolean };
}

interface IpqsResp {
  ip_address: string;
  country_code?: string;
  city?: string;
  ISP?: string;
  vpn?: boolean;
  proxy?: boolean;
  tor?: boolean;
  is_crawler?: boolean;
  fraud_score?: number;
  recent_abuse?: boolean;
  mobile?: boolean;
  active_vpn?: boolean;
}

interface IpapiResp {
  ip: string;
  country?: string;
  country_name?: string;
  city?: string;
  region?: string;
  org?: string;
  threat?: { is_anonymous?: boolean; is_proxy?: boolean; is_tor?: boolean };
}

/* ------------------------------------------------------------------------- */
/* Mappers                                                                   */
/* ------------------------------------------------------------------------- */

function mapIpinfo(ip: string, r: IpinfoResp): IPGeoInfo {
  return {
    ip,
    country: r.country ?? "—",
    countryName: r.country ?? "—",
    city: r.city ?? "—",
    asn: r.org ?? "—",
    isVpn: r.privacy?.vpn ?? false,
    isProxy: r.privacy?.proxy ?? false,
    isTor: r.privacy?.tor ?? false,
    isHosting: r.privacy?.hosting ?? false,
    isMobile: false,
    threatScore: 0,
    registrationsFromThisIP: 0,
    relatedUids: [],
    observedAt: new Date().toISOString(),
  };
}

function mapIpqs(ip: string, r: IpqsResp): IPGeoInfo {
  return {
    ip,
    country: r.country_code ?? "—",
    countryName: r.country_code ?? "—",
    city: r.city ?? "—",
    asn: r.ISP ?? "—",
    isVpn: Boolean(r.vpn || r.active_vpn),
    isProxy: Boolean(r.proxy),
    isTor: Boolean(r.tor),
    isHosting: false,
    isMobile: Boolean(r.mobile),
    threatScore: typeof r.fraud_score === "number" ? r.fraud_score : 0,
    registrationsFromThisIP: 0,
    relatedUids: [],
    observedAt: new Date().toISOString(),
  };
}

function mapIpapi(ip: string, r: IpapiResp): IPGeoInfo {
  return {
    ip,
    country: r.country ?? "—",
    countryName: r.country_name ?? r.country ?? "—",
    city: r.city ?? "—",
    asn: r.org ?? "—",
    isVpn: Boolean(r.threat?.is_anonymous),
    isProxy: Boolean(r.threat?.is_proxy),
    isTor: Boolean(r.threat?.is_tor),
    isHosting: false,
    isMobile: false,
    threatScore: 0,
    registrationsFromThisIP: 0,
    relatedUids: [],
    observedAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------------- */
/* Public API                                                                */
/* ------------------------------------------------------------------------- */

/** Fetch IP geo info — async, real provider or mock fallback. */
export async function getIPGeo(ip: string): Promise<IPGeoInfo> {
  if (!ipGeoLive()) {
    return mockLookup(ip);
  }
  try {
    switch (IPGEO_PROVIDER) {
      case "ipinfo": {
        const url = `https://ipinfo.io/${encodeURIComponent(ip)}/json?token=${IPGEO_API_KEY}`;
        const resp = await fetch(url, { cache: "no-store" });
        if (!resp.ok) throw new Error(`ipinfo ${resp.status}`);
        return mapIpinfo(ip, (await resp.json()) as IpinfoResp);
      }
      case "ipqs": {
        const url = `https://ipqualityscore.com/api/json/ip/${IPGEO_API_KEY}/${encodeURIComponent(ip)}`;
        const resp = await fetch(url, { cache: "no-store" });
        if (!resp.ok) throw new Error(`ipqs ${resp.status}`);
        return mapIpqs(ip, (await resp.json()) as IpqsResp);
      }
      case "ipapi": {
        const url = `https://ipapi.co/${encodeURIComponent(ip)}/json/?key=${IPGEO_API_KEY}`;
        const resp = await fetch(url, { cache: "no-store" });
        if (!resp.ok) throw new Error(`ipapi ${resp.status}`);
        return mapIpapi(ip, (await resp.json()) as IpapiResp);
      }
      default:
        return mockLookup(ip);
    }
  } catch (err) {
    // Real provider failed — fall back to the mock so the UI keeps a
    // sensible structure rather than throwing into the user's face.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(`[ipgeo] provider ${IPGEO_PROVIDER} failed, falling back:`, err);
    }
    return mockLookup(ip);
  }
}

/** Sync helper — returns the mock entry. Pages that haven't migrated to
 *  the async API can keep calling this; the migration is a per-page task
 *  that touches React render code, not data shapes. */
export { lookupIPGeo } from "@/lib/clm/mock/mock-ip-geo";
