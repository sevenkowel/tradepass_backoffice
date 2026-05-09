"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { PageHeader } from "@/components/crm/ui";
import { useT } from "@/lib/i18n/LocaleProvider";
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

function RelationshipsPageInner() {
  const { t } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const clientId = params.get("clientId") || undefined;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [centerLabel, setCenterLabel] = useState("");

  // Resolve a label for the active center client.
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
    router.replace(`/crm/clients/relationships${next.toString() ? `?${next.toString()}` : ""}`);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[{ label: t("clients.crumb.root") }, { label: t("clients.crumb.relationships") }]}
      />

      <PageHeader
        title={t("clients.relationships.title")}
        description={t("clients.relationships.subtitle")}
      />

      {/* Center picker bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 flex-wrap">
        <span className="text-sm text-slate-500">{t("clients.relationships.center")}</span>
        {clientId ? (
          <>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
              {centerLabel || clientId}
            </span>
            <button
              onClick={() => setClientId(undefined)}
              className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
            >
              <X className="w-3 h-3" /> {t("clients.relationships.clear")}
            </button>
            <button
              onClick={() => setPickerOpen(true)}
              className="ml-auto text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              <Search className="w-4 h-4" /> {t("clients.relationships.changeCenter")}
            </button>
          </>
        ) : (
          <button
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <Search className="w-4 h-4" />
            {t("clients.relationships.pickAction")}
          </button>
        )}
      </div>

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
  const { t } = useT();
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
            placeholder={t("clients.filter.search")}
            className="flex-1 text-sm focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="p-6 text-center text-sm text-slate-400">
              {t("clients.relationships.loading")}
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-400">{t("clients.empty")}</div>
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

export default function RelationshipsPage() {
  return (
    <Suspense fallback={<div className="h-[700px]" />}>
      <RelationshipsPageInner />
    </Suspense>
  );
}
