/**
 * Segment evaluator — applies a `ClientListParams` filter against a
 * client array (in practice `mockClients`) and returns the matching
 * subset. Used by the Segments page to:
 *   1. Show a live `userCount` instead of the stale persisted number.
 *   2. Power the "View members" drawer for any segment row.
 *
 * Intentionally restricted to the subset of filter fields that mock
 * data actually populates — adding more is cheap, but each branch
 * here is only useful if the corresponding column exists on the
 * mock client objects (otherwise it silently filters everything out).
 */

import type { BackofficeUser, ClientListParams } from "@/types/backoffice/user";

export type SegmentFilter = Partial<ClientListParams>;

/** Apply a single filter shape against a population, returning the
 *  matching subset (stable order). Empty filter ⇒ returns the full
 *  population, mirroring "no constraints = everyone". */
export function evaluateSegment(filter: SegmentFilter, population: BackofficeUser[]): BackofficeUser[] {
  return population.filter((c) => matches(c, filter));
}

/** Quick count without materialising the array. */
export function countSegmentMembers(filter: SegmentFilter, population: BackofficeUser[]): number {
  let n = 0;
  for (const c of population) if (matches(c, filter)) n++;
  return n;
}

function matches(c: BackofficeUser, f: SegmentFilter): boolean {
  // Status / kycStatus / level / riskLevel / lifecycleStage / role — direct equality
  if (f.status && c.status !== f.status) return false;
  if (f.kycStatus && c.kycStatus !== f.kycStatus) return false;
  if (f.level && c.level !== f.level) return false;
  if (f.riskLevel && c.riskLevel !== f.riskLevel) return false;
  if (f.lifecycleStage && c.lifecycleStage !== f.lifecycleStage) return false;
  if (f.role && c.role !== f.role) return false;

  // Country — multi-select
  if (f.country && f.country.length > 0) {
    if (!c.country || !f.country.includes(c.country)) return false;
  }

  // hasFtd — truthy ftdDate means "has made a first deposit"
  if (typeof f.hasFtd === "boolean") {
    const has = !!c.ftdDate;
    if (has !== f.hasFtd) return false;
  }

  // Tags — single or multiple. Match if client has ANY of the listed tags.
  if (f.tag && (!c.tags || !c.tags.includes(f.tag))) return false;
  if (f.tags && f.tags.length > 0) {
    const set = new Set(c.tags ?? []);
    if (!f.tags.some((t) => set.has(t))) return false;
  }

  // Trading-account bounds
  if (typeof f.minAccountCount === "number" && (c.accountCount ?? 0) < f.minAccountCount) return false;
  if (typeof f.maxAccountCount === "number" && (c.accountCount ?? 0) > f.maxAccountCount) return false;

  // Search — naive substring across name / email / uid
  if (f.search) {
    const q = f.search.toLowerCase();
    if (
      !c.name.toLowerCase().includes(q) &&
      !c.email.toLowerCase().includes(q) &&
      !c.uid.toLowerCase().includes(q)
    ) return false;
  }

  // Date range — registration date
  if (f.startDate && c.createdAt < f.startDate) return false;
  if (f.endDate && c.createdAt > f.endDate) return false;

  return true;
}

/** Tiny helper used by the page header summary cards. */
export function isEmptyFilter(f: SegmentFilter): boolean {
  return Object.keys(f).every((k) => {
    const v = (f as Record<string, unknown>)[k];
    return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
  });
}
