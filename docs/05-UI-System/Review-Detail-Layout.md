# Review Detail Layout

> The canonical layout for **all** review/approval detail pages in the
> CRM — KYC cases, withdrawals, deposits, AML reviews, re-verifications,
> profile changes, partner / IB requests, leverage changes, rewards,
> any future approval flow.
>
> Reference implementations:
>
> - `src/app/crm/clm/cases/[id]/page.tsx` — CLM case detail (the original)
> - `src/app/crm/approvals/[id]/page.tsx` — Approval Center task detail

---

## Why this layout

Every approval decision in the platform is a 3-question task:

1. **Who / what** is the case about? (left context)
2. **What did the user submit / request?** (center evidence)
3. **What does the system know that helps me decide?** (right aids)

…and then the operator answers with a single verdict. Splitting the
page into three columns aligns the eye with the natural decision
order — left to right — and keeps the verdict surface always visible
at the bottom so the operator never scrolls to act.

---

## Skeleton

```
┌─────────────────────────────────────────────────────────────────────┐
│ Breadcrumb                                                          │
│ ── optional critical-risk banner ──                                 │
├─────────┬──────────────────────┬────────────────────────────────────┤
│ LEFT    │ CENTER               │ RIGHT                              │
│ 288px   │ flex-1               │ 320px                              │
│ sticky  │                      │ sticky                             │
│         │                      │                                    │
│ Case    │ Subject card         │ Composite Risk                     │
│ Info    │ Type-based body      │ Type-specific extras (opt.)        │
│ User    │                      │ Timeline (newest first)            │
│ Quick   │                      │                                    │
│ Access  │                      │                                    │
├─────────┴──────────────────────┴────────────────────────────────────┤
│ BOTTOM ACTION BAR (fixed, sidebar-aware width)                      │
│ Note input · Decision buttons (status-aware)                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Tailwind for the page shell

```tsx
<div className="-mx-3 lg:-mx-4 -my-3 lg:-my-4 bg-slate-50 px-3 py-2 min-h-[calc(100vh-64px)] pb-24">
  <Breadcrumb items={[...]} />

  {/* optional risk banner */}

  <div className="flex gap-3 mt-3">
    <aside className="w-72 flex-shrink-0 space-y-3 sticky top-[64px] self-start">
      ...
    </aside>

    <main className="flex-1 min-w-0 space-y-3">
      ...
    </main>

    <aside className="w-80 flex-shrink-0 space-y-3 sticky top-[64px] self-start">
      ...
    </aside>
  </div>

  <BottomActionBar />
</div>
```

**Rules baked in:**

- Full-bleed slate background (`bg-slate-50` + negative page margin) so the
  three columns visually float on a unified canvas.
- `pb-24` reserves room for the sticky bottom bar.
- Both asides are `sticky top-[64px] self-start` so they hold position
  while the center scrolls.
- All gaps are `gap-3` / `space-y-3` (12px) — never `gap-4`. This matches
  the project-wide card-rhythm rule (see `Design-Tokens.md §3a`).

---

## LEFT column — context (288px, sticky)

Three cards, stacked top-down. Order is fixed.

### 1. Case / Task Info card

The identity of the case. Renders:

- `case_no` or `task_id` in `font-mono tabular-nums` as the card's hero line
- Status / type / risk chips on one row (use `BadgeBase`, `CaseTypeBadge`,
  `TaskStatusBadge`, `RiskBadge`)
- `InfoRow` grid:
  - **SLA** — live countdown chip (`SLABadge` / `SlaTimer`)
  - **Assignee** — display name; `Unassigned` italic if null
  - **Module / Source** — what business object this case maps to
  - **Created** — `font-mono tabular-nums` timestamp
  - Optional: IP / device / source channel / reviewer history

### 2. Customer card

The human on the other end. Renders:

- Avatar (gradient circle, first-letter monogram, 40×40) + name + UID
- `InfoRow` grid:
  - **Email**
  - **Country** — flag + ISO code
  - **KYC level** (uppercase)
  - **Tier** (capitalized)
  - **Registered** — date
  - Optional: registration IP / device, IB referral

### 3. Quick Access card

A 2-column grid of links into the customer's profile sub-tabs:
**Profile**, **Funds**, **Trading**, **Risk**. Each is an `<a>` styled
as a soft chip with a 12×12 icon. This is the operator's escape hatch
when they need broader context than the case provides.

---

## CENTER column — evidence (flex-1)

Open-ended. Different per task type. Standard structure:

1. **Subject card** — one-line title + optional description + optional
   "Open business record →" link (the deep-link to the upstream module)
2. **Type-based payload card(s)** — switch on `type`:

| Type | Center body |
|------|-------------|
| `kyc`, `re_verification` | Document grid (ID / POA / Liveness / Video) + verification chip per item, with click-to-preview |
| `withdrawal`, `large_withdrawal` | Amount, wallet, destination, AML score, method, reference |
| `deposit` | Amount, method, reference, channel |
| `aml_review` | Risk score, level, flag chips, related cases |
| `leverage` | Trading account, requested vs current leverage, balance |
| `reward` | Reward amount, reference, promotion meta |
| `profile_change` | Old vs new value diff |
| `partner` (IB) | Partner application details + planned commission tier |
| Other | Generic `<Field>` grid + pointer to business record |

Center cards use the `SectionCard` pattern:

```tsx
<div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
  <div className="px-4 py-3 border-b border-slate-200">
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
  </div>
  <div className="p-4">{children}</div>
