"use client";

/**
 * Approval Center — Inbox (v2)
 *
 * The cross-module personal queue. Replaces the v1 Workspace + My
 * Tasks + Pending Queue + SLA Warning + High Risk + Escalated +
 * Re-Verification menu items — they're now tabs and filter chips
 * inside this single page.
 *
 * Layout:
 *   - KPI tiles  (Mine / Overdue / Critical)
 *   - Tabs       (Mine · Unassigned · All-visible)
 *   - Filter chips for SLA / risk / type
 *   - Task list — inline-approve for `canInlineApprove === true`,
 *                 "Open in [Module] →" handoff for false
 *
 * See `docs/Approval-Center-v2-Architecture.md` for the decisions
 * driving this layout.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Inbox as InboxIcon,
  Clock,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Filter,
  Search,
  RefreshCw,
} from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, BadgeBase } from "@/components/crm/ui";
import { TaskStatusBadge } from "@/components/crm/approvals/TaskStatusBadge";
import { RiskBadge } from "@/components/crm/approvals/RiskBadge";
import { SlaTimer } from "@/components/crm/approvals/SlaTimer";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/crm";
import { allowedTaskTypes } from "@/lib/approval/permissions";
import type {
  ApprovalTask,
  RiskLevel,
  SlaSnapshot,
  TaskType,
} from "@/types/approval";

type Tab = "mine" | "unassigned" | "all";
type SlaChip = "all" | "overdue" | "near";
type RiskChip = "all" | "critical" | "high" | "medium" | "low";

interface TaskWithSnap extends ApprovalTask {
  slaSnapshot?: SlaSnapshot;
}

interface Stats {
  mineCount: number;
  unassignedCount: number;
  overdueCount: number;
  criticalCount: number;
}

export default function InboxPage() {
  return (
    <Suspense fallback={null}>
      <InboxInner />
    </Suspense>
  );
}

function InboxInner() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const toast = useToast();
  const currentUser = useAuthStore((s) => s.user);
  /* Row-level filter: the operator only sees tasks for types their
   * role can act on. Super-admin sees all (the `*` wildcard hits in
   * `canActOnType`). See docs/Approval-Center-v2-Architecture.md §D4. */
  const allowedTypes = useMemo(() => new Set(allowedTaskTypes(currentUser)), [currentUser]);

  /* ── URL-driven state (so tabs / filters survive reload) ──── */

  const tab = ((): Tab => {
    const t = sp.get("tab");
    return t === "unassigned" || t === "all" ? t : "mine";
  })();
  const slaChip = ((): SlaChip => {
    const s = sp.get("sla");
    return s === "overdue" || s === "near" ? s : "all";
  })();
  const riskChip = ((): RiskChip => {
    const r = sp.get("risk");
    return (["critical", "high", "medium", "low"] as RiskChip[]).includes(r as RiskChip)
      ? (r as RiskChip)
      : "all";
  })();
  const typeFilter = sp.get("type") as TaskType | null;
  const search = sp.get("q") ?? "";

  const patchUrl = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "" || v === "all" || v === "mine") params.delete(k);
        else params.set(k, v);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [sp, pathname, router]
  );

  /* ── Data fetching ─────────────────────────────────────────── */

  const [tasks, setTasks] = useState<TaskWithSnap[]>([]);
  const [stats, setStats] = useState<Stats>({ mineCount: 0, unassignedCount: 0, overdueCount: 0, criticalCount: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      /* Build the view query that drives the visible list */
      const params = new URLSearchParams();
      params.set("pageSize", "100");
      if (tab === "mine")        params.set("view", "my-tasks");
      if (tab === "unassigned")  params.set("view", "pending-queue");
      /* "all" → no view = all tasks visible to current operator */

      if (slaChip === "overdue") params.set("slaStatus", "timeout");
      if (slaChip === "near")    params.set("slaStatus", "warning,critical");
      if (riskChip !== "all")    params.set("riskLevel", riskChip);
      if (typeFilter)            params.set("type", typeFilter);
      if (search)                params.set("search", search);

      const [listRes, mineRes, unassignedRes, overdueRes, criticalRes] = await Promise.all([
        fetch(`/api/approvals/tasks?${params}`),
        fetch("/api/approvals/tasks?view=my-tasks&pageSize=1"),
        fetch("/api/approvals/tasks?view=pending-queue&pageSize=1"),
        fetch("/api/approvals/tasks?slaStatus=timeout&pageSize=1"),
        fetch("/api/approvals/tasks?riskLevel=critical&pageSize=1"),
      ]);
      const [listData, mineData, unassignedData, overdueData, criticalData] = await Promise.all([
        listRes.json(),
        mineRes.json(),
        unassignedRes.json(),
        overdueRes.json(),
        criticalRes.json(),
      ]);

      if (listData.success) {
        // Row-level permission filter — drop types the operator's role
        // can't act on. See `canActOnType` for the mapping.
        const filtered = (listData.items as TaskWithSnap[]).filter((t) =>
          allowedTypes.has(t.type)
        );
        setTasks(filtered);
      }
      setStats({
        mineCount:       mineData?.total       ?? 0,
        unassignedCount: unassignedData?.total ?? 0,
        overdueCount:    overdueData?.total    ?? 0,
        criticalCount:   criticalData?.total   ?? 0,
      });
    } finally {
      setLoading(false);
    }
  }, [tab, slaChip, riskChip, typeFilter, search, allowedTypes]);

  useEffect(() => {
    load();
  }, [load]);

  /* ── Quick actions on a row ───────────────────────────────── */

  const performAction = useCallback(
    async (id: string, action: "approve" | "reject" | "claim") => {
      try {
        const res = await fetch(`/api/approvals/tasks/${id}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`Task ${action}ed`);
          load();
        } else {
          toast.error(data.error ?? "Action failed");
        }
      } catch {
        toast.error("Network error");
      }
    },
    [toast, load]
  );

  /* ── Visible counts per tab (informational) ───────────────── */

  const tabCount = useMemo(() => {
    if (tab === "mine") return stats.mineCount;
    if (tab === "unassigned") return stats.unassignedCount;
    return tasks.length;
  }, [tab, stats, tasks.length]);

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "Approval Center" }, { label: "Inbox" }]} />
      <PageHeader
        title="Inbox"
        description="Cross-module approval queue · sorted by SLA"
        actions={
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        }
      />

      {/* KPI tiles */}
      <div className="grid grid-cols-3 gap-3">
        <KpiTile
          icon={<InboxIcon className="w-4 h-4 text-primary" />}
          label="Mine"
          value={stats.mineCount}
          loading={loading}
          onClick={() => patchUrl({ tab: "mine" })}
        />
        <KpiTile
          icon={<Clock className="w-4 h-4 text-red-600" />}
          label="Overdue"
          value={stats.overdueCount}
          loading={loading}
          tone="error"
          onClick={() => patchUrl({ sla: slaChip === "overdue" ? null : "overdue" })}
        />
        <KpiTile
          icon={<AlertTriangle className="w-4 h-4 text-orange-600" />}
          label="Critical"
          value={stats.criticalCount}
          loading={loading}
          tone="warning"
          onClick={() => patchUrl({ risk: riskChip === "critical" ? null : "critical" })}
        />
      </div>

      {/* Main card */}
      <Card padding="none">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-100">
          <TabBtn label="Mine"        count={stats.mineCount}       active={tab === "mine"}       onClick={() => patchUrl({ tab: "mine" })} />
          <TabBtn label="Unassigned"  count={stats.unassignedCount} active={tab === "unassigned"} onClick={() => patchUrl({ tab: "unassigned" })} />
          <TabBtn label="All"         active={tab === "all"}        onClick={() => patchUrl({ tab: "all" })} />
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/40 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <Chip label="Overdue"   active={slaChip === "overdue"} onClick={() => patchUrl({ sla: slaChip === "overdue" ? null : "overdue" })} tone="error" />
          <Chip label="Near SLA"  active={slaChip === "near"}    onClick={() => patchUrl({ sla: slaChip === "near"    ? null : "near"    })} tone="warning" />
          <span className="text-slate-300">·</span>
          <Chip label="Critical"  active={riskChip === "critical"} onClick={() => patchUrl({ risk: riskChip === "critical" ? null : "critical" })} tone="error" />
          <Chip label="High"      active={riskChip === "high"}     onClick={() => patchUrl({ risk: riskChip === "high"     ? null : "high"     })} tone="warning" />
          <span className="text-slate-300">·</span>
          <TypeChip current={typeFilter} onChange={(t) => patchUrl({ type: t })} />

          <div className="flex-1 min-w-[120px]" />

          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              defaultValue={search}
              placeholder="Search task ID / user…"
              onChange={(e) => patchUrl({ q: e.target.value })}
              className="w-56 h-7 pl-7 pr-2 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Task list */}
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyInbox tab={tab} hasFilters={slaChip !== "all" || riskChip !== "all" || !!typeFilter || !!search} />
        ) : (
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <InboxRow key={task.id} task={task} onAction={performAction} />
            ))}
            <div className="px-4 py-2.5 text-center bg-slate-50/40 text-xs text-slate-400 tabular-nums">
              Showing {tasks.length}
              {tab !== "all" && ` of ${tabCount}`}
              {tab === "all" && " tasks"}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Pieces                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

function KpiTile({
  icon, label, value, loading, tone, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading: boolean;
  tone?: "error" | "warning";
  onClick?: () => void;
}) {
  /* KPI tiles read as stats first, shortcut second. The previous
     "selected" treatment (blue ring + blue bg) competed with the
     real selection state below (tabs + chips), so we drop it — the
     tile is now just a hoverable card that nudges focus to the
     matching tab/chip on click. */
  const accent =
    tone === "error"   ? "border-red-100"   :
    tone === "warning" ? "border-amber-100" :
    "border-slate-200";
  return (
    <button onClick={onClick} className="text-left w-full">
      <Card className={`!p-3 hover:shadow-md transition-shadow ${accent}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 truncate">{label}</p>
            <p className="text-xl font-semibold text-slate-900 tabular-nums leading-tight mt-0.5">
              {loading ? (
                <span className="inline-block w-6 h-5 bg-slate-100 rounded animate-pulse" />
              ) : value}
            </p>
          </div>
        </div>
      </Card>
    </button>
  );
}

function TabBtn({
  label, count, active, onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors -mb-px ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${
            active ? "bg-blue-100 text-primary" : "bg-slate-100 text-slate-500"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function Chip({
  label, active, onClick, tone,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: "error" | "warning";
}) {
  const activeTone =
    tone === "error"   ? "bg-red-100 text-red-700 ring-red-200" :
    tone === "warning" ? "bg-amber-100 text-amber-700 ring-amber-200" :
    "bg-blue-100 text-primary ring-blue-200";
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
        active ? `${activeTone} ring-1 border-transparent` : "border-slate-200 text-slate-600 bg-white hover:border-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

const TYPE_OPTIONS: Array<{ value: TaskType | "all"; label: string }> = [
  { value: "all",                label: "All types" },
  { value: "kyc",                label: "KYC" },
  { value: "withdrawal",         label: "Withdrawal" },
  { value: "deposit",            label: "Deposit" },
  { value: "aml_review",         label: "AML Review" },
  { value: "large_withdrawal",   label: "Large Withdrawal" },
  { value: "leverage",           label: "Leverage" },
  { value: "reward",             label: "Reward" },
  { value: "partner",            label: "Partner" },
  { value: "profile_change",     label: "Profile" },
  { value: "re_verification",    label: "Re-Verification" },
];

function TypeChip({ current, onChange }: { current: TaskType | null; onChange: (t: string | null) => void }) {
  return (
    <select
      value={current ?? "all"}
      onChange={(e) => onChange(e.target.value === "all" ? null : e.target.value)}
      className="h-6 px-2 pr-6 border border-slate-200 rounded-full text-[11px] text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
    >
      {TYPE_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function EmptyInbox({ tab, hasFilters }: { tab: Tab; hasFilters: boolean }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-3">
        <InboxIcon className="w-6 h-6 text-emerald-500" />
      </div>
      <p className="text-sm font-semibold text-slate-700">
        {hasFilters ? "Nothing matches the current filters" :
         tab === "mine" ? "Nothing on your plate" :
         tab === "unassigned" ? "Queue is empty" :
         "All caught up"}
      </p>
      <p className="text-xs text-slate-400 mt-1">
        {hasFilters ? "Try clearing the chips above." : "Check back later or switch tabs."}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Task row — bifurcates by canInlineApprove                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

const MODULE_LINK: Record<TaskType, { label: string; href: (t: TaskWithSnap) => string }> = {
  kyc:              { label: "Open in CLM",   href: (t) => `/crm/clm/cases/${t.sourceId}` },
  re_verification:  { label: "Open in CLM",   href: (t) => `/crm/clm/cases/${t.sourceId}` },
  aml_review:       { label: "Open in CLM",   href: (t) => `/crm/clm/cases/${t.sourceId}` },
  withdrawal:       { label: "Open in Funds", href: () => `/crm/funds/withdrawal-review` },
  large_withdrawal: { label: "Open in Funds", href: () => `/crm/funds/withdrawal-review` },
  deposit:          { label: "Open in Funds", href: () => `/crm/funds/deposits` },
  leverage:         { label: "Open in Risk",  href: () => `/crm/risk/margin` },
  reward:           { label: "Open in Marketing", href: () => `/crm/marketing/campaigns` },
  partner:          { label: "Open in IB",    href: () => `/crm/ib` },
  profile_change:   { label: "Open profile",  href: (t) => `/crm/clients/${t.userId}` },
};

function InboxRow({
  task,
  onAction,
}: {
  task: TaskWithSnap;
  onAction: (id: string, action: "approve" | "reject" | "claim") => Promise<void>;
}) {
  const isPending = task.status === "pending";

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors group">
      <Link href={`/crm/approvals/${task.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        {/* Type label */}
        <div className="w-20 flex-shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {task.type.replace(/_/g, " ")}
          </span>
        </div>

        {/* Subject + user */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900 truncate">{task.subject}</p>
          <p className="text-xs text-slate-400 truncate">
            <span className="font-mono tabular-nums">{task.id}</span> · {task.userName} · {task.userCountry}
          </p>
        </div>

        {/* Status + risk + SLA */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <TaskStatusBadge status={task.status} />
          <RiskBadge level={task.riskLevel as RiskLevel} score={task.riskScore} />
          <SlaTimer snapshot={task.slaSnapshot} />
        </div>
      </Link>

      {/* Action cluster — varies by `canInlineApprove` */}
      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
        {isPending && !task.assigneeId ? (
          <button
            onClick={() => onAction(task.id, "claim")}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Claim
          </button>
        ) : task.canInlineApprove ? (
          <>
            <button
              onClick={() => onAction(task.id, "reject")}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={() => onAction(task.id, "approve")}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              Approve
            </button>
          </>
        ) : (
          <Link
            href={MODULE_LINK[task.type]?.href(task) ?? `/crm/approvals/${task.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary border border-blue-200 hover:bg-blue-50 transition-colors"
          >
            {MODULE_LINK[task.type]?.label ?? "Review"}
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>

      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
    </div>
  );
}
