"use client";

/**
 * MentionTextarea — 支持 @mention 的轻量级 textarea 组件.
 *
 * 用法和原生 textarea 一致（受控）：
 * ```tsx
 * <MentionTextarea value={x} onChange={setX} rows={3} />
 * ```
 *
 * 行为：
 *   - 当用户在输入位置敲 `@`，且 `@` 之后没有空格时，弹出员工列表
 *   - 输入更多字符过滤列表（按 nickname / fullName）
 *   - ↑/↓ 选择，Enter / Tab 确认，Esc 关闭
 *   - 点击列表项也可以确认
 *   - 确认后将 `@xyz` 段替换为 `@<FullName> `（带空格），光标放在末尾
 *
 * 实现说明：
 *   - 浮动列表用绝对定位 + 父节点 relative；位置粗算（不依赖 caret 坐标），
 *     固定贴在 textarea 左下，足够 UX 友好。
 *   - 员工列表从 `mockStaff` 拉取，未来对接后端时换 staffService。
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { mockStaff } from "@/lib/backoffice/mock-staff";

interface MentionTextareaProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  /** disable input when sending / saving. */
  disabled?: boolean;
}

interface StaffOption {
  id: string;
  fullName: string;
  nickname?: string;
}

const ALL_STAFF: StaffOption[] = mockStaff.map((s) => ({
  id: s.id,
  fullName: s.fullName,
  nickname: s.nickname,
}));

/** Find the @-trigger before the cursor.
 *  Returns the matched fragment (without `@`) and its start index,
 *  or null if there's no active trigger. */
function findActiveMention(text: string, cursor: number): { query: string; start: number } | null {
  if (cursor <= 0) return null;
  // 从光标往回找 @；遇到空白 / 换行 / 已超过 30 字符就放弃
  let i = cursor - 1;
  let chars = "";
  while (i >= 0 && chars.length < 30) {
    const ch = text[i];
    if (ch === "@") {
      // 触发点。@ 前一个字符必须是行首 / 空格 / 标点，避免邮箱地址触发
      const prev = i === 0 ? " " : text[i - 1];
      if (/[\s\n\r,.:;(\[]/.test(prev) || i === 0) {
        return { query: chars.split("").reverse().join(""), start: i };
      }
      return null;
    }
    if (/\s/.test(ch)) return null;
    chars += ch;
    i--;
  }
  return null;
}

export function MentionTextarea({
  value, onChange,
  placeholder, rows = 3, className,
  autoFocus, onKeyDown, disabled,
}: MentionTextareaProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [mentionState, setMentionState] = useState<{ query: string; start: number; active: number } | null>(null);

  // 过滤后的候选列表
  const candidates = useMemo(() => {
    if (!mentionState) return [];
    const q = mentionState.query.toLowerCase();
    if (q.length === 0) return ALL_STAFF.slice(0, 6);
    return ALL_STAFF
      .filter((s) =>
        s.fullName.toLowerCase().includes(q)
        || (s.nickname?.toLowerCase().includes(q) ?? false)
        || s.id.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [mentionState]);

  // 更新触发状态
  const refresh = (text: string, cursor: number) => {
    const m = findActiveMention(text, cursor);
    setMentionState(m ? { ...m, active: 0 } : null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    onChange(next);
    refresh(next, e.target.selectionStart ?? next.length);
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    refresh(ta.value, ta.selectionStart ?? ta.value.length);
  };

  // 插入选中员工：把 `@xyz` 替换成 `@FullName `
  const commit = (staff: StaffOption) => {
    if (!mentionState || !taRef.current) return;
    const ta = taRef.current;
    const before = value.slice(0, mentionState.start);
    const cursor = ta.selectionStart ?? value.length;
    const after = value.slice(cursor);
    const inserted = `@${staff.fullName} `;
    const next = before + inserted + after;
    onChange(next);
    setMentionState(null);
    // 把光标移到插入末尾
    requestAnimationFrame(() => {
      if (taRef.current) {
        const pos = (before + inserted).length;
        taRef.current.setSelectionRange(pos, pos);
        taRef.current.focus();
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionState && candidates.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionState((s) => s && { ...s, active: (s.active + 1) % candidates.length });
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionState((s) => s && { ...s, active: (s.active - 1 + candidates.length) % candidates.length });
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        commit(candidates[mentionState.active]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionState(null);
        return;
      }
    }
    onKeyDown?.(e);
  };

  // 防止焦点丢失时弹层留着不消失
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (taRef.current && !taRef.current.contains(e.target as Node)) {
        setMentionState(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={taRef}
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        rows={rows}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        className={className ?? "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"}
      />
      {mentionState && candidates.length > 0 && (
        <div className="absolute z-40 left-2 bottom-full mb-1 bg-white border border-slate-200 rounded-lg shadow-lg max-w-[260px] overflow-hidden">
          <p className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100">
            Mention staff · ↑↓ select · Enter confirm
          </p>
          <ul className="py-0.5">
            {candidates.map((s, idx) => (
              <li key={s.id}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); commit(s); }}
                  onMouseEnter={() => setMentionState((m) => m && { ...m, active: idx })}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-left transition-colors ${
                    idx === mentionState.active ? "bg-blue-50 text-primary" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {s.fullName.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-medium truncate flex-1">{s.fullName}</span>
                  {s.nickname && (
                    <span className="text-[10px] text-slate-400">@{s.nickname}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
