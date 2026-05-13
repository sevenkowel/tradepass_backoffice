"use client";

import { useState, useMemo, useDeferredValue, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown,
  Search, MoreHorizontal, Check, Columns3, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

// Column definition
export interface Column<T> {
  key: string;
  title: string;
  width?: string;
  minWidth?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  /**
   * Field on the row used for sorting. Defaults to `key`. Useful for
   * composite columns that render derived data (e.g. a "Customer" column
   * that should sort by `customerName`).
   */
  sortField?: string;
  fixed?: "left" | "right";
  /**
   * Whether this column can be hidden via the column-visibility menu.
   * Defaults to `true`. Set to `false` for pinned identity columns
   * (e.g. the row's primary identifier) that should never disappear.
   */
  hideable?: boolean;
  /** Hide this column by default; user can re-enable from the menu. */
  defaultHidden?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
}

// Row action definition
//
// `label` and `icon` accept either a constant or a per-row resolver,
// e.g. `{ label: (row) => row.frozen ? "Unfreeze" : "Freeze" }`.
export interface RowAction<T> {
  label: string | ((row: T) => string);
  icon?: React.ReactNode | ((row: T) => React.ReactNode);
  onClick: (row: T) => void;
  variant?: "default" | "danger";
  disabled?: (row: T) => boolean;
}

// Enhanced DataTable Props
export interface EnhancedDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  searchable?: boolean;
  searchKeys?: string[];
  searchPlaceholder?: string;
  pagination?: boolean;
  pageSize?: number;
  selectable?: boolean;
  /**
   * When `selectable`, lock the selection column to the viewport's left
   * edge so it stays visible during horizontal scroll. Defaults to `true`.
   */
  fixSelectionLeft?: boolean;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  rowActions?: RowAction<T>[];
  /**
   * Lock the row-actions column to the viewport's right edge so the
   * "…" menu stays reachable during horizontal scroll. Defaults to `true`.
   */
  fixActionsRight?: boolean;
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyText?: string;
  emptyIcon?: React.ReactNode;
  exportable?: boolean;
  onExport?: () => void;
  /**
   * Rendered in the table toolbar when `selectedKeys.size > 0`. Lets the
   * page expose batch actions ("Assign to me", "Export selected", …)
   * without a separate banner outside the table.
   */
  bulkActions?: (selectedKeys: Set<string>) => React.ReactNode;
  /**
   * Stable identifier used to scope the column-visibility preference
   * in `localStorage`. Different tables on the same domain (e.g.
   * "review-queue", "cases-archive") should pass distinct ids so a
   * user's preference for one doesn't leak into the other. Omit to
   * disable persistence — visibility resets each mount.
   */
  tableId?: string;
}

