"use client";

/**
 * WalletAddressesTab — 客户加密钱包地址 (P1, 2026-05-15).
 *
 * 客户用于加密入金/出金的钱包。每个钱包都有：
 *   - 网络（TRC20 / ERC20 / BTC / SOL / BNB Chain）
 *   - 地址 (full + ellipsized)
 *   - 风险评分（来自链上分析服务 Chainalysis / TRM Labs 等）
 *   - 风险标签（混币器交互 / 黑名单接触 / 制裁地址等）
 *   - 累计交易量
 */

import { useMemo } from "react";
import { Coins, AlertTriangle, ShieldCheck, Copy, Plus } from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";
import { seededRng, rngHelpers, timeAgo } from "./_shared/mock-prng";

type WalletNetwork = "TRC20" | "ERC20" | "BTC" | "SOL" | "BSC";
type RiskTier = "clean" | "low" | "medium" | "high";

interface WalletAddress {
  id: string;
  network: WalletNetwork;
  address: string;
  label?: string;
  isDefault: boolean;
  riskScore: number;       // 0-100
  riskTier: RiskTier;
  riskTags: string[];
  totalDeposit: number;
  totalWithdrawal: number;
  lastUsedAt?: string;
  addedAt: string;
}

const NETWORK_PREFIXES: Record<WalletNetwork, string> = {
  TRC20: "T",
  ERC20: "0x",
  BTC:   "bc1",
  SOL:   "",
  BSC:   "0x",
};

const RISK_TAG_POOL = [
  "曾接触混币服务",
  "与黑名单地址有交互",
  "OFAC 制裁地址（已封锁）",
  "可疑交易模式",
  "新地址（无历史）",
];

function genAddress(network: WalletNetwork, r: () => number): string {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const len = network === "BTC" ? 42 : network === "SOL" ? 44 : 40;
  let s = NETWORK_PREFIXES[network];
  for (let i = 0; i < len; i++) s += chars[Math.floor(r() * chars.length)];
  return s;
}

function tierFromScore(score: number): RiskTier {
  if (score < 20) return "clean";
  if (score < 50) return "low";
  if (score < 80) return "medium";
  return "high";
}

function generateMockWallets(userId: string): WalletAddress[] {
  const r = seededRng(`${userId}:wallets`);
  const h = rngHelpers(r);
  const count = h.bool(0.7) ? h.int(1, 3) : 0;
  const now = Date.now();
  const out: WalletAddress[] = [];

  for (let i = 0; i < count; i++) {
    const network: WalletNetwork = h.weighted([
      ["TRC20", 50], ["ERC20", 25], ["BTC", 12], ["BSC", 8], ["SOL", 5],
    ]);
    const riskScore = h.weighted([
      [h.int(0, 19),   60],
      [h.int(20, 49),  25],
      [h.int(50, 79),  10],
      [h.int(80, 100),  5],
    ]);
    const tier = tierFromScore(riskScore);

    const tags: string[] = [];
    if (tier === "medium" || tier === "high") tags.push(h.pick(RISK_TAG_POOL.slice(0, 4)));
    if (tier === "high" && h.bool(0.4)) tags.push(RISK_TAG_POOL[2]); // OFAC
    if (h.bool(0.15)) tags.push(RISK_TAG_POOL[4]); // 新地址

    const totalDeposit = tier === "high" ? 0 : h.int(0, 50000);
    const totalWithdrawal = h.int(0, Math.floor(totalDeposit * 0.6));

    out.push({
      id: `wlt_${userId.slice(-6)}_${i}`,
      network,
      address: genAddress(network, r),
      label: h.bool(0.3) ? h.pick(["Binance Hot", "Personal Cold", "Trading Hot", "OKX Withdraw"]) : undefined,
      isDefault: i === 0 && tier !== "high",
      riskScore,
      riskTier: tier,
      riskTags: tags,
      totalDeposit,
      totalWithdrawal,
      lastUsedAt: totalDeposit > 0 ? new Date(now - h.int(1, 60) * 86400_000).toISOString() : undefined,
      addedAt: new Date(now - h.int(30, 365) * 86400_000).toISOString(),
    });
  }
  return out;
}

