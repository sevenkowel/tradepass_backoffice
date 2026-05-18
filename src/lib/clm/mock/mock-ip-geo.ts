/**
 * Mock IP-geolocation database.
 *
 * Looked up by `caseService.getIPGeo(ip)` and rendered in the IP popover
 * on Case Detail / Client Detail. Production switches to a real provider
 * (MaxMind / IPQualityScore) behind the same interface.
 */

import type { IPGeoInfo } from "@/types/core";

const NOW = new Date().toISOString();

const FIXTURES: Record<string, IPGeoInfo> = {
  "203.113.168.45": {
    ip: "203.113.168.45",
    country: "VN",
    countryName: "Vietnam",
    city: "Hanoi",
    asn: "AS7552 Viettel — commercial VPN exit",
    isVpn: true,
    isProxy: false,
    isTor: false,
    isHosting: true,
    isMobile: false,
    threatScore: 65,
    registrationsFromThisIP: 3,
    relatedUids: ["10028391", "10028392", "10028394"],
    observedAt: NOW,
  },
  "192.168.1.1": {
    ip: "192.168.1.1",
    country: "VN",
    countryName: "Vietnam",
    city: "Hanoi",
    asn: "AS7552 Viettel",
    isVpn: false,
    isProxy: false,
    isTor: false,
    isHosting: false,
    isMobile: false,
    threatScore: 5,
    registrationsFromThisIP: 1,
    relatedUids: ["10028391"],
    observedAt: NOW,
  },
  "45.155.205.78": {
    ip: "45.155.205.78",
    country: "RU",
    countryName: "Russia",
    city: "Moscow",
    asn: "AS49581 NordVPN",
    isVpn: true,
    isProxy: true,
    isTor: false,
    isHosting: true,
    isMobile: false,
    threatScore: 88,
    registrationsFromThisIP: 5,
    relatedUids: ["U002", "U003", "10028398"],
    observedAt: NOW,
  },
  "172.69.34.118": {
    ip: "172.69.34.118",
    country: "US",
    countryName: "United States",
    city: "San Francisco",
    asn: "AS13335 Cloudflare",
    isVpn: false,
    isProxy: false,
    isTor: false,
    isHosting: true,
    isMobile: false,
    threatScore: 30,
    registrationsFromThisIP: 1,
    relatedUids: ["U001"],
    observedAt: NOW,
  },
  "103.21.244.0": {
    ip: "103.21.244.0",
    country: "SG",
    countryName: "Singapore",
    city: "Singapore",
    asn: "AS133229 Cloudflare APAC",
    isVpn: false,
    isProxy: false,
    isTor: false,
    isHosting: true,
    isMobile: false,
    threatScore: 12,
    registrationsFromThisIP: 1,
    relatedUids: ["U004"],
    observedAt: NOW,
  },
  "8.8.8.8": {
    ip: "8.8.8.8",
    country: "US",
    countryName: "United States",
    city: "Mountain View",
    asn: "AS15169 Google LLC",
    isVpn: false,
    isProxy: false,
    isTor: false,
    isHosting: true,
    isMobile: false,
    threatScore: 18,
    registrationsFromThisIP: 1,
    relatedUids: ["U005"],
    observedAt: NOW,
  },
};

/** Returns every fixture IP for the cross-client Device & Security page. */
export function listAllIPGeo(): IPGeoInfo[] {
  return Object.values(FIXTURES).sort((a, b) => b.threatScore - a.threatScore);
}

const FALLBACK = (ip: string): IPGeoInfo => ({
  ip,
  country: "—",
  countryName: "Unknown",
  city: "—",
  asn: "—",
  isVpn: false,
  isProxy: false,
  isTor: false,
  isHosting: false,
  isMobile: false,
  threatScore: 0,
  registrationsFromThisIP: 0,
  relatedUids: [],
  observedAt: NOW,
});

export function lookupIPGeo(ip: string): IPGeoInfo {
  return FIXTURES[ip] ?? FALLBACK(ip);
}
