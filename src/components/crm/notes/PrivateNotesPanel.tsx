"use client";

/**
 * PrivateNotesPanel — 通用「私密备注」组件（2026-05-17 抽出，原生于
 * Case Detail preview/a，现下沉到 components 让所有审批详情页 / 客户
 * 详情 / 任何需要"运营私密备注"的场景都能复用）.
 *
 * 设计要点：
 *   - 私密语义：amber 配色统一，标题区强调"不出现在 Timeline / 不共享给客户"
 *   - 支持文本 + 多附件（图片显示真实缩略图、其他类型显示对应图标）
 *   - 持久化解耦：组件本身不带 service 调用，notes 和 onAdd/onRemove 由
 *     调用方传入。预览/演示场景可用 useState，正式接入时改 service 调用。
 *   - 附件用 URL.createObjectURL 做本地预览；删除 Note 时调用方应该
 *     URL.revokeObjectURL 释放（推荐用本文件导出的 `revokeNoteAttachments`）。
 *
 * 调用示例：
 * ```tsx
 * const [notes, setNotes] = useState<PrivateNote[]>([]);
 * const addNote = (content, attachments) => setNotes((p) => [makeNote(...)]);
 * const removeNote = (id) => setNotes((p) => {
 *   const removed = p.find(n => n.id === id);
 *   revokeNoteAttachments(removed?.attachments);
 *   return p.filter(n => n.id !== id);
 * });
 *
 * <PrivateNotesPanel
 *   notes={notes}
 *   canEdit={canOperate}
 *   onAdd={addNote}
 *   onRemove={removeNote}
 *   author={{ name: "Alice", role: "Reviewer" }}
 * />
 * ```
 */

import { useRef, useState } from "react";
import {
  StickyNote, Send, Trash2, Paperclip, X, Download,
  Image as ImageIcon, FileType, FileSpreadsheet, FileCode, FileText,
} from "lucide-react";
import { MentionTextarea } from "./MentionTextarea";

/* ─────────────────────────────────────────────────────────────────────────── */
/* Types                                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

export interface NoteAttachment {
  id: string;
  name: string;
  /** 字节数，用于显示 1.2 MB / 234 KB 这种文案。 */
  size: number;
  /** MIME type — "image/png" / "application/pdf" / ... 没有则空串。 */
  type: string;
  /** 本地 object URL（URL.createObjectURL）或 CDN URL。 */
  url: string;
}

export interface PrivateNote {
  id: string;
  /** 作者姓名 — 显示在卡片顶部。 */
  author: string;
  /** 作者角色 — 可选，副标显示。 */
  authorRole?: string;
  /** 正文 — 支持多行；空字符串视为只有附件的 Note。 */
  content: string;
  /** 附件列表 — 没有时传空数组。 */
  attachments: NoteAttachment[];
  /** ISO 字符串。 */
  createdAt: string;
}

interface PrivateNotesPanelProps {
  notes: PrivateNote[];
  /** 是否允许新增 / 删除。false 时只读展示。 */
  canEdit: boolean;
  /** 调用方负责生成 id / 入库；组件只把 content + attachments 传出来。 */
  onAdd: (content: string, attachments: NoteAttachment[]) => void;
  /** 调用方负责 revoke object URL + 入库删除。 */
  onRemove: (id: string) => void;
  /** 当前操作者信息 — 仅展示用，组件不依赖。 */
  author?: { name: string; role?: string };
  /** 卡片标题。默认「Private Notes」。 */
  title?: string;
  /** 卡片副标。默认「私密 · 不出现在 Timeline 上 · 仅运营内部可见」。 */
  subtitle?: string;
  /** 空状态文案。 */
  emptyHint?: string;
  /** 包装类名，用于外层背景 / 间距覆盖。 */
  className?: string;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Helper exports — 便于调用方组装                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * 工厂函数：根据用户输入构造一个新 Note。调用方拿来直接 setState。
 * 把 id / createdAt 的细节屏蔽掉。
 */
export function makePrivateNote(args: {
  author: string;
  authorRole?: string;
  content: string;
  attachments: NoteAttachment[];
}): PrivateNote {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    author: args.author,
    authorRole: args.authorRole,
    content: args.content,
    attachments: args.attachments,
    createdAt: new Date().toISOString(),
  };
}

