"use client";

import { useState } from "react";
import { MessageSquare, Pin, AtSign, Send, Filter } from "lucide-react";
import type { ClientDetailData, ClientNote } from "@/types/backoffice/client-detail";

interface Props {
  data: ClientDetailData;
}

export default function NotesTab({ data }: Props) {
  const { notes: initialNotes } = data;
  const [notes, setNotes] = useState<ClientNote[]>(initialNotes);
  const [newNote, setNewNote] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = filterType === "all" ? notes : notes.filter((n) => n.noteType === filterType);
  const pinned = filtered.filter((n) => n.isPinned);
  const unpinned = filtered.filter((n) => !n.isPinned);

  const addNote = () => {
    if (!newNote.trim()) return;
    const note: ClientNote = {
      id: `note-${Date.now()}`,
      clientId: data.user.id,
      content: newNote,
      author: "current-staff",
      authorName: "当前用户",
      mentions: [],
      isPinned: false,
      noteType: "general",
      createdAt: new Date().toISOString(),
    };
    setNotes([note, ...notes]);
    setNewNote("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">内部笔记</h3>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700 focus:outline-none"
          >
            <option value="all">全部</option>
            <option value="general">一般</option>
            <option value="risk">风险</option>
            <option value="sales">销售</option>
            <option value="followup">跟进</option>
          </select>
        </div>
      </div>

      {/* 添加笔记 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="添加内部笔记... 使用 @ 提及同事"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-400">支持 @提及</span>
              <button
                onClick={addNote}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                发布
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 置顶笔记 */}
      {pinned.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Pin className="w-3 h-3" />
            置顶
          </h4>
          {pinned.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}

      {/* 普通笔记 */}
      <div className="space-y-2">
        {unpinned.length > 0 && <h4 className="text-xs font-medium text-slate-500">全部笔记</h4>}
        {unpinned.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-slate-400 text-sm">暂无笔记</div>
      )}
    </div>
  );
}

function NoteCard({ note }: { note: ClientNote }) {
  const typeColors: Record<string, { bg: string; text: string; label: string }> = {
    general: { bg: "bg-slate-100", text: "text-slate-600", label: "一般" },
    risk: { bg: "bg-red-100", text: "text-red-600", label: "风险" },
    sales: { bg: "bg-blue-100", text: "text-blue-600", label: "销售" },
    followup: { bg: "bg-amber-100", text: "text-amber-600", label: "跟进" },
  };

  const tc = typeColors[note.noteType] || typeColors.general;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {note.authorName.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-900">{note.authorName}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${tc.bg} ${tc.text}`}>{tc.label}</span>
            {note.isPinned && <Pin className="w-3 h-3 text-amber-500" />}
          </div>
          <p className="text-sm text-slate-700 mt-1">{note.content}</p>
          {note.mentions.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <AtSign className="w-3 h-3 text-blue-500" />
              {note.mentions.map((m) => (
                <span key={m} className="text-xs text-blue-600">@{m}</span>
              ))}
            </div>
          )}
          <span className="text-xs text-slate-400 mt-1 block">{new Date(note.createdAt).toLocaleString("zh-CN")}</span>
        </div>
      </div>
    </div>
  );
}
