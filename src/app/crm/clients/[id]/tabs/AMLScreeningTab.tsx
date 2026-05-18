"use client";

/**
 * AMLScreeningTab — 反洗钱筛查 (P1, 2026-05-15).
 *
 * 客户在 PEP / Sanctions / Adverse Media / High-risk jurisdiction
 * 等数据源里的筛查结果。每条匹配（Hit）都需要 Compliance 团队复核。
 */

import { useMemo, useState } from "react";
import {
  Shield, AlertTriangle, ShieldCheck, ShieldAlert,
  Eye, RefreshCw,
} from "lucide-react";
import type { BaseTabProps } from "@/types/backoffice/client";
import { seededRng, rngHelpers, timeAgo } from "./_shared/mock-prng";

type ScreeningSource = "PEP" | "Sanctions" | "Adverse Media" | "High-Risk Jurisdiction" | "Internal Blacklist";
type HitStatus = "open" | "under_review" | "cleared" | "confirmed";

interface AMLHit {
  id: string;
  source: ScreeningSource;
  matchScore: number;            // 0-100
  matchedName: string;
  matchedDob?: string;
  matchedCountry?: string;
  description: string;
  status: HitStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  detectedAt: string;
}

const STAFF = ["Alice Chen", "Bob Martin", "Carol Wong", "David Liu"];
const PEP_TYPES = [
  "Politically Exposed Person (PEP) - Government Official",
  "Family of PEP - Close Associate",
  "Former Head of State",
  "Senior Executive of State-Owned Enterprise",
];
const SANCTIONS_LISTS = [
  "OFAC SDN List",
  "EU Consolidated List",
  "UN Sanctions List",
  "UK HM Treasury List",
];
const MEDIA_TYPES = [
  "Financial fraud allegation - Reuters 2023",
  "Money laundering investigation - Bloomberg",
  "Tax evasion case - Local press",
];

function generateMockHits(userId: string, clientName: string): AMLHit[] {
  const r = seededRng(`${userId}:aml`);
  const h = rngHelpers(r);
  // 90% 客户 0-1 个 hit，10% 高风险客户 2-4 个
  const count = h.bool(0.9) ? h.int(0, 1) : h.int(2, 4);
  const out: AMLHit[] = [];

  for (let i = 0; i < count; i++) {
    const source: ScreeningSource = h.weighted([
      ["PEP", 30],
      ["Sanctions", 15],
      ["Adverse Media", 35],
      ["High-Risk Jurisdiction", 15],
      ["Internal Blacklist", 5],
    ]);
    const matchScore = h.int(60, 99);
    const status: HitStatus = h.weighted([
      ["open", 20],
      ["under_review", 25],
      ["cleared", 45],
      ["confirmed", 10],
    ]);
    const description =
      source === "PEP" ? h.pick(PEP_TYPES)
      : source === "Sanctions" ? `Match on ${h.pick(SANCTIONS_LISTS)}`
      : source === "Adverse Media" ? h.pick(MEDIA_TYPES)
      : source === "High-Risk Jurisdiction" ? "Listed in FATF high-risk countries"
      : "Internal blacklist match (multi-account fraud)";

    const reviewed = status === "cleared" || status === "confirmed";

    out.push({
      id: `aml_${userId.slice(-6)}_${i}`,
      source,
      matchScore,
      matchedName: matchScore > 90 ? clientName : `${clientName.split(" ")[0]} ${h.pick(["Wong", "Smith", "Lee", "Tan"])}`,
      matchedDob: source === "PEP" ? "1975-03-22" : undefined,
      matchedCountry: source === "Sanctions" ? h.pick(["IR", "KP", "RU"]) : undefined,
      description,
      status,
      reviewedBy: reviewed ? h.pick(STAFF) : undefined,
      reviewedAt: reviewed ? new Date(Date.now() - h.int(1, 90) * 86400_000).toISOString() : undefined,
      notes: reviewed
        ? h.pick([
            "False positive — name only partial match",
            "Confirmed different person (DOB mismatch)",
            "Confirmed hit — escalated to MLRO",
            "Customer provided clarification, cleared",
          ])
        : undefined,
      detectedAt: new Date(Date.now() - h.int(1, 365) * 86400_000).toISOString(),
    });
  }
  return out.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
}

const STATUS_LABEL: Record<HitStatus, string> = {
  open: "待处理",
  under_review: "审核中",
  cleared: "已澄清",
  confirmed: "已确认",
};

const STATUS_TONE: Record<HitStatus, string> = {
  open:         "bg-red-50 text-red-700 border-red-200",
  under_review: "bg-amber-50 text-amber-700 border-amber-200",
  cleared:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  confirmed:    "bg-red-50 text-red-700 border-red-200",
};

const SOURCE_TONE: Record<ScreeningSource, string> = {
  "PEP": "bg-indigo-50 text-indigo-700",
  "Sanctions": "bg-red-50 text-red-700",
  "Adverse Media": "bg-amber-50 text-amber-700",
  "High-Risk Jurisdiction": "bg-orange-50 text-orange-700",
  "Internal Blacklist": "bg-red-50 text-red-700",
};

