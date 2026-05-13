"use client";

/**
 * Audit Trail — the single, cross-domain audit timeline.
 *
 * Reads `GlobalAuditLog` only (via `globalAuditService`). Filterable by
 * domain (clients / clm / risk / compliance / funds / trading / staff /
 * system) and severity. Replaces the legacy CLM-only view.
 */

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ScrollText,
  Shield,
  ShieldCheck,
  User,
  FileText,
  Settings,
  AlertTriangle,
  Banknote,
  TrendingUp,
  Activity,
  Layers,
  Server,
} from "lucide-react";
import { Card, PageHeader, EnhancedDataTable, type Column } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { globalAuditService } from "@/lib/audit";
import type {
  AuditDomain,
  AuditSeverity,
  GlobalAuditLog,
} from "@/types/core";

const DOMAIN_META: Record<
  AuditDomain,
  { label: string; icon: typeof FileText; tone: string }
> = {
  clients: { label: "Clients", icon: User, tone: "text-violet-600 bg-violet-50" },
  clm: { label: "CLM", icon: ScrollText, tone: "text-blue-600 bg-blue-50" },
  risk: { label: "Risk", icon: Activity, tone: "text-orange-600 bg-orange-50" },
  compliance: { label: "Compliance", icon: ShieldCheck, tone: "text-emerald-600 bg-emerald-50" },
  funds: { label: "Funds", icon: Banknote, tone: "text-emerald-700 bg-emerald-50" },
  trading: { label: "Trading", icon: TrendingUp, tone: "text-amber-700 bg-amber-50" },
  staff: { label: "Staff", icon: Layers, tone: "text-slate-700 bg-slate-100" },
  system: { label: "System", icon: Server, tone: "text-slate-500 bg-slate-100" },
};

const SEVERITY_META: Record<
  AuditSeverity,
  { label: string; dot: string; text: string }
> = {
  info: { label: "Info", dot: "bg-blue-500", text: "text-blue-700" },
  warning: { label: "Warning", dot: "bg-amber-500", text: "text-amber-700" },
  critical: { label: "Critical", dot: "bg-red-500", text: "text-red-700" },
};

type DomainFilter = AuditDomain | "all";
type SeverityFilter = AuditSeverity | "all";

function AuditTrailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientIdParam = searchParams.get("clientId") || undefined;

  const [logs, setLogs] = useState<GlobalAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [domain, setDomain] = useState<DomainFilter>("all");
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await globalAuditService.list({
        page,
        pageSize,
        domain: domain === "all" ? undefined : domain,
        severity: severity === "all" ? undefined : severity,
        search: search.trim() || undefined,
        clientId: clientIdParam,
      });
      setLogs(result.items);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [page, domain, severity, search, clientIdParam]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Domain-bucket counts for the filter chip strip — pulled with one wide
  // call so the chips reflect totals, not the filtered view.
  const [bucketCounts, setBucketCounts] = useState<Record<DomainFilter, number>>(() => ({
    all: 0,
    clients: 0,
    clm: 0,
    risk: 0,
    compliance: 0,
    funds: 0,
    trading: 0,
    staff: 0,
    system: 0,
  }));
  useEffect(() => {
    let cancelled = false;
    globalAuditService.list({ pageSize: 1000 }).then((res) => {
      if (cancelled) return;
      const next: Record<DomainFilter, number> = {
        all: res.total,
        clients: 0, clm: 0, risk: 0, compliance: 0,
        funds: 0, trading: 0, staff: 0, system: 0,
      };
      for (const log of res.items) next[log.domain] += 1;
      setBucketCounts(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns: Column<GlobalAuditLog>[] = useMemo(
    () => [
      {
        key: "auditId",
        title: "ID",
        width: "140px",
        sortable: true,
        render: (row) => {
          // Prefer the human-readable `auditId` (e.g. AUD-260512-000A).
          // Fall back to a short prefix of the raw UUID so the column
          // doesn't blow out its width when a producer omits auditId.
          const display = row.auditId ?? (row.id.length > 12 ? `${row.id.slice(0, 8)}…` : row.id);
          return (
            <span
              className="font-mono text-xs text-slate-500 truncate inline-block max-w-full"
              title={row.auditId ?? row.id}
            >
              {display}
            </span>
          );
        },
      },
      {
        key: "severity",
        title: "Severity",
        width: "110px",
        sortable: true,
        render: (row) => {
          const m = SEVERITY_META[row.severity];
          return (
            <span className={`inline-flex items-center gap-1.5 text-xs ${m.text}`}>
              <span className={`w-2 h-2 rounded-full ${m.dot}`} />
              {m.label}
            </span>
          );
        },
      },
      {
        key: "domain",
        title: "Domain",
        width: "130px",
        sortable: true,
        render: (row) => {
          const meta = DOMAIN_META[row.domain];
          const Icon = meta.icon;
          return (
            <span className="inline-flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-md inline-flex items-center justify-center ${meta.tone}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs text-slate-700">{meta.label}</span>
            </span>
          );
        },
      },
      {
        key: "actionLabel",
        title: "Action",
        sortable: true,
        render: (row) => (
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900">{row.actionLabel}</p>
            {row.description && (
              <p className="text-xs text-slate-500 truncate max-w-md">{row.description}</p>
            )}
          </div>
        ),
      },
      {
        key: "actor",
        title: "Actor",
        width: "150px",
        sortable: true,
        sortField: "actor.name" as never,
        render: (row) => (
          <div className="min-w-0">
            <p className="text-sm text-slate-900 truncate">{row.actor.name}</p>
            {row.actor.role && (
              <p className="text-[11px] text-slate-500 truncate">{row.actor.role}</p>
            )}
          </div>
        ),
      },
      {
        key: "target",
        title: "Target",
        width: "180px",
        defaultHidden: false,
        render: (row) => (
          <div className="min-w-0">
            <p className="text-xs text-slate-500 capitalize">{row.target.kind.replace(/_/g, " ")}</p>
            <p className="text-sm text-slate-900 truncate font-mono">
              {row.target.name ?? row.target.id}
            </p>
          </div>
        ),
      },
      {
        key: "changes",
        title: "Changes",
        defaultHidden: true,
        render: (row) => {
          if (row.changes.length === 0) {
            return <span className="text-xs text-slate-300">—</span>;
          }
          return (
            <div className="space-y-0.5">
              {row.changes.slice(0, 3).map((c, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">{c.label ?? c.field}:</span>
                  {c.oldValue !== undefined && (
                    <span className="text-red-600 line-through font-mono">
                      {String(c.oldValue)}
                    </span>
                  )}
                  {c.oldValue !== undefined && c.newValue !== undefined && (
                    <span className="text-slate-300">→</span>
                  )}
                  {c.newValue !== undefined && (
                    <span className="text-emerald-600 font-mono">{String(c.newValue)}</span>
                  )}
                </div>
              ))}
              {row.changes.length > 3 && (
                <span className="text-xs text-slate-400">+{row.changes.length - 3} more</span>
              )}
            </div>
          );
        },
      },
      {
        key: "reason",
        title: "Reason",
        width: "180px",
        defaultHidden: true,
        render: (row) => (
          <span className="text-xs text-slate-600">{row.reason ?? "—"}</span>
        ),
      },
      {
        key: "ipAddress",
        title: "IP",
        width: "130px",
        defaultHidden: true,
        render: (row) => (
          <span className="text-xs font-mono text-slate-500">{row.ipAddress ?? "—"}</span>
        ),
      },
      {
        key: "createdAt",
        title: "Time",
        width: "150px",
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {new Date(row.createdAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        ),
      },
    ],
    []
  );

  const domainEntries = useMemo<DomainFilter[]>(
    () => ["all", "clients", "clm", "risk", "compliance", "funds", "trading", "staff", "system"],
    []
  );

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "CLM Center" }, { label: "Audit Trail" }]} />
      <PageHeader title="Audit Trail" />

      {/* Read-only notice + critical-count signal */}
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
        <Shield className="w-4 h-4 text-blue-600 shrink-0" />
        <p className="text-xs text-blue-700">
          Audit logs are immutable. Every action across Clients · CLM · Risk · Compliance · Funds · Trading · Staff is recorded automatically.
        </p>
      </div>

      {/* Active client filter banner — visible when navigated from a client page */}
      {clientIdParam && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-violet-50 border border-violet-200 rounded-lg">
          <p className="text-xs text-violet-700">
            Filtered to client{" "}
            <span className="font-mono font-semibold">{clientIdParam}</span>
          </p>
          <button
            onClick={() => router.replace("/crm/clm/audit-trail")}
            className="text-[11px] text-violet-700 hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Domain chips — primary discriminator. Counts are the all-time pool. */}
      <div className="flex flex-wrap gap-1.5">
        {domainEntries.map((d) => {
          const meta = d === "all" ? null : DOMAIN_META[d];
          const Icon = meta?.icon ?? Settings;
          const count = bucketCounts[d] ?? 0;
          const isActive = domain === d;
          return (
            <button
              key={d}
              onClick={() => {
                setDomain(d);
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                isActive
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {d !== "all" && <Icon className="w-3.5 h-3.5" />}
              {d === "all" ? "All Domains" : meta!.label}
              <span
                className={`text-[10px] font-mono tabular-nums ${
                  isActive ? "text-white/80" : "text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Severity + search */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          {(["all", "info", "warning", "critical"] as const).map((s) => {
            const isActive = severity === s;
            return (
              <button
                key={s}
                onClick={() => {
                  setSeverity(s);
                  setPage(1);
                }}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {s === "all" ? "All Severity" : SEVERITY_META[s].label}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search action / actor / target / reason…"
          className="flex-1 min-w-[260px] h-8 px-3 rounded-md border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <Card padding="none">
        <EnhancedDataTable<GlobalAuditLog>
          tableId="audit-trail"
          columns={columns}
          data={logs}
          keyExtractor={(row) => row.id}
          emptyText={loading ? "" : "No audit logs found"}
          loading={loading}
          pagination={false}
        />
      </Card>

      {total > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Total <span className="font-mono tabular-nums text-slate-700">{total}</span> records · Page{" "}
            <span className="font-mono tabular-nums text-slate-700">{page}</span> /{" "}
            <span className="font-mono tabular-nums text-slate-700">{totalPages}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Severity legend (subtle) */}
      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
        <AlertTriangle className="w-3 h-3" />
        Critical actions (blacklist, freeze, AML hit) are permanent — restoring requires elevated approval.
      </div>
    </div>
  );
}

export default function AuditTrailPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-400">Loading…</div>}>
      <AuditTrailInner />
    </Suspense>
  );
}
