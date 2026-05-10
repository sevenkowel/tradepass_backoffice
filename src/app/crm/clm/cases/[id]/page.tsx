"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowUpRight, Timer, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronRight, Shield, Monitor, Wifi, FileText,
  ExternalLink, Ban, Pause,
} from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
// Breadcrumb (`@/components/crm/layout/Breadcrumb`) renders its last
// item as an `<h1>`, so it doubles as the page heading; case detail
// no longer needs a custom inline path or PageHeader title here.
import { caseService } from "@/lib/clm/services";
import { CaseTypeBadge } from "@/components/crm/ui/CaseTypeBadge";
import { DocumentPreview } from "@/components/crm/clm/DocumentPreview";
import { CommentPanel } from "@/components/crm/clm/CommentPanel";
import { ExperienceSection } from "@/components/crm/clm/ExperienceSection";
import { AgreementSection } from "@/components/crm/clm/AgreementSection";
import { DisclaimerSection } from "@/components/crm/clm/DisclaimerSection";
// New core components introduced in Phase 1 / M2:
import { RiskScoreRing } from "@/components/crm/clm/risk/RiskScoreRing";
import { RiskFactorList } from "@/components/crm/clm/risk/RiskFactorList";
import { IPGeoPopover } from "@/components/crm/clm/popovers/IPGeoPopover";
import { IBSummaryHover } from "@/components/crm/clm/popovers/IBSummaryHover";
import { VerificationChip } from "@/components/crm/clm/popovers/VerificationChip";
import { RichTimeline } from "@/components/crm/clm/RichTimeline";
import { lookupIPGeo, lookupIB } from "@/lib/clm/mock";
import type { CLMCase, CaseComment, CaseDetail } from "@/types/clm";
import { useCurrentStaff, useCurrentStaffId } from "@/hooks/useCurrentStaff";
import {
  InfoRow,
  RiskItem,
  Collapsible,
  fmtDate,
  computeSLA as computeSLAShared,
} from "@/components/crm/clm/case-detail/bits";

