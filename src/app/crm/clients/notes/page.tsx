"use client";

/**
 * Notes 中心页（2026-05-17 重构）.
 *
 * 改进：
 *   - 顶部 5 项 KPI（总数 / @我 / 我创建 / 已 pin / 待跟进）
 *   - 类型筛选 chip + 作者筛选 + 客户筛选 + 时间倒排
 *   - Mock 数据扩到 88 条（来自 prisma-proxy 的 mockNotes 生成器）
 *   - 行 hover 显示客户跳转链接
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  MessageSquare, Pin, AtSign, Plus, Loader2,
  AlertTriangle, TrendingUp, Tag as TagIcon, FileText, Filter,
} from "lucide-react";
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

type NoteFilter = "all" | "pinned" | "mentioned" | "general" | "risk" | "sales" | "followup";

const NOTE_TYPE_META: Record<string, { label: string; color: string; bg: string; icon: typeof FileText }> = {
  general:  { label: "通用",  color: "text-slate-700",   bg: "bg-slate-100",   icon: FileText },
  risk:     { label: "风险",  color: "text-red-700",     bg: "bg-red-100",     icon: AlertTriangle },
  sales:    { label: "销售",  color: "text-emerald-700", bg: "bg-emerald-100", icon: TrendingUp },
  followup: { label: "跟进",  color: "text-amber-700",   bg: "bg-amber-100",   icon: TagIcon },
};

// 假设当前登录员工 - 用于"@我"过滤判断（mock 演示用）
const CURRENT_STAFF_ID = "staff-001";
const CURRENT_STAFF_NAME = "Alice Chen";

export default function NotesPage() {
  const { t } = useT();
  const [notes, setNotes] = useState<GlobalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<NoteFilter>("all");
  const [authorFilter, setAuthorFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`/api/crm/notes?limit=500`, { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.success) setNotes(d.items);
        else setError(d.error || "Failed to load");
      })
      .catch((e) => !cancelled && setError(e.message || String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  // KPI
  const stats = useMemo(() => {
    const mentioned = notes.filter((n) =>
      n.content.includes(`@${CURRENT_STAFF_NAME}`) || n.mentions.includes(CURRENT_STAFF_ID),
    ).length;
    const myAuthored = notes.filter((n) => n.author === CURRENT_STAFF_ID).length;
    const pinned = notes.filter((n) => n.isPinned).length;
    const followup = notes.filter((n) => n.noteType === "followup").length;
    return { total: notes.length, mentioned, myAuthored, pinned, followup };
  }, [notes]);

  // 作者列表
  const authors = useMemo(() => {
    const set = new Map<string, string>();
    for (const n of notes) {
      if (!set.has(n.author)) set.set(n.author, n.authorName ?? n.author);
    }
    return Array.from(set.entries());
  }, [notes]);

  // 客户列表
  const clients = useMemo(() => {
    const set = new Map<string, string>();
    for (const n of notes) {
      if (!set.has(n.clientId)) set.set(n.clientId, n.clientName);
    }
    return Array.from(set.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [notes]);

  const filtered = useMemo(() => {
    return notes
      .filter((n) => {
        if (filter === "pinned") return n.isPinned;
        if (filter === "mentioned") return n.content.includes(`@${CURRENT_STAFF_NAME}`) || n.mentions.includes(CURRENT_STAFF_ID);
        if (filter === "all") return true;
        return n.noteType === filter;
      })
      .filter((n) => authorFilter === "all" || n.author === authorFilter)
      .filter((n) => clientFilter === "all" || n.clientId === clientFilter);
  }, [notes, filter, authorFilter, clientFilter]);

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Clients", href: "/crm/clients" }, { label: t("clients.crumb.notes") ?? "备注中心" }]} />

      <PageHeader
        title={t("clients.notesPage.title") ?? "备注中心"}
        description={t("clients.notesPage.subtitle") ?? "全平台运营备注、@提及与待跟进"}
        actions={
          <Button>
            <Plus className="w-4 h-4" />
            新建备注
          </Button>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="总数"          value={stats.total} />
        <KpiCard label="@我的"         value={stats.mentioned} tone="info" />
        <KpiCard label="我创建的"      value={stats.myAuthored} />
        <KpiCard label="已 Pin"        value={stats.pinned} tone="warn" icon={Pin} />
        <KpiCard label="待跟进"        value={stats.followup} tone="warn" icon={TagIcon} />
      </div>

      {/* Type filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          ["all",       "全部"],
          ["pinned",    "已 Pin"],
          ["mentioned", "@我"],
          ["general",   "通用"],
          ["risk",      "风险"],
          ["sales",     "销售"],
          ["followup",  "跟进"],
        ] as const).map(([f, label]) => {
          const count = f === "all" ? notes.length
            : f === "pinned" ? stats.pinned
            : f === "mentioned" ? stats.mentioned
            : notes.filter((n) => n.noteType === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f as NoteFilter)}
              className={`px-3 h-7 rounded-md text-xs font-medium border transition-colors inline-flex items-center gap-1.5 ${
                filter === f
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {label}
              <span className={`text-[10px] tabular-nums ${filter === f ? "opacity-80" : "text-slate-400"}`}>
                {count}
              </span>
            </button>
          );
        })}

        {/* Author / Client filter dropdowns */}
        <div className="ml-auto flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={authorFilter}
            onChange={(e) => setAuthorFilter(e.target.value)}
            className="h-7 px-2 border border-slate-200 rounded bg-white text-xs"
          >
            <option value="all">所有作者</option>
            {authors.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="h-7 px-2 border border-slate-200 rounded bg-white text-xs"
          >
            <option value="all">所有客户</option>
            {clients.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Notes list */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            加载中…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">无符合条件的备注</p>
          </div>
        ) : (
          filtered.map((note) => <NoteRow key={note.id} note={note} />)
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-[11px] text-slate-400 text-center">
          显示 {filtered.length} / {notes.length} 条
        </p>
      )}
    </div>
  );
}

