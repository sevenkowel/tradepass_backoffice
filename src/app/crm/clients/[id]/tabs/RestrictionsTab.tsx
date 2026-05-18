"use client";

/**
 * RestrictionsTab — 限制汇总 (P1, 2026-05-15).
 *
 * 汇总所有对该客户生效的限制 — 来自客户级 / 账户级 / 风控引擎自动。
 * 运营进来一眼看到「这个客户目前被哪些限制约束」，不必逐个 Tab 查找。
 */

import { useMemo } from "react";
import {
  ShieldOff, Ban, Lock, AlertTriangle, Clock, Wallet,
  type LucideIcon,
} from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";
import { seededRng, rngHelpers, timeAgo } from "./_shared/mock-prng";

type RestrictionSource = "client_level" | "account_level" | "auto_risk" | "compliance" | "ops";
type RestrictionKind = "no_login" | "no_trading" | "no_deposit" | "no_withdrawal" | "readonly" | "leverage_cap" | "amount_cap";

interface Restriction {
  id: string;
  kind: RestrictionKind;
  source: RestrictionSource;
  scope: string;               // e.g. "全局" / "MT 5012345" / "USD 出金"
  reason: string;
  setBy: string;
  setAt: string;
  expiresAt?: string;
  isActive: boolean;
}

const KIND_META: Record<RestrictionKind, { label: string; icon: LucideIcon; tone: string }> = {
  no_login:      { label: "禁止登录",      icon: Ban,           tone: "bg-red-50 text-red-700 border-red-200" },
  no_trading:    { label: "禁止交易",      icon: ShieldOff,     tone: "bg-red-50 text-red-700 border-red-200" },
  no_deposit:    { label: "禁止入金",      icon: Lock,          tone: "bg-amber-50 text-amber-700 border-amber-200" },
  no_withdrawal: { label: "禁止出金",      icon: Lock,          tone: "bg-red-50 text-red-700 border-red-200" },
  readonly:      { label: "只读模式",      icon: Lock,          tone: "bg-violet-50 text-violet-700 border-violet-200" },
  leverage_cap:  { label: "杠杆上限",      icon: AlertTriangle, tone: "bg-amber-50 text-amber-700 border-amber-200" },
  amount_cap:    { label: "金额上限",      icon: Wallet,        tone: "bg-amber-50 text-amber-700 border-amber-200" },
};

const SOURCE_LABEL: Record<RestrictionSource, string> = {
  client_level:   "客户级",
  account_level:  "账户级",
  auto_risk:      "风控自动",
  compliance:     "合规要求",
  ops:            "运营调整",
};

const SOURCE_TONE: Record<RestrictionSource, string> = {
  client_level:  "bg-blue-50 text-blue-700",
  account_level: "bg-slate-100 text-slate-700",
  auto_risk:     "bg-orange-50 text-orange-700",
  compliance:    "bg-violet-50 text-violet-700",
  ops:           "bg-emerald-50 text-emerald-700",
};

const STAFF = ["Alice Chen", "Bob Martin", "Carol Wong", "Risk Engine"];
const REASONS = [
  "客户邮件申请",
  "合规审核要求",
  "风险评分触发",
  "AML 高风险标记",
  "保证金不足自动锁定",
  "KYC 重审期间临时锁定",
];

