"use client";

/**
 * 共享小组件 — 从原 page.tsx 复制过来给 A/D 两个 preview 布局使用。
 *
 * 严格规则：本目录下的代码都不依赖原 page.tsx；原 page.tsx 也完全不
 * 依赖本目录。等评估完毕后，整个 preview/ 直接删掉就行。
 */

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, CheckCircle2, XCircle, Globe, Monitor, Users, Send, Shield,
  MessageSquare,
} from "lucide-react";
import type { CLMCase, CaseDetail, SubmissionContext } from "@/types/clm";
import { lookupIPGeo, lookupReviewer, lookupIB } from "@/lib/clm/mock";
import { RiskScoreRing } from "@/components/crm/clm/risk/RiskScoreRing";
import { RiskFactorList } from "@/components/crm/clm/risk/RiskFactorList";
import { fmtDate, fmtDateTime } from "@/components/crm/clm/case-detail/bits";

/* ─────────────────────────────────────────────────────────────────────────── */
/* Badges                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

export function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    approved:      "bg-emerald-100 text-emerald-700",
    rejected:      "bg-red-100 text-red-700",
    pending:       "bg-amber-100 text-amber-700",
    reviewing:     "bg-blue-100 text-blue-700",
    escalated:     "bg-orange-100 text-orange-700",
    resubmission:  "bg-purple-100 text-purple-700",
    auto_approved: "bg-emerald-50 text-emerald-700",
    auto_rejected: "bg-red-50 text-red-700",
    cancelled:     "bg-slate-100 text-slate-500",
    expired:       "bg-slate-100 text-slate-500",
  };
  const labels: Record<string, string> = {
    approved:      "Approved",
    rejected:      "Rejected",
    pending:       "Pending",
    reviewing:     "Reviewing",
    escalated:     "Escalated",
    resubmission:  "Resubmission",
    auto_approved: "Auto-Approved",
    auto_rejected: "Auto-Rejected",
    cancelled:     "Cancelled",
    expired:       "Expired",
  };
  const label = labels[status]
    ?? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${tone[status] || "bg-slate-100 text-slate-600"}`}>
      {label}
    </span>
  );
}

export function AccountStatusBadge({ status }: { status?: string }) {
  const cfg: Record<string, string> = {
    active:      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    restricted:  "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    suspended:   "bg-red-50 text-red-700 ring-1 ring-red-200",
    closed:      "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
    blacklisted: "bg-slate-800 text-white",
  };
  if (!status || !cfg[status]) return <span className="text-slate-400 text-xs">—</span>;
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${cfg[status]}`}>
      {status === "suspended" ? "Frozen" : status === "blacklisted" ? "Blacklisted" :
        status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function RiskLevelChip({ level }: { level: string }) {
  // critical / high 用更强的视觉信号：
  //   - chip 配色加深 + ring
  //   - chip 前一个脉冲红点（animate-ping + 实心 dot）— 一眼就能看到风险信号
  // medium / low 保持原有色阶，没有脉冲。
  const tone =
    level === "critical" ? "bg-red-100 text-red-700 ring-1 ring-red-300" :
    level === "high"     ? "bg-orange-100 text-orange-800 ring-1 ring-orange-300" :
    level === "medium"   ? "bg-amber-100 text-amber-700" :
    "bg-emerald-100 text-emerald-700";

  const showPulseDot = level === "critical" || level === "high";
  const dotColor = level === "critical" ? "bg-red-500" : "bg-orange-500";

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${tone}`}>
      {showPulseDot ? (
        // 双层 dot：外层 animate-ping（呼吸光晕）+ 内层实心 dot（稳定可见）
        <span className="relative inline-flex w-2 h-2 items-center justify-center flex-shrink-0">
          <span className={`absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-60 animate-ping`} />
          <span className={`relative inline-flex w-1.5 h-1.5 rounded-full ${dotColor}`} />
        </span>
      ) : (
        <Shield className="w-2.5 h-2.5" />
      )}
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

export function CountryFlag({ code }: { code: string }) {
  if (!code || code.length !== 2) return <span className="text-slate-400">—</span>;
  const flag = code.toUpperCase().split("").map((c) =>
    String.fromCodePoint(127397 + c.charCodeAt(0))
  ).join("");
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-base leading-none">{flag}</span>
      <span className="font-mono tabular-nums text-[11px] text-slate-500">{code.toUpperCase()}</span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Hover popover & reviewer chip                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

export function HoverPopover({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {label}
      {open && (
        <div className="absolute z-50 top-full right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-lg p-3">
          {children}
        </div>
      )}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Customer hover — 申请人摘要卡                                                */
