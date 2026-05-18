# DESIGN.md — Tradepass Growth Platform

> AI coding agent design spec. Read this file to generate UI that matches the Tradepass design system.

---

## 1. Visual Theme & Atmosphere

**Character:** Professional SaaS dashboard — clean, data-dense, trustworthy. Built for financial services sales teams who spend 8+ hours a day in the tool.

**Tone:** Calm authority. No playfulness. No gradients. No shadows that scream. Whitespace is earned, not default.

**Density:** Medium-high. Cards are compact, type is small (base 14px), padding is restrained (16–20px). Every pixel should carry information.

**Design philosophy:**
- Light background (`#F5F6F8`) with white surfaces — never pure white on white
- A single indigo accent (`#3B5BDB`) used sparingly for primary actions and active states
- Semantic colors (green/red/amber) only for status, trend, and alerts — never decoration
- Borders define structure; shadows are almost invisible (`0 1px 4px rgba(0,0,0,.06)`)

---

## 2. Color Palette & Roles

### Background & Surface

| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#F5F6F8` | Page background, hover state background |
| `--surface` | `#FFFFFF` | Card backgrounds, topbar, sidebar |
| `--surface-sub` | `#FAFAFA` | Table header background, secondary surfaces |

### Borders

| Token | Hex | Role |
|-------|-----|------|
| `--border` | `#EAEDF1` | Default card/input borders |
| `--border-lt` | `#F0F2F5` | Subtle dividers inside cards/tables |

### Primary Accent — Indigo

| Token | Hex | Role |
|-------|-----|------|
| `--accent` | `#3B5BDB` | Primary buttons, active nav item, links, focus rings |
| `--accent-lt` | `#EEF2FF` | Accent badge backgrounds, selected row highlight |
| `--accent-dk` | `#2F4AC2` | Button hover state |

### Semantic Colors

| Token | Hex | Role |
|-------|-----|------|
| `--green` | `#2F9E44` | Positive trend, success, "converted" status |
| `--green-lt` | `#EBFBEE` | Green badge/tag background |
| `--red` | `#E03131` | Negative trend, error, "dropped" status |
| `--red-lt` | `#FFF5F5` | Red badge/tag background |
| `--amber` | `#E67700` | Warning, pending, churn risk |
| `--amber-lt` | `#FFF9DB` | Amber badge/tag background |

### Text

| Token | Hex | Role |
|-------|-----|------|
| `--t1` | `#111827` | Primary text — headings, values, labels |
| `--t2` | `#374151` | Secondary text — body copy |
| `--t3` | `#6B7280` | Tertiary — helper text, placeholders |
| `--t4` | `#9CA3AF` | Disabled, meta labels, topbar subtitle |

---

## 3. Typography Rules

**Font family:** `'Inter', system-ui, sans-serif`

**Base size:** `14px` on `<html>` — all sizes are relative to this.

**Anti-aliasing:** `-webkit-font-smoothing: antialiased`

### Type Scale

| Class / Usage | Size | Weight | Color | Notes |
|--------------|------|--------|-------|-------|
| Page title (topbar) | `16px` | 700 | `--t1` | `.tb-title` |
| Page subtitle | `11px` | 400 | `--t4` | `.tb-sub` |
| Section / card title | `13px` | 700 | `--t1` | `.card-title` |
| Card subtitle | `11px` | 400 | `--t4` | `.card-subtitle` |
| KPI value | `24px` | 700 | `--t1` | Letter-spacing: −0.5px |
| Stat card large value | `28px` | 700 | `--t1` | |
| Body / table cell | `12px` | 400 | `--t2` | `.data-table` |
| Table header | `12px` | 600 | `--t3` | |
| Stat label (caps) | `11px` | 500 | `--t4` | Uppercase, letter-spacing: 0.05em |
| Badge / tag | `10–11px` | 600 | varies | |
| Button | `12–13px` | 500–600 | varies | |

---

## 4. Component Stylings

### Buttons

```
Primary (.btn-primary / .btn-action-primary):
  background: #3B5BDB  |  color: #fff
  padding: 7px 14px  |  border-radius: 6px (--r-sm)
  font-size: 12–13px  |  font-weight: 500–600
  hover: background #2F4AC2

Ghost (.btn-ghost / .btn-action-ghost):
  background: transparent  |  color: --t2  |  border: 1px solid --border
  hover: background --bg  |  border-color --accent  |  color --accent
```

**Rules:**
- Buttons inside Topbar use `.btn-action-*` (smaller, 12px)
- Page-level CTAs use `.btn-primary` / `.btn-ghost` (13px)
- Icon + label gap is always `6px`
- No rounded pill buttons — always `border-radius: var(--r-sm)` (6px)

