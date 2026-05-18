"use client";

import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";
import type { CaseTimelineEvent } from "@/types/clm";

interface CaseTimelineProps {
  events: CaseTimelineEvent[];
  className?: string;
}

const actionColors: Record<string, string> = {
  "Case Created": "bg-blue-500",
  "Case Assigned": "bg-purple-500",
  "Case Reviewed": "bg-amber-500",
  "Comment Added": "bg-gray-500",
  "Case Approved": "bg-emerald-500",
  "Case Rejected": "bg-red-500",
  "Case Escalated": "bg-orange-500",
  "Case Resubmitted": "bg-amber-500",
};

export function CaseTimeline({ events, className }: CaseTimelineProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const colorClass = actionColors[event.action] || "bg-gray-400";

        return (
          <div key={event.id} className="flex gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={cn("w-2.5 h-2.5 rounded-full", colorClass)} />
              {!isLast && <div className="w-px h-full bg-gray-200 min-h-[40px]" />}
            </div>

            {/* Content */}
            <div className="pb-4 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-gray-900">{event.action}</span>
                <span className="text-xs text-gray-400">
                  {new Date(event.timestamp).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-600">{event.description}</p>
              {event.actor !== "System" && (
                <p className="text-xs text-gray-400 mt-0.5">
                  by {event.actor} ({event.actorRole})
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