/*                                                                             */
/* 用在 Hero「Submitted by …」位置：鼠标移入 → 弹出客户摘要卡（头像、UID、    */
/* 国家、KYC、账户状态、注册时间、IB 归属、跳转链接）。                          */
/* ─────────────────────────────────────────────────────────────────────────── */

export function CustomerHover({
  caseItem, children,
}: {
  caseItem: CLMCase & Partial<CaseDetail>;
  children: React.ReactNode;
}) {
  const c = caseItem;
  const initials = c.customerName.replace(/\s+/g, "").slice(0, 2).toUpperCase();
  const accountStatus = c.customerSnapshot?.accountStatus;
  const regDate = c.customerSnapshot?.registrationDate;
  const ib = c.personalInfo?.ibReferral ? lookupIB(c.personalInfo.ibReferral) : null;
  const regGeo = c.personalInfo?.registrationIp ? lookupIPGeo(c.personalInfo.registrationIp) : null;

  return (
    <HoverPopover label={children}>
      <div className="text-xs min-w-[280px]">
        {/* Header — avatar + name + UID */}
        <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 truncate">{c.customerName}</p>
            <p className="text-[11px] text-slate-500 font-mono tabular-nums">{c.customerUid}</p>
          </div>
          {accountStatus && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                accountStatus === "active"      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" :
                accountStatus === "restricted"  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200" :
                accountStatus === "suspended"   ? "bg-red-50 text-red-700 ring-1 ring-red-200" :
                accountStatus === "blacklisted" ? "bg-slate-800 text-white" :
                "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
              }`}
            >
              {accountStatus === "suspended" ? "Frozen" :
               accountStatus === "blacklisted" ? "Blacklisted" :
               accountStatus.charAt(0).toUpperCase() + accountStatus.slice(1)}
            </span>
          )}
        </div>

        {/* Identity */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-2.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Country</span>
            {c.country && c.country.length === 2 ? (
              <span className="inline-flex items-center gap-1">
                <span className="leading-none">
                  {String.fromCodePoint(...c.country.toUpperCase().split("").map((ch) => 127397 + ch.charCodeAt(0)))}
                </span>
                <span className="font-mono tabular-nums text-slate-700">{c.country.toUpperCase()}</span>
              </span>
            ) : <span className="text-slate-300">—</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">KYC</span>
            <span className="text-slate-700 font-medium">{c.kycLevel?.toUpperCase() ?? "—"}</span>
          </div>
          {regDate && (
            <div className="col-span-2 flex items-center gap-1.5">
              <span className="text-slate-400">Registered</span>
              <span className="text-slate-700 tabular-nums">
                {new Date(regDate).toLocaleDateString()}
              </span>
            </div>
          )}
          {c.personalInfo?.registrationIp && (
            <div className="col-span-2 flex items-center gap-1.5 min-w-0">
              <span className="text-slate-400 flex-shrink-0">Reg. IP</span>
              <span className="font-mono tabular-nums text-slate-700 truncate">
                {regGeo?.country && (
                  <span className="mr-1">
                    {String.fromCodePoint(...regGeo.country.toUpperCase().split("").map((ch) => 127397 + ch.charCodeAt(0)))}
                  </span>
                )}
                {c.personalInfo.registrationIp}
              </span>
            </div>
          )}
          {c.personalInfo?.registrationDevice && (
            <div className="col-span-2 flex items-center gap-1.5 min-w-0">
              <span className="text-slate-400 flex-shrink-0">Device</span>
              <span className="text-slate-700 truncate">{c.personalInfo.registrationDevice}</span>
            </div>
          )}
        </div>

        {/* IB referral (if any) */}
        {(c.personalInfo?.ibName || ib) && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-400">IB</span>
            <span className="text-slate-700 font-medium truncate">
              {ib?.name ?? c.personalInfo?.ibName}
              {(c.personalInfo?.ibId || ib?.id) && (
                <span className="font-mono text-slate-400 ml-1">({c.personalInfo?.ibId ?? ib?.id})</span>
              )}
            </span>
          </div>
        )}

        {/* Footer — jump link */}
        <Link
          href={`/crm/clients/${c.customerId}`}
          className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-primary font-medium hover:underline"
        >
          <span>Open customer profile</span>
          <span>→</span>
        </Link>
      </div>
    </HoverPopover>
  );
}

export function ReviewerHoverChip({ name, id }: { name: string; id?: string }) {
  const r = lookupReviewer(id || name);
  const initials = (r.name || name).replace(/\s+/g, "").slice(0, 2).toUpperCase();
  return (
    <HoverPopover
      label={
        <span className="inline-flex items-center gap-1.5 cursor-default">
          <span className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-bold text-primary flex-shrink-0">
            {name.charAt(0).toUpperCase()}
          </span>
          <span className="truncate">{name}</span>
        </span>
      }
    >
      <div className="text-xs min-w-[240px]">
        <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{r.name}</p>
            <p className="text-[11px] text-slate-500">{r.role}</p>
          </div>
        </div>
        <div className="space-y-1 pt-2.5 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="text-slate-400">ID</span>
            <span className="font-mono text-slate-700">{r.id}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="text-slate-400">Email</span>
            <span className="text-slate-700 truncate">{r.email}</span>
          </div>
          {r.lastActiveAt && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="text-slate-400">Last login</span>
              <span className="text-slate-700">{fmtDateTime(r.lastActiveAt)}</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2.5 mt-2.5 border-t border-slate-100">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Decisions / 7d</p>
            <p className="text-sm font-bold text-slate-900 tabular-nums">{r.decisionsThisWeek}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Pending</p>
            <p className="text-sm font-bold text-slate-900 tabular-nums">{r.pendingAssigned}</p>
          </div>
        </div>
      </div>
    </HoverPopover>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* IP / Device shared cells & severity helpers                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

export function severityForShared(count: number): { tone: string; label: string } {
  if (count === 0) return { tone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", label: "Unique" };
  if (count <= 2) return { tone: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",       label: `Shared by ${count}` };
  if (count <= 5) return { tone: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",       label: `Shared by ${count}` };
  return         { tone: "bg-red-100 text-red-700 ring-1 ring-red-200",                     label: `Shared by ${count}` };
}

function SharedUidList({ ids }: { ids: string[] }) {
  const visible = ids.slice(0, 8);
  const overflow = ids.length - visible.length;
  return (
    <ul className="space-y-0.5">
      {visible.map((uid) => (
        <li key={uid} className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-slate-700 tabular-nums">{uid}</span>
          <Link href={`/crm/clients/${uid}`} className="text-[10px] text-blue-600 hover:underline">
            View →
          </Link>
        </li>
      ))}
      {overflow > 0 && (
        <li className="text-[11px] text-slate-400 text-center pt-1">+ {overflow} more</li>
      )}
    </ul>
  );
}

export function SubmissionIpCell({ submission }: { submission: SubmissionContext }) {
  const geo = submission.ipGeo ?? lookupIPGeo(submission.ip);
  const sev = severityForShared(submission.sharedIpAccountIds.length);
  const hasIsoCountry = !!geo?.country && /^[A-Za-z]{2}$/.test(geo.country);
  return (
    <HoverPopover
      label={
        <span className="inline-flex items-center gap-1.5 cursor-default">
          {hasIsoCountry && (
            <span title={geo!.countryName} className="leading-none">
              {String.fromCodePoint(...geo!.country.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0)))}
            </span>
          )}
          <span className="font-mono tabular-nums text-slate-700 truncate max-w-[120px]">{submission.ip}</span>
          {submission.sharedIpAccountIds.length > 0 && (
            <span className={`px-1 py-0 rounded text-[9px] font-semibold ${sev.tone}`}>
              {submission.sharedIpAccountIds.length}
            </span>
          )}
        </span>
      }
    >
      <div className="text-xs space-y-2 min-w-[220px]">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">IP</p>
          <p className="font-mono text-slate-800">{submission.ip}</p>
          {geo && (
            <p className="text-[11px] text-slate-500">
              {[geo.city, geo.countryName].filter(Boolean).join(", ")}
              {geo.asn ? ` · ${geo.asn}` : ""}
            </p>
          )}
          {(geo?.isVpn || geo?.isProxy || geo?.isTor) && (
            <div className="flex gap-1 flex-wrap">
              {geo.isVpn   && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">VPN</span>}
              {geo.isProxy && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">Proxy</span>}
              {geo.isTor   && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">Tor</span>}
            </div>
          )}
        </div>
        <div className="border-t border-slate-100 pt-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Shared accounts</p>
          {submission.sharedIpAccountIds.length === 0
            ? <p className="text-[11px] text-emerald-700">Unique to this user.</p>
            : <SharedUidList ids={submission.sharedIpAccountIds} />}
        </div>
      </div>
    </HoverPopover>
  );
}

export function SubmissionDeviceCell({ submission }: { submission: SubmissionContext }) {
  const sev = severityForShared(submission.sharedDeviceAccountIds.length);
  return (
    <HoverPopover
      label={
        <span className="inline-flex items-center gap-1.5 cursor-default">
          <span className="text-slate-700 truncate max-w-[140px]">{submission.device}</span>
          {submission.sharedDeviceAccountIds.length > 0 && (
            <span className={`px-1 py-0 rounded text-[9px] font-semibold ${sev.tone}`}>
              {submission.sharedDeviceAccountIds.length}
            </span>
          )}
        </span>
      }
    >
      <div className="text-xs space-y-2 min-w-[220px]">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Device</p>
          <p className="text-slate-800">{submission.device}</p>
        </div>
        <div className="border-t border-slate-100 pt-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Shared accounts</p>
          {submission.sharedDeviceAccountIds.length === 0
            ? <p className="text-[11px] text-emerald-700">Unique to this user.</p>
            : <SharedUidList ids={submission.sharedDeviceAccountIds} />}
        </div>
      </div>
    </HoverPopover>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Submission context section (rendered inside RiskFactorList expanded view)  */
/* ─────────────────────────────────────────────────────────────────────────── */

function SharedAccountsList({
  title, ids, onClose,
}: { title: string; ids: string[]; onClose: () => void }) {
  const visible = ids.slice(0, 10);
  const overflow = ids.length - visible.length;
  return (
    <div className="mt-2 rounded-md border border-slate-200 bg-slate-50/60 overflow-hidden">
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-white border-b border-slate-200">
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3 text-slate-500" />
          <p className="text-[11px] font-semibold text-slate-700">{title}</p>
        </div>
        <button onClick={onClose} className="text-[10px] text-slate-400 hover:text-slate-700" aria-label="Close">
          <XCircle className="w-3 h-3" />
        </button>
      </div>
      <ul className="divide-y divide-slate-100">
        {visible.map((uid) => (
          <li key={uid} className="flex items-center justify-between px-2.5 py-1.5 hover:bg-white">
            <span className="font-mono text-[11px] text-slate-700 tabular-nums">{uid}</span>
            <Link href={`/crm/clients/${uid}`} className="text-[10px] text-blue-600 hover:underline">
              View →
            </Link>
          </li>
        ))}
      </ul>
      {overflow > 0 && (
        <div className="px-2.5 py-1.5 text-[11px] text-slate-500 text-center bg-white border-t border-slate-100">
          + {overflow} more
        </div>
      )}
    </div>
  );
}

export function SubmissionContextSection({
  submission, personalInfo,
}: {
  submission: SubmissionContext;
  personalInfo?: import("@/types/clm").PersonalInfo;
}) {
  const [popover, setPopover] = useState<null | "ip" | "device">(null);
  const ipSev = severityForShared(submission.sharedIpAccountIds.length);
  const deviceSev = severityForShared(submission.sharedDeviceAccountIds.length);
  const openingGeo = submission.ipGeo ?? lookupIPGeo(submission.ip);
  const regGeo = personalInfo?.registrationIp ? lookupIPGeo(personalInfo.registrationIp) : null;

  return (
    <div className="mt-2 pt-2 border-t border-slate-200 space-y-3 text-xs">
      {personalInfo && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
            At Registration
            <span className="font-normal text-slate-300 ml-1.5 normal-case">
              {fmtDate(personalInfo.registrationTime)}
            </span>
          </p>
          <div className="space-y-1.5">
            <div className="flex items-start gap-2">
              <Globe className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-slate-700 tabular-nums truncate">
                  {regGeo?.country && (
                    <span title={regGeo.country}>
                      {String.fromCodePoint(...regGeo.country.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0)))}{" "}
                    </span>
                  )}
                  {personalInfo.registrationIp ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Monitor className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-slate-700 truncate">{personalInfo.registrationDevice ?? "—"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
          At Submission
          <span className="font-normal text-slate-300 ml-1.5 normal-case">
            {fmtDate(submission.submittedAt)}
          </span>
        </p>
        <div className="space-y-1.5">
          <div className="flex items-start gap-2">
            <Globe className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-mono text-slate-800 tabular-nums truncate">
                {openingGeo?.country && (
                  <span title={openingGeo.country}>
                    {String.fromCodePoint(...openingGeo.country.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0)))}{" "}
                  </span>
                )}
                {submission.ip}
              </p>
            </div>
            <button
              onClick={() => setPopover(popover === "ip" ? null : "ip")}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap flex-shrink-0 ${ipSev.tone} hover:opacity-80 transition-opacity`}
              disabled={submission.sharedIpAccountIds.length === 0}
            >
              {ipSev.label}
            </button>
          </div>
          <div className="flex items-start gap-2">
            <Monitor className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 truncate">{submission.device}</p>
            </div>
            <button
              onClick={() => setPopover(popover === "device" ? null : "device")}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap flex-shrink-0 ${deviceSev.tone} hover:opacity-80 transition-opacity`}
              disabled={submission.sharedDeviceAccountIds.length === 0}
            >
              {deviceSev.label}
            </button>
          </div>
        </div>
      </div>

      {(submission.sharedIpAccountIds.length >= 6 || submission.sharedDeviceAccountIds.length >= 6) && (
        <div className="flex items-start gap-1.5 px-2 py-1.5 bg-red-50 border border-red-100 rounded-md">
          <AlertTriangle className="w-3 h-3 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-700 font-medium">Multi-account risk</p>
        </div>
      )}

      {popover && (
        <SharedAccountsList
          title={popover === "ip" ? "Accounts sharing this IP" : "Accounts sharing this device"}
          ids={popover === "ip" ? submission.sharedIpAccountIds : submission.sharedDeviceAccountIds}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Final decision summary (closed cases)                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

export function FinalDecisionSummary({ caseItem }: { caseItem: CLMCase & Partial<CaseDetail> }) {
  const isApproved = ["approved", "auto_approved"].includes(caseItem.status);
  const isRejected = ["rejected", "auto_rejected"].includes(caseItem.status);

  return (
    <div className={`rounded-lg border p-3 text-xs ${
      isApproved ? "bg-emerald-50 border-emerald-200" :
      isRejected  ? "bg-red-50 border-red-200" :
      "bg-slate-50 border-slate-200"
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {isApproved
          ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          : isRejected
          ? <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          : <Shield className="w-4 h-4 text-slate-500 flex-shrink-0" />}
        <span className={`font-bold text-sm ${
          isApproved ? "text-emerald-800" :
          isRejected  ? "text-red-800" :
          "text-slate-700"
        }`}>
          {caseItem.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
        </span>
      </div>
      {caseItem.reviewedBy && (
        <p className="text-slate-600">Reviewer: {caseItem.reviewedBy}</p>
      )}
      {caseItem.reviewedAt && (
        <p className="text-slate-500 mt-0.5">{fmtDate(caseItem.reviewedAt)}</p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Composite Risk card                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

export function CompositeRiskCard({ caseItem }: { caseItem: CLMCase & Partial<CaseDetail> }) {
  const isFinal = ["approved", "rejected", "auto_approved", "auto_rejected", "cancelled", "expired"].includes(caseItem.status);
  return (
    <div className="p-3 space-y-3">
      <div className="rounded-lg border border-slate-100 overflow-hidden">
        <div className="px-3 py-3 border-b border-slate-100">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Composite Risk</p>
          <RiskScoreRing
            score={caseItem.riskAssessment?.riskScore ?? 0}
            level={caseItem.riskAssessment?.riskLevel ?? "low"}
          />
          <div className="min-w-0 flex-1 mt-2">
            <p className="text-[11px] text-slate-500 mt-0.5">
              AML:{" "}
              <span className={
                caseItem.riskAssessment?.amlStatus === "hit"  ? "text-red-600 font-semibold" :
                caseItem.riskAssessment?.amlStatus === "pass" ? "text-emerald-600 font-semibold" :
                "text-slate-700"
              }>
                {(caseItem.riskAssessment?.amlStatus ?? "—").replace(/_/g, " ")}
              </span>
            </p>
          </div>
        </div>
        {caseItem.riskAssessment?.factors && caseItem.riskAssessment.factors.length > 0 && (
          <RiskFactorList
            factors={caseItem.riskAssessment.factors}
            renderExtraExpanded={(f) =>
              f.key === "device_ip" && caseItem.submission
                ? <SubmissionContextSection
                    submission={caseItem.submission}
                    personalInfo={caseItem.personalInfo}
                  />
                : null
            }
          />
        )}
      </div>
      {isFinal && <FinalDecisionSummary caseItem={caseItem} />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Reply composer                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

export function ReplyComposer({
  value, onChange, onSubmit, onCancel,
}: {
  value: string;
  onChange: (s: string) => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
}) {
  const [sending, setSending] = useState(false);
  const submit = async () => {
    if (!value.trim() || sending) return;
    setSending(true);
    try { await onSubmit(); } finally { setSending(false); }
  };
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/60 p-2 space-y-1.5">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
          if (e.key === "Escape") { e.preventDefault(); onCancel(); }
        }}
        autoFocus
        rows={2}
        placeholder="Reply… (Enter to send, Esc to cancel)"
        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
      />
      <div className="flex items-center justify-end gap-1.5">
        <button onClick={onCancel} className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!value.trim() || sending}
          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
        >
          <Send className="w-3 h-3" />
          Reply
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Inline quick-note composer (replaces the bottom-bar input in new layouts)   */
/* ─────────────────────────────────────────────────────────────────────────── */

export function QuickNoteComposer({
  value, onChange, onSubmit,
}: {
  value: string;
  onChange: (s: string) => void;
  onSubmit: () => Promise<void>;
}) {
  const [sending, setSending] = useState(false);
  const submit = async () => {
    if (!value.trim() || sending) return;
    setSending(true);
    try { await onSubmit(); } finally { setSending(false); }
  };
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 relative min-w-0">
        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder="Add a note…"
          className="w-full pl-9 pr-3 h-9 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
        />
      </div>
      <button
        onClick={submit}
        disabled={!value.trim() || sending}
        className="px-3 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 flex-shrink-0"
      >
        <Send className="w-3.5 h-3.5" />
        Send
      </button>
    </div>
  );
}
