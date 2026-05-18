"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

// Backward-compatible deep imports: a handful of pages still write
//   `import { Button, Card, EmptyState, PageHeader } from "@/components/crm/ui/PageHeader"`
// — re-export them so those pages keep working. New code should import
// from the barrel `@/components/crm/ui` instead.
export { Button } from "@/components/ui/Button";
export { EmptyState } from "@/components/ui/EmptyState";
export { Card } from "./CardCompat";

/**
 * Page header — slim actions bar.
 *
 * Background (2026-05-10 redesign): the page H1 is rendered by the
 * `Breadcrumb` component as its last item. Static descriptions and
 * "what is this page" copy turned out to be redundant — operators
 * read them once and never look again, and dynamic KPIs (waiting
 * counts, SLA timeouts, etc.) belong in the page body where they
 * stay visible while filtering. So this component now renders **only**
 * the optional action area (export buttons, "New …" CTAs, etc.).
 *
 * Both `title` and `description` props are kept for backward
 * compatibility — the title still flows to `document.title` via
 * Next.js metadata, and existing callers don't need to change.
 */
interface PageHeaderProps {
  /** Kept for back-compat. Not rendered visually — H1 lives in Breadcrumb. */
  title: string;
  /** Kept for back-compat. Not rendered visually — surface dynamic
   *  context inside the page body instead. */
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title: _title,
  description: _description,
  actions,
  className,
}: PageHeaderProps) {
  // No actions → nothing to render. Breadcrumb already supplies the H1.
  if (!actions) return null;

  return (
    <div className={cn("flex items-center justify-end gap-2 mb-4 -mt-1", className)}>
      {actions}
    </div>
  );
}
