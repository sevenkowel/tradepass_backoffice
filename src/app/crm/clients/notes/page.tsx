"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Pin, AtSign, Plus, Loader2 } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { useT } from "@/lib/i18n/LocaleProvider";

interface GlobalNote {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  content: string;
  author: string;
  authorName: string;
  mentions: string[];
  isPinned: boolean;
  noteType: string;
  createdAt: string;
}

const NOTE_TYPE_COLORS: Record<string, string> = {
  general: "bg-slate-100 text-slate-700",
  risk: "bg-red-100 text-red-700",
  sales: "bg-emerald-100 text-emerald-700",
  followup: "bg-amber-100 text-amber-700",
};

export default function NotesPage() {
  const { t } = useT();
  const [notes, setNotes] = useState<GlobalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "pinned" | "general" | "risk" | "sales" | "followup">("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ limit: "200" });
    if (filter === "pinned") params.set("isPinned", "true");
    else if (filter !== "all") params.set("noteType", filter);

    fetch(`/api/crm/notes?${params.toString()}`, { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.success) setNotes(d.items);
        else setError(d.error || "Failed to load");
      })
      .catch((e) => !cancelled && setError(e.message || String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filter]);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: t("clients.crumb.root") }, { label: t("clients.crumb.notes") }]} />

      <PageHeader
        title={t("clients.notesPage.title")}
        description={t("clients.notesPage.subtitle")}
        actions={
          <Button>
            <Plus className="w-4 h-4" />
            {t("clients.notesPage.add")}
          </Button>
        }
      />

      <div className="flex gap-2 flex-wrap">
        {(
          [
            ["all", "clients.notesPage.filterAll"],
            ["pinned", "clients.notesPage.filterPinned"],
            ["general", "clients.notesPage.filterGeneral"],
            ["risk", "clients.notesPage.filterRisk"],
            ["sales", "clients.notesPage.filterSales"],
            ["followup", "clients.notesPage.filterFollowup"],
          ] as const
        ).map(([f, key]) => (
          <button
            key={f}
            onClick={() => setFilter(f as typeof filter)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              filter === f
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {t(key)}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          Error: {error}
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading…
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No notes yet</p>
          </div>
        ) : (
          notes.map((note) => (
            <Card key={note.id} className={`!p-4 ${note.isPinned ? "border-amber-300" : ""}`}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
                  {note.authorName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-slate-900">{note.authorName}</span>
                    <span className="text-xs text-slate-400">{new Date(note.createdAt).toLocaleString()}</span>
                    {note.isPinned && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px]">
                        <Pin className="w-3 h-3" />
                        Pinned
                      </span>
                    )}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        NOTE_TYPE_COLORS[note.noteType] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {note.noteType}
                    </span>
                    <Link
                      href={`/crm/clients/${note.clientId}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      → {note.clientName} ({note.clientEmail})
                    </Link>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
                  {note.mentions.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 flex-wrap">
                      <AtSign className="w-3 h-3 text-slate-400" />
                      {note.mentions.map((m) => (
                        <span key={m} className="text-xs text-blue-600">
                          @{m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
