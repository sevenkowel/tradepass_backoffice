"use client";

/**
 * Risk Center → Relationship Graph.
 *
 * Reuses the same `RelationshipGraph` component the Clients module does,
 * so the cross-domain "this account is connected to those" view is
 * literally one shape rendered in two places. Difference here: the page
 * surfaces a high-risk shortlist, since operators landing here usually
 * want to start from someone already flagged.
 */

import { Suspense, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, ShieldAlert } from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { PageHeader, Card } from "@/components/crm/ui";
import { clientService } from "@/lib/crm/services/client.service";
import type { BackofficeUser } from "@/types/backoffice/user";

const RelationshipGraph = dynamic(
  () => import("@/components/crm/relationships/RelationshipGraph"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[700px] flex items-center justify-center text-slate-400">
        Loading graph…
      </div>
    ),
  }
);

function RiskGraphInner() {
  const router = useRouter();
  const params = useSearchParams();
  const clientId = params.get("clientId") || undefined;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [centerLabel, setCenterLabel] = useState("");
  const [highRiskList, setHighRiskList] = useState<BackofficeUser[]>([]);

  // Pull a high-risk shortlist for the empty state — the API supports
  // filtering by a single riskLevel, so we run two requests and merge.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      clientService.list({ pageSize: 6, page: 1, riskLevel: "critical" }),
      clientService.list({ pageSize: 6, page: 1, riskLevel: "high" }),
    ])
      .then(([crit, high]) => {
        if (cancelled) return;
        const merged = [...crit.items, ...high.items];
        // Dedupe by id and trim to 9 cards.
        const seen = new Set<string>();
        const unique = merged.filter((u) =>
          seen.has(u.id) ? false : (seen.add(u.id), true)
        );
        setHighRiskList(unique.slice(0, 9));
      })
      .catch(() => !cancelled && setHighRiskList([]));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!clientId) {
      setCenterLabel("");
      return;
    }
    let cancelled = false;
    clientService
      .getById(clientId)
      .then((u) => !cancelled && setCenterLabel(u ? `${u.name} (${u.uid})` : clientId))
      .catch(() => !cancelled && setCenterLabel(clientId));
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const setClientId = (id: string | undefined) => {
    const next = new URLSearchParams(params.toString());
    if (id) next.set("clientId", id);
    else next.delete("clientId");
    router.replace(`/crm/risk/graph${next.toString() ? `?${next.toString()}` : ""}`);
  };

  const showShortlist = useMemo(
    () => !clientId && highRiskList.length > 0,
    [clientId, highRiskList]
  );

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "Risk Center" }, { label: "Relationship Graph" }]} />
      <PageHeader title="Relationship Graph" />

      {/* Center picker bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3 flex-wrap">
        <span className="text-sm text-slate-500">Center:</span>
        {clientId ? (
          <>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-sm font-medium">
              {centerLabel || clientId}
            </span>
            <button
              onClick={() => setClientId(undefined)}
              className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
            <button
              onClick={() => setPickerOpen(true)}
              className="ml-auto text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              <Search className="w-4 h-4" /> Change center
            </button>
          </>
        ) : (
          <button
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-md text-sm hover:bg-blue-700"
          >
            <Search className="w-4 h-4" />
            Pick a client
          </button>
        )}
      </div>

      {/* High-risk shortlist — only shown until a center is chosen. */}
      {showShortlist && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-semibold text-slate-700">High-risk shortlist</h3>
            <span className="text-xs text-slate-400">
              · click any row to root the graph there
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {highRiskList.map((u) => (
              <button
                key={u.id}
                onClick={() => setClientId(u.id)}
                className="text-left p-2.5 rounded-md border border-slate-200 hover:border-primary hover:bg-blue-50/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      u.riskLevel === "critical" ? "bg-red-500" : "bg-orange-500"
                    }`}
                  />
                  <span className="text-sm font-medium text-slate-900 truncate">{u.name}</span>
                  <span className="text-[10px] font-mono text-slate-400 ml-auto">{u.uid}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{u.email}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {u.country ?? "—"} · risk {u.riskScore ?? "—"} · KYC {u.kycStatus}
                </p>
              </button>
            ))}
          </div>
        </Card>
      )}

      <RelationshipGraph clientId={clientId} onPickClient={() => setPickerOpen(true)} />

      {pickerOpen && (
        <CenterPicker
          onPick={(id) => {
            setClientId(id);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

interface CenterPickerProps {
  onPick: (id: string) => void;
  onClose: () => void;
}

function CenterPicker({ onPick, onClose }: CenterPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BackofficeUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(() => {
      clientService
        .list({ search: query || undefined, page: 1, pageSize: 20 })
        .then((res) => !cancelled && setResults(res.items))
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setLoading(false));
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or UID…"
            className="flex-1 text-sm focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="p-6 text-center text-sm text-slate-400">Searching…</div>
          )}
          {!loading && results.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-400">No matches</div>
          )}
          {results.map((u) => (
            <button
              key={u.id}
              onClick={() => onPick(u.id)}
              className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 text-left border-b border-slate-50"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                {u.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{u.name}</p>
                <p className="text-xs text-slate-500 truncate">{u.email}</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{u.uid}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RiskGraphPage() {
  return (
    <Suspense fallback={<div className="h-[700px]" />}>
      <RiskGraphInner />
    </Suspense>
  );
}
