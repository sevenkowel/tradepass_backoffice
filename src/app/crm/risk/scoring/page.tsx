"use client";

/**
 * Risk Scoring Policy — read-only view of the composite-score
 * configuration that drives Clients / CLM / Risk Center.
 *
 * Today this is hard-coded in `lib/risk-engine/config.ts`. An admin
 * editor lives in Phase 4. Until then this page exists so reviewers
 * can see *why* a client lands at a given risk level — and so the
 * compliance team has a citation for audit purposes.
 */

import {
  Globe, Fingerprint, Wifi, Users, ShieldAlert, Ban, Info,
} from "lucide-react";
import { PageHeader } from "@/components/crm/ui/PageHeader";
import { Breadcrumb } from "@/components/crm/layout";
import { FACTOR_WEIGHTS, LEVEL_THRESHOLDS } from "@/lib/risk-engine/config";
import type { RiskFactorKey } from "@/types/core";

const FACTOR_ICON: Record<RiskFactorKey, typeof Globe> = {
  country: Globe,
  identity: Fingerprint,
  device_ip: Wifi,
  ib_source: Users,
  aml: ShieldAlert,
  blacklist: Ban,
};

const LEVEL_TONE = {
  low:      { chip: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" },
  medium:   { chip: "bg-amber-100 text-amber-700",     bar: "bg-amber-500"   },
  high:     { chip: "bg-orange-100 text-orange-700",   bar: "bg-orange-500"  },
  critical: { chip: "bg-red-100 text-red-700",         bar: "bg-red-500"     },
} as const;

export default function RiskScoringPolicyPage() {
  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "Risk Center" }, { label: "Scoring Policy" }]} />
      <PageHeader
        title="Scoring Policy"
        description="Composite risk score configuration (read-only)"
      />

      {/* Read-only banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm">
        <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-900">
            Hard-coded for the current release
          </p>
          <p className="text-slate-600 mt-0.5">
            These weights ship in <code className="px-1 py-0.5 rounded bg-white border border-blue-100 text-xs font-mono">lib/risk-engine/config.ts</code>{" "}
            and are reviewed via PR. An in-product editor is planned for Phase 4 — it will write a versioned policy record consumed by both the engine and this page.
          </p>
        </div>
      </div>

      {/* Factor weights */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">Factor Weights</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Composite score = Σ (factor score × weight). Weights sum to 1.00.
          </p>
        </div>
        <ul className="divide-y divide-slate-100">
          {FACTOR_WEIGHTS.map((f) => {
            const Icon = FACTOR_ICON[f.key];
            const pct = (f.weight * 100).toFixed(0);
            return (
              <li key={f.key} className="px-4 py-3 flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-slate-900">{f.label}</p>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[200px]">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono tabular-nums text-slate-700 w-10 text-right">
                      {pct}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{f.rationale}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Risk level thresholds */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">Level Thresholds</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Composite score buckets and the operator action expected at each level.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Level</th>
              <th className="px-4 py-2 text-left font-semibold">Score range</th>
              <th className="px-4 py-2 text-left font-semibold">Required action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {LEVEL_THRESHOLDS.map((t) => {
              const tone = LEVEL_TONE[t.level];
              return (
                <tr key={t.level}>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${tone.chip}`}>
                      {t.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-xs text-slate-700">
                    {t.min}–{t.max}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{t.action}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
