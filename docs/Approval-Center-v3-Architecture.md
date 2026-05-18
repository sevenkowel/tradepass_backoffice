# Approval Center v3 — Engine Surface

> **Date**: 2026-05-14
> **Status**: Accepted — implementation in progress
> **Supersedes**: `Approval-Center-v2-Architecture.md`
> **Owner**: CRM Core

---

## 1. Why v3

The v2 refactor collapsed the Approval Center to a 3-item personal-inbox
shell. While the simplification was correct in shape, it **deleted the
engine surface** entirely — and the engine *is* the Approval Center's
reason to exist.

The reference PRD (`Approval-Center-PRD.md`) is unambiguous:

- §2 — "Unified Approval **Workflow Engine**"
- §3 / Principle 4 — "Approval Center is **Workflow-driven**, NOT page-driven"
- §17 — Workflow Engine is an explicit, required surface
- §21 — Workflow Config is an explicit, required surface (with auto-approval / SLA / escalation / assignment rules)
- §22 — Notifications is an explicit, required surface
- §26 — Analytics / Reporting is an explicit, required surface
- §28 — "Approval Center IS the **Broker CRM Workflow Engine** — core infrastructure for Compliance / Risk / Finance / Operations"

v2 had none of those visible. The engine code lived in
`src/lib/approval/*` (workflowEngine / routingEngine / slaEngine) but
no UI consumed them. From the operator's perspective the Approval
Center was an inbox tool, not a platform engine.

## 2. What changes in v3

We keep every v2 simplification that was substantively correct:

- ✅ 4-state status enum + tags (instead of overloaded 8-state)
- ✅ Per-type permission split
- ✅ Narrative mock seed
- ✅ Inline approve for `canInlineApprove=true`
- ✅ Handoff to source modules for complex types (`canInlineApprove=false`)
- ✅ Cross-module Audit Trail
- ✅ Unified Inbox replacing the v1 7-filter-as-menus IA

We **add back the engine surface** the v2 refactor over-simplified
away. The new menu is split into two stripes:

```
Approval Center
├── ── Operations ──
├── Inbox            ← personal queue (kept)
├── All              ← global search  (kept)
├── Analytics        🆕 PRD §26
├── Audit Trail      ← cross-module   (kept)
├── ── Configuration ──
├── Workflows        🆕 PRD §17 — state machine + auto-approve rules per type
├── Routing Rules    🆕 PRD §18 — assignment rule table (Country / Risk / VIP / Amount)
├── SLA              🆕 PRD §19 — SLA tier matrix per type × priority
└── Notifications    🆕 PRD §22 — channel × event matrix + template editor
```

That's 8 items (4 operations + 4 configuration). The PRD's original
list of 10 collapses naturally:

| PRD §6 item | v3 location |
|-------------|-------------|
| Workspace | merged into Inbox (KPI tiles + Mine tab) |
| All Tasks | All |
| My Tasks | Inbox → Mine tab |
| Pending Queue | Inbox → Unassigned tab |
| SLA Warning | Inbox → Overdue/Near SLA filter chips |
| High Risk | Inbox → Critical/High filter chips |
| Escalated | Inbox → escalated tag filter |
| Re-Verification | Inbox → re_verification type filter |
| Audit Trail | Audit Trail |
| Workflow Config | split into Workflows + Routing + SLA + Notifications (the 4 configuration items) |

## 3. Detail page treatment (unchanged from v2)

The detail page bifurcation **stays**. Even though it conflicts with a
literal reading of PRD §15 ("Unified Approval Workspace"), PRD §24 is
the resolution: "Business modules own business data; Approval Center
owns approval lifecycle." The lifecycle (status, SLA, audit, routing)
lives in the Approval Center; the **submission artifact** (KYC docs,
withdrawal route, AML hit detail) lives in the source module's
detail page. The handoff card is the bridge.

This avoids re-implementing KYC document viewers, AML watchlist
detail, withdrawal routing visualizations, etc. — all of which exist
in their respective source modules already.

## 4. CLM Center implication

CLM Center retains its KYC-specialist scope. The cross-cutting rules
that previously lived at `/crm/clm/rules` (Routing & Rules) are now
**duplicated** at `/crm/approvals/config/routing` — both pages render
the same `routingEngine` rules. Over time the canonical home moves to
Approval Center; CLM's page becomes a deep-link shortcut.

Specifically:
- ❌ **No** wholesale move of CLM pages in this phase
- ✅ New Approval Center config pages **read the same underlying data**
  (workflowEngine / routingEngine / slaEngine singletons) as the CLM
  pages do
- ✅ Routing rules edited in either place would update the same in-
  memory store

That's pragmatic — the user can change Configuration menu structure
later without breaking links.

## 5. Implementation depth (this phase)

Each new page ships at **read-with-stubbed-editor** tier:

| Page | Reads from | Editing |
|------|-----------|---------|
| Analytics | `approvalService.getStats()` + `getTeamPerformance()` | n/a (display only) |
| Workflows | `workflowEngine.DEFAULT_TRANSITIONS` + `createDefaultWorkflowConfig()` per type | "Edit rule" buttons stubbed (toast: "Coming in Phase 2") |
| Routing Rules | `routingEngine.DEFAULT_ROUTING_RULES` | "+ Add Rule" stubbed |
| SLA | `DEFAULT_SLA_CONFIGS` | "Edit SLA" stubbed |
| Notifications | hardcoded channel × event matrix | toggle UI present, persistence stubbed |

Tier-2 (real editors) is a follow-up. The point of v3 is to **make
the engine visible** so operators understand the Approval Center is a
configurable platform, not a list page.

## 6. File-level plan

### New files (6 pages + ADR)

```
docs/Approval-Center-v3-Architecture.md           ✅ this doc
src/app/crm/approvals/analytics/page.tsx          🆕 PRD §26
src/app/crm/approvals/config/workflows/page.tsx   🆕 PRD §17
src/app/crm/approvals/config/routing/page.tsx     🆕 PRD §18
src/app/crm/approvals/config/sla/page.tsx         🆕 PRD §19
src/app/crm/approvals/config/notifications/page.tsx 🆕 PRD §22
```

### Modified files

```
src/components/crm/layout/Sidebar.tsx             — expand Approval Center menu
src/lib/i18n/crm-shell.ts                         — add labels
```

## 7. Acceptance criteria

P-v3 is done when:
1. Approval Center menu shows 4 operations + 4 configuration items (with section label between)
2. Each new page renders real data from the corresponding engine (workflow / routing / sla)
3. Analytics page shows the 6 PRD §26 metrics
4. TypeScript compiles
5. i18n labels exist for all new menu items
6. v2's existing Inbox + All + Audit Trail + Detail pages continue to work unchanged

## 8. Out of scope (deferred)

- Real workflow visual editor (drag-drop state machine builder)
- Persisted edits — all editing stubbed; in-memory state only
- Notification template variable substitution
- Cross-tenant config (single-tenant scope)
- The Auto-Approval Rules surface is folded into Workflows page
