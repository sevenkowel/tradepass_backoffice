"use client";

/**
 * ApprovalDetailLayout — shared full-screen detail shell for funds requests
 *
 * Used by Wallet/Trading Deposit & Withdrawal + Transfer detail pages.
 * Provides:
 *   - Sticky Hero (L1 status + actions; L2 client + amount + channel + SLA)
 *   - Tabs row (caller supplies tabs)
 *   - Right rail Timeline (caller supplies events)
 *
 * Spec: §6.2 + §8 of v2.1 PRD (mirrors CLM case-detail layout).
 */

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Clock, Printer, Keyboard, ExternalLink, CheckCircle2,
  ShieldAlert, Banknote, UserCheck,
} from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card } from "@/components/crm/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  STATUS_FG, currentStep, type ApprovalStep, type MoneyRequestStatus,
  type TimelineEvent,
} from "@/lib/mock/funds/v2/approvals";
import { RISK_FG, KYC_TIER_FG, operators } from "@/lib/mock/funds/v2/entities";
import { ReassignDialog } from "./ReassignDialog";
import { demoAction } from "./use-funds-toast";

export interface DetailHeroData {
  id: string;
  status: MoneyRequestStatus;
  steps: ApprovalStep[];
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  aml?: "Pass" | "Hit" | "Pending";
  amlScore?: number;
  client: { id: string; name: string; kycTier: "Tier1" | "Tier2" | "Tier3"; country: string };
  amount: { value: number; currency: string; usd: number };
  channelLabel?: string;
  channelStatus?: string;
  slaMinutes: number;
  slaElapsedMinutes: number;
  submittedAt: string;
  /** Extra one-line subtitle (e.g. for Transfers: "Wallet → MT5-100012"). */
  flowSubtitle?: string;
}

interface Tab {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  content: ReactNode;
}

interface Props {
  breadcrumbs: { label: string; href?: string }[];
  backHref: string;
  hero: DetailHeroData;
  tabs: Tab[];
  timeline: TimelineEvent[];
  /** Active step action callback (Approve / Reject / Hold). */
  onAction?: (stepKey: string, action: "approve" | "reject" | "hold") => void;
  /** Reassign callback (operatorId, reason). */
  onReassign?: (operatorId: string, reason: string) => void;
}

