"use client";

/**
 * ReferralsTab — 客户推荐 (P1, 2026-05-15).
 *
 * 该客户的推荐网络：
 *   - 该客户**推荐给谁**（成为他人的推荐人）
 *   - 该客户**是谁推荐的**（被谁带来的）
 *   - 累计推荐奖金
 */

import { useMemo } from "react";
import {
  Users, UserPlus, TrendingUp, Award,
} from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";
import { seededRng, rngHelpers, timeAgo } from "./_shared/mock-prng";

interface Referee {
  id: string;
  name: string;
  uid: string;
  country: string;
  registeredAt: string;
  status: "active" | "inactive" | "churn";
  ftd: boolean;
  totalDeposit: number;
  totalCommission: number;        // 该客户从这位下线获得的累计返佣
}

interface Referrer {
  id: string;
  name: string;
  type: "client" | "ib";          // 上线是普通客户 还是 IB
  uid: string;
  referredAt: string;
}

const COUNTRIES = ["CN", "HK", "SG", "JP", "TH", "VN", "ID", "MY", "IN", "AE"];

function generateMockReferees(userId: string): Referee[] {
  const r = seededRng(`${userId}:referees`);
  const h = rngHelpers(r);
  // 70% 客户没有推荐（普通用户），30% 有推荐
  const count = h.bool(0.7) ? 0 : h.int(1, 12);
  const out: Referee[] = [];

  for (let i = 0; i < count; i++) {
    const ftd = h.bool(0.6);
    out.push({
      id: `ref_${userId.slice(-6)}_${i}`,
      name: `Client ${h.int(1000, 9999)}`,
      uid: `${h.int(10000000, 99999999)}`,
      country: h.pick(COUNTRIES),
      registeredAt: new Date(Date.now() - h.int(7, 365) * 86400_000).toISOString(),
      status: h.weighted([
        ["active",   55],
        ["inactive", 25],
        ["churn",    20],
      ]),
      ftd,
      totalDeposit: ftd ? h.int(100, 50000) : 0,
      totalCommission: ftd ? h.int(10, 500) : 0,
    });
  }

  return out.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
}

function generateReferrer(userId: string): Referrer | null {
  const r = seededRng(`${userId}:referrer`);
  const h = rngHelpers(r);
  if (h.bool(0.5)) return null;
  return {
    id: `up_${userId.slice(-6)}`,
    name: h.bool(0.7) ? `IB Partner ${h.int(100, 999)}` : `Client ${h.int(1000, 9999)}`,
    type: h.bool(0.7) ? "ib" : "client",
    uid: `${h.int(10000000, 99999999)}`,
    referredAt: new Date(Date.now() - h.int(30, 730) * 86400_000).toISOString(),
  };
}

const STATUS_LABEL: Record<Referee["status"], string> = {
  active: "活跃", inactive: "不活跃", churn: "流失",
};
const STATUS_TONE: Record<Referee["status"], string> = {
  active:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-50 text-slate-700 border-slate-200",
  churn:    "bg-red-50 text-red-700 border-red-200",
};

export default function ReferralsTab({ data }: BaseTabProps) {
  const { user } = data;
  const referees = useMemo(() => generateMockReferees(user.id), [user.id]);
  const referrer = useMemo(() => generateReferrer(user.id), [user.id]);

  const totalCommission = referees.reduce((s, r) => s + r.totalCommission, 0);
  const activeRefs = referees.filter((r) => r.status === "active").length;
  const ftdCount = referees.filter((r) => r.ftd).length;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-0.5">推荐网络</h3>
        <p className="text-xs text-slate-500">
          {referees.length === 0 && !referrer
            ? "该客户没有推荐网络"
            : <>
                推荐 {referees.length} 人{referrer && <span className="ml-1">· 由 {referrer.type === "ib" ? "IB" : "客户"} 引入</span>}
              </>
          }
        </p>
      </div>

      {/* 推荐人（上线） */}
      {referrer && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 inline-flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-slate-400" />
            上线推荐人
          </h4>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-800">{referrer.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10.5px] font-medium ${
                  referrer.type === "ib" ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700"
                }`}>
                  {referrer.type === "ib" ? "IB 合作伙伴" : "普通客户"}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                {referrer.uid} · 引入于 {timeAgo(referrer.referredAt)}
              </div>
            </div>
            <button className="h-7 px-2.5 text-xs text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50">
              查看详情
            </button>
          </div>
        </section>
      )}

      {/* 推荐统计 */}
      {referees.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="推荐总数"   value={`${referees.length}`}   icon={<UserPlus className="w-3.5 h-3.5 text-slate-400" />} />
          <StatCard label="活跃下线"   value={`${activeRefs}`}        icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-500" />} tone="ok" />
          <StatCard label="完成 FTD"   value={`${ftdCount}`}          icon={<Award className="w-3.5 h-3.5 text-amber-500" />} />
          <StatCard label="累计返佣"   value={`$${totalCommission.toLocaleString()}`} icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-500" />} tone="ok" />
        </div>
      )}

      {/* 推荐列表 */}
      {referees.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          <UserPlus className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          该客户尚未推荐任何客户
        </div>
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <header className="px-4 py-2.5 border-b border-slate-100">
            <h4 className="text-sm font-semibold text-slate-800">推荐的客户 ({referees.length})</h4>
          </header>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2">客户</th>
                <th className="px-4 py-2">国家</th>
                <th className="px-4 py-2">状态</th>
                <th className="px-4 py-2">FTD</th>
                <th className="px-4 py-2 text-right">累计入金</th>
                <th className="px-4 py-2 text-right">已获返佣</th>
                <th className="px-4 py-2 text-right">注册时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {referees.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <div className="text-sm font-medium text-slate-800">{r.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{r.uid}</div>
                  </td>
                  <td className="px-4 py-2.5 text-xs font-mono text-slate-600">{r.country}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10.5px] font-medium border ${STATUS_TONE[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {r.ftd
                      ? <span className="text-emerald-700 font-medium">✓ 已完成</span>
                      : <span className="text-slate-400">未完成</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-sm">
                    {r.totalDeposit > 0 ? `$${r.totalDeposit.toLocaleString()}` : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-sm font-medium text-emerald-700">
                    {r.totalCommission > 0 ? `+$${r.totalCommission.toLocaleString()}` : <span className="text-slate-300 font-normal">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-slate-500 tabular-nums">
                    {timeAgo(r.registeredAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, tone = "neutral" }: {
  label: string; value: string; icon: React.ReactNode; tone?: "neutral" | "ok";
}) {
  const cls = tone === "ok" ? "text-emerald-700" : "text-slate-900";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[11px] text-slate-500">{label}</span>
      </div>
      <div className={`text-lg font-bold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}
