"use client";

/**
 * Device & Security — cross-client IP / device forensics.
 *
 * The IP-geolocation database is centralised here in Risk Center; the
 * Clients module's Device Tab and CLM Case Detail's customer card both
 * read the *same* `lookupIPGeo()` source. This page is the operator-
 * facing view of that database: which IPs are flagged, how many
 * accounts share them, what threat score each carries.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ShieldAlert, Globe, Users, Filter } from "lucide-react";
import { PageHeader } from "@/components/crm/ui/PageHeader";
import { Breadcrumb } from "@/components/crm/layout";
import { listAllIPGeo } from "@/lib/clm/mock";
import type { IPGeoInfo } from "@/types/core";

function flagOf(country: string): string {
  if (!country || country.length !== 2) return "🌐";
  return country
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

type Filter = "all" | "flagged" | "shared";

export default function DeviceSecurityPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const all = useMemo(() => listAllIPGeo(), []);

  const items = useMemo(() => {
    if (filter === "flagged") return all.filter((g) => g.threatScore >= 40);
    if (filter === "shared") return all.filter((g) => g.registrationsFromThisIP > 1);
    return all;
  }, [all, filter]);

  const stats = useMemo(() => {
    return {
      total: all.length,
      flagged: all.filter((g) => g.threatScore >= 40).length,
      shared: all.filter((g) => g.registrationsFromThisIP > 1).length,
      vpn: all.filter((g) => g.isVpn).length,
    };
  }, [all]);

  return (
    <div className="space-y-3">
      <Breadcrumb items={[{ label: "Risk Center" }, { label: "Device & Security" }]} />
      <PageHeader
        title="Device & Security"
        description={`${stats.total} IP records · ${stats.flagged} flagged · ${stats.vpn} VPN/proxy · ${stats.shared} shared between accounts`}
      />

      {/* Filter chips */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        {([
          { key: "all", label: `All (${stats.total})` },
          { key: "flagged", label: `Flagged (${stats.flagged})` },
          { key: "shared", label: `Shared between accounts (${stats.shared})` },
        ] as const).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              filter === f.key
                ? "bg-blue-50 text-primary border-blue-200"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* IP table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">IP</th>
              <th className="px-4 py-2.5 text-left font-semibold">Country</th>
              <th className="px-4 py-2.5 text-left font-semibold">ASN</th>
              <th className="px-4 py-2.5 text-left font-semibold">Flags</th>
              <th className="px-4 py-2.5 text-left font-semibold">Threat</th>
              <th className="px-4 py-2.5 text-left font-semibold">Accounts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-sm text-slate-400">
                  No records match the current filter.
                </td>
              </tr>
            ) : (
              items.map((geo) => <Row key={geo.ip} geo={geo} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ geo }: { geo: IPGeoInfo }) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 font-mono tabular-nums text-xs text-slate-700">{geo.ip}</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs">
          <span className="text-base leading-none">{flagOf(geo.country)}</span>
          <span className="text-slate-700">{geo.countryName}</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">{geo.city}</span>
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[200px]" title={geo.asn}>
        {geo.asn}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {geo.isVpn && <Tag tone="warn">VPN</Tag>}
          {geo.isProxy && <Tag tone="warn">Proxy</Tag>}
          {geo.isTor && <Tag tone="danger">Tor</Tag>}
          {geo.isHosting && <Tag tone="warn">Hosting</Tag>}
          {geo.isMobile && <Tag tone="info">Mobile</Tag>}
          {!geo.isVpn && !geo.isProxy && !geo.isTor && !geo.isHosting && !geo.isMobile && (
            <span className="text-[11px] text-slate-300">—</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <ThreatBadge score={geo.threatScore} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold tabular-nums text-slate-700">
            {geo.registrationsFromThisIP}
          </span>
          {geo.relatedUids.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {geo.relatedUids.slice(0, 3).map((uid) => (
                <Link
                  key={uid}
                  href={`/crm/clients/${uid}`}
                  className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-primary transition-colors"
                >
                  {uid}
                </Link>
              ))}
              {geo.relatedUids.length > 3 && (
                <span className="text-[10px] text-slate-400 self-center">
                  +{geo.relatedUids.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function Tag({
  tone,
  children,
}: {
  tone: "warn" | "danger" | "info";
  children: React.ReactNode;
}) {
  const cls =
    tone === "danger" ? "bg-red-100 text-red-700" :
    tone === "warn" ? "bg-amber-100 text-amber-700" :
    "bg-blue-100 text-blue-700";
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function ThreatBadge({ score }: { score: number }) {
  const tone =
    score >= 70 ? "bg-red-100 text-red-700" :
    score >= 40 ? "bg-amber-100 text-amber-700" :
    score >= 15 ? "bg-slate-100 text-slate-600" :
                  "bg-emerald-100 text-emerald-700";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold tabular-nums ${tone}`}>
      <ShieldAlert className="w-3 h-3" />
      {score}
    </span>
  );
}