</div>
```

Inside the card body, use a 2-column grid of `<Field>` (label-on-top,
value-below) for scannable structured data, and a single full-width
block for descriptions or document grids.

---

## RIGHT column — decision aids (320px, sticky)

Three cards, top-down. Order is fixed.

### 1. Composite Risk card

The mandatory first card. Surfaces:

- **Risk level** — `RiskBadge` chip
- **Risk score** — number + a thin 1.5px progress bar that grades red /
  orange / amber / emerald by threshold (85+/60+/30+/<30)
- **Risk flags** — small red badges, one per flag

For CLM the equivalent is the dedicated `CompositeRiskCard` with sub-
sections for behaviour / AML / device. Approval Center starts with the
simpler 3-row version; extend per task type when more signals exist.

### 2. Type-specific extras (optional)

The extension point. Any decision-relevant signal that isn't risk and
isn't timeline goes here. Examples:

- AML watchlist hits with detail links
- Related cases for the same user (KYC + pending withdrawal)
- IB hierarchy preview (for partner approvals)
- Device fingerprint match list
- Withdrawal velocity / 30-day total

The Approval Center starter implementation surfaces a **Decision Hints**
card with a few common signals (inline-approve eligibility, SLA state,
previous state). Each new task type that has a high-value side signal
should ship its own right-side card under the Risk card.

### 3. Timeline card

Newest-first chronological list of every event on the case: status
transitions, comments, document uploads, escalations. Each row carries:

- A coloured dot (status-flow-coded: green/red/amber/orange/blue)
- Operator name + action label
- `oldStatus → newStatus`
- Optional italic note
- `font-mono tabular-nums` timestamp

The CLM version uses the full `RichTimeline` component with reply-
inline support. Approval Center starts with a minimal version; replace
with `RichTimeline` once comments / replies are wired.

---

## Bottom action bar — verdict

**Fixed to the viewport bottom.** Width tracks the sidebar collapsed
state via `useCrmSidebarStore`. The inner layout is a 3-column flex
mirror of the page body so the note input and decision buttons sit
under the *center* document column, not under the asides:

```tsx
<div className="fixed bottom-0 right-0 left-0 z-40 ...
  ${sidebarCollapsed ? 'lg:left-[80px]' : 'lg:left-[260px]'}">
  <div className="flex gap-4 px-3 lg:px-4 py-2.5">
    <div className="w-72 hidden lg:block" />     {/* left spacer */}
    <div className="flex-1 flex items-center justify-end gap-3">
      <NoteInput />
      <DecisionButtons />
    </div>
    <div className="w-80 hidden lg:block" />     {/* right spacer */}
  </div>