export function ApprovalDetailLayout({ breadcrumbs, backHref, hero, tabs, timeline, onAction, onReassign }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.key);
  const [reassignOpen, setReassignOpen] = useState(false);

  const s = STATUS_FG[hero.status];
  const cs = currentStep(hero.steps);
  const isCritical = hero.riskLevel === "Critical" || hero.aml === "Hit";
  const slaRemain = hero.slaMinutes - hero.slaElapsedMinutes;

  return (
    <div className="space-y-3">
      <Breadcrumb items={breadcrumbs} />

      {/* Sticky Hero */}
      <section className={cn(
        "sticky top-16 z-10 bg-white rounded-xl border shadow-sm overflow-hidden",
        isCritical && "border-l-4 border-l-red-500",
      )}>
        <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
          <button onClick={() => router.push(backHref)} className="p-1 hover:bg-slate-100 rounded">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>

          <h1 className="text-base font-semibold text-slate-900 font-mono">{hero.id}</h1>

          <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border",
            hero.status === "Completed" ? "border-emerald-200 bg-emerald-50" :
            hero.status === "Rejected"  ? "border-red-200 bg-red-50" :
            hero.status === "On Hold"   ? "border-slate-200 bg-slate-50" :
                                            "border-amber-200 bg-amber-50",
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
            <span className={s.text}>{hero.status}</span>
          </span>

          {cs && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-primary border border-blue-200">
              <Clock className="w-3 h-3" />
              Step {hero.steps.indexOf(cs) + 1}/{hero.steps.length} · @ {cs.role}
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border bg-white border-slate-200">
            <span className={cn("w-1.5 h-1.5 rounded-full", RISK_FG[hero.riskLevel].dot)} />
            <span className={RISK_FG[hero.riskLevel].text}>{hero.riskLevel}</span>
          </span>

          {hero.aml && (
            <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border",
              hero.aml === "Hit" ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50",
            )}>
              <ShieldAlert className="w-3 h-3" />
              <span className={hero.aml === "Hit" ? "text-red-700" : "text-emerald-700"}>
                AML {hero.aml}{hero.amlScore !== undefined && ` · ${hero.amlScore}`}
              </span>
            </span>
          )}

          <div className="flex-1" />

          {cs && onAction && (
            <div className="flex items-center gap-1.5">
              <Button size="sm" onClick={() => onAction(cs.key, "approve")}>
                <CheckCircle2 className="w-3.5 h-3.5" />Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => onAction(cs.key, "reject")}>Reject</Button>
              <Button size="sm" variant="secondary" onClick={() => onAction(cs.key, "hold")}>Hold</Button>
              <Button size="sm" variant="secondary" onClick={() => setReassignOpen(true)}>
                <UserCheck className="w-3.5 h-3.5" />Reassign
              </Button>
            </div>
          )}
          <button onClick={() => window.print()} className="p-1.5 rounded hover:bg-slate-100" title="Print">
            <Printer className="w-3.5 h-3.5 text-slate-500" />
          </button>
          <button onClick={() => demoAction("快捷键: A=Approve · R=Reject · H=Hold · E=Reassign · P=Print")}
            className="p-1.5 rounded hover:bg-slate-100" title="Shortcuts">
            <Keyboard className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>

        <div className="px-4 pb-2.5 pt-1 border-t border-slate-100 flex items-center gap-x-4 gap-y-1 flex-wrap text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-slate-400">Client</span>
            <span className="font-medium text-slate-800">{hero.client.name}</span>
            <span className="font-mono text-slate-500">{hero.client.id}</span>
            <span className={KYC_TIER_FG[hero.client.kycTier].text}>KYC {hero.client.kycTier}</span>
            <span className="text-slate-600">{hero.client.country}</span>
          </span>

          <span className="h-3 w-px bg-slate-200" />

          <span className="inline-flex items-center gap-1.5">
            <Banknote className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400">Amount</span>
            <span className="font-semibold text-slate-800 tabular-nums">
              {hero.amount.value.toLocaleString()} {hero.amount.currency}
            </span>
            <span className="text-slate-500 tabular-nums">≈ ${hero.amount.usd.toLocaleString()}</span>
          </span>

          {hero.channelLabel && (
            <>
              <span className="h-3 w-px bg-slate-200" />
              <span className="inline-flex items-center gap-1.5">
                <span className="text-slate-400">Channel</span>
                <span className="font-medium text-slate-700">{hero.channelLabel}</span>
                {hero.channelStatus && <span className="text-[10px] text-slate-500">· {hero.channelStatus}</span>}
              </span>
            </>
          )}

          {hero.flowSubtitle && (
            <>
              <span className="h-3 w-px bg-slate-200" />
              <span className="text-slate-700">{hero.flowSubtitle}</span>
            </>
          )}

          {hero.status !== "Completed" && hero.status !== "Rejected" && (
            <>
              <span className="h-3 w-px bg-slate-200" />
              <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-medium border whitespace-nowrap",
                slaRemain < 0 ? "bg-red-50 text-red-700 border-red-200" :
                slaRemain < hero.slaMinutes * 0.25 ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                       "bg-emerald-50 text-emerald-700 border-emerald-200",
              )}>
                <Clock className="w-3 h-3" />
                {slaRemain < 0 ? `${Math.abs(slaRemain)}m over SLA` : `${slaRemain}m to SLA`}
              </span>
            </>
          )}

          <span className="inline-flex items-center gap-1 text-slate-500 ml-auto">
            <span className="text-slate-400">Submitted</span>
            <span className="font-mono tabular-nums">{new Date(hero.submittedAt).toLocaleString()}</span>
          </span>
        </div>
      </section>

      {/* Tabs + Timeline body */}
      <div className="flex gap-3">
        <main className="flex-1 min-w-0 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1 flex items-center gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <TabButton key={t.key} label={t.label} icon={t.icon} badge={t.badge}
                active={activeTab === t.key} onClick={() => setActiveTab(t.key)} />
            ))}
          </div>
          {tabs.find((t) => t.key === activeTab)?.content}
        </main>

        <aside className="hidden xl:block w-80 flex-shrink-0 sticky top-[140px] self-start">
          <Card className="!p-0">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-800">Timeline</h3>
              <span className="text-xs text-slate-400">{timeline.length}</span>
            </div>
            <ol className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
              {timeline.map((e, i) => {
                const dotColor = e.kind === "error" ? "bg-red-500" : e.kind === "warn" ? "bg-amber-500" : "bg-blue-500";
                return (
                  <li key={i} className="px-4 py-2.5 flex items-start gap-2.5">
                    <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0", dotColor)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-800">{e.text}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(e.at).toLocaleString()}
                        {e.by && <span> · <span className="font-mono">{actorName(e.by)}</span></span>}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        </aside>
      </div>

      <ReassignDialog
        open={reassignOpen}
        onClose={() => setReassignOpen(false)}
        requiredRole={cs?.role}
        currentAssigneeId={cs?.actorId}
        onConfirm={(operatorId, reason) => {
          onReassign?.(operatorId, reason);
        }}
      />
    </div>
  );
}

export function actorName(id: string): string {
  return operators.find((o) => o.id === id)?.name ?? id;
}

function TabButton({ label, icon: Icon, active, onClick, badge }: { label: string; icon: any; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick} className={cn(
      "inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
      active ? "bg-blue-50 text-primary" : "text-slate-600 hover:bg-slate-50",
    )}>
      <Icon className="w-3.5 h-3.5" />
      {label}
      {badge !== undefined && badge > 0 && (
        <span className={cn("ml-0.5 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[10px] tabular-nums",
          active ? "bg-primary text-white" : "bg-slate-200 text-slate-600")}>{badge}</span>
      )}
    </button>
  );
}

/* Generic helper components used by every detail page. */

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="!p-4 space-y-3">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      {children}
    </Card>
  );
}

export function KV({ pairs }: { pairs: [string, string | number][] }) {
  return (
    <dl className="space-y-1.5">
      {pairs.map(([k, v]) => (
        <div key={k} className="flex items-start justify-between gap-3 text-xs">
          <dt className="text-slate-500 flex-shrink-0">{k}</dt>
          <dd className="font-mono text-slate-800 text-right break-all">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
