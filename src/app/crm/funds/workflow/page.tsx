"use client";

import { useState } from "react";
import {
  ArrowRight, ExternalLink, GitBranch, User, Zap, CheckCircle2, Activity,
} from "lucide-react";
import Link from "next/link";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader } from "@/components/crm/ui";
import { cn } from "@/lib/utils";

type Tab = "manual" | "auto" | "audit";

interface ManualStep {
  label: string;
  kind: "trigger" | "auto" | "human" | "decision" | "end";
  role?: string;
  branches?: { label: string; target: string }[];
}

interface ManualWorkflow {
  id: string;
  trigger: string;
  description: string;
  steps: ManualStep[];
  lastEdited: string;
  lastEditedBy: string;
}

const MANUAL: ManualWorkflow[] = [
  {
    id: "WF-WW-001",
    trigger: "Wallet Withdrawal Submitted",
    description: "客户钱包出金标准流程",
    steps: [
      { label: "Submitted",            kind: "trigger" },
      { label: "Auto AML + Policy",    kind: "auto" },
      { label: "Branch: low risk?",    kind: "decision", branches: [
        { label: "Yes (auto eligible)", target: "Auto Lane" },
        { label: "No",                  target: "Finance Audit" },
      ] },
      { label: "Auto Lane → Treasury", kind: "auto" },
      { label: "Finance Audit",        kind: "human", role: "finance" },
      { label: "Compliance AML",       kind: "human", role: "compliance" },
      { label: "Treasury Payout",      kind: "human", role: "treasury" },
      { label: "Completed",            kind: "end" },
    ],
    lastEdited: "2026-05-10", lastEditedBy: "approval_admin",
  },
  {
    id: "WF-TW-001",
    trigger: "Trading Withdrawal Submitted",
    description: "交易账户提款 (含 margin 阶梯拦截)",
    steps: [
      { label: "Submitted",            kind: "trigger" },
      { label: "Withdrawable Calc",    kind: "auto" },
      { label: "Branch: margin after?", kind: "decision", branches: [
        { label: "≥200%", target: "Auto Lane" },
        { label: "150-200%", target: "Finance Audit (warn)" },
        { label: "100-150%", target: "Compliance Required" },
        { label: "<100%",    target: "Auto Reject" },
      ] },
      { label: "Auto Lane",            kind: "auto" },
      { label: "Finance Audit",        kind: "human", role: "finance" },
      { label: "Treasury Payout",      kind: "human", role: "treasury" },
      { label: "Completed",            kind: "end" },
    ],
    lastEdited: "2026-05-12", lastEditedBy: "approval_admin",
  },
  {
    id: "WF-WD-001",
    trigger: "Wallet Deposit",
    description: "钱包入金 (PSP webhook 触发)",
    steps: [
      { label: "Webhook received",     kind: "trigger" },
      { label: "AML + amount match",   kind: "auto" },
      { label: "Branch: confidence?",  kind: "decision", branches: [
        { label: "≥90%", target: "Auto Credit" },
        { label: "70-90%", target: "Treasury Confirm" },
        { label: "<70%", target: "Manual Match Queue" },
      ] },
      { label: "Treasury Confirm",     kind: "human", role: "treasury" },
      { label: "Finance Post",         kind: "auto" },
      { label: "Completed",            kind: "end" },
    ],
    lastEdited: "2026-05-05", lastEditedBy: "approval_admin",
  },
  {
    id: "WF-TR-P2P-001",
    trigger: "P2P Transfer (IB)",
    description: "P2P 转账 · 强制 Compliance",
    steps: [
      { label: "Submitted",            kind: "trigger" },
      { label: "Eligibility check",    kind: "auto" },
      { label: "Finance Audit",        kind: "human", role: "finance" },
      { label: "Compliance Signoff",   kind: "human", role: "compliance" },
      { label: "Completed",            kind: "end" },
    ],
    lastEdited: "2026-05-08", lastEditedBy: "approval_admin",
  },
];

interface AutoRule {
  id: string;
  trigger: string;
  action: "Block" | "Hold" | "Notify" | "Score+";
  enabled: boolean;
  hits24h: number;
}

const AUTO: AutoRule[] = [
  { id: "AW-001", trigger: "AML score ≥ 75 (Severe)",               action: "Block",  enabled: true, hits24h: 3  },
  { id: "AW-002", trigger: "Fast In-Out (deposit→WD within 2h)",    action: "Hold",   enabled: true, hits24h: 5  },
  { id: "AW-003", trigger: "Margin level after WD < 100%",          action: "Block",  enabled: true, hits24h: 2  },
  { id: "AW-004", trigger: "High Profit (PnL > $2k in 7d, Tier1/2)",action: "Hold",   enabled: true, hits24h: 4  },
  { id: "AW-005", trigger: "Velocity ≥ 5 txn / 24h",                action: "Hold",   enabled: true, hits24h: 18 },
  { id: "AW-006", trigger: "New device + amount > $5k",             action: "Notify", enabled: true, hits24h: 2  },
  { id: "AW-007", trigger: "Channel failure rate > 10% in 1h",      action: "Notify", enabled: true, hits24h: 1  },
  { id: "AW-008", trigger: "Concurrent pending WDs > 2 per client", action: "Hold",   enabled: true, hits24h: 0  },
  { id: "AW-009", trigger: "Crypto deposit-to-WD cooldown 24h",     action: "Hold",   enabled: true, hits24h: 3  },
  { id: "AW-010", trigger: "Key info change in 24h (password/2FA)", action: "Block",  enabled: true, hits24h: 1  },
];