</div>
```

### Decision buttons — status-aware

The button set is a pure function of the current `status`:

| Status | Buttons (left → right) |
|--------|------------------------|
| `pending` | **Claim** (primary blue) |
| `in_review` | Escalate · Resubmit · Hold · Reject · **Approve** (primary green/blue) |
| `on_hold` | Release · Reject · **Approve** |
| `escalated` | Release · Reject · **Approve** |
| `approved` / `rejected` (terminal) | Bar is hidden entirely — no decisions left |

**Variants:**

- `primary` → solid `bg-blue-600` / `bg-emerald-600`
- `danger` → outlined red (becomes solid red on confirm)
- `warning` → outlined orange (becomes solid orange on confirm)
- `neutral` → outlined slate

### Note input

A single-line text input on the left of the button cluster. Two modes:

1. **Optional note** — empty placeholder reads `Add a note (optional)…`.
   The value is sent as the `note` parameter of the next action.
2. **Required reason** — when a destructive button (Reject, Hold,
   Escalate, Request Resubmit) is "armed" (first click), the input
   border turns amber and the placeholder switches to
   `Reason required for this action…`. The action button locks until
   the input has non-whitespace content.

### Two-click destructive confirm

To avoid Dialog overlays for the simple "are you sure" case, destructive
buttons use a **two-click confirm**:

- **First click** → button enters `confirming` state (solid red /
  orange / slate). Sibling buttons stay enabled (operator can change
  their mind without losing note text).
- **Second click on the same button** → submits the action.
- **Cancel button** appears next to the button cluster while any
  button is armed.

For approvals that need a richer confirmation (e.g. AML-hit approval
that should require a typed acknowledgement), the page can swap to a
full `Dialog` — the CLM case page does this for `Approve` /  `Reject` /
`Resubmit` / `Escalate`. Either mode is acceptable; choose by case
severity.

---

## What goes where — the decision matrix

When adding a new approval type, ask:

| Question | Answer goes in |
|---------|----------------|
| "Who is this about?" / "Which case?" / "When was it filed?" | LEFT — Case Info |
| "Who is the customer?" / "Where do they live?" / "What's their level?" | LEFT — Customer |
| "Where do I look up more about this customer?" | LEFT — Quick Access |
| "What did the user actually submit / request?" | CENTER — Type payload |
| "What does the user's submission contain — docs, amounts, terms?" | CENTER — Type payload |
| "How risky is this — score, flags, level?" | RIGHT — Composite Risk |
| "Is there a related case / hit / signal I should know about?" | RIGHT — Type extras |
| "What has happened on this case so far?" | RIGHT — Timeline |
| "What can I do with this?" | BOTTOM — Decision buttons |
| "Why am I doing it?" | BOTTOM — Note input |

If a piece of information doesn't fit any of the above — it probably
doesn't belong on this page. Push it into Quick Access (link out)
instead of inventing a 4th column or a tab.

---

## Mandatory rules

1. **Three columns + bottom bar.** Don't introduce tabs at the page
   level; the layout is already segmented by column. Tabs may appear
   *inside* a single card (e.g. document list with ID/POA/Liveness
   tabs) but not as the primary navigation.

2. **Sticky asides.** Both LEFT and RIGHT must use
   `sticky top-[64px] self-start` so they remain in view during scroll.
   Without this, operators lose context the moment they scroll the
   document body.

3. **Fixed bottom bar with sidebar tracking.** The bar uses
   `fixed bottom-0` with a `lg:left-[80px|260px]` switch driven by
   `useCrmSidebarStore`. Never let it overlap the sidebar.

4. **Decision buttons are a function of status.** Don't render disabled
   buttons for actions that aren't valid in the current state — omit
   them. The button set encodes the workflow.

5. **Note input is always present.** Even when no destructive action
   is armed, the operator should be able to attach a note to an
   approve / claim / release. Hide the bar entirely only when the case
   is terminal (`approved` / `rejected` / `cancelled` / `expired`).

6. **Use the existing badge primitives.** `BadgeBase`, `RiskBadge`,
   `SlaTimer`, `TaskStatusBadge`, `CaseTypeBadge`, `StatusBadge` are
   the only allowed visual carriers for status, risk, SLA, and type.
   Do not invent per-page colour maps.

7. **Card spacing = 12px.** All `space-y-3` / `gap-3`. See
   `Design-Tokens.md §3a`.

8. **Critical risk banner.** When a case has `riskLevel === "critical"`
   OR a hard AML hit, render the banner between Breadcrumb and the
   body. It uses `bg-red-50 border-red-200` and contains a one-line
   summary + a recommendation sentence.

---

## Extending for a new task type

1. Add a `case "<new_type>"` branch in the **CENTER `TypePayloadCard`** switch.
   Render a `<SectionCard title="...">` with the type-specific fields.

2. If the type has a high-value right-side signal (e.g. wallet history
   for a withdrawal), add a `case` branch in **RIGHT `TypeExtras`** that
   returns a new `<Card>` above Timeline.

3. Decision buttons usually need no change — the status state machine
   is the same for every approval type. Only add a case in
   `decisionsForStatus` if your type unlocks a unique action.

4. Update the Quick Access links if the customer profile sub-page set
   should differ for this case (rare).

Nothing else changes. The skeleton, badges, gaps, sticky behaviour,
and bottom-bar all stay constant — that's the point.