const TIER_LABEL: Record<RiskTier, string> = {
  clean: "干净", low: "低风险", medium: "中风险", high: "高风险",
};

const TIER_TONE: Record<RiskTier, string> = {
  clean:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  low:    "bg-slate-50 text-slate-700 border-slate-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high:   "bg-red-50 text-red-700 border-red-200",
};

function shorten(addr: string): string {
  return addr.length <= 16 ? addr : `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

export default function WalletAddressesTab({ data }: BaseTabProps) {
  const { user } = data;
  const wallets = useMemo(() => generateMockWallets(user.id), [user.id]);

  const highRisk = wallets.filter((w) => w.riskTier === "high").length;
  const totalDeposit = wallets.reduce((s, w) => s + w.totalDeposit, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-0.5">钱包地址</h3>
          <p className="text-xs text-slate-500">
            {wallets.length} 个地址 ·
            {highRisk > 0 ? <span className="text-red-700"> {highRisk} 个高风险</span> : <span className="text-emerald-700"> 全部健康</span>}
          </p>
        </div>
        <button className="h-8 px-3 text-sm font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          添加地址
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="地址数"   value={`${wallets.length}`} icon={<Coins className="w-3.5 h-3.5 text-slate-400" />} />
        <StatCard
          label="高风险地址"
          value={`${highRisk}`}
          icon={<AlertTriangle className={`w-3.5 h-3.5 ${highRisk > 0 ? "text-red-500" : "text-slate-400"}`} />}
          tone={highRisk > 0 ? "danger" : "neutral"}
        />
        <StatCard label="累计入金" value={`$${totalDeposit.toLocaleString()}`} icon={<ShieldCheck className="w-3.5 h-3.5 text-slate-400" />} />
      </div>

      {wallets.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          客户未绑定任何加密钱包地址
        </div>
      ) : (
        <div className="space-y-2">
          {wallets.map((w) => (
            <WalletCard key={w.id} wallet={w} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, tone = "neutral" }: {
  label: string; value: string; icon: React.ReactNode; tone?: "neutral" | "danger";
}) {
  const cls = tone === "danger" ? "text-red-700" : "text-slate-900";
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

function WalletCard({ wallet }: { wallet: WalletAddress }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-700">
          {wallet.network}
        </span>
        <span className="font-mono text-xs text-slate-700 select-all">
          {shorten(wallet.address)}
        </span>
        <button
          onClick={() => navigator.clipboard?.writeText(wallet.address)}
          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          title="复制完整地址"
        >
          <Copy className="w-3 h-3" />
        </button>
        {wallet.label && (
          <span className="text-[11px] text-slate-500 italic">{wallet.label}</span>
        )}
        {wallet.isDefault && (
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 rounded">默认</span>
        )}
        <span className={`ml-auto px-1.5 py-0.5 rounded text-[10.5px] font-medium border ${TIER_TONE[wallet.riskTier]}`}>
          {TIER_LABEL[wallet.riskTier]} · {wallet.riskScore}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
        {wallet.totalDeposit > 0 && (
          <span>入金 <span className="font-semibold text-slate-700 tabular-nums">${wallet.totalDeposit.toLocaleString()}</span></span>
        )}
        {wallet.totalWithdrawal > 0 && (
          <span>出金 <span className="font-semibold text-slate-700 tabular-nums">${wallet.totalWithdrawal.toLocaleString()}</span></span>
        )}
        {wallet.lastUsedAt && <span>最后使用 {timeAgo(wallet.lastUsedAt)}</span>}
        <span>添加 {timeAgo(wallet.addedAt)}</span>
      </div>

      {wallet.riskTags.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
          {wallet.riskTags.map((tag) => (
            <div key={tag} className="flex items-start gap-1.5 text-[11px] text-amber-800">
              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0 text-amber-600" />
              {tag}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
