"use client";

/**
 * ListPageShell — outer wrapper for every CRM list page.
 *
 * Provides: breadcrumb, consistent outer spacing, and a slot for the
 * actual page contents (stats grid, toolbar, table, pagination).
 *
 * Reference: docs/ui/list-page-spec.md §1.
 */

import { Breadcrumb } from "@/components/crm/layout";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  breadcrumb: BreadcrumbItem[];
  /** Optional inline error banner above the content. */
  error?: string | null;
  errorRetryLabel?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function ListPageShell({
  breadcrumb,
  error,
  errorRetryLabel = "Retry",
  onRetry,
  children,
}: Props) {
  return (
    <div className="space-y-4">
      <Breadcrumb items={breadcrumb} />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
          <span className="font-medium">Error:</span>
          {error}
          {onRetry && (
            <button
              onClick={onRetry}
              className="ml-auto text-red-700 underline hover:no-underline"
            >
              {errorRetryLabel}
            </button>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
