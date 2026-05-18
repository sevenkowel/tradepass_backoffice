"use client";

/** Wallet Deposit Detail — uses ApprovalDetailLayout. */

import { use, useState } from "react";
import {
  GitBranch, Banknote, Shield, ListChecks, StickyNote, FileText,
  CheckCircle2, ShieldAlert, Activity, AlertTriangle, AlertCircle, Globe,
  ExternalLink, Zap, Link2,
} from "lucide-react";
import { Card } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { findWalletDeposit } from "@/lib/mock/funds/v2/deposits-wallet";
import { channelById, CHANNEL_STATUS_FG } from "@/lib/mock/funds/v2/channels";
import { ApprovalDetailLayout, Section, KV, actorName } from "@/components/crm/funds/ApprovalDetailLayout";
import { StepFlowTimeline } from "@/components/crm/funds/StepFlowTimeline";
import { ManualMatchDialog } from "@/components/crm/funds/ManualMatchDialog";
import { actionDone } from "@/components/crm/funds/use-funds-toast";

export default function WalletDepositDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const row = findWalletDeposit(id);
  const [matchOpen, setMatchOpen] = useState(false);
  if (!row) return <Card className="!p-8 text-center"><p className="text-slate-500">Request {id} not found.</p></Card>;

  const ch = channelById(row.channelId);
  const handleAction = (stepKey: string, action: "approve" | "reject" | "hold") => {
    actionDone(`${action === "approve" ? "已通过" : action === "reject" ? "已拒绝" : "已挂起"} · step=${stepKey}`);
  };
  const handleReassign = (operatorId: string, reason: string) => {
    actionDone(`已转交给 ${operatorId} — 原因：${reason}`);
  };
  const handleMatch = (clientId: string, note: string) => {
    actionDone(`已匹配到 ${clientId} — ${note}`);
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
      key: "source", label: "Source", icon: Banknote,
      content: (
        <Section title="Inbound Source">
          <KV pairs={[
            ["Channel",        ch?.name ?? row.channelId],
            ["Merchant",       row.merchantName],
            ["Merchant Order", row.merchantOrderId],
            ["Channel Ref",    row.channelReference || "(pending)"],
            ["Match Method",   row.matchMethod],
            ...(row.matchConfidence !== undefined ? [["Match Confidence", `${row.matchConfidence}%`]] : []),
            ["Fee",            `$${row.fee.amount} (paid by ${row.fee.paidBy})`],
          ] as [string, string | number][]} />
          {row.cryptoConfirms && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">On-Chain</h4>
              <KV pairs={[
                ["Confirmations", `${row.cryptoConfirms.current} / ${row.cryptoConfirms.required}`],
                ["Tx Hash",       row.cryptoConfirms.txHash],
                ["From Address",  row.cryptoConfirms.fromAddress],
              ]} />
              {row.cryptoConfirms.current < row.cryptoConfirms.required && (
                <p className="text-xs text-blue-700 inline-flex items-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  Waiting for {row.cryptoConfirms.required - row.cryptoConfirms.current} more confirms
                </p>
              )}
            </div>
          )}
          {!row.client.id && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <Button onClick={() => setMatchOpen(true)}>
                <Link2 className="w-4 h-4" />Manual match client
              </Button>
            </div>
          )}
          {row.status === "Pending" && row.matchMethod === "Auto Bank Reference" && row.matchConfidence !== undefined && row.matchConfidence < 70 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-amber-700 mb-2">⚠ 低置信度 ({row.matchConfidence}%) — 建议手动匹配</p>
              <Button onClick={() => setMatchOpen(true)}>
                <Link2 className="w-4 h-4" />手动选择客户
              </Button>
            </div>
          )}
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
                const Icon = sig.key === "aml_wallet" ? ShieldAlert : sig.key === "memo_missing" ? Globe : AlertTriangle;
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
      key: "notes", label: "Notes", icon: StickyNote, badge: row.internalNotes.length,
      content: (
        <Section title="Internal Notes">
          {row.internalNotes.length === 0 ? (
            <p className="text-xs text-slate-500">No notes yet.</p>
          ) : (
            <ul className="space-y-2">
              {row.internalNotes.map((n, i) => (
                <li key={i} className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700">{n}</li>
              ))}
            </ul>
          )}
        </Section>
      ),
    },
  ];

  return (
    <>
      <ApprovalDetailLayout
        breadcrumbs={[
          { label: "Funds" },
          { label: "Wallet Deposits", href: "/crm/funds/wallet-deposits" },
          { label: row.id },
        ]}
        backHref="/crm/funds/wallet-deposits"
        hero={{
          id: row.id, status: row.status, steps: row.steps, riskLevel: row.riskLevel,
          aml: row.aml, amlScore: row.amlScore,
          client: row.client,
          amount: { value: row.amount, currency: row.currency, usd: row.amountUsd },
          channelLabel: ch?.name, channelStatus: ch?.status,
          slaMinutes: row.slaMinutes, slaElapsedMinutes: row.slaElapsedMinutes,
          submittedAt: row.submittedAt,
        }}
        tabs={tabs}
        timeline={row.timeline}
        onAction={handleAction}
        onReassign={handleReassign}
      />
      <ManualMatchDialog
        open={matchOpen}
        onClose={() => setMatchOpen(false)}
        amountUsd={row.amountUsd}
        contextHint={`通道：${ch?.name} · Merchant Order: ${row.merchantOrderId}`}
        onConfirm={handleMatch}
      />
    </>
  );
}
