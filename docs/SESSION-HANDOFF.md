# CRM Modernization — Session Handoff

> Read this first when picking up the project in a new Claude Code session.
> Last updated: 2026-05-10 (Phase 3 + 4 complete). Dev server runs at `localhost:3000` (user-managed, **not** via MCP preview).

---

## Project context

- **Forex broker B2B CRM** built on Next.js 16.2.1 (webpack), Tailwind v4, shadcn-style UI
- Three core operational modules: **Clients**, **CLM Center**, **Risk Center**
- Mid-flight on a **4-phase modernization** consolidating data, UX, and component standards
- User language: Chinese mostly; comments / docs / code in English
- User preference: **dense, info-rich UI** (CRM is a workspace, not a marketing surface)

---

## Phase status

| Phase | Scope | Status |
|---|---|---|
| **0 — Design system foundation** | Color/spacing/radius/components, sidebar, layout, badges | ✅ Done |
| **1 — Audit experience** (M1-Slim + M2) | Risk engine data, Case Detail full rebuild | ✅ Done |
| **2 — Module alignment** (M3 / M4 / M3.5 / M5a-c) | Clients Risk Tab + IB / Device Tab IP / Risk Center upgrade | ✅ Done |
| **3 — Infrastructure** (M6 / M7 / M2.7) | GlobalAuditLog, ClientGraph, Tags/Segments CRUD | ✅ Done |
| **4 — Configuration & automation** (M8-M10) | CLM config pages, auto-routing, real APIs | ✅ Done |

---

## Architectural decisions to respect

### Design system — `docs/05-UI-System/`

- **Brand**: blue-600 (`#2563EB`). Use `bg-primary` / `text-primary`, never literal `bg-blue-600`.
- **Neutral**: `slate-*` only. Never `gray-*` / `zinc-*` / `neutral-*` in new code.
- **Status**: `emerald / amber / red / blue × 100 / 500 / 700` only.
- **Typography**: Inter; numbers/dates/IDs use `font-mono tabular-nums`.
- **Radius**: `sm=6 / md=8 / lg=12 / xl=16 / full`.
- **Spacing scale**: 7 stops (`4 / 8 / 12 / 16 / 24 / 32 / 48`). No marketing-grade padding.

Three docs are authoritative — read before designing new components:
- `docs/05-UI-System/README.md` — entry + 3 iron rules
- `docs/05-UI-System/Design-Tokens.md`
- `docs/05-UI-System/Component-API.md`
- `docs/05-UI-System/Usage-Guidelines.md` (incl. PR checklist)

---

### Core data contracts (introduced in Phase 1, expanded in Phase 3)

```
src/types/core/
├── risk-profile.ts                    # RiskProfile + 6-axis RiskFactor + reasoning + evidence
├── ip-geo.ts                          # IPGeoInfo (geo + VPN/Tor/proxy + related UIDs)
├── ib-summary.ts                      # IBSummary (tier / pass rate / fraud rate)
├── third-party-verification.ts        # Sumsub/Onfido envelope
├── audit.ts                           # GlobalAuditLog + AuditDomain + AuditSeverity (NEW Phase 3)
├── client-graph.ts                    # ClientGraph + node/edge kinds (NEW Phase 3)
└── index.ts                           # barrel
```

These are **the** shared shapes. `Clients`, `CLM`, `Risk` all read the same types.

---

### Risk engine

```
src/lib/risk-engine/
├── config.ts                          # FACTOR_WEIGHTS + LEVEL_THRESHOLDS (hardcoded, displayed at /crm/risk/scoring)
├── mock-risk-profiles.ts              # lookupRiskProfile(clientId, baseScore, amlStatus)
└── graph.ts                           # NODE_COLOR / EDGE_COLOR / EDGE_DASH + countEdgesByKind / graphRiskScore / rankedRelatedNodes
```

When the backend Risk Engine arrives, swap the `lookupRiskProfile` import for a `riskService.getProfile()` call — UI doesn't change.

