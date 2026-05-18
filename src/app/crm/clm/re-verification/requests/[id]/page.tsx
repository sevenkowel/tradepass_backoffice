"use client";

/**
 * Re-Verification → Request Detail.
 *
 * Read-mostly view: shows the captured trigger, restriction posture,
 * notification channels, deadline & SLA. Operators can cancel the request
 * while it is still in `draft` or `notified`, and once a case has been
 * spawned they can jump straight into the CLM case detail.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Hourglass,
  Mail,
  ShieldQuestion,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, Button } from "@/components/crm/ui";
import { reVerificationService } from "@/lib/clm/services";
import { useCurrentStaffName } from "@/hooks/useCurrentStaff";
import {
  CHANNEL_META,
  REASON_LABELS,
  RESTRICTION_LEVEL_META,
  RESTRICTION_SCOPE_LABELS,
  STATUS_META,
  StatusPill,
  TRIGGER_LABELS,
  TYPE_META,
  TypePill,
  fmtRel,
} from "@/components/crm/clm/re-verification/bits";
import type { ReVerificationRequest, ReVerificationStatus } from "@/types/clm";

const STATUS_TONE: Record<ReVerificationStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  notified: "bg-blue-50 text-blue-700",
  submitted: "bg-amber-50 text-amber-700",
  in_review: "bg-violet-50 text-violet-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  expired: "bg-orange-50 text-orange-700",
  cancelled: "bg-slate-100 text-slate-500",
};

function fmtAbs(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReVerificationRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const actor = useCurrentStaffName();
  const id = decodeURIComponent(String(params.id));

  const [row, setRow] = useState<ReVerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await reVerificationService.requests.getById(id);
      setRow(result);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isOpen = row?.status === "draft" || row?.status === "notified";
  const isAwaiting = row?.status === "submitted" || row?.status === "in_review";

  const overdue = useMemo(() => {
    if (!row?.deadlineAt) return false;
    return new Date(row.deadlineAt).getTime() < Date.now();
  }, [row?.deadlineAt]);

  const onCancel = async () => {
    if (!row) return;
    if (!confirm("Cancel this re-verification? The user's inbox notice stays in place but no longer requires action.")) {
      return;
    }
    setBusy(true);
    try {
      await reVerificationService.requests.cancel(row.id, actor);
      setToast("Request cancelled");
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const onApprove = async () => {
    if (!row) return;
    setBusy(true);
    try {
      await reVerificationService.requests.setStatus(row.id, "approved", actor);
      setToast("Request approved");
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const onReject = async () => {
    if (!row) return;
    if (!confirm("Reject this re-verification?")) return;
    setBusy(true);
    try {
      await reVerificationService.requests.setStatus(row.id, "rejected", actor);
      setToast("Request rejected");
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm gap-2">
        <Hourglass className="w-4 h-4 animate-pulse" />
        Loading request…
      </div>
    );
  }

  if (!row) {
    return (
      <div className="space-y-3">
        <Breadcrumb
          items={[
            { label: "CLM Center" },
            { label: "Re-Verification", href: "/crm/clm/re-verification/requests" },
            { label: "Requests", href: "/crm/clm/re-verification/requests" },
            { label: id },
          ]}
        />
        <Card className="p-10 text-center text-slate-500">
          <ShieldQuestion className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium">Request not found.</p>
          <p className="text-xs text-slate-400 mt-1">
            It may have been cancelled or never existed.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => router.push("/crm/clm/re-verification/requests")}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to list
          </Button>
        </Card>
      </div>
    );
  }

  const typeMeta = TYPE_META[row.type];
  const restrictionMeta = RESTRICTION_LEVEL_META[row.restriction.level];

  return (
    <div className="space-y-3">
      <Breadcrumb
        items={[
          { label: "CLM Center" },
          { label: "Re-Verification", href: "/crm/clm/re-verification/requests" },
          { label: "Requests", href: "/crm/clm/re-verification/requests" },
          { label: row.requestNo },
        ]}
      />

      <div className="flex items-center justify-between gap-3 -mt-1">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono tabular-nums text-base font-semibold text-slate-900">
            {row.requestNo}
          </span>
          <StatusPill status={row.status} />
          <span className="text-xs text-slate-400 truncate">
            Re-verification · {typeMeta.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {row.caseId && (
            <Link
              href={`/crm/clm/cases/${row.caseId}`}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline px-2 py-1.5 rounded-md hover:bg-blue-50"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Linked case
            </Link>
          )}
          {isAwaiting && (
            <>
              <Button size="sm" variant="secondary" onClick={onReject} disabled={busy}>
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </Button>
              <Button size="sm" onClick={onApprove} disabled={busy}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve
              </Button>
            </>
          )}
          {isOpen && (
            <Button size="sm" variant="secondary" onClick={onCancel} disabled={busy}>
              <Ban className="w-3.5 h-3.5" />
              Cancel request
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        {/* Left — user + summary */}
        <div className="col-span-12 lg:col-span-4 space-y-3">
          <Card padding="md">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Target
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center text-sm font-semibold text-primary">
                {row.userName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {row.userName}
                </p>
                <p className="text-[11px] font-mono tabular-nums text-slate-500 truncate">
                  {row.userUid} · {row.country}
                </p>
              </div>
            </div>
            <DetailRow label="Email" value={row.userEmail} mono />
            <DetailRow
              label="Profile"
              value={
                <Link
                  href={`/crm/clients/${row.userId}`}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Open profile
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
          </Card>

          <Card padding="md">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Trigger
            </h3>
            <DetailRow label="Source" value={TRIGGER_LABELS[row.trigger]} />
            <DetailRow label="Reason" value={REASON_LABELS[row.triggerReason]} />
            {row.ruleId && <DetailRow label="Rule" value={row.ruleId} mono />}
            <DetailRow
              label="Created"
              value={
                <span className="text-slate-600">
                  {fmtAbs(row.createdAt)}
                  <span className="text-slate-400 text-[11px] ml-1.5">
                    · {fmtRel(row.createdAt)}
                  </span>
                </span>
              }
            />
            <DetailRow label="Created by" value={row.createdByName} />
            {row.reasonText && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Operator note
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {row.reasonText}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Center — verification + restriction + timeline */}
        <div className="col-span-12 lg:col-span-8 space-y-3">
          <Card padding="md">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Verification type
                </h3>
                <div className="flex items-center gap-2">
                  <TypePill type={row.type} />
                  <span className="text-xs text-slate-500">
                    {typeMeta.description}
                  </span>
                </div>
              </div>
              {row.deadlineAt && (
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Deadline
                  </p>
                  <p
                    className={`text-sm font-mono tabular-nums ${
                      overdue ? "text-red-600 font-semibold" : "text-slate-700"
                    }`}
                  >
                    {fmtAbs(row.deadlineAt)}
                  </p>
                  <p className={`text-[11px] mt-0.5 ${overdue ? "text-red-500" : "text-slate-400"}`}>
                    {fmtRel(row.deadlineAt)}
                    {overdue && (
                      <span className="ml-1 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        overdue
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card padding="md">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Restriction
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${restrictionMeta.tone}`}
              >
                {restrictionMeta.label}
              </span>
              <span className="text-xs text-slate-500">
                {restrictionMeta.description}
              </span>
            </div>
            {row.restriction.scopes.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No scopes restricted.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {row.restriction.scopes.map((scope) => (
                  <span
                    key={scope}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-700"
                  >
                    {RESTRICTION_SCOPE_LABELS[scope]}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-3">
              Validity: {row.restriction.validityHours}h after notification
            </p>
          </Card>

          <Card padding="md">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Notification
            </h3>
            <div className="flex flex-wrap gap-2">
              {row.notification.channels.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No channels configured.</p>
              ) : (
                row.notification.channels.map((channel) => {
                  const meta = CHANNEL_META[channel];
                  const Icon = meta.icon;
                  return (
                    <span
                      key={channel}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs ${meta.tone}`}
                    >
                      <Icon className="w-3 h-3" />
                      {meta.label}
                    </span>
                  );
                })
              )}
            </div>
            {row.notification.templateId && (
              <p className="text-[11px] text-slate-500 mt-3">
                Template:{" "}
                <span className="font-mono text-slate-700">
                  {row.notification.templateId}
                </span>
              </p>
            )}
          </Card>

          <Card padding="md">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Lifecycle
            </h3>
            <div className="space-y-3">
              <LifecycleRow
                icon={Bell}
                label="Created"
                at={row.createdAt}
                actor={row.createdByName}
                done
              />
              <LifecycleRow
                icon={Mail}
                label="Notified"
                at={row.notifiedAt}
                done={!!row.notifiedAt}
              />
              <LifecycleRow
                icon={Clock}
                label="Submitted"
                at={row.submittedAt}
                done={!!row.submittedAt}
              />
              <LifecycleRow
                icon={
                  row.status === "approved"
                    ? CheckCircle2
                    : row.status === "rejected"
                    ? XCircle
                    : ShieldQuestion
                }
                label={
                  row.status === "approved"
                    ? "Approved"
                    : row.status === "rejected"
                    ? "Rejected"
                    : row.status === "expired"
                    ? "Expired"
                    : row.status === "cancelled"
                    ? "Cancelled"
                    : "Resolved"
                }
                at={row.resolvedAt}
                done={!!row.resolvedAt}
              />
            </div>
          </Card>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-md shadow-lg">
          <ShieldQuestion className="w-3.5 h-3.5 text-emerald-400" />
          {toast}
          <button onClick={() => setToast(null)} className="ml-2 text-white/60 hover:text-white">
            <XCircle className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Small subcomponents ─────────────────────────────────────────────── */

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-xs">
      <span className="text-slate-500 flex-shrink-0">{label}</span>
      <span className={`text-right text-slate-700 min-w-0 truncate ${mono ? "font-mono tabular-nums" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function LifecycleRow({
  icon: Icon,
  label,
  at,
  actor,
  done,
}: {
  icon: LucideIcon;
  label: string;
  at?: string;
  actor?: string;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          done ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${done ? "text-slate-700" : "text-slate-400"}`}>{label}</p>
        {at ? (
          <p className="text-[11px] text-slate-400">
            {fmtAbs(at)}
            {actor && <span className="ml-1.5">· by {actor}</span>}
          </p>
        ) : (
          <p className="text-[11px] text-slate-300 italic">pending</p>
        )}
      </div>
    </div>
  );
}
