"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Timer, AlertTriangle, CheckCircle2, XCircle,
  ChevronDown, ChevronRight, Shield, Monitor, FileText,
  Play, User, MapPin, MessageSquare, Clock, Globe, Users, Send,
} from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { caseService } from "@/lib/clm/services";
import { CaseTypeBadge } from "@/components/crm/ui/CaseTypeBadge";
import { DocumentPreview } from "@/components/crm/clm/DocumentPreview";
import { CommentPanel } from "@/components/crm/clm/CommentPanel";
import { ExperienceSection } from "@/components/crm/clm/ExperienceSection";
import { AgreementSection } from "@/components/crm/clm/AgreementSection";
import { DisclaimerSection } from "@/components/crm/clm/DisclaimerSection";
import { RiskScoreRing } from "@/components/crm/clm/risk/RiskScoreRing";
import { RiskFactorList } from "@/components/crm/clm/risk/RiskFactorList";
import { IPGeoPopover } from "@/components/crm/clm/popovers/IPGeoPopover";
import { IBSummaryHover } from "@/components/crm/clm/popovers/IBSummaryHover";
import { VerificationChip } from "@/components/crm/clm/popovers/VerificationChip";
import { RichTimeline } from "@/components/crm/clm/RichTimeline";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { lookupIPGeo, lookupIB, lookupReviewer } from "@/lib/clm/mock";
import type {
  CLMCase, CaseComment, CaseDetail,
  KYCFlowStepInfo, LivenessResult, POADetail, SubmissionContext, VideoVerificationDetail,
} from "@/types/clm";
import { KYC_FLOW_STEP_LABELS } from "@/types/clm";
import { useCurrentStaff, useCurrentStaffId } from "@/hooks/useCurrentStaff";
import { useCrmSidebarStore } from "@/store/crmSidebarStore";
import {
  InfoRow, Collapsible, fmtDate, fmtDateTime, computeSLA as computeSLAShared, SLA_TONE,
} from "@/components/crm/clm/case-detail/bits";

const computeSLA = computeSLAShared;