---

### Mock services & API switch

```
src/lib/clm/
├── config.ts                          # USE_MOCK_API + clmEndpoint() helper
├── services/
│   ├── types.ts                       # ICaseService / IWorkspaceService / IAuditService
│   ├── case.service.ts                # mock impl
│   ├── workspace.service.ts           # mock impl
│   ├── audit.service.ts               # mock impl (CLM-only, kept for case-detail history)
│   ├── api/                           # HTTP scaffolds (throw NotImplemented)
│   └── index.ts                       # factory: USE_MOCK_API picks one
└── mock/
    ├── mock-cases.ts                  # case-001 has the FULL data shape
    ├── mock-ip-geo.ts                 # lookupIPGeo(ip) + listAllIPGeo()
    └── mock-ib.ts                     # lookupIB(ibId) + fallback synthesis

src/lib/audit/                         # NEW (Phase 3 / M6) — cross-domain audit
├── adapters.ts                        # clmAuditToGlobal / clientAuditToGlobal / globalToClientAudit
├── mock-cross-domain.ts               # filler entries for domains without a real producer
├── service.ts                         # globalAuditService.list() / listForClient() / listForCase()
└── index.ts                           # public surface
```

`case-001` is the canonical "rich" case — 4 documents (passport / POA / income / liveness) each with Sumsub verification, 6-axis RiskProfile, 8-step timeline, IP geo + IB.

The Audit Trail UI (`/crm/clm/audit-trail`) reads only `GlobalAuditLog` via `globalAuditService`. CLM-, Client-, and cross-domain producers all project into the same shape (see `lib/audit/adapters.ts`); to add a new domain, write an adapter and append to the pool in `service.ts`.

---

## UI components (NEW in Phase 1 + 2)

### Risk visualization
- `@/components/crm/clm/risk/RiskScoreRing` — SVG circular gauge for composite score
- `@/components/crm/clm/risk/RiskFactorList` — 6-axis expandable list with reasoning + evidence

### Popovers (all portal-rendered, `z-[100]`)
- `@/components/crm/clm/popovers/IPGeoPopover` — IP click → geo + VPN flags + related UIDs
- `@/components/crm/clm/popovers/IBSummaryHover` — IB hover → tier + KYC pass rate vs peer
- `@/components/crm/clm/popovers/VerificationChip` — Sumsub chip + reasons popover
- `@/components/crm/clm/popovers/usePortalPopover` — shared positioning + click-outside hook

### Timeline
- `@/components/crm/clm/RichTimeline` — 5-category icon coding (submission / system / assignment / comment / decision)

### Standard table — **`@/components/crm/ui/EnhancedDataTable`**

Phase 2 finalised this as the cross-CRM standard. Features:

| Feature | How |
|---|---|
| Column visibility | `hideable` / `defaultHidden` on Column; toolbar "Columns" menu; persisted to `localStorage` under `crm.table.${tableId}.hidden` |
| Sortable columns | `sortable` + optional `sortField` (for composite render columns); inactive sortable cols show faint `↕` chevron |
| Sticky cells | `fixSelectionLeft` / `fixActionsRight` (default both `true`); locked cells get `bg-white` + 1px shadow |
| Bulk actions | `bulkActions={(keys) => <>...</>}` renders inside the table toolbar (no orphan banner) |
| Persistent toolbar | Same chrome regardless of selection state — count + Clear when active |
| Row actions menu | Portal-rendered, `z-[100]` td when open so it never gets clipped |

**Standard usage pattern** (also documented in code comments):

