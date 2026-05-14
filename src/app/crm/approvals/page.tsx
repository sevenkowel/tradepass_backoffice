"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck, ArrowDownCircle, ArrowUpCircle,
  Timer, Clock, AlertTriangle, CheckCircle2,
  XCircle, PauseCircle, ChevronRight, ExternalLink,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/crm/ui/PageHeader";
import { approvalService } from "@/lib/approval/service";
import type { ApprovalItem, ApprovalItemType, ApprovalListParams, ApprovalSummary } from "@/types/approval";
import { useCurrentStaffId } from "@/hooks/useCurrentStaff";
import { useToast } from "@/components/ui/use-toast";

/* ─────────────────────────────────────────────────────────────────────────── */
/* Suspense boundary                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function ApprovalsPage() {
  return (
    <Suspense fallback={null}>
      <ApprovalsPageInner />
    </Suspense>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* SLA helpers                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

type SLAStatus = "overdue" | "urgent" | "normal";

function computeSLAStatus(slaDueAt?: string): SLAStatus {
  if (!slaDueAt) return "normal";
  const ms = new Date(slaDueAt).getTime() - Date.now();
  if (ms < 0) return "overdue";
  if (ms < 3_600_000) return "urgent";
  return "normal";
}

function fmtSLA(slaDueAt?: string): string {
  if (!slaDueAt) return "—";
  const diff = new Date(slaDueAt).getTime() - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.floor(abs / 60_000);
  const hrs = Math.floor(mins / 60);
  const future = diff > 0;
  if (mins < 60) return future ? `${mins}m left` : `+${mins}m overdue`;
  return future ? `${hrs}h ${mins % 60}m left` : `+${hrs}h overdue`;
}

const SLA_CHIP: Record<SLAStatus, string> = {
  overdue: "bg-red-100 text-red-700 ring-1 ring-red-200",
  urgent:  "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  normal:  "bg-slate-100 text-slate-600",
};

function SLAChip({ slaDueAt }: { slaDueAt?: string }) {
  const [label, setLabel] = useState(() => fmtSLA(slaDueAt));
  const st = computeSLAStatus(slaDueAt);
  useEffect(() => {
    setLabel(fmtSLA(slaDueAt));
    const id = setInterval(() => setLabel(fmtSLA(slaDueAt)), 15_000);
    return () => clearInterval(id);
  }, [slaDueAt]);
  if (!slaDueAt) return <span className="text-slate-400 text-xs">—</span>;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${SLA_CHIP[st]}`}>
      {st === "overdue" ? <AlertTriangle className="w-3 h-3 flex-shrink-0" /> : <Timer className="w-3 h-3 flex-shrink-0" />}
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Type badge                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

const TYPE_META: Record<ApprovalItemType, { label: string; tone: string; Icon: typeof ShieldCheck }> = {
  kyc:        { label: "KYC",        tone: "bg-blue-100 text-blue-700",    Icon: ShieldCheck },
  deposit:    { label: "Deposit",    tone: "bg-emerald-100 text-emerald-700", Icon: ArrowDownCircle },
  withdrawal: { label: "Withdrawal", tone: "bg-orange-100 text-orange-700", Icon: ArrowUpCircle },
};

function TypeBadge({ type }: { type: ApprovalItemType }) {
  const m = TYPE_META[type];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${m.tone}`}>
      <m.Icon className="w-3 h-3" />
      {m.label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Risk badge                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

const RISK_TONE: Record<string, string> = {
  low:      "bg-emerald-50 text-emerald-700",
  medium:   "bg-amber-100 text-amber-700",
  high:     "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700 ring-1 ring-red-200",
};

function RiskBadge({ level }: { level: string }) {
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize ${RISK_TONE[level] ?? "bg-slate-100 text-slate-600"}`}>
      {level}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Country flag                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */

