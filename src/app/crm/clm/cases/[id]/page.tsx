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
import { caseService } from "@/lib/clm/services";
import { CaseTypeBadge } from "@/components/crm/ui/CaseTypeBadge";
import { CaseTimeline } from "@/components/crm/clm/CaseTimeline";
import { DocumentPreview } from "@/components/crm/clm/DocumentPreview";
import { CommentPanel } from "@/components/crm/clm/CommentPanel";
import { ExperienceSection } from "@/components/crm/clm/ExperienceSection";
import { AgreementSection } from "@/components/crm/clm/AgreementSection";
import { DisclaimerSection } from "@/components/crm/clm/DisclaimerSection";
import type { CLMCase, CaseComment, CaseDetail } from "@/types/clm";

function computeSLA(slaDueAt: string) {
  const diffMs = new Date(slaDueAt).getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin <= 0) return { label: `${Math.abs(diffMin)}m overdue`, urgent: true, overdue: true };
  if (diffMin <= 5) return { label: `${diffMin}m left`, urgent: true, overdue: false };
  if (diffMin <= 30) return { label: `${diffMin}m left`, urgent: false, overdue: false };
  return { label: `${diffMin}m left`, urgent: false, overdue: false };
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const [caseItem, setCaseItem] = useState<(CLMCase & Partial<CaseDetail>) | null>(null);
  const [slaInfo, setSlaInfo] = useState({ label: "", urgent: false, overdue: false });
  const [loading, setLoading] = useState(true);
  const [timelineFilter, setTimelineFilter] = useState<"all" | "key">("key");
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | "resubmit" | null>(null);
  const [reason, setReason] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    experience: true,
    agreements: true,
    declarations: true,
    timeline: true,
    comments: true,
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
    approve: async (n?: string) => { await caseService.approve(caseId, "staff-001", n); refresh(); },
    reject: async (r: string) => { await caseService.reject(caseId, "staff-001", r); refresh(); },
    resubmit: async (r: string) => { await caseService.requestResubmission(caseId, "staff-001", r); refresh(); },
    escalate: async (r: string) => { await caseService.escalate(caseId, "staff-001", r); refresh(); },
    accept: async () => { await caseService.assign(caseId, "staff-001", "staff-001"); refresh(); },
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-[64px] z-20 pt-[10px] h-[66px]">
        <div className="px-5 h-14 flex items-center gap-4">
          <button onClick={() => router.push("/crm/clm/review-queue")} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <h1 className="text-base font-bold text-slate-900 font-mono">{caseItem.caseNo}</h1>
            <CaseTypeBadge type={caseItem.type} />
            <StatusBadge status={caseItem.status} />
            {canOperate && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                slaInfo.overdue ? "bg-red-100 text-red-700" : slaInfo.urgent ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
              }`}>
                {slaInfo.urgent ? <AlertTriangle className="w-3 h-3" /> : <Timer className="w-3 h-3" />}
                {slaInfo.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
              {caseItem.assigneeName?.charAt(0) || "?"}
            </div>
            <span className="text-xs">{caseItem.assigneeName || "Unassigned"}</span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex gap-5 p-5">
        {/* LEFT */}
        <aside className="w-72 flex-shrink-0 space-y-4 sticky top-[150px] self-start">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {caseItem.customerName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{caseItem.customerName}</p>
                <p className="text-[11px] text-slate-400 font-mono">{caseItem.customerUid}</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <InfoRow label="Account" value={<AccountStatusBadge status={caseItem.customerSnapshot?.accountStatus} />} />
              <InfoRow label="Registered" value={fmtDate(caseItem.customerSnapshot?.registrationDate || caseItem.createdAt)} />
              {caseItem.personalInfo?.registrationIp && <InfoRow label="Reg. IP" value={caseItem.personalInfo.registrationIp} />}
              {caseItem.personalInfo?.registrationDevice && <InfoRow label="Device" value={caseItem.personalInfo.registrationDevice} />}
              {caseItem.personalInfo?.registrationSource && <InfoRow label="Source" value={caseItem.personalInfo.registrationSource} />}
              {caseItem.personalInfo?.ibName && <InfoRow label="IB" value={`${caseItem.personalInfo.ibName} (ID: ${caseItem.personalInfo.ibId})`} />}
              <div className="h-px bg-slate-100 my-1.5" />
              <InfoRow label="KYC" value={caseItem.kycLevel?.toUpperCase() || "—"} />
              <InfoRow label="Country" value={caseItem.country} />
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Access</h3>
            <div className="space-y-0.5">
              {[
                { label: "Client Profile", href: `/crm/clients/${caseItem.customerId}` },
                { label: "Fund History", href: `/crm/clients/${caseItem.customerId}?tab=funds` },
                { label: "Trading History", href: `/crm/clients/${caseItem.customerId}?tab=trades` },
                { label: "Risk Center", href: `/crm/clients/${caseItem.customerId}?tab=risk` },
              ].map(link => (
                <Link key={link.label} href={link.href} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                  <ExternalLink className="w-3 h-3" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Case Info */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Case Info</h3>
            <div className="space-y-2 text-xs">
              <InfoRow label="Type" value={caseItem.type.replace(/_/g, " ")} />
              <InfoRow label="Priority" value={caseItem.priority || "Normal"} />
              <InfoRow label="Source" value={caseItem.sourceChannel || "—"} />
              <InfoRow label="Created" value={fmtDate(caseItem.createdAt)} />
              {caseItem.reviewedBy && <InfoRow label="Reviewer" value={caseItem.reviewedBy} />}
            </div>
          </div>
        </aside>

        {/* CENTER */}
        <main className="flex-1 min-w-0 space-y-4">
          {docMaterials.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Identity Document</h2>
              {docMaterials.map(m => <DocumentPreview key={m.id} material={m} />)}
            </section>
          )}

          {livenessMaterials.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Liveness Check</h2>
              {livenessMaterials.map(m => <DocumentPreview key={m.id} material={m} />)}
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
                <CaseTimeline events={timelineEvents} />
              </Collapsible>
            )}
            {caseItem.comments && (
              <Collapsible title="Comments" open={expandedSections.comments} onToggle={() => setExpandedSections(prev => ({ ...prev, comments: !prev.comments }))}>
                <CommentPanel comments={caseItem.comments} onAddComment={async (content: string) => {
                  const nc: CaseComment = { id: `cmt-${Date.now()}`, authorId: "staff-001", authorName: "Admin A", authorRole: "Reviewer", content, mentions: [], isInternal: true, createdAt: new Date().toISOString() };
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
            <div className="sticky top-[150px] space-y-4">
              {/* Risk + Decision combined */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                {/* Risk Score */}
                {(caseItem.riskAssessment?.riskScore !== undefined || caseItem.autoReview) && (
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                      (caseItem.riskAssessment?.riskScore ?? 0) < 40 ? "bg-emerald-100 text-emerald-700" :
                      (caseItem.riskAssessment?.riskScore ?? 0) < 70 ? "bg-amber-100 text-amber-700" :
                      (caseItem.riskAssessment?.riskScore ?? 0) < 85 ? "bg-orange-100 text-orange-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {caseItem.riskAssessment?.riskScore ?? caseItem.autoReview?.riskEngineScore ?? "—"}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Risk Score</p>
                      <p className="text-sm font-bold text-slate-800">{caseItem.riskAssessment?.riskLevel ? caseItem.riskAssessment.riskLevel.charAt(0).toUpperCase() + caseItem.riskAssessment.riskLevel.slice(1) : "—"}</p>
                    </div>
                  </div>
                )}

                {/* Risk Items */}
                <div className="space-y-2 text-xs">
                  <RiskItem label="AML" value={caseItem.riskAssessment?.amlStatus ?? caseItem.autoReview?.amlResult ?? "—"} />
                  <RiskItem label="Device" value={caseItem.riskAssessment?.deviceRisk ?? caseItem.autoReview?.deviceRisk ?? "—"} />
                  <RiskItem label="IP" value={caseItem.riskAssessment?.ipRisk ?? caseItem.autoReview?.ipRisk ?? "—"} />
                  {caseItem.autoReview && <RiskItem label="Engine" value={caseItem.autoReview.overall.replace(/_/g, " ")} />}
                </div>

                {/* Alerts */}
                {(caseItem.riskAssessment?.indicators.length ?? 0) > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs font-bold text-red-600 mb-1.5">{caseItem.riskAssessment!.indicators.length} risk alert(s)</p>
                    {caseItem.riskAssessment!.indicators.slice(0, 2).map((ind, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-red-600">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{ind.description}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Divider */}
                <div className="h-px bg-slate-100" />

                {/* Decision */}
                <div>
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

                  {isReviewing && confirmAction && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-900">
                        {confirmAction === "approve" ? "Confirm Approval" : confirmAction === "reject" ? "Confirm Rejection" : "Request Resubmission"}
                      </p>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={confirmAction === "approve" ? "Optional notes..." : "Required: reason"}
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            if (confirmAction === "approve") await h.approve(reason || undefined);
                            else if (confirmAction === "reject") await h.reject(reason);
                            else if (confirmAction === "resubmit") await h.resubmit(reason);
                          }}
                          disabled={confirmAction !== "approve" && !reason}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 ${
                            confirmAction === "approve" ? "bg-emerald-600 hover:bg-emerald-700 text-white" :
                            confirmAction === "reject" ? "bg-red-600 hover:bg-red-700 text-white" :
                            "bg-amber-600 hover:bg-amber-700 text-white"
                          }`}
                        >
                          Confirm
                        </button>
                        <button onClick={() => { setConfirmAction(null); setReason(""); }} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Secondary actions */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 pt-3 border-t border-slate-100">
                    {isReviewing && (
                      <>
                        <button onClick={() => h.escalate("Risk escalation")} className="text-xs text-slate-500 hover:text-slate-800 transition-colors">Escalate</button>
                        <button onClick={() => h.reject("BLACKLIST")} className="text-xs text-red-500 hover:text-red-700 transition-colors">Blacklist</button>
                      </>
                    )}
                    <button onClick={() => router.push(`/crm/clients/${caseItem.customerId}`)} className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Customer</button>
                  </div>
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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <span className="text-slate-400 flex-shrink-0">{label}</span>
      <span className="font-medium text-slate-700 text-right">{value}</span>
    </div>
  );
}

function RiskItem({ label, value }: { label: string; value: string }) {
  const bad = value === "hit" || value === "suspicious" || value === "auto_reject" || value === "vpn" || value === "proxy";
  const good = value === "pass" || value === "normal" || value === "auto_pass";
  return (
    <div className="flex items-center justify-between text-xs">
      <span className={`${bad ? "text-red-500" : good ? "text-emerald-500" : "text-slate-400"}`}>{label}</span>
      <span className={`font-bold capitalize ${bad ? "text-red-700" : good ? "text-emerald-700" : "text-slate-700"}`}>{value}</span>
    </div>
  );
}

function Collapsible({ title, children, open, onToggle }: { title: string; children: React.ReactNode; open: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
        <span className="text-sm font-bold text-slate-800">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
