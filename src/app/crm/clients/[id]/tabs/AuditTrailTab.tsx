"use client";

/**
 * AuditTrailTab — 变更记录（旧称"审计追踪"，2026-05-17 增强）.
 *
 * 系统级字段变更审计 — 每一次客户字段的修改都有 before/after diff、操作员、
 * IP、时间。用于 Compliance / Audit 团队的合规审查。
 *
 * 跟「Operations Logs」的区别：
 *   - Operation Logs：运营人员对客户做的「业务操作」（限制账户 / 重审 KYC）
 *   - Audit Trail：系统级「字段级 diff」，连客户自己改资料都会记录
 *
 * 2026-05-17：实体筛选从原生 <select>（技术 ID + 系统弹窗）换成自定义
 * EntityFilterDropdown —— 中文 label + 图标 + 数量 + 技术 ID 小字。
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  History, User, Server, Search, Download,
  IdCard, Shield, Lock, BarChart3, CreditCard, Coins,
  Database, Check, ChevronDown,
  type LucideIcon,
} from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";
import { seededRng, rngHelpers, shortDateTime } from "./_shared/mock-prng";
import { exportCsv, withTimestamp } from "../lib/csv-export";

type ActorType = "user" | "operator" | "system";

interface AuditEntry {
  id: string;
  entity: string;
  field: string;
  oldValue: string;
  newValue: string;
  actorType: ActorType;
  actorName: string;
  ipAddress: string;
  timestamp: string;
}

const ENTITIES = ["client.profile", "client.kyc", "client.permissions", "trading_account", "bank_account", "wallet_address"];

const FIELD_TEMPLATES: { entity: string; field: string; old: string; new: string; actor: ActorType }[] = [
  { entity: "client.profile",      field: "displayName",         old: "Old Name", new: "New Name",       actor: "user" },
  { entity: "client.profile",      field: "phone",               old: "+86 13800001111", new: "+86 13800002222", actor: "user" },
  { entity: "client.profile",      field: "language",            old: "en",       new: "zh",             actor: "user" },
  { entity: "client.kyc",          field: "status",              old: "pending",  new: "verified",       actor: "operator" },
  { entity: "client.kyc",          field: "expiryDate",          old: "2026-01-15", new: "2031-01-15",  actor: "operator" },
  { entity: "client.permissions",  field: "withdrawalAllowed",   old: "true",     new: "false",          actor: "operator" },
  { entity: "client.permissions",  field: "tradingAllowed",      old: "true",     new: "false",          actor: "system" },
  { entity: "trading_account",     field: "leverage",            old: "1:100",    new: "1:200",          actor: "operator" },
  { entity: "trading_account",     field: "group",               old: "live\\standard", new: "live\\vip", actor: "operator" },
  { entity: "trading_account",     field: "status",              old: "active",   new: "restricted",     actor: "system" },
  { entity: "bank_account",        field: "verificationStatus",  old: "pending",  new: "verified",       actor: "operator" },
  { entity: "wallet_address",      field: "riskScore",           old: "12",       new: "78",             actor: "system" },
];

const STAFF = ["Alice Chen", "Bob Martin", "Carol Wong", "David Liu"];

function generateMockAudit(userId: string, userName: string): AuditEntry[] {
  const r = seededRng(`${userId}:audit-trail`);
  const h = rngHelpers(r);
  const count = h.int(20, 60);
  const out: AuditEntry[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const tpl = h.pick(FIELD_TEMPLATES);
    out.push({
      id: `audit_${userId.slice(-6)}_${i}`,
      entity: tpl.entity,
      field: tpl.field,
      oldValue: tpl.old,
      newValue: tpl.new,
      actorType: tpl.actor,
      actorName: tpl.actor === "user" ? userName : tpl.actor === "system" ? "System" : h.pick(STAFF),
      ipAddress: tpl.actor === "system" ? "internal" : `${h.int(1, 223)}.${h.int(0, 255)}.${h.int(0, 255)}.${h.int(1, 254)}`,
      timestamp: new Date(now - h.int(1, 365) * 86400_000 - h.int(0, 86400_000)).toISOString(),
    });
  }

  return out.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

const ACTOR_TONE: Record<ActorType, string> = {
  user:     "bg-blue-50 text-blue-700",
  operator: "bg-violet-50 text-violet-700",
  system:   "bg-slate-100 text-slate-700",
};

const ACTOR_LABEL: Record<ActorType, string> = {
  user:     "客户",
  operator: "运营",
  system:   "系统",
};

/* ─── 实体元数据：技术 ID → 中文 label / 图标 ──────────────────────────── */

