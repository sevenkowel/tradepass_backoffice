"use client";

/**
 * TablePagination — standard "X 条 / 每页 N / 1 2 3 ... last" pagination.
 *
 * Reference: docs/ui/list-page-spec.md §6.
 *
 * Conventions:
 *   - Page sizes: 10 / 20 / 50 / 100 (default 20)
 *   - Page window: up to 7 buttons visible (1 ... neighbours ... last)
 *   - Hidden entirely when `total === 0`
 */

interface Props {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  /** Localised labels — pass-through if you want non-default text. */
  labels?: {
    totalPrefix?: string;   // e.g. "共"
    perPage?: (n: number) => string;  // e.g. (n) => `${n} / 页`
    previous?: string;
    next?: string;
  };
}

const DEFAULT_LABELS: Required<NonNullable<Props["labels"]>> = {
  totalPrefix: "Total",
  perPage: (n: number) => `${n} / page`,
  previous: "Previous",
  next: "Next",
};

export function TablePagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  labels,
}: Props) {
  if (total === 0) return null;
  const l = { ...DEFAULT_LABELS, ...labels };
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const window_ = buildPageWindow(page, totalPages);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span>
          {l.totalPrefix} {total}
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="h-8 px-2 border border-slate-200 rounded-lg text-sm focus:outline-none"
          >
            {pageSizeOptions.map((s) => (
              <option key={s} value={s}>{l.perPage(s)}</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {l.previous}
        </button>
        {window_.map((p, i) =>
          p === "..." ? (
            <span key={`gap-${i}`} className="px-2 text-slate-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 text-sm rounded-lg border transition-colors ${
                page === p
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {l.next}
        </button>
      </div>
    </div>
  );
}

function buildPageWindow(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const result: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) result.push("...");
  for (let i = start; i <= end; i++) result.push(i);
  if (end < total - 1) result.push("...");
  result.push(total);
  return result;
}
