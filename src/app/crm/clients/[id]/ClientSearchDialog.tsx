"use client";

/**
 * ClientSearchDialog — Cmd+K 客户快速切换面板.
 *
 * 触发：详情页内 Cmd+K（macOS）/ Ctrl+K（Win）打开
 * 用途：运营每天切换几十个客户，避免"返回列表 → 搜索 → 点开"三步链路
 *
 * 行为：
 *   - 输入即搜（debounce 200ms）
 *   - ↑/↓ 选择，Enter 跳转，Esc 关闭
 *   - 空输入时显示「最近的客户」候选
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Users } from "lucide-react";
import { searchClients } from "./lib/client-nav";

interface SearchResult {
  id: string;
  uid: string;
  name: string;
  email: string;
  country?: string;
  status: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** 排除当前正在查看的客户 — 避免 "跳到自己"。 */
  excludeId?: string;
}

export function ClientSearchDialog({ open, onClose, excludeId }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 重置状态 + 自动 focus 输入框
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      // 异步以避免 Dialog 还没 mount
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const items = await searchClients(query, 12);
        setResults(items.filter((it) => it.id !== excludeId));
        setActive(0);
      } catch (err) {
        console.error("[ClientSearch] failed:", err);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, open, excludeId]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(results.length - 1, a + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const pick = results[active];
        if (pick) jumpTo(pick.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, active]); // eslint-disable-line react-hooks/exhaustive-deps

  const jumpTo = (id: string) => {
    router.push(`/crm/clients/${id}`);
    onClose();
  };

  const placeholder = useMemo(
    () => query ? `搜索中…` : "输入姓名 / UID / 邮箱 / 手机号…",
    [query],
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
      />
      {/* Centered panel */}
      <div className="fixed left-1/2 top-[15vh] -translate-x-1/2 z-50 w-[560px] max-w-[90vw] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Input row */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 outline-none text-sm bg-transparent"
          />
          <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[10px] font-mono text-slate-500">ESC</kbd>
          <button
            onClick={onClose}
            className="p-0.5 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Result list */}
        <div className="flex-1 overflow-y-auto max-h-[60vh]">
          {loading && results.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">加载中…</p>
          ) : results.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">
                {query ? "没有找到匹配的客户" : "暂无客户"}
              </p>
            </div>
          ) : (
            <>
              <p className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 bg-slate-50/60">
                {query ? `${results.length} 个结果` : "最近的客户"}
              </p>
              <ul>
                {results.map((c, idx) => (
                  <li key={c.id}>
                    <button
                      onClick={() => jumpTo(c.id)}
                      onMouseEnter={() => setActive(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        idx === active ? "bg-blue-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium truncate ${idx === active ? "text-primary" : "text-slate-900"}`}>
                            {c.name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 tabular-nums">{c.uid}</span>
                          {c.country && c.country.length === 2 && (
                            <span className="text-xs leading-none">
                              {String.fromCodePoint(...c.country.toUpperCase().split("").map((ch) => 127397 + ch.charCodeAt(0)))}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{c.email}</div>
                      </div>
                      <StatusDot status={c.status} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-[10.5px] text-slate-500">
          <span className="flex items-center gap-2">
            <kbd className="px-1 py-0.5 rounded border border-slate-200 bg-white text-[9px] font-mono">↑↓</kbd>
            选择
            <kbd className="px-1 py-0.5 rounded border border-slate-200 bg-white text-[9px] font-mono">↵</kbd>
            打开
          </span>
          <span>客户快速切换 · ⌘K</span>
        </div>
      </div>
    </>
  );
}

function StatusDot({ status }: { status: string }) {
  const tone = status === "active" ? "bg-emerald-500"
    : status === "frozen" ? "bg-red-500"
    : status === "pending" ? "bg-amber-500"
    : "bg-slate-400";
  return <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tone}`} title={status} />;
}
