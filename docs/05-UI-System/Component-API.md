# Component API

Public API for every shared component in the CRM. **One source per concept.**
If a piece of UI looks like it could be a primitive, check this doc before
writing it from scratch.

---

## Layer 1 — `@/components/ui` (canonical primitives)

These wrap Radix primitives + tokens. They are the **only** source for
their respective concepts.

### Button

```tsx
import { Button } from "@/components/ui/Button";
// or via the CRM barrel:
import { Button } from "@/components/crm/ui";

<Button>Save</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="destructive" loading>Delete</Button>
```

**Variants** (with backward-compat aliases):

| Canonical | Alias | Visual |
|-----------|-------|--------|
| `default` | `primary` | `bg-primary` filled, white text, soft shadow |
| `outline` | — | Transparent fill, slate-200 border |
| `secondary` | — | White fill, slate-200 thick border |
| `ghost` | — | Transparent, hover slate-100 |
| `link` | — | Primary-colored underlined text |
| `destructive` | `danger` | `bg-red-600` filled |

**Sizes** (with aliases):

| Token | Height | Notes |
|-------|--------|-------|
| `sm` | 32 | Use in tight spots: table row actions, drawer footers |
| `default` / `md` | 40 | Default for forms, page-level actions |
| `lg` | 48 | Hero CTAs only |
| `icon` | 40×40 | Icon-only buttons |

**Props:**

- `loading?: boolean` — shows a 16px spinner before children, disables click
- `disabled?: boolean` — applies `opacity-50` and `cursor-not-allowed`
- All standard `ButtonHTMLAttributes`

> **Rule:** never use raw `<button>` for interactive elements. Always go
> through this component (or a wrapper that delegates to it).

### Card (canonical, granular)

```tsx
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Account 8821</CardTitle>
    <CardDescription>Standard account · $12,300</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>...</CardFooter>
</Card>
```

Use this when you want explicit composition. For legacy single-prop usage
see the compat wrapper below.

### Card (compat — `padding` prop)

```tsx
import { Card } from "@/components/crm/ui";

<Card padding="md">...</Card>          // 20px padding (default)
<Card padding="none">...</Card>        // No padding (you control inner spacing)
<Card padding="sm">...</Card>          // 16px
<Card padding="lg">...</Card>          // 24px
```

`Card` from `@/components/crm/ui` is a thin wrapper that preserves the
historical single-prop API. Visually identical to the canonical Card
(white surface, slate-200 border, 16px radius, soft shadow).

### EmptyState

```tsx
import { EmptyState } from "@/components/crm/ui";  // re-exported
import { Inbox } from "lucide-react";

<EmptyState
  icon={<Inbox className="w-5 h-5" />}
  title="No cases yet"
  description="When a customer submits KYC, it will appear here."
  action={<Button size="sm">Open review queue</Button>}
/>
```

Props: `icon` (optional, defaults to `<Inbox/>`), `title`, `description`,
`action`, `className`.

### Other primitives in `@/components/ui`

| Component | Purpose |
|-----------|---------|
| `Dialog`, `DialogTrigger`, `DialogContent`, ... | Modal dialogs (Radix) |
| `Select`, `SelectTrigger`, `SelectContent`, ... | Form select (Radix) |
| `DropdownMenu`, ... | Action menus (Radix) |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Tab UI (Radix) |
| `Tooltip`, `TooltipTrigger`, `TooltipContent` | Hover tooltips (Radix) |
| `Toast`, `useToast` | Toast notifications |
| `Input`, `Textarea`, `Label`, `Checkbox`, `Switch`, `RadioGroup` | Forms |
| `Avatar`, `AvatarImage`, `AvatarFallback` | User avatars |
| `Badge` | **Generic** badge (rounded-full) — for non-domain use |
| `Breadcrumb`, `BreadcrumbList`, ... | Page breadcrumbs |
| `Pagination`, ... | List pagination (when `EnhancedDataTable` is overkill) |
| `Progress` | Progress bar |
| `Skeleton` | Loading skeleton |
| `Alert`, `AlertTitle`, `AlertDescription` | Inline alerts |

> If you find yourself writing `<table>`, `<dialog>`, or `<select>` directly,
> stop — use one of the above.

---

## Layer 2 — `@/components/crm/ui` (CRM-flavored compositions)

### PageHeader

```tsx
import { PageHeader, Button } from "@/components/crm/ui";

<PageHeader
  title="Clients"
  description="Manage all customers across all stages."
  actions={<Button>New client</Button>}
/>
```

Visual contract: `text-2xl font-semibold tracking-tight` title,
`text-sm text-slate-500` description, 24px bottom margin, actions right-
aligned on `sm+` and stacked on mobile.

### BadgeBase

The single primitive for every domain badge in the CRM. Every domain
badge (`StatusBadge`, `RiskBadge`, `KYCStatusBadge`, ...) is implemented
on top of it, so they share rhythm.

