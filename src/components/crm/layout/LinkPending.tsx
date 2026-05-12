"use client";

/**
 * LinkPending — tiny spinner rendered inside a `<Link>` when that link
 * is currently navigating.
 *
 * Uses Next 16's `useLinkStatus()` hook, which only works when the
 * component is a descendant of a `<Link>` element. The hook returns
 * `{ pending: boolean }` for that specific link's navigation, so each
 * menu item can show its own loading state without coordinating with
 * a global store.
 *
 * Sits next to the menu label so the user sees "this is the one I
 * clicked, and it's working".
 */

import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export function LinkPending({ className }: Props) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <Loader2
      className={cn("w-3 h-3 animate-spin text-primary", className)}
      aria-label="Loading"
    />
  );
}
