"use client";

/**
 * SavedViews — 客户目录顶部的预设视图 + 自定义保存视图栏 (P2-N1).
 *
 * 预设视图（5 个）：
 *   - 所有客户        (无过滤)
 *   - VIP 客户        (level=vip / premium / enterprise)
 *   - 活跃交易者      (lifecycleStage=active)
 *   - 高风险客户      (riskLevel=high / critical)
 *   - 沉默客户        (lifecycleStage=inactive / churn)
 *
 * 用户可以把当前筛选条件保存成自定义视图（localStorage 持久化）。
 */

import { useEffect, useState } from "react";
import { Star, X, Save, Bookmark } from "lucide-react";
import type { ClientListParams } from "@/types/backoffice/user";

const STORAGE_KEY = "crm:clients:saved-views";

export interface SavedView {
  id: string;
  name: string;
  filters: Partial<ClientListParams>;
  emoji?: string;
}

export const PRESET_VIEWS: SavedView[] = [
  { id: "preset:all",      name: "所有客户",     filters: {}, emoji: "📋" },
  { id: "preset:vip",      name: "VIP 客户",     filters: { level: "vip" },             emoji: "👑" },
  { id: "preset:active",   name: "活跃交易者",   filters: { lifecycleStage: "active" }, emoji: "📈" },
  { id: "preset:highrisk", name: "高风险",       filters: { riskLevel: "critical" },    emoji: "🚨" },
  { id: "preset:dormant",  name: "沉默客户",     filters: { lifecycleStage: "inactive" }, emoji: "💤" },
];

function loadCustom(): SavedView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCustom(views: SavedView[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
  } catch { /* ignore */ }
}

interface Props {
  /** 当前激活的 view id（也可能是无 id 的"未保存"状态）。 */
  activeViewId?: string;
  /** 当前过滤条件 — 与某 view 一致时高亮该 view。 */
  currentFilters: Partial<ClientListParams>;
  /** 切换到某 view。调用方应应用 view.filters 到主筛选状态。 */
  onApplyView: (view: SavedView) => void;
}

export function SavedViews({ currentFilters, onApplyView }: Props) {
  const [custom, setCustom] = useState<SavedView[]>([]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    setCustom(loadCustom());
  }, []);

  // 判断当前 filter 是否匹配某个 view（粗糙比较）
  const isActive = (view: SavedView): boolean => {
    const a = view.filters;
    const b = currentFilters;
    const aKeys = Object.keys(a);
    if (aKeys.length === 0) {
      // "All" — 当 currentFilters 为空时算激活
      return Object.values(b).every((v) => v == null || v === "");
    }
    return aKeys.every((k) => (a as Record<string, unknown>)[k] === (b as Record<string, unknown>)[k]);
  };

  const saveCurrent = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next: SavedView = {
      id: `custom:${Date.now()}`,
      name: trimmed,
      filters: currentFilters,
    };
    const updated = [...custom, next];
    setCustom(updated);
    saveCustom(updated);
    setName("");
    setSaveOpen(false);
  };

  const deleteCustom = (id: string) => {
    const updated = custom.filter((v) => v.id !== id);
    setCustom(updated);
    saveCustom(updated);
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {PRESET_VIEWS.map((v) => (
        <ViewChip
          key={v.id}
          view={v}
          active={isActive(v)}
          onClick={() => onApplyView(v)}
        />
      ))}

      {custom.length > 0 && <span className="h-4 w-px bg-slate-200" />}

      {custom.map((v) => (
        <ViewChip
          key={v.id}
          view={v}
          active={isActive(v)}
          onClick={() => onApplyView(v)}
          onDelete={() => deleteCustom(v.id)}
        />
      ))}

      <div className="relative">
        <button
          onClick={() => setSaveOpen((b) => !b)}
          className="h-7 px-2 text-[11px] font-medium rounded-md border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 inline-flex items-center gap-1"
        >
          <Save className="w-3 h-3" />
          保存当前
        </button>
        {saveOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setSaveOpen(false)} />
            <div className="absolute left-0 top-full mt-1 z-40 w-56 bg-white rounded-lg border border-slate-200 shadow-lg p-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">视图名称</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveCurrent()}
                autoFocus
                placeholder="例：东南亚高净值"
                className="w-full h-7 px-2 border border-slate-200 rounded text-xs"
              />
              <div className="flex items-center justify-end gap-1 mt-2">
                <button
                  onClick={() => setSaveOpen(false)}
                  className="px-2 h-6 text-[11px] text-slate-500 hover:bg-slate-50 rounded"
                >
                  取消
                </button>
                <button
                  onClick={saveCurrent}
                  disabled={!name.trim()}
                  className="px-3 h-6 text-[11px] font-bold bg-blue-600 text-white rounded disabled:opacity-40"
                >
                  保存
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ViewChip({
  view, active, onClick, onDelete,
}: {
  view: SavedView;
  active: boolean;
  onClick: () => void;
  onDelete?: () => void;
}) {
  return (
    <span className={`inline-flex items-center rounded-md text-xs font-medium transition-colors ${
      active ? "bg-blue-50 text-primary border border-blue-200" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
    }`}>
      <button onClick={onClick} className="px-2.5 h-7 inline-flex items-center gap-1">
        {view.emoji ? <span>{view.emoji}</span> : onDelete ? <Bookmark className="w-3 h-3" /> : <Star className="w-3 h-3" />}
        {view.name}
      </button>
      {onDelete && (
        <button
          onClick={onDelete}
          className="px-1 h-7 inline-flex items-center text-slate-300 hover:text-red-600"
          title="删除此视图"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