/**
 * 释放一组 Note 附件的 object URL — 删除 Note 时调用，避免内存泄漏。
 * 远端 URL（http://）调用 revokeObjectURL 是 no-op，不需要判断。
 */
export function revokeNoteAttachments(attachments: NoteAttachment[] | undefined): void {
  if (!attachments) return;
  for (const a of attachments) {
    try { URL.revokeObjectURL(a.url); } catch { /* ignore */ }
  }
}

/**
 * 把 FileList 转成 NoteAttachment[] — 给调用方的 onChange 简化用。
 */
export function filesToAttachments(files: FileList | null): NoteAttachment[] {
  if (!files || files.length === 0) return [];
  const out: NoteAttachment[] = [];
  for (const f of Array.from(files)) {
    out.push({
      id: typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: f.name,
      size: f.size,
      type: f.type,
      url: URL.createObjectURL(f),
    });
  }
  return out;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Component                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

export function PrivateNotesPanel({
  notes,
  canEdit,
  onAdd,
  onRemove,
  author,
  title = "Private Notes",
  subtitle = "私密 · 不出现在 Timeline 上 · 仅运营内部可见",
  emptyHint = "Use this space to jot down review thoughts that shouldn't live on the timeline.",
  className,
}: PrivateNotesPanelProps) {
  const [draft, setDraft] = useState("");
  const [draftAttachments, setDraftAttachments] = useState<NoteAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFilesPicked = (files: FileList | null) => {
    const next = filesToAttachments(files);
    if (next.length === 0) return;
    setDraftAttachments((prev) => [...prev, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeDraftAttachment = (id: string) => {
    setDraftAttachments((prev) => {
      const dropped = prev.find((a) => a.id === id);
      if (dropped) try { URL.revokeObjectURL(dropped.url); } catch { /* ignore */ }
      return prev.filter((a) => a.id !== id);
    });
  };

  const save = () => {
    const text = draft.trim();
    if (!text && draftAttachments.length === 0) return;
    onAdd(text, draftAttachments);
    setDraft("");
    setDraftAttachments([]);
  };

  return (
    <section className={`bg-white rounded-xl border border-slate-200 shadow-sm p-4 ${className ?? ""}`}>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 inline-flex items-center gap-1.5">
            <StickyNote className="w-3.5 h-3.5 text-amber-500" />
            {title}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <span className="text-[11px] text-slate-400 tabular-nums">
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </span>
      </div>

      {/* Composer */}
      {canEdit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-3 mb-4">
          <MentionTextarea
            value={draft}
            onChange={setDraft}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                save();
              }
            }}
            rows={3}
            placeholder={
              author?.name
                ? `Write a private note as ${author.name}… (⌘/Ctrl + Enter · @ to mention)`
                : "Write a private note… (⌘/Ctrl + Enter · @ to mention)"
            }
            className="w-full px-3 py-2 bg-white border border-amber-200 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
          />

          {/* 已选附件 */}
          {draftAttachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {draftAttachments.map((a) => (
                <AttachmentChip
                  key={a.id}
                  attachment={a}
                  removable
                  onRemove={() => removeDraftAttachment(a.id)}
                />
              ))}
            </div>
          )}

          {/* 工具栏 */}
          <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => onFilesPicked(e.target.files)}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-2 h-7 rounded-md text-[11px] font-medium text-amber-700 border border-amber-200 hover:bg-amber-100/60 transition-colors"
                type="button"
              >
                <Paperclip className="w-3 h-3" />
                添加附件
              </button>
              <p className="text-[10px] text-amber-700/80 hidden sm:block">
                Won&apos;t be shared with the customer or in any audit trail.
              </p>
            </div>
            <button
              onClick={save}
              disabled={!draft.trim() && draftAttachments.length === 0}
              className="inline-flex items-center gap-1 px-3 h-7 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              type="button"
            >
              <Send className="w-3 h-3" />
              Save note
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {notes.length === 0 ? (
        <div className="py-10 text-center">
          <StickyNote className="w-8 h-8 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No private notes yet.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{emptyHint}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              onRemove={canEdit ? () => onRemove(n.id) : undefined}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Note card                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

function NoteCard({
  note, onRemove,
}: {
  note: PrivateNote;
  onRemove?: () => void;
}) {
  return (
    <li className="rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
            {note.author.charAt(0).toUpperCase()}
          </span>
          <span className="text-xs font-semibold text-slate-800 truncate">{note.author}</span>
          {note.authorRole && (
            <span className="text-[10px] text-slate-400 truncate">· {note.authorRole}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] text-slate-400 font-mono tabular-nums">
            {formatRelativeTime(note.createdAt)}
          </span>
          {onRemove && (
            <button
              onClick={onRemove}
              className="p-1 rounded-md text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete note"
              type="button"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      {note.content && (
        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
          {note.content}
        </p>
      )}
      {note.attachments.length > 0 && (
        <div className={`flex flex-wrap gap-1.5 ${note.content ? "mt-2" : ""}`}>
          {note.attachments.map((a) => (
            <AttachmentChip key={a.id} attachment={a} downloadable />
          ))}
        </div>
      )}
    </li>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Attachment chip                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

function AttachmentChip({
  attachment, removable, downloadable, onRemove,
}: {
  attachment: NoteAttachment;
  removable?: boolean;
  downloadable?: boolean;
  onRemove?: () => void;
}) {
  const sizeStr = formatBytes(attachment.size);
  const isImage = attachment.type.startsWith("image/");

  return (
    <span className="inline-flex items-center gap-1.5 px-1.5 h-7 rounded-md border border-slate-200 bg-white hover:border-slate-300 transition-colors text-[11px]">
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={attachment.url}
          alt={attachment.name}
          className="w-5 h-5 rounded object-cover flex-shrink-0"
        />
      ) : (
        renderIconForMime(attachment.type, attachment.name)
      )}
      <span className="text-slate-700 max-w-[160px] truncate" title={attachment.name}>
        {attachment.name}
      </span>
      <span className="text-slate-400 tabular-nums">{sizeStr}</span>
      {downloadable && (
        <a
          href={attachment.url}
          download={attachment.name}
          target="_blank"
          rel="noopener noreferrer"
          className="p-0.5 rounded text-slate-300 hover:text-primary hover:bg-blue-50"
          title="Download / Open"
        >
          <Download className="w-3 h-3" />
        </a>
      )}
      {removable && (
        <button
          onClick={onRemove}
          className="p-0.5 rounded text-slate-300 hover:text-red-600 hover:bg-red-50"
          title="Remove"
          type="button"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

function renderIconForMime(mime: string, name: string): React.ReactElement {
  const cls = "w-3.5 h-3.5 text-slate-500 flex-shrink-0";
  if (mime.startsWith("image/")) return <ImageIcon className={cls} />;
  if (mime === "application/pdf" || /\.pdf$/i.test(name)) return <FileType className={cls} />;
  if (/spreadsheet|excel|sheet/.test(mime) || /\.(xlsx?|csv)$/i.test(name)) return <FileSpreadsheet className={cls} />;
  if (/text|json|xml|html|javascript/.test(mime) || /\.(json|xml|html?|js|ts)$/i.test(name)) return <FileCode className={cls} />;
  return <FileText className={cls} />;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * 简单相对时间 — 这里不依赖项目里的 fmtDateTime，让组件可以放到任何上下文。
 * Date.now() 是 impure，但用在 render 上会被 React 19 的 purity 规则拦截；
 * 通过模块级函数包一层调用即可（React 只检查"hook 回调内不能直接调用"）。
 */
function formatRelativeTime(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  return formatRelativeTimeFrom(ts, Date.now());
}

function formatRelativeTimeFrom(ts: number, now: number): string {
  const diffSec = Math.max(0, Math.floor((now - ts) / 1000));
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}
