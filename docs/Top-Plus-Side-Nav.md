# Top + Side Navigation

> **Date**: 2026-05-15
> **Status**: Accepted — implementation in progress
> **Owner**: CRM Core

## 1. Why

The v1 sidebar exposes **14 first-level groups** stacked vertically.
Even at 1280×800 the sidebar requires scrolling and the operator
spends visual budget on groups they're not in. The previous IA-v2
attempt to collapse 14 → 7 functional doors was rolled back because
operators wanted module-named groups.

This redesign keeps the **14 group names** intact and instead changes
**where** they live: from a stacked vertical list to a horizontal top
bar. The left sidebar then only renders the children of the currently
selected group — drastically shorter, no scroll, all items in view.

## 2. Decision

```
┌──────────────────────────────────────────────────────────────────┐
│ [Logo]                                       [Search] [🔔] [👤]  │  TopBar      (unchanged)
├──────────────────────────────────────────────────────────────────┤
│ Dashboard│Approvals│Clients│CLM│Risk│Trading│Funds │ More ▾      │  TopNav      (NEW)
├──────────┬───────────────────────────────────────────────────────┤
│ Overview │                                                        │
│ Real-time│                                                        │
│ Funnel   │   Main content                                         │
│ Client360│                                                        │
└──────────┴───────────────────────────────────────────────────────┘
```

### Pinned 7 groups (visible in top bar)
1. Dashboard
2. Approval Center
3. Clients
4. CLM Center
5. Risk Center
6. Trading
7. Funds

Rationale: these are the daily-operations groups. Together they own
the majority of CRM page-views in production-style telemetry: KYC
review, withdrawal review, client lookup, risk monitoring, trading
ops, dashboard glance.

### "More ▾" dropdown (overflow, 7 groups)
Support · Marketing · Reports · IB · Setup Guide · System · Apps

These are either lower-frequency surfaces (Marketing / IB / Reports)
or settings-style admin pages (Setup Guide / System / Apps).
Accessible through a single dropdown click — no scroll, no clutter.

### Left sidebar
- Renders **only** the items of the currently active group.
- The group header (icon + chevron + group name) is removed; the
  group name is implicit from the highlighted top-nav tab.
- Section labels, separators, sub-menu groups (Apps' nested
  children), and badges all preserved.
- The collapse-to-icons toggle is preserved.

## 3. Behaviour rules

| Rule | Detail |
|------|--------|
| Active top tab | Derived from `pathname` — find the group whose items array contains the current route prefix. |
| Top tab click | Navigates to the group's first item (e.g. clicking "CLM" → `/crm/clm/cases`). |
| Sub-page direct link | Bookmarking `/crm/clm/cases/case-001` highlights "CLM" in top and shows CLM items in sidebar. |
| Off-menu URLs | If pathname doesn't match any group (e.g. `/crm/settings` user-preferences page), no top tab is active and sidebar is empty. The page still renders. |
| Mobile (< lg) | TopNav scrolls horizontally; sidebar becomes drawer (unchanged from before). |
| `i18n` | All top tab labels go through `shellLabel(locale, ...)` like before. |
| Badges | Approval Center's `count · overdue` badge moves from sidebar's "Inbox" item to its top-nav tab. CLM Cases queue count similarly. |
| Permission filtering | Top tabs filter out groups the operator has no permission for. |

## 4. File changes

| File | Action |
|------|--------|
| `src/components/crm/layout/nav-config.tsx` | **NEW** — exports `menuGroups`, types, `findCurrentGroup(pathname)`, `PINNED_GROUPS`. |
| `src/components/crm/layout/TopNav.tsx` | **NEW** — horizontal tabs + "More" dropdown. |
| `src/components/crm/layout/Sidebar.tsx` | Modified — imports `menuGroups` from nav-config; removes group-header rendering; renders only the active group's items. |
| `src/components/crm/layout/index.ts` | Export `TopNav`. |
| `src/app/crm/ClientLayout.tsx` | Mount `<TopNav />` between `<TopBar />` and `<main>`. |

## 5. Out of scope

- Reordering of menu items inside a group (preserved verbatim)
- Mobile-specific overflow drawer (deferred — the existing mobile drawer still works)
- Keyboard shortcuts for top-tab switching (could add `Cmd+1..7` later)
- Animated tab transitions (no animation = faster perceived nav)