function NoteRow({ note }: { note: GlobalNote }) {
  const displayName = note.authorName ?? note.author ?? "—";
  const meta = NOTE_TYPE_META[note.noteType] ?? NOTE_TYPE_META.general;
  const TypeIcon = meta.icon;
  return (
    <Card className={`!p-4 ${note.isPinned ? "border-amber-300" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600 flex-shrink-0">
          {displayName.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-medium text-slate-900">{displayName}</span>
            <span className="text-xs text-slate-400">{new Date(note.createdAt).toLocaleString("zh-CN", {
              month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
            })}</span>
            {note.isPinned && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px]">
                <Pin className="w-2.5 h-2.5" />
                Pinned
              </span>
            )}
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${meta.bg} ${meta.color}`}>
              <TypeIcon className="w-2.5 h-2.5" />
              {meta.label}
            </span>
            <Link
              href={`/crm/clients/${note.clientId}`}
              className="text-xs text-blue-600 hover:underline ml-auto"
            >
              → {note.clientName}
            </Link>
          </div>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
          {note.mentions.length > 0 && (
            <div className="mt-2 flex items-center gap-1 flex-wrap">
              <AtSign className="w-3 h-3 text-slate-400" />
              {note.mentions.map((m) => (
                <span key={m} className="text-xs text-blue-600">@{m}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function KpiCard({ label, value, tone, icon: Icon }: {
  label: string; value: number;
  tone?: "info" | "warn" | "danger";
  icon?: typeof FileText;
}) {
  const cls = tone === "warn" ? "text-amber-700"
    : tone === "danger" ? "text-red-700"
    : tone === "info" ? "text-blue-700"
    : "text-slate-900";
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3">
      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-slate-500">
        {Icon && <Icon className="w-3 h-3" />}
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-bold tabular-nums mt-0.5 ${cls}`}>{value}</div>
    </div>
  );
}
