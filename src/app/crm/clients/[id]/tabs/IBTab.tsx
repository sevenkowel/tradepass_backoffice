"use client";

/**
 * IBTab — IB 关系与上下游一键跳转 (P1-N6, 2026-05-17 升级).
 *
 * 显示内容：
 *   - 当前客户是否被 IB 邀请：上游 IB 名字 + 一键跳到 IB 主页
 *   - 当前客户是否本身是 IB（按 user.role / user.tags 判定）：
 *     展示其推荐的客户数 + 下钻入口
 *   - 跳到完整 IB 树视图（/crm/ib/tree）
 *
 * 数据派生（mock 占位）：未来接 ibService.getRelations(clientId) 时
 * 直接替换 deriveIbInfo 内部。
 */

import { Network, ArrowRight, ArrowUp, Users } from "lucide-react";
import Link from "next/link";
import type { BaseTabProps } from "@/types/backoffice/client";
import { useT } from "@/lib/i18n/LocaleProvider";
import { lookupIB } from "@/lib/clm/mock";

export default function IBTab({ data }: BaseTabProps) {
  const { t } = useT();
  const { user } = data;

  // 派生：是否被某 IB 邀请（mock — 实际从 user.ibReferral 字段读）
  const ibReferralId = (user as { ibReferral?: string }).ibReferral
    ?? (user as { ibId?: string }).ibId
    ?? null;
  const upstream = ibReferralId ? lookupIB(ibReferralId) : null;

  // 派生：是否本身是 IB（基于 role / tags）
  const isPartner = user.role === "partner" || (user.tags ?? []).includes("partner");
  const isAffiliate = user.role === "affiliate" || (user.tags ?? []).includes("affiliate");

  const referredCount = isPartner ? mockReferralCount(user.id) : 0;
  const referredFtdCount = isPartner ? Math.round(referredCount * 0.6) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-0.5">
          {t("clients.detail.ib.title")}
        </h3>
        <p className="text-xs text-slate-500">客户与 IB 网络的关系</p>
      </div>

      {/* 上游 IB（邀请人）*/}
      <section className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <ArrowUp className="w-3.5 h-3.5 text-slate-400" />
          <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
            上游 — 谁邀请了 TA
          </h4>
        </div>
        {upstream ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {upstream.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{upstream.name}</p>
                <p className="text-[11px] text-slate-500 font-mono">{upstream.uid} · IB Tier {upstream.tier ?? "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Link
                href={`/crm/clients/${upstream.uid}`}
                className="inline-flex items-center gap-1 px-3 h-8 rounded-md border border-blue-200 text-primary hover:bg-blue-50 text-xs font-medium"
              >
                打开主页
                <ArrowRight className="w-3 h-3" />
              </Link>
              <Link
                href={`/crm/ib/tree?ibId=${encodeURIComponent(upstream.uid)}`}
                className="inline-flex items-center gap-1 px-3 h-8 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
              >
                <Network className="w-3 h-3" />
                看下游
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-2">该客户没有上游 IB（自主注册）</p>
        )}
      </section>

      {/* 下游 — 被该客户邀请的人 */}
      <section className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
            下游 — TA 邀请的客户
          </h4>
        </div>
        {!isPartner && !isAffiliate ? (
          <p className="text-xs text-slate-400 py-2">
            该客户不是 IB / Affiliate，无下游网络
          </p>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="grid grid-cols-3 gap-x-6 gap-y-1 text-xs">
              <Stat label="累计推荐" value={referredCount} />
              <Stat label="FTD 客户" value={referredFtdCount} />
              <Stat label="活跃客户" value={Math.round(referredFtdCount * 0.7)} />
            </div>
            <Link
              href={`/crm/ib/tree?clientId=${encodeURIComponent(user.id)}`}
              className="inline-flex items-center gap-1 px-3 h-8 rounded-md bg-blue-50 text-primary hover:bg-blue-100 text-xs font-medium"
            >
              <Network className="w-3 h-3" />
              打开 IB 树
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </section>

      {/* 入口卡 — 让运营随时跳到 IB 模块 */}
      <Link
        href={`/crm/ib/tree?clientId=${encodeURIComponent(user.id)}`}
        className="block bg-white rounded-xl border border-dashed border-slate-300 p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors group"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Network className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800">查看完整 IB 网络</p>
              <p className="text-[11px] text-slate-500">力导图视角，可看多跳关系 / 佣金链路</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary flex-shrink-0" />
        </div>
      </Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[10.5px] text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="text-base font-bold tabular-nums text-slate-900">{value}</div>
    </div>
  );
}

/** Mock：根据 userId 派生推荐数（deterministic）。 */
function mockReferralCount(userId: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < userId.length; i++) {
    h = (h ^ userId.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return 10 + (h % 200); // 10-209
}
