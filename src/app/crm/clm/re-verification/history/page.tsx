"use client";

/**
 * Re-Verification → History.
 *
 * Read-only audit view of completed (and cancelled / expired) requests.
 * Same row shape as the Requests page, but the action surface is
 * "open detail" only — closed records are immutable per PRD §19.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, PageHeader } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import {
  EnhancedDataTable,
  type Column,
  type RowAction,
} from "@/components/crm/ui/EnhancedDataTable";
import { reVerificationService } from "@/lib/clm/services";
import {
  COMPLETED_STATUSES,
  REASON_LABELS,
  STATUS_META,
  StatusPill,
  TRIGGER_LABELS,
  TYPE_META,
  TYPE_ORDER,
  TypePill,
  fmtRel,
} from "@/components/crm/clm/re-verification/bits";
import type {
  ReVerificationRequest,
  ReVerificationStatus,
  ReVerificationType,
} from "@/types/clm";

export default function ReVerificationHistoryPage() {
  const [rows, setRows] = useState<ReVerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReVerificationStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | ReVerificationType>("all");

  const reload = async () => {
    setLoading(true);
    const status =
      statusFilter === "all" ? COMPLETED_STATUSES : statusFilter;
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

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const columns: Column<ReVerificationRequest>[] = [
    {
      key: "requestNo",
      title: "Request",
      width: "150px",
      sortable: true,
      render: (row) => (
        <span className="font-mono tabular-nums text-xs text-slate-600">
          {row.requestNo}
        </span>
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
      width: "140px",
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
      title: "Outcome",
      width: "110px",
      sortable: true,
      render: (row) => <StatusPill status={row.status} />,
    },
    {
      key: "resolvedAt",
      title: "Resolved",
      width: "130px",
      sortable: true,
      render: (row) => (
        <span className="text-xs font-mono tabular-nums text-slate-600">
          {fmtRel(row.resolvedAt ?? row.submittedAt ?? row.createdAt)}
        </span>
      ),
    },
    {
      key: "createdBy",
      title: "Created by",
      width: "140px",
      defaultHidden: true,
      render: (row) => (
        <span className="text-xs text-slate-500">{row.createdByName}</span>
      ),
    },
  ];

  const rowActions: RowAction<ReVerificationRequest>[] = [
    {
      label: "View linked case",
      onClick: (row) => {
        if (row.caseId) window.location.href = `/crm/clm/cases/${row.caseId}`;
      },
      disabled: (row) => !row.caseId,
    },
  ];

  const STATUS_CHIPS: { key: "all" | ReVerificationStatus; label: string }[] = [
    { key: "all",       label: "All" },
    { key: "approved",  label: STATUS_META.approved.label },
    { key: "rejected",  label: STATUS_META.rejected.label },
    { key: "expired",   label: STATUS_META.expired.label },
    { key: "cancelled", label: STATUS_META.cancelled.label },
  ];

  return (
    <div className="space-y-3">
      <Breadcrumb
        items={[
          { label: "CLM Center" },
          { label: "Re-Verification", href: "/crm/clm/re-verification/requests" },
          { label: "History" },
        ]}
      />
      <PageHeader title="Re-Verification History" />

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
                  ? "bg-slate-900 text-white border-slate-900"
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
        <Link
          href="/crm/clm/re-verification/requests"
          className="text-xs text-blue-600 hover:underline"
        >
          ← Back to active requests
        </Link>
      </div>

      <Card padding="none">
        <EnhancedDataTable<ReVerificationRequest>
          tableId="re-verification-history"
          columns={columns}
          data={rows}
          keyExtractor={(row) => row.id}
          rowActions={rowActions}
          loading={loading}
          emptyText={loading ? "" : "No completed re-verifications match this filter"}
          pagination={false}
        />
      </Card>
    </div>
  );
}
