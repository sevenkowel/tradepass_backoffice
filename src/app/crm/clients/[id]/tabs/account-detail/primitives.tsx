"use client";

/**
 * 账户工作台子组件共用原语。
 * 这些 building blocks 让 Overview / Trading / Funds / Controls / Activity / Settings
 * 的视觉风格保持一致：栅格 / 字段 / 区段标题 / 空状态。
 */

import { cn } from "@/lib/utils";

export function Section({
  title, action, children, dense = false,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  dense?: boolean;
}) {
  return (
    <section className={dense ? "mb-4" : "mb-6"}>
      <header className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h3>
        {action}
      </header>
      {children}
    </section>
  );
}

export function Card({
  children, className, padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "border border-slate-200 rounded-lg bg-white",
        padded && "p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Metric({
  label, value, sub, tone = "neutral", emphasize = false,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "neutral" | "ok" | "warn" | "danger" | "info";
  emphasize?: boolean;
}) {
  const toneCls = {
    neutral: "text-slate-900",
    ok:      "text-emerald-700",
    warn:    "text-amber-700",
    danger:  "text-red-700",
    info:    "text-sky-700",
  }[tone];
  return (
    <div>
      <div className="text-[11px] text-slate-500">{label}</div>
      <div
        className={cn(
          "tabular-nums",
          emphasize ? "text-xl font-bold" : "text-base font-semibold",
          toneCls,
        )}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export function KVRow({
  label, value, tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "ok" | "warn" | "danger";
}) {
  const toneCls = {
    neutral: "text-slate-800",
    ok:      "text-emerald-700",
    warn:    "text-amber-700",
    danger:  "text-red-700",
  }[tone];
  return (
    <div className="flex items-baseline justify-between gap-2 py-1.5 border-b border-slate-100 last:border-b-0">
      <dt className="text-xs text-slate-500 shrink-0">{label}</dt>
      <dd className={cn("tabular-nums font-medium text-sm", toneCls)}>{value}</dd>
    </div>
  );
}

export function Empty({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="py-12 text-center text-sm text-slate-400">
      {icon && <div className="mb-2 flex justify-center text-slate-300">{icon}</div>}
      {children}
    </div>
  );
}

export function fmtMoney(n: number, currency: string): string {
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "";
  const abs = Math.abs(n);
  const formatted = abs >= 10000
    ? abs.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : abs.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return `${n < 0 ? "-" : ""}${symbol}${formatted}${symbol ? "" : ` ${currency}`}`;
}

export function fmtPct(n: number, fractionDigits = 1): string {
  return `${(n * 100).toFixed(fractionDigits)}%`;
}

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US");
}

export function shortTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}
