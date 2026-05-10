# Usage Guidelines

The "what to do, what never to do" cheatsheet for the CRM. Read once,
then refer back when you're tempted to deviate.

---

## 1. The three iron rules

### 1.1 Brand color is `#2563EB` — and only `#2563EB`

```tsx
// ✅ Right
<Button>Save</Button>                         // uses bg-primary internally
<a className="text-primary hover:underline">Read more</a>
<div className="ring-2 ring-primary/40">...</div>

// ❌ Wrong
<button className="bg-blue-600 ...">Save</button>
<a className="text-[#2563EB]">Read more</a>
<div className="ring-2 ring-blue-500/40">...</div>
```

If primary needs to "shift" (hover, active, focus), use opacity or the
related tokens, not a different shade:

| State | Solution |
|-------|----------|
| Hover | `hover:opacity-90` (Buttons do this internally) |
| Active / pressed | `active:bg-primary-dark` (rare; usually not needed) |
| Focus ring | `focus-visible:ring-2 focus-visible:ring-primary` |
| Disabled | `disabled:opacity-50` |

### 1.2 Neutral grey is `slate-*`

```tsx
// ✅ Right
<p className="text-slate-500">helper text</p>
<div className="border-b border-slate-200">...</div>
<aside className="bg-slate-50 p-4">...</aside>

// ❌ Wrong (creeps in via copy-paste)
<p className="text-gray-500">helper text</p>
<p className="text-zinc-500">helper text</p>
<p className="text-neutral-500">helper text</p>
```

Surfaces that change with theme should use **token utilities** instead of
literal slate values:

| Need | Token | Slate equivalent (light only) |
|------|-------|------------------------------|
| Page background | `bg-background` | `bg-slate-50` |
| Card surface | `bg-card` | `bg-white` |
| Body text | `text-foreground` | `text-slate-900` |
| Muted text | `text-muted-foreground` | `text-slate-500` |
| Default border | `border-border` | `border-slate-200` |

> Pages that already use `text-slate-*` widely don't need a forced rewrite —
> they remain visually correct. Use the token form for **new** components
> and for any element that should respond to dark mode.

### 1.3 Status colors are `100 / 500 / 700` of `emerald / amber / red / blue`

```tsx
// ✅ Right
<BadgeBase tone="success">Approved</BadgeBase>
<div className="bg-red-100 border border-red-200 text-red-700 p-3 rounded-lg">
  Withdrawal failed
</div>

// ❌ Wrong
<span className="bg-emerald-50 border border-emerald-200 text-emerald-600 ...">
  Approved
</span>
<span className="bg-emerald-200 text-emerald-900 ...">Approved</span>
```

The fixed soft/solid/strong rule (100/500/700) keeps inline alerts,
badges, and subtle indicators visually compatible. It also keeps a11y
contrast predictable.

---

## 2. Layout & spacing

### 2.1 Page chrome

Every CRM page has the same outer chrome — already provided by
`src/app/crm/ClientLayout.tsx`. Inside the page:

```tsx
export default function MyListPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="..."
        description="..."
        actions={<Button>...</Button>}
      />
      <FilterBar fields={...} onFilterChange={...} />
      <EnhancedDataTable ... />
    </div>
  );
}
```

- Outer `space-y-6` (24px) between major page sections
- `space-y-4` (16px) between cards inside a section
- `space-y-2` (8px) between label/value pairs

### 2.2 Card composition

```tsx
// Stat card (compact)
<Card padding="md">
  <p className="text-sm text-slate-500">Pending KYC</p>
  <p className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">128</p>
</Card>

// Section card with header
<Card padding="none">
  <div className="px-5 py-4 border-b border-slate-200">
    <h3 className="text-base font-semibold text-slate-900">Recent activity</h3>
  </div>
  <div className="p-5 space-y-3">
    ...
  </div>
</Card>
```

> Cards never have a colored fill except for status alerts. Don't set
> `bg-blue-50` on a generic info card — use a leading icon and slate tone.

### 2.3 Forms

- Each label uses `<Label>` from `@/components/ui` — never raw `<label>`.
- Field gap: `space-y-1.5` between label and input, `space-y-4` between fields.
- Input height: 40 (`h-10`) — matches default Button height.
- Required asterisk: `text-red-500 ml-0.5` after the label text.

### 2.4 Breakpoints

CRM is a desktop-first product. Pages assume `lg` (1024px+) as the working
canvas. `sm/md` exists for graceful collapse only. Don't design layouts
around `sm` (e.g., never write a "mobile-first" CRM page).

