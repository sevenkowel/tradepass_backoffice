"use client";

/**
 * TaxInfoTab — 税务信息 (P1/P2 简化版, 2026-05-15).
 *
 * 展示客户提供的税务信息：税号 / FATCA & CRS 状态 / 税务居民国家。
 * 用于跨境合规（美国 FATCA / OECD CRS）申报。
 */

import { useMemo } from "react";
import { FileText, ShieldCheck, AlertTriangle, Upload } from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";
import { seededRng, rngHelpers, timeAgo } from "./_shared/mock-prng";

interface TaxInfo {
  taxResidency: string;
  taxId: string;
  taxIdType: "TIN" | "SSN" | "ITIN" | "Other";
  fatcaStatus: "us_person" | "non_us_person" | "not_declared";
  crsStatus: "declared" | "not_declared";
  w8benSubmitted: boolean;
  w9Submitted: boolean;
  lastUpdated: string;
  documents: { type: string; submittedAt: string; verifiedAt?: string; status: "verified" | "pending" | "rejected" }[];
}

function generateMockTax(userId: string, country?: string): TaxInfo {
  const r = seededRng(`${userId}:tax`);
  const h = rngHelpers(r);
  const isUS = country === "US" || h.bool(0.1);
  const declared = h.bool(0.75);

  return {
    taxResidency: country ?? "US",
    taxId: isUS
      ? `${h.int(100, 999)}-${h.int(10, 99)}-${h.int(1000, 9999)}`
      : `${h.int(10000000, 99999999)}`,
    taxIdType: isUS ? (h.bool(0.7) ? "SSN" : "ITIN") : (h.bool(0.5) ? "TIN" : "Other"),
    fatcaStatus: isUS ? "us_person" : (declared ? "non_us_person" : "not_declared"),
    crsStatus: declared ? "declared" : "not_declared",
    w8benSubmitted: !isUS && h.bool(0.6),
    w9Submitted: isUS && h.bool(0.7),
    lastUpdated: new Date(Date.now() - h.int(30, 730) * 86400_000).toISOString(),
    documents: [
      ...(declared ? [{
        type: isUS ? "W-9" : "W-8BEN",
        submittedAt: new Date(Date.now() - h.int(30, 365) * 86400_000).toISOString(),
        verifiedAt: h.bool(0.8) ? new Date(Date.now() - h.int(7, 30) * 86400_000).toISOString() : undefined,
        status: h.weighted([
          ["verified" as const, 70],
          ["pending"  as const, 20],
          ["rejected" as const, 10],
        ]),
      }] : []),
    ],
  };
}

const FATCA_LABEL: Record<TaxInfo["fatcaStatus"], string> = {
  us_person: "美国税务居民",
  non_us_person: "非美国税务居民",
  not_declared: "未声明",
};

const FATCA_TONE: Record<TaxInfo["fatcaStatus"], string> = {
  us_person:    "bg-blue-50 text-blue-700 border-blue-200",
  non_us_person: "bg-slate-50 text-slate-700 border-slate-200",
  not_declared: "bg-red-50 text-red-700 border-red-200",
};

const DOC_TONE: Record<TaxInfo["documents"][0]["status"], string> = {
  verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending:  "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const DOC_LABEL: Record<TaxInfo["documents"][0]["status"], string> = {
  verified: "已核实",
  pending:  "待审核",
  rejected: "已拒绝",
};

export default function TaxInfoTab({ data }: BaseTabProps) {
  const { user } = data;
  const tax = useMemo(() => generateMockTax(user.id, user.country), [user.id, user.country]);

  const isCompliant = tax.fatcaStatus !== "not_declared" && tax.crsStatus === "declared";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-0.5">税务信息</h3>
          <p className="text-xs text-slate-500">
            {isCompliant
              ? <span className="text-emerald-700">合规状态正常 — FATCA / CRS 已申报</span>
              : <span className="text-amber-700">⚠ 税务信息不完整 — 需要客户补全</span>}
          </p>
        </div>
        <button className="h-8 px-3 text-sm font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5" />
          上传文件
        </button>
      </div>

      {/* 基础税务信息 */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          税务身份
        </h4>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Row label="税务居民国家" value={<span className="font-mono">{tax.taxResidency}</span>} />
          <Row label={`${tax.taxIdType} 号码`} value={<span className="font-mono">{tax.taxId}</span>} />
          <Row label="FATCA 状态" value={
            <span className={`inline-block px-1.5 py-0.5 rounded text-[10.5px] font-medium border ${FATCA_TONE[tax.fatcaStatus]}`}>
              {FATCA_LABEL[tax.fatcaStatus]}
            </span>
          } />
          <Row label="CRS 申报" value={
            tax.crsStatus === "declared"
              ? <span className="text-emerald-700 font-medium text-xs">已申报</span>
              : <span className="text-amber-700 font-medium text-xs">未申报</span>
          } />
          <Row label="W-8BEN" value={
            tax.w8benSubmitted
              ? <span className="text-emerald-700 font-medium text-xs">已提交</span>
              : <span className="text-slate-300 text-xs">未提交</span>
          } />
          <Row label="W-9" value={
            tax.w9Submitted
              ? <span className="text-emerald-700 font-medium text-xs">已提交</span>
              : <span className="text-slate-300 text-xs">未提交</span>
          } />
          <Row label="最后更新" value={timeAgo(tax.lastUpdated)} />
        </dl>
      </section>

      {/* 文件列表 */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 inline-flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          税务文件
        </h4>
        {tax.documents.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400 inline-flex flex-col items-center gap-2 w-full">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            尚未提交任何税务文件
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tax.documents.map((doc) => (
              <li key={doc.type} className="py-2 flex items-center gap-3">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800">{doc.type}</div>
                  <div className="text-[11px] text-slate-500">
                    提交于 {timeAgo(doc.submittedAt)}
                    {doc.verifiedAt && (
                      <>
                        <span className="mx-1 text-slate-300">·</span>
                        核实于 {timeAgo(doc.verifiedAt)}
                      </>
                    )}
                  </div>
                </div>
                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10.5px] font-medium border ${DOC_TONE[doc.status]}`}>
                  {DOC_LABEL[doc.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-slate-100 last:border-b-0">
      <dt className="text-xs text-slate-500 shrink-0">{label}</dt>
      <dd className="text-sm text-slate-800 font-medium text-right tabular-nums truncate">{value}</dd>
    </div>
  );
}
