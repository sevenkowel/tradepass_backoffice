# Approval Center v2 — Architecture Decision Record

> **Date**: 2026-05-14
> **Status**: Accepted — implementation in progress
> **Supersedes**: `PRD-Approval-Inbox-v1.0.md`
> **Owner**: CRM Core

---

## 1. Context

The original Approval Center (v1) shipped as a *parallel* module that duplicated
significant functionality already present in **CLM Center** (KYC) and **Funds**
(withdrawal review). After a holistic audit (see "Approval Center 审视" session
note, 2026-05-14) we identified five core problems:

1. **IA inflation** — 11 sidebar items, 7 of which were filtered views of the
   same dataset (My Tasks, Pending Queue, SLA Warning, High Risk, Escalated,
   Re-Verification, All Tasks).
2. **Positioning ambiguity** — Approval Center had its own Workspace + Audit
   Trail + queue. CLM Center had its own Workspace + Review Queue + Audit Trail.
   A KYC reviewer didn't know which module to open in the morning.
3. **Status semantics overloaded** — 8 enum values where the difference
   between `pending` and `in_review` was just "claimed?" (already encoded in
   `assigneeId`); `re_submitted` / `additional_docs_requested` / `escalated`
   should have been tags, not states.
4. **Detail page center column was 90% placeholder** — KYC docs were hardcoded
   "Verified"; withdrawal payload was invented data; only `deposit` /
   `reward` / `profile_change` had useful inline detail.
5. **Permission flat-mapped to `compliance`** — finance / risk / support
   operators had no scoped access to their respective approval types.

## 2. Decisions

### D1 — Inbox-first hybrid

The Approval Center becomes the **personal inbox** for *every role* in the CRM.
It no longer attempts to be a self-contained workflow engine for every task type.

The `canInlineApprove` flag on `ApprovalTask` becomes the architectural switch:

| `canInlineApprove` | Detail page renders | Decision happens |
|--------------------|---------------------|------------------|
| `true`  (≈ small deposits, profile changes, small leverage, low-risk rewards) | Full 3-column layout + real submission body | **In Approval Center** (inline) |
| `false` (≈ KYC, AML review, large withdrawals, large deposits, partner / IB applications) | Minimal summary card + "Open in [Source Module] →" hero | **In the source module** (CLM / Funds / Risk) |

The source module decides → fires a webhook → `approvalService.audit` records
the decision under the unified audit trail. There is **one** detail page per
case, not two.

### D2 — CLM Center demoted to KYC specialist tool

CLM Center stops being a "second daily entry" and shrinks to a specialist
tooling surface for KYC compliance officers. Removed pages:

- ❌ `/crm/clm/workspace` — replaced by Approval Inbox
- ❌ `/crm/clm/review-queue` — replaced by Approval Inbox (with `type=kyc` filter)
- ❌ `/crm/clm/audit-trail` — merged into Approval Center Audit Trail (P3)

Retained pages (10):

- `/crm/clm/cases` — KYC-specific deep filtering & kanban
- `/crm/clm/re-verification/*` — Requests / Templates / History (KYC-only)
- `/crm/clm/sla-monitoring` — team-level SLA dashboard (KYC-only)
- `/crm/clm/kyc-flows`, `/rules`, `/agreements`, `/system-modules` — configuration

The `/crm/clm/cases/[id]` detail page **remains the canonical KYC review UI**;
Approval Inbox links into it when a KYC task is opened.

### D3 — Workflow status simplification

8 states → 4 states + tags:

```
Old: pending | in_review | on_hold | escalated | approved | rejected
   | re_submitted | additional_docs_requested

New states (axis: where is the case in its lifecycle?):
   pending   — needs a decision (claimed or not — see tags.claimed)
   on_hold   — paused, waiting on external input
   approved  — terminal: yes
   rejected  — terminal: no

New tags (independent, multi-select):
   claimed             — has an assigneeId
   escalated           — bumped to senior reviewer
   awaiting_user       — user-input requested
   docs_requested      — supplementary documents requested
   resubmitted         — user has resubmitted after a request
   blacklist_flagged   — marks reject + blacklist combo
```

`canInlineApprove`, `riskLevel`, `riskFlags` remain as-is.

### D4 — Permission split

`compliance` is too coarse for an aggregator. The new map:

| Action | Permission |
|--------|------------|
| Approve KYC / AML / re-verification | `compliance` (existing) |
| Approve withdrawal / deposit | `funds` (existing) |
| Approve leverage / large position | `risk` / `trading` (existing) |
| Approve partner / IB application | `accounts` (existing) |
| Approve profile change | `accounts` (existing) |

The Approval Inbox **automatically filters** the list to tasks the current
operator's role permission allows. No menu-level gate; row-level visibility.

### D5 — Migration: hard cut

No 3-month deprecation window. CLM Workspace / Review Queue / Audit Trail
pages are **deleted** in this refactor. Reason: the system is still in early
development, the cost of maintaining two daily entries is higher than the
operator re-training cost. Saved views in the Inbox cover the previous
specialty entries (`?type=kyc&assignee=me` replaces "CLM Workspace").

## 3. Target architecture

### 3.1 Sidebar

```
Approval Center (3 items)             CLM Center (10 items, specialist tooling)
─────────────────────────             ──────────────────────────────────────────
Inbox        ← personal queue         Cases                       ← KYC list
All          ← cross-module search    Re-Verification (section)
Audit Trail  ← unified history          ├ Requests
                                        ├ Templates
                                        └ History
                                      Operations (section)
                                        └ SLA & Monitoring
                                      Configuration (section)
                                        ├ KYC Flows
                                        ├ Routing & Rules
                                        ├ Agreement Documents
                                        └ System Modules
```