const ENTITY_META: Record<string, { label: string; icon: LucideIcon }> = {
  "client.profile":     { label: "客户档案",  icon: IdCard },
  "client.kyc":         { label: "KYC 资料",  icon: Shield },
  "client.permissions": { label: "客户权限",  icon: Lock },
  "trading_account":    { label: "交易账户",  icon: BarChart3 },
  "bank_account":       { label: "银行账户",  icon: CreditCard },
  "wallet_address":     { label: "钱包地址",  icon: Coins },
};

function entityMeta(id: string): { label: string; icon: LucideIcon } {
  return ENTITY_META[id] ?? { label: id, icon: Database };
}

export default function AuditTrailTab({ data }: BaseTabProps) {
  const { user } = data;
  const entries = useMemo(() => generateMockAudit(user.id, user.name), [user.id, user.name]);

  const [search, setSearch] = useState("");
  const [actorFilter, setActorFilter] = useState<"all" | ActorType>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");

  // 实体筛选选项 — 每个实体附带在整个 entries 中的出现次数（不受 actorFilter / search 影响）。
  const entityOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) counts.set(e.entity, (counts.get(e.entity) ?? 0) + 1);
    return Array.from(counts.entries())
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count);
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (actorFilter !== "all" && e.actorType !== actorFilter) return false;
      if (entityFilter !== "all" && e.entity !== entityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !e.field.toLowerCase().includes(q) &&
          !e.oldValue.toLowerCase().includes(q) &&
          !e.newValue.toLowerCase().includes(q) &&
          !e.actorName.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [entries, search, actorFilter, entityFilter]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-0.5">审计追踪</h3>
          <p className="text-xs text-slate-500">字段级变更历史 — 共 {entries.length} 条 · {ENTITIES.length} 个实体</p>
        </div>
        <button
          onClick={() => exportCsv(
            withTimestamp(`audit-trail-${user.uid}.csv`),
            filtered,
            [
              { label: "时间",   get: (e) => e.timestamp },
              { label: "实体",   get: (e) => e.entity },
              { label: "字段",   get: (e) => e.field },
              { label: "旧值",   get: (e) => e.oldValue },
              { label: "新值",   get: (e) => e.newValue },
              { label: "操作类型", get: (e) => e.actorType },
              { label: "操作人", get: (e) => e.actorName },
              { label: "IP",     get: (e) => e.ipAddress },
            ],
          )}
          disabled={filtered.length === 0}
          className="h-8 px-3 text-sm font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          title="导出当前筛选下的审计记录为 CSV"
        >
          <Download className="w-3.5 h-3.5" />
          导出 CSV
        </button>
      </div>

      {/* 筛选器 */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索字段 / 值 / 操作人..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 pl-7 pr-3 text-xs border border-slate-200 rounded-md w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Actor filter */}
        <div className="inline-flex bg-slate-100 rounded-lg p-0.5">
          {(["all", "user", "operator", "system"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setActorFilter(a)}
              className={`px-3 h-7 text-xs font-medium rounded-md transition-all ${
                actorFilter === a ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {a === "all" ? "全部" : ACTOR_LABEL[a]}
            </button>
          ))}
        </div>

        {/* Entity filter — 自定义美化下拉 */}
        <EntityFilterDropdown
          value={entityFilter}
          options={entityOptions}
          totalCount={entries.length}
          onChange={setEntityFilter}
        />

        <span className="ml-auto text-xs text-slate-400 tabular-nums">{filtered.length} 条</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          无符合条件的审计记录
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2 w-[140px]">时间</th>
                <th className="px-4 py-2 w-[150px]">实体 · 字段</th>
                <th className="px-4 py-2">变更</th>
                <th className="px-4 py-2 w-[140px]">操作人</th>
                <th className="px-4 py-2 w-[120px] text-right">来源 IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.slice(0, 200).map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                    {shortDateTime(entry.timestamp)}
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-[11px] font-mono text-slate-500">{entry.entity}</div>
                    <div className="text-xs font-medium text-slate-800">{entry.field}</div>
                  </td>
                  <td className="px-4 py-2 text-xs">
                    <span className="font-mono text-slate-500 line-through">{entry.oldValue}</span>
                    <span className="text-slate-400 mx-2">→</span>
                    <span className="font-mono font-semibold text-slate-800">{entry.newValue}</span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      {entry.actorType === "system" ? <Server className="w-3 h-3 text-slate-400" />
                        : <User className="w-3 h-3 text-slate-400" />}
                      <span className="text-xs text-slate-700">{entry.actorName}</span>
                      <span className={`px-1 py-0.5 text-[9.5px] font-medium rounded ${ACTOR_TONE[entry.actorType]}`}>
                        {ACTOR_LABEL[entry.actorType]}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs font-mono text-slate-500 text-right tabular-nums">
                    {entry.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 200 && (
            <div className="px-4 py-2 text-[11px] text-slate-400 text-center border-t border-slate-100">
              显示最新 200 条 · 共 {filtered.length} 条
            </div>
          )}
        </div>
      )}
    </div>
  );
}

void History;

/* ─────────────────────────────────────────────────────────────────────────── */
/* EntityFilterDropdown — 自定义美化下拉                                       */
/*                                                                             */
/*   - Trigger: 与 search/filter 同一行的 pill 按钮，显示当前选中的实体        */
/*   - Panel: 弹层显示「全部」+ 各实体（图标 + 中文 label + 技术 ID 小字 +    */
/*     右侧 count chip），当前选中带 ✓                                         */
/*   - 行为：点击 trigger 切换；点击选项即选中且关闭；Esc / 点击外部关闭     */
/*   - 未来超过 8 个 entity 时启用 panel 内搜索框（这里 entities ≤ 6 暂不加）  */
/* ─────────────────────────────────────────────────────────────────────────── */

interface EntityFilterDropdownProps {
  value: string; // "all" 或具体 entity id
  options: { id: string; count: number }[];
  totalCount: number;
  onChange: (v: string) => void;
}

function EntityFilterDropdown({
  value, options, totalCount, onChange,
}: EntityFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const isAll = value === "all";
  const current = isAll ? null : entityMeta(value);

  // 点击外部 / Esc 关闭
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 h-7 px-2.5 text-xs rounded-md border transition-colors ${
          open
            ? "border-blue-300 bg-blue-50 text-primary"
            : isAll
              ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              : "border-blue-300 bg-blue-50 text-primary"
        }`}
      >
        <span className="text-slate-400 text-[10.5px] uppercase tracking-wider">实体</span>
        {isAll ? (
          <span className="font-medium">全部</span>
        ) : current && (
          <>
            <current.icon className="w-3 h-3" />
            <span className="font-medium">{current.label}</span>
          </>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Panel */}
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-1 z-50 min-w-[260px] bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
        >
          <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100">
            按实体筛选
          </p>
          <ul className="py-0.5 max-h-[320px] overflow-y-auto">
            {/* "All entities" 永远第一位 */}
            <EntityOption
              icon={Database}
              label="全部实体"
              hint={`${options.length} 类`}
              count={totalCount}
              active={isAll}
              onClick={() => { onChange("all"); setOpen(false); }}
            />
            <li className="border-t border-slate-50 my-0.5" />
            {options.map(({ id, count }) => {
              const meta = entityMeta(id);
              return (
                <EntityOption
                  key={id}
                  icon={meta.icon}
                  label={meta.label}
                  hint={id}
                  count={count}
                  active={value === id}
                  onClick={() => { onChange(id); setOpen(false); }}
                />
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function EntityOption({
  icon: Icon, label, hint, count, active, onClick,
}: {
  icon: LucideIcon;
  label: string;
  /** 副标题 — 显示技术 ID 或描述。 */
  hint?: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={active}
        onClick={onClick}
        className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors ${
          active ? "bg-blue-50" : "hover:bg-slate-50"
        }`}
      >
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? "text-primary" : "text-slate-400"}`} />
        <div className="min-w-0 flex-1">
          <div className={`text-xs font-medium truncate ${active ? "text-primary" : "text-slate-800"}`}>
            {label}
          </div>
          {hint && (
            <div className="text-[10px] font-mono text-slate-400 truncate">{hint}</div>
          )}
        </div>
        <span className={`text-[10px] tabular-nums font-medium px-1.5 py-0.5 rounded ${
          active ? "bg-blue-100 text-primary" : "bg-slate-100 text-slate-500"
        }`}>
          {count}
        </span>
        {active && <Check className="w-3 h-3 text-primary flex-shrink-0" />}
      </button>
    </li>
  );
}
