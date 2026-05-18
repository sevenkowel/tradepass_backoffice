# Design Tokens

> The CRM's atom layer. These values live in [`src/app/globals.css`](../../src/app/globals.css)
> and are exposed to Tailwind v4 via `@theme`. Do not duplicate them in
> component files; reference them by token.

---

## 1. Color system

### 1.1 Brand

Brand is a single hue family (blue-600). Hover / active states are a single
step lighter / darker — do not invent intermediate shades.

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--color-primary` | `#2563EB` | `blue-600` | Primary action, key links, focus ring, selected state |
| `--color-primary-light` | `#3B82F6` | `blue-500` | Hover lift, secondary brand accents |
| `--color-primary-dark` | `#1D4ED8` | `blue-700` | Active / pressed state |
| `--color-primary-foreground` | `#FFFFFF` | — | Text on a primary surface |

**Utilities:** `bg-primary`, `text-primary`, `border-primary`, `ring-primary`,
`bg-primary/90` (hover with 90% opacity).

### 1.2 Neutral — `slate-*` only

The CRM uses `slate-*` exclusively for grey surfaces, borders, and text.
`gray-*` and `zinc-*` are forbidden in new code.

| Tailwind | Hex | Typical role |
|----------|-----|--------------|
| `slate-50`  | `#F8FAFC` | Page background, muted row hover |
| `slate-100` | `#F1F5F9` | Subtle backgrounds, separators, skeletons |
| `slate-200` | `#E2E8F0` | Default border |
| `slate-300` | `#CBD5E1` | Disabled border, scrollbar track |
| `slate-400` | `#94A3B8` | Placeholder text, disabled text, muted icon |
| `slate-500` | `#64748B` | Secondary text, helper copy |
| `slate-600` | `#475569` | Tertiary text, ghost button text |
| `slate-700` | `#334155` | Body text on white surface |
| `slate-800` | `#1E293B` | Heading on white surface (rare; prefer `slate-900`) |
| `slate-900` | `#0F172A` | Primary text, headings |

### 1.3 Surface tokens (theme-aware)

These adapt to dark mode via `[data-theme="dark"]`. Use them instead of
literal slate values whenever the surface needs to follow the theme.

| Token | Light value | Dark value | Tailwind utility |
|-------|-------------|------------|------------------|
| `--color-background` | `#F8FAFC` | `#0F172A` | `bg-background` |
| `--color-foreground` | `#0F172A` | `#F1F5F9` | `text-foreground` |
| `--color-card` | `#FFFFFF` | `#1E293B` | `bg-card` |
| `--color-card-foreground` | `#0F172A` | `#F1F5F9` | `text-card-foreground` |
| `--color-muted` | `#F1F5F9` | `#334155` | `bg-muted` |
| `--color-muted-foreground` | `#64748B` | `#94A3B8` | `text-muted-foreground` |
| `--color-border` | `#E2E8F0` | `#334155` | `border-border` |

### 1.4 Semantic / status colors

Status palettes are intentionally fixed (independent of theme) so that
"red = error" stays "red = error" in dark mode. Each palette uses three
slots — soft / solid / strong — and nothing else.

| Status | Soft (bg) | Solid (dot / icon) | Strong (text) |
|--------|-----------|--------------------|----------------|
| Success | `emerald-100` | `emerald-500` | `emerald-700` |
| Warning | `amber-100` | `amber-500` | `amber-700` |
| Error | `red-100` | `red-500` | `red-700` |
| Info | `blue-100` | `blue-500` | `blue-700` |

**Extended palette** (used only by `BadgeBase` for case-type categorization
where `success / warning / error / info` are not enough):
`purple`, `orange`, `teal`, `indigo`, `rose` — same `100 / 500 / 700` rule.

> **Hard rule:** never use `*-50`, `*-200`, `*-400`, `*-600`, `*-800`, `*-900`
> from a status palette. Only `100 / 500 / 700`.

---

## 2. Typography

### 2.1 Family

```css
--font-sans:    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
--font-heading: same as --font-sans;
--font-mono:    'SF Mono', 'JetBrains Mono', 'Roboto Mono', monospace;
```

`font-mono` is used for: account numbers, currency amounts, IDs, timestamps.
Always pair it with `tabular-nums`:

```tsx
<span className="font-mono tabular-nums">$12,345.67</span>
```

### 2.2 Size scale (CRM-tuned, no marketing-grade sizes)

| Token | px | Usage |
|-------|----|-------|
| `text-xs` | 12 | Badge text, table footer, helper labels |
| `text-sm` | 14 | Body text default, button label, table cell |
| `text-base` | 15 | Slightly bigger body (forms with dense fields) |
| `text-lg` | 16 | Subheadings, drawer titles |
| `text-xl` | 18 | Card titles |
| `text-2xl` | 20 | Page H1 (`PageHeader` default) |
| `text-3xl` | 24 | Hero stat numbers (workspace KPI cards) |

Do **not** use `text-4xl / 5xl / 6xl` in CRM. They belong to marketing pages.

### 2.3 Weight

| Token | Value | Usage |
|-------|-------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Buttons, badge text, table headers |
| `font-semibold` | 600 | Headings, card titles, strong emphasis |

Do **not** use `font-bold` in body text. Reserve it for stat numbers in
KPI cards if needed.

