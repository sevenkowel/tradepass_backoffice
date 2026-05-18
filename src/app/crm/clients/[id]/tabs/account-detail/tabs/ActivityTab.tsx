"use client";

/**
 * Activity Tab — 跨数据源的统一活动时间线
 *
 * 把以下事件流合并到一个按时间倒序的列表：
 *   trade   交易开/平仓
 *   fund    入金/出金/转账/调整
 *   login   MT 终端登录
 *   risk    风险引擎告警
 *   control 控制开关变更
 *   kyc     KYC 提交/审核
 *   settings 配置变更
 *   note    客服/风控笔记
 *
 * 6 个 chip 用于按类别过滤。"All" 始终在最前，每个 chip 旁显示该类计数。
 *
 * 不分页（虚拟列表 To-Do）；初版按时间倒序展示前 200 条。
 */

import { useMemo, useState } from "react";
import {
  ArrowLeftRight, ArrowUpDown, FileText, KeyRound,
  LogIn, Settings as Cog, ShieldAlert, TrendingUp, FilePen,
} from "lucide-react";
import type {
  AccountActivityEntry, AccountActivityKind,
} from "@/types/backoffice/client-detail";
import { Empty, fmtMoney, shortTime } from "../primitives";

type ActivityFilter = "all" | AccountActivityKind;

const FILTERS: { key: ActivityFilter; label: string }[] = [
  { key: "all",      label: "All" },
  { key: "trade",    label: "Trade" },
  { key: "fund",     label: "Fund" },
  { key: "login",    label: "Login" },
  { key: "risk",     label: "Risk" },
  { key: "control",  label: "Control" },
  { key: "kyc",      label: "KYC" },
  { key: "settings", label: "Settings" },
  { key: "note",     label: "Note" },
];

const KIND_META: Record<AccountActivityKind, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  trade:    { icon: TrendingUp,    tone: "bg-blue-50 text-blue-700 border-blue-200" },
  fund:     { icon: ArrowUpDown,   tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  login:    { icon: LogIn,         tone: "bg-slate-100 text-slate-700 border-slate-200" },
  risk:     { icon: ShieldAlert,   tone: "bg-red-50 text-red-700 border-red-200" },
  control:  { icon: Cog,           tone: "bg-amber-50 text-amber-700 border-amber-200" },
  kyc:      { icon: FilePen,       tone: "bg-violet-50 text-violet-700 border-violet-200" },
  settings: { icon: KeyRound,      tone: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  note:     { icon: FileText,      tone: "bg-slate-100 text-slate-700 border-slate-200" },
};

interface Props {
  activity: AccountActivityEntry[];
  currency: string;
}

export function ActivityTab({ activity }: Props) {
  const [filter, setFilter] = useState<ActivityFilter>("all");

  const filtered = useMemo(
    () => activity.filter((e) => filter === "all" || e.kind === filter).slice(0, 200),
    [activity, filter],
  );

  return (
    <div>
      {/* Filter pills — 与 Trading Tab 子导航同款风格。
       *  不做 sticky：详情面板内已有 TabBar 在顶部常驻，filter 跟随内容
       *  一起滚动反而更自然，避免多层固定元素叠加。
       */}
      <div className="mb-4">
        <div className="inline-flex bg-slate-100 rounded-lg p-0.5 flex-wrap max-w-full">
          {FILTERS.map((f) => {
            const count = f.key === "all" ? activity.length : activity.filter((e) => e.kind === f.key).length;
            if (count === 0 && f.key !== "all") return null;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 h-7 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  active
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>{f.label}</span>
                {count > 0 && (
                  <span className="text-[10px] tabular-nums text-slate-400">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? <Empty>No activity</Empty> : (
        <ol className="relative">
          {/* Vertical line */}
          <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-100" aria-hidden />
          {filtered.map((e) => (
            <ActivityRow key={e.id} entry={e} />
          ))}
          {activity.length > 200 && (
            <li className="ml-9 py-3 text-xs text-slate-400">
              Showing latest 200 of {activity.length} events
            </li>
          )}
        </ol>
      )}
    </div>
  );
}

function ActivityRow({ entry }: { entry: AccountActivityEntry }) {
  const meta = KIND_META[entry.kind];
  const Icon = meta.icon;
  const severityCls =
    entry.severity === "danger"  ? "bg-red-100 text-red-700"
    : entry.severity === "warning" ? "bg-amber-100 text-amber-700"
    : entry.severity === "success" ? "bg-emerald-100 text-emerald-700"
    : "bg-slate-100 text-slate-600";

  return (
    <li className="relative flex items-start gap-3 py-2.5 pl-0">
      {/* Icon node */}
      <div className={`relative z-10 w-7 h-7 rounded-full border flex items-center justify-center shrink-0 ${meta.tone}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-sm font-medium text-slate-800 truncate">{entry.title}</span>
            {entry.highlight && (
              <span className={`px-1.5 py-0.5 text-[10.5px] font-semibold rounded ${severityCls}`}>
                {entry.highlight}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
            {shortTime(entry.timestamp)}
          </span>
        </div>
        {entry.description && (
          <div className="text-xs text-slate-500 mt-0.5">{entry.description}</div>
        )}
        {entry.operator && (
          <div className="text-[10.5px] text-slate-400 mt-0.5">
            by <span className="text-slate-600 font-medium">{entry.operator}</span>
          </div>
        )}
      </div>
    </li>
  );
}

// Silence unused-import warning (kept for future enrichment)
void fmtMoney;
void ArrowLeftRight;
