"use client";

/**
 * Approval Center — All
 *
 * Cross-module global search / audit view. Unlike Inbox (personal
 * queue), this surface shows **every** approval task — including
 * terminal ones (approved/rejected) — for ad-hoc lookup and QA.
 *
 * Reuses the shared `TaskListView` table with no default filters.
 * See `docs/Approval-Center-v2-Architecture.md`.
 */

import { TaskListView } from "@/components/crm/approvals/TaskListView";

export default function AllApprovalsPage() {
  return (
    <TaskListView
      breadcrumb={[{ label: "Approval Center" }, { label: "All" }]}
      description="Every approval task across modules — including approved / rejected for audit lookup"
      showBatchActions
    />
  );
}
