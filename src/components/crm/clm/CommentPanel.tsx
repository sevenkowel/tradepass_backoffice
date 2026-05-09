"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Send, AtSign, Paperclip, Smile, MessageSquare } from "lucide-react";
import type { CaseComment } from "@/types/clm";

interface CommentPanelProps {
  comments: CaseComment[];
  onAddComment: (content: string) => void;
  className?: string;
}

export function CommentPanel({ comments, onAddComment, className }: CommentPanelProps) {
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
    <div className={cn("space-y-4", className)}>
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Notes & Comments</h3>

      {/* Comment List */}
      <div className="space-y-3">
        {comments.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No comments yet. Start the conversation.</p>
          </div>
        )}

        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
              {comment.authorName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-900">{comment.authorName}</span>
                <span className="text-[10px] text-gray-400">{comment.authorRole}</span>
                <span className="text-[10px] text-gray-300 ml-auto">
                  {new Date(comment.createdAt).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
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
      </div>

      {/* Comment Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
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
            placeholder="Add a comment... (Enter to send, Shift+Enter to new line)"
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300"
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <button className="p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors" title="Attach file">
              <Paperclip className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors" title="Mention someone">
              <AtSign className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors" title="Emoji">
              <Smile className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!newComment.trim()}
          className="self-end px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </div>
  );
}