### 2.4 Line height

- Body / cells / labels: `leading-normal` (1.5) — Tailwind default
- Headings: `leading-tight` (1.25)
- Multi-line buttons: never; buttons are single-line

### 2.5 Letter spacing

- Headings: `tracking-tight` (-0.015em) — already applied globally to `h1..h6`
- Uppercase tags / labels: `tracking-wide`
- Body: default

---

## 3. Spacing

CRM-tuned scale, 7 stops. No marketing-style hero spacing.

| Token | px | Tailwind | Usage |
|-------|----|----------|-------|
| `--space-xs` | 4 | `gap-1`, `p-1` | Icon padding, dot offsets |
| `--space-sm` | 8 | `gap-2`, `p-2` | Compact inline gap |
| `--space-md` | 12 | `gap-3`, `p-3` | Default control padding |
| `--space-lg` | 16 | `gap-4`, `p-4` | Card body, list spacing |
| `--space-xl` | 24 | `gap-6`, `p-6` | Section spacing, page gutter |
| `--space-2xl` | 32 | `gap-8`, `p-8` | Card-to-card vertical rhythm |
| `--space-3xl` | 48 | `gap-12`, `p-12` | Empty state hero gap (used sparingly) |

Anything bigger should not exist in a CRM page.

### 3a. Vertical rhythm — three tiers

Card-density is the most common bug we ship: lists feel cramped because nested
`space-y-*` collapse into each other. **Always use one of these three tiers**;
do not invent values.

| Tier | Tailwind | Where it applies |
|------|----------|------------------|
| Card gap | `gap-3` / `space-y-3` (12px) | **All** card-to-card spacing: three-column layout (`gap-3`), left/center/right column stacks (`space-y-3`), collapsible section lists. Unified across the entire CRM. |
| Intra-card stack | `space-y-3` (12px) | Inside a card, between content groups (e.g. header → body, `InfoRow` list, body → footer). |
| Inline groups | `space-y-2` (8px) | Tight clusters: comment thread items, condition rows, label → input pairs. |

> **Rule: card gap = 12px everywhere.**  
> The three-column body layout, all sidebar card stacks, and collapsible
> section lists all use `gap-3` / `space-y-3`. Do not use `gap-4` or
> `space-y-4` between sibling cards — that was the pre-unification default
> and is now incorrect.

---

## 4. Radius

| Token | px | When |
|-------|----|------|
| `--radius-sm` | 6 | Inline tags, dot capsules |
| `--radius-md` | 8 | Inputs, small controls, dropdown items |
| `--radius-lg` | 12 | Buttons, small cards, dropdown surfaces |
| `--radius-xl` | 16 | Large cards, dialogs, drawers |
| `--radius-full` | 9999 | Avatars, status dots, badges (`rounded-full`) |

> **Hard rule:** badges are always `rounded-full`. Buttons are always `rounded-xl`.
> Cards default to `rounded-2xl` (16px). Do not deviate per-page.

---

## 5. Shadow

| Token | Value | When |
|-------|-------|------|
| `--shadow-sm` | `0 1px 2px rgba(15,23,42,0.04)` | Cards (default), buttons |
| `--shadow-md` | `0 4px 6px -1px rgba(15,23,42,0.08), 0 2px 4px -2px rgba(15,23,42,0.06)` | Card hover, dropdown menu |
| `--shadow-lg` | `0 10px 15px -3px rgba(15,23,42,0.10), 0 4px 6px -4px rgba(15,23,42,0.08)` | Dialog, drawer, popover |

Tailwind utilities: `shadow-sm`, `shadow-md`, `shadow-lg`. Do not write
custom `shadow-[…]` arbitrary values.

---

## 6. Motion

| Token | Value | When |
|-------|-------|------|
| `--transition-fast` | `150ms ease-in-out` | Hover color shifts, focus rings |
| `--transition-base` | `200ms ease-in-out` | Default for color / border / opacity / transform |
| `--transition-slow` | `300ms ease-in-out` | Dialog enter/leave, drawer slide |

Tailwind: `transition-colors`, `duration-150`, `duration-200`, `duration-300`.

---

## 7. Breakpoints

Tailwind defaults — do not customize.

| Tailwind | Min width | When |
|----------|-----------|------|
| `sm` | 640 | Mobile landscape |
| `md` | 768 | Tablet |
| `lg` | 1024 | Small desktop / sidebar collapse threshold |
| `xl` | 1280 | Standard desktop |
| `2xl` | 1536 | Large desktop |

The CRM is designed-from `lg`. Smaller breakpoints exist for graceful
degradation only.

---

## 8. Dark mode

Triggered by `[data-theme="dark"]` on `<html>` (managed by `ThemeProvider`).

- Surface tokens (`bg-background`, `bg-card`, `text-foreground`,
  `text-muted-foreground`, `border-border`) automatically swap.
- Status palettes (emerald / amber / red / blue / etc.) **stay the same**.
- Brand `--color-primary` slightly lifts to `#3B82F6` in dark mode for
  better contrast against `#0F172A`.

> **Hard rule:** never write `dark:bg-…` in pages. Dark mode is a token-
> level concern. If a component needs special dark behavior, it goes
> behind a token, not a page-level conditional class.
