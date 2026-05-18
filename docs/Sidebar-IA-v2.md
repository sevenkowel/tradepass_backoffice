# Sidebar IA v2 — From Modules to Doors  *(REVERTED — kept for reference)*

> **Date**: 2026-05-14
> **Status**: ❌ **Rolled back the same day.** The 7-functional-door
> reorganization didn't land well: operators preferred the 14
> module-named groups because navigation by subsystem matches the
> mental model of "which page owns this feature." Clients group grew
> too tall, Growth was a salad of four nested sections, and the
> single-link Settings group felt awkward. Kept here so future
> revisits can see what was tried and why it was reverted.
> **Current sidebar = v1 (14 groups). See Sidebar.tsx top comment.**
> **Owner**: CRM Core

---

## 1. Problem

The v1 sidebar shipped **14 top-level groups** with ~75 leaf items, organized by **business module** (Dashboard, CLM Center, Approval Center, Risk Center, Funds, Trading, Support, Marketing, Reports, IB, Setup Guide, System, Apps + Clients).

Symptoms:
- 14 entry points exceed working memory; users scroll the sidebar
- Operations and configuration live in the same group (Trading → Orders *and* Trading Settings; CLM → Cases *and* KYC Flows)
- Cross-cutting features fragmented (Audit in Approval, SLA in CLM, Analytics in Approval, dashboards everywhere)
- Module-named groups don't match how operators *think* about their job ("manage a customer" cuts across CLM + Risk + Funds)

Industry benchmark: modern admin tools (Linear / Intercom / Stripe / HubSpot) keep top-level menus to **5–6** with all configuration in a single **Settings hub** page.

## 2. Decision

Reorganize from **business modules** to **functional doors**:

```
v1 (14 groups)                       v2 (7 doors)
─────────────────                    ────────────────
Dashboard                            Workspace        ← today's work, KPIs, alerts
Approval Center                      Clients          ← all customer-centric work
Clients                              Approvals        ← cross-module decision flow
CLM Center                  ──►      Trading          ← order / position / account ops
Risk Center                          Growth           ← funds / IB / marketing / support
Funds                                Reports          ← cross-module reporting (kept)
Trading                              Settings         ← single hub page for ALL config
Support
Marketing
Reports
IB
Setup Guide
System
Apps
```

The principle: **the sidebar tells the operator what they can do, not what the system has.** Settings is a hub page (with internal sub-nav), not a fan-out of 23 config items in the sidebar.

## 3. Migration map

### v1 group → v2 door

| v1 location | v2 destination |
|-------------|----------------|
| Dashboard / Overview / Real-time / Funnel / Client 360 | **Workspace** |
| Approval Center / Inbox / All / Analytics / Audit Trail | **Approvals** |
| Approval Center → Workflows / Routing / SLA / Notifications | **Settings → Approval Engine** |
| Clients / List / Tags / Segments / Lifecycle / Notes / Relationships / Clusters | **Clients** |
| CLM Center → Cases | **Clients** (Compliance section) |
| CLM Center → Re-Verification (3 sub) | **Clients** (Compliance section) |
| CLM Center → SLA & Monitoring | **Reports** |
| CLM Center → KYC Flows / Routing & Rules / Agreement Documents / System Modules | **Settings → KYC** |
| Risk Center → Risk Dashboard | **Workspace** (KPI surface) |
| Risk Center → High-Risk / AML / Anomaly / Graph / Device / Blacklist / Whitelist | **Clients** (Risk section) |
| Risk Center → Scoring / Risk Rules / NBP Protection | **Settings → Risk** |
| Risk Center → Margin Alerts | **Trading** (operational) |
| Funds / Deposits / Withdrawals / Transactions / Channels | **Growth** (Funds section) |
| Funds → Fund Policy | **Settings → Funds** |
| Trading / Orders / Positions / Instruments | **Trading** |
| Trading / Accounts (List / Groups / Leverage Config) | **Trading** (Accounts section) |
| Trading → Trading Settings / Product Config | **Settings → Trading** |
| Support / Tickets / Emails / SMS / Push / Chat | **Growth** (Support section) |
| Marketing / Campaigns / Messages / Banners / News | **Growth** (Marketing section) |
| Reports (5 reports) | **Reports** (kept verbatim — user request) |
| IB / Dashboard / Tree / Commissions | **Growth** (IB section) |
| IB → IB Settings | **Settings → IB** |
| Setup Guide (2) | **Settings → Platform** |
| System (6 items) | **Settings → Platform** |
| Apps | **Settings → Platform** |

