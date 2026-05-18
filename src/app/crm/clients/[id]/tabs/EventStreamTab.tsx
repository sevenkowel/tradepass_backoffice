"use client";

/**
 * ActivityTab (原 EventStreamTab，2026-05-17 重构).
 *
 * 用真实 `data.timeline` 作为数据源（彻底丢掉之前的 mock-only 实现），
 * 顶部 filter chips 按事件大类分组：
 *   - 全部
 *   - 资金   (deposit / withdrawal)
 *   - 交易   (trade)
 *   - 合规   (kyc_* / agreement_signed / case_*)
 *   - 登录   (login / device_added)
 *   - 风控   (account_frozen / account_unfrozen / permission_updated)
 *   - 运营   (note_added / ticket_*)
 *
 * 跟「里程碑 Tab」的区别：
 *   - 里程碑 = 客户生命周期关键节点（粗粒度，10 条左右，含未达成）
 *   - 活动   = 客户身上所有事件（细粒度，可能上百条）
 */

import { useMemo, useState } from "react";
import {
  ArrowDownLeft, ArrowUpRight, TrendingUp, ShieldCheck,
  LogIn, Ban, Unlock, Settings, Ticket, ClipboardList,
  MessageSquare, Monitor, FileText, UserPlus, Circle,
  type LucideIcon,
} from "lucide-react";
import type {
  TimelineEvent, TimelineEventType,
} from "@/types/backoffice/client-detail";
import type { BaseTabProps } from "@/types/backoffice/client";
import { useT } from "@/lib/i18n/LocaleProvider";

/* ─── Event categorisation ────────────────────────────────────────────── */

type Category = "funds" | "trade" | "compliance" | "login" | "risk" | "ops" | "other";

const CATEGORY_OF: Record<TimelineEventType, Category> = {
  registered:         "other",
  kyc_submitted:      "compliance",
  kyc_approved:       "compliance",
  kyc_rejected:       "compliance",
  agreement_signed:   "compliance",
  case_created:       "compliance",
  case_resolved:      "compliance",
  deposit:            "funds",
  withdrawal:         "funds",
  trade:              "trade",
  login:              "login",
  device_added:       "login",
  account_frozen:     "risk",
  account_unfrozen:   "risk",
  permission_updated: "risk",
  note_added:         "ops",
  ticket_created:     "ops",
  ticket_replied:     "ops",
};

const CATEGORY_META: Record<Category, { label: string }> = {
  funds:      { label: "资金" },
  trade:      { label: "交易" },
  compliance: { label: "合规" },
  login:      { label: "登录" },
  risk:       { label: "风控" },
  ops:        { label: "运营" },
  other:      { label: "其它" },
};

const ICON_OF: Record<TimelineEventType, LucideIcon> = {
  registered:         UserPlus,
  kyc_submitted:      ShieldCheck,
  kyc_approved:       ShieldCheck,
  kyc_rejected:       ShieldCheck,
  agreement_signed:   FileText,
  case_created:       ClipboardList,
  case_resolved:      ClipboardList,
  deposit:            ArrowDownLeft,
  withdrawal:         ArrowUpRight,
  trade:              TrendingUp,
  login:              LogIn,
  device_added:       Monitor,
  account_frozen:     Ban,
  account_unfrozen:   Unlock,
  permission_updated: Settings,
  note_added:         MessageSquare,
  ticket_created:     Ticket,
  ticket_replied:     MessageSquare,
};