---

## 3. Iconography

- One library: **`lucide-react`**. Don't introduce Heroicons / FontAwesome / Material Icons.
- Standard sizes: `w-4 h-4` (inline / button) and `w-5 h-5` (page header / empty state).
- Icon color follows surrounding text color (no explicit `text-*` unless emphasizing).
- Icons in buttons go **before** the label, with `gap-2` from the parent.

```tsx
import { Plus } from "lucide-react";

<Button>
  <Plus className="w-4 h-4" />
  New client
</Button>
```

---

## 4. Numbers & data

### 4.1 Currency / IDs / timestamps → `font-mono tabular-nums`

```tsx
<span className="font-mono tabular-nums">UID-08234</span>
<span className="font-mono tabular-nums">$12,345.67</span>
<span className="font-mono tabular-nums text-slate-500">2026-04-12 09:33:22</span>
```

### 4.2 Positive / negative deltas

```tsx
<span className={cn(
  "font-mono tabular-nums",
  delta >= 0 ? "text-emerald-600" : "text-red-600"
)}>
  {delta >= 0 ? "+" : ""}{delta.toLocaleString()}
</span>
```

> Don't use 100/700 for delta text — that's for badges. For inline plain
> text, 600 is correct.

### 4.3 Percentages

`{n.toFixed(1)}%` — always 1 decimal in the CRM. Don't mix `0` and `2`
decimal pages.

---

## 5. Interaction patterns

### 5.1 Confirmation

Use `<ConfirmDialog>` from `@/components/ui` for destructive or
irreversible actions (delete, freeze, mass-approve, ...). Never use
`window.confirm()`.

### 5.2 Optimistic feedback

Use `useToast()` to confirm completed actions. Toasts last 4s by default.

```tsx
toast({ title: "Account frozen", description: "UID 8821 has been frozen." });
```

### 5.3 Loading states

- Page-level: `<LoadingState />`
- Inline: `<Skeleton className="h-4 w-32" />`
- Button: `<Button loading>Saving</Button>`
- Table: pass `loading` prop to `<EnhancedDataTable />`

### 5.4 Empty states

`<EmptyState />` — provide a useful action when possible. Don't ship a
page that just says "No data" with no next step.

---

## 6. Accessibility (WCAG 2.1 AA)

- Color contrast: `slate-500` on `white` is 4.5:1 — minimum for body text.
  Don't drop below `slate-500` for plain text. `slate-400` is for
  placeholders only.
- All interactive elements must have `focus-visible:ring-2`.
  Buttons / Inputs / Cards-as-buttons all do this by default.
- Every input needs an associated `<Label>`.
- Tooltips do not replace labels for icon-only buttons — also pass `aria-label`.
- Tables must have visible column headers. Don't hide them in a `sr-only` mode.

---

## 7. Migration notes (legacy code)

These exist in legacy files; **do not propagate** to new code.

| Legacy pattern | Why it exists | Acceptable to leave / fix when touching |
|---|---|---|
| `text-gray-*`, `bg-gray-*`, `border-gray-*` | Pre-redesign default | Convert to `slate` if you're already editing the file. Otherwise leave. |
| `bg-blue-600` directly (not via `Button`) | Pre-token CTA | Convert to `bg-primary`. |
| Inline status spans with `bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5` | Pre-`BadgeBase` | Convert to `<BadgeBase tone="success">…</BadgeBase>`. |
| `dark:bg-slate-800 dark:text-white` on a page element | Forgotten dark mode handling | Convert to token (`bg-card text-foreground`). |
| `padding="md"` on `Card` from `crm/ui` | Compatibility wrapper | Fine to keep; equivalent to canonical Card with `<CardContent>`. |

---

## 8. Pull-request checklist

Before merging UI work:

- [ ] No new `gray-*` / `zinc-*` / `neutral-*` class names introduced
- [ ] No new literal hex (`#2563EB`, `#0F172A`, …) in TSX/CSS — use tokens
- [ ] Every status indicator goes through `BadgeBase` or one of its
      domain wrappers
- [ ] Every list view uses `<EnhancedDataTable>` (or has a written
      reason if it doesn't fit)
- [ ] No raw `<button>` for click handlers — use `<Button>`
- [ ] Buttons / inputs / cards have proper focus rings and disabled states
- [ ] No inline `style={…}` other than dynamic positioning
- [ ] No `dark:` classes added to page components

If a check trips, either fix it or add a one-line note in the PR
description explaining why.