### 3.2 Inbox page structure

```
┌────────────────────────────────────────────────────────────┐
│  KPI tiles    [Mine 12]  [Overdue 3]  [Critical 1]         │
├────────────────────────────────────────────────────────────┤
│  Tabs:     Mine (12)   Unassigned (8)   All (45)           │
│  Chips:    [All] [Overdue] [Critical] [KYC] [Funds]...     │
│  Search                                                    │
├────────────────────────────────────────────────────────────┤
│  Task rows (sorted by SLA):                                │
│   • canInlineApprove=true  → inline Approve / Reject btns  │
│   • canInlineApprove=false → "Open in [Module] →" CTA      │
└────────────────────────────────────────────────────────────┘
```

### 3.3 Detail page bifurcation

```
                  ┌──────────────────────────┐
   Task opened ──►│ canInlineApprove?        │
                  └────────┬─────────────────┘
              true         │         false
       ┌────────────────────┴────────────────────┐
       ▼                                         ▼
   3-col full detail                Brief 1-col handoff page
   - LEFT  : task + customer + QA   - Title + status + risk chips
   - CENTER: REAL submission body   - "Open in [Module] →" big CTA
              (deposit fields,      - Audit summary only
               profile diff, etc.)  - Decision happens in source
   - RIGHT : risk + hints + audit
   - BOTTOM: action bar
```

## 4. Implementation phases

| Phase | Scope | Files touched (est.) |
|-------|-------|---------------------|
| **P1** | Menu trim · new Inbox page · detail bifurcation · CLM trim · delete deprecated pages | ~15 files |
| **P2** | Status enum simplification · mockFetch dedupe · narrative mock seed | ~6 files |
| **P3** | Permission split + row-level filtering · CLM audit merge | ~4 files |
| **P4** | Delete Workflow Config · wire batch operations in Inbox | ~3 files |

## 5. Migration / file-level breakdown (P1)

### Approval Center
| File | Action |
|------|--------|
| `src/app/crm/approvals/inbox/page.tsx` | **NEW** — primary Inbox |
| `src/app/crm/approvals/all/page.tsx` | **NEW** — global search view (replaces `all-tasks`) |
| `src/app/crm/approvals/page.tsx` | Update redirect → `/inbox` |
| `src/app/crm/approvals/[id]/page.tsx` | Bifurcate by `canInlineApprove` |
| `src/app/crm/approvals/workspace/page.tsx` | **DELETE** |
| `src/app/crm/approvals/my-tasks/page.tsx` | **DELETE** |
| `src/app/crm/approvals/pending-queue/page.tsx` | **DELETE** |
| `src/app/crm/approvals/sla-warning/page.tsx` | **DELETE** |
| `src/app/crm/approvals/high-risk/page.tsx` | **DELETE** |
| `src/app/crm/approvals/escalated/page.tsx` | **DELETE** |
| `src/app/crm/approvals/re-verification/page.tsx` | **DELETE** |
| `src/app/crm/approvals/all-tasks/page.tsx` | **DELETE** (moved to `/all`) |

### CLM Center
| File | Action |
|------|--------|
| `src/app/crm/clm/workspace/page.tsx` | **DELETE** |
| `src/app/crm/clm/review-queue/page.tsx` | **DELETE** |
| `src/app/crm/clm/audit-trail/page.tsx` | **DELETE** (P3 merges into Approval Center) |

### Shared
| File | Action |
|------|--------|
| `src/components/crm/layout/Sidebar.tsx` | Trim both menu groups |
| `src/lib/i18n/crm-shell.ts` | Add new menu labels: Inbox / All |

## 6. Risks & mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Existing breadcrumbs / Link hrefs point to deleted routes | Medium | Grep all references to `/crm/clm/workspace`, `/crm/clm/review-queue`, `/crm/approvals/workspace`, etc.; update to new routes |
| KYC reviewers expect CLM Workspace | Low | Inbox saved view `?type=kyc&assignee=me` reproduces 95% of what they need; specialty config still in CLM Center |
| Status enum migration breaks audit history | Medium | Keep old enum values readable in audit display; new tasks created with new enum only |
| Permission split breaks demo accounts | Low | Default mock user has `compliance + funds + risk` to keep demos working |

## 7. Out of scope (deferred)

- Real workflow editor for CLM rules (CLM Center config pages are the long-term home)
- Cross-module batch operations (P4 only wires same-module batch)
- Notification integration (push / email on assignment / SLA breach)
- Real-time updates (WebSocket / SSE)
- Internationalization beyond the existing shell (mock content stays English)

## 8. Acceptance criteria

P1 is done when:
1. Sidebar shows 3 Approval Center items + 10 CLM Center items (no Workspace, no Review Queue)
2. `/crm/approvals/inbox` renders KPI tiles, tabs, filter chips, task rows
3. Detail page renders short handoff card for `canInlineApprove=false`; full 3-col layout otherwise
4. No 404s from any internal link
5. TypeScript compiles cleanly

P2 is done when:
1. `WorkflowStatus` reduced to 4 values; `ApprovalTask` has a new `tags: ApprovalTag[]` field
2. Mock fetch handlers for `/api/approvals/*` deleted from `mockFetch.ts`
3. Mock data tells a coherent operator day (12 morning tasks across types, 3 critical, 1 escalated)

P3 / P4: separate ADRs as needed.