### Cards

```
.card:
  background: #FFFFFF
  border: 1px solid #EAEDF1
  border-radius: 14px (--r-lg)
  overflow: hidden

.card-header:
  padding: 14px 18px
  border-bottom: 1px solid #F0F2F5

.card-body:
  padding: 14px 18px
```

### KPI / Stat Cards

```
.kpi-card / .stat-card:
  background: #FFFFFF
  border: 1px solid #EAEDF1
  border-radius: 14px (--r-lg)   ← always --r-lg, never --r-md
  padding: 16–20px

Value:  24–28px  |  weight 700  |  color --t1
Label:  11–12px  |  color --t3 or --t4
Delta badge: pill (border-radius 99px), green-lt/red-lt background
```

### Tags & Badges

```
.tag:
  padding: 2px 8px  |  border-radius: 99px  |  font-size: 11px  |  weight 500

Semantic variants:
  .green  → bg #EBFBEE  text #2F9E44
  .red    → bg #FFF5F5  text #E03131
  .amber  → bg #FFF9DB  text #E67700
  .blue   → bg #EEF2FF  text #3B5BDB
  .vip    → bg rgba(137,87,229,.15)  text #8957E5

.badge: 10px font, 2px 6px padding, pill shape
```

### Inputs & Form Fields

```
background: --surface
border: 1px solid --border
border-radius: --r-sm (6px)
padding: 7px 10px
font-size: 13px
color: --t1
focus: outline 2px solid --accent-lt, border-color --accent
placeholder: color --t4
```

### Table

```
.data-table:
  font-size: 12px
  th: background --surface-sub  |  color --t3  |  font-weight 600
  td: padding 10px 12px  |  border-bottom 1px solid --border-lt
  row hover: background --bg
  row selected: background --accent-lt
```

### Topbar

```
height: 64px  |  background: --surface  |  border-bottom: 1px solid --border
padding: 0 20px
Title: 16px 700 --t1
Subtitle: 11px --t4
Right actions wrapped in .topbar-actions (flex, gap 8px, flex-shrink 0)
```

### Sidebar

```
width: 212px  |  background: --surface  |  border-right: 1px solid --border
Nav item active: background --accent-lt  |  color --accent  |  font-weight 600
Nav item hover: background --bg
Logo: SVG hexagon with bar chart, indigo #818cf8
```

### Modal / Drawer

```
Overlay: rgba(0,0,0,.4) fixed backdrop
Modal box:
  background: --surface  |  border-radius: --r-lg (14px)
  box-shadow: 0 20px 60px rgba(0,0,0,.15)
Header: padding 16px 20px, border-bottom 1px solid --border
Footer: padding 12px 20px, border-top 1px solid --border, flex justify-end gap 8px
Max-width: 500–680px depending on content
```

---

## 5. Layout Principles

### Spacing Scale

| Token | Value | Common use |
|-------|-------|-----------|
| `--r-sm` | `6px` | Buttons, inputs, small elements |
| `--r-md` | `10px` | Medium elements (avoid on cards) |
| `--r-lg` | `14px` | Cards, modals, KPI cards |
| `99px` | — | Pills (tags, badges, avatars) |

### Spacing / Padding

- Content area: `padding: 20px 20px 0`
- Gap between sections: `16px`
- Card internal padding: `14px 18px` (header/body) or `16–20px` (KPI/stat cards)
- Topbar padding: `0 20px`
- Page toolbar height: `52px`
- Gap between grid items: `12–16px`

### Grid System

```
.grid-2  →  repeat(2, 1fr)   gap 12px
.grid-3  →  repeat(3, 1fr)   gap 12px
.grid-4  →  repeat(4, 1fr)   gap 12px
.grid-5  →  repeat(5, 1fr)   gap 12px
.stats-grid-4  →  repeat(4, 1fr)  gap 16px  (KPI rows)
.layout-split  →  1fr 300px   (main + right panel)
```

### Page Structure

```
<AppLayout>              ← flex row, full viewport
  <Sidebar />            ← 212px fixed left
  <AppMain>              ← flex-col, flex 1
    <Topbar />           ← 64px fixed top
    <div.content-area>   ← flex-col, gap 16px, overflow-y auto, padding 20px 20px 0
      {page content}
    </div>
  </AppMain>
</AppLayout>
```

---

## 6. Depth & Elevation

**Philosophy:** Flat-first. Elevation is achieved through background contrast (`--bg` vs `--surface`), not shadows.

