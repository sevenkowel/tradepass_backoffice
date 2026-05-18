"use client";

/**
 * Approval Center — Task Detail
 *
 * Layout follows the CRM Review Detail standard (see
 * `docs/05-UI-System/Review-Detail-Layout.md`):
 *   ┌─────────────────────────────────────────────────────┐
 *   │ Breadcrumb + optional critical banner               │
 *   ├──────────┬───────────────────────┬──────────────────┤
 *   │ LEFT     │ CENTER                │ RIGHT            │
 *   │ 288px    │ flex-1                │ 320px            │
 *   │ sticky   │                       │ sticky           │
 *   │          │                       │                  │
 *   │ Task     │ Type-based            │ Composite Risk   │
 *   │ Customer │ submission docs       │ Type extras      │
 *   │ Quick    │                       │ Timeline         │
 *   │ Access   │                       │                  │
 *   ├──────────┴───────────────────────┴──────────────────┤
 *   │ Sticky bottom action bar:                           │
 *   │ Note input · Decision buttons (status-aware)        │
 *   └─────────────────────────────────────────────────────┘
 *
 * Every approval task type renders into the same skeleton; only the
 * CENTER document section and the optional RIGHT extras vary by type.
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Shield, AlertTriangle, MessageSquare, Send, FileText,
  Monitor, Users, ExternalLink, ArrowDownCircle, ArrowUpCircle,
  ShieldCheck, TrendingUp, Gift, Network, UserCog, ScrollText,
} from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, BadgeBase } from "@/components/crm/ui";
import { TaskStatusBadge } from "@/components/crm/approvals/TaskStatusBadge";
import { RiskBadge } from "@/components/crm/approvals/RiskBadge";
import { SlaTimer } from "@/components/crm/approvals/SlaTimer";
import { useCrmSidebarStore } from "@/store/crmSidebarStore";
import { useToast } from "@/components/ui/use-toast";
import type {
  ApprovalAction,
  ApprovalTask,
  AuditEntry,
  SlaSnapshot,
  TaskType,
} from "@/types/approval";

interface TaskDetail extends ApprovalTask {
  slaSnapshot?: SlaSnapshot;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Main page                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function ApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const taskId = params.id as string;

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [note, setNote] = useState("");

  // Inline confirm state — which destructive button is awaiting confirm
  const [confirming, setConfirming] = useState<ApprovalAction | null>(null);

  const load = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/approvals/tasks/${taskId}`);
      const data = await res.json();
      if (data.success) {
        setTask(data.task);
        setAudit(data.auditTrail);
      }
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  const performAction = useCallback(
    async (action: ApprovalAction, opts?: { note?: string; reason?: string }) => {
      if (!task) return;
      setActing(true);
      try {
        const res = await fetch(`/api/approvals/tasks/${task.id}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, note: opts?.note, reason: opts?.reason }),
        });
        const data = await res.json();
        if (data.success) {
          setTask(data.task);
          setNote("");
          setConfirming(null);
          const auditRes = await fetch(`/api/approvals/audit-trail?taskId=${task.id}`);
          const auditData = await auditRes.json();
          if (auditData.success) setAudit(auditData.logs);
          toast.success(`Task ${action.replace(/_/g, " ")}d`);
        } else {
          toast.error(data.error ?? "Action failed");
        }
      } finally {
        setActing(false);
      }
    },
    [task, toast]
  );

  /* ── Loading / not-found states ── */

  if (loading) {
    return (
      <PageShell>
        <Breadcrumb
          items={[
            { label: "Approval Center" },
            { label: "Inbox", href: "/crm/approvals/inbox" },
            { label: "Loading…" },
          ]}
        />
        <div className="flex gap-3 mt-3">
          <div className="w-72 flex-shrink-0 h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          <div className="flex-1 h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          <div className="w-80 flex-shrink-0 h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        </div>
      </PageShell>
    );
  }

  if (!task) {
    return (
      <PageShell>
        <Breadcrumb
          items={[
            { label: "Approval Center" },
            { label: "Inbox", href: "/crm/approvals/inbox" },
            { label: "Not found" },
          ]}
        />
        <Card className="text-center py-16 mt-3">
          <p className="text-sm text-slate-500">Task not found</p>
          <button
            onClick={() => router.push("/crm/approvals/inbox")}
            className="mt-3 text-xs text-primary hover:underline"
          >
            ← Back to Inbox
          </button>
        </Card>
      </PageShell>
    );
  }

  const isTerminal = ["approved", "rejected"].includes(task.status);
  const isCritical = task.riskLevel === "critical" || (task.riskFlags?.includes("sanction_hit") ?? false);
  const reverseAudit = audit.slice().reverse();

  return (
    <PageShell>
      <Breadcrumb
        items={[
          { label: "Approval Center" },
          { label: "Inbox", href: "/crm/approvals/inbox" },
          { label: task.id },
        ]}
      />

      {/* Critical risk banner */}
      {isCritical && !isTerminal && (
        <div className="mt-3 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-semibold text-red-800">
              Critical risk profile{task.riskFlags?.includes("sanction_hit") ? " · AML watchlist hit" : ""}
            </p>
            <p className="text-red-700 mt-0.5">
              Manual escalation is recommended. Approving requires explicit justification.
            </p>
          </div>
        </div>
      )}

      {/* Body — 3 columns */}
      <div className="flex gap-3 mt-3">
        {/* LEFT */}
        <aside className="w-72 flex-shrink-0 space-y-3 sticky top-[64px] self-start">
          <TaskInfoCard task={task} />
          <CustomerCard task={task} />
          <QuickAccessCard userId={task.userId} />
        </aside>

        {/* CENTER */}
        <main className="flex-1 min-w-0 space-y-3">
          <TypeBasedContent task={task} />
        </main>

        {/* RIGHT */}
        <aside className="w-80 flex-shrink-0 space-y-3 sticky top-[64px] self-start">
          <CompositeRiskCard task={task} />
          <TypeExtras task={task} />
          <TimelineCard audit={reverseAudit} />
        </aside>
      </div>

      {/* Bottom action bar */}
      {!isTerminal && (
        <BottomActionBar
          task={task}
          note={note}
          setNote={setNote}
          acting={acting}
          confirming={confirming}
          setConfirming={setConfirming}
          onAction={performAction}
        />
      )}
    </PageShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Page shell — full-bleed slate background + bottom space for action bar      */
/* ─────────────────────────────────────────────────────────────────────────── */

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-3 lg:-mx-4 -my-3 lg:-my-4 bg-slate-50 px-3 py-2 min-h-[calc(100vh-64px)] pb-24">
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* LEFT column                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

function TaskInfoCard({ task }: { task: TaskDetail }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <p className="text-base font-bold text-slate-900 font-mono tabular-nums mb-3">
        {task.id}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap mb-3.5">
        <TaskTypeBadge type={task.type} />
        <TaskStatusBadge status={task.status} />
        <RiskBadge level={task.riskLevel} score={task.riskScore} />
      </div>

      <div className="space-y-2 text-xs">
        <InfoRow label="SLA" value={<SlaTimer snapshot={task.slaSnapshot} />} />
        <InfoRow
          label="Assignee"
          value={
            task.assigneeName ? (
              <span className="font-medium text-slate-700">{task.assigneeName}</span>
            ) : (
              <span className="italic text-slate-400">Unassigned</span>
            )
          }
        />
        {task.assigneeRole && (
          <InfoRow
            label="Role"
            value={<span className="capitalize">{task.assigneeRole.replace(/_/g, " ")}</span>}
          />
        )}
        <InfoRow
          label="Module"
          value={<span className="font-mono text-[11px]">{task.module}</span>}
        />
        <InfoRow
          label="Source ID"
          value={<span className="font-mono text-[11px]">{task.sourceId}</span>}
        />
        <InfoRow
          label="Created"
          value={<span className="font-mono tabular-nums text-[11px]">{fmtDateTime(task.createdAt)}</span>}
        />
        {task.claimedAt && (
          <InfoRow
            label="Claimed"
            value={<span className="font-mono tabular-nums text-[11px]">{fmtDateTime(task.claimedAt)}</span>}
          />
        )}
      </div>
    </div>
  );
}

