"use client";

import { use } from "react";
import { GitBranch, ArrowRightLeft, ListChecks, StickyNote, CheckCircle2, ShieldAlert, Activity } from "lucide-react";
import { Card } from "@/components/crm/ui";
import { cn } from "@/lib/utils";
import { findTransfer } from "@/lib/mock/funds/v2/transfers";
import { ApprovalDetailLayout, Section, KV, actorName } from "@/components/crm/funds/ApprovalDetailLayout";
import { StepFlowTimeline } from "@/components/crm/funds/StepFlowTimeline";
import { actionDone } from "@/components/crm/funds/use-funds-toast";

export default function TransferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const row = findTransfer(id);
  if (!row) return <Card className="!p-8 text-center"><p className="text-slate-500">Transfer {id} not found.</p></Card>;

  const onAction = (k: string, a: string) => actionDone(`${a === "approve" ? "已通过" : a === "reject" ? "已拒绝" : "已挂起"} · step=${k}`);
  const onReassign = (operatorId: string, reason: string) => actionDone(`已转交给 ${operatorId} — 原因：${reason}`);
  const isP2P = row.scenario === "Wallet → Wallet (P2P)";

  const tabs = [
    {
      key: "flow", label: "Step Flow", icon: GitBranch,
      content: <Section title="Approval Steps">
        <StepFlowTimeline steps={row.steps} actorName={actorName}
          showActions={row.status !== "Completed" && row.status !== "Rejected"}
          onAction={onAction as any} />
      </Section>,
    },
    {
      key: "route", label: "Route Details", icon: ArrowRightLeft,
      content: <Section title="Transfer Route">
        <KV pairs={[
          ["Scenario",         row.scenario],
          ["From",             row.fromLabel],
          ["To",               row.toLabel],
          ...(row.fromPlatform ? [["From Platform", row.fromPlatform]] : []),
          ...(row.toPlatform   ? [["To Platform",   row.toPlatform]] : []),
          ["Amount",           `${row.amount.toLocaleString()} ${row.currency} (≈ $${row.amountUsd.toLocaleString()})`],
          ...(row.fxRate !== undefined ? [["FX Rate", row.fxRate.toString()]] : []),
          ["Cross-currency",   row.isCrossCurrency ? "Yes" : "No"],
          ["Cross-platform",   row.isCrossPlatform ? "Yes" : "No"],
          ["Fee",              `$${row.fee.amount} (paid by ${row.fee.paidBy})`],
        ] as [string, string | number][]} />
        {isP2P && (
          <div className="mt-3 p-3 rounded-lg border border-orange-200 bg-orange-50/40">
            <p className="text-xs text-orange-800 font-medium">P2P Transfer — IB Only</p>
            <p className="text-[11px] text-orange-700 mt-1">
              Sender ({row.fromClient.id}) is IB-eligible. Recipient ({row.toClient.id}) KYC verified.
              All P2P transfers require Compliance signoff per v2.2 policy.
            </p>
          </div>
        )}
      </Section>,
    },
    {
      key: "policy", label: "Policy", icon: ListChecks, badge: row.policyChecks.filter((p) => !p.passed).length,
      content: <Section title="Policy Checks">
        <ul className="space-y-2">
          {row.policyChecks.map((p) => (
            <li key={p.key} className="flex items-start gap-2.5">
              {p.passed
                ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" />
                : <ShieldAlert className="w-4 h-4 mt-0.5 text-red-600" />}
              <div className="flex-1">
                <p className="text-xs text-slate-800">{p.label}</p>
                {p.detail && <p className="text-[11px] text-slate-500 mt-0.5">{p.detail}</p>}
              </div>
            </li>
          ))}
        </ul>
      </Section>,
    },
    {
      key: "signals", label: "Signals", icon: Activity, badge: row.signals.length,
      content: <Section title="Signals">
        {row.signals.length === 0 ? <p className="text-xs text-slate-500">No signals.</p> : (
          <ul className="space-y-2">
            {row.signals.map((sig) => {
              const tone = sig.severity === "error" ? "text-red-700 bg-red-50 border-red-200" :
                           sig.severity === "warn"  ? "text-amber-700 bg-amber-50 border-amber-200" :
                                                       "text-slate-700 bg-slate-50 border-slate-200";
              return (
                <li key={sig.key} className={cn("rounded-lg border p-2.5 flex items-start gap-2.5", tone)}>
                  <Activity className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium">{sig.label}</p>
                    {sig.detail && <p className="text-[11px] opacity-80 mt-0.5">{sig.detail}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>,
    },
    {
      key: "notes", label: "Notes", icon: StickyNote, badge: row.internalNotes.length,
      content: <Section title="Internal Notes">
        {row.internalNotes.length === 0 ? <p className="text-xs text-slate-500">No notes.</p> : (
          <ul className="space-y-2">{row.internalNotes.map((n, i) => (
            <li key={i} className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700">{n}</li>
          ))}</ul>
        )}
      </Section>,
    },
  ];

  return (
    <ApprovalDetailLayout
      breadcrumbs={[
        { label: "Funds" },
        { label: "Transfers", href: "/crm/funds/transfers" },
        { label: row.id },
      ]}
      backHref="/crm/funds/transfers"
      hero={{
        id: row.id, status: row.status, steps: row.steps, riskLevel: row.riskLevel,
        client: row.fromClient,
        amount: { value: row.amount, currency: row.currency, usd: row.amountUsd },
        slaMinutes: row.slaMinutes, slaElapsedMinutes: row.slaElapsedMinutes,
        submittedAt: row.submittedAt,
        flowSubtitle: `${row.scenario}`,
      }}
      tabs={tabs}
      timeline={row.timeline}
      onAction={onAction as any}
      onReassign={onReassign}
    />
  );
}