export function EnhancedDataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  searchable = false,
  searchKeys = [],
  searchPlaceholder = "Search...",
  pagination = true,
  pageSize = 10,
  selectable = false,
  fixSelectionLeft = true,
  selectedKeys = new Set(),
  onSelectionChange,
  rowActions,
  fixActionsRight = true,
  rowClassName,
  onRowClick,
  emptyText = "No data available",
  emptyIcon,
  exportable = false,
  onExport,
  bulkActions,
  tableId,
}: EnhancedDataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionsOpen, setActionsOpen] = useState<string | null>(null);

  // ── Column visibility ─────────────────────────────────────────
  // Hidden keys live in state and (optionally) `localStorage`.
  // Pinned columns (`hideable === false`) are always visible — even if
  // a stale localStorage entry says otherwise — so a config change
  // can't trap a user with no way back.
  const storageKey = tableId ? `crm.table.${tableId}.hidden` : null;

  const initialHidden = useMemo<Set<string>>(() => {
    const seeded = new Set<string>(
      columns.filter((c) => c.defaultHidden && c.hideable !== false).map((c) => c.key)
    );
    if (typeof window === "undefined" || !storageKey) return seeded;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return seeded;
      const arr = JSON.parse(raw) as string[];
      return new Set(arr.filter((k) => columns.some((c) => c.key === k && c.hideable !== false)));
    } catch {
      return seeded;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(initialHidden);

  useEffect(() => {
    if (typeof window === "undefined" || !storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(Array.from(hiddenKeys)));
    } catch {
      /* quota exceeded / private mode — ignore */
    }
  }, [hiddenKeys, storageKey]);

  const visibleColumns = useMemo(
    () => columns.filter((c) => !hiddenKeys.has(c.key)),
    [columns, hiddenKeys]
  );

  const toggleColumn = (key: string) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const resetColumns = () => {
    const seeded = new Set<string>(
      columns.filter((c) => c.defaultHidden && c.hideable !== false).map((c) => c.key)
    );
    setHiddenKeys(seeded);
  };

  // Columns popover (portal'd so the dropdown isn't clipped by the
  // table's own `overflow-x-auto` scroll container).
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [columnsMenuPos, setColumnsMenuPos] = useState({ top: 0, right: 0 });
  const columnsBtnRef = useRef<HTMLButtonElement>(null);
  const columnsMenuRef = useRef<HTMLDivElement>(null);

  const openColumnsMenu = () => {
    const r = columnsBtnRef.current?.getBoundingClientRect();
    if (!r) return;
    setColumnsMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    setColumnsMenuOpen(true);
  };
  useEffect(() => {
    if (!columnsMenuOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (columnsBtnRef.current?.contains(t)) return;
      if (columnsMenuRef.current?.contains(t)) return;
      setColumnsMenuOpen(false);
    };
    const onScroll = () => setColumnsMenuOpen(false);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [columnsMenuOpen]);

  // Search (defer query so typing doesn't block the main thread)
  const filteredData = useMemo(() => {
    if (!searchable || !deferredQuery) return data;
    return data.filter((row) =>
      searchKeys.some((key) => {
        const value = (row as Record<string, unknown>)[key];
        return String(value).toLowerCase().includes(deferredQuery.toLowerCase());
      })
    );
  }, [data, searchable, deferredQuery, searchKeys]);

  // Sort — `sortKey` stores `column.key` (for the indicator UI); the
  // actual field read off the row is `column.sortField ?? column.key`.
  // This indirection lets a "Customer" column (with custom render)
  // sort by `customerName` without exposing that detail to the parent.
  const sortField = useMemo(() => {
    if (!sortKey) return null;
    const col = columns.find((c) => c.key === sortKey);
    return col?.sortField ?? sortKey;
  }, [sortKey, columns]);

  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[sortField];
      const bValue = (b as Record<string, unknown>)[sortField];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      return sortOrder === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [filteredData, sortField, sortOrder]);

  // Pagination
  const totalPages = pagination ? Math.ceil(sortedData.length / pageSize) : 1;
  const paginatedData = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  // Selection
  const allSelected = paginatedData.every((row) => selectedKeys.has(keyExtractor(row)));
  const someSelected = paginatedData.some((row) => selectedKeys.has(keyExtractor(row)));

  const handleSelectAll = () => {
    if (allSelected) {
      const newKeys = new Set(selectedKeys);
      paginatedData.forEach((row) => newKeys.delete(keyExtractor(row)));
      onSelectionChange?.(newKeys);
    } else {
      const newKeys = new Set(selectedKeys);
      paginatedData.forEach((row) => newKeys.add(keyExtractor(row)));
      onSelectionChange?.(newKeys);
    }
  };

  const handleSelectRow = (row: T) => {
    const key = keyExtractor(row);
    const newKeys = new Set(selectedKeys);
    if (newKeys.has(key)) {
      newKeys.delete(key);
    } else {
      newKeys.add(key);
    }
    onSelectionChange?.(newKeys);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-slate-100 rounded-lg" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Toolbar is **persistent**: when any of search / export / selection
  // bulk-actions / column-visibility is configured, the same row renders
  // unconditionally so the table layout never shifts when rows are
  // checked/unchecked. Only the inline content changes.
  const hasBulkActions = !!bulkActions && selectable;
  // Columns menu is always available when at least one column is hideable.
  const hasColumnsMenu = columns.some((c) => c.hideable !== false);
  const showToolbar = searchable || exportable || hasBulkActions || hasColumnsMenu;
  const selectionCount = selectedKeys.size;
  const hasSelection = selectionCount > 0;
  const hasHidden = hiddenKeys.size > 0;

  return (
    <div className="w-full space-y-3">
      {/*
        One outer wrapper hosts the toolbar and the scroll container so
        the rounded-xl border + radius is applied to the whole "card"
        and the toolbar sits flush above the table head — no double
        borders, no orphaned banners. Internal sections are separated
        by a single 1px divider rather than independent corners.
      */}
      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        {/* Persistent toolbar — same chrome regardless of selection state */}
        {showToolbar && (
          <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-b border-slate-200 bg-white">
            {/* LEFT — search input (if any) + selection meta */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {searchable && (
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={searchPlaceholder}
                    className="w-full h-9 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}
              {hasBulkActions && (
                <div className="flex items-center gap-2 text-sm whitespace-nowrap">
                  <span className={cn(
                    "tabular-nums transition-colors",
                    hasSelection ? "font-medium text-primary" : "text-slate-400"
                  )}>
                    {selectionCount} selected
                  </span>
                  {hasSelection && (
                    <button
                      onClick={() => onSelectionChange?.(new Set())}
                      className="text-xs text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
            {/* RIGHT — bulk actions (always rendered, dimmed when empty) + export */}
            <div className="flex items-center gap-2">
              {hasBulkActions && (
                <div
                  // Buttons stay in place; opacity/pointer-events convey
                  // disabled state without changing layout width.
                  className={cn(
                    "flex items-center gap-2 transition-opacity",
                    !hasSelection && "opacity-40 pointer-events-none"
                  )}
                  aria-disabled={!hasSelection}
                >
                  {bulkActions(selectedKeys)}
                </div>
              )}
              {exportable && (
                <button
                  onClick={onExport}
                  className="h-9 px-3 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Export
                </button>
              )}
              {/* Columns visibility — popover renders into a portal so
                  it isn't clipped by the table's scroll container. */}
              {hasColumnsMenu && (
                <button
                  ref={columnsBtnRef}
                  onClick={openColumnsMenu}
                  className={cn(
                    "h-9 px-2.5 inline-flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-colors",
                    columnsMenuOpen
                      ? "bg-blue-50 text-primary border-blue-200"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                    hasHidden && !columnsMenuOpen && "border-blue-200 text-primary"
                  )}
                  title={hasHidden ? `${hiddenKeys.size} column${hiddenKeys.size === 1 ? "" : "s"} hidden` : "Customize columns"}
                >
                  <Columns3 className="w-3.5 h-3.5" />
                  Columns
                  {hasHidden && (
                    <span className="ml-0.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-primary text-white text-[10px] font-bold tabular-nums">
                      {hiddenKeys.size}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Columns popover (portal) */}
        {columnsMenuOpen && typeof document !== "undefined" &&
          createPortal(
            <div
              ref={columnsMenuRef}
              className="fixed z-[100] w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 text-sm"
              style={{ top: columnsMenuPos.top, right: columnsMenuPos.right }}
            >
              <div className="flex items-center justify-between px-3 pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Columns
                </span>
                <button
                  onClick={resetColumns}
                  disabled={!hasHidden}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>
              <ul className="max-h-72 overflow-y-auto py-1">
                {columns.map((col) => {
                  const pinned = col.hideable === false;
                  const visible = !hiddenKeys.has(col.key);
                  return (
                    <li key={col.key}>
                      <button
                        onClick={() => !pinned && toggleColumn(col.key)}
                        disabled={pinned}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left transition-colors",
                          pinned
                            ? "text-slate-400 cursor-not-allowed"
                            : "text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <span
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                            visible
                              ? "bg-primary border-primary text-white"
                              : "bg-white border-slate-300"
                          )}
                        >
                          {visible && <Check className="w-3 h-3" />}
                        </span>
                        <span className="flex-1 truncate">{col.title || col.key}</span>
                        {pinned && (
                          <span className="text-[10px] uppercase tracking-wider text-slate-400">
                            Pinned
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>,
            document.body
          )}

        {/* Table
            Sticky columns: when `fixSelectionLeft` (selection col) or
            `fixActionsRight` (rowActions col) is on, the cell stays put
            during horizontal scroll. The cell needs (a) sticky position,
            (b) opaque background to cover scrolled content, (c) a higher
            z-index than other cells, and (d) a subtle shadow on the
            inside edge to signal the freeze. Header cells stack 30 above
            their bodies (z-30 thead vs z-20 td) so they win the visual
            overlap. */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {selectable && (
                <th
                  className={cn(
                    "w-12 px-4 py-3 bg-slate-50",
                    fixSelectionLeft && "sticky left-0 z-30 shadow-[1px_0_0_0_var(--color-border)]"
                  )}
                >
                  <button
                    onClick={handleSelectAll}
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                      allSelected
                        ? "bg-primary border-primary text-white"
                        : someSelected
                        ? "border-primary bg-blue-50"
                        : "border-slate-300 hover:border-slate-400"
                    )}
                  >
                    {(allSelected || someSelected) && <Check className="w-3 h-3" />}
                  </button>
                </th>
              )}
              {visibleColumns.map((column) => {
                const isActiveSort = sortKey === column.key;
                return (
                  <th
                    key={column.key}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right",
                      column.sortable && "cursor-pointer hover:bg-slate-100 select-none group/sort"
                    )}
                    style={{ width: column.width, minWidth: column.minWidth }}
                    onClick={() => column.sortable && handleSort(column.key)}
                    aria-sort={
                      column.sortable
                        ? isActiveSort
                          ? sortOrder === "asc" ? "ascending" : "descending"
                          : "none"
                        : undefined
                    }
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1.5",
                        column.align === "center" && "justify-center",
                        column.align === "right" && "justify-end"
                      )}
                    >
                      <span>{column.title}</span>
                      {column.sortable && (
                        // Always show a sort hint on sortable columns:
                        //   inactive: a faint two-way ↕ chevron
                        //   active: a solid ↑ or ↓ in primary blue
                        // This makes the affordance obvious without a tooltip.
                        isActiveSort ? (
                          sortOrder === "asc" ? (
                            <ChevronUp className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 text-slate-300 group-hover/sort:text-slate-500 flex-shrink-0 transition-colors" />
                        )
                      )}
                    </div>
                  </th>
                );
              })}
              {rowActions && (
                <th
                  className={cn(
                    "w-12 px-4 py-3 bg-slate-50",
                    fixActionsRight && "sticky right-0 z-30 shadow-[-1px_0_0_0_var(--color-border)]"
                  )}
                />
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}>
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyText}
                  />
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => {
                const rowKey = keyExtractor(row);
                const isSelected = selectedKeys.has(rowKey);

                return (
                  <tr
                    key={rowKey}
                    className={cn(
                      "hover:bg-slate-50 transition-colors group",
                      // Use full opacity (not /50) so sticky cells'
                      // matching `bg-blue-50` blends seamlessly with
                      // the rest of the row.
                      isSelected && "bg-blue-50",
                      onRowClick && "cursor-pointer",
                      rowClassName?.(row)
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <td
                        className={cn(
                          "px-4 py-3",
                          // Sticky cells need an opaque background or the
                          // scrolled content shows through. Match row state.
                          fixSelectionLeft && [
                            "sticky left-0 z-20",
                            "shadow-[1px_0_0_0_var(--color-border)]",
                            isSelected ? "bg-blue-50" : "bg-white group-hover:bg-slate-50",
                          ]
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleSelectRow(row)}
                          className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                            isSelected
                              ? "bg-primary border-primary text-white"
                              : "border-slate-300 hover:border-blue-400"
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </button>
                      </td>
                    )}
                    {visibleColumns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          "px-4 py-3 text-sm text-slate-900",
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right"
                        )}
                      >
                        {column.render
                          ? column.render(row, index)
                          : String((row as Record<string, unknown>)[column.key] ?? "-")}
                      </td>
                    ))}
                    {rowActions && (
                      <td
                        className={cn(
                          "px-4 py-3",
                          fixActionsRight && [
                            "sticky right-0",
                            // Lift this cell above its sticky neighbours when its
                            // dropdown is open, otherwise rows below would clip
                            // the menu's overflow on the right edge.
                            actionsOpen === rowKey ? "z-40" : "z-20",
                            "shadow-[-1px_0_0_0_var(--color-border)]",
                            isSelected ? "bg-blue-50" : "bg-white group-hover:bg-slate-50",
                          ]
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActionsOpen(actionsOpen === rowKey ? null : rowKey)
                            }
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {actionsOpen === rowKey && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setActionsOpen(null)}
                              />
                              <div
                                className={cn(
                                  // z-50 sits inside the td's z-40 stacking
                                  // context, so the menu always wins versus
                                  // siblings (other rows' sticky cells).
                                  "absolute right-0 w-40 bg-white rounded-lg border border-slate-200 shadow-lg z-50 py-1",
                                  // last rows expand upward
                                  index >= paginatedData.length - 2 && paginatedData.length > 2
                                    ? "bottom-full mb-1"
                                    : "top-full mt-1"
                                )}
                              >
                                {rowActions.map((action, i) => (
                                  <button
                                    key={i}
                                    onClick={() => {
                                      action.onClick(row);
                                      setActionsOpen(null);
                                    }}
                                    disabled={action.disabled?.(row)}
                                    className={cn(
                                      "w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors",
                                      action.variant === "danger"
                                        ? "text-red-600 hover:bg-red-50"
                                        : "text-slate-700 hover:bg-slate-50",
                                      action.disabled?.(row) && "opacity-50 cursor-not-allowed"
                                    )}
                                  >
                                    {typeof action.icon === "function" ? action.icon(row) : action.icon}
                                    {typeof action.label === "function" ? action.label(row) : action.label}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm text-slate-500">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, sortedData.length)} of{" "}
            {sortedData.length} results
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    "w-9 h-9 text-sm rounded-lg border transition-colors",
                    currentPage === pageNum
                      ? "bg-primary text-white border-primary"
                      : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
