"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Send, MessageSquare } from "lucide-react";
import type { CaseComment } from "@/types/clm";

interface CommentPanelProps {
  comments: CaseComment[];
  onAddComment: (content: string) => void;
  className?: string;
  /** When true, only renders the input box (history shown by parent e.g. timeline). */
  hideHistory?: boolean;
}

export function CommentPanel({ comments, onAddComment, className, hideHistory = false }: CommentPanelProps) {
  const [newComment, setNewComment] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = newComment.trim();
    if (!trimmed) return;
    onAddComment(trimmed);
    setNewComment("");
    inputRef.current?.focus();
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Title is owned by the parent Collapsible — see case detail page.
          Adding one here was duplicating the section header. */}

      {/* Comment List */}
      {!hideHistory && <div className="space-y-3">
        {comments.length === 0 && (
          <div className="text-center py-8 bg-slate-50 rounded-xl">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No comments yet. Start the conversation.</p>
          </div>
        )}

        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-[10px] font-semibold flex-shrink-0">
              {comment.authorName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-900">{comment.authorName}</span>
                <span className="text-[10px] text-slate-400">{comment.authorRole}</span>
                <span className="text-[10px] text-slate-300 ml-auto">
                  {new Date(comment.createdAt).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{comment.content}</p>
              {comment.mentions.length > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {comment.mentions.map((m) => (
                    <span key={m} className="text-[11px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                      @{m}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>}

      {/* Comment Input */}
      <div className="rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-400 transition-all bg-white">
        <textarea
          ref={inputRef}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Add a note…"
          rows={2}
          className="w-full px-3 py-2 bg-transparent text-sm resize-none focus:outline-none placeholder:text-slate-400 no-scrollbar"
        />
        <div className="flex items-center justify-between px-2 pb-1.5">
          <span className="text-[10px] text-slate-300 pl-1">
            <kbd className="font-mono">Enter</kbd> to send · <kbd className="font-mono">Shift+Enter</kbd> for new line
          </span>
          <button
            onClick={handleSubmit}
            disabled={!newComment.trim()}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-3 h-3" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