### v2 final structure

```
Workspace                       (4 items)
├ Overview                      /crm
├ Real-time Monitor             /crm/monitor
├ Conversion Funnel             /crm/funnel
└ Risk Dashboard                /crm/risk

Clients                         (~15 items, sectioned)
├ Client List                   /crm/clients
├ Client 360                    /crm/client-360
├ Tags · Segments · Lifecycle · Notes · Relationships · Clusters
├ ── Compliance ──
├ KYC Cases                     /crm/clm/cases
├ Re-Verification Requests      /crm/clm/re-verification/requests
├ Re-Verification History       /crm/clm/re-verification/history
├ ── Risk ──
├ High-Risk Clients             /crm/risk/high-risk
├ AML Hits                      /crm/risk/aml
├ Anomaly Detection             /crm/risk/anomalies
├ Relationship Graph            /crm/risk/graph
├ Device & Security             /crm/risk/device
├ Blacklist                     /crm/risk/blacklist
└ Whitelist                     /crm/risk/whitelist

Approvals                       (4 items)
├ Inbox                         /crm/approvals/inbox
├ All                           /crm/approvals/all
├ Analytics                     /crm/approvals/analytics
└ Audit Trail                   /crm/approvals/audit-trail

Trading                         (7 items, sectioned)
├ Orders · Positions · Instruments
├ ── Accounts ──
├ Account List · Account Groups · Leverage Config
└ Margin Alerts                 /crm/risk/margin

Growth                          (15 items, sectioned)
├ ── Funds ──
├ Deposits · Withdrawal Review · Transactions · Payment Channels
├ ── IB ──
├ IB Dashboard · IB Tree · Commissions
├ ── Marketing ──
├ Campaigns · Messages · Banners · News
└ ── Support ──
└ Tickets · Email Log · SMS Log · Push Log · Chat History

Reports                         (5 items — kept verbatim)
├ Financial · Trading · User · Conversion · Compliance

Settings                        (1 link → /crm/settings hub)
└ All configuration in one page with internal nav
```

## 4. Settings hub page

A new page at `/crm/settings` consolidates **all configuration surfaces**. Internal layout:

```
┌─────────────────────────────────────────────────────────┐
│ Settings (hub page)                                      │
├─────────────────┬──────────────────────────────────────┤
│ Sub-nav (left)  │ Content (per-section deep-link)      │
│                 │                                       │
│ ▸ Platform      │ Cards for: Staff Management / Roles  │
│ ▸ Approval      │ / Security / Logs / API / Apps /     │
│   Engine        │ Setup Guide                          │
│ ▸ KYC           │                                       │
│ ▸ Risk          │ ▸ Approval Engine                    │
│ ▸ Trading       │   Workflows · Routing · SLA · Notif. │
│ ▸ Funds         │                                       │
│ ▸ IB            │ ▸ KYC                                │
│                 │   KYC Flows · Routing & Rules ·      │
│                 │   Agreement Docs · System Modules    │
│                 │                                       │
│                 │ ▸ Risk                               │
│                 │   Scoring · Risk Rules · NBP         │
│                 │                                       │
│                 │ ... etc                              │
└─────────────────┴──────────────────────────────────────┘
```

Each section is a card grid of links to the **existing** config pages. No URL changes — the page is purely a discoverability surface.

## 5. URL stability

**All existing URLs stay intact.** Only the sidebar's link organization changes. This means:
- No redirects required
- Bookmarks still work
- Breadcrumbs may need 1–2 link adjustments (e.g. CLM Cases now reached via Clients menu but its detail page breadcrumb still says "CLM Center" — minor, can update later)

## 6. Implementation scope (this phase)

| File | Action |
|------|--------|
| `src/components/crm/layout/Sidebar.tsx` | Rewrite `menuGroups` from 14 → 7 |
| `src/lib/i18n/crm-shell.ts` | Add new group labels (Workspace / Growth / Settings) |
| `src/app/crm/settings/page.tsx` | **NEW** — Settings hub page |
| `docs/Sidebar-IA-v2.md` | ✅ this doc |

Out of scope (follow-up):
- Cmd+K command palette
- Per-page breadcrumb path updates
- Removing dead module references from the codebase

## 7. Acceptance

Done when:
1. Sidebar shows 7 top-level groups + Settings link
2. All 75 leaf URLs are still reachable (via direct URL or new menu)
3. `/crm/settings` renders with section cards covering all v1 config surfaces
4. TypeScript compiles
5. i18n labels present for new groups