function CustomerCard({ task }: { task: TaskDetail }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center gap-3 mb-3.5">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {task.userName.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{task.userName}</p>
          <p className="text-[11px] text-slate-400 font-mono">{task.userUid}</p>
        </div>
      </div>
      <div className="space-y-2 text-xs">
        {task.userEmail && (
          <InfoRow label="Email" value={<span className="truncate">{task.userEmail}</span>} />
        )}
        <InfoRow label="Country" value={<CountryFlag code={task.userCountry} />} />
        {task.userTier && (
          <InfoRow label="Tier" value={<span className="capitalize">{task.userTier}</span>} />
        )}
      </div>
    </div>
  );
}

function QuickAccessCard({ userId }: { userId: string }) {
  const items = [
    { label: "Profile", href: `/crm/clients/${userId}`,            icon: Shield },
    { label: "Funds",   href: `/crm/clients/${userId}?tab=funds`,  icon: FileText },
    { label: "Trading", href: `/crm/clients/${userId}?tab=trading`, icon: Monitor },
    { label: "Risk",    href: `/crm/clients/${userId}?tab=risk`,   icon: AlertTriangle },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
        Quick Access
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {items.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="group flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-slate-100 text-xs text-slate-600 hover:text-primary hover:border-blue-200 hover:bg-blue-50 transition-colors"
          >
            <Icon className="w-3 h-3 text-slate-400 group-hover:text-primary flex-shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* CENTER — type-based content                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

function TypeBasedContent({ task }: { task: TaskDetail }) {
  return (
    <>
      <SubjectCard task={task} />
      {/* Bifurcate: complex cases hand off to the source module instead of
       *  re-implementing each type's submission viewer. See
       *  docs/Approval-Center-v2-Architecture.md (D1). */}
      {task.canInlineApprove ? (
        <InlinePayload task={task} />
      ) : (
        <HandoffCard task={task} />
      )}
    </>
  );
}

function SubjectCard({ task }: { task: TaskDetail }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">{task.subject}</h2>
          {task.description && (
            <p className="text-sm text-slate-500 mt-1">{task.description}</p>
          )}
        </div>
        {task.detailUrl && (
          <Link
            href={task.detailUrl}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors flex-shrink-0"
          >
            Business record
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>

      {task.resolutionNote && (
        <div className="mt-3 text-sm text-emerald-800 bg-emerald-50 rounded-lg p-3 border border-emerald-100">
          <span className="font-medium">Resolution:</span> {task.resolutionNote}
        </div>
      )}
    </div>
  );
}

/** Inline payload — rendered only when `canInlineApprove === true`.
 *  The complex types (KYC, AML, large withdrawals) used to render here
 *  as placeholder cards; in v2 they hand off to the source module via
 *  HandoffCard, so the switch is intentionally narrow. */
function InlinePayload({ task }: { task: TaskDetail }) {
  switch (task.type) {
    case "deposit":         return <DepositPayload task={task} />;
    case "withdrawal":      return <WithdrawalPayload task={task} />;
    case "leverage":        return <LeveragePayload task={task} />;
    case "reward":          return <RewardPayload task={task} />;
    case "profile_change":  return <GenericPayload task={task} title="Profile Change Request" />;
    default:                return <GenericPayload task={task} title="Submission Details" />;
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Handoff — complex cases ship the decision to the source module             */
/* ─────────────────────────────────────────────────────────────────────────── */

const HANDOFF: Record<TaskType, { module: string; href: (t: TaskDetail) => string; reason: string }> = {
  kyc:              { module: "CLM Center",   reason: "KYC review needs full document + liveness inspection in the CLM case viewer.", href: (t) => `/crm/clm/cases/${t.sourceId}` },
  re_verification:  { module: "CLM Center",   reason: "Re-verification requires the templated checklist and prior-submission diff in CLM.", href: (t) => `/crm/clm/cases/${t.sourceId}` },
  aml_review:       { module: "CLM Center",   reason: "AML reviews use the watchlist hit detail and SAR workflow in CLM.", href: (t) => `/crm/clm/cases/${t.sourceId}` },
  large_withdrawal: { module: "Funds",        reason: "Large withdrawals need the full settlement route + counterparty check.", href: () => `/crm/funds/withdrawal-review` },
  withdrawal:       { module: "Funds",        reason: "Open the withdrawal queue to see the routing and AML score detail.", href: () => `/crm/funds/withdrawal-review` },
  deposit:          { module: "Funds",        reason: "Open the deposit ledger for the full payment trail.", href: () => `/crm/funds/deposits` },
  leverage:         { module: "Risk Center",  reason: "Leverage changes require the margin model and exposure check.", href: () => `/crm/risk/margin` },
  reward:           { module: "Marketing",    reason: "Rewards review uses the campaign attribution context.", href: () => `/crm/marketing/campaigns` },
  partner:          { module: "IB",           reason: "Partner / IB applications need the hierarchy & commission tier preview.", href: () => `/crm/ib` },
  profile_change:   { module: "Client Detail", reason: "Profile diffs are inspected on the client's profile tab.", href: (t) => `/crm/clients/${t.userId}` },
};

function HandoffCard({ task }: { task: TaskDetail }) {
  const cfg = HANDOFF[task.type];
  if (!cfg) return <GenericPayload task={task} title="Submission Details" />;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">Decision happens in {cfg.module}</h3>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-sm text-slate-600">{cfg.reason}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Type"><span className="capitalize">{task.type.replace(/_/g, " ")}</span></Field>
          <Field label="Module">{task.module}</Field>
          <Field label="Source ID" mono>{task.sourceId}</Field>
          {task.amount !== undefined && (
            <Field label="Amount" mono accent>
              {task.currency} {task.amount.toLocaleString()}
            </Field>
          )}
        </div>

        <div className="pt-2">
          <Link
            href={cfg.href(task)}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-colors"
          >
            Open in {cfg.module}
            <ExternalLink className="w-4 h-4" />
          </Link>
          <p className="text-[11px] text-slate-400 mt-2">
            Decisions made there flow back to this task's audit trail automatically.
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function WithdrawalPayload({ task }: { task: TaskDetail }) {
  return (
    <SectionCard title="Withdrawal Details">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <Field label="Amount" mono accent>
          {task.currency} {task.amount?.toLocaleString() ?? "—"}
        </Field>
        <Field label="Wallet">Main Wallet</Field>
        <Field label="Destination">Bank Transfer</Field>
        <Field label="AML score" mono>
          {task.riskScore !== undefined ? `${task.riskScore}/100` : "—"}
        </Field>
        <Field label="Method">Bank wire</Field>
        <Field label="Reference" mono>{task.sourceId}</Field>
      </div>
    </SectionCard>
  );
}

function DepositPayload({ task }: { task: TaskDetail }) {
  return (
    <SectionCard title="Deposit Details">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <Field label="Amount" mono accent>
          {task.currency} {task.amount?.toLocaleString() ?? "—"}
        </Field>
        <Field label="Method">Bank Transfer</Field>
        <Field label="Reference" mono>{task.sourceId}</Field>
        <Field label="Channel">Web Portal</Field>
      </div>
    </SectionCard>
  );
}

// KycPayload + AmlPayload were removed in v2: their cases now route
// through HandoffCard above (canInlineApprove === false → handed off
// to CLM Center for the real document / watchlist viewer).

function LeveragePayload({ task }: { task: TaskDetail }) {
  return (
    <SectionCard title="Leverage Request">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <Field label="Trading account" mono>{task.sourceId}</Field>
        <Field label="Requested leverage" accent>1:500</Field>
        <Field label="Current leverage">1:200</Field>
        <Field label="Account balance" mono>
          {task.currency} {task.amount?.toLocaleString() ?? "—"}
        </Field>
      </div>
    </SectionCard>
  );
}

function RewardPayload({ task }: { task: TaskDetail }) {
  return (
    <SectionCard title="Reward / Promotion">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <Field label="Reward amount" mono accent>
          {task.currency} {task.amount?.toLocaleString() ?? "—"}
        </Field>
        <Field label="Reference" mono>{task.sourceId}</Field>
      </div>
    </SectionCard>
  );
}

function GenericPayload({ task, title }: { task: TaskDetail; title: string }) {
  return (
    <SectionCard title={title}>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <Field label="Type">
          <span className="capitalize">{task.type.replace(/_/g, " ")}</span>
        </Field>
        <Field label="Reference" mono>{task.sourceId}</Field>
        {task.amount !== undefined && (
          <Field label="Amount" mono>
            {task.currency} {task.amount.toLocaleString()}
          </Field>
        )}
      </div>
      {task.detailUrl && (
        <p className="mt-3 text-xs text-slate-500">
          Full submission lives on the linked business record.
        </p>
      )}
    </SectionCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* RIGHT column                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */

function CompositeRiskCard({ task }: { task: TaskDetail }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
        <Shield className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900">Risk Assessment</h3>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Level</span>
          <RiskBadge level={task.riskLevel} score={task.riskScore} />
        </div>
        {task.riskScore !== undefined && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500">Score</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {task.riskScore}/100
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  task.riskScore >= 85 ? "bg-red-500" :
                  task.riskScore >= 60 ? "bg-orange-500" :
                  task.riskScore >= 30 ? "bg-amber-500" :
                  "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, task.riskScore)}%` }}
              />
            </div>
          </div>
        )}
        {task.riskFlags && task.riskFlags.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Flags</p>
            <div className="flex flex-wrap gap-1">
              {task.riskFlags.map((flag) => (
                <BadgeBase key={flag} tone="error" dot={false}>
                  {flag}
                </BadgeBase>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Type-specific decision aids placed in the right column under risk.
 *  Reserved as an extension point — each task type can surface a small
 *  right-side card relevant to its decision (e.g. related cases, AML
 *  watchlist hits, IB hierarchy). For now we surface a thin "Decision
 *  Hints" card with the most common signals. */
function TypeExtras({ task }: { task: TaskDetail }) {
  const hints: Array<{ label: string; value: string; tone?: "success" | "warning" | "error" }> = [];

  if (task.canInlineApprove) {
    hints.push({ label: "Inline approve", value: "Eligible", tone: "success" });
  } else {
    hints.push({ label: "Inline approve", value: "Forced review", tone: "warning" });
  }

  if (task.slaSnapshot?.isOverdue) {
    hints.push({ label: "SLA", value: "Overdue", tone: "error" });
  } else if (task.slaSnapshot?.status === "warning" || task.slaSnapshot?.status === "critical") {
    hints.push({ label: "SLA", value: "Near timeout", tone: "warning" });
  }

  if (task.previousStatus) {
    hints.push({
      label: "Previous state",
      value: task.previousStatus.replace(/_/g, " "),
    });
  }

  if (hints.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">Decision Hints</h3>
      </div>
      <div className="p-4 space-y-2">
        {hints.map((h) => (
          <div key={h.label} className="flex items-center justify-between text-xs">
            <span className="text-slate-500">{h.label}</span>
            {h.tone ? (
              <BadgeBase tone={h.tone} size="sm">
                {h.value}
              </BadgeBase>
            ) : (
              <span className="capitalize text-slate-700">{h.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineCard({ audit }: { audit: AuditEntry[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Timeline</h3>
        <span className="text-[10px] text-slate-400 tabular-nums">{audit.length} events</span>
      </div>
      <div className="p-4">
        {audit.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3">No activity yet</p>
        ) : (
          <ol className="relative border-l border-slate-200 ml-1 space-y-3">
            {audit.map((log) => (
              <li key={log.id} className="ml-4">
                <span className={`absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full ring-2 ring-white ${
                  log.action === "approve" ? "bg-emerald-500" :
                  log.action === "reject"  ? "bg-red-500" :
                  log.action === "hold"    ? "bg-amber-500" :
                  log.action === "escalate" ? "bg-orange-500" :
                  "bg-blue-500"
                }`} />
                <p className="text-xs text-slate-900">
                  <span className="font-medium">{log.operatorName}</span>{" "}
                  <span className="text-slate-500">{log.actionLabel}</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {log.oldStatus} → <span className="font-medium text-slate-700">{log.newStatus}</span>
                </p>
                {log.note && (
                  <p className="text-[11px] text-slate-500 mt-0.5 italic">{log.note}</p>
                )}
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono tabular-nums">
                  {fmtDateTime(log.timestamp)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Bottom action bar                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */

interface DecisionButton {
  action: ApprovalAction;
  label: string;
  variant: "primary" | "danger" | "warning" | "neutral";
  needsReason?: boolean;
}

/* v2: the v1 enum distinction between `pending` and `in_review` is gone.
 * The same axis is now captured by whether the task has an assignee
 * (or carries the `claimed` tag). The button set therefore depends on
 * status + claimed-ness. */
function decisionsForStatus(task: TaskDetail): DecisionButton[] {
  const claimed = !!task.assigneeId || (task.tags?.includes("claimed") ?? false);

  switch (task.status) {
    case "pending":
      if (!claimed) {
        return [{ action: "claim", label: "Claim", variant: "primary" }];
      }
      return [
        { action: "escalate",          label: "Escalate", variant: "warning", needsReason: true },
        { action: "request_re_submit", label: "Resubmit", variant: "neutral", needsReason: true },
        { action: "hold",              label: "Hold",     variant: "neutral", needsReason: true },
        { action: "reject",            label: "Reject",   variant: "danger",  needsReason: true },
        { action: "approve",           label: "Approve",  variant: "primary" },
      ];
    case "on_hold":
      return [
        { action: "release", label: "Release", variant: "neutral" },
        { action: "reject",  label: "Reject",  variant: "danger",  needsReason: true },
        { action: "approve", label: "Approve", variant: "primary" },
      ];
    default:
      return [];
  }
}

function BottomActionBar({
  task, note, setNote, acting, confirming, setConfirming, onAction,
}: {
  task: TaskDetail;
  note: string;
  setNote: (v: string) => void;
  acting: boolean;
  confirming: ApprovalAction | null;
  setConfirming: (a: ApprovalAction | null) => void;
  onAction: (action: ApprovalAction, opts?: { note?: string; reason?: string }) => Promise<void>;
}) {
  const sidebarCollapsed = useCrmSidebarStore((s) => s.sidebarCollapsed);
  const decisions = decisionsForStatus(task);
  if (decisions.length === 0) return null;

  const confirmingDef = decisions.find((d) => d.action === confirming);
  const noteRequired = confirmingDef?.needsReason ?? false;
  const canConfirm = !noteRequired || note.trim().length > 0;

  const handleClick = (def: DecisionButton) => {
    if (def.needsReason) {
      if (confirming === def.action) {
        // Second click → submit
        if (note.trim()) onAction(def.action, { reason: note.trim(), note: note.trim() });
      } else {
        setConfirming(def.action);
      }
    } else {
      onAction(def.action, note.trim() ? { note: note.trim() } : undefined);
    }
  };

  return (
    <div
      className={`fixed bottom-0 right-0 left-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(15,23,42,0.06)] transition-[left] duration-300 ${
        sidebarCollapsed ? "lg:left-[80px]" : "lg:left-[260px]"
      }`}
    >
      <div className="px-3 lg:px-4 py-2.5 flex gap-4">
        {/* Left spacer — matches LEFT aside width */}
        <div className="w-72 flex-shrink-0 hidden lg:block" />

        {/* Center cluster — right-aligned within the document column */}
        <div className="flex-1 min-w-0 flex items-center justify-end gap-3">
          {/* Note input */}
          <div className="flex items-center gap-2 min-w-0 w-80">
            <div className="flex-1 relative min-w-0">
              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={noteRequired ? "Reason required for this action…" : "Add a note (optional)…"}
                className={`w-full pl-9 pr-3 h-9 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                  noteRequired && !canConfirm
                    ? "border border-amber-300 focus:ring-amber-400/30 focus:border-amber-400"
                    : "border border-slate-200 focus:ring-blue-500/30 focus:border-blue-400"
                }`}
              />
            </div>
          </div>

          {/* Decision buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {decisions.map((d) => {
              const isConfirming = confirming === d.action;
              const tone =
                d.variant === "primary" ? "bg-blue-600 hover:bg-blue-700 text-white" :
                d.variant === "danger"  ? "bg-white border border-red-200 text-red-600 hover:bg-red-50" :
                d.variant === "warning" ? "bg-white border border-orange-200 text-orange-600 hover:bg-orange-50" :
                "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50";
              const primaryConfirmingTone =
                d.variant === "danger"  ? "bg-red-600 text-white border-red-600 hover:bg-red-700" :
                d.variant === "warning" ? "bg-orange-600 text-white border-orange-600 hover:bg-orange-700" :
                "bg-slate-700 text-white border-slate-700 hover:bg-slate-800";

              return (
                <button
                  key={d.action}
                  onClick={() => handleClick(d)}
                  disabled={acting || (isConfirming && !canConfirm)}
                  className={`px-3 h-9 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    isConfirming ? primaryConfirmingTone : tone
                  }`}
                  title={isConfirming ? "Click again to confirm" : d.label}
                >
                  {isConfirming
                    ? acting
                      ? "Submitting…"
                      : `Confirm ${d.label}`
                    : d.label}
                </button>
              );
            })}

            {/* Cancel confirming */}
            {confirming && (
              <button
                onClick={() => setConfirming(null)}
                disabled={acting}
                className="px-2 h-9 rounded-lg text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Right spacer — matches RIGHT aside width */}
        <div className="w-80 flex-shrink-0 hidden lg:block" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <span className="text-slate-400 flex-shrink-0">{label}</span>
      <span className="font-medium text-slate-700 text-right min-w-0 truncate">{value}</span>
    </div>
  );
}

function Field({
  label, children, mono = false, accent = false,
}: {
  label: string;
  children: ReactNode;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className={`text-sm ${mono ? "font-mono tabular-nums" : ""} ${accent ? "font-semibold text-slate-900" : "text-slate-700"}`}>
        {children}
      </p>
    </div>
  );
}

const TYPE_ICON: Record<TaskType, typeof Shield> = {
  kyc:               ShieldCheck,
  withdrawal:        ArrowUpCircle,
  deposit:           ArrowDownCircle,
  leverage:          TrendingUp,
  reward:            Gift,
  partner:           Network,
  profile_change:    UserCog,
  aml_review:        Shield,
  large_withdrawal:  ArrowUpCircle,
  re_verification:   ScrollText,
};

function TaskTypeBadge({ type }: { type: TaskType }) {
  const Icon = TYPE_ICON[type] ?? Shield;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
      <Icon className="w-3 h-3" />
      {type.replace(/_/g, " ")}
    </span>
  );
}

function CountryFlag({ code }: { code: string }) {
  if (!code || code.length !== 2) return <span className="text-slate-400">—</span>;
  const flag = code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-base leading-none">{flag}</span>
      <span className="font-mono tabular-nums text-[11px]">{code.toUpperCase()}</span>
    </span>
  );
}

function fmtDateTime(d: string | Date): string {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
