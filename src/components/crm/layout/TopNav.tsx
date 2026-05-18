"use client";

/**
 * TopNavTabs — first-level navigation, rendered inline inside TopBar.
 *
 * Renders 7 pinned groups as icon-only tabs + a "…" (More) dropdown
 * for the remaining 7. The active tab is derived from the current
 * pathname via `findGroupForPath`. Clicking a tab navigates to the
 * group's first item href.
 *
 * This used to be a standalone 48px row beneath TopBar; consolidated
 * into TopBar so the chrome is a single 64px row. See
 * `docs/Top-Plus-Side-Nav.md` for the design rationale.
 */

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/crm";
import { useT } from "@/lib/i18n/LocaleProvider";
import { shellLabel } from "@/lib/i18n/crm-shell";
import { useApprovalCount } from "@/hooks/useApprovalCount";
import { useReviewQueueCount } from "@/hooks/useReviewQueueCount";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  menuGroups,
  PINNED_GROUPS,
  findGroupForPath,
  type MenuGroup,
} from "./Sidebar";

/** Resolve the first navigable href inside a group — used when an
 *  operator clicks the top tab itself. */
function firstHref(group: MenuGroup): string {
  for (const item of group.items) {
    if (item.href) return item.href;
  }
  return "/crm";
}

interface TabBadge {
  count: number;
  overdue?: number;
}

/** Inline tab bar — designed to slot into the middle of TopBar.
 *  Container handles its own width via `flex-1`; this component is
 *  layout-agnostic above that. */
export function TopNavTabs() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { locale } = useT();

  /* ── Permission filter — same logic as Sidebar's `filteredMenuGroups`. */
  const filtered = useMemo(() => {
    const isSuper = user?.role.id === "super_admin" ||
      user?.role.permissions.some((p) => (p.module as string) === "*" && (p.actions as readonly string[]).includes("*"));
    if (isSuper) return menuGroups;

    const hasPermission = (mod: string, action = "view"): boolean => {
      if (!user) return false;
      const p = user.role.permissions.find((x) => x.module === mod);
      if (!p) return false;
      const actions = p.actions as readonly string[];
      return actions.includes("*") || actions.includes(action);
    };

    return menuGroups
      .map((g) => {
        const items = g.items.filter((it) => !it.permission || hasPermission(it.permission, "view"));
        if (items.length === 0) return null;
        return { ...g, items };
      })
      .filter(Boolean) as MenuGroup[];
  }, [user]);

  const pinned   = useMemo(() => filtered.filter((g) => (PINNED_GROUPS as readonly string[]).includes(g.group)), [filtered]);
  const overflow = useMemo(() => filtered.filter((g) => !(PINNED_GROUPS as readonly string[]).includes(g.group)), [filtered]);

  const activeGroupName = findGroupForPath(pathname)?.group;

  /* ── Live badges — Approval Inbox total + Review Queue count.
   *      Sidebar used to attach these on specific items; in TopNav
   *      they belong on the parent group tab so operators see them
   *      without expanding anything. */
  const canSeeComplianceBadge = useMemo(() => {
    if (!user) return false;
    return user.role.permissions.some(
      (p) => (p.module === "compliance" || p.module === "*") &&
             (p.actions as readonly string[]).some((a) => a === "view" || a === "*")
    );
  }, [user]);
  const { count: approvalCount, overdue: approvalOverdue } = useApprovalCount({ enabled: canSeeComplianceBadge });
  const { count: reviewQueueCount } = useReviewQueueCount({ enabled: canSeeComplianceBadge });

  const badgeFor = (groupName: string): TabBadge | null => {
    if (groupName === "Approval Center" && approvalCount > 0) {
      return { count: approvalCount, overdue: approvalOverdue };
    }
    if (groupName === "CLM Center" && reviewQueueCount > 0) {
      return { count: reviewQueueCount };
    }
    return null;
  };

  /* ── More dropdown state */
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!moreOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [moreOpen]);

  const activeInOverflow = overflow.some((g) => g.group === activeGroupName);

  return (
    /* Segmented-control tab strip — a single rounded `bg-slate-100`
       pill houses the whole group; the active tab pops out as a
       white sub-pill with a subtle shadow. This gives the chrome a
       clear, contained shape instead of icons floating freely on the
       white TopBar.

       `delayDuration={80}` makes Radix tooltips feel near-instant on
       hover — the browser's native `title` attribute delays ~500ms
       which felt sluggish for an icon-only nav. */
    <TooltipProvider delayDuration={80} skipDelayDuration={120}>
      <div className="hidden lg:flex items-center bg-slate-100 rounded-xl p-1 h-11 gap-1">
        {pinned.map((g) => (
          <NavTab
            key={g.group}
            href={firstHref(g)}
            icon={g.icon}
            label={shellLabel(locale, g.group)}
            active={activeGroupName === g.group}
            badge={badgeFor(g.group)}
          />
        ))}

        {overflow.length > 0 && (
          <div className="relative" ref={moreRef}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  aria-label={shellLabel(locale, "More")}
                  className={cn(
                    "inline-flex items-center justify-center w-12 h-9 rounded-lg transition-colors",
                    (moreOpen || activeInOverflow)
                      ? "bg-white text-primary shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                {shellLabel(locale, "More")}
              </TooltipContent>
            </Tooltip>
            {moreOpen && (
              <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50">
                {overflow.map((g) => (
                  <Link
                    key={g.group}
                    href={firstHref(g)}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                      activeGroupName === g.group
                        ? "bg-blue-50 text-primary"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <g.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{shellLabel(locale, g.group)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

/* ─────────────────────────────────────────────────────────────────── */

function NavTab({
  href, icon: Icon, label, active, badge,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  badge: TabBadge | null;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          aria-label={label}
          className={cn(
            /* Segmented-control sub-pill. Fixed footprint per tab so the
               strip width is predictable; active state pops out as white. */
            "relative inline-flex items-center justify-center w-12 h-9 rounded-lg transition-colors",
            active
              ? "bg-white text-primary shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <Icon className="w-5 h-5" />
          {badge && (
            <span
              className={cn(
                /* Badge floats just past the icon's top-right corner. */
                "absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-semibold tabular-nums ring-2 ring-white",
                badge.overdue && badge.overdue > 0
                  ? "bg-red-500 text-white"
                  : "bg-blue-500 text-white"
              )}
            >
              {badge.count}
            </span>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