// SLA / fmtDate / InfoRow / RiskItem / Collapsible are now imported from
// `@/components/crm/clm/case-detail/bits`. Use the local alias for SLA so
// the rest of this file does not need to change.
const computeSLA = computeSLAShared;

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const staffId = useCurrentStaffId();
  const currentStaff = useCurrentStaff();
  const [caseItem, setCaseItem] = useState<(CLMCase & Partial<CaseDetail>) | null>(null);
  const [slaInfo, setSlaInfo] = useState({ label: "", urgent: false, overdue: false });
  const [loading, setLoading] = useState(true);
  const [timelineFilter, setTimelineFilter] = useState<"all" | "key">("key");
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | "resubmit" | "escalate" | "blacklist" | null>(null);
  const [reason, setReason] = useState("");
  // Default-collapse the noisy sections (timeline + comments) so the
  // page lands on key info: documents, identity, agreements.
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    experience: true,
    agreements: true,
    declarations: false,
    timeline: false,
    comments: false,
  });
  const allSectionsExpanded = Object.values(expandedSections).every(Boolean);

  const toggleAllSections = () => {
    const newVal = !allSectionsExpanded;
    setExpandedSections({
      experience: newVal,
      agreements: newVal,
      declarations: newVal,
      timeline: newVal,
      comments: newVal,
    });
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await caseService.getById(caseId);
        const item = data as (CLMCase & Partial<CaseDetail>);
        setCaseItem(item);
        if (item) setSlaInfo(computeSLA(item.slaDueAt));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [caseId]);

  useEffect(() => {
    if (!caseItem) return;
    const timer = setInterval(() => setSlaInfo(computeSLA(caseItem.slaDueAt)), 15000);
    return () => clearInterval(timer);
  }, [caseItem?.slaDueAt]);

  const refresh = async () => {
    const data = await caseService.getById(caseId);
    setCaseItem(data as (CLMCase & Partial<CaseDetail>));
    setConfirmAction(null);
    setReason("");
  };

  const h = {
    approve: async (n?: string) => { await caseService.approve(caseId, staffId, n); refresh(); },
    reject: async (r: string) => { await caseService.reject(caseId, staffId, r); refresh(); },
    resubmit: async (r: string) => { await caseService.requestResubmission(caseId, staffId, r); refresh(); },
    escalate: async (r: string) => { await caseService.escalate(caseId, staffId, r); refresh(); },
    blacklist: async (r: string) => { await caseService.reject(caseId, staffId, `BLACKLIST: ${r}`); refresh(); },
    accept: async () => { await caseService.assign(caseId, staffId, staffId); refresh(); },
  };

  const timelineEvents = useMemo(() => {
    const raw = caseItem?.timeline;
    if (!raw) return [];
    if (timelineFilter === "all") return raw;
    return raw.filter(e => !e.action.includes("Comment"));
  }, [caseItem?.timeline, timelineFilter]);

  if (loading || !caseItem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  const isFinal = ["approved", "rejected", "auto_approved", "auto_rejected", "cancelled", "expired"].includes(caseItem.status);
  const isPending = caseItem.status === "pending";
  const isReviewing = ["reviewing", "resubmission", "escalated"].includes(caseItem.status);
  const canOperate = !isFinal;

  const docMaterials = caseItem.submittedMaterials?.filter(m => m.type !== "liveness_image" && m.type !== "liveness_video") ?? [];
  const livenessMaterials = caseItem.submittedMaterials?.filter(m => m.type === "liveness_image" || m.type === "liveness_video") ?? [];

  return (
    // Case Detail is intentionally full-bleed: the outer ClientLayout
    // applies `p-3 lg:p-4` to every page, but the case workflow is
    // dense enough that we want every pixel for the workspace. Negative
    // margins cancel the parent padding, then we re-apply a tight
    // `px-3 py-2` so cards still don't touch the chrome edges.
    <div className="-mx-3 lg:-mx-4 -my-3 lg:-my-4 bg-slate-50 px-3 py-2 min-h-[calc(100vh-64px)]">
      {/* Unified breadcrumb (matches every other CRM page).
          Last item — the case number — renders as the page H1. */}
      <Breadcrumb
        items={[
          { label: "CLM Center", href: "/crm/clm/review-queue" },
          { label: "Review Queue", href: "/crm/clm/review-queue" },
          { label: caseItem.caseNo },
        ]}
      />

      {/* Header — rounded card that sticks to the top of the viewport
          when the user scrolls. `top-[64px]` clears the global TopBar.
          A high z-index keeps it above the body's sticky sidebars. */}
      <header className="bg-white border border-slate-200 rounded-xl shadow-sm sticky top-[64px] z-30">
        <div className="px-4 h-12 flex items-center gap-3">
          <button
            onClick={() => router.push("/crm/clm/review-queue")}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            aria-label="Back to review queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0 flex items-center gap-2.5 flex-wrap">
            {/* The page H1 lives in the breadcrumb above; this is just
                the sticky-header anchor showing the case number. */}
            <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
              {caseItem.caseNo}
            </span>
            <CaseTypeBadge type={caseItem.type} />
            <StatusBadge status={caseItem.status} />
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                caseItem.riskLevel === "critical" ? "bg-red-100 text-red-700 ring-1 ring-red-200" :
                caseItem.riskLevel === "high" ? "bg-orange-100 text-orange-700" :
                caseItem.riskLevel === "medium" ? "bg-amber-100 text-amber-700" :
                "bg-emerald-100 text-emerald-700"
              }`}
              title={`Risk level: ${caseItem.riskLevel}`}
            >
              <Shield className="w-3 h-3" />
              {caseItem.riskLevel.charAt(0).toUpperCase() + caseItem.riskLevel.slice(1)}
            </span>
            {canOperate && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                slaInfo.overdue ? "bg-red-100 text-red-700" : slaInfo.urgent ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
              }`}>
                {slaInfo.urgent ? <AlertTriangle className="w-3 h-3" /> : <Timer className="w-3 h-3" />}
                {slaInfo.label}
              </span>
            )}
          </div>
          {/* Assignee — labeled, with status hint */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-100">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 leading-none">Assignee</p>
              <p className="text-xs font-medium text-slate-700 mt-0.5 truncate max-w-[120px]" title={caseItem.assigneeName || "Unassigned"}>
                {caseItem.assigneeName || <span className="italic text-slate-400">Unassigned</span>}
              </p>
            </div>
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-bold text-primary flex-shrink-0">
              {caseItem.assigneeName?.charAt(0).toUpperCase() || "?"}
            </div>
          </div>
        </div>
      </header>

      {/* Critical Risk Banner — only for high-blast-radius situations. */}
      {(caseItem.riskLevel === "critical" || caseItem.amlStatus === "hit") && canOperate && (
        <div className="mt-3 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-semibold text-red-800">
              {caseItem.riskLevel === "critical" ? "Critical risk profile" : ""}
              {caseItem.riskLevel === "critical" && caseItem.amlStatus === "hit" ? " · " : ""}
              {caseItem.amlStatus === "hit" ? "AML watchlist hit" : ""}
            </p>
            <p className="text-red-700 mt-0.5">
              Manual escalation is recommended. Approving this case requires explicit justification.
            </p>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex gap-3 mt-3">
        {/* LEFT — sticky offset matches header bottom (TopBar 64 +
            header 48 + gap 12 = 124) so the gap above the sidebars
            visually equals the gap between cards. */}
        <aside className="w-72 flex-shrink-0 space-y-3 sticky top-[124px] self-start">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {caseItem.customerName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{caseItem.customerName}</p>
                <p className="text-[11px] text-slate-400 font-mono">{caseItem.customerUid}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <InfoRow label="Account" value={<AccountStatusBadge status={caseItem.customerSnapshot?.accountStatus} />} />
              <InfoRow label="Country" value={<CountryFlag code={caseItem.country} />} />
              <InfoRow label="KYC" value={caseItem.kycLevel?.toUpperCase() || "—"} />
              <InfoRow label="Registered" value={fmtDate(caseItem.customerSnapshot?.registrationDate || caseItem.createdAt)} />
              {/* Registration IP — click for popover with geo + VPN flags + related UIDs. */}
              {caseItem.personalInfo?.registrationIp && (
                <InfoRow
                  label="Reg. IP"
                  value={
                    <IPGeoPopover
                      ip={caseItem.personalInfo.registrationIp}
                      geo={lookupIPGeo(caseItem.personalInfo.registrationIp)}
                    />
                  }
                />
              )}
              {caseItem.personalInfo?.registrationDevice && <InfoRow label="Device" value={caseItem.personalInfo.registrationDevice} />}
              {/* Referred-by IB — hover to see IB summary card. */}
              {caseItem.personalInfo?.ibName && (
                <InfoRow
                  label="Referred by IB"
                  value={(() => {
                    const ib = caseItem.personalInfo?.ibReferral
                      ? lookupIB(caseItem.personalInfo.ibReferral)
                      : null;
                    return ib
                      ? <IBSummaryHover ib={ib} />
                      : `${caseItem.personalInfo.ibName} (${caseItem.personalInfo.ibId ?? "—"})`;
                  })()}
                />
              )}
            </div>
          </div>

          {/* Case Info — moved up: this is the meta you reference
              while reviewing. */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Case Info</h3>
            <div className="space-y-1.5 text-xs">
              <InfoRow label="Type" value={caseItem.type.replace(/_/g, " ")} />
              <InfoRow label="Priority" value={caseItem.priority || "Normal"} />
              <InfoRow label="Source" value={caseItem.sourceChannel || "—"} />
              <InfoRow label="Created" value={fmtDate(caseItem.createdAt)} />
              {caseItem.reviewedBy && <InfoRow label="Reviewer" value={caseItem.reviewedBy} />}
            </div>
          </div>

          {/* Quick Access — moved last: navigation away from the case
              should be the least-prominent action. 2×2 grid with
              icons replaces the previous 4-row link list. */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Access</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Profile",  href: `/crm/clients/${caseItem.customerId}`,             icon: Shield },
                { label: "Funds",    href: `/crm/clients/${caseItem.customerId}?tab=funds`,   icon: FileText },
                { label: "Trades",   href: `/crm/clients/${caseItem.customerId}?tab=trades`,  icon: Monitor },
                { label: "Risk",     href: `/crm/clients/${caseItem.customerId}?tab=risk`,    icon: AlertTriangle },
              ].map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="group flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-slate-100 text-xs text-slate-600 hover:text-primary hover:border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  <Icon className="w-3 h-3 text-slate-400 group-hover:text-primary flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER */}
        <main className="flex-1 min-w-0 space-y-3">
          {docMaterials.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Submitted Documents</h2>
              <div className="space-y-3">
                {docMaterials.map(m => (
                  <div key={m.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800">{m.label}</p>
                      {m.verification && <VerificationChip verification={m.verification} />}
                    </div>
                    <DocumentPreview material={m} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {livenessMaterials.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Liveness Check</h2>
              <div className="space-y-3">
                {livenessMaterials.map(m => (
                  <div key={m.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800">{m.label}</p>
                      {m.verification && <VerificationChip verification={m.verification} />}
                    </div>
                    <DocumentPreview material={m} />
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Review Details</span>
            <button
              onClick={toggleAllSections}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              {allSectionsExpanded ? "Collapse All" : "Expand All"}
              {allSectionsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          </div>

          <div className="space-y-2">
            {caseItem.experience && (
              <Collapsible title="Experience Questionnaire" open={expandedSections.experience} onToggle={() => setExpandedSections(prev => ({ ...prev, experience: !prev.experience }))}><ExperienceSection data={caseItem.experience} /></Collapsible>
            )}
            {caseItem.agreements && caseItem.agreements.length > 0 && (
              <Collapsible title="Agreements" open={expandedSections.agreements} onToggle={() => setExpandedSections(prev => ({ ...prev, agreements: !prev.agreements }))}><AgreementSection data={caseItem.agreements} /></Collapsible>
            )}
            {caseItem.disclaimer && (
              <Collapsible title="Declarations" open={expandedSections.declarations} onToggle={() => setExpandedSections(prev => ({ ...prev, declarations: !prev.declarations }))}><DisclaimerSection data={caseItem.disclaimer} /></Collapsible>
            )}
            {caseItem.timeline && caseItem.timeline.length > 0 && (
              <Collapsible title="Timeline" open={expandedSections.timeline} onToggle={() => setExpandedSections(prev => ({ ...prev, timeline: !prev.timeline }))}>
                <div className="mb-3 flex gap-1">
                  <button onClick={() => setTimelineFilter("key")} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${timelineFilter === "key" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-700"}`}>Key</button>
                  <button onClick={() => setTimelineFilter("all")} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${timelineFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-700"}`}>All</button>
                </div>
                <RichTimeline events={timelineEvents} />
              </Collapsible>
            )}
            {caseItem.comments && (
              <Collapsible title="Comments" open={expandedSections.comments} onToggle={() => setExpandedSections(prev => ({ ...prev, comments: !prev.comments }))}>
                <CommentPanel comments={caseItem.comments} onAddComment={async (content: string) => {
                  const nc: CaseComment = {
                    id: `cmt-${Date.now()}`,
                    authorId: staffId,
                    authorName: currentStaff?.username ?? "Operator",
                    authorRole: currentStaff?.role?.name ?? "Reviewer",
                    content, mentions: [], isInternal: true,
                    createdAt: new Date().toISOString(),
                  };
                  await caseService.addComment(caseId, nc);
                  refresh();
                }} />
              </Collapsible>
            )}
          </div>
        </main>

        {/* RIGHT */}
        {canOperate && (
          <aside className="w-72 flex-shrink-0">
            <div className="sticky top-[124px] space-y-3">
              {/* Risk panel — composite ring + 6-axis explainable factors.
                  Falls back to the legacy RiskReferencePanel-style block
                  only when the new `factors` array isn't populated. */}
              {caseItem.riskAssessment?.factors && caseItem.riskAssessment.factors.length > 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-100">
                    <RiskScoreRing
                      score={caseItem.riskAssessment.riskScore}
                      level={caseItem.riskAssessment.riskLevel}
                      size={72}
                      strokeWidth={6}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Composite Risk
                      </p>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">
                        Click any factor to see reasoning
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        AML status:{" "}
                        <span className={
                          caseItem.riskAssessment.amlStatus === "hit" ? "text-red-600 font-semibold" :
                          caseItem.riskAssessment.amlStatus === "pass" ? "text-emerald-600 font-semibold" :
                          "text-slate-700"
                        }>
                          {caseItem.riskAssessment.amlStatus.replace(/_/g, " ")}
                        </span>
                      </p>
                    </div>
                  </div>
                  <RiskFactorList factors={caseItem.riskAssessment.factors} />
                </div>
              ) : null}

              {/* Decision */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Decision</h3>

                  {isPending && (
                    <button onClick={h.accept} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors">
                      Accept Task
                    </button>
                  )}

                  {isReviewing && !confirmAction && (
                    <div className="space-y-2">
                      <button onClick={() => setConfirmAction("approve")} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors">
                        Approve
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setConfirmAction("reject")} className="py-2 bg-white border border-slate-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold transition-colors">
                          Reject
                        </button>
                        <button onClick={() => setConfirmAction("resubmit")} className="py-2 bg-white border border-slate-200 text-amber-600 hover:bg-amber-50 rounded-lg text-sm font-semibold transition-colors">
                          Resubmit
                        </button>
                      </div>
                    </div>
                  )}

                  {isReviewing && confirmAction && (() => {
                    const cfg = {
                      approve:   { title: "Confirm Approval",        cta: "Approve",   needReason: false, btn: "bg-emerald-600 hover:bg-emerald-700" },
                      reject:    { title: "Confirm Rejection",       cta: "Reject",    needReason: true,  btn: "bg-red-600 hover:bg-red-700" },
                      resubmit:  { title: "Request Resubmission",    cta: "Send Back", needReason: true,  btn: "bg-amber-600 hover:bg-amber-700" },
                      escalate:  { title: "Escalate to Senior",      cta: "Escalate",  needReason: true,  btn: "bg-orange-600 hover:bg-orange-700" },
                      blacklist: { title: "Blacklist Customer",      cta: "Blacklist", needReason: true,  btn: "bg-red-600 hover:bg-red-700" },
                    }[confirmAction];
                    const isDestructive = confirmAction === "blacklist" || confirmAction === "escalate";
                    return (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-900">{cfg.title}</p>
                      {isDestructive && (
                        <div className="flex items-start gap-2 px-2.5 py-2 bg-red-50 border border-red-100 rounded-md">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-red-700">
                            {confirmAction === "blacklist"
                              ? "Account will be frozen and customer banned. This is hard to reverse."
                              : "Case will be reassigned to senior reviewer. Confirm before proceeding."}
                          </p>
                        </div>
                      )}
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={cfg.needReason ? "Required: reason" : "Optional notes..."}
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            if (confirmAction === "approve") await h.approve(reason || undefined);
                            else if (confirmAction === "reject") await h.reject(reason);
                            else if (confirmAction === "resubmit") await h.resubmit(reason);
                            else if (confirmAction === "escalate") await h.escalate(reason);
                            else if (confirmAction === "blacklist") await h.blacklist(reason);
                          }}
                          disabled={cfg.needReason && !reason.trim()}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${cfg.btn}`}
                        >
                          {cfg.cta}
                        </button>
                        <button onClick={() => { setConfirmAction(null); setReason(""); }} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                    );
                  })()}

                  {/* Secondary actions */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 pt-3 border-t border-slate-100">
                    {isReviewing && (
                      <>
                        <button
                          onClick={() => { setConfirmAction("escalate"); setReason(""); }}
                          className="text-xs text-orange-600 hover:text-orange-700 hover:underline underline-offset-2 transition-colors"
                        >
                          Escalate…
                        </button>
                        <button
                          onClick={() => { setConfirmAction("blacklist"); setReason(""); }}
                          className="text-xs text-red-600 hover:text-red-700 hover:underline underline-offset-2 transition-colors"
                        >
                          Blacklist…
                        </button>
                      </>
                    )}
                    <button onClick={() => router.push(`/crm/clients/${caseItem.customerId}`)} className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Customer</button>
                  </div>
                </div>
              </div>
            </aside>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    pending: "bg-amber-100 text-amber-700",
    reviewing: "bg-blue-100 text-blue-700",
    escalated: "bg-orange-100 text-orange-700",
    resubmission: "bg-purple-100 text-purple-700",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${map[status] || "bg-slate-100 text-slate-600"}`}>{status.replace(/_/g, " ")}</span>;
}

function AccountStatusBadge({ status }: { status?: string }) {
  const cfg: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    restricted: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    suspended: "bg-red-50 text-red-700 ring-1 ring-red-200",
    closed: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
    blacklisted: "bg-slate-800 text-white",
  };
  if (!status) return <span className="text-slate-400 text-xs">—</span>;
  const c = cfg[status];
  if (!c) return <span className="text-slate-400 text-xs">—</span>;
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${c}`}>{status === "suspended" ? "Frozen" : status === "blacklisted" ? "Blacklisted" : status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

// (InfoRow / RiskItem / Collapsible / fmtDate now live in
//  @/components/crm/clm/case-detail/bits — imported above.)

function CountryFlag({ code }: { code: string }) {
  if (!code || code.length !== 2) return <span className="text-slate-400">—</span>;
  const flag = code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-base leading-none">{flag}</span>
      <span className="font-mono tabular-nums text-[11px] text-slate-500">{code.toUpperCase()}</span>
    </span>
  );
}
