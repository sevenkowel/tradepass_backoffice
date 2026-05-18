# List page spec — canonical pattern

> The shape every list page in the CRM should follow.
> Reference implementation: `src/app/crm/clm/cases/page.tsx`.

---

## Visual layout (top to bottom)

```
┌─────────────────────────────────────────────────────────────────┐
│  Breadcrumb                                                      │  ← H1 lives on the last item
│                                                                  │
│  [🔍 Search ........]  [Chip A] [Chip B] [Chip C]   [Advanced]  │  ← Single toolbar row
│                                                                  │
│  Table (rounded card, integrated toolbar)                       │  ← Column visibility / sort / sticky
│  ├ thead (sortable columns, sticky)                              │
│  ├ tbody (clickable rows, sticky selection / actions)            │
│  └ ─────                                                         │
│                                                                  │
│  Showing 1–20 of N    [‹]  1  2  3  [›]                          │  ← Footer pagination
└─────────────────────────────────────────────────────────────────┘
```

**That's all.** No KPI strip, no descriptive sub-header, no "what is this page" copy.

---

## Four iron rules

### 0. Chips inside the table — only Status + SLA

**Inside the table body, badge components (chips with background) are
reserved for two columns**: the row's authoritative state (Status)
and urgency (SLA). Everything else uses **plain text with foreground
colour** if it needs to convey severity. A table where every column
is a coloured chip looks like a marketing dashboard, not a tool.

| Column | Render as |
|---|---|
| Status | `<BadgeBase>` (full chip — this is the row's identity) |
| SLA | `<SLABadge>` (chip — urgency must be loud) |
| Risk Level | **dot + text** (`<span class="inline-flex gap-1.5"><dot/>Critical</span>`) — foreground colour only |
| AML | **plain text** — `Hit` red+bold, others muted |
| Type / Channel / Source | plain text, slate-600 |
| Numeric / Date | plain text, font-mono tabular-nums |

`CaseTypeBadge`, `RiskBadge`, `AMLStatusBadge` live in the library
because they're useful **outside** tables (drawers, headers, popovers).
**Don't reach for them in table cells.**

### 1. No KPI grid above the toolbar
A 4–5-card stat strip duplicates information that's already in the chips'
counts and the table's status column. It looks polished in a screenshot
but adds nothing for the operator who looks at this page every day.

**Wrong**: `[Total][Pending][Reviewing][Escalated][High Risk]` stat cards
**Right**: Chips carry counts (e.g. "Pending 12"); table status column says the rest.

### 2. Three chips, not five
Quick chips are for the **high-actionability** filters — the 2–3 cases
the operator hits 80% of the time. Anything else goes in the Advanced
drawer. As a rule of thumb, only put a state in chips if you'd happily
have a dedicated button for it on the toolbar.

For Cases: `Pending`, `Escalated`, `AML hit`. Not `Reviewing` (covered
by Pending in the daily flow), not `High Risk` (low frequency, lives in
Advanced).

### 3. Neutral chip tones, brand-coloured active state
Chip `tone` should be **`slate`** unless there's a very strong semantic
reason for a colour. The "active" state already uses the primary brand
colour — that's enough signal. Multi-colour chip rows scream "look at
me" and turn a tool into a dashboard.

**Wrong**: `tone: "amber"`, `tone: "violet"`, `tone: "red"` on adjacent chips
**Right**: All chips `tone: "slate"`, active state automatically goes blue

---

## Components to use

| Concern | Component | Notes |
|---|---|---|
| Outer chrome | `<ListPageShell breadcrumb={...}>` | Wraps everything, owns breadcrumb |
| Toolbar | `<ListToolbar>` | Search + chips + Advanced button |
| Table | `<EnhancedDataTable tableId="…">` | Always pass `tableId` to scope localStorage |
| Pagination | `<TablePagination>` | Outside the table card, below |
| Advanced filters | `<AdvancedFilterDrawer>` | Triggered by toolbar's "Advanced" button |
| State | `useListWithFilters` hook | Don't reinvent page / filter / fetch state |

```tsx
const list = useListWithFilters<Row, Filters>({
  fetcher: ({ page, pageSize, filters }) =>
    rowService.list({ page, pageSize, ...filters }).then(r => ({
      items: r.items, total: r.total,
    })),
  initialFilters: {},
  pageSize: 20,
});
```

---

## Advanced filters — at most 4 fields

Same restraint applies to the drawer. Pick the 3–4 filters that the
operator actually wants to combine. Anything you can replace by a
sort/column-toggle on the table itself, do.

For Cases: `Status`, `Case Type`, `Risk Level`. Not `AML` (the hit
case has a chip), not `Decision mode` (the Decision column shows it).

---

## Single canonical example

`src/app/crm/clm/cases/page.tsx` is the v2 reference implementation.
Keep it short, keep it dense, keep it boring. When in doubt, look at
that file and match its weight.

---

## Anti-patterns (will fail review)

- ❌ A `<PageHeader>` with a `description` that explains the page in a sentence — pages should explain themselves
- ❌ Multi-colour chip rows
- ❌ A 5-card KPI strip
- ❌ `<FilterBar>` (the legacy filter component) — replaced by `<ListToolbar>`
- ❌ `<Card padding="md">` wrapping the toolbar — the toolbar lives inside `<EnhancedDataTable>` chrome
- ❌ Custom pagination — use `<TablePagination>`
- ❌ Defining a Toolbar in each page — use `<ListToolbar>`

---

## Migration checklist (for old list pages)

When converting a legacy page to the canonical pattern:

1. Replace `<Breadcrumb>` + `<PageHeader>` with `<ListPageShell breadcrumb={...}>`
2. Delete any KPI / Stats grid above the toolbar
3. Replace `<FilterBar>` with `<ListToolbar>` + `<AdvancedFilterDrawer>`
4. Cap chips at 3, all `tone: "slate"`
5. Cap advanced fields at 4
6. Pass `tableId` to `<EnhancedDataTable>`
7. Use `<TablePagination>` below the table card
8. Wire all filter mutation through `list.patchFilters` (the
   `useListWithFilters` hook's stable callback — don't wrap it locally
   with a new `useCallback`)

Pages still to migrate (as of 2026-05-15):
- `/crm/clm/review-queue`
- `/crm/clm/audit-trail`
- `/crm/risk/high-risk`
- `/crm/risk/device`
- `/crm/clients/*` legacy pages

---

## Why "boring" is the goal

The CRM is the operator's daily workspace. Every visual flourish costs
attention budget. If a page looks impressive in a screenshot but
operators don't notice it after week one, the impression was wasted.

Match the weight of OS-level tools (Finder, Outlook, JIRA's queue) —
**information first, chrome second**.
