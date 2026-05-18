"use client";

/**
 * Re-Verification → Requests.
 *
 * Active-only by default (drafts / notified / submitted / in_review).
 * Use the History page for completed records — separating them keeps the
 * primary table tight and answers PRD §9 + §19's split between live work
 * and audit.
 *
 * Manual triggering:
 *   - Multi-select in the table → "Trigger re-verification" toolbar action
 *     opens the drawer with those users pre-filled.
 *   - "+ New Request" header button opens the drawer empty so the
 *     operator can paste a UID list (mock pulls from Prisma in production).
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Send, X, ShieldQuestion } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import {
  EnhancedDataTable,
  type Column,
  type RowAction,
} from "@/components/crm/ui/EnhancedDataTable";
import { reVerificationService } from "@/lib/clm/services";
import { useCurrentStaffName } from "@/hooks/useCurrentStaff";
import {
  ACTIVE_STATUSES,
  REASON_LABELS,
  STATUS_META,
  TRIGGER_LABELS,
  TYPE_META,
  TYPE_ORDER,
  TypePill,
  StatusPill,
  fmtRel,
} from "@/components/crm/clm/re-verification/bits";
import {
  NewRequestDrawer,
  type UserPick,
} from "@/components/crm/clm/re-verification/NewRequestDrawer";
import type {
  ReVerificationRequest,
  ReVerificationStatus,
  ReVerificationType,
} from "@/types/clm";

export default function ReVerificationRequestsPage() {
  const actor = useCurrentStaffName();

  const [rows, setRows] = useState<ReVerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | ReVerificationStatus>("active");
  const [typeFilter, setTypeFilter] = useState<"all" | ReVerificationType>("all");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerUsers, setDrawerUsers] = useState<UserPick[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    const status = statusFilter === "active" ? ACTIVE_STATUSES : statusFilter;
    const result = await reVerificationService.requests.list({
      status,
      type: typeFilter === "all" ? undefined : typeFilter,
      search: search.trim() || undefined,
      pageSize: 200,
    });
    setRows(result.items);
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, search]);

  // Counts for the status chip strip — independent of the active filter
  // so the chips themselves reflect the whole pool, not the filtered view.
  const [allRows, setAllRows] = useState<ReVerificationRequest[]>([]);
  useEffect(() => {
    reVerificationService.requests
      .list({ pageSize: 500 })
      .then((res) => setAllRows(res.items));
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { active: 0 };
    for (const r of allRows) {
      c[r.status] = (c[r.status] ?? 0) + 1;
      if (ACTIVE_STATUSES.includes(r.status)) c.active += 1;
    }
    return c;
  }, [allRows]);

  // Open drawer pre-loaded with the currently selected rows. The mock
  // doesn't actually back the user list — we pluck what we know from
  // the requests themselves. In production this would call a user
  // lookup endpoint.
  const triggerForSelected = () => {
    const seenUsers = new Set<string>();
    const users: UserPick[] = [];
    for (const id of selected) {
      const row = rows.find((r) => r.id === id);
      if (!row || seenUsers.has(row.userId)) continue;
      seenUsers.add(row.userId);
      users.push({
        id: row.userId,
        uid: row.userUid,
        name: row.userName,
        email: row.userEmail,
        country: row.country,
      });
    }
    setDrawerUsers(users);
    setDrawerOpen(true);
  };

  const cancelRow = async (id: string) => {
    if (!confirm("Cancel this re-verification? The user notification stays in their inbox but no longer requires action.")) return;
    await reVerificationService.requests.cancel(id, actor);
    await reload();
    setAllRows((arr) => arr.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)));
  };

  const columns: Column<ReVerificationRequest>[] = [
    {
      key: "requestNo",
      title: "Request",
      width: "150px",
      sortable: true,
      render: (row) => (
        <Link
          href={`/crm/clm/re-verification/requests/${encodeURIComponent(row.id)}`}
          className="font-mono tabular-nums text-xs text-primary hover:underline"
        >
          {row.requestNo}
        </Link>
      ),
    },
    {
      key: "user",
      title: "User",
      sortField: "userName",
      sortable: true,
      render: (row) => (
        <div className="min-w-0">
          <p className="text-sm text-slate-900 font-medium truncate">{row.userName}</p>
          <p className="text-[11px] font-mono tabular-nums text-slate-400">
            {row.userUid} · {row.country}
          </p>
        </div>
      ),
    },
    {
      key: "type",
      title: "Type",
      width: "140px",
      sortable: true,
      render: (row) => <TypePill type={row.type} />,
    },
    {
      key: "trigger",
      title: "Trigger",
      width: "120px",
      sortable: true,
      render: (row) => (
        <div className="text-xs">
          <p className="text-slate-700">{TRIGGER_LABELS[row.trigger]}</p>
          <p className="text-[10px] text-slate-400">{REASON_LABELS[row.triggerReason]}</p>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      width: "110px",
      sortable: true,
      render: (row) => <StatusPill status={row.status} />,
    },
    {
      key: "deadline",
      title: "Deadline",
      width: "120px",
      sortable: true,
      sortField: "deadlineAt",
      render: (row) => {
        if (!row.deadlineAt) return <span className="text-slate-300 text-xs">—</span>;
        const overdue = new Date(row.deadlineAt).getTime() < Date.now();
        return (
          <span
            className={`text-xs font-mono tabular-nums ${
              overdue ? "text-red-600 font-semibold" : "text-slate-600"
            }`}
            title={new Date(row.deadlineAt).toLocaleString()}
          >
            {fmtRel(row.deadlineAt)}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      title: "Created",
      width: "150px",
      sortable: true,
      defaultHidden: true,
      render: (row) => (
        <div className="text-[11px]">
          <p className="text-slate-600 font-mono tabular-nums">{fmtRel(row.createdAt)}</p>
          <p className="text-slate-400">by {row.createdByName}</p>
        </div>
      ),
    },
  ];

  const rowActions: RowAction<ReVerificationRequest>[] = [
    {
      label: "Open detail",
      onClick: (row) => {
        window.location.href = `/crm/clm/re-verification/requests/${row.id}`;
      },
    },
    {
      label: "View linked case",
      onClick: (row) => {
        if (row.caseId) window.location.href = `/crm/clm/cases/${row.caseId}`;
      },
      disabled: (row) => !row.caseId,
    },
    {
      label: "Cancel request",
      onClick: (row) => cancelRow(row.id),
      variant: "danger",
      disabled: (row) => !["draft", "notified"].includes(row.status),
    },
  ];

  const STATUS_CHIPS: { key: "active" | ReVerificationStatus; label: string }[] = [
    { key: "active",     label: "Active" },
    { key: "notified",   label: STATUS_META.notified.label },
    { key: "submitted",  label: STATUS_META.submitted.label },
    { key: "in_review",  label: STATUS_META.in_review.label },
    { key: "expired",    label: STATUS_META.expired.label },
  ];

  return (
    <div className="space-y-3">
      <Breadcrumb
        items={[
          { label: "CLM Center" },
          { label: "Re-Verification", href: "/crm/clm/re-verification/requests" },
          { label: "Requests" },
        ]}
      />
      <PageHeader
        title="Re-Verification Requests"
        actions={
          <Button onClick={() => { setDrawerUsers([]); setDrawerOpen(true); }}>
            <Plus className="w-4 h-4" />
            New Request
          </Button>
        }
      />

      {/* Status + type filter strip */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_CHIPS.map(({ key, label }) => {
          const count = counts[key] ?? 0;
          const active = statusFilter === key;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                active
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {label}
              <span className={`text-[10px] font-mono tabular-nums ${active ? "text-white/70" : "text-slate-400"}`}>
                {count}
              </span>
            </button>
          );
        })}
        <span className="w-px h-5 bg-slate-200 mx-1" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="h-8 px-2 rounded-md border border-slate-200 bg-white text-xs"
        >
          <option value="all">All types</option>
          {TYPE_ORDER.map((t) => (
            <option key={t} value={t}>
              {TYPE_META[t].label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search request, UID, user…"
          className="flex-1 min-w-[220px] h-8 px-3 rounded-md border border-slate-200 bg-white text-xs"
        />
      </div>

      <Card padding="none">
        <EnhancedDataTable<ReVerificationRequest>
          tableId="re-verification-requests"
          columns={columns}
          data={rows}
          keyExtractor={(row) => row.id}
          rowActions={rowActions}
          selectable
          selectedKeys={selected}
          onSelectionChange={setSelected}
          bulkActions={(keys) =>
            keys.size > 0 ? (
              <Button size="sm" onClick={triggerForSelected}>
                <Send className="w-3 h-3" />
                Trigger re-verification ({keys.size})
              </Button>
            ) : null
          }
          loading={loading}
          emptyText={loading ? "" : "No active re-verifications"}
          pagination={false}
        />
      </Card>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-md shadow-lg">
          <ShieldQuestion className="w-3.5 h-3.5 text-emerald-400" />
          {toast}
          <button onClick={() => setToast(null)} className="ml-2 text-white/60 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <NewRequestDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        preselectedUsers={drawerUsers}
        onCreated={(n) => {
          setToast(`Created ${n} re-verification request${n === 1 ? "" : "s"}`);
          setSelected(new Set());
          reload();
          reVerificationService.requests
            .list({ pageSize: 500 })
            .then((res) => setAllRows(res.items));
        }}
      />
    </div>
  );
}
