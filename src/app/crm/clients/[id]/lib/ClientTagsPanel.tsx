"use client";

/**
 * ClientTagsPanel (P0-N2) — 详情页内增 / 删客户标签.
 *
 * 流程：
 *   - 顶部显示当前标签 chips，每个右侧 × 可删除
 *   - 底部输入框 + 下拉补全（来自标签目录）
 *   - 操作即时调用 service，UI 乐观更新，失败 toast
 *
 * 设计选择：嵌入到 Sidebar 而非独立 Tab —— 标签是高频元数据，Sidebar 更触手可及
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Tag, X, Plus, Check } from "lucide-react";
import { clientService } from "@/lib/crm/services/client.service";
import type { ClientTag } from "@/types/backoffice/user";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  clientId: string;
  initialTags: string[];
  onChange?: (next: string[]) => void;
}

export function ClientTagsPanel({ clientId, initialTags, onChange }: Props) {
  const toast = useToast();
  const [tags, setTags] = useState<string[]>(initialTags);
  const [catalog, setCatalog] = useState<ClientTag[]>([]);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 加载标签目录
  useEffect(() => {
    clientService.listTags().then(setCatalog).catch(() => { /* ignore */ });
  }, []);

  // 父组件 initialTags 变化时同步
  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  // 过滤建议
  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    return catalog
      .filter((c) => !tags.includes(c.name))
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [catalog, tags, input]);

  const addTag = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    const optimistic = [...tags, trimmed];
    setTags(optimistic);
    onChange?.(optimistic);
    setInput("");
    setOpen(false);
    try {
      await clientService.addTags(clientId, [trimmed]);
      toast.success(`标签 "${trimmed}" 已添加`);
    } catch (err) {
      console.error(err);
      // 回滚
      setTags(tags);
      onChange?.(tags);
      toast.error("添加标签失败");
    }
  };

  const removeTag = async (name: string) => {
    const optimistic = tags.filter((t) => t !== name);
    setTags(optimistic);
    onChange?.(optimistic);
    try {
      await clientService.removeTags(clientId, [name]);
      toast.success(`标签 "${name}" 已移除`);
    } catch (err) {
      console.error(err);
      setTags(tags);
      onChange?.(tags);
      toast.error("移除标签失败");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) addTag(suggestions[0].name);
      else if (input.trim()) addTag(input);
    } else if (e.key === "Escape") {
      setOpen(false);
      setInput("");
    }
  };

  return (
    <div className="text-xs">
      <div className="flex items-center gap-1 mb-1.5 text-slate-400">
        <Tag className="w-3 h-3" />
        <span className="text-[10px] uppercase tracking-wider font-bold">标签</span>
      </div>

      {/* Tag chips */}
      <div className="flex items-center gap-1 flex-wrap">
        {tags.map((t) => {
          const meta = catalog.find((c) => c.name === t);
          const color = meta?.color ?? "#94a3b8";
          return (
            <span
              key={t}
              className="inline-flex items-center gap-1 pl-1.5 pr-1 h-6 rounded-md text-[11px] font-medium border"
              style={{ borderColor: `${color}40`, background: `${color}20`, color }}
            >
              <span>{t}</span>
              <button
                onClick={() => removeTag(t)}
                className="p-0.5 rounded hover:bg-black/10"
                aria-label={`移除 ${t}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          );
        })}

        {/* Add input */}
        <div className="relative">
          <button
            onClick={() => { setOpen(true); requestAnimationFrame(() => inputRef.current?.focus()); }}
            className={`inline-flex items-center gap-1 h-6 px-1.5 rounded-md text-[11px] font-medium border border-dashed transition-colors ${
              open ? "border-blue-300 bg-blue-50 text-primary" : "border-slate-300 text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Plus className="w-2.5 h-2.5" />
            添加
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => { setOpen(false); setInput(""); }} />
              <div className="absolute left-0 top-full mt-1 z-40 w-56 bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
                <div className="px-2.5 py-1.5 border-b border-slate-100">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="输入标签名…"
                    className="w-full outline-none text-xs"
                  />
                </div>
                <ul className="max-h-48 overflow-y-auto py-0.5">
                  {suggestions.map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => addTag(s.name)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-slate-50 text-xs"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: s.color }}
                        />
                        <span className="flex-1 truncate">{s.name}</span>
                        <Check className="w-3 h-3 text-slate-200 hover:text-emerald-600" />
                      </button>
                    </li>
                  ))}
                  {input.trim() && !catalog.some((c) => c.name === input.trim()) && (
                    <li className="border-t border-slate-100">
                      <button
                        onClick={() => addTag(input)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-blue-50 text-xs text-primary"
                      >
                        <Plus className="w-3 h-3" />
                        <span>新建标签 <b>{input.trim()}</b></span>
                      </button>
                    </li>
                  )}
                  {suggestions.length === 0 && !input.trim() && (
                    <li className="px-2.5 py-3 text-center text-[11px] text-slate-400">
                      暂无可选标签，输入新建
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
