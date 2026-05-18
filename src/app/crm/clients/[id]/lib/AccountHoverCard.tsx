"use client";

/**
 * AccountHoverCard (P1-11) — 账户行 hover 出小预览卡.
 *
 * 让运营不必点开账户详情就能看到关键指标。Hover 200ms 显示，
 * 移出 100ms 隐藏（避免误触发）。卡片用 React.Portal 渲染，
 * 避免被表格的 overflow-hidden 裁剪。
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TradingAccount } from "@/types/backoffice/client-detail";

interface Props {
  account: TradingAccount;
  children: React.ReactNode;
}

const SHOW_DELAY = 200;
const HIDE_DELAY = 100;

export function AccountHoverCard({ account, children }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const showTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  const onEnter = () => {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
    showTimer.current = window.setTimeout(() => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) setPos({ x: rect.right + 8, y: rect.top });
      setOpen(true);
    }, SHOW_DELAY);
  };

  const onLeave = () => {
    if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null; }
    hideTimer.current = window.setTimeout(() => setOpen(false), HIDE_DELAY);
  };

  useEffect(() => () => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        className="cursor-default inline-block"
      >
        {children}
      </span>
      {open && pos && typeof window !== "undefined" && createPortal(
        <div
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          style={{
            position: "fixed",
            left: Math.min(pos.x, window.innerWidth - 300),
            top: Math.min(pos.y, window.innerHeight - 320),
            zIndex: 100,
          }}
          className="w-72 bg-white rounded-lg border border-slate-200 shadow-2xl overflow-hidden text-xs"
        >
          <AccountSummary account={account} />
        </div>,
        document.body,
      )}
    </>
  );
}

function AccountSummary({ account }: { account: TradingAccount }) {
  const tone = account.status === "active" ? "text-emerald-700 bg-emerald-50"
    : account.status === "restricted" ? "text-amber-700 bg-amber-50"
    : "text-red-700 bg-red-50";

  return (
    <div className="p-3 space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-900 tabular-nums">{account.mtAccount}</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
            {account.platform}
          </span>
        </div>
        <span className={`inline-flex items-center px-1.5 h-5 rounded text-[10px] font-bold ${tone}`}>
          {account.status}
        </span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        <Field label="账户类型" value={account.accountType} />
        <Field label="币种"     value={account.currency} />
        <Field label="杠杆"     value={account.leverage} />
        <Field label="模式"     value={account.tradingMode === "hedging" ? "对冲" : "净持仓"} />
      </div>

      <div className="h-px bg-slate-100" />

      {/* Financials */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        <Field label="余额"       value={`$${formatN(account.balance)}`} />
        <Field label="净值"       value={`$${formatN(account.equity)}`} emphasize />
        <Field label="可用保证金" value={`$${formatN(account.freeMargin)}`} />
        <Field label="保证金水平" value={account.marginLevel} />
      </div>

      <div className="h-px bg-slate-100" />

      {/* Flow */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        <Field label="累计入金" value={`$${formatN(account.totalDeposit)}`} />
        <Field label="累计出金" value={`$${formatN(account.totalWithdrawal)}`} />
      </div>

      {account.lastTradeAt && (
        <p className="text-[10.5px] text-slate-400 pt-1 border-t border-slate-100">
          最后交易: {new Date(account.lastTradeAt).toLocaleString("zh-CN", {
            month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}

function Field({ label, value, emphasize }: { label: string; value: string | number; emphasize?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`tabular-nums truncate ${emphasize ? "text-sm font-semibold text-slate-900" : "text-xs text-slate-700"}`}>
        {value}
      </div>
    </div>
  );
}

function formatN(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}
