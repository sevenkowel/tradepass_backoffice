"use client";

/**
 * RichTimeline — vertical event stream with category-coded icons.
 *
 * Categories drive icon + colour:
 *   - submission (blue):    customer-side action (submit / resubmit)
 *   - system     (slate):    automated check (OCR / AML / risk / routing)
 *   - assignment (purple):   case ownership transfer
 *   - comment    (slate-soft): internal note from a reviewer
 *   - decision   (emerald/red): terminal verdict
 *
 * Decision events render a coloured **result pill** on the row's right
 * edge so reviewers can scan outcomes at a glance, and any event
 * carrying `metadata.reason` renders that reason as a quoted block
 * below the description (so reviewer justifications aren't buried in
 * free text).
 */

import {
  Send, Cpu, UserPlus, MessageSquare, CheckCircle2, XCircle, Quote, ArrowUp, ShieldOff, Reply, CornerDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CaseTimelineEvent,
  TimelineDecisionResult,
  TimelineEventCategory,
} from "@/types/clm";

interface Props {
  events: CaseTimelineEvent[];
  className?: string;
  /** When present, hovering an event reveals a "Reply" affordance. The
   *  parent decides whether to allow replies (e.g. closed cases are
   *  read-only). The callback receives the parent event id. */
  onReply?: (parentId: string) => void;
  /** Id of the event currently being replied to — drives the inline
   *  reply input rendering under the matching event. */
  replyingTo?: string | null;
  /** Slot for the inline reply input. Rendered under `replyingTo` event. */
  replyInput?: React.ReactNode;
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

const RESULT_PILL: Record<
  TimelineDecisionResult,
  { label: string; tone: string }
> = {
  approved:           { label: "Approved",     tone: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" },
  auto_approved:      { label: "Auto Approved", tone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
  rejected:           { label: "Rejected",     tone: "bg-red-100 text-red-700 ring-1 ring-red-200" },
  auto_rejected:      { label: "Auto Rejected", tone: "bg-red-50 text-red-700 ring-1 ring-red-100" },
  resubmit_requested: { label: "Resubmit",     tone: "bg-amber-100 text-amber-700 ring-1 ring-amber-200" },
  escalated:          { label: "Escalated",    tone: "bg-orange-100 text-orange-700 ring-1 ring-orange-200" },
  blacklisted:        { label: "Blacklisted",  tone: "bg-slate-900 text-white ring-1 ring-slate-700" },
};

/** Choose icon overrides for sharper signal: rejected/blacklisted/
 *  escalated decisions get their own iconography rather than the
 *  default green check. */
function decisionVisuals(
  result?: TimelineDecisionResult
): { icon: typeof Send; iconBg: string; iconColor: string; line: string } {
  if (!result) return CATEGORY_TONE.decision;
  if (result === "rejected" || result === "auto_rejected") {
    return { icon: XCircle, iconBg: "bg-red-100", iconColor: "text-red-600", line: "bg-red-200" };
  }
  if (result === "blacklisted") {
    return { icon: ShieldOff, iconBg: "bg-slate-900", iconColor: "text-white", line: "bg-slate-300" };
  }
  if (result === "escalated") {
    return { icon: ArrowUp, iconBg: "bg-orange-100", iconColor: "text-orange-600", line: "bg-orange-200" };
  }
  return CATEGORY_TONE.decision;
}

/** Wrap numeric tokens in mono+semibold so things like `78/100` /
 *  `0.94` / `$10,000` stand out without forcing producers to mark them
 *  up by hand. */
const NUMERIC_REGEX = /(\b\d+(?:[\.,]\d+)?\s?(?:%|\/\s?\d+|USD|IDR|VND|EUR|MYR|THB|JPY|KRW|GBP|SGD|HKD|CNY|points?|pts?|m|h|d)?)\b/g;
function highlightNumbers(text: string): React.ReactNode {
  if (!text) return text;
  const parts = text.split(NUMERIC_REGEX);
  return parts.map((part, i) =>
    NUMERIC_REGEX.test(part) ? (
      <span key={i} className="font-mono tabular-nums font-semibold text-slate-700">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

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

export function RichTimeline({ events, className, onReply, replyingTo, replyInput }: Props) {
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
        const result = evt.metadata?.result;
        const tone = cat === "decision" ? decisionVisuals(result) : CATEGORY_TONE[cat];
        const Icon = tone.icon;
        const isLast = i === events.length - 1;
        const isReply = !!evt.parentId;
        return (
          <li
            key={evt.id}
            className={cn("group relative flex gap-3 pb-4 last:pb-0", isReply && "pl-8")}
          >
            {/* Reply thread connector — indents into parent */}
            {isReply && (
              <span
                className="absolute left-3 top-0 w-6 h-5 border-l border-b border-slate-200 rounded-bl-md"
                aria-hidden
              />
            )}

            {/* Connector line (vertical between siblings) */}
            {!isLast && !isReply && (
              <span
                className={cn("absolute left-4 top-8 bottom-0 w-px", tone.line)}
                aria-hidden
              />
            )}

            {/* Icon dot */}
            <span className={cn(
              "relative z-10 rounded-full flex items-center justify-center flex-shrink-0",
              isReply ? "w-6 h-6" : "w-8 h-8",
              tone.iconBg
            )}>
              {isReply
                ? <CornerDownRight className={cn("w-3 h-3", tone.iconColor)} />
                : <Icon className={cn("w-4 h-4", tone.iconColor)} />
              }
            </span>

            {/* Content */}
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-baseline justify-between gap-2 mb-0.5">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {evt.action}
                </p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {result && (
                    <span className={cn(
                      "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                      RESULT_PILL[result].tone
                    )}>
                      {RESULT_PILL[result].label}
                    </span>
                  )}
                  <time
                    className="text-[11px] text-slate-400 tabular-nums whitespace-nowrap"
                    title={new Date(evt.timestamp).toLocaleString()}
                  >
                    {formatRelative(evt.timestamp)}
                  </time>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {highlightNumbers(evt.description)}
              </p>

              {/* Reviewer reason — quoted block, visually separated. */}
              {evt.metadata?.reason && (
                <blockquote className="mt-2 flex gap-2 px-2.5 py-1.5 bg-slate-50 border-l-2 border-slate-300 rounded-r-md text-xs text-slate-700 italic">
                  <Quote className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{evt.metadata.reason}</span>
                </blockquote>
              )}

              <div className="flex items-center justify-between mt-1">
                <p className="text-[11px] text-slate-400">
                  <span className="font-medium">{evt.actor}</span>
                  <span className="mx-1.5 text-slate-300">·</span>
                  <span>{evt.actorRole}</span>
                </p>
                {onReply && !isReply && (
                  <button
                    onClick={() => onReply(evt.id)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] text-slate-300 group-hover:text-slate-500 hover:!text-blue-600 hover:bg-blue-50 focus:text-blue-600 rounded transition-colors"
                  >
                    <Reply className="w-3 h-3" />
                    Reply
                  </button>
                )}
              </div>

              {/* Inline reply input slot */}
              {replyingTo === evt.id && replyInput && (
                <div className="mt-2">{replyInput}</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
