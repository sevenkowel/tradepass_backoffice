"use client";

/**
 * Approval Center — Routing Rules config (v3)
 *
 * Implements PRD §18. Lists the cross-module routing rules that
 * decide which reviewer / team / role gets a new task. Each rule has
 * a priority, conditions (country / risk / VIP / amount / type) and
 * an action (round_robin / skill_based / manual / self_pick + assign
 * target).
 *
 * Data source: `routingEngine.DEFAULT_ROUTING_RULES`. Editing is
 * stubbed; the page is the visible surface that makes the engine
 * configurable in PRD §28's sense ("Workflow Engine"), even before
 * the editor lands.
 */

import { Settings2, ArrowDown, ArrowUp, Power, PowerOff } from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, BadgeBase, type BadgeTone } from "@/components/crm/ui";
import { DEFAULT_ROUTING_RULES } from "@/lib/approval/routingEngine";

const STRATEGY_LABEL: Record<string, string> = {
  manual:      "Manual",
  skill_based: "Skill-based",
  round_robin: "Round Robin",
  self_pick:   "Self-pick",
};

const STRATEGY_TONE: Record<string, BadgeTone> = {
  manual:      "warning",
  skill_based: "primary",
  round_robin: "info",
  self_pick:   "neutral",
};

export default function RoutingRulesPage() {
  const rules = [...DEFAULT_ROUTING_RULES].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-3">
      <Breadcrumb
        items={[
          { label: "Approval Center" },
          { label: "Configuration" },
          { label: "Routing Rules" },
        ]}
      />
      <PageHeader
        title="Routing Rules"
        description="Cross-module rules that route incoming tasks to the right reviewer / team / role"
        actions={
          <button
            onClick={() => alert("Rule editor coming in Phase 2")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            + Add Rule
          </button>
        }
      />

      {/* Routing rule precedence callout */}
      <Card className="!p-3 border-blue-100 bg-blue-50/40">
        <p className="text-xs text-slate-600">
          <span className="font-semibold text-slate-900">Evaluation order:</span> rules apply top-down by priority. The
          first rule whose conditions all match wins; remaining rules are skipped. The default rule (priority 999)
          is the catch-all.
        </p>
      </Card>

      {/* Rules table */}
      <Card padding="none">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-2 text-left w-16">Priority</th>
              <th className="px-4 py-2 text-left w-40">Rule Name</th>
              <th className="px-4 py-2 text-left">Conditions</th>
              <th className="px-4 py-2 text-left w-44">Action</th>
              <th className="px-4 py-2 text-center w-20">Status</th>
              <th className="px-4 py-2 text-right w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-slate-50/40">
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-slate-100 text-slate-600 font-mono tabular-nums text-xs">
                    {rule.priority}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-sm font-medium text-slate-900">{rule.name}</span>
                </td>
                <td className="px-4 py-2.5">
                  <ConditionsCell conditions={rule.conditions} />
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-col gap-1">
                    <BadgeBase tone={STRATEGY_TONE[rule.action.strategy]} size="sm">
                      {STRATEGY_LABEL[rule.action.strategy] ?? rule.action.strategy}
                    </BadgeBase>
                    {(rule.action.assignToTeam || rule.action.assignToRole || rule.action.assignTo) && (
                      <span className="text-[11px] text-slate-500">
                        → {rule.action.assignToTeam ?? rule.action.assignToRole ?? rule.action.assignTo?.join(", ")}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <BadgeBase tone={rule.enabled ? "success" : "neutral"} size="sm">
                    {rule.enabled ? "Active" : "Disabled"}
                  </BadgeBase>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <IconBtn icon={<ArrowUp className="w-3 h-3" />}    title="Increase priority" />
                    <IconBtn icon={<ArrowDown className="w-3 h-3" />}  title="Decrease priority" />
                    <IconBtn
                      icon={rule.enabled ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                      title={rule.enabled ? "Disable rule" : "Enable rule"}
                    />
                    <IconBtn icon={<Settings2 className="w-3 h-3" />} title="Edit rule" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */

function ConditionsCell({ conditions }: { conditions: Record<string, unknown> }) {
  const entries = Object.entries(conditions);
  if (entries.length === 0) {
    return <span className="text-xs text-slate-400 italic">Always matches (catch-all)</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([key, value]) => (
        <span
          key={key}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-[11px] text-slate-700"
        >
          <span className="text-slate-400">{conditionLabel(key)}:</span>
          <span className="font-medium">{fmtValue(value)}</span>
        </span>
      ))}
    </div>
  );
}

function conditionLabel(key: string): string {
  switch (key) {
    case "countries":   return "country";
    case "riskLevels":  return "risk";
    case "taskTypes":   return "type";
    case "isVip":       return "VIP";
    case "amountAbove": return "amount >";
    case "amountBelow": return "amount <";
    case "hasFlags":    return "flag";
    case "languages":   return "lang";
    default:            return key;
  }
}

function fmtValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(" | ");
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
}

function IconBtn({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <button
      title={title}
      onClick={() => alert(`${title} — coming in Phase 2`)}
      className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
    >
      {icon}
    </button>
  );
}
