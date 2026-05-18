"use client";

/**
 * MilestonesTab — 客户生命周期里程碑（2026-05-17 替代原 TimelineTab）.
 *
 * 跟"活动 Tab"的关系：
 *   - 活动 Tab：客户身上所有事件流，细粒度、几十上百条
 *   - 里程碑 Tab：客户旅程的关键节点，粗粒度、~10 个，包含未达成的 placeholder
 *
 * 视觉：
 *   - 顶部 stats：已达成 / 进行中 / 待开始 / 错过
 *   - 主体：垂直时间线（圆形 icon + 标题 + 描述 + 状态徽章 + 进度条）
 *     · achieved → 实心 emerald
 *     · in_progress → 实心 blue + 进度条
 *     · pending → 空心 slate（locked 感）
 *     · missed → 空心 red
 */

import { useMemo } from "react";
import Link from "next/link";
import {
  UserPlus, MailCheck, LogIn, ShieldCheck, ShieldX, IdCard,
  ArrowDown, ArrowUp, TrendingUp, Crown, Rocket, Users,
  Ban, Unlock, FileSignature, Gift, CalendarClock, AlertTriangle,
  Lock, Circle, Trophy,
  type LucideIcon,
} from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";
import type {
  ClientMilestone, MilestoneIcon, MilestoneStatus,
} from "@/types/backoffice/client-detail";

/* ─── 图标 enum → lucide 组件 ─────────────────────────────────────────── */

const ICON_MAP: Record<MilestoneIcon, LucideIcon> = {
  "user-plus":       UserPlus,
  "mail-check":      MailCheck,
  "log-in":          LogIn,
  "shield-check":    ShieldCheck,
  "shield-x":        ShieldX,
  "id-card":         IdCard,
  "arrow-down":      ArrowDown,
  "arrow-up":        ArrowUp,
  "trending-up":     TrendingUp,
  "crown":           Crown,
  "rocket":          Rocket,
  "users":           Users,
  "ban":             Ban,
  "unlock":          Unlock,
  "file-signature":  FileSignature,
  "gift":            Gift,
  "calendar-clock":  CalendarClock,
  "alert-triangle":  AlertTriangle,
};

/* ─── 状态 → 配色 ─────────────────────────────────────────────────────── */

const STATUS_STYLE: Record<MilestoneStatus, {
  ring: string;
  bg: string;
  text: string;
  badge: string;
  badgeLabel: string;
}> = {
  achieved: {
    ring: "ring-emerald-200",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    badge: "bg-emerald-50 text-emerald-700",
    badgeLabel: "已达成",
  },
  in_progress: {
    ring: "ring-blue-200",
    bg: "bg-blue-100",
    text: "text-blue-700",
    badge: "bg-blue-50 text-blue-700",
    badgeLabel: "进行中",
  },
  pending: {
    ring: "ring-slate-200",
    bg: "bg-slate-100",
    text: "text-slate-400",
    badge: "bg-slate-100 text-slate-500",
    badgeLabel: "待开始",
  },
  missed: {
    ring: "ring-red-200",
    bg: "bg-red-50",
    text: "text-red-500",
    badge: "bg-red-50 text-red-600",
    badgeLabel: "未达成",
  },
};

