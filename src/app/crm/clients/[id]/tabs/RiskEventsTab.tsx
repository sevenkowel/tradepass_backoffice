"use client";

/**
 * RiskEventsTab — 风险事件流 (P1, 2026-05-15).
 *
 * 该客户触发过的所有风险事件（来自风控引擎 / 手动标记 / AML 筛查 等）。
 * 区别于「Activity Tab」的全量事件流，这里只展示**风险相关**事件。
 */

import { useMemo, useState } from "react";
import {
  AlertTriangle, ShieldAlert, ShieldCheck, Activity,
  type LucideIcon,
} from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";
import { seededRng, rngHelpers, shortDateTime } from "./_shared/mock-prng";

type EventCategory = "trading" | "fund" | "kyc" | "login" | "aml" | "device";
type EventSeverity = "low" | "medium" | "high" | "critical";
type EventStatus = "open" | "investigating" | "resolved" | "false_positive";

interface RiskEvent {
  id: string;
  category: EventCategory;
  severity: EventSeverity;
  title: string;
  description: string;
  status: EventStatus;
  handler?: string;
  handledAt?: string;
  resolution?: string;
  createdAt: string;
}

const CATEGORY_META: Record<EventCategory, { label: string; icon: LucideIcon; tone: string }> = {
  trading: { label: "交易",   icon: Activity,    tone: "bg-blue-50 text-blue-700" },
  fund:    { label: "资金",   icon: Activity,    tone: "bg-emerald-50 text-emerald-700" },
  kyc:     { label: "KYC",    icon: ShieldCheck, tone: "bg-violet-50 text-violet-700" },
  login:   { label: "登录",   icon: Activity,    tone: "bg-slate-100 text-slate-700" },
  aml:     { label: "AML",    icon: ShieldAlert, tone: "bg-red-50 text-red-700" },
  device:  { label: "设备",   icon: AlertTriangle, tone: "bg-amber-50 text-amber-700" },
};

const SEVERITY_LABEL: Record<EventSeverity, string> = {
  low: "低", medium: "中", high: "高", critical: "严重",
};

const SEVERITY_TONE: Record<EventSeverity, string> = {
  low:      "bg-slate-50 text-slate-700 border-slate-200",
  medium:   "bg-amber-50 text-amber-700 border-amber-200",
  high:     "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABEL: Record<EventStatus, string> = {
  open:           "待处理",
  investigating:  "调查中",
  resolved:       "已处理",
  false_positive: "误报",
};

const EVENT_TEMPLATES: { category: EventCategory; severity: EventSeverity; title: string; desc: string }[] = [
  { category: "trading", severity: "high",     title: "异常交易模式",    desc: "短时间内大量开平仓，疑似刷量" },
  { category: "trading", severity: "medium",   title: "EA 套利可疑",     desc: "EA 持续在重要数据公布前下单" },
  { category: "fund",    severity: "high",     title: "大额入金异常",    desc: "首次入金 $50K，超过常规范围" },
  { category: "fund",    severity: "critical", title: "出金来源不明",    desc: "出金账户与入金账户不同名" },
  { category: "kyc",     severity: "high",     title: "证件 OCR 不匹配", desc: "上传证件姓名与系统记录不一致" },
  { category: "kyc",     severity: "medium",   title: "证件即将过期",    desc: "护照将在 30 天内过期" },
  { category: "login",   severity: "medium",   title: "异地登录",        desc: "从陌生国家登录" },
  { category: "login",   severity: "high",     title: "登录失败激增",    desc: "24h 内 8 次登录失败" },
  { category: "aml",     severity: "critical", title: "制裁名单匹配",    desc: "OFAC SDN 列表匹配度 95%" },
  { category: "aml",     severity: "high",     title: "PEP 匹配",        desc: "Politically Exposed Person 命中" },
  { category: "device",  severity: "medium",   title: "VPN 登录",        desc: "检测到 VPN / 代理 IP" },
  { category: "device",  severity: "low",      title: "新设备登录",      desc: "首次使用此设备登录" },
];

const STAFF = ["Alice Chen", "Bob Martin", "Carol Wong"];

