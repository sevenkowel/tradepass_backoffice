"use client";

/**
 * useListWithFilters — generic state machine for "filtered + paginated list" pages.
 *
 * Replaces the boilerplate that every list page (review-queue,
 * audit-trail, cases, ...) was reimplementing: page / pageSize / total
 * / loading / filters / fetch effect / refresh after filter change.
 *
 * Usage:
 *
 *   const list = useListWithFilters({
 *     fetcher: (params) => caseService.list({ ...params }),
 *     initialFilters: {} as Partial<CaseListParams>,
 *     pageSize: 10,
 *   });
 *
 *   // Render:
 *   <FilterBar onChange={list.setFilters} />
 *   <Table data={list.items} loading={list.loading} />
 *   <Pager page={list.page} total={list.total} onPage={list.setPage} />
 *
 *   // After a mutation succeeds:
 *   await caseService.approve(id, staffId);
 *   list.refresh();
 */

import { useCallback, useEffect, useState } from "react";

export interface PaginatedFetchResult<T> {
  items: T[];
  total: number;
}

interface FetcherParams<F> {
  page: number;
  pageSize: number;
  filters: F;
}

interface UseListOptions<T, F> {
  fetcher: (params: FetcherParams<F>) => Promise<PaginatedFetchResult<T>>;
  initialFilters: F;
  pageSize?: number;
  /** When true, skip the initial fetch (call `refresh()` manually). */
  skipInitial?: boolean;
}

export interface UseListResult<T, F> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  filters: F;
  loading: boolean;
  setPage: (page: number) => void;
  setFilters: (filters: F) => void;
  /** Merge a partial update into existing filters. */
  patchFilters: (patch: Partial<F>) => void;
  refresh: () => Promise<void>;
}

export function useListWithFilters<T, F>({
  fetcher,
  initialFilters,
  pageSize = 10,
  skipInitial = false,
}: UseListOptions<T, F>): UseListResult<T, F> {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPageState] = useState(1);
  const [filters, setFiltersState] = useState<F>(initialFilters);
  const [loading, setLoading] = useState(!skipInitial);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetcher({ page, pageSize, filters });
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      console.error("[useListWithFilters] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [fetcher, page, pageSize, filters]);

  // Auto-fetch when page or filters change
  useEffect(() => {
    if (skipInitial) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const setPage = useCallback((next: number) => {
    setPageState(next);
  }, []);

  const setFilters = useCallback((next: F) => {
    setFiltersState(next);
    setPageState(1);
  }, []);

  const patchFilters = useCallback((patch: Partial<F>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }));
    setPageState(1);
  }, []);

  return {
    items,
    total,
    page,
    pageSize,
    filters,
    loading,
    setPage,
    setFilters,
    patchFilters,
    refresh,
  };
}