/* ─────────────────────────────────────────────────────────────────────────── */
/* Main page                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const staffId = useCurrentStaffId();
  const currentStaff = useCurrentStaff();

  const [caseItem, setCaseItem] = useState<(CLMCase & Partial<CaseDetail>) | null>(null);
  const [slaInfo, setSlaInfo] = useState<ReturnType<typeof computeSLAShared>>({
    status: "normal", label: "", urgent: false, overdue: false,
  });
  const [loading, setLoading] = useState(true);

  // Decision dialogs — only one open at a time
  type DialogKind = "approve" | "reject" | "resubmit" | "escalate" | null;
  const [openDialog, setOpenDialog] = useState<DialogKind>(null);

  // Escalate dialog data (kept across opens)
  const [escalateSteps, setEscalateSteps] = useState<Set<string>>(new Set());
  const [escalateNote, setEscalateNote] = useState("");

  // Reply state for inline timeline replies
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Bottom action bar — quick comment input
  const [quickNote, setQuickNote] = useState("");

  // Video checklist local state
  const [videoChecks, setVideoChecks] = useState<Record<string, boolean | null>>({});

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    experience: true,
    agreements: true,
    declarations: false,
  });
  const allSectionsExpanded = Object.values(expandedSections).every(Boolean);
  const toggleAllSections = () => {
    const v = !allSectionsExpanded;
    setExpandedSections({ experience: v, agreements: v, declarations: v });
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await caseService.getById(caseId);
        const item = data as (CLMCase & Partial<CaseDetail>);
        setCaseItem(item);
        if (item) setSlaInfo(computeSLA(item.slaDueAt));
        if (item?.videoVerification?.checklist) {
          const init: Record<string, boolean | null> = {};
          for (const ch of item.videoVerification.checklist) init[ch.id] = ch.passed;
          setVideoChecks(init);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [caseId]);

  useEffect(() => {
    if (!caseItem) return;
    const t = setInterval(() => setSlaInfo(computeSLA(caseItem.slaDueAt)), 15000);
    return () => clearInterval(t);
  }, [caseItem?.slaDueAt]);

  const refresh = useCallback(async () => {
    const data = await caseService.getById(caseId);
    setCaseItem(data as (CLMCase & Partial<CaseDetail>));
    setOpenDialog(null);
    setEscalateSteps(new Set());
    setEscalateNote("");
    setReplyingTo(null);
    setReplyText("");
    setQuickNote("");
  }, [caseId]);

  const h = {
    approve:   async (n?: string) => { await caseService.approve(caseId, staffId, n); refresh(); },
    reject:    async (r: string, bl: boolean) => {
      await caseService.reject(caseId, staffId, bl ? `BLACKLIST: ${r}` : r);
      refresh();
    },
    resubmit:  async (r: string) => { await caseService.requestResubmission(caseId, staffId, r); refresh(); },
    escalate:  async (steps: string[], note: string) => {
      const msg = steps.length ? `Escalate: add [${steps.join(", ")}]. Note: ${note}` : note;
      await caseService.escalate(caseId, staffId, msg);
      refresh();
    },
    accept:    async () => { await caseService.assign(caseId, staffId, staffId); refresh(); },
  };

  /** Timeline rendered newest-first. Comments are already part of the
   *  timeline (case.service.addComment mirrors them as `comment` events),
   *  so this is just a sort/reverse. */
  const timelineEvents = useMemo(() => {
    const raw = caseItem?.timeline ?? [];
    return raw.slice().reverse();
  }, [caseItem?.timeline]);

  const onAddComment = useCallback(async (content: string, parentId?: string) => {
    const text = content.trim();
    if (!text) return;
    const nc: CaseComment = {
      id: `cmt-${Date.now()}`,
      authorId: staffId,
      authorName: currentStaff?.username ?? "Operator",
      authorRole: currentStaff?.role?.name ?? "Reviewer",
      content: text,
      mentions: [],
      isInternal: true,
      createdAt: new Date().toISOString(),
      parentId,
    };
    await caseService.addComment(caseId, nc);
    refresh();
  }, [caseId, staffId, currentStaff, refresh]);

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

  const isKYC = ["kyc", "edd", "source_of_wealth", "manual_review", "re_verification"].includes(caseItem.type);
  const kycSteps = caseItem.kycFlowSteps ?? [];
  const escalatableSteps = kycSteps.filter((s) => !s.included);
  const canEscalate = isKYC && escalatableSteps.length > 0;

  const docMaterials = caseItem.submittedMaterials?.filter(
    m => m.type !== "liveness_image" && m.type !== "liveness_video"
  ) ?? [];

  return (
    <div className="-mx-3 lg:-mx-4 -my-3 lg:-my-4 bg-slate-50 px-3 py-2 min-h-[calc(100vh-64px)] pb-24">
      <Breadcrumb items={[
        { label: "CLM Center", href: "/crm/clm/review-queue" },
        { label: "Review Queue", href: "/crm/clm/review-queue" },
        { label: caseItem.caseNo },
      ]} />

      {/* Critical risk banner */}
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
              Manual escalation is recommended. Approving requires explicit justification.
            </p>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex gap-4 mt-4">
        {/* LEFT sidebar */}
        <aside className="w-72 flex-shrink-0 space-y-4 sticky top-[64px] self-start">
          {/* Case info — first card (case no, chips, SLA, assignee, IP/device) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            {/* Top row: case no */}
            <p className="text-base font-bold text-slate-900 font-mono tabular-nums mb-3">{caseItem.caseNo}</p>

            {/* Status chips */}
            <div className="flex items-center gap-1.5 flex-wrap mb-3.5">
              <CaseTypeBadge type={caseItem.type} />
              <StatusBadge status={caseItem.status} />
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                caseItem.riskLevel === "critical" ? "bg-red-100 text-red-700 ring-1 ring-red-200" :
                caseItem.riskLevel === "high"     ? "bg-orange-100 text-orange-700" :
                caseItem.riskLevel === "medium"   ? "bg-amber-100 text-amber-700" :
                "bg-emerald-100 text-emerald-700"
              }`}>
                <Shield className="w-2.5 h-2.5" />
                {caseItem.riskLevel.charAt(0).toUpperCase() + caseItem.riskLevel.slice(1)}
              </span>
            </div>

            {/* Info grid */}
            <div className="space-y-2 text-xs">
              {canOperate && (
                <InfoRow label="SLA" value={
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap ${SLA_TONE[slaInfo.status]}`}>
                    {slaInfo.urgent ? <Clock className="w-3 h-3 flex-shrink-0" /> : <Timer className="w-3 h-3 flex-shrink-0" />}
                    {slaInfo.label}
                  </span>
                } />
              )}
              <InfoRow label="Assignee" value={
                caseItem.assigneeName
                  ? <ReviewerHoverChip name={caseItem.assigneeName} id={caseItem.assigneeId} />
                  : <span className="italic text-slate-400">Unassigned</span>
              } />
              {caseItem.submission && (
                <>
                  <InfoRow label="App IP" value={
                    <SubmissionIpCell submission={caseItem.submission} />
                  } />
                  <InfoRow label="App Device" value={
                    <SubmissionDeviceCell submission={caseItem.submission} />
                  } />
                </>
              )}
              <InfoRow label="Priority" value={caseItem.priority || "Normal"} />
              <InfoRow label="Source" value={caseItem.sourceChannel || "—"} />
              <InfoRow label="Created" value={
                <span className="font-mono tabular-nums text-[11px]" title={new Date(caseItem.createdAt).toISOString()}>
                  {fmtDateTime(caseItem.createdAt)}
                </span>
              } />
              {caseItem.reviewedBy && <InfoRow label="Reviewer" value={caseItem.reviewedBy} />}
            </div>
          </div>

          {/* Customer card — second */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-3 mb-3.5">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {caseItem.customerName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{caseItem.customerName}</p>
                <p className="text-[11px] text-slate-400 font-mono">{caseItem.customerUid}</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <InfoRow label="Account" value={<AccountStatusBadge status={caseItem.customerSnapshot?.accountStatus} />} />
              <InfoRow label="Country" value={<CountryFlag code={caseItem.country} />} />
              <InfoRow label="KYC" value={caseItem.kycLevel?.toUpperCase() || "—"} />
              <InfoRow label="Registered" value={fmtDate(caseItem.customerSnapshot?.registrationDate || caseItem.createdAt)} />
              {caseItem.personalInfo?.registrationIp && (
                <InfoRow label="Reg. IP" value={
                  <IPGeoPopover
                    ip={caseItem.personalInfo.registrationIp}
                    geo={lookupIPGeo(caseItem.personalInfo.registrationIp)}
                  />
                } />
              )}
              {caseItem.personalInfo?.registrationDevice && (
                <InfoRow label="Device" value={caseItem.personalInfo.registrationDevice} />
              )}
              {caseItem.personalInfo?.ibName && (
                <InfoRow label="Referred by IB" value={(() => {
                  const ib = caseItem.personalInfo?.ibReferral
                    ? lookupIB(caseItem.personalInfo.ibReferral) : null;
                  return ib
                    ? <IBSummaryHover ib={ib} />
                    : `${caseItem.personalInfo.ibName} (${caseItem.personalInfo.ibId ?? "—"})`;
                })()} />
              )}
            </div>
          </div>

          {/* Quick Access */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Quick Access</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Profile", href: `/crm/clients/${caseItem.customerId}`,            icon: Shield },
                { label: "Funds",   href: `/crm/clients/${caseItem.customerId}?tab=funds`,  icon: FileText },
                { label: "Trades",  href: `/crm/clients/${caseItem.customerId}?tab=trades`, icon: Monitor },
                { label: "Risk",    href: `/crm/clients/${caseItem.customerId}?tab=risk`,   icon: AlertTriangle },
              ].map(({ label, href, icon: Icon }) => (
                <Link key={label} href={href}
                  className="group flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-slate-100 text-xs text-slate-600 hover:text-primary hover:border-blue-200 hover:bg-blue-50 transition-colors">
                  <Icon className="w-3 h-3 text-slate-400 group-hover:text-primary flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER — type-based content */}
        <main className="flex-1 min-w-0 space-y-4">
          <TypeBasedContent
            caseItem={caseItem}
            docMaterials={docMaterials}
            videoChecks={videoChecks}
            setVideoChecks={setVideoChecks}
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
            allSectionsExpanded={allSectionsExpanded}
            toggleAllSections={toggleAllSections}
            isKYC={isKYC}
          />
        </main>

        {/* RIGHT — entire column sticky so risk + timeline stay in view on scroll */}
        <aside className="w-80 flex-shrink-0 space-y-3 sticky top-[64px] self-start">
          {/* Composite Risk */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <CompositeRiskCard caseItem={caseItem} />
          </div>

          {/* Bottom: unified Timeline (comments + system events interleaved) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Timeline</p>
              <p className="text-[10px] text-slate-400">{timelineEvents.length} events</p>
            </div>
            <RichTimeline
              events={timelineEvents}
              onReply={canOperate ? (pid) => { setReplyingTo(pid); setReplyText(""); } : undefined}
              replyingTo={replyingTo}
              replyInput={
                <ReplyComposer
                  value={replyText}
                  onChange={setReplyText}
                  onCancel={() => { setReplyingTo(null); setReplyText(""); }}
                  onSubmit={async () => {
                    if (replyingTo) await onAddComment(replyText, replyingTo);
                  }}
                />
              }
            />
          </div>
        </aside>
      </div>

      {/* Bottom action bar — sticky to viewport bottom */}
      {canOperate && (
        <BottomActionBar
          isPending={isPending}
          isReviewing={isReviewing}
          canEscalate={canEscalate}
          quickNote={quickNote}
          setQuickNote={setQuickNote}
          onSubmitNote={async () => { await onAddComment(quickNote); }}
          onAccept={h.accept}
          onApproveOpen={() => setOpenDialog("approve")}
          onRejectOpen={() => setOpenDialog("reject")}
          onResubmitOpen={() => setOpenDialog("resubmit")}
          onEscalateOpen={() => { setEscalateSteps(new Set()); setEscalateNote(""); setOpenDialog("escalate"); }}
        />
      )}

      {/* Decision dialogs */}
      <ApproveDialog
        open={openDialog === "approve"}
        onOpenChange={(v) => !v && setOpenDialog(null)}
        isHighStakes={caseItem.riskLevel === "critical" || caseItem.riskLevel === "high" || caseItem.amlStatus === "hit"}
        amlHit={caseItem.amlStatus === "hit"}
        onConfirm={async (reason) => { await h.approve(reason || undefined); }}
      />
      <RejectDialog
        open={openDialog === "reject"}
        onOpenChange={(v) => !v && setOpenDialog(null)}
        onConfirm={async (reason, blacklist) => { await h.reject(reason, blacklist); }}
      />
      <ResubmitDialog
        open={openDialog === "resubmit"}
        onOpenChange={(v) => !v && setOpenDialog(null)}
        onConfirm={async (reason) => { await h.resubmit(reason); }}
      />
      <EscalateDialog
        open={openDialog === "escalate"}
        onOpenChange={(v) => !v && setOpenDialog(null)}
        escalatableSteps={escalatableSteps}
        escalateSteps={escalateSteps}
        setEscalateSteps={setEscalateSteps}
        escalateNote={escalateNote}
        setEscalateNote={setEscalateNote}
        onConfirm={async () => {
          await h.escalate(Array.from(escalateSteps), escalateNote);
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Type-based content (center column)                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

function TypeBasedContent({
  caseItem, docMaterials,
  videoChecks, setVideoChecks,
  expandedSections, setExpandedSections, allSectionsExpanded, toggleAllSections,
  isKYC,
}: {
  caseItem: CLMCase & Partial<CaseDetail>;
  docMaterials: NonNullable<CaseDetail["submittedMaterials"]>;
  videoChecks: Record<string, boolean | null>;
  setVideoChecks: React.Dispatch<React.SetStateAction<Record<string, boolean | null>>>;
  expandedSections: Record<string, boolean>;
  setExpandedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  allSectionsExpanded: boolean;
  toggleAllSections: () => void;
  isKYC: boolean;
}) {
  switch (caseItem.type) {
    case "liveness":
      return <LivenessContent result={caseItem.livenessResult} />;

    case "poa":
      return <POAContent detail={caseItem.poaDetail} materials={docMaterials} />;

    case "video_verification":
      return (
        <VideoContent
          detail={caseItem.videoVerification}
          checks={videoChecks}
          onCheck={(id, v) => setVideoChecks((p) => ({ ...p, [id]: v }))}
        />
      );

    case "agreement_signing":
      return caseItem.agreements && caseItem.agreements.length > 0 ? (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">协议签署详情</h2>
          <AgreementSection data={caseItem.agreements} />
        </section>
      ) : null;

    default: // kyc, edd, etc.
      return (
        <>
          {/* Documents */}
          {docMaterials.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Submitted Documents</h2>
              <div className="space-y-4">
                {docMaterials.map(m => (
                  <div key={m.id} className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{m.label}</p>
                        <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                          Submitted {new Date(m.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {m.verification && <VerificationChip verification={m.verification} />}
                    </div>
                    <DocumentPreview material={m} showUserComparison={!!m.userSubmittedFields} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Collapsible sections: experience, agreements, declarations */}
          <SharedBottomSections
            caseItem={caseItem}
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
            allSectionsExpanded={allSectionsExpanded}
            toggleAllSections={toggleAllSections}
            showExperience={isKYC}
            showAgreements={isKYC}
            showDeclarations={isKYC}
          />
        </>
      );
  }
}

/* ─── Shared bottom collapsible sections ────────────────────────────────── */

function SharedBottomSections({
  caseItem, expandedSections, setExpandedSections, allSectionsExpanded, toggleAllSections,
  showExperience, showAgreements, showDeclarations,
}: {
  caseItem: CLMCase & Partial<CaseDetail>;
  expandedSections: Record<string, boolean>;
  setExpandedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  allSectionsExpanded: boolean;
  toggleAllSections: () => void;
  showExperience: boolean;
  showAgreements: boolean;
  showDeclarations: boolean;
}) {
  const tog = (key: string) =>
    setExpandedSections((p) => ({ ...p, [key]: !p[key] }));

  const hasSections =
    (showExperience && !!caseItem.experience) ||
    (showAgreements && !!caseItem.agreements?.length) ||
    (showDeclarations && !!caseItem.disclaimer);

  if (!hasSections) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Review Details</span>
        <button onClick={toggleAllSections}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
          {allSectionsExpanded ? "Collapse All" : "Expand All"}
          {allSectionsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      </div>
      <div className="space-y-2">
        {showExperience && caseItem.experience && (
          <Collapsible title="Experience Questionnaire" open={expandedSections.experience} onToggle={() => tog("experience")}>
            <ExperienceSection data={caseItem.experience} />
          </Collapsible>
        )}
        {showAgreements && caseItem.agreements && caseItem.agreements.length > 0 && (
          <Collapsible title="Agreements" open={expandedSections.agreements} onToggle={() => tog("agreements")}>
            <AgreementSection data={caseItem.agreements} />
          </Collapsible>
        )}
        {showDeclarations && caseItem.disclaimer && (
          <Collapsible title="Declarations" open={expandedSections.declarations} onToggle={() => tog("declarations")}>
            <DisclaimerSection data={caseItem.disclaimer} />
          </Collapsible>
        )}
      </div>
    </div>
  );
}

/* ─── Liveness content ───────────────────────────────────────────────────── */

function LivenessContent({ result }: { result?: LivenessResult }) {
  if (!result) return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <p className="text-sm text-slate-400 text-center py-6">活体认证结果加载中…</p>
    </section>
  );

  const passed = result.confidenceScore >= 80;
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">活体认证结果</h2>
      <div className="flex items-start gap-6">
        <div className="text-center shrink-0">
          <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center ${
            passed ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50"
          }`}>
            <span className={`text-2xl font-bold ${passed ? "text-emerald-700" : "text-red-700"}`}>
              {result.confidenceScore}
            </span>
            <span className={`text-[10px] font-medium ${passed ? "text-emerald-600" : "text-red-600"}`}>/ 100</span>
          </div>
          <p className={`text-xs font-semibold mt-2 ${passed ? "text-emerald-600" : "text-red-600"}`}>
            {passed ? "✓ 通过" : "✗ 未通过"}
          </p>
        </div>
        <div className="flex-1 space-y-2 text-xs">
          <InfoRow label="供应商" value={result.provider} />
          <InfoRow label="尝试次数" value={`${result.attemptCount} 次`} />
          <InfoRow label="完成时间" value={fmtDate(result.completedAt)} />
          <InfoRow label="最低通过线" value="80 分" />
        </div>
      </div>

      {(result.selfieImageUrl || result.documentFaceImageUrl) && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-600 mb-3">人脸比对</p>
          <div className="grid grid-cols-2 gap-3">
            {result.selfieImageUrl && (
              <div>
                <p className="text-[11px] text-slate-500 mb-1.5">活体自拍</p>
                <div className="aspect-square rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 overflow-hidden">
                  <User className="w-12 h-12" />
                </div>
              </div>
            )}
            {result.documentFaceImageUrl && (
              <div>
                <p className="text-[11px] text-slate-500 mb-1.5">证件照片</p>
                <div className="aspect-square rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 overflow-hidden">
                  <User className="w-12 h-12" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/* ─── POA content ────────────────────────────────────────────────────────── */

function POAContent({ detail, materials }: {
  detail?: POADetail;
  materials: NonNullable<CaseDetail["submittedMaterials"]>;
}) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">住址证明审核</h2>
      {detail && (
        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <InfoRow label="文件类型" value={detail.submittedDocumentType} />
          {detail.documentIssuedDate && (
            <InfoRow label="出具日期" value={fmtDate(detail.documentIssuedDate)} />
          )}
          <div className="col-span-2">
            <InfoRow label="申报地址" value={detail.declaredAddress} />
          </div>
          {detail.extractedAddress && (
            <div className="col-span-2">
              <InfoRow label="文件提取地址" value={detail.extractedAddress} />
            </div>
          )}
          {detail.addressMatch !== null && detail.addressMatch !== undefined && (
            <div className="col-span-2">
              <InfoRow label="地址匹配" value={
                <span className={`font-semibold ${detail.addressMatch ? "text-emerald-600" : "text-red-600"}`}>
                  {detail.addressMatch ? "✓ 一致" : "✗ 不一致"}
                </span>
              } />
            </div>
          )}
        </div>
      )}
      {materials.length > 0 && (
        <div className="space-y-3 border-t border-slate-100 pt-3">
          {materials.map(m => (
            <div key={m.id} className="space-y-2">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <p className="text-sm font-semibold text-slate-800">{m.label}</p>
                {m.verification && <VerificationChip verification={m.verification} />}
              </div>
              <DocumentPreview material={m} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Video content ──────────────────────────────────────────────────────── */

function VideoContent({ detail, checks, onCheck }: {
  detail?: VideoVerificationDetail;
  checks: Record<string, boolean | null>;
  onCheck: (id: string, v: boolean | null) => void;
}) {
  const allDone = detail?.checklist.every((c) => checks[c.id] !== null) ?? false;
  const allPassed = allDone && detail?.checklist.every((c) => checks[c.id] === true);

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">视频认证审核</h2>
      <div className="rounded-lg bg-slate-900 aspect-video flex items-center justify-center mb-4 relative overflow-hidden">
        <div className="text-center">
          <Play className="w-10 h-10 text-white/40 mx-auto mb-2" />
          <p className="text-xs text-white/40">
            {detail?.durationSeconds
              ? `${Math.floor(detail.durationSeconds / 60)}:${String(detail.durationSeconds % 60).padStart(2, "0")}`
              : "—"}
          </p>
        </div>
        {detail?.recordedAt && (
          <p className="absolute bottom-2 right-3 text-[10px] text-white/30">
            录制于 {fmtDate(detail.recordedAt)}
          </p>
        )}
      </div>
      {detail?.checklist && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-700">审核核查清单</p>
            {allDone && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                allPassed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}>
                {allPassed ? "✓ 全部通过" : "✗ 存在问题"}
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            {detail.checklist.map((item) => {
              const v = checks[item.id] ?? null;
              return (
                <div key={item.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-slate-50">
                  <span className="text-xs text-slate-700 flex-1">{item.label}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => onCheck(item.id, true)}
                      className={`p-1 rounded ${v === true ? "text-emerald-600" : "text-slate-300 hover:text-emerald-500"}`}
                      title="通过">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onCheck(item.id, false)}
                      className={`p-1 rounded ${v === false ? "text-red-600" : "text-slate-300 hover:text-red-500"}`}
                      title="未通过">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {!allDone && (
            <p className="text-[11px] text-slate-400 mt-2">请逐项标注审核结果后再做决策。</p>
          )}
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Right sidebar — Composite Risk card                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

function CompositeRiskCard({ caseItem }: { caseItem: CLMCase & Partial<CaseDetail> }) {
  const isFinal = ["approved", "rejected", "auto_approved", "auto_rejected", "cancelled", "expired"].includes(caseItem.status);
  return (
    <div className="p-3 space-y-3">
      <div className="rounded-lg border border-slate-100 overflow-hidden">
        <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-100">
          <RiskScoreRing
            score={caseItem.riskAssessment?.riskScore ?? 0}
            level={caseItem.riskAssessment?.riskLevel ?? "low"}
            size={64}
            strokeWidth={5}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Composite Risk</p>
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

/* ─── Submission Context — IP & device duplication signals ─────────────── */

/* ─── Submission IP / Device cells (hover popovers, shown in Case Info) ── */

function SubmissionIpCell({ submission }: { submission: SubmissionContext }) {
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

function SubmissionDeviceCell({ submission }: { submission: SubmissionContext }) {
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

function HoverPopover({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
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

/* ─── Reviewer hover chip — shows assignee profile card on hover ────────── */

function ReviewerHoverChip({ name, id }: { name: string; id?: string }) {
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
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
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

function severityForShared(count: number): { tone: string; label: string } {
  if (count === 0) return { tone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", label: "Unique" };
  if (count <= 2) return { tone: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",       label: `Shared by ${count}` };
  if (count <= 5) return { tone: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",       label: `Shared by ${count}` };
  return         { tone: "bg-red-100 text-red-700 ring-1 ring-red-200",                     label: `Shared by ${count}` };
}

function SubmissionContextSection({
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
      {/* Registration */}
      {personalInfo && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
            注册时
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

      {/* Opening (this case submission) */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">
          开户时
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

      {/* High-risk banner */}
      {(submission.sharedIpAccountIds.length >= 6 || submission.sharedDeviceAccountIds.length >= 6) && (
        <div className="flex items-start gap-1.5 px-2 py-1.5 bg-red-50 border border-red-100 rounded-md">
          <AlertTriangle className="w-3 h-3 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-700 font-medium">Multi-account risk</p>
        </div>
      )}

      {/* Inline popover — shared account list */}
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
        <button
          onClick={onClose}
          className="text-[10px] text-slate-400 hover:text-slate-700"
          aria-label="Close"
        >
          <XCircle className="w-3 h-3" />
        </button>
      </div>
      <ul className="divide-y divide-slate-100">
        {visible.map((uid) => (
          <li key={uid} className="flex items-center justify-between px-2.5 py-1.5 hover:bg-white">
            <span className="font-mono text-[11px] text-slate-700 tabular-nums">{uid}</span>
            <Link
              href={`/crm/clients/${uid}`}
              className="text-[10px] text-blue-600 hover:underline"
            >
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

/* ─── Final decision summary (closed cases) ─────────────────────────────── */

function FinalDecisionSummary({ caseItem }: { caseItem: CLMCase & Partial<CaseDetail> }) {
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
        <p className="text-slate-600">审核人：{caseItem.reviewedBy}</p>
      )}
      {caseItem.reviewedAt && (
        <p className="text-slate-500 mt-0.5">{fmtDate(caseItem.reviewedAt)}</p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Escalate Dialog                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

function EscalateDialog({
  open, onOpenChange,
  escalatableSteps, escalateSteps, setEscalateSteps,
  escalateNote, setEscalateNote, onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  escalatableSteps: KYCFlowStepInfo[];
  escalateSteps: Set<string>;
  setEscalateSteps: React.Dispatch<React.SetStateAction<Set<string>>>;
  escalateNote: string;
  setEscalateNote: (v: string) => void;
  onConfirm: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) => {
    setEscalateSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    setLoading(true);
    try { await onConfirm(); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>升级审核流程</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">选择需要新增的验证步骤</p>
            {escalatableSteps.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">当前 Flow 已包含所有验证步骤，无法升级。</p>
            ) : (
              <div className="space-y-2">
                {escalatableSteps.map((s) => (
                  <label key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={escalateSteps.has(s.id)}
                      onChange={() => toggle(s.id)}
                      className="rounded"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{KYC_FLOW_STEP_LABELS[s.id]}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1.5">备注（可选）</p>
            <textarea
              value={escalateNote}
              onChange={(e) => setEscalateNote(e.target.value)}
              placeholder="升级原因或补充说明…"
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (escalatableSteps.length > 0 && escalateSteps.size === 0)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "处理中…" : "确认升级"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Approve / Reject / Resubmit dialogs                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

function ApproveDialog({
  open, onOpenChange, isHighStakes, amlHit, onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isHighStakes: boolean;
  amlHit: boolean;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const reasonRequired = isHighStakes;
  const canSubmit = !reasonRequired || reason.trim().length > 0;

  useEffect(() => { if (!open) { setReason(""); setLoading(false); } }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Approve case
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {isHighStakes && (
            <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                {amlHit ? "AML hit — explicit justification required." : "High-risk case — please document your reasoning."}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1.5">
              Reason {reasonRequired && <span className="text-red-600">*</span>}
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonRequired ? "Required: justification for approving despite risk signals" : "Optional notes for the audit trail"}
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
            Cancel
          </button>
          <button
            onClick={async () => { setLoading(true); try { await onConfirm(reason); } finally { setLoading(false); } }}
            disabled={loading || !canSubmit}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Approving…" : "Confirm Approve"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  open, onOpenChange, onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (reason: string, blacklist: boolean) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [blacklist, setBlacklist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!open) { setReason(""); setBlacklist(false); setLoading(false); } }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            Reject case
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1.5">
              Reason <span className="text-red-600">*</span>
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Required: why is the application rejected?"
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
            />
          </div>
          <label className="flex items-start gap-2 cursor-pointer px-3 py-2 bg-red-50 border border-red-200 rounded-md">
            <input
              type="checkbox"
              checked={blacklist}
              onChange={(e) => setBlacklist(e.target.checked)}
              className="rounded mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-red-700">Also add to blacklist</p>
              <p className="text-xs text-red-600 mt-0.5">Account will be frozen and future applications auto-blocked. This is hard to reverse.</p>
            </div>
          </label>
        </div>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
            Cancel
          </button>
          <button
            onClick={async () => { setLoading(true); try { await onConfirm(reason, blacklist); } finally { setLoading(false); } }}
            disabled={loading || !reason.trim()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Rejecting…" : (blacklist ? "Reject + Blacklist" : "Confirm Reject")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResubmitDialog({
  open, onOpenChange, onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!open) { setReason(""); setLoading(false); } }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-600" />
            Request resubmission
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-xs text-slate-500">
            The customer will be asked to re-submit. Explain clearly what needs to change.
          </p>
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1.5">
              Instructions to the customer <span className="text-red-600">*</span>
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. The document is blurry — please re-upload a sharp photo of the same ID."
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
            Cancel
          </button>
          <button
            onClick={async () => { setLoading(true); try { await onConfirm(reason); } finally { setLoading(false); } }}
            disabled={loading || !reason.trim()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending…" : "Send back to customer"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Bottom action bar — comment quick-input + decision buttons                  */
/* ─────────────────────────────────────────────────────────────────────────── */

function BottomActionBar({
  isPending, isReviewing, canEscalate,
  quickNote, setQuickNote, onSubmitNote,
  onAccept, onApproveOpen, onRejectOpen, onResubmitOpen, onEscalateOpen,
}: {
  isPending: boolean;
  isReviewing: boolean;
  canEscalate: boolean;
  quickNote: string;
  setQuickNote: (s: string) => void;
  onSubmitNote: () => Promise<void>;
  onAccept: () => Promise<void>;
  onApproveOpen: () => void;
  onRejectOpen: () => void;
  onResubmitOpen: () => void;
  onEscalateOpen: () => void;
}) {
  const sidebarCollapsed = useCrmSidebarStore((s) => s.sidebarCollapsed);
  const [sending, setSending] = useState(false);

  const submitNote = async () => {
    if (!quickNote.trim() || sending) return;
    setSending(true);
    try { await onSubmitNote(); } finally { setSending(false); }
  };

  return (
    <div
      className={`fixed bottom-0 right-0 left-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(15,23,42,0.06)] transition-[left] duration-300 ${
        sidebarCollapsed ? "lg:left-[80px]" : "lg:left-[260px]"
      }`}
    >
      {/* Inner 3-col layout mirrors the page body so note + decision align
          with the center document column (not the left/right asides). */}
      <div className="px-3 lg:px-4 py-2.5 flex gap-4">
        {/* Left spacer — matches left aside width */}
        <div className="w-72 flex-shrink-0 hidden lg:block" />

        {/* Center — note input (left) + decision buttons (right) */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          {/* Note quick-input */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div className="flex-1 relative">
              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitNote(); } }}
                placeholder="Add a note… (Enter to send)"
                className="w-full pl-9 pr-3 h-9 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>
            <button
              onClick={submitNote}
              disabled={!quickNote.trim() || sending}
              className="px-3 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </button>
          </div>

          {/* Decision buttons */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {isPending && (
              <button
                onClick={onAccept}
                className="px-4 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors"
              >
                Take over case
              </button>
            )}
            {isReviewing && (
              <>
                {canEscalate && (
                  <button
                    onClick={onEscalateOpen}
                    className="px-3 h-9 bg-white border border-slate-200 text-orange-600 hover:bg-orange-50 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Escalate
                  </button>
                )}
                <button
                  onClick={onResubmitOpen}
                  className="px-3 h-9 bg-white border border-slate-200 text-amber-600 hover:bg-amber-50 rounded-lg text-xs font-semibold transition-colors"
                >
                  Resubmit
                </button>
                <button
                  onClick={onRejectOpen}
                  className="px-3 h-9 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={onApproveOpen}
                  className="px-4 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors"
                >
                  Approve
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right spacer — matches right aside width */}
        <div className="w-80 flex-shrink-0 hidden lg:block" />
      </div>
    </div>
  );
}

/* ─── Reply composer — inline reply input under a timeline event ─────────── */

function ReplyComposer({
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
/* Utility components                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
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

function AccountStatusBadge({ status }: { status?: string }) {
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

function CountryFlag({ code }: { code: string }) {
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