export default function ApprovalWorkflowPage() {
  const [tab, setTab] = useState<Tab>("manual");
  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Funds" }, { label: "Approval Workflow" }]} />
      <PageHeader title="Approval Workflow" description="人工流程 + 自动化规则 · 编辑在 Approval Center"
        actions={
          <Link href="/crm/approvals/config/workflows"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50">
            Edit in Approval Center <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        }
      />

      <div className="flex items-center gap-1 border-b border-slate-200">
        <TabBtn label="Manual Workflows" active={tab === "manual"} onClick={() => setTab("manual")} />
        <TabBtn label="Auto Workflows (持续监控)" active={tab === "auto"} onClick={() => setTab("auto")} />
        <TabBtn label="Audit Trail" active={tab === "audit"} onClick={() => setTab("audit")} />
      </div>

      {tab === "manual" && <div className="space-y-4">{MANUAL.map((w) => <WorkflowCard key={w.id} w={w} />)}</div>}
      {tab === "auto" && <AutoRulesTable rows={AUTO} />}
      {tab === "audit" && <Card className="!p-8 text-center text-sm text-slate-500">工作流变更审计在 Approval Center → Audit Trail 查看</Card>}
    </div>
  );
}

function WorkflowCard({ w }: { w: ManualWorkflow }) {
  return (
    <Card className="!p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{w.id}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Active</span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 mt-0.5">{w.trigger}</h3>
          <p className="text-xs text-slate-500 mt-1">{w.description}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {w.steps.map((s, i) => <Step key={i} step={s} isLast={i === w.steps.length - 1} />)}
      </div>
      <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
        Last edited {w.lastEdited} by <span className="font-mono">{w.lastEditedBy}</span>
      </p>
    </Card>
  );
}

function Step({ step, isLast }: { step: ManualStep; isLast: boolean }) {
  const [hover, setHover] = useState(false);
  const Icon = step.kind === "auto" ? Zap : step.kind === "human" ? User : step.kind === "decision" ? GitBranch : CheckCircle2;
  const bg = step.kind === "auto"     ? "border-emerald-100 bg-emerald-50/40 text-emerald-700" :
             step.kind === "human"    ? "border-blue-100 bg-blue-50/40 text-blue-700"          :
             step.kind === "decision" ? "border-amber-100 bg-amber-50/40 text-amber-700"        :
                                         "border-slate-200 bg-slate-50/40 text-slate-600";
  const kindLabel = step.kind === "auto" ? "Auto" : step.kind === "human" ? "Human" : step.kind === "decision" ? "Decision" : "Endpoint";
  return (
    <>
      <div
        className={cn("relative inline-flex items-start gap-2 px-3 py-2 rounded-lg border transition-all", bg,
          hover && "shadow-md scale-[1.02] ring-2 ring-offset-1",
          hover && step.kind === "auto" && "ring-emerald-300",
          hover && step.kind === "human" && "ring-blue-300",
          hover && step.kind === "decision" && "ring-amber-300",
        )}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-800">{step.label}</p>
          {step.role && <p className="text-[10px] text-slate-500 mt-0.5">Role: <span className="font-mono">{step.role}</span></p>}
          {step.branches && (
            <ul className="mt-1 space-y-0.5">{step.branches.map((b) => (
              <li key={b.label} className="text-[10px] text-slate-500">{b.label} → <span className="font-medium">{b.target}</span></li>
            ))}</ul>
          )}
        </div>

        {hover && (
          <div className="absolute top-full left-0 mt-1.5 z-20 min-w-[200px] bg-slate-900 text-white text-[11px] rounded-lg px-3 py-2 shadow-xl pointer-events-none">
            <p className="font-semibold">{kindLabel} Node</p>
            {step.role && <p className="text-slate-300 mt-0.5">Acting role: <span className="font-mono text-white">{step.role}</span></p>}
            {step.kind === "auto"     && <p className="text-slate-300 mt-0.5">系统自动执行，无人工介入</p>}
            {step.kind === "human"    && <p className="text-slate-300 mt-0.5">需该角色操作员审核 / 批准</p>}
            {step.kind === "decision" && <p className="text-slate-300 mt-0.5">条件分支节点，按规则分流</p>}
            {step.kind === "end"      && <p className="text-slate-300 mt-0.5">流程终点</p>}
          </div>
        )}
      </div>
      {!isLast && <ArrowRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
    </>
  );
}

function AutoRulesTable({ rows }: { rows: AutoRule[] }) {
  return (
    <Card padding="none">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-3 py-2 font-medium">Rule ID</th>
            <th className="px-3 py-2 font-medium">Trigger</th>
            <th className="px-3 py-2 font-medium">Action</th>
            <th className="px-3 py-2 font-medium text-right">Hits 24h</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => {
            const tone = r.action === "Block" ? "text-red-700" : r.action === "Hold" ? "text-amber-700" : r.action === "Notify" ? "text-blue-700" : "text-slate-600";
            const dot  = r.action === "Block" ? "bg-red-500"   : r.action === "Hold" ? "bg-amber-500"   : r.action === "Notify" ? "bg-blue-500"   : "bg-slate-400";
            return (
              <tr key={r.id}>
                <td className="px-3 py-2 font-mono text-primary">{r.id}</td>
                <td className="px-3 py-2 text-slate-800">{r.trigger}</td>
                <td className="px-3 py-2">
                  <span className={cn("inline-flex items-center gap-1.5", tone)}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />{r.action}
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{r.hits24h}</td>
                <td className="px-3 py-2">{r.enabled ? <span className="text-emerald-700 inline-flex items-center gap-1.5"><Activity className="w-3 h-3" />Active</span> : <span className="text-slate-400">Disabled</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
      active ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700",
    )}>{label}</button>
  );
}