export default function AMLScreeningTab({ data }: BaseTabProps) {
  const { user } = data;
  const hits = useMemo(() => generateMockHits(user.id, user.name), [user.id, user.name]);

  const [filter, setFilter] = useState<"all" | HitStatus>("all");

  const filtered = filter === "all" ? hits : hits.filter((hit) => hit.status === filter);

  const counts = {
    open: hits.filter((h) => h.status === "open").length,
    under_review: hits.filter((h) => h.status === "under_review").length,
    cleared: hits.filter((h) => h.status === "cleared").length,
    confirmed: hits.filter((h) => h.status === "confirmed").length,
  };

  const overallStatus = counts.confirmed > 0
    ? { tone: "danger" as const, icon: ShieldAlert, label: "存在已确认匹配", desc: "需要 MLRO 进一步处理" }
    : counts.open > 0
    ? { tone: "warn" as const, icon: AlertTriangle, label: "有待处理匹配", desc: `${counts.open} 项需要 Compliance 审核` }
    : { tone: "ok" as const, icon: ShieldCheck, label: "筛查通过", desc: "无活跃匹配项" };

  const StatusIcon = overallStatus.icon;
  const toneCls = overallStatus.tone === "danger" ? "bg-red-50 text-red-800 border-red-200"
    : overallStatus.tone === "warn" ? "bg-amber-50 text-amber-800 border-amber-200"
    : "bg-emerald-50 text-emerald-800 border-emerald-200";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-0.5">AML 反洗钱筛查</h3>
          <p className="text-xs text-slate-500">客户在制裁名单、PEP、负面新闻等数据源的匹配结果</p>
        </div>
        <button className="h-8 px-3 text-sm font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          重新筛查
        </button>
      </div>

      {/* Status banner */}
      <div className={`rounded-xl border p-4 flex items-start gap-3 ${toneCls}`}>
        <StatusIcon className="w-5 h-5 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-semibold">{overallStatus.label}</div>
          <div className="text-xs opacity-80 mt-0.5">{overallStatus.desc}</div>
        </div>
        <span className="text-[11px] tabular-nums opacity-70">
          最近筛查 {hits.length > 0 ? timeAgo(hits[0].detectedAt) : "—"}
        </span>
      </div>

      {/* 统计 + 筛选 */}
      <div className="grid grid-cols-4 gap-2">
        <FilterCard label="待处理" value={counts.open}         active={filter === "open"}         onClick={() => setFilter(filter === "open" ? "all" : "open")}                 tone="danger" />
        <FilterCard label="审核中" value={counts.under_review} active={filter === "under_review"} onClick={() => setFilter(filter === "under_review" ? "all" : "under_review")} tone="warn" />
        <FilterCard label="已澄清" value={counts.cleared}      active={filter === "cleared"}      onClick={() => setFilter(filter === "cleared" ? "all" : "cleared")}           tone="ok" />
        <FilterCard label="已确认" value={counts.confirmed}    active={filter === "confirmed"}    onClick={() => setFilter(filter === "confirmed" ? "all" : "confirmed")}       tone="danger" />
      </div>

      {/* 列表 */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          {filter === "all" ? "无 AML 筛查匹配" : "该状态下无记录"}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((hit) => <HitCard key={hit.id} hit={hit} />)}
        </ul>
      )}
    </div>
  );
}

function FilterCard({ label, value, active, onClick, tone }: {
  label: string; value: number; active: boolean; onClick: () => void;
  tone: "danger" | "warn" | "ok";
}) {
  const inactiveTone =
    tone === "danger" && value > 0 ? "text-red-700"
    : tone === "warn"  && value > 0 ? "text-amber-700"
    : tone === "ok"    && value > 0 ? "text-emerald-700"
    : "text-slate-900";

  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition-colors ${
        active ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${inactiveTone}`}>{value}</div>
    </button>
  );
}

function HitCard({ hit }: { hit: AMLHit }) {
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <Shield className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={`px-1.5 py-0.5 rounded text-[10.5px] font-medium ${SOURCE_TONE[hit.source]}`}>
              {hit.source}
            </span>
            <span className="text-sm font-semibold text-slate-800">{hit.matchedName}</span>
            <span className="text-[11px] text-slate-500 tabular-nums">匹配度 {hit.matchScore}%</span>
            {hit.matchedCountry && <span className="text-[11px] text-slate-500 font-mono">{hit.matchedCountry}</span>}
            {hit.matchedDob && <span className="text-[11px] text-slate-500">出生 {hit.matchedDob}</span>}
            <span className={`ml-auto px-1.5 py-0.5 rounded text-[10.5px] font-medium border ${STATUS_TONE[hit.status]}`}>
              {STATUS_LABEL[hit.status]}
            </span>
          </div>
          <p className="text-sm text-slate-700 mt-1">{hit.description}</p>
          {hit.notes && (
            <p className="text-xs text-slate-500 italic mt-1.5">「{hit.notes}」</p>
          )}
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-3 flex-wrap">
            <span>检测于 {timeAgo(hit.detectedAt)}</span>
            {hit.reviewedBy && (
              <>
                <span>·</span>
                <span>{hit.reviewedBy} 审核于 {timeAgo(hit.reviewedAt!)}</span>
              </>
            )}
            <button className="ml-auto inline-flex items-center gap-1 text-slate-500 hover:text-slate-900">
              <Eye className="w-3 h-3" /> 查看详情
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