```tsx
<EnhancedDataTable
  tableId="my-page"                    // localStorage scope
  columns={[
    { key: "name", title: "Name", sortable: true, hideable: false },             // pinned identity column
    { key: "email", title: "Email", sortable: true },
    { key: "score", title: "Score", sortable: true, defaultHidden: true },       // advanced field
    { key: "meta", title: "Meta",
      sortable: true, sortField: "underlyingField",                              // composite column with custom sort
      render: (row) => <CustomChip data={row} />
    },
  ]}
  data={items}
  keyExtractor={(r) => r.id}
  searchable searchKeys={["name", "email"]}
  selectable selectedKeys={selected} onSelectionChange={setSelected}
  bulkActions={(keys) => <>...</>}
  rowActions={[...]}
/>
```

---

## Hooks (custom)

- `@/hooks/useCurrentStaff` — replaces hardcoded `"staff-001"`. Use `useCurrentStaffId()` everywhere.
- `@/hooks/useListWithFilters` — page/filter/total/loading state machine for list pages
- `@/hooks/useGlobalSLATick` — single 10s ticker driving all SLA cells (replaces N timers)
- `@/hooks/useRiskSummary` — single derivation of risk story for case detail
- `@/hooks/usePermission` — RBAC (uses existing `useAuthStore.hasPermission`)
- `@/hooks/useReviewQueueCount` — sidebar Review Queue badge
- `@/components/crm/clm/case-detail/bits` — InfoRow / RiskItem / Collapsible / fmtDate / computeSLA

---

## Layout conventions

