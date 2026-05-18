"use client";

/** Wallet Withdrawal Detail — uses ApprovalDetailLayout. */

import { use, useState } from "react";
import Link from "next/link";
import {
  GitBranch, Banknote, Shield, ListChecks, ArrowRightLeft, StickyNote,
  CheckCircle2, ShieldAlert, ExternalLink, AlertTriangle, Activity,
  Smartphone, Globe, AlertCircle, FileText,
} from "lucide-react";
import { Card } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { findWalletWithdrawal } from "@/lib/mock/funds/v2/withdrawals-wallet";
import { channelById, CHANNEL_STATUS_FG } from "@/lib/mock/funds/v2/channels";
import { ApprovalDetailLayout, Section, KV, actorName } from "@/components/crm/funds/ApprovalDetailLayout";
import { StepFlowTimeline } from "@/components/crm/funds/StepFlowTimeline";
import { actionDone } from "@/components/crm/funds/use-funds-toast";

export default function WalletWithdrawalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const row = findWalletWithdrawal(id);
  const [notes, setNotes] = useState<string[]>(row?.internalNotes ?? []);
  const [noteDraft, setNoteDraft] = useState("");

  if (!row) return <NotFound id={id} />;

  const ch = channelById(row.channelId);
  const handleAction = (stepKey: string, action: "approve" | "reject" | "hold") => {
    actionDone(`${action === "approve" ? "已通过" : action === "reject" ? "已拒绝" : "已挂起"} · step=${stepKey}`);
  };
  const handleReassign = (operatorId: string, reason: string) => {
    actionDone(`已转交给 ${operatorId} — 原因：${reason}`);
  };
  const addNote = () => {
    if (!noteDraft.trim()) return;
    setNotes((prev) => [...prev, noteDraft.trim()]);
    setNoteDraft("");
    actionDone("已添加备注");
  };

  const tabs = [
    {
      key: "flow", label: "Step Flow", icon: GitBranch,
      content: (
        <Section title="Approval Steps">
          <StepFlowTimeline steps={row.steps} actorName={actorName}
            showActions={row.status !== "Completed" && row.status !== "Rejected"}
            onAction={handleAction} />
        </Section>
      ),
    },
    {
      key: "beneficiary", label: "Payout Target", icon: Banknote,
      content: (
        <Section title="Payout Target">
          <KV pairs={[
            ["Type",           row.beneficiary.type],
            ["Label",          row.beneficiary.label],
            ["Detail",         row.beneficiary.detail],
            ["Channel",        ch?.name ?? row.channelId],
            ["Merchant",       row.merchantName],
            ["Merchant Order", row.merchantOrderId || "—"],
            ["Channel Ref",    row.channelReference || "(pending payout)"],
            ["Fee",            `$${row.fee.amount} (paid by ${row.fee.paidBy})`],
          ]} />
          <div className="pt-3 border-t border-slate-100 flex gap-2">
            <Link href={`/crm/funds/beneficiaries?client=${row.client.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50">
              <ExternalLink className="w-3.5 h-3.5" />Open in Beneficiaries
            </Link>
          </div>
        </Section>
      ),
    },
    {
      key: "risk", label: "Risk", icon: Shield, badge: row.signals.length,
      content: (
        <Section title="Risk Signals">
          {row.signals.length === 0 ? (
            <p className="text-xs text-slate-500">No signals triggered.</p>
          ) : (
            <ul className="space-y-2">
              {row.signals.map((sig) => {
                const Icon =
                  sig.key === "fast_in_out"     ? Activity      :
                  sig.key === "high_profit"     ? AlertTriangle :
                  sig.key === "new_device"      ? Smartphone    :
                  sig.key === "velocity"        ? AlertCircle   :
                  sig.key === "ip_anomaly"      ? Globe         :
                  sig.key === "country_risk"    ? Globe         :
                  sig.key === "cross_channel_deduction" ? ArrowRightLeft :
                  sig.key === "ib_link_high_risk" ? GitBranch   :
                                                   AlertTriangle;
                const tone = sig.severity === "error" ? "text-red-700 bg-red-50 border-red-200" :
                             sig.severity === "warn"  ? "text-amber-700 bg-amber-50 border-amber-200" :
                                                         "text-slate-700 bg-slate-50 border-slate-200";
                return (
                  <li key={sig.key} className={cn("rounded-lg border p-2.5 flex items-start gap-2.5", tone)}>
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium">{sig.label}</p>
                      {sig.detail && <p className="text-[11px] opacity-80 mt-0.5">{sig.detail}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      ),
    },
    {
      key: "policy", label: "Policy", icon: ListChecks,
      badge: row.policyChecks.filter((p) => !p.passed).length,
      content: (
        <Section title="Policy Checks">
          <ul className="space-y-2">
            {row.policyChecks.map((p) => (
              <li key={p.key} className="flex items-start gap-2.5">
                {p.passed
                  ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                  : <ShieldAlert  className="w-4 h-4 mt-0.5 text-red-600 flex-shrink-0" />}
                <div className="flex-1">
                  <p className="text-xs text-slate-800">{p.label}</p>
                  {p.detail && <p className="text-[11px] text-slate-500 mt-0.5">{p.detail}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      ),
    },
    {
      key: "deduction", label: "Deduction", icon: ArrowRightLeft,
      content: (
        <Section title="Deduction Plan">
          <p className="text-[11px] text-slate-500 -mt-2">Same-Channel First strategy</p>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-500">
                  <th className="px-3 py-2 font-medium">Bucket</th>
                  <th className="px-3 py-2 font-medium text-right">Amount (USD)</th>
                  <th className="px-3 py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {row.deductionPlan.map((d, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-slate-800">{d.bucketLabel}</td>
                    <td className="px-3 py-2 text-slate-800 tabular-nums text-right">${d.amountUsd.toLocaleString()}</td>
                    <td className="px-3 py-2 text-slate-500">{d.note || "—"}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 tabular-nums text-right">
                    ${row.deductionPlan.reduce((s, d) => s + d.amountUsd, 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
          {row.deductionPlan.some((d) => d.note?.includes("Cross-channel")) && (
            <p className="text-xs text-amber-700">⚠ Cross-channel deduction — Compliance signoff required.</p>
          )}
        </Section>
      ),
    },
    {
      key: "notes", label: "Notes", icon: StickyNote, badge: notes.length,
      content: (
        <Section title="Internal Notes">
          {notes.length === 0 ? (
            <p className="text-xs text-slate-500">No notes yet.</p>
          ) : (
            <ul className="space-y-2">
              {notes.map((n, i) => (
                <li key={i} className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700">{n}</li>
              ))}
            </ul>
          )}
          <div className="pt-2">
            <textarea rows={3} placeholder="Add an internal note..."
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
            <div className="mt-2 flex justify-end">
              <Button size="sm" onClick={addNote} disabled={!noteDraft.trim()}>
                <FileText className="w-3.5 h-3.5" />Add Note
              </Button>
            </div>
          </div>
        </Section>
      ),
    },
  ];

  return (
    <ApprovalDetailLayout
      breadcrumbs={[
        { label: "Funds" },
        { label: "Wallet Withdrawals", href: "/crm/funds/wallet-withdrawals" },
        { label: row.id },
      ]}
      backHref="/crm/funds/wallet-withdrawals"
      hero={{
        id: row.id, status: row.status, steps: row.steps, riskLevel: row.riskLevel,
        aml: row.aml, amlScore: row.amlScore,
        client: row.client,
        amount: { value: row.amount, currency: row.currency, usd: row.amountUsd },
        channelLabel: ch?.name, channelStatus: ch && CHANNEL_STATUS_FG[ch.status] ? ch.status : undefined,
        slaMinutes: row.slaMinutes, slaElapsedMinutes: row.slaElapsedMinutes,
        submittedAt: row.submittedAt,
      }}
      tabs={tabs}
      timeline={row.timeline}
      onAction={handleAction}
      onReassign={handleReassign}
    />
  );
}

function NotFound({ id }: { id: string }) {
  return (
    <Card className="!p-8 text-center">
      <p className="text-slate-500">Request {id} not found.</p>
    </Card>
  );
}