function generateMockEvents(userId: string): RiskEvent[] {
  const r = seededRng(`${userId}:risk-events`);
  const h = rngHelpers(r);
  const count = h.int(2, 12);
  const out: RiskEvent[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const tpl = h.pick(EVENT_TEMPLATES);
    const status: EventStatus = h.weighted([
      ["open",           25],
      ["investigating",  20],
      ["resolved",       40],
      ["false_positive", 15],
    ]);
    const resolved = status === "resolved" || status === "false_positive";

    out.push({
      id: `re_${userId.slice(-6)}_${i}`,
      category: tpl.category,
      severity: tpl.severity,
      title: tpl.title,
      description: tpl.desc,
      status,
      handler: resolved ? h.pick(STAFF) : (status === "investigating" ? h.pick(STAFF) : undefined),
      handledAt: resolved ? new Date(now - h.int(1, 30) * 86400_000).toISOString() : undefined,
      resolution: status === "resolved"
        ? h.pick([
            "已处理 — 已限制账户",
            "客户解释合理，已通过",
            "升级到 Compliance 复核",
          ])
        : status === "false_positive"
        ? "误报 — 关闭"
        : undefined,
      createdAt: new Date(now - h.int(1, 180) * 86400_000).toISOString(),
    });
  }

  return out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export default function RiskEventsTab({ data }: BaseTabProps) {
  const { user } = data;
  const events = useMemo(() => generateMockEvents(user.id), [user.id]);

  const [statusFilter, setStatusFilter] = useState<"all" | EventStatus>("all");

  const filtered = statusFilter === "all" ? events : events.filter((e) => e.status === statusFilter);

  const counts = {
    open: events.filter((e) => e.status === "open").length,
    investigating: events.filter((e) => e.status === "investigating").length,
    resolved: events.filter((e) => e.status === "resolved").length,
    false_positive: events.filter((e) => e.status === "false_positive").length,
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-0.5">风险事件</h3>
        <p className="text-xs text-slate-500">
          {events.length === 0
            ? "无风险事件记录"
            : <>
                共 {events.length} 条
                {counts.open > 0 && <span className="text-red-700"> · {counts.open} 项待处理</span>}
              </>
          }
        </p>
      </div>

      {/* Status filter chips */}
      <div className="inline-flex bg-slate-100 rounded-lg p-0.5">
        <FilterButton label="全部"   count={events.length}        active={statusFilter === "all"}            onClick={() => setStatusFilter("all")} />
        <FilterButton label="待处理" count={counts.open}          active={statusFilter === "open"}           onClick={() => setStatusFilter("open")} />
        <FilterButton label="调查中" count={counts.investigating} active={statusFilter === "investigating"} onClick={() => setStatusFilter("investigating")} />
        <FilterButton label="已处理" count={counts.resolved}      active={statusFilter === "resolved"}      onClick={() => setStatusFilter("resolved")} />
        <FilterButton label="误报"   count={counts.false_positive} active={statusFilter === "false_positive"} onClick={() => setStatusFilter("false_positive")} />
      </div>

      {/* Event list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          {statusFilter === "all" ? "无风险事件" : "该状态下无记录"}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((e) => <EventCard key={e.id} event={e} />)}
        </ul>
      )}
    </div>
  );
}

function FilterButton({ label, count, active, onClick }: {
  label: string; count: number; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 h-7 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
      }`}
    >
      <span>{label}</span>
      {count > 0 && <span className="text-[10px] tabular-nums text-slate-400">{count}</span>}
    </button>
  );
}

function EventCard({ event }: { event: RiskEvent }) {
  const catMeta = CATEGORY_META[event.category];
  const CatIcon = catMeta.icon;
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-3.5">
      <div className="flex items-start gap-3">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium shrink-0 mt-0.5 ${catMeta.tone}`}>
          <CatIcon className="w-3 h-3" />
          {catMeta.label}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-slate-800">{event.title}</h4>
            <span className={`px-1.5 py-0.5 rounded text-[10.5px] font-medium border ${SEVERITY_TONE[event.severity]}`}>
              {SEVERITY_LABEL[event.severity]}
            </span>
            <span className="ml-auto text-[11px] text-slate-400 tabular-nums">
              {shortDateTime(event.createdAt)}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">{event.description}</p>

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
              event.status === "open" ? "bg-red-50 text-red-700"
              : event.status === "investigating" ? "bg-amber-50 text-amber-700"
              : event.status === "resolved" ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-700"
            }`}>
              {STATUS_LABEL[event.status]}
            </span>
            {event.handler && (
              <span className="text-[11px] text-slate-500">
                处理人 <span className="text-slate-700">{event.handler}</span>
              </span>
            )}
            {event.resolution && (
              <span className="text-[11px] text-slate-500 italic">
                「{event.resolution}」
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
