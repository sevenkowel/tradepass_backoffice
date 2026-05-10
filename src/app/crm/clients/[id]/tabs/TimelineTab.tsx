"use client";

import {
  UserPlus,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  LogIn,
  Ban,
  Unlock,
  Settings,
  Ticket,
  ClipboardList,
  MessageSquare,
  Monitor,
  FileText,
  Circle,
} from "lucide-react";
import type { ClientDetailData, TimelineEvent } from "@/types/backoffice/client-detail";
import type { BaseTabProps } from "@/types/backoffice/client";


export default function TimelineTab({ data }: BaseTabProps) {
  const { timeline } = data;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">事件时间线</h3>

      <div className="relative">
        {/* 垂直线 */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />

        <div className="space-y-0">
          {timeline.map((event) => (
            <TimelineItem key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  const Icon = eventIcon(event.type);
  const colorClass = eventColor(event.type);

  return (
    <div className="relative flex gap-4 py-3">
      {/* 图标 */}
      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass.bg} ${colorClass.text}`}>
        <Icon className="w-4 h-4" />
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900">{event.title}</span>
          {event.operator && (
            <span className="text-xs text-slate-400">by {event.operator}</span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
        <span className="text-xs text-slate-400 mt-1 block">{new Date(event.timestamp).toLocaleString("zh-CN")}</span>
      </div>
    </div>
  );
}

function eventIcon(type: string) {
  const icons: Record<string, React.ElementType> = {
    registered: UserPlus,
    kyc_submitted: ShieldCheck,
    kyc_approved: ShieldCheck,
    kyc_rejected: ShieldCheck,
    deposit: ArrowDownLeft,
    withdrawal: ArrowUpRight,
    trade: TrendingUp,
    login: LogIn,
    account_frozen: Ban,
    account_unfrozen: Unlock,
    permission_updated: Settings,
    ticket_created: Ticket,
    ticket_replied: MessageSquare,
    case_created: ClipboardList,
    case_resolved: ClipboardList,
    note_added: MessageSquare,
    device_added: Monitor,
    agreement_signed: FileText,
  };
  return icons[type] || Circle;
}

function eventColor(type: string) {
  const colors: Record<string, { bg: string; text: string }> = {
    registered: { bg: "bg-blue-100", text: "text-blue-600" },
    kyc_submitted: { bg: "bg-amber-100", text: "text-amber-600" },
    kyc_approved: { bg: "bg-emerald-100", text: "text-emerald-600" },
    kyc_rejected: { bg: "bg-red-100", text: "text-red-600" },
    deposit: { bg: "bg-emerald-100", text: "text-emerald-600" },
    withdrawal: { bg: "bg-red-100", text: "text-red-600" },
    trade: { bg: "bg-violet-100", text: "text-violet-600" },
    login: { bg: "bg-slate-100", text: "text-slate-600" },
    account_frozen: { bg: "bg-red-100", text: "text-red-600" },
    account_unfrozen: { bg: "bg-emerald-100", text: "text-emerald-600" },
    permission_updated: { bg: "bg-blue-100", text: "text-blue-600" },
    ticket_created: { bg: "bg-amber-100", text: "text-amber-600" },
    ticket_replied: { bg: "bg-blue-100", text: "text-blue-600" },
    case_created: { bg: "bg-amber-100", text: "text-amber-600" },
    case_resolved: { bg: "bg-emerald-100", text: "text-emerald-600" },
    note_added: { bg: "bg-slate-100", text: "text-slate-600" },
    device_added: { bg: "bg-blue-100", text: "text-blue-600" },
    agreement_signed: { bg: "bg-emerald-100", text: "text-emerald-600" },
  };
  return colors[type] || { bg: "bg-slate-100", text: "text-slate-600" };
}