function generateMockRestrictions(userId: string): Restriction[] {
  const r = seededRng(`${userId}:restrictions`);
  const h = rngHelpers(r);
  // 60% 客户 0-1 个限制，30% 中风险 2-3 个，10% 高风险 4-6 个
  const count = h.weighted([
    [h.int(0, 1), 60],
    [h.int(2, 3), 30],
    [h.int(4, 6), 10],
  ]);

  const out: Restriction[] = [];
  const kinds: RestrictionKind[] = ["no_login", "no_trading", "no_deposit", "no_withdrawal", "readonly", "leverage_cap", "amount_cap"];
  const usedKinds = new Set<RestrictionKind>();

  for (let i = 0; i < count; i++) {
    const kind = h.pick(kinds);
    if (usedKinds.has(kind) && h.bool(0.5)) continue;
    usedKinds.add(kind);

    const source: RestrictionSource = h.weighted([
      ["client_level", 30],
      ["account_level", 25],
      ["auto_risk", 20],
      ["compliance", 15],
      ["ops", 10],
    ]);

    const hasExpiry = h.bool(0.4);
    const setAt = new Date(Date.now() - h.int(1, 90) * 86400_000).toISOString();
    const expiresAt = hasExpiry
      ? new Date(Date.now() + h.int(1, 30) * 86400_000).toISOString()
      : undefined;

    out.push({
      id: `rs_${userId.slice(-6)}_${i}`,
      kind,
      source,
      scope: source === "account_level"
        ? `MT ${h.int(8000000, 8999999)}`
        : source === "compliance"
        ? "全部账户"
        : "全局",
      reason: h.pick(REASONS),
      setBy: source === "auto_risk" ? "Risk Engine" : h.pick(STAFF),
      setAt,
      expiresAt,
      isActive: true,
    });
  }

  return out;
}

export default function RestrictionsTab({ data }: BaseTabProps) {
  const { user } = data;
  const restrictions = useMemo(() => generateMockRestrictions(user.id), [user.id]);

  const active = restrictions.filter((r) => r.isActive);

  // 按 source 分组
  const grouped = useMemo(() => {
    const m: Record<RestrictionSource, Restriction[]> = {
      client_level: [],
      account_level: [],
      auto_risk: [],
      compliance: [],
      ops: [],
    };
    for (const r of active) m[r.source].push(r);
    return m;
  }, [active]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-0.5">限制汇总</h3>
        <p className="text-xs text-slate-500">
          {active.length === 0
            ? <span className="text-emerald-700">当前无任何限制 — 客户可正常使用所有功能</span>
            : <>
                <span className="text-amber-700 font-medium">{active.length} 项限制生效中</span>
                <span className="text-slate-400 ml-2">含客户级 / 账户级 / 风控自动 / 合规 / 运营</span>
              </>
          }
        </p>
      </div>

      {active.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          <Lock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          无活跃限制
        </div>
      ) : (
        <div className="space-y-3">
          {(Object.entries(grouped) as [RestrictionSource, Restriction[]][])
            .filter(([, items]) => items.length > 0)
            .map(([source, items]) => (
              <section key={source} className="rounded-xl border border-slate-200 bg-white">
                <header className="px-4 py-2 border-b border-slate-100 flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10.5px] font-medium ${SOURCE_TONE[source]}`}>
                    {SOURCE_LABEL[source]}
                  </span>
                  <span className="text-xs text-slate-400">{items.length} 项</span>
                </header>
                <ul className="divide-y divide-slate-100">
                  {items.map((r) => <RestrictionRow key={r.id} r={r} />)}
                </ul>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}

function daysFromNow(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400_000);
}

function RestrictionRow({ r }: { r: Restriction }) {
  const meta = KIND_META[r.kind];
  const Icon = meta.icon;
  const expiresIn = r.expiresAt ? daysFromNow(r.expiresAt) : null;

  return (
    <li className="px-4 py-3 flex items-start gap-3">
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium border shrink-0 ${meta.tone}`}>
        <Icon className="w-3 h-3" />
        {meta.label}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-800">
          <span className="font-medium">{r.scope}</span>
          <span className="text-slate-400 mx-1.5">·</span>
          <span className="text-slate-600">{r.reason}</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
          <span>{r.setBy}</span>
          <span className="text-slate-300">·</span>
          <span>设置于 {timeAgo(r.setAt)}</span>
          {expiresIn != null && (
            <>
              <span className="text-slate-300">·</span>
              <span className={`inline-flex items-center gap-0.5 ${expiresIn <= 3 ? "text-amber-700 font-medium" : "text-slate-500"}`}>
                <Clock className="w-3 h-3" />
                {expiresIn <= 0 ? "已过期" : `${expiresIn} 天后到期`}
              </span>
            </>
          )}
        </div>
      </div>
      <button className="text-xs text-blue-600 hover:text-blue-800 shrink-0 mt-1">
        解除
      </button>
    </li>
  );
}
