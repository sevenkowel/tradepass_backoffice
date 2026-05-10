"use client";

/**
 * RichTimeline — vertical event stream with category-coded icons.
 *
 * Replaces the flat plain-text CaseTimeline. Categories drive icon +
 * colour:
 *   - submission (blue): customer-side action (submit / resubmit)
 *   - system     (slate): automated check (OCR / AML / risk / routing)
 *   - assignment (purple): case ownership transfer
 *   - comment    (slate-soft): internal note from a reviewer
 *   - decision   (emerald/red): terminal verdict
 *
 * Each row shows actor + action + description + relative time. A thin
 * connector line joins adjacent events to convey sequence.
 */

import {
  Send, Cpu, UserPlus, MessageSquare, CheckCircle2, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CaseTimelineEvent, TimelineEventCategory } from "@/types/clm";

interface Props {
  events: CaseTimelineEvent[];
  className?: string;
}

const CATEGORY_TONE: Record<
  TimelineEventCategory,
  { icon: typeof Send; iconBg: string; iconColor: string; line: string }
> = {
  submission: { icon: Send,           iconBg: "bg-blue-100",    iconColor: "text-blue-600",    line: "bg-blue-200"    },
  system:     { icon: Cpu,            iconBg: "bg-slate-100",   iconColor: "text-slate-500",   line: "bg-slate-200"   },
  assignment: { icon: UserPlus,       iconBg: "bg-violet-100",  iconColor: "text-violet-600",  line: "bg-violet-200"  },
  comment:    { icon: MessageSquare,  iconBg: "bg-slate-50",    iconColor: "text-slate-500",   line: "bg-slate-200"   },
  decision:   { icon: CheckCircle2,   iconBg: "bg-emerald-100", iconColor: "text-emerald-600", line: "bg-emerald-200" },
};

function formatRelative(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export function RichTimeline({ events, className }: Props) {
  if (!events || events.length === 0) {
    return (
      <p className={cn("text-sm text-slate-400 text-center py-6", className)}>
        No events yet.
      </p>
    );
  }

  return (
    <ol className={cn("relative", className)}>
      {events.map((evt, i) => {
        const cat = (evt.category ?? "system") as TimelineEventCategory;
        const tone = cat === "decision" && /reject|blacklist/i.test(evt.action)
          ? { ...CATEGORY_TONE.decision, icon: XCircle, iconBg: "bg-red-100", iconColor: "text-red-600", line: "bg-red-200" }
          : CATEGORY_TONE[cat];
        const Icon = tone.icon;
        const isLast = i === events.length - 1;
        return (
          <li key={evt.id} className="relative flex gap-3 pb-4 last:pb-0">
            {/* Connector line */}
            {!isLast && (
              <span
                className={cn("absolute left-4 top-8 bottom-0 w-px", tone.line)}
                aria-hidden
              />
            )}

            {/* Icon dot */}
            <span className={cn(
              "relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              tone.iconBg
            )}>
              <Icon className={cn("w-4 h-4", tone.iconColor)} />
            </span>

            {/* Content */}
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-baseline justify-between gap-2 mb-0.5">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {evt.action}
                </p>
                <time className="text-[11px] text-slate-400 tabular-nums whitespace-nowrap" title={new Date(evt.timestamp).toLocaleString()}>
                  {formatRelative(evt.timestamp)}
                </time>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {evt.description}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                <span className="font-medium">{evt.actor}</span>
                <span className="mx-1.5 text-slate-300">·</span>
                <span>{evt.actorRole}</span>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
