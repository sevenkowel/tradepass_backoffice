"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Pin, AtSign, Plus } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { clientService } from "@/lib/crm/services/client.service";
import type { ClientNote } from "@/types/backoffice/user";

export default function NotesPage() {
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    // Load all notes across all clients
    const allNotes: ClientNote[] = [];
    for (const clientId of ["user-001", "user-003"]) {
      const clientNotes = await clientService.getNotes(clientId);
      allNotes.push(...clientNotes);
    }
    setNotes(allNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Clients" }, { label: "Notes" }]} />

      <PageHeader
        title="Client Notes"
        description="Internal notes and collaboration across all clients"
        actions={
          <Button>
            <Plus className="w-4 h-4" />
            Add Note
          </Button>
        }
      />

      <div className="space-y-4">
        {notes.map((note) => (
          <Card key={note.id} className={`!p-4 ${note.isPinned ? "border-amber-300" : ""}`}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
                {note.author.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-900">{note.author}</span>
                  <span className="text-xs text-slate-400">{new Date(note.createdAt).toLocaleString()}</span>
                  {note.isPinned && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px]">
                      <Pin className="w-3 h-3" />
                      Pinned
                    </span>
                  )}
                  <span className="text-xs text-blue-600">Client: {note.clientId}</span>
                </div>
                <p className="text-sm text-slate-700">{note.content}</p>
                {note.mentions.length > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    <AtSign className="w-3 h-3 text-slate-400" />
                    {note.mentions.map((m) => (
                      <span key={m} className="text-xs text-blue-600">@{m}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {notes.length === 0 && !loading && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No notes yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
