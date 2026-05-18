"use client";

/**
 * BankAccountsTab — 客户绑定的银行账户列表 (P1, 2026-05-15).
 *
 * 客户用于入金/出金的银行账户。每个银行账户都有：
 *   - 银行名称 / SWIFT / 账号 (masked) / 持卡人姓名 / 币种
 *   - 验证状态（已验证 / 待审核 / 已拒绝）
 *   - 风险标记（持卡人姓名不匹配 / 国家不匹配 / 多账户共享等）
 *   - 用量统计（总入金 / 总出金 / 最近使用时间）
 */

import { useMemo } from "react";
import {
  Building2, ShieldCheck, AlertTriangle, Wallet, Plus,
} from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";
import { seededRng, rngHelpers, timeAgo } from "./_shared/mock-prng";

type VerificationStatus = "verified" | "pending" | "rejected";

interface BankAccount {
  id: string;
  bankName: string;
  swift: string;
  accountNumberMasked: string;
  holderName: string;
  country: string;
  currency: string;
  verificationStatus: VerificationStatus;
  isDefault: boolean;
  riskFlags: string[];
  totalDeposit: number;
  totalWithdrawal: number;
  lastUsedAt?: string;
  addedAt: string;
}

const BANKS: [string, string, string][] = [
  ["HSBC Hong Kong",        "HSBCHKHHHKH", "HK"],
  ["Standard Chartered",    "SCBLSG22XXX", "SG"],
  ["Citibank Singapore",    "CITISGSGXXX", "SG"],
  ["Bank of China HK",      "BKCHHKHHXXX", "HK"],
  ["DBS Bank",              "DBSSSGSGXXX", "SG"],
  ["JPMorgan Chase",        "CHASUS33XXX", "US"],
  ["Deutsche Bank",         "DEUTDEFFXXX", "DE"],
  ["Mitsubishi UFJ",        "BOTKJPJTXXX", "JP"],
  ["Emirates NBD",          "EBILAEADXXX", "AE"],
];

const RISK_FLAG_POOL = [
  "持卡人姓名不匹配",
  "账户国家与 KYC 国家不一致",
  "账户曾被其它客户使用",
  "首次使用 — 待 AML 审核",
];

function generateMockBanks(userId: string, clientName: string, clientCountry?: string): BankAccount[] {
  const r = seededRng(`${userId}:banks`);
  const h = rngHelpers(r);
  const count = h.int(1, 4);
  const now = Date.now();
  const out: BankAccount[] = [];

  for (let i = 0; i < count; i++) {
    const [bankName, swift, country] = h.pick(BANKS);
    const status: VerificationStatus = h.weighted([
      ["verified", 70], ["pending", 20], ["rejected", 10],
    ]);
    const holderMatch = h.bool(0.85);
    const countryMatch = !clientCountry || country === clientCountry || h.bool(0.7);

    const flags: string[] = [];
    if (!holderMatch) flags.push(RISK_FLAG_POOL[0]);
    if (!countryMatch) flags.push(RISK_FLAG_POOL[1]);
    if (h.bool(0.08)) flags.push(RISK_FLAG_POOL[2]);
    if (status === "pending") flags.push(RISK_FLAG_POOL[3]);

    const totalDeposit = status === "verified" ? h.int(0, 100000) : 0;
    const totalWithdrawal = status === "verified" ? h.int(0, Math.floor(totalDeposit * 0.7)) : 0;
    const lastUsedAt = status === "verified" && (totalDeposit > 0 || totalWithdrawal > 0)
      ? new Date(now - h.int(1, 90) * 86400_000).toISOString()
      : undefined;

    out.push({
      id: `bank_${userId.slice(-6)}_${i}`,
      bankName,
      swift,
      accountNumberMasked: `****${h.int(1000, 9999)}`,
      holderName: holderMatch ? clientName : `${clientName.split(" ")[0]} (差异)`,
      country,
      currency: h.weighted([["USD", 50], ["EUR", 20], ["HKD", 10], ["SGD", 10], ["GBP", 5], ["JPY", 5]]),
      verificationStatus: status,
      isDefault: i === 0 && status === "verified",
      riskFlags: flags,
      totalDeposit,
      totalWithdrawal,
      lastUsedAt,
      addedAt: new Date(now - h.int(30, 720) * 86400_000).toISOString(),
    });
  }
  return out;
}

