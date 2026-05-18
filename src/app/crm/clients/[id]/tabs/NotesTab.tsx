"use client";

import { useState } from "react";
import { MessageSquare, Pin, AtSign, Send, Filter } from "lucide-react";
import type { ClientNote } from "@/types/backoffice/user";
import type { BaseTabProps } from "@/types/backoffice/client";
import { useT } from "@/lib/i18n/LocaleProvider";
import { clientService } from "@/lib/crm/services/client.service";

export default function NotesTab({ data }: BaseTabProps) {
  const { t, locale } = useT();
  const { notes: initialNotes } = data;
  const [notes, setNotes] = useState<ClientNote[]>(initialNotes);
  const [newNote, setNewNote] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const filtered = filterType === "all" ? notes : notes.filter((n) => n.noteType === filterType);
  const pinned = filtered.filter((n) => n.isPinned);
  const unpinned = filtered.filter((n) => !n.isPinned);

  const dateLocale = locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : locale === "es" ? "es-ES" : "en-US";

  const addNote = async () => {
    if (!newNote.trim()) return;
    setPosting(true);
    setError("");
    try {
      const note = await clientService.addNote(data.user.id, newNote.trim(), "");
      setNotes((prev) => [note, ...prev]);
      setNewNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{t("clients.detail.notes.title")}</h3>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700 focus:outline-none"
          >
            <option value="all">{t("clients.detail.notes.filterAll")}</option>
            <option value="general">{t("clients.detail.notes.type.general")}</option>
            <option value="risk">{t("clients.detail.notes.type.risk")}</option>
            <option value="sales">{t("clients.detail.notes.type.sales")}</option>
            <option value="followup">{t("clients.detail.notes.type.followup")}</option>
          </select>
        </div>
      </div>

      {/* Composer */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={t("clients.detail.notes.composerPlaceholder")}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-400">{t("clients.detail.notes.mentionHint")}</span>
              <button
                onClick={addNote}
                disabled={posting || !newNote.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                {t("clients.detail.notes.publish")}
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          </div>
        </div>
      </div>

      {pinned.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Pin className="w-3 h-3" />
            {t("clients.detail.notes.pinned")}
          </h4>
          {pinned.map((note) => (
            <NoteCard key={note.id} note={note} dateLocale={dateLocale} />
          ))}
        </div>
      )}

      <div className="space-y-2">
        {unpinned.length > 0 && (
          <h4 className="text-xs font-medium text-slate-500">{t("clients.detail.notes.allNotes")}</h4>
        )}
        {unpinned.map((note) => (
          <NoteCard key={note.id} note={note} dateLocale={dateLocale} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-slate-400 text-sm">
          {t("clients.detail.notes.empty")}
        </div>
      )}
    </div>
  );
}

function NoteCard({ note, dateLocale }: { note: ClientNote; dateLocale: string }) {
  const { t } = useT();
  const typeColors: Record<string, { bg: string; text: string }> = {
    general: { bg: "bg-slate-100", text: "text-slate-600" },
    risk: { bg: "bg-red-100", text: "text-red-600" },
    sales: { bg: "bg-blue-100", text: "text-blue-600" },
    followup: { bg: "bg-amber-100", text: "text-amber-600" },
  };
  const noteType = note.noteType ?? "general";
  const tc = typeColors[noteType] || typeColors.general;
  const typeLabel = t(`clients.detail.notes.type.${noteType}`);
  const displayName = note.authorName ?? note.author;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {displayName.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-900">{displayName}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${tc.bg} ${tc.text}`}>
              {typeLabel}
            </span>
            {note.isPinned && <Pin className="w-3 h-3 text-amber-500" />}
          </div>
          <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{note.content}</p>
          {note.mentions.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <AtSign className="w-3 h-3 text-blue-500" />
              {note.mentions.map((m) => (
                <span key={m} className="text-xs text-blue-600">
                  @{m}
                </span>
              ))}
            </div>
          )}
          <span className="text-xs text-slate-400 mt-1 block">
            {new Date(note.createdAt).toLocaleString(dateLocale)}
          </span>
        </div>
      </div>
    </div>
  );
}