function Flag({ code }: { code: string }) {
  if (!code || code.length !== 2) return null;
  const flag = code.toUpperCase().split("").map((c) =>
    String.fromCodePoint(127397 + c.charCodeAt(0))
  ).join("");
  return <span className="text-sm leading-none">{flag}</span>;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Summary Bar                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

function SummaryBar({
  summary,
  activeType,
  onTypeClick,
}: {
  summary: ApprovalSummary;
  activeType: string;
  onTypeClick: (t: ApprovalItemType) => void;
}) {
  const cards: Array<{ type: ApprovalItemType; label: string; Icon: typeof ShieldCheck; stat: { pending: number; overdue: number } }> = [
    { type: "kyc",        label: "KYC",         Icon: ShieldCheck,      stat: summary.kyc },
    { type: "deposit",    label: "Deposits",    Icon: ArrowDownCircle,  stat: summary.deposit },
    { type: "withdrawal", label: "Withdrawals", Icon: ArrowUpCircle,    stat: summary.withdrawal },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map(({ type, label, Icon, stat }) => {
        const active = activeType === type;
        return (
          <button
            key={type}
            onClick={() => onTypeClick(type)}
            className={`text-left rounded-xl border p-4 transition-all ${
              active
                ? "border-primary bg-blue-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${active ? "text-primary" : "text-slate-400"}`} />
                <span className={`text-xs font-semibold ${active ? "text-primary" : "text-slate-500"}`}>{label}</span>
              </div>
              {stat.overdue > 0 && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {stat.overdue} overdue
                </span>
              )}
            </div>
            <p className={`text-2xl font-bold tabular-nums ${active ? "text-primary" : "text-slate-900"}`}>
              {stat.pending}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">pending</p>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Inline Reject form                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

function InlineRejectForm({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="mt-2 rounded-lg border border-red-200 bg-red-50/60 p-3 space-y-2">
      <p className="text-xs font-semibold text-red-800">Reason for rejection <span className="text-red-500">*</span></p>
      <textarea
        autoFocus
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. Suspicious transaction pattern, unable to verify source of funds…"
        className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-xs resize-none focus:outline-none focus:ring-2 focus:ring-red-400/30"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => reason.trim() && onConfirm(reason.trim())}
          disabled={!reason.trim() || loading}
          className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Rejecting…" : "Confirm Reject"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Approval row                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */

function ApprovalRow({
  item,
  onApprove,
  onReject,
  onHold,
  rejectingId,
  setRejectingId,
}: {
  item: ApprovalItem;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onHold: (id: string) => Promise<void>;
  rejectingId: string | null;
  setRejectingId: (id: string | null) => void;
}) {
  const [loading, setLoading] = useState<"approve" | "reject" | "hold" | null>(null);
  const slaStatus = computeSLAStatus(item.slaDueAt);
  const isRejecting = rejectingId === item.id;

  const wrap = async (kind: "approve" | "reject" | "hold", fn: () => Promise<void>) => {
    setLoading(kind);
    try { await fn(); } finally { setLoading(null); }
  };

  return (
    <div className={`rounded-xl border bg-white transition-colors ${
      slaStatus === "overdue" ? "border-red-200" :
      slaStatus === "urgent"  ? "border-amber-200" :
      "border-slate-200"
    }`}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Type badge */}
        <div className="w-20 flex-shrink-0">
          <TypeBadge type={item.type} />
        </div>

        {/* User */}
        <div className="w-44 min-w-0 flex-shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Flag code={item.userCountry} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{item.userName}</p>
              <p className="text-[11px] text-slate-400 font-mono">{item.userUid}</p>
            </div>
          </div>
        </div>

        {/* Subject */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-700 truncate">{item.subject}</p>
          {item.riskFlags && item.riskFlags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-0.5">
              {item.riskFlags.map((f) => (
                <span key={f} className="text-[10px] px-1.5 py-0 rounded bg-red-50 text-red-700 font-medium">{f}</span>
              ))}
            </div>
          )}
        </div>

        {/* Risk */}
        <div className="w-20 flex-shrink-0">
          <RiskBadge level={item.riskLevel} />
        </div>

        {/* SLA */}
        <div className="w-32 flex-shrink-0">
          <SLAChip slaDueAt={item.slaDueAt} />
        </div>

        {/* Status */}
        <div className="w-20 flex-shrink-0">
          {item.status === "on_hold" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
              <PauseCircle className="w-3 h-3" />
              On Hold
            </span>
          )}
          {item.status === "in_review" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700">
              <Clock className="w-3 h-3" />
              In Review
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="w-44 flex-shrink-0 flex items-center justify-end gap-1.5">
          {item.canInlineApprove ? (
            <>
              <button
                onClick={() => wrap("hold", () => onHold(item.id))}
                disabled={!!loading || item.status === "on_hold"}
                title="Hold"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30"
              >
                <PauseCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRejectingId(isRejecting ? null : item.id)}
                disabled={!!loading}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-40 ${
                  isRejecting
                    ? "bg-red-600 text-white border-red-600"
                    : "border-red-200 text-red-600 hover:bg-red-50"
                }`}
              >
                {loading === "reject" ? "…" : "Reject"}
              </button>
              <button
                onClick={() => wrap("approve", () => onApprove(item.id))}
                disabled={!!loading}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-40"
              >
                {loading === "approve" ? "…" : "Approve"}
              </button>
            </>
          ) : (
            <Link
              href={item.detailUrl}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary border border-blue-200 hover:bg-blue-50 transition-colors"
            >
              Review
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Inline reject form */}
      {isRejecting && (
        <div className="px-4 pb-3">
          <InlineRejectForm
            loading={loading === "reject"}
            onCancel={() => setRejectingId(null)}
            onConfirm={(reason) => {
              setRejectingId(null);
              wrap("reject", () => onReject(item.id, reason));
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Tab bar                                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

type TabKey = "all" | ApprovalItemType;

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "all",        label: "All" },
  { key: "kyc",        label: "KYC" },
  { key: "deposit",    label: "Deposits" },
  { key: "withdrawal", label: "Withdrawals" },
];

/* ─────────────────────────────────────────────────────────────────────────── */
/* Main inner page                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

function ApprovalsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const staffId = useCurrentStaffId();
  const toast = useToast();

  const lastQs = useRef("");

  // Derive filter state from URL
  const typeParam = (searchParams.get("type") ?? "all") as TabKey;
  const statusParam = searchParams.get("status") ?? "all";
  const riskParam = searchParams.get("risk") ?? "all";
  const slaParam = searchParams.get("sla") ?? "all";
  const searchParam = searchParams.get("q") ?? "";

  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<ApprovalSummary>({
    kyc: { pending: 0, overdue: 0 },
    deposit: { pending: 0, overdue: 0 },
    withdrawal: { pending: 0, overdue: 0 },
  });
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const buildParams = useCallback((): ApprovalListParams => ({
    type: typeParam === "all" ? "all" : typeParam as ApprovalItemType,
    status: statusParam !== "all" ? statusParam as ApprovalListParams["status"] : undefined,
    riskLevel: riskParam !== "all" ? riskParam : undefined,
    slaStatus: slaParam !== "all" ? slaParam as ApprovalListParams["slaStatus"] : undefined,
    search: searchParam || undefined,
  }), [typeParam, statusParam, riskParam, slaParam, searchParam]);

  const load = useCallback(() => {
    const { items: r, total: t } = approvalService.list(buildParams());
    setItems(r);
    setTotal(t);
    setSummary(approvalService.getSummary());
  }, [buildParams]);

  useEffect(() => { load(); }, [load]);

  // Push filter changes to URL
  const pushUrl = useCallback((patch: Record<string, string>) => {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === "all" || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    const qs = sp.toString();
    if (qs === lastQs.current) return;
    lastQs.current = qs;
    router.replace(`/crm/approvals${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [router, searchParams]);

  const setTab = (t: TabKey) => pushUrl({ type: t });

  // Handlers
  const handleApprove = useCallback(async (id: string) => {
    try {
      await approvalService.approve(id, staffId);
      load();
      toast.success("Approved successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Please try again.", { title: "Failed to approve" });
    }
  }, [staffId, load, toast]);

  const handleReject = useCallback(async (id: string, reason: string) => {
    try {
      await approvalService.reject(id, staffId, reason);
      load();
      toast.success("Rejected");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Please try again.", { title: "Failed to reject" });
    }
  }, [staffId, load, toast]);

  const handleHold = useCallback(async (id: string) => {
    try {
      await approvalService.hold(id, staffId);
      load();
      toast.success("Placed on hold");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Please try again.", { title: "Failed to hold" });
    }
  }, [staffId, load, toast]);

  const totalPending = summary.kyc.pending + summary.deposit.pending + summary.withdrawal.pending;
  const totalOverdue = summary.kyc.overdue + summary.deposit.overdue + summary.withdrawal.overdue;

  return (
    <div className="space-y-3">
      <PageHeader
        title="Approval Inbox"
        description={
          totalPending > 0
            ? `${totalPending} pending${totalOverdue > 0 ? ` · ${totalOverdue} overdue` : ""}`
            : "All caught up"
        }
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

      {/* Summary bar */}
      <SummaryBar
        summary={summary}
        activeType={typeParam}
        onTypeClick={(t) => setTab(t)}
      />

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-100">
          {TABS.map(({ key, label }) => {
            const count =
              key === "all" ? totalPending :
              key === "kyc" ? summary.kyc.pending :
              key === "deposit" ? summary.deposit.pending :
              summary.withdrawal.pending;
            const active = typeParam === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors -mb-px ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    active ? "bg-blue-100 text-primary" : "bg-slate-100 text-slate-500"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filter strip */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 bg-slate-50/60 flex-wrap">
          <FilterSelect
            label="Status"
            value={statusParam}
            onChange={(v) => pushUrl({ status: v })}
            options={[
              { value: "all", label: "All statuses" },
              { value: "pending", label: "Pending" },
              { value: "in_review", label: "In Review" },
              { value: "on_hold", label: "On Hold" },
            ]}
          />
          <FilterSelect
            label="Risk"
            value={riskParam}
            onChange={(v) => pushUrl({ risk: v })}
            options={[
              { value: "all", label: "All risks" },
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
              { value: "critical", label: "Critical" },
            ]}
          />
          <FilterSelect
            label="SLA"
            value={slaParam}
            onChange={(v) => pushUrl({ sla: v })}
            options={[
              { value: "all", label: "All SLA" },
              { value: "overdue", label: "Overdue" },
              { value: "urgent", label: "Urgent (< 1h)" },
              { value: "normal", label: "Normal" },
            ]}
          />
          <div className="flex-1 min-w-[160px]">
            <input
              type="text"
              placeholder="Search name, UID, subject…"
              defaultValue={searchParam}
              onChange={(e) => pushUrl({ q: e.target.value })}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {(statusParam !== "all" || riskParam !== "all" || slaParam !== "all" || searchParam) && (
            <button
              onClick={() => pushUrl({ status: "", risk: "", sla: "", q: "" })}
              className="text-xs text-slate-400 hover:text-slate-700 transition-colors whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* List */}
        <div className="p-3 space-y-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
              <p className="text-sm font-semibold text-slate-700">All caught up</p>
              <p className="text-xs text-slate-400 mt-1">No pending approvals match the current filters.</p>
            </div>
          ) : (
            <>
              {/* Column header */}
              <div className="flex items-center gap-3 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <div className="w-20 flex-shrink-0">Type</div>
                <div className="w-44 flex-shrink-0">User</div>
                <div className="flex-1">Subject</div>
                <div className="w-20 flex-shrink-0">Risk</div>
                <div className="w-32 flex-shrink-0">SLA</div>
                <div className="w-20 flex-shrink-0">Status</div>
                <div className="w-44 flex-shrink-0 text-right">Actions</div>
              </div>

              {items.map((item) => (
                <ApprovalRow
                  key={item.id}
                  item={item}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onHold={handleHold}
                  rejectingId={rejectingId}
                  setRejectingId={setRejectingId}
                />
              ))}

              {total > items.length && (
                <p className="text-center text-xs text-slate-400 pt-2">
                  Showing {items.length} of {total} items
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* FilterSelect primitive                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 pl-2 pr-6 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
