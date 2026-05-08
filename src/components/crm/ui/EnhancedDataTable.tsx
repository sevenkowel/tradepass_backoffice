"use client";

import { useState, useMemo, useDeferredValue } from "react";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Search, MoreHorizontal, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./PageHeader";

// Column definition
export interface Column<T> {
  key: string;
  title: string;
  width?: string;
  minWidth?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  fixed?: "left" | "right";
  render?: (row: T, index: number) => React.ReactNode;
}

// Row action definition
export interface RowAction<T> {
  label: string;
  icon?: React.ReactNode;
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
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  rowActions?: RowAction<T>[];
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyText?: string;
  emptyIcon?: React.ReactNode;
  exportable?: boolean;
  onExport?: () => void;
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
  selectedKeys = new Set(),
  onSelectionChange,
  rowActions,
  rowClassName,
  onRowClick,
  emptyText = "No data available",
  emptyIcon,
  exportable = false,
  onExport,
}: EnhancedDataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionsOpen, setActionsOpen] = useState<string | null>(null);

  // Search (使用 deferred value 避免输入时阻塞主线程)
  const filteredData = useMemo(() => {
    if (!searchable || !deferredQuery) return data;
    return data.filter((row) =>
      searchKeys.some((key) => {
        const value = (row as Record<string, unknown>)[key];
        return String(value).toLowerCase().includes(deferredQuery.toLowerCase());
      })
    );
  }, [data, searchable, deferredQuery, searchKeys]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[sortKey];
      const bValue = (b as Record<string, unknown>)[sortKey];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      return sortOrder === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [filteredData, sortKey, sortOrder]);

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
          <div className="h-12 bg-gray-100 rounded-lg" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Check if toolbar should be shown
  const showToolbar = searchable || exportable || (selectable && selectedKeys.size > 0);

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between gap-4">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full h-9 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-blue-300"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            {selectable && selectedKeys.size > 0 && (
              <span className="text-sm text-gray-500">
                {selectedKeys.size} selected
              </span>
            )}
            {exportable && (
              <button
                onClick={onExport}
                className="h-9 px-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Export
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
        <table className="w-full min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <button
                    onClick={handleSelectAll}
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                      allSelected
                        ? "bg-blue-600 border-blue-600 text-white"
                        : someSelected
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    )}
                  >
                    {(allSelected || someSelected) && <Check className="w-3 h-3" />}
                  </button>
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.sortable && "cursor-pointer hover:bg-gray-100 select-none"
                  )}
                  style={{ width: column.width, minWidth: column.minWidth }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div
                    className={cn(
                      "flex items-center gap-1",
                      column.align === "center" && "justify-center",
                      column.align === "right" && "justify-end"
                    )}
                  >
                    {column.title}
                    {column.sortable && sortKey === column.key && (
                      sortOrder === "asc" ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )
                    )}
                  </div>
                </th>
              ))}
              {rowActions && <th className="w-12 px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}>
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
                      "hover:bg-gray-50 transition-colors group",
                      isSelected && "bg-blue-50/50",
                      onRowClick && "cursor-pointer",
                      rowClassName?.(row)
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleSelectRow(row)}
                          className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                            isSelected
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-gray-300 hover:border-blue-400"
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </button>
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          "px-4 py-3 text-sm text-gray-900",
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
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActionsOpen(actionsOpen === rowKey ? null : rowKey)
                            }
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {actionsOpen === rowKey && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActionsOpen(null)}
                              />
                              <div 
                                className={cn(
                                  "absolute right-0 w-40 bg-white rounded-lg border border-gray-200 shadow-lg z-20 py-1",
                                  // 最后一行向上展开，其他向下展开
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
                                        : "text-gray-700 hover:bg-gray-50",
                                      action.disabled?.(row) && "opacity-50 cursor-not-allowed"
                                    )}
                                  >
                                    {action.icon}
                                    {action.label}
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

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, sortedData.length)} of{" "}
            {sortedData.length} results
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