```tsx
import { BadgeBase } from "@/components/crm/ui";

<BadgeBase tone="success">Verified</BadgeBase>
<BadgeBase tone="warning" dot>Pending</BadgeBase>
<BadgeBase tone="neutral" dot={false}>Manual</BadgeBase>
<BadgeBase tone="primary" size="sm">KYC</BadgeBase>
```

**Tones:**
- Semantic: `neutral`, `primary`, `success`, `warning`, `error`, `info`
- Categorical: `purple`, `orange`, `teal`, `indigo`, `rose`

**Visual contract** (do not override):
- `rounded-full`
- Tone-mapped `bg-{tone}-100 text-{tone}-700`
- Optional 1.5px dot in `bg-{tone}-500`, leading 6px gap
- Sizes: `sm` (10px text, 1px dot) / `md` (12px text, 1.5px dot, default)

> **Rule:** if you're building a new "thing has a status" badge, build it
> on `BadgeBase`. Never inline `bg-emerald-100 text-emerald-700 rounded-full`.

### Domain badges (all built on `BadgeBase`)

```tsx
<StatusBadge status="active" />              // generic — looks up known statuses
<KYCStatusBadge status="verified" />
<RiskBadge level="high" score={72} />
<AMLStatusBadge status="pass" />
<CaseTypeBadge type="kyc" />                 // dot-less, categorical color
<SLABadge status="near_timeout" remainingMinutes={15} />
<LevelBadge level="vip" />                   // dot-less, uppercase
<TypeBadge type="buy" />                     // dot-less, uppercase, success/error
```

### EnhancedDataTable

The single canonical way to render a list of rows.

```tsx
import { EnhancedDataTable, type Column, type RowAction } from "@/components/crm/ui";

const columns: Column<Client>[] = [
  { key: "uid", title: "UID", width: "120px" },
  { key: "name", title: "Name", sortable: true },
  { key: "country", title: "Country" },
  { key: "kycStatus", title: "KYC", render: (row) => <KYCStatusBadge status={row.kycStatus} /> },
];

const actions: RowAction<Client>[] = [
  { label: "View", onClick: (row) => router.push(`/crm/clients/${row.id}`) },
  { label: "Freeze", variant: "danger", onClick: (row) => freeze(row.id) },
];

<EnhancedDataTable
  columns={columns}
  data={clients}
  keyExtractor={(c) => c.id}
  searchable searchKeys={["uid", "name", "email"]}
  selectable selectedKeys={selected} onSelectionChange={setSelected}
  rowActions={actions}
  pagination pageSize={20}
/>
```

Built-in: deferred search, sortable headers, pagination, row selection
checkbox, kebab-menu row actions, empty state, loading skeleton.

> **Rule:** never write `<table>` directly in a page. If `EnhancedDataTable`
> doesn't fit, file an issue to extend it — don't fork it.

### FilterBar

Canonical filter chrome above a list. Pass an array of `FilterField`
descriptors; it renders inputs and propagates state via `onFilterChange`.

```tsx
import { FilterBar } from "@/components/crm/ui";

<FilterBar
  fields={[
    { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
    { key: "country", label: "Country", type: "select", options: COUNTRY_OPTIONS },
    { key: "search", label: "Search", type: "text", placeholder: "UID / email / name" },
  ]}
  onFilterChange={setFilters}
/>
```

### Drawer / DrawerFooter

Right-side slide-over for detail or form panels.

```tsx
<Drawer open={open} onClose={() => setOpen(false)} title="Edit client">
  <div className="space-y-4">…</div>
  <DrawerFooter>
    <Button variant="outline" onClick={cancel}>Cancel</Button>
    <Button onClick={save}>Save</Button>
  </DrawerFooter>
</Drawer>
```

### LoadingState

Page-level skeleton. For inline use, prefer `Skeleton` from `@/components/ui`.

```tsx
{loading ? <LoadingState /> : <Content/>}
```

### PlaceholderPage

For roadmap pages that exist as routes but have no implementation.

```tsx
<PlaceholderPage
  title="Workflows"
  description="Configure case routing rules. Coming Q3."
/>
```

---

## Anti-patterns

| Anti-pattern | Use this instead |
|--------------|------------------|
| `<button className="bg-blue-600 ...">` | `<Button>...</Button>` |
| `<div className="bg-white border border-slate-200 rounded-2xl ...">` | `<Card>...</Card>` |
| `<span className="bg-emerald-100 text-emerald-700 rounded-full ...">Active</span>` | `<BadgeBase tone="success">Active</BadgeBase>` |
| `<table>...</table>` | `<EnhancedDataTable />` |
| `dark:bg-slate-800 dark:text-white` on a page | `bg-card text-foreground` |
| `bg-[#2563EB]` / `text-[var(--primary)]` | `bg-primary` / `text-primary` |
| Inline `style={{ padding: 12 }}` | Tailwind `p-3` |
| `rounded-[10px]` arbitrary | One of `rounded-md / lg / xl / full` |
