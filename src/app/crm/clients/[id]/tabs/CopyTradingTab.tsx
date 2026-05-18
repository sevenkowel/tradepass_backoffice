"use client";

/**
 * CopyTradingTab — 跟单 (P2 简化版, 2026-05-15).
 *
 * 该客户在跟单系统里的两个身份：
 *   - 信号源（Signal Provider）— 被其他人跟随
 *   - 跟随者（Follower）— 跟随其他信号
 */

import { useMemo } from "react";
import {
  TrendingUp, Users, Copy, Award, Activity, BarChart3,
} from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";
import { seededRng, rngHelpers, timeAgo } from "./_shared/mock-prng";

interface SignalProfile {
  isProvider: boolean;
  followerCount: number;
  totalAUM: number;            // Assets Under Management (follower 资金)
  monthlyROI: number;          // 月化收益率
  winRate: number;
  totalCommission: number;
  rank?: number;
}

interface FollowedSignal {
  id: string;
  signalName: string;
  signalProviderUid: string;
  allocated: number;
  startedAt: string;
  totalPnL: number;
  status: "active" | "paused" | "stopped";
}

function generateMockCopyTrading(userId: string): { profile: SignalProfile; followed: FollowedSignal[] } {
  const r = seededRng(`${userId}:copy`);
  const h = rngHelpers(r);

  const isProvider = h.bool(0.15); // 15% 客户是信号源

  const profile: SignalProfile = isProvider ? {
    isProvider: true,
    followerCount: h.int(5, 500),
    totalAUM: h.int(10000, 1000000),
    monthlyROI: h.float(-5, 25),
    winRate: h.float(0.4, 0.75),
    totalCommission: h.int(100, 30000),
    rank: h.int(1, 200),
  } : {
    isProvider: false,
    followerCount: 0,
    totalAUM: 0,
    monthlyROI: 0,
    winRate: 0,
    totalCommission: 0,
  };

  // 跟随他人
  const followCount = h.bool(0.4) ? h.int(1, 5) : 0;
  const followed: FollowedSignal[] = [];
  for (let i = 0; i < followCount; i++) {
    const status: FollowedSignal["status"] = h.weighted([
      ["active", 60], ["paused", 25], ["stopped", 15],
    ]);
    followed.push({
      id: `cs_${userId.slice(-6)}_${i}`,
      signalName: h.pick(["Alpha Trader", "Steady Growth", "EUR Master", "Gold Hunter", "BTC Surfer", "Risk-Off Pro"]),
      signalProviderUid: `${h.int(10000000, 99999999)}`,
      allocated: h.int(500, 50000),
      startedAt: new Date(Date.now() - h.int(7, 365) * 86400_000).toISOString(),
      totalPnL: h.int(-3000, 8000),
      status,
    });
  }

  return { profile, followed };
}

const STATUS_LABEL: Record<FollowedSignal["status"], string> = {
  active: "跟随中", paused: "已暂停", stopped: "已停止",
};

const STATUS_TONE: Record<FollowedSignal["status"], string> = {
  active:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused:  "bg-amber-50 text-amber-700 border-amber-200",
  stopped: "bg-slate-50 text-slate-700 border-slate-200",
};

export default function CopyTradingTab({ data }: BaseTabProps) {
  const { user } = data;
  const { profile, followed } = useMemo(() => generateMockCopyTrading(user.id), [user.id]);

  const isInactive = !profile.isProvider && followed.length === 0;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-0.5">跟单</h3>
        <p className="text-xs text-slate-500">
          {isInactive
            ? "客户未参与跟单系统"
            : <>
                {profile.isProvider && <span className="text-blue-700 font-medium">信号源</span>}
                {profile.isProvider && followed.length > 0 && <span className="text-slate-400 mx-1">·</span>}
                {followed.length > 0 && <span className="text-emerald-700 font-medium">跟随 {followed.length} 个信号</span>}
              </>
          }
        </p>
      </div>

      {isInactive ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          <Copy className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          客户既不是信号源，也未跟随任何信号
        </div>
      ) : (
        <>
          {/* 信号源面板 */}
          {profile.isProvider && (
            <section className="rounded-xl border border-slate-200 bg-white">
              <header className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-violet-500" />
                <h4 className="text-sm font-semibold text-slate-800">信号源表现</h4>
                {profile.rank && (
                  <span className="ml-auto px-2 py-0.5 rounded text-[10.5px] font-medium bg-violet-50 text-violet-700">
                    全网排名 #{profile.rank}
                  </span>
                )}
              </header>
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                <Metric
                  label="跟随者数"
                  value={profile.followerCount.toString()}
                  icon={<Users className="w-3.5 h-3.5 text-slate-400" />}
                />
                <Metric
                  label="管理资金 (AUM)"
                  value={`$${profile.totalAUM.toLocaleString()}`}
                  icon={<BarChart3 className="w-3.5 h-3.5 text-slate-400" />}
                />
                <Metric
                  label="月化收益"
                  value={`${profile.monthlyROI >= 0 ? "+" : ""}${profile.monthlyROI.toFixed(1)}%`}
                  tone={profile.monthlyROI >= 0 ? "ok" : "danger"}
                  icon={<TrendingUp className="w-3.5 h-3.5 text-slate-400" />}
                />
                <Metric
                  label="胜率"
                  value={`${(profile.winRate * 100).toFixed(1)}%`}
                  tone={profile.winRate >= 0.55 ? "ok" : profile.winRate >= 0.4 ? "neutral" : "warn"}
                />
                <Metric
                  label="累计佣金"
                  value={`$${profile.totalCommission.toLocaleString()}`}
                  tone="ok"
                />
                <Metric label="活跃度" value="活跃" tone="ok" icon={<Activity className="w-3.5 h-3.5 text-slate-400" />} />
              </div>
            </section>
          )}

          {/* 跟随中的信号 */}
          {followed.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <header className="px-4 py-3 border-b border-slate-100">
                <h4 className="text-sm font-semibold text-slate-800">跟随中的信号 ({followed.length})</h4>
              </header>
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2">信号名称</th>
                    <th className="px-4 py-2 text-right">分配金额</th>
                    <th className="px-4 py-2 text-right">累计盈亏</th>
                    <th className="px-4 py-2 text-right">跟随时长</th>
                    <th className="px-4 py-2">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {followed.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        <div className="text-sm font-semibold text-slate-800">{f.signalName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{f.signalProviderUid}</div>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-sm">
                        ${f.allocated.toLocaleString()}
                      </td>
                      <td className={`px-4 py-2.5 text-right tabular-nums font-semibold text-sm ${
                        f.totalPnL >= 0 ? "text-emerald-700" : "text-red-700"
                      }`}>
                        {f.totalPnL >= 0 ? "+" : ""}${f.totalPnL.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-slate-500 tabular-nums">
                        {timeAgo(f.startedAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10.5px] font-medium border ${STATUS_TONE[f.status]}`}>
                          {STATUS_LABEL[f.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Metric({ label, value, sub, tone = "neutral", icon }: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "ok" | "warn" | "danger";
  icon?: React.ReactNode;
}) {
  const cls = tone === "ok" ? "text-emerald-700"
    : tone === "warn" ? "text-amber-700"
    : tone === "danger" ? "text-red-700"
    : "text-slate-900";
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[11px] text-slate-500">{label}</span>
      </div>
      <div className={`text-base font-bold tabular-nums ${cls}`}>{value}</div>
      {sub && <div className="text-[10.5px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}
