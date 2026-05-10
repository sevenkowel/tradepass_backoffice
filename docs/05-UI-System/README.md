# TradePass CRM Design System

**Single source of truth** for the visual layer of the CRM. All page-level
styling decisions must conform to the rules in this folder. Anything that
deviates either updates these docs first or is treated as a bug.

> Last revision: 2026-05-09. Replaces the previous portal-flavored doc; the
> portal is no longer in scope for this CRM.

## Files

| File | What it covers |
|------|----------------|
| [`Design-Tokens.md`](./Design-Tokens.md) | Colors, typography, spacing, radius, shadow, transitions. The atom layer. |
| [`Component-API.md`](./Component-API.md) | Public APIs of `@/components/ui` and `@/components/crm/ui`. The molecule layer. |
| [`Usage-Guidelines.md`](./Usage-Guidelines.md) | Hard rules: do this, never do that. The "what to avoid" cheatsheet. |

## Quick start

```tsx
import { Button, Card, EmptyState } from "@/components/crm/ui";
import { PageHeader, StatusBadge, RiskBadge } from "@/components/crm/ui";
import { EnhancedDataTable } from "@/components/crm/ui";
```

If you can't find something in `crm/ui`, look in `@/components/ui` (Radix-
flavored primitives: `Dialog`, `Select`, `Tooltip`, `Tabs`, ...).

## Three rules you must internalize

1. **Brand color = `#2563EB` (blue-600)**. Never write a literal `#1E40AF`,
   `bg-blue-700`, or any other shade as "the brand color". Use `bg-primary`,
   `text-primary`, or the `primary` variant of components.
2. **Neutral = `slate-*` only.** Do not use `gray-*` or `zinc-*` for new code.
   `gray-*` shows up in legacy files and is being migrated out.
3. **Status colors = `emerald / amber / red / blue` × `100 / 500 / 700`** only.
   Other shades (slate-50, blue-600 for backgrounds, etc.) are off-limits
   for status — use `BadgeBase` with a `tone`.

Anything else must be justified in a PR description.

## Stack

- **Tailwind CSS v4** — atomic styling, `@theme` token contract
- **Radix UI** — headless primitives behind `@/components/ui/*`
- **Lucide React** — single icon library (no Heroicons, no FontAwesome)
- **Semi UI v2.96** — used only for a few legacy widgets; do **not** introduce in new code

## Where things live

```
src/components/
├── ui/                          ← Radix primitives + tokens (canonical)
│   ├── Button.tsx, card.tsx, badge.tsx, EmptyState.tsx
│   ├── dialog.tsx, dropdown-menu.tsx, tooltip.tsx, select.tsx, ...
│   └── index.ts                 ← barrel
└── crm/
    ├── ui/                      ← CRM-flavored compositions
    │   ├── BadgeBase.tsx        ← THE base for every domain badge
    │   ├── StatusBadge.tsx, RiskBadge.tsx, KYCStatusBadge.tsx, ...
    │   ├── PageHeader.tsx, FilterBar.tsx, EnhancedDataTable.tsx
    │   ├── Drawer.tsx, LoadingState.tsx, PlaceholderPage.tsx
    │   └── index.ts             ← barrel (also re-exports Button/Card/EmptyState)
    ├── clients/                 ← module-specific components
    └── clm/                     ← module-specific components
```
