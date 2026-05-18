"use client";

/**
 * NetworkRelationshipsPanel (P1-B3) — 同 IP / 同设备 客户网络面板.
 *
 * 把"该 case 提交时使用的 IP / Device 是否被其他账户共享"做成一个独立、
 * 顶级的 panel，不再藏在 risk factor 的 expand 里。
 *
 * 决策意义：多账户 / 农场账户 是 broker 风控的核心信号之一，必须直达。
 */

import Link from "next/link";
import { useState } from "react";
import { Globe, Monitor, Users, AlertTriangle, ChevronRight } from "lucide-react";
import type { CLMCase, CaseDetail, SubmissionContext } from "@/types/clm";
import { lookupIPGeo } from "@/lib/clm/mock";

export function NetworkRelationshipsPanel({
  caseItem,
}: {
  caseItem: CLMCase & Partial<CaseDetail>;
}) {
  if (!caseItem.submission) return null;
  const s = caseItem.submission;
  const ipShared = s.sharedIpAccountIds.length;
  const deviceShared = s.sharedDeviceAccountIds.length;
  const isHighRisk = ipShared >= 6 || deviceShared >= 6;
  const hasAny = ipShared > 0 || deviceShared > 0;

  if (!hasAny) {
    // 没有共享：显示"clean"状态，但保留可见性
    return (
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <p className="text-[10px] uppercase tracking-wider text-slate-700 font-bold">
            Network Relationships
          </p>
        </div>
        <p className="text-xs text-emerald-700">
          ✓ IP and device are not shared with any other account.
        </p>
      </section>
    );
  }

  return (
    <section className={`rounded-xl border shadow-sm p-3 ${isHighRisk ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Users className={`w-3.5 h-3.5 ${isHighRisk ? "text-red-600" : "text-slate-500"}`} />
          <p className={`text-[10px] uppercase tracking-wider font-bold ${isHighRisk ? "text-red-700" : "text-slate-700"}`}>
            Network Relationships
          </p>
        </div>
        {isHighRisk && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-200 text-red-800">
            <AlertTriangle className="w-2.5 h-2.5" />
            Multi-account risk
          </span>
        )}
      </div>

      <div className="space-y-2">
        <SharedRow
          icon={Globe}
          kind="IP"
          ip={s.ip}
          ids={s.sharedIpAccountIds}
          subtitle={ipGeoSubtitle(s)}
        />
        <SharedRow
          icon={Monitor}
          kind="Device"
          device={s.device}
          ids={s.sharedDeviceAccountIds}
        />
      </div>
    </section>
  );
}

function ipGeoSubtitle(s: SubmissionContext): string {
  const geo = s.ipGeo ?? lookupIPGeo(s.ip);
  if (!geo) return "";
  return [geo.city, geo.countryName].filter(Boolean).join(", ");
}

function SharedRow({
  icon: Icon, kind, ip, device, ids, subtitle,
}: {
  icon: typeof Globe;
  kind: "IP" | "Device";
  ip?: string;
  device?: string;
  ids: string[];
  subtitle?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const count = ids.length;
  const sevTone =
    count === 0 ? "text-emerald-700 bg-emerald-50 ring-emerald-200"
    : count <= 2 ? "text-slate-600 bg-slate-100 ring-slate-200"
    : count <= 5 ? "text-amber-800 bg-amber-100 ring-amber-200"
    : "text-red-700 bg-red-100 ring-red-200";

  const value = kind === "IP" ? ip : device;

  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs hover:bg-slate-50 transition-colors text-left"
      >
        <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span className="text-slate-400 flex-shrink-0">{kind}</span>
        <span className="text-slate-800 font-mono tabular-nums truncate flex-1 min-w-0">
          {value ?? "—"}
        </span>
        {subtitle && (
          <span className="text-[10.5px] text-slate-400 truncate hidden md:inline">
            {subtitle}
          </span>
        )}
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ring-1 ${sevTone}`}>
          {count === 0 ? "Unique" : `Shared by ${count}`}
        </span>
        {count > 0 && (
          <ChevronRight
            className={`w-3 h-3 text-slate-300 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        )}
      </button>
      {expanded && count > 0 && (
        <ul className="border-t border-slate-100 divide-y divide-slate-50">
          {ids.slice(0, 12).map((uid) => (
            <li key={uid} className="flex items-center justify-between px-2.5 py-1.5 text-[11px] hover:bg-slate-50">
              <span className="font-mono tabular-nums text-slate-700">{uid}</span>
              <Link
                href={`/crm/clients/${uid}`}
                className="text-[10px] text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                View →
              </Link>
            </li>
          ))}
          {ids.length > 12 && (
            <li className="px-2.5 py-1.5 text-[10.5px] text-slate-500 text-center bg-slate-50/60">
              + {ids.length - 12} more
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
