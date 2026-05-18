"use client";

/**
 * Approval Center — Notifications config (v3)
 *
 * Implements PRD §22. Channel × event matrix: which channels fire on
 * which workflow events. Templates surface as a separate stub list
 * (variable substitution is a Phase 2 concern).
 *
 * Data: hardcoded defaults — there is no notifications service yet.
 * Persistence is stubbed; toggling channels updates local state only.
 */

import { useState } from "react";
import { Mail, MessageSquare, Bell, Webhook, FileText } from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { Card, PageHeader, BadgeBase } from "@/components/crm/ui";
import type { NotificationChannel, NotificationEvent } from "@/types/approval";

const CHANNELS: Array<{
  key: NotificationChannel;
  label: string;
  icon: typeof Mail;
  desc: string;
}> = [
  { key: "email",   label: "Email",   icon: Mail,          desc: "SMTP delivery to reviewer mailbox" },
  { key: "inbox",   label: "Inbox",   icon: MessageSquare, desc: "In-app notification bell" },
  { key: "push",    label: "Push",    icon: Bell,          desc: "Browser / mobile push" },
  { key: "webhook", label: "Webhook", icon: Webhook,       desc: "Slack / Teams / custom HTTP" },
];

const EVENTS: Array<{ key: NotificationEvent; label: string; recipient: string }> = [
  { key: "task_assigned",            label: "Task assigned",       recipient: "assignee" },
  { key: "task_claimed",             label: "Task claimed",        recipient: "team channel" },
  { key: "sla_warning",              label: "SLA warning",         recipient: "assignee + supervisor" },
  { key: "sla_timeout",              label: "SLA timeout",         recipient: "supervisor" },
  { key: "task_escalated",           label: "Task escalated",      recipient: "senior reviewer" },
  { key: "task_approved",            label: "Task approved",       recipient: "submitter (callback)" },
  { key: "task_rejected",            label: "Task rejected",       recipient: "submitter (callback)" },
  { key: "task_re_submitted",        label: "Task re-submitted",   recipient: "assignee" },
  { key: "additional_docs_requested", label: "Additional docs requested", recipient: "submitter" },
  { key: "batch_completed",          label: "Batch completed",     recipient: "operator" },
];

// Default matrix — which channels fire on each event by default.
const DEFAULT_MATRIX: Record<NotificationEvent, NotificationChannel[]> = {
  task_assigned:             ["email", "inbox"],
  task_claimed:              ["inbox"],
  sla_warning:               ["email", "inbox", "push"],
  sla_timeout:               ["email", "inbox", "push", "webhook"],
  task_escalated:            ["email", "inbox", "push"],
  task_approved:             ["webhook"],
  task_rejected:             ["webhook"],
  task_re_submitted:         ["inbox"],
  additional_docs_requested: ["email"],
  batch_completed:           ["inbox"],
};

const TEMPLATES = [
  { id: "tpl-assigned",  event: "task_assigned",  name: "New task — {{taskId}}", lang: "en" },
  { id: "tpl-sla",       event: "sla_warning",    name: "SLA warning — {{minutes}}m left",  lang: "en" },
  { id: "tpl-timeout",   event: "sla_timeout",    name: "SLA breach — {{taskId}}",          lang: "en" },
  { id: "tpl-escalated", event: "task_escalated", name: "Escalated — {{operatorName}} → {{newAssignee}}", lang: "en" },
];

export default function NotificationsConfigPage() {
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX);

  const toggle = (event: NotificationEvent, channel: NotificationChannel) => {
    setMatrix((prev) => {
      const current = prev[event];
      const next = current.includes(channel)
        ? current.filter((c) => c !== channel)
        : [...current, channel];
      return { ...prev, [event]: next };
    });
  };

  return (
    <div className="space-y-3">
      <Breadcrumb
        items={[
          { label: "Approval Center" },
          { label: "Configuration" },
          { label: "Notifications" },
        ]}
      />
      <PageHeader
        title="Notifications"
        description="Channel × event matrix: which channels fire on each workflow event"
      />

      {/* Channel summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {CHANNELS.map((c) => (
          <Card key={c.key} className="!p-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                <c.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{c.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{c.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Matrix */}
      <Card padding="none">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">Channel × event matrix</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Click a cell to toggle. Default recipients are listed per event row.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-2 text-left">Event</th>
                <th className="px-4 py-2 text-left w-44">Recipient</th>
                {CHANNELS.map((c) => (
                  <th key={c.key} className="px-3 py-2 text-center w-20">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {EVENTS.map((evt) => (
                <tr key={evt.key} className="hover:bg-slate-50/40">
                  <td className="px-4 py-2.5">
                    <span className="text-sm font-medium text-slate-900">{evt.label}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs text-slate-500">{evt.recipient}</span>
                  </td>
                  {CHANNELS.map((c) => {
                    const on = matrix[evt.key].includes(c.key);
                    return (
                      <td key={c.key} className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => toggle(evt.key, c.key)}
                          className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                            on
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-slate-50 text-slate-300 hover:bg-slate-100"
                          }`}
                          title={on ? `${c.label} enabled — click to disable` : `${c.label} disabled — click to enable`}
                        >
                          {on ? "✓" : "—"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Templates */}
      <Card padding="none">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">Templates</h3>
          <button
            onClick={() => alert("Template editor coming in Phase 2")}
            className="text-xs text-primary hover:underline"
          >
            + New template
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {TEMPLATES.map((tpl) => (
            <div key={tpl.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/40">
              <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">{tpl.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Triggers on <span className="font-mono">{tpl.event}</span>
                </p>
              </div>
              <BadgeBase tone="neutral" size="sm" dot={false}>
                {tpl.lang}
              </BadgeBase>
              <button
                onClick={() => alert("Template editor coming in Phase 2")}
                className="text-xs text-primary hover:underline"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