| Level | Treatment |
|-------|-----------|
| Page background | `#F5F6F8` |
| Card / surface | `#FFFFFF` + `1px solid #EAEDF1` |
| Hover / active state | `background: --bg` (no shadow change) |
| Focused input | `outline: 2px solid --accent-lt` |
| Modals | `box-shadow: 0 20px 60px rgba(0,0,0,.15)` |
| Default card shadow | `0 1px 4px rgba(0,0,0,.06)` — used sparingly |

**Transitions:** All interactive elements use `transition: all 180ms ease` (`--ease`).

---

## 7. Do's and Don'ts

### ✅ Do

- Use `var(--r-lg)` (14px) for all cards and KPI tiles — never mix with `--r-md` on cards
- Use semantic colors (`--green`, `--red`, `--amber`) for status and trends only
- Keep font sizes small: base body is 12px, labels are 11px, only values go 24px+
- Use pill shape (`border-radius: 99px`) exclusively for tags, badges, and avatars
- Wrap all Topbar right-side controls in `.topbar-actions` to prevent layout shift when items appear/disappear
- Use `--accent-lt` as hover/selected background — never apply `--accent` directly as background on interactive rows
- Add `flex-shrink: 0` to fixed-width sidebar and action groups

### ❌ Don't

- Don't use gradients anywhere in the UI
- Don't use emoji as icons — use SVG icon components (see `src/components/Icons.tsx`)
- Don't put `padding-top` or `margin-top` inside `content-area` children — the parent gap handles vertical rhythm
- Don't define `border-radius` inline — always use CSS variables `--r-sm/md/lg`
- Don't mix `--r-md` and `--r-lg` on cards within the same page
- Don't use `box-shadow` as a hover effect — use `background: var(--bg)` instead
- Don't exceed `font-weight: 700` anywhere
- Don't use colored backgrounds on cards — surfaces are always `#FFFFFF`

---

## 8. Responsive Behavior

This is a desktop-first dashboard application. The primary viewport is `1280px–1920px`.

| Breakpoint | Behavior |
|-----------|---------|
| `>= 1280px` | Full sidebar + content, all grid columns visible |
| `1024px–1280px` | Sidebar may collapse to icon-only (212px → 56px) |
| `< 1024px` | Not a primary target; sidebar hides behind overlay |

**Touch targets:** Minimum `32px` height for all interactive elements (buttons, table rows, nav items).

**Grid collapse:** `grid-4` → `grid-2` below 1024px. `grid-5` → `grid-3`.

**Modals:** Full-width on screens < 640px, centered with `max-width: 500–680px` otherwise.

---

## 9. Agent Prompt Guide

### Quick color reference (copy-paste ready)

```
bg:           #F5F6F8
surface:      #FFFFFF
border:       #EAEDF1
accent:       #3B5BDB
accent-light: #EEF2FF
text-primary: #111827
text-secondary:#374151
text-muted:   #6B7280
text-faint:   #9CA3AF
green:        #2F9E44
red:          #E03131
amber:        #E67700
```

### Prompts for AI agents

**To generate a new page:**
> "Create a dashboard page following the DESIGN.md for Tradepass. Use `--bg` (#F5F6F8) as page background, white cards with 1px `--border` (#EAEDF1) and `--r-lg` (14px) radius. Top row should be 4 KPI cards in a `.stats-grid-4` grid. Use Inter font, 14px base size. All icons from `src/components/Icons.tsx` — no emoji."

**To generate a stat/KPI card:**
> "Stat card: white background, `border: 1px solid #EAEDF1`, `border-radius: 14px`, padding 20px. Label: 11px uppercase #9CA3AF. Value: 28px bold #111827. Delta: pill badge, green `#EBFBEE/#2F9E44` for positive, red `#FFF5F5/#E03131` for negative."

**To generate a data table:**
> "Table with `font-size: 12px`. Header: `background #FAFAFA`, `color #6B7280`, `font-weight 600`. Rows: `border-bottom 1px solid #F0F2F5`, hover `background #F5F6F8`. Selected row: `background #EEF2FF`."

**To generate a modal:**
> "Modal: white surface, `border-radius: 14px`, `box-shadow: 0 20px 60px rgba(0,0,0,.15)`. Header: `padding 16px 20px`, `border-bottom 1px solid #EAEDF1`. Footer: `padding 12px 20px`, `border-top 1px solid #EAEDF1`, flex row, justify-end, gap 8px."

**Icon system:**
> "Import SVG icons from `src/components/Icons.tsx`. Available: IconHome, IconPipeline, IconUsers, IconChart, IconSettings, IconPlus, IconSearch, IconFilter, IconEdit, IconTrash, IconCheck, IconX, IconChevronDown, IconChevronRight, IconPhone, IconMail, IconStar, IconFlag, and 50+ more. Size: 14–16px, color `currentColor`."
