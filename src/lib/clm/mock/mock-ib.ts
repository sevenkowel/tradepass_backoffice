/**
 * Mock Introducing Broker database.
 *
 * Looked up by `caseService.getIBSummary(ibId)` and rendered in the IB
 * hover card on Case Detail / Client Detail.
 */

import type { IBSummary } from "@/types/core";

const FIXTURES: Record<string, IBSummary> = {
  "IB-00321": {
    id: "IB-00321",
    uid: "ib00321",
    name: "Tom Nguyen",
    tier: "gold",
    status: "active",
    totalReferred: 412,
    activeReferred: 287,
    kycPassRate: 0.78,
    fraudRate: 0.06,
    joinedAt: "2024-03-12T00:00:00Z",
    country: "VN",
  },
  "IB-00455": {
    id: "IB-00455",
    uid: "ib00455",
    name: "Sarah Chen",
    tier: "platinum",
    status: "active",
    totalReferred: 1284,
    activeReferred: 901,
    kycPassRate: 0.92,
    fraudRate: 0.02,
    joinedAt: "2023-08-04T00:00:00Z",
    country: "SG",
  },
  IB001: {
    id: "IB001",
    uid: "ib001",
    name: "陈晓东",
    tier: "platinum",
    status: "active",
    totalReferred: 856,
    activeReferred: 624,
    kycPassRate: 0.91,
    fraudRate: 0.02,
    joinedAt: "2023-05-10T00:00:00Z",
    country: "CN",
  },
  IB002: {
    id: "IB002",
    uid: "ib002",
    name: "王志强",
    tier: "gold",
    status: "active",
    totalReferred: 326,
    activeReferred: 198,
    kycPassRate: 0.84,
    fraudRate: 0.05,
    joinedAt: "2024-01-22T00:00:00Z",
    country: "CN",
  },
};

/** Lists all IBs in the fixture pool. Used by the Routing & Rules
 *  ConditionBuilder to power the `ib_id` dropdown. */
export function listIBs(): IBSummary[] {
  return Object.values(FIXTURES);
}

/** Returns a fixture when known; otherwise synthesises a "standard"
 *  placeholder so UIs don't go blank for unmapped ids. */
export function lookupIB(ibId: string): IBSummary | null {
  if (FIXTURES[ibId]) return FIXTURES[ibId];
  if (!ibId) return null;
  return {
    id: ibId,
    uid: ibId.toLowerCase(),
    name: `IB ${ibId}`,
    tier: "standard",
    status: "active",
    totalReferred: 0,
    activeReferred: 0,
    kycPassRate: 0.85,
    fraudRate: 0.04,
    joinedAt: new Date().toISOString(),
  };
}
