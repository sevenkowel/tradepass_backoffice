"use client";

/**
 * FundsTab — v2 redesign (2026-05-14), aligned to the de-AI-fied design language.
 *
 *   - No rainbow tint cards. Three summary numbers in a tight stat strip.
 *   - Filter chips replace the previous solid-blue button group.
 *   - Records list uses a clean divided-row layout, no per-card chrome.
 *   - Money values are coloured only when the sign matters (negative = red).
 */

import { useState } from "react";
import { Ban, UserCheck, Download } from "lucide-react";
import type { FundRecord } from "@/types/backoffice/client-detail";
import type { BaseTabProps } from "@/types/backoffice/client";
import { useT } from "@/lib/i18n/LocaleProvider";
import { exportCsv, withTimestamp } from "../lib/csv-export";

export default function FundsTab({ data }: BaseTabProps) {
  const { t } = useT();
  const { funds, user } = data;
  const [filter, setFilter] = useState<"all" | "deposit" | "withdrawal">("all");

  const filtered = filter === "all" ? funds : funds.filter((f) => f.type === filter);

  /** CSV 导出当前筛选下的流水 */
  const handleExport = () => {
    exportCsv(
      withTimestamp(`funds-${user.uid}.csv`),
      filtered,
      [
        { label: "时间",     get: (f) => new Date(f.createdAt).toISOString() },
        { label: "类型",     get: (f) => f.type },
        { label: "方式",     get: (f) => f.method },
        { label: "金额",     get: (f) => f.amount },
        { label: "状态",     get: (f) => f.status },
        { label: "风险标记", get: (f) => f.riskFlags?.join("; ") ?? "" },
        { label: "审核人",   get: (f) => f.reviewedBy ?? "" },
        { label: "审核时间", get: (f) => f.reviewedAt ?? "" },
      ],
    );
  };
  const deposits    = funds.filter((f) => f.type === "deposit");
  const withdrawals = funds.filter((f) => f.type === "withdrawal");
  const flagged     = funds.filter((f) => f.riskFlags && f.riskFlags.length > 0);

  return (
    <div className="space-y-6">
      {/* Summary strip — no cards, no rainbows. */}
      <section className="grid grid-cols-3 gap-8 max-w-xl">
        <Stat label={t("clients.detail.funds.totalDeposit")}
              value={`$${deposits.reduce((s, f) => s + f.amount, 0).toLocaleString()}`} />
        <Stat label={t("clients.detail.funds.totalWithdrawal")}
              value={`$${Math.abs(withdrawals.reduce((s, f) => s + f.amount, 0)).toLocaleString()}`} />
        <Stat
          label={t("clients.detail.funds.riskFlags")}
          value={String(flagged.length)}
          tone={flagged.length > 0 ? "danger" : "default"}
        />
      </section>

      {/* Filter chips */}
      <section className="border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          {(["all", "deposit", "withdrawal"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`h-7 px-2.5 text-xs font-medium rounded-md border transition-colors ${
                filter === type
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {type === "all"
                ? t("clients.detail.funds.filterAll")
                : type === "deposit"
                  ? t("clients.detail.funds.filterDeposit")
                  : t("clients.detail.funds.filterWithdrawal")}
            </button>
          ))}
          <span className="text-xs text-slate-400 ml-auto tabular-nums">
            {filtered.length} / {funds.length}
          </span>
          <button
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-[11px] font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            title="导出当前筛选下的流水为 CSV"
          >
            <Download className="w-3 h-3" />
            CSV
          </button>
        </div>
      </section>

      {/* Records — divided rows */}
      <section>
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            {t("clients.detail.funds.empty")}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((fund) => (
              <FundRow key={fund.id} fund={fund} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function FundRow({ fund }: { fund: FundRecord }) {
  const { t, locale } = useT();
  const isDeposit = fund.type === "deposit";
  const dateLocale =
    locale === "zh" ? "zh-CN" : locale === "ja" ? "ja-JP" : locale === "es" ? "es-ES" : "en-US";

  const statusKey = `clients.detail.funds.status.${fund.status}`;
  const methodKey = `clients.detail.funds.method.${fund.method}`;

  return (
    <li className="py-3 flex items-center gap-4 text-sm">
      <span className="shrink-0 w-32 text-xs text-slate-400 tabular-nums">
        {new Date(fund.createdAt).toLocaleString(dateLocale, {
          month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
        })}
      </span>
      <span className={`shrink-0 w-16 text-xs font-semibold uppercase tracking-wider ${
        isDeposit ? "text-emerald-700" : "text-slate-700"
      }`}>
        {isDeposit ? t("clients.detail.funds.deposit") : t("clients.detail.funds.withdrawal")}
      </span>
      <span className="text-slate-600 text-xs truncate flex-1">
        {t(methodKey) ?? fund.method}
        {fund.riskFlags && fund.riskFlags.length > 0 && (
          <span className="ml-2 text-amber-600">· {fund.riskFlags.join(", ")}</span>
        )}
      </span>
      <span className={`shrink-0 text-right font-medium tabular-nums ${
        isDeposit ? "text-emerald-700" : fund.amount < 0 ? "text-red-700" : "text-slate-800"
      }`}>
        {isDeposit ? "+" : ""}${Math.abs(fund.amount).toLocaleString()}
      </span>
      <span className={`shrink-0 w-24 text-right text-xs ${statusTone(fund.status)}`}>
        {t(statusKey) ?? fund.status}
      </span>
      {fund.status === "manual_review" && (
        <span className="shrink-0 flex items-center gap-1">
          <button className="p-1 rounded hover:bg-emerald-50 text-emerald-600" title="Approve">
            <UserCheck className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 rounded hover:bg-red-50 text-red-600" title="Reject">
            <Ban className="w-3.5 h-3.5" />
          </button>
        </span>
      )}
    </li>
  );
}

function statusTone(s: string): string {
  switch (s) {
    case "completed": return "text-emerald-700";
    case "rejected":  return "text-red-700";
    case "frozen":    return "text-red-700";
    case "manual_review": return "text-amber-700";
    case "pending":   return "text-amber-700";
    default:          return "text-slate-500";
  }
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "default" | "danger" | "ok" }) {
  const t = tone ?? "default";
  const cls = t === "danger" ? "text-red-700"
    : t === "ok" ? "text-emerald-700"
    : "text-slate-900";
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}
