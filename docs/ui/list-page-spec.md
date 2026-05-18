# List Page Spec — v1 (2026-05-15)

The canonical pattern every list page in the CRM should follow.
Reference implementation: **`/crm/clients`** (the most-evolved list page).

---

## 0. TL;DR — What does a list page look like?

```
┌──────────────────────────────────────────────────────────────────────┐
│ Breadcrumb                                                           │
├──────────────────────────────────────────────────────────────────────┤
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐                                        │
│ │KPI│ │KPI│ │KPI│ │KPI│ │KPI│ │KPI│   ← `<ListStatsGrid>` (optional)  │
│ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘                                        │
├──────────────────────────────────────────────────────────────────────┤
│ [🔍 Search] ‖ [Chip1][Chip2]... [⚙ Advanced]   [+ Primary CTA]      │  ← `<ListToolbar>`
├──────────────────────────────────────────────────────────────────────┤
│ ╔══════════════════════════════════════════════════════════════════╗ │
│ ║ Toolbar: count · selection · bulk · Columns · Export · 1°CTA     ║ │
│ ╟──────────────────────────────────────────────────────────────────╢ │  ← `<EnhancedDataTable>`
│ ║ ☐  Col1   Col2   Col3   ...                                       ║ │
│ ║ ☐  ...                                                           ║ │
│ ╚══════════════════════════════════════════════════════════════════╝ │
│                                                                      │
│ 共 X 条  每页 20 ▾                       上一页 1 2 3 ... 下一页    │  ← `<TablePagination>`
└──────────────────────────────────────────────────────────────────────┘
```

---

## 1. Components & Slots

| Slot | Component | Purpose |
|------|-----------|---------|
| Page wrapper | `<ListPageShell>` | Breadcrumb + outer spacing + error/empty states |
| Stats | `<ListStatsGrid>` | 4-6 clickable KPI cards that double as one-click filters |
| Toolbar | `<ListToolbar>` | Search + quick chips + advanced filter button + primary CTA |
| Advanced drawer | `<AdvancedFilterDrawer>` | Right-side drawer for multi-condition filtering |
| Table | `<EnhancedDataTable>` | Existing; supports `bulkActions` + `primaryAction` + `exportable` |
| Pagination | `<TablePagination>` | Bottom-of-table page selector + page size |

All exported from `@/components/crm/list`.

---

## 2. Design language (non-negotiable)

### Color
- **Default** = slate (gray) everywhere
- **Red** = "this needs attention" (violations, frozen, critical)
- **Amber** = "watch this" (pending, medium risk, warnings)
- **Emerald** = "all good" (verified, active, low risk)
- **Blue** = navigation accent only (active links, info banners)

❌ **No** rainbow color schemes. No 6-color tints on KPI cards.

### Typography
- Section labels: `text-xs font-semibold uppercase tracking-wider text-slate-500`
- Numbers: `tabular-nums`, primary text `text-slate-900`
- Body: `text-sm text-slate-700` for content, `text-slate-500` for labels

### Spacing
- Outer card chrome: `bg-white rounded-xl border border-slate-200`
- Card padding: `p-4` (sm) or `p-6` (md)
- Row gaps: `gap-3` between cards, `gap-2` within rows
- Vertical rhythm: `space-y-3` for stacked cards

### Icons
- **No** decorative icons next to data values
- Icons only in: buttons, status indicators, empty states, brand marks
- Size: `w-3.5 h-3.5` (sm) or `w-4 h-4` (md)

---

## 3. Toolbar behavior

### Order (left → right)
1. **Search** — capped at `w-80 sm:max-w-xs` (320px). Debounce 250ms before propagating.
2. **Divider** — 1px slate-200, vertical, hidden on small screens
3. **Quick chips** — 3-5 most-common single-value filters; toggle to apply, click again to clear
4. **Advanced filter button** — opens right drawer; shows red `N` badge when ≥1 advanced filter active
5. **Primary CTA** — right-aligned (`ml-auto`); solid blue; only one CTA per page

### Quick chip rules
- Each chip applies a single filter key (e.g., `{ status: "active" }`)
- Click on already-active chip clears those keys
- Visual tones: emerald / amber / red / violet / slate (max 5 chips)
- Truth source: the parent's `filters` state — chips read it to know which are active

### Advanced drawer
- Right-side, fixed width `~480px`
- Edits a `draft` copy locally; Apply commits, Reset clears the draft, Clear All wipes live filters
- Fields use chip groups for enums, text/number inputs for ranges, dropdowns for catalog lookups

### Primary CTA semantics
- One per page maximum
- For data-entry forbidden domains (e.g., clients in forex back-office), use "Invite" / "Generate Link" semantics, not "+ New"

---

## 4. Stats grid behavior