const STATUS_LABEL: Record<VerificationStatus, string> = {
  verified: "已验证", pending: "待审核", rejected: "已拒绝",
};

const STATUS_TONE: Record<VerificationStatus, string> = {
  verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending:  "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

export default function BankAccountsTab({ data }: BaseTabProps) {
  const { user } = data;
  const banks = useMemo(
    () => generateMockBanks(user.id, user.name, user.country),
    [user.id, user.name, user.country],
  );

  const verified = banks.filter((b) => b.verificationStatus === "verified").length;
  const flagged = banks.filter((b) => b.riskFlags.length > 0).length;
  const totalDeposit = banks.reduce((s, b) => s + b.totalDeposit, 0);

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-0.5">银行账户</h3>
          <p className="text-xs text-slate-500">
            {banks.length} 个账户 · {verified} 已验证 · {flagged > 0 && <span className="text-amber-700">{flagged} 项风险标记</span>}
          </p>
        </div>
        <button className="h-8 px-3 text-sm font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          添加账户
        </button>
      </div>

      {/* 统计卡 */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="账户数"    value={`${banks.length}`}            icon={<Building2 className="w-3.5 h-3.5 text-slate-400" />} />
        <StatCard label="已验证"    value={`${verified}`}                icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />} tone="ok" />
        <StatCard label="累计入金"  value={`$${totalDeposit.toLocaleString()}`} icon={<Wallet className="w-3.5 h-3.5 text-slate-400" />} />
      </div>

      {/* 银行账户卡片网格 */}
      {banks.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          客户尚未绑定任何银行账户
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {banks.map((b) => (
            <BankCard key={b.id} bank={b} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, tone = "neutral" }: {
  label: string; value: string; icon: React.ReactNode; tone?: "neutral" | "ok" | "warn";
}) {
  const cls = tone === "ok" ? "text-emerald-700" : tone === "warn" ? "text-amber-700" : "text-slate-900";
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

function BankCard({ bank }: { bank: BankAccount }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-slate-900">{bank.bankName}</h4>
            {bank.isDefault && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 rounded">默认</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
            {bank.swift} · {bank.country}
          </p>
        </div>
        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10.5px] font-medium border ${STATUS_TONE[bank.verificationStatus]}`}>
          {STATUS_LABEL[bank.verificationStatus]}
        </span>
      </div>

      <dl className="space-y-1.5 mb-3">
        <Field label="账号" value={<span className="font-mono">{bank.accountNumberMasked}</span>} />
        <Field label="持卡人" value={bank.holderName} />
        <Field label="币种" value={<span className="font-mono">{bank.currency}</span>} />
        {bank.totalDeposit > 0 && <Field label="累计入金" value={`$${bank.totalDeposit.toLocaleString()}`} />}
        {bank.totalWithdrawal > 0 && <Field label="累计出金" value={`$${bank.totalWithdrawal.toLocaleString()}`} />}
        {bank.lastUsedAt && <Field label="最后使用" value={timeAgo(bank.lastUsedAt)} />}
      </dl>

      {bank.riskFlags.length > 0 && (
        <div className="border-t border-slate-100 pt-2 space-y-1">
          {bank.riskFlags.map((f) => (
            <div key={f} className="flex items-start gap-1.5 text-[11px] text-amber-800">
              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0 text-amber-600" />
              {f}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-xs">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-700 font-medium tabular-nums">{value}</dd>
    </div>
  );
}
