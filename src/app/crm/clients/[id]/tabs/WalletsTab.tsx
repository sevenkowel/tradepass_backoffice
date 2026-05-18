"use client";

/**
 * WalletsTab — 平台钱包视图（2026-05-16 新建）.
 *
 * v1 仅支持 **USD 单币种**钱包，所以页面通常只渲染 1 张卡。结构上保留
 * `.map` 形式，未来打开多币种时只需要 mockWallets 多返几张即可，UI 自动
 * 适配。
 *
 * 卡片信息：
 *   - 币种（USD）+ 状态徽章
 *   - 余额（大字号主显示）
 *   - 可用 / 冻结（次级，含进度条直观比例）
 *   - 24h 净流入（带 ↑/↓ 颜色提示）
 *   - 最近一次资金活动时间
 *
 * 卡片右侧操作（占位，未来对接）：
 *   - 调整冻结
 *   - 内部划转
 *   - 查看流水（切到 transactions 子 Tab）
 */

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Lock, RefreshCw, ArrowLeftRight, ScrollText } from "lucide-react";
import type { ClientWallet } from "@/types/backoffice/client-detail";
import type { BaseTabProps } from "@/types/backoffice/client";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function WalletsTab({ data }: BaseTabProps) {
  const { locale } = useT();
  const dateLocale =
    locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : locale === "es" ? "es-ES" : "en-US";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const jumpToTransactions = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "funds");
    params.set("sub", "transactions");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (data.wallets.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-slate-400">
        暂无钱包数据
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.wallets.map((w) => (
          <WalletCard
            key={w.id}
            wallet={w}
            dateLocale={dateLocale}
            onViewTransactions={jumpToTransactions}
          />
        ))}
      </div>

      {/* 说明文案 — 让运营理解钱包 vs 账户的关系 */}
      <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3 max-w-3xl">
        说明：钱包是客户在平台的「内部资金账户」，与 MT 交易账户独立。
        入金先进钱包，再由客户主动划转到具体的 MT 账户进行交易；提款时
        也是从钱包发起。当前版本仅支持 USD 单币种钱包。
      </p>
    </div>
  );
}

function WalletCard({
  wallet, dateLocale, onViewTransactions,
}: {
  wallet: ClientWallet;
  dateLocale: string;
  onViewTransactions: () => void;
}) {
  const isFrozen = wallet.status === "frozen";
  const utilization =
    wallet.balance > 0 ? Math.min(100, (wallet.frozen / wallet.balance) * 100) : 0;

  // 24h 流水颜色判断（0 视为中性）
  const flow24h = wallet.flow24h ?? 0;
  const flowTone =
    flow24h > 0 ? "text-emerald-700" : flow24h < 0 ? "text-red-700" : "text-slate-500";
  const flowArrow = flow24h > 0 ? "↑" : flow24h < 0 ? "↓" : "·";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col">
      {/* 头部：币种 + 状态 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
            $
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 tabular-nums">
              {wallet.currency}
            </div>
            <div className="text-[10px] text-slate-400">平台钱包</div>
          </div>
        </div>
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
            isFrozen
              ? "bg-red-50 text-red-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {isFrozen ? "冻结" : "Active"}
        </span>
      </div>

      {/* 余额 */}
      <div className="mb-3">
        <div className="text-[11px] text-slate-500">余额</div>
        <div className="text-2xl font-bold tabular-nums text-slate-900 mt-0.5">
          {fmtUsd(wallet.balance)}
        </div>
      </div>

      {/* 可用 / 冻结 进度条 */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
          <span className="flex items-center gap-1">
            可用 <span className="font-medium text-slate-700 tabular-nums">{fmtUsd(wallet.available)}</span>
          </span>
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" />
            冻结 <span className="font-medium text-slate-700 tabular-nums">{fmtUsd(wallet.frozen)}</span>
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400"
            style={{ width: `${utilization}%` }}
            title={`冻结占比 ${utilization.toFixed(1)}%`}
          />
        </div>
      </div>

      {/* 24h 流水 + 最近活动 */}
      <div className="grid grid-cols-2 gap-3 text-[11px] mb-3">
        <div>
          <div className="text-slate-500">24h 净流入</div>
          <div className={`font-semibold tabular-nums ${flowTone}`}>
            {flowArrow} {fmtUsdSigned(flow24h)}
          </div>
        </div>
        <div>
          <div className="text-slate-500">最近活动</div>
          <div className="font-medium text-slate-700 tabular-nums">
            {wallet.lastTransactionAt
              ? new Date(wallet.lastTransactionAt).toLocaleDateString(dateLocale, {
                  month: "2-digit",
                  day: "2-digit",
                })
              : "—"}
          </div>
        </div>
      </div>

      {/* 操作 */}
      <div className="flex items-center gap-1 mt-auto pt-3 border-t border-slate-100">
        <ActionBtn icon={ArrowLeftRight} label="划转" />
        <ActionBtn icon={RefreshCw} label="调整冻结" />
        <ActionBtn icon={ScrollText} label="查看流水" onClick={onViewTransactions} />
      </div>
    </div>
  );
}

function ActionBtn({
  icon: Icon, label, onClick,
}: {
  icon: typeof Lock;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 inline-flex items-center justify-center gap-1 h-7 text-[11px] font-medium rounded-md text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </button>
  );
}

function fmtUsd(n: number): string {
  const abs = Math.abs(n);
  return `$${abs.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmtUsdSigned(n: number): string {
  const abs = Math.abs(n);
  return `$${abs.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