### Layout
- 4-6 cards in a 2-col / 4-col / 6-col responsive grid
- Each card: label + big number + optional tone
- Optional `onClick` makes the card a one-click filter shortcut

### Click semantics
- Clicking applies the card's `filter` patch
- Clicking again (when active) clears those keys
- The currently-active card shows a colored `ring-2`

### When to render
- ✅ Pages with ≥50 rows total, where category breakdown is meaningful
- ❌ Pages with <20 rows or no clear groupings

---

## 5. Table conventions

### Toolbar (top of `<EnhancedDataTable>`)
Persistent — always renders (no layout jump on selection):
- **Left**: selection count + clear, when `selectable` + `bulkActions` present
- **Right**: bulk actions (dimmed when 0 selected) · Export · Columns · `primaryAction`

### Columns
- Pin "primary identifier" (e.g., UID, Case ID) to left edge — `fixSelectionLeft`
- Pin row actions (`…` menu) to right edge — `fixActionsRight`
- Hideable: every column unless `hideable: false`; user toggles via Columns button
- Persistence: `tableId` prop scopes hidden state to `localStorage`

### Row interactions
- `onRowClick` → navigate to detail page (full row clickable)
- `rowActions` → `…` overflow menu, shown on hover or always

### Bulk actions
- Always render the buttons; dim/disable when 0 selected
- 3-5 actions max; overflow to `…` if more
- Confirm destructive bulk operations (`window.confirm` or modal)

---

## 6. Pagination

- Default 20/page; user can pick 10/20/50/100
- Page window: 1 ... currentNeighbors ... last (max 7 buttons visible)
- Bottom-left: `共 N 条 · 每页 X` selector
- Bottom-right: prev/next + page numbers

---

## 7. URL state contract

Filter state SHOULD be reflected in the URL query string so:
- Deep links work
- Browser back/forward navigates filter state
- Bookmarks survive

Convention:
- Single-value: `?status=active`
- Multi-value: `?country=CN,HK,SG` (comma-separated)
- Pagination: `?page=2&pageSize=50`
- Tab/view: `?tab=funds`

Use `useSearchParams` + `router.replace` (not `push` — avoids history bloat).

---

## 8. Variations & escape hatches

It's OK to deviate when:
- **Inline tables** in a tab (e.g., "Recent activity" inside Overview tab) — use plain `<EnhancedDataTable>` without the full shell
- **Special domains** like Risk Graph (visual canvas, not tabular) — different page type
- **Hyper-dense ops surfaces** like Approvals Inbox — may add a "view mode" toggle (table / kanban / split)

Document the deviation in code comments referencing this spec.

---

## 9. Anti-patterns (forbidden)

- ❌ Two parallel search boxes on the same page
- ❌ KPI cards with 6 different background tints (rainbow dashboards)
- ❌ Decorative icons next to every data value
- ❌ Modal-based filters (use drawer instead — non-blocking, dismissible)
- ❌ Primary CTA inside `bulkActions` (dimmed when nothing selected — wrong)
- ❌ Re-implementing pagination, search, or column visibility per page
- ❌ Hardcoded Chinese / English strings (always go through `useT()`)

---

## 10. Migration guide (old → new)

```diff
- import { FilterBar } from "@/components/crm/ui/FilterBar";
+ import { ListToolbar, ListStatsGrid, TablePagination, ListPageShell } from "@/components/crm/list";

- <FilterBar filters={...} searchable searchPlaceholder=... onSearch={...} />
+ <ListToolbar
+   search={search}
+   onSearchChange={setSearch}
+   quickChips={QUICK_CHIPS}
+   filters={filters}
+   onFilterChange={patchFilters}
+   advancedFields={ADVANCED_FIELDS}
+   advancedCount={advancedCount}
+   primaryAction={{ label: "邀请客户", onClick: handleInvite }}
+ />
```

Migrated pages dashboard (update as we go):

| Page | Status |
|------|--------|
| `/crm/clients` | ✅ Migrated (reference) |
| `/crm/clm/cases` | ✅ Migrated (sample for v1 spec) |
| `/crm/clm/review-queue` | ⬜ Pending |
| `/crm/clients/tags` | ⬜ Pending |
| `/crm/clients/segments` | ⬜ Pending |
| `/crm/funds/deposits` | ⬜ Pending |
| `/crm/funds/withdrawal-review` | ⬜ Pending |
| `/crm/trading/orders` | ⬜ Pending |
| `/crm/system/staff` | ⬜ Pending |
| ... | (30+ more) |

---

## 11. Owner & changelog

- **Owner**: CRM UX team
- **Last reviewed**: 2026-05-15
- **Reference impl**: `/Users/.../src/app/crm/clients/page.tsx`
- **Component source**: `/Users/.../src/components/crm/list/`

| Date       | Change |
|------------|--------|
| 2026-05-15 | v1: spec written, 4 components extracted, cases list migrated as sample |
