"use client";

/**
 * High-Risk Clients — the canonical "who do I worry about" page.
 *
 * This is the first page in the CRM that actually consumes
 * `RiskProfile` (the unified evaluation produced by the Risk Engine
 * and shared with Clients / CLM). It aggregates by risk level + AML
 * status across all clients and lists the top offenders inline with
 * their 6-axis breakdown surface.
 *
 * Click "Open profile" → opens that client's detail page on the Risk
 * tab so the operator picks up where this page left off.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  AlertTriangle,
  Activity,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "@/components/crm/ui/PageHeader";
import { Breadcrumb } from "@/components/crm/layout";
import { RiskScoreRing } from "@/components/crm/clm/risk/RiskScoreRing";
import { RiskFactorList } from "@/components/crm/clm/risk/RiskFactorList";
import { lookupRiskProfile } from "@/lib/risk-engine/mock-risk-profiles";
import type { BackofficeUser, RiskLevel } from "@/types/backoffice/client";
import type { RiskProfile } from "@/types/core";

interface ClientWithProfile {
  user: BackofficeUser;
  profile: RiskProfile;
}

export default function HighRiskClientsPage() {
  const [items, setItems] = useState<ClientWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [openClientId, setOpenClientId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/crm/clients?pageSize=200")
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const list: BackofficeUser[] = j.items ?? [];
        const enriched = list.map((u) => ({
          user: u,
          profile: lookupRiskProfile(
            u.id,
            u.riskScore ?? 0,
            (u.riskScore ?? 0) >= 70 ? "hit" : "pass"
          ),
        }));
        setItems(enriched);
      })
      .catch(() => { /* leave empty */ })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const dist = useMemo(() => {
    const buckets: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    items.forEach((it) => buckets[it.profile.riskLevel]++);
    const amlHits = items.filter((it) => it.profile.amlStatus === "hit").length;
    return { ...buckets, amlHits, total: items.length };
  }, [items]);

  // Surface only high + critical, sorted by score descending.
  const focused = useMemo(
    () =>
      items
        .filter((it) => it.profile.riskLevel === "high" || it.profile.riskLevel === "critical")
        .sort((a, b) => b.profile.overallScore - a.profile.overallScore),
    [items]
  );

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "Risk Center" }, { label: "High-Risk Clients" }]} />
      <PageHeader
        title="High-Risk Clients"
        description={`${dist.high + dist.critical} of ${dist.total} clients flagged · ${dist.amlHits} AML hits`}
      />

      {/* Distribution strip — counts per risk bucket. */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <DistTile icon={Users}         label="Total"    value={dist.total}    tone="neutral" />
        <DistTile icon={Activity}      label="Low"      value={dist.low}      tone="ok" />
        <DistTile icon={Activity}      label="Medium"   value={dist.medium}   tone="warn" />
        <DistTile icon={AlertTriangle} label="High"     value={dist.high}     tone="orange" />
        <DistTile icon={ShieldAlert}   label="Critical" value={dist.critical} tone="danger" />
      </div>

      {/* Focused list — high + critical, expandable rows show factors. */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">Flagged clients</h3>
          <span className="text-xs text-slate-500">
            Click a row to see the 6-axis breakdown
          </span>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : focused.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400">
            No flagged clients right now.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {focused.map(({ user, profile }) => {
              const isOpen = openClientId === user.id;
              return (
                <li key={user.id}>
                  <button
                    onClick={() => setOpenClientId(isOpen ? null : user.id)}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <RiskScoreRing
                      score={profile.overallScore}
                      level={profile.riskLevel}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900 truncate">{user.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono tabular-nums">{user.uid}</span>
                        {profile.amlStatus === "hit" && (
                          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                            AML hit
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {user.country} · {user.email}
                      </p>
                    </div>
                    <Link
                      href={`/crm/clients/${user.id}?tab=risk`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap"
                    >
                      Open profile <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </button>
                  {isOpen && (
                    <div className="bg-slate-50/60 border-t border-slate-100">
                      <RiskFactorList factors={profile.factors} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function DistTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone: "neutral" | "ok" | "warn" | "orange" | "danger";
}) {
  const cls = {
    neutral: "border-slate-200",
    ok:      "border-emerald-100 bg-emerald-50/40",
    warn:    "border-amber-100 bg-amber-50/40",
    orange:  "border-orange-100 bg-orange-50/40",
    danger:  "border-red-100 bg-red-50/40",
  }[tone];
  const iconCls = {
    neutral: "text-slate-400",
    ok:      "text-emerald-600",
    warn:    "text-amber-600",
    orange:  "text-orange-600",
    danger:  "text-red-600",
  }[tone];

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 bg-white border rounded-xl ${cls}`}>
      <Icon className={`w-4 h-4 flex-shrink-0 ${iconCls}`} />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 leading-none">{label}</p>
        <p className="text-lg font-semibold text-slate-900 tabular-nums leading-tight mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );
}
