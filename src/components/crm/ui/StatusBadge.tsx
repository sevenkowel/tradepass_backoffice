"use client";

import { cn } from "@/lib/utils";
import type { StatusType } from "@/types/backoffice";
import { BadgeBase, type BadgeTone } from "./BadgeBase";

/**
 * Generic status badge — lookup table for known statuses, falls back
 * to the supplied `type` (mapped to a tone) or `neutral`.
 */
interface StatusBadgeProps {
  status: string;
  type?: StatusType;
  size?: "sm" | "md";
  className?: string;
}

const statusConfig: Record<string, { type: StatusType; label: string }> = {
  // User Status
  active: { type: "success", label: "Active" },
  frozen: { type: "error", label: "Frozen" },
  pending: { type: "warning", label: "Pending" },
  closed: { type: "default", label: "Closed" },

  // KYC Status
  not_submitted: { type: "default", label: "Not Submitted" },
  approved: { type: "success", label: "Approved" },
  rejected: { type: "error", label: "Rejected" },
  supplement_required: { type: "warning", label: "Supplement Required" },

  // Order/Transaction Status
  open: { type: "info", label: "Open" },
  success: { type: "success", label: "Success" },
  failed: { type: "error", label: "Failed" },
  cancelled: { type: "default", label: "Cancelled" },
  refunded: { type: "warning", label: "Refunded" },
  processing: { type: "info", label: "Processing" },

  // Withdrawal Status
  初审通过: { type: "info", label: "初审通过" },
  复审通过: { type: "info", label: "复审通过" },
  executing: { type: "info", label: "Executing" },
  suspended: { type: "warning", label: "Suspended" },

  // Account Status
  deleted: { type: "default", label: "Deleted" },

  // Channel Status
  active_channel: { type: "success", label: "Active" },
  inactive: { type: "default", label: "Inactive" },
  maintenance: { type: "warning", label: "Maintenance" },

  // Order types
  buy: { type: "success", label: "Buy" },
  sell: { type: "error", label: "Sell" },
};

/** Map StatusType (success / warning / error / info / pending / default) to BadgeTone. */
const statusTypeToTone: Record<StatusType, BadgeTone> = {
  success: "success",
  warning: "warning",
  error: "error",
  info: "info",
  pending: "warning",
  default: "neutral",
};

export function StatusBadge({
  status,
  type,
  size = "sm",
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || {
    type: type || "default",
    label: status,
  };

  return (
    <BadgeBase tone={statusTypeToTone[config.type]} size={size} className={className}>
      {config.label}
    </BadgeBase>
  );
}

// ---------------------------------------------------------------------
// Level Badge — uppercase tracking, no dot, uses color tones from system
// ---------------------------------------------------------------------
interface LevelBadgeProps {
  level: string;
  className?: string;
}

const levelTone: Record<string, BadgeTone> = {
  standard: "neutral",
  vip: "warning",
  premium: "purple",
  enterprise: "primary",
};

export function LevelBadge({ level, className }: LevelBadgeProps) {
  const tone = levelTone[level.toLowerCase()] || "neutral";
  return (
    <BadgeBase
      tone={tone}
      dot={false}
      className={cn("uppercase tracking-wide font-semibold", className)}
    >
      {level}
    </BadgeBase>
  );
}

// ---------------------------------------------------------------------
// Type Badge — Buy / Sell — fixed semantics
// ---------------------------------------------------------------------
interface TypeBadgeProps {
  type: "buy" | "sell";
  className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  return (
    <BadgeBase
      tone={type === "buy" ? "success" : "error"}
      dot={false}
      className={cn("font-semibold", className)}
    >
      {type.toUpperCase()}
    </BadgeBase>
  );
}