const COLOR_OF: Record<TimelineEventType, { bg: string; text: string }> = {
  registered:         { bg: "bg-blue-100",    text: "text-blue-600" },
  kyc_submitted:      { bg: "bg-amber-100",   text: "text-amber-600" },
  kyc_approved:       { bg: "bg-emerald-100", text: "text-emerald-600" },
  kyc_rejected:       { bg: "bg-red-100",     text: "text-red-600" },
  agreement_signed:   { bg: "bg-violet-100",  text: "text-violet-600" },
  case_created:       { bg: "bg-slate-100",   text: "text-slate-600" },
  case_resolved:      { bg: "bg-emerald-100", text: "text-emerald-600" },
  deposit:            { bg: "bg-emerald-100", text: "text-emerald-600" },
  withdrawal:         { bg: "bg-red-100",     text: "text-red-600" },
  trade:              { bg: "bg-blue-100",    text: "text-blue-600" },
  login:              { bg: "bg-slate-100",   text: "text-slate-600" },
  device_added:       { bg: "bg-indigo-100",  text: "text-indigo-600" },
  account_frozen:     { bg: "bg-red-100",     text: "text-red-700" },
  account_unfrozen:   { bg: "bg-emerald-100", text: "text-emerald-700" },
  permission_updated: { bg: "bg-amber-100",   text: "text-amber-700" },
  note_added:         { bg: "bg-slate-100",   text: "text-slate-600" },
  ticket_created:     { bg: "bg-blue-100",    text: "text-blue-600" },
  ticket_replied:     { bg: "bg-blue-100",    text: "text-blue-600" },
};

export default function EventStreamTab({ data }: BaseTabProps) {
  const { timeline } = data;
  const { locale } = useT();
  const dateLocale =
    locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : locale === "es" ? "es-ES" : "en-US";

  const [filter, setFilter] = useState<"all" | Category>("all");

  // 计算每个分类的事件数
  const counts = useMemo(() => {
    const m: Partial<Record<Category, number>> = {};
    for (const e of timeline) {
      const cat = CATEGORY_OF[e.type] ?? "other";
      m[cat] = (m[cat] ?? 0) + 1;
    }
    return m;
  }, [timeline]);

  const filtered = useMemo(() => {
    if (filter === "all") return timeline;
    return timeline.filter((e) => (CATEGORY_OF[e.type] ?? "other") === filter);
  }, [filter, timeline]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-0.5">活动</h3>
        <p className="text-xs text-slate-500">客户身上发生的所有事件 — 共 {timeline.length} 条</p>
      </div>

      {/* Filter chips */}
      <div className="inline-flex bg-slate-100 rounded-lg p-0.5 flex-wrap max-w-full">
        <FilterButton
          label="全部"
          count={timeline.length}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        {(Object.keys(CATEGORY_META) as Category[]).map((k) => {
          const count = counts[k] ?? 0;
          if (count === 0) return null;
          return (
            <FilterButton
              key={k}
              label={CATEGORY_META[k].label}
              count={count}
              active={filter === k}
              onClick={() => setFilter(k)}
            />
          );
        })}
      </div>

      {/* Activity list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          当前筛选下无活动记录
        </div>
      ) : (
        <ol className="relative">
          <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-200" aria-hidden />
          {filtered.slice(0, 200).map((e) => (
            <EventRow key={e.id} event={e} dateLocale={dateLocale} />
          ))}
          {filtered.length > 200 && (
            <li className="ml-9 py-3 text-xs text-slate-400">
              显示最新 200 条 · 共 {filtered.length} 条
            </li>
          )}
        </ol>
      )}
    </div>
  );
}

function FilterButton({
  label, count, active, onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 h-7 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
      }`}
    >
      <span>{label}</span>
      <span className="text-[10px] tabular-nums text-slate-400">{count}</span>
    </button>
  );
}

function EventRow({ event, dateLocale }: { event: TimelineEvent; dateLocale: string }) {
  const Icon = ICON_OF[event.type] ?? Circle;
  const color = COLOR_OF[event.type] ?? { bg: "bg-slate-100", text: "text-slate-600" };

  return (
    <li className="relative flex items-start gap-3 py-2.5 pl-0">
      <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${color.bg} ${color.text}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-800 truncate">{event.title}</span>
          <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
            {new Date(event.timestamp).toLocaleString(dateLocale, {
              month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
            })}
          </span>
        </div>
        {event.description && (
          <div className="text-xs text-slate-500 mt-0.5">{event.description}</div>
        )}
        {event.operator && (
          <div className="text-[10.5px] text-slate-400 mt-0.5">
            by <span className="text-slate-600 font-medium">{event.operator}</span>
          </div>
        )}
      </div>
    </li>
  );
}
