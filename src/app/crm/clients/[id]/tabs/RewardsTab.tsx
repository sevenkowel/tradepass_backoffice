"use client";

/**
 * RewardsTab — 客户奖励记录 (P2 简化版, 2026-05-15).
 *
 * 客户获得过的所有奖金 / Bonus / 返佣 / 推荐奖励等。
 * 用于 Retention / VIP 团队判断客户激励效果。
 */

import { useMemo, useState } from "react";
import { Gift, TrendingUp, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";
import { seededRng, rngHelpers, shortDateTime } from "./_shared/mock-prng";

type RewardType = "welcome_bonus" | "deposit_bonus" | "trading_rebate" | "referral_reward" | "loyalty" | "campaign";
type RewardStatus = "pending" | "credited" | "redeemed" | "expired" | "cancelled";

interface Reward {
  id: string;
  type: RewardType;
  status: RewardStatus;
  name: string;
  amount: number;
  currency: string;
  source: string;
  createdAt: string;
  creditedAt?: string;
  expiresAt?: string;
  conditions?: string;
}

const TYPE_LABEL: Record<RewardType, string> = {
  welcome_bonus:    "迎新奖金",
  deposit_bonus:    "入金赠金",
  trading_rebate:   "交易返佣",
  referral_reward:  "推荐奖励",
  loyalty:          "忠诚度",
  campaign:         "活动奖励",
};

const STATUS_LABEL: Record<RewardStatus, string> = {
  pending:    "待审核",
  credited:   "已发放",
  redeemed:   "已使用",
  expired:    "已过期",
  cancelled:  "已取消",
};

const STATUS_TONE: Record<RewardStatus, string> = {
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  credited:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  redeemed:  "bg-blue-50 text-blue-700 border-blue-200",
  expired:   "bg-slate-50 text-slate-700 border-slate-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const REWARDS_POOL: { type: RewardType; name: string; range: [number, number] }[] = [
  { type: "welcome_bonus",   name: "迎新福利 — 首次入金赠金 100%",   range: [50, 500] },
  { type: "deposit_bonus",   name: "Q2 入金赠金活动",                 range: [100, 1000] },
  { type: "trading_rebate",  name: "月度交易返佣 (50 lots+)",         range: [50, 800] },
  { type: "referral_reward", name: "推荐好友奖励",                    range: [50, 300] },
  { type: "loyalty",         name: "VIP 客户月度忠诚度奖励",          range: [200, 2000] },
  { type: "campaign",        name: "中秋节专属活动",                  range: [50, 200] },
  { type: "campaign",        name: "黑五狂欢节奖励",                  range: [100, 500] },
];

function generateMockRewards(userId: string): Reward[] {
  const r = seededRng(`${userId}:rewards`);
  const h = rngHelpers(r);
  const count = h.int(0, 10);
  const out: Reward[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const tpl = h.pick(REWARDS_POOL);
    const status: RewardStatus = h.weighted([
      ["pending",   10],
      ["credited",  35],
      ["redeemed",  35],
      ["expired",   15],
      ["cancelled",  5],
    ]);
    const amount = h.int(tpl.range[0], tpl.range[1]);
    const createdAt = new Date(now - h.int(1, 365) * 86400_000).toISOString();
    const credited = status === "credited" || status === "redeemed" || status === "expired";

    out.push({
      id: `rwd_${userId.slice(-6)}_${i}`,
      type: tpl.type,
      status,
      name: tpl.name,
      amount,
      currency: "USD",
      source: tpl.type === "referral_reward" ? "IB-1234" : "Marketing",
      createdAt,
      creditedAt: credited ? new Date(new Date(createdAt).getTime() + h.int(1, 7) * 86400_000).toISOString() : undefined,
      expiresAt: status === "expired"
        ? new Date(now - h.int(1, 90) * 86400_000).toISOString()
        : tpl.type !== "trading_rebate" && h.bool(0.6)
        ? new Date(now + h.int(30, 180) * 86400_000).toISOString()
        : undefined,
      conditions: tpl.type === "welcome_bonus"
        ? "需完成 5 lots 交易后释放"
        : tpl.type === "deposit_bonus"
        ? "需完成 10 lots 交易后释放"
        : undefined,
    });
  }

  return out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export default function RewardsTab({ data }: BaseTabProps) {
  const { user } = data;
  const rewards = useMemo(() => generateMockRewards(user.id), [user.id]);

  const [filter, setFilter] = useState<"all" | RewardStatus>("all");

  const filtered = filter === "all" ? rewards : rewards.filter((r) => r.status === filter);

  const totalCredited = rewards
    .filter((r) => r.status === "credited" || r.status === "redeemed")
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-0.5">奖励记录</h3>
        <p className="text-xs text-slate-500">
          {rewards.length === 0 ? "暂无奖励记录"
            : <>共 {rewards.length} 条 · 累计获得 <span className="text-emerald-700 font-medium">${totalCredited.toLocaleString()}</span></>
          }
        </p>
      </div>

      {/* 统计卡 */}
      <div className="grid grid-cols-4 gap-3">
        <SummaryCard
          label="累计奖励"
          value={`$${totalCredited.toLocaleString()}`}
          icon={<Gift className="w-3.5 h-3.5 text-emerald-500" />}
          tone="ok"
        />
        <SummaryCard
          label="待审核"
          value={`${rewards.filter((r) => r.status === "pending").length}`}
          icon={<Clock className="w-3.5 h-3.5 text-amber-500" />}
        />
        <SummaryCard
          label="已使用"
          value={`${rewards.filter((r) => r.status === "redeemed").length}`}
          icon={<CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
        />
        <SummaryCard
          label="已过期"
          value={`${rewards.filter((r) => r.status === "expired").length}`}
          icon={<XCircle className="w-3.5 h-3.5 text-slate-400" />}
        />
      </div>

      {/* Filter */}
      <div className="inline-flex bg-slate-100 rounded-lg p-0.5">
        <FilterButton label="全部"   active={filter === "all"}       onClick={() => setFilter("all")} />
        <FilterButton label="待审核" active={filter === "pending"}   onClick={() => setFilter("pending")} />
        <FilterButton label="已发放" active={filter === "credited"}  onClick={() => setFilter("credited")} />
        <FilterButton label="已使用" active={filter === "redeemed"}  onClick={() => setFilter("redeemed")} />
        <FilterButton label="已过期" active={filter === "expired"}   onClick={() => setFilter("expired")} />
      </div>

      {/* 列表 */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          <Gift className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          无奖励记录
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2">类型</th>
                <th className="px-4 py-2">奖励名称</th>
                <th className="px-4 py-2 text-right">金额</th>
                <th className="px-4 py-2">状态</th>
                <th className="px-4 py-2 text-right">创建时间</th>
                <th className="px-4 py-2 text-right">有效期</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((rwd) => (
                <tr key={rwd.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-xs">
                    <span className="px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-slate-100 text-slate-700">
                      {TYPE_LABEL[rwd.type]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="text-sm font-medium text-slate-800">{rwd.name}</div>
                    {rwd.conditions && (
                      <div className="text-[10px] text-slate-500 mt-0.5">{rwd.conditions}</div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-emerald-700">
                    +${rwd.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10.5px] font-medium border ${STATUS_TONE[rwd.status]}`}>
                      {STATUS_LABEL[rwd.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-slate-500 tabular-nums">
                    {shortDateTime(rwd.createdAt)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-slate-500 tabular-nums">
                    {rwd.expiresAt ? new Date(rwd.expiresAt).toLocaleDateString("zh-CN") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon, tone = "neutral" }: {
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

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 h-7 text-xs font-medium rounded-md transition-all ${
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
      }`}
    >
      {label}
    </button>
  );
}

void TrendingUp;