export default function MilestonesTab({ data }: BaseTabProps) {
  // 防御性兜底：旧 detail payload（缓存 / 未升级的接口）可能不带 milestones 字段
  const milestones = data.milestones ?? [];
  const user = data.user;

  const stats = useMemo(() => {
    const s = { achieved: 0, in_progress: 0, pending: 0, missed: 0 };
    for (const m of milestones) s[m.status] += 1;
    return s;
  }, [milestones]);

  const total = milestones.length;
  const completionPct = total === 0 ? 0 : Math.round((stats.achieved / total) * 100);

  return (
    <div className="space-y-5">
      {/* 顶部摘要 */}
      <section className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-slate-900">客户旅程里程碑</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            生命周期关键节点 · 已达成 {stats.achieved} / {total}
          </p>
        </div>
        <div className="flex items-center gap-5 text-xs">
          <Stat label="已达成" value={stats.achieved} tone="ok" />
          <Stat label="进行中" value={stats.in_progress} tone="info" />
          <Stat label="待开始" value={stats.pending} tone="default" />
          {stats.missed > 0 && <Stat label="未达成" value={stats.missed} tone="danger" />}
        </div>
      </section>

      {/* 整体完成度进度条 */}
      <section className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            旅程完成度
          </span>
          <span className="text-sm font-bold tabular-nums text-slate-900">{completionPct}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </section>

      {/* Milestones 时间线 */}
      <section className="relative pl-7 border-l-2 border-slate-100 ml-3 space-y-3">
        {milestones.length === 0 ? (
          <div className="py-10 text-center">
            <Trophy className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">暂无里程碑数据</p>
          </div>
        ) : (
          milestones.map((m) => (
            <MilestoneRow key={m.id} m={m} clientId={user.id} />
          ))
        )}
      </section>
    </div>
  );
}

/* ─── Row ─────────────────────────────────────────────────────────────── */

function MilestoneRow({ m, clientId }: { m: ClientMilestone; clientId: string }) {
  const style = STATUS_STYLE[m.status];
  const Icon = m.status === "pending" ? Lock
    : m.status === "missed" ? Circle
    : (ICON_MAP[m.icon] ?? Circle);

  return (
    <div className="relative">
      {/* 圆点 — 跨过左侧 border */}
      <span
        className={`absolute -left-[42px] top-0 w-8 h-8 rounded-full ring-2 flex items-center justify-center ${style.bg} ${style.ring} ${m.status === "achieved" ? "" : "bg-white"}`}
      >
        <Icon className={`w-4 h-4 ${style.text}`} />
      </span>

      {/* 卡片内容 */}
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-sm font-semibold ${m.status === "pending" || m.status === "missed" ? "text-slate-500" : "text-slate-900"} truncate`}>
              {m.title}
            </span>
            <span className={`shrink-0 inline-flex items-center px-1.5 h-5 rounded text-[10px] font-bold ${style.badge}`}>
              {style.badgeLabel}
            </span>
            {m.highlight && (
              <span className="shrink-0 text-xs font-semibold text-slate-800 tabular-nums">
                {m.highlight}
              </span>
            )}
          </div>
          {m.achievedAt && (
            <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
              {new Date(m.achievedAt).toLocaleDateString("zh-CN", {
                year: "numeric", month: "2-digit", day: "2-digit",
              })}
            </span>
          )}
        </div>

        {m.description && (
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{m.description}</p>
        )}

        {/* 进度条（pending / in_progress 时显示） */}
        {m.progress && (
          <div className="mt-2">
            <div className="flex items-baseline justify-between text-[10.5px] mb-1">
              <span className="text-slate-500">{m.progress.label}</span>
              <span className="font-semibold text-slate-700 tabular-nums">
                {m.progress.current.toLocaleString()} / {m.progress.target.toLocaleString()} {m.progress.unit}
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${m.status === "in_progress" ? "bg-blue-500" : "bg-slate-300"}`}
                style={{
                  width: `${Math.min(100, Math.round((m.progress.current / m.progress.target) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* 跳转链接 */}
        {m.href && (
          <Link
            href={`/crm/clients/${clientId}${m.href}`}
            className="inline-flex items-center gap-1 mt-2 text-[11px] text-primary hover:underline"
          >
            查看详情 →
          </Link>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: {
  label: string;
  value: number;
  tone: "default" | "ok" | "info" | "danger";
}) {
  const cls = tone === "ok" ? "text-emerald-700"
    : tone === "info" ? "text-blue-700"
    : tone === "danger" ? "text-red-700"
    : "text-slate-700";
  return (
    <div className="text-center">
      <div className={`text-lg font-bold tabular-nums ${cls}`}>{value}</div>
      <div className="text-[10.5px] text-slate-500 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}