- **`ClientLayout` outer padding**: `p-3 lg:p-4` (intentionally tight; if you change it, sync `Case Detail`'s negative margins)
- **Breadcrumb's last item IS the page H1** (`<h1 aria-current="page">`). Don't add another `<h1>` on the page.
- **`PageHeader`** retains `title` / `description` props for backward compat but **does not render them**. It only renders `actions` (returns `null` if absent).
- **Page-level wrapper** uses `space-y-3` (12px between major sections)
- **Case Detail** uses negative-margin bleed: `-mx-3 lg:-mx-4 -my-3 lg:-my-4` to ignore `ClientLayout` padding, then `px-3 py-2` for its own chrome.

### Sticky / z-index map

```
TopBar              standard           — global
Case Header         sticky top-[64px]  z-30   — case detail only
Page asides         sticky top-[124px]        — left/right sidebars
Portal popovers     z-[100]            — IP / IB / Verification, row actions menu when open
```

`top-[124px]` = `64 (TopBar) + 48 (Case Header) + 12 (gap)`. If you change Case Header height, sync this.

---

## Recent UX rounds (so you understand "why")

1. Case Detail Risk panel: 88-score chip → **SVG ring + 6-axis explainable factors**
2. Sticky popover clipping: all popovers (IP / IB / Verification / row-actions) → **`createPortal` to body**
3. Lost sticky on Case Header → **restored** with rounded-card chrome
4. Outer padding too large (24+16=40px) → **ClientLayout `p-3 lg:p-4`**, save 8-16px each side
5. Breadcrumb + H1 duplication → **Breadcrumb's last item became the H1**; PageHeader retired its `<h1>` and `description` rendering
6. EnhancedDataTable: **column visibility + sortable hints** added; persisted via `tableId`
7. Review-queue: status filter restricted to active statuses (`pending/reviewing/escalated/resubmission`); Cases page is the archive (all statuses)
8. **(Phase 3)** Audit consolidation — three legacy `AuditLog` shapes (CLM rich · Client single-field · Compliance severity-tagged) merged into one `GlobalAuditLog`. Compliance Audit page is now a redirect to `/crm/clm/audit-trail`; Client Detail Logs tab fetches via `globalAuditService.listForClient`.
9. **(Phase 3)** Graph consolidation — `RelationshipGraph` and Risk Tab's force chart now agree on `ClientGraphNode/Edge`. New edge kinds `shared_payment` and `ib_invited` are first-class so the API can extend without breaking UI.
10. **(Phase 4 — M8)** Six CLM config screens collapsed onto one CRUD pattern. The shared `@/components/crm/clm/config/ConfigDrawer` is the right-side modal every page uses; pages own only their domain-specific form body. New screens and existing config-style pages should use the same primitive. PRD §6–8 alignment landed in a follow-up: `ConfigTemplate` carries structured `regulatoryRequirements` / `amlRequirements` / `riskControls[]` / `leverageRules[]` / `agreementRules` instead of bare counts; `KYCPolicy` has a `category` (review/risk/routing/escalation/sla/automation/permission); `KYCForm` is `sections[].fields[]` with `conditions` / `validation` / `countries` / `i18nLabels` field metadata.
11. **(Phase 4 — M9)** Routing editor sits on top of `clmConfigService.workflows` — there's no parallel data model. Adding a new condition field or action type means extending `WorkflowCondition` / `WorkflowAction` in `@/types/clm/config.ts` and the `FIELD_OPTIONS` / `ACTION_OPTIONS` constants in `routing/page.tsx`.
12. **(Phase 4 — M10)** Integration philosophy: every external service has both a sync mock helper (kept for existing pages) and an async resolver via `@/lib/integrations`. The resolver always falls back to the mock on any error so the UI stays useful when a third party is down.

---

## Pre-existing code debt (NOT introduced this session)

These files have errors in `tsc --noEmit` from external work, ignore them:

- `src/lib/crm/services/client.service.ts` — partly migrated to fetch but missing some imports (`mockClients`, `delay`)
- `src/app/api/crm/clients/stats/route.ts` — null-vs-string mismatch
- `src/lib/crm/clients/mapper.ts` — Prisma `mode: "insensitive"` filter typing

The TS check command we use ignores them:
```sh
npx tsc --noEmit 2>&1 | grep -v "stats/route\|mapper.ts\|client.service.ts" | head -10
```

If output is empty, the session's changes are clean.

---

## What's TODO

### Phase 3 — Infrastructure ✅ Done

| M | What | Status |
|---|---|---|
| **M6** | `GlobalAuditLog` — `src/types/core/audit.ts` + `src/lib/audit/*`. Audit Trail rebuilt with domain chips (clients · clm · risk · compliance · funds · trading · staff · system), severity filter, free-text search. Client Detail Logs tab + Compliance Audit redirect both feed the same pool. | ✅ |
| **M7** | `ClientGraph` — `src/types/core/client-graph.ts` + `src/lib/risk-engine/graph.ts`. `RelationshipGraph` rewritten to use unified `ClientGraphNode` / `ClientGraphEdge`. `/crm/risk/graph` is now real (high-risk shortlist + same picker). Client Detail Risk Tab uses unified colour palette via `NODE_COLOR` / `EDGE_COLOR`. | ✅ |
| **M2.7** | Tags + Segments CRUD modals — `clientService.{updateTag,deleteTag,createSegment}` wired through the shared `ConfigDrawer`. Both pages have working create / edit / delete flows. | ✅ |

### Phase 4 — Configuration & automation ✅ Done

| M | What | Status |
|---|---|---|
| **M8** | Six CLM config screens unified on one pattern: `clmConfigService` (mock + API stub) + shared `ConfigDrawer` for create/edit. Pages aligned to PRD §6–8: **Templates** is now a 3-pane tabbed detail editor (Regulatory · AML · Risk · Leverage · Agreement Rules); **Policies** has the §7.5 category sidebar (Review / Risk / Routing / Escalation / SLA / Automation / Permission); **Forms** is section-tree based with field metadata for conditional logic, validation, and country restrictions. | ✅ |
| **M9** | `/crm/clm/routing` — visual rule editor that filters `clmConfigService.workflows` and exposes structured condition / action editing with a live `IF X AND Y THEN Z` preview. The legacy `rule` text field stays in sync so the Workflows card view stays accurate. Sidebar has a new "Routing" entry. | ✅ |
| **M11** | **Re-Verification Center** (PRD `CLM-ReVerification-System-PRD.md`) — Continuous-compliance engine. Four pages under `/crm/clm/re-verification/{requests,templates,rules,history}`, plus the shared `NewRequestDrawer` for the manual 6-step trigger flow. Seven verification types (`re_identity / re_liveness / re_address / re_income / re_agreement / re_questionnaire / re_video`); four restriction levels × six scopes; four notification channels including a forced login popup with five severity tiers. New `re_verification` `CLMCaseType` so submitted requests flow through the existing Review Queue (PRD §15.1 reuse rule). | ✅ |
| **M10** | Integration scaffolds in `src/lib/integrations/` (`config`, `ipgeo`, `risk-profile`, `sumsub`) + server routes `/api/crm/integrations/{ipgeo,risk-profile,sumsub/*}`. All three follow the same shape: master flag (`USE_REAL_INTEGRATIONS`) + per-integration creds → real provider, otherwise mock fallback. Sumsub uses HMAC-signed requests (server-side only, `node:crypto`). Env vars documented in `.env.example`. Page-level migration to async APIs is left for the next session as the real backend lands. | ✅ scaffolded |

### Integration points (M10 — for the next session to plug real backends in)

```
src/lib/integrations/
├── config.ts        # USE_REAL_INTEGRATIONS + per-provider env knobs
├── ipgeo.ts         # getIPGeo(ip) — async, ipinfo / ipqs / ipapi / mock
├── risk-profile.ts  # fetchRiskProfile({clientId, baseScore, amlStatus})
├── sumsub.ts        # createApplicant / getApplicantStatus / generateAccessToken (HMAC-signed)
└── index.ts         # public barrel

src/app/api/crm/integrations/
├── ipgeo/route.ts                       # GET ?ip=…
├── risk-profile/route.ts                # POST { clientId, baseScore, amlStatus }
└── sumsub/{applicant-status,access-token}/route.ts
```

Pages still call the **sync mocks** (`lookupIPGeo`, `lookupRiskProfile`) for now — switching them to the async fetch is a per-page refactor that can land alongside the real backend.

### Open visual / UX items (not yet raised)

- `/crm/risk/{anomalies,aml,margin,nbp,whitelist,blacklist}` are still placeholders
- Some Clients tabs (`Tickets / Permissions / Logs`) may need feature work
- Workspace KPI strip is currently subtle — user hasn't complained but could be promoted
- M10: migrate IP-geo / Risk-profile call sites from sync mock to async fetch when the real services land

---

## How to resume

In a new Claude Code session, paste this prompt:

```
Read docs/SESSION-HANDOFF.md, then continue with [Phase 3 OR a specific issue].

The dev server runs at localhost:3000 (user-managed; preview MCP can't take it
over — verify with curl, user refreshes the browser).

Always:
- Run `npx tsc --noEmit` after changes; ignore client.service.ts /
  mapper.ts / stats/route.ts (pre-existing debt).
- Follow design rules in docs/05-UI-System/.
- Use core types from @/types/core and risk-engine helpers from
  @/lib/risk-engine and @/lib/clm/mock — never create parallel data.
- Don't kill the user's dev server.
```

---

## Verification checklist (after any change)

```sh
# 1. Type check (excluding pre-existing debt)
npx tsc --noEmit 2>&1 | grep -v "stats/route\|mapper.ts\|client.service.ts" | head -10
# expect: empty output

# 2. Routes still respond (user is logged in)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/crm/clm/review-queue
# expect: 200 or 307 (auth redirect)

# 3. User refreshes browser to confirm visual
```

---

## Success criteria

- ✅ `tsc --noEmit` is clean (after filter)
- ✅ New code uses tokens (`bg-primary` / `text-slate-700` / etc), never `bg-blue-600` literal
- ✅ Single source of truth — risk data goes through `lookupRiskProfile`, IP through `lookupIPGeo`, IB through `lookupIB`
- ✅ Shared components reused — `EnhancedDataTable` for any new list page; `RiskScoreRing` + `RiskFactorList` for any risk surface
- ✅ Compact spacing (`p-3 lg:p-4` outer; `space-y-3` page; tight cards)
