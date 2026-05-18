"use client";

import { use } from "react";
import {
  GitBranch, Banknote, Shield, ListChecks, StickyNote, TrendingDown,
  CheckCircle2, ShieldAlert, AlertTriangle, Activity,
} from "lucide-react";
import { Card } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { findTradingWithdrawal } from "@/lib/mock/funds/v2/withdrawals-trading";
import { channelById } from "@/lib/mock/funds/v2/channels";
import { ApprovalDetailLayout, Section, KV, actorName } from "@/components/crm/funds/ApprovalDetailLayout";
import { StepFlowTimeline } from "@/components/crm/funds/StepFlowTimeline";
import { actionDone, demoAction } from "@/components/crm/funds/use-funds-toast";

export default function TradingWithdrawalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const row = findTradingWithdrawal(id);
  if (!row) return <Card className="!p-8 text-center"><p className="text-slate-500">Request {id} not found.</p></Card>;

  const ch = row.channelId ? channelById(row.channelId) : undefined;
  const onAction = (k: string, a: string) => actionDone(`${a === "approve" ? "已通过" : a === "reject" ? "已拒绝" : "已挂起"} · step=${k}`);
  const onReassign = (operatorId: string, reason: string) => actionDone(`已转交给 ${operatorId} — 原因：${reason}`);
  const marginDanger = row.marginLevelAfter > 0 && row.marginLevelAfter < 100;
  const marginWarn = row.marginLevelAfter > 0 && row.marginLevelAfter < 150;

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
      key: "margin", label: "Margin & Positions", icon: TrendingDown,
      badge: marginWarn ? 1 : 0,
      content: (
        <Section title="MT Account Margin Snapshot">
          <Card className={cn("!p-3 border",
            marginDanger ? "border-red-200 bg-red-50/40" :
            marginWarn   ? "border-orange-200 bg-orange-50/40" :
                            "border-emerald-200 bg-emerald-50/40")}>
            <KV pairs={[
              ["MT Account",       row.mtAccount.id],
              ["Equity",           `$${row.mtAccount.equity.toLocaleString()}`],
              ["Balance",          `$${row.mtAccount.balance.toLocaleString()}`],
              ["Used Margin",      `$${row.mtAccount.usedMargin.toLocaleString()}`],
              ["Free Margin",      `$${row.mtAccount.freeMargin.toLocaleString()}`],
              ["Open Positions",   row.mtAccount.openPositions],
              ["Floating PnL",     `$${row.mtAccount.floatingPnL.toLocaleString()}`],
            ]} />
            <div className="mt-3 pt-3 border-t border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Margin level</span>
                <span className="inline-flex items-center gap-2 tabular-nums">
                  <span className="text-slate-500">Before {row.marginLevelBefore}%</span>
                  <TrendingDown className="w-3 h-3 text-slate-400" />
                  <span className={cn("font-semibold",
                    marginDanger ? "text-red-700"   :
                    marginWarn   ? "text-orange-700" :
                                    "text-emerald-700")}>After {row.marginLevelAfter}%</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Withdrawable (per {row.formulaUsed.replace("Preset ", "")})</span>
                <span className="font-semibold tabular-nums">${row.withdrawable.toLocaleString()}</span>
              </div>
            </div>
            {(marginWarn || marginDanger) && row.mtAccount.openPositions > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => demoAction(`已发起一键平仓 · MT 账户 ${row.mtAccount.id}`)}>
                  Close all positions
                </Button>
                <Button size="sm" variant="secondary" onClick={() => demoAction("打开部分平仓选择器")}>
                  Partial close
                </Button>
              </div>
            )}
          </Card>
        </Section>
      ),
    },
    {
      key: "destination", label: "Destination", icon: Banknote,
      content: <Section title="Payout Destination">
        <KV pairs={[
          ["Destination", row.destination],
          ...(ch ? [
            ["Channel",        ch.name],
            ["Merchant",       row.merchantName!],
            ["Merchant Order", row.merchantOrderId!],
            ["Channel Ref",    row.channelReference || "(pending)"],
          ] : [["Note", "Internal — funds returned to client wallet"]]),
          ["Fee", `$${row.fee.amount} (paid by ${row.fee.paidBy})`],
        ] as [string, string | number][]} />
      </Section>,
    },
    {
      key: "risk", label: "Risk", icon: Shield, badge: row.signals.length,
      content: <Section title="Risk Signals">
        {row.signals.length === 0 ? <p className="text-xs text-slate-500">No signals.</p> : (
          <ul className="space-y-2">
            {row.signals.map((sig) => {
              const tone = sig.severity === "error" ? "text-red-700 bg-red-50 border-red-200" :
                           sig.severity === "warn"  ? "text-amber-700 bg-amber-50 border-amber-200" :
                                                       "text-slate-700 bg-slate-50 border-slate-200";
              return (
                <li key={sig.key} className={cn("rounded-lg border p-2.5 flex items-start gap-2.5", tone)}>
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
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
        { label: "Trading Withdrawals", href: "/crm/funds/trading-withdrawals" },
        { label: row.id },
      ]}
      backHref="/crm/funds/trading-withdrawals"
      hero={{
        id: row.id, status: row.status, steps: row.steps, riskLevel: row.riskLevel,
        client: row.client,
        amount: { value: row.amount, currency: row.currency, usd: row.amountUsd },
        channelLabel: ch?.name ?? "Internal", channelStatus: ch?.status,
        slaMinutes: row.slaMinutes, slaElapsedMinutes: row.slaElapsedMinutes,
        submittedAt: row.submittedAt,
        flowSubtitle: `${row.mtAccount.id} → ${row.destination}`,
      }}
      tabs={tabs}
      timeline={row.timeline}
      onAction={onAction as any}
      onReassign={onReassign}
    />
  );
}
