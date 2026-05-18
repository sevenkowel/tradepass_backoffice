"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

/**
 * Backward-compatible Card wrapper.
 *
 * The canonical Card lives in `@/components/ui/card` and uses
 * granular sub-components (CardHeader / CardContent / CardFooter).
 * Existing CRM pages, however, import `Card` from `@/components/crm/ui`
 * with a single `padding` prop. This wrapper preserves that API
 * while standardizing the visual on tokens (slate-200 border,
 * white surface, 12px radius, slate shadow).
 *
 * For new code, prefer:
 *   import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
 */
interface CardCompatProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional — supports `<Card />` self-closing for skeleton placeholders. */
  children?: ReactNode;
  className?: string;
  /** Padding scale. Defaults to `md` (20px). Use `none` to opt out. */
  padding?: "none" | "sm" | "md" | "lg";
}

const paddings = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
} as const;

export function Card({
  children,
  className,
  padding = "md",
  ...rest
}: CardCompatProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-200 shadow-sm",
        paddings[padding],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
