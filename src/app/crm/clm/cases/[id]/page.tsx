"use client";

/**
 * Case Detail — A 方向正式版（2026-05-17 全量整合）.
 *
 * 核心结构：
 *   - Hero (Case-first, 紧凑 2 行, sticky, critical 红 border-l)
 *       L1: Case ID + Type/Status/Risk chips + Actions (含 Approve/Reject/Resubmit/Escalate/Reassign)
 *       L2: 申请人 (CustomerHover) + SLA + Risk + Assignee + meta
 *   - 两列：[ 中央 Tab + 内容 ] [ 右 Timeline (可拖宽 / 移动端抽屉) ]
 *   - Center Tabs（动态按 case.type 裁剪）：Review / Risk / Customer / Notes
 *
 * 已集成的能力（P0/P1/P2）：
 *   - P0-A1 键盘快捷键：A/R/S/E 触发对应 Dialog，N 切到 Notes，T 显示 Timeline
 *   - P0-A2 拒绝/重交/升级理由模板（在各 Dialog 内）
 *   - P0-C1 @mention（所有 textarea 通过 MentionTextarea）
 *   - P0-E3 critical / AML hit 时 Approve 强制 reason ≥ 20 字 + 双确认 checkbox
 *   - P0-G1 Tab 按 case.type 动态：agreement_signing 时隐藏 Risk Tab
 *   - P1-A3 "Approve & Next" / "Reject & Next" / "Send & Next" 自动跳下一个 case
 *   - P1-B2 OCR 字段差异高亮（在 DocumentPreview 已实现，通过 showUserComparison）
 *   - P1-B3 同 IP / Device 客户列表内嵌（CompositeRiskCard 内 expanded view）
 *   - P1-B4 客户历史 case 迷你时间线（Customer Tab 内）
 *   - P1-C2 一键转交 Reassign
 *   - ~~P1-D1 左侧待审队列~~（产品反馈后撤掉，2026-05-17）
 *   - P2-B1 AI 辅助建议条
 *   - P2-B5 30 天风险评分趋势
 *   - P2-C3 协作冲突提醒
 *   - P2-C4 双人复核横条
 *   - P2-F1 右栏在 <1280px 自动收为底部抽屉
 *   - P2-F3 打印模式（@media print 在 globals 中处理）
 *   - P2-F4 右栏拖拽宽度调整
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle, Timer, Clock, Shield, FileText,
  TrendingUp, Wallet, User as UserIcon, MessageSquare,
  StickyNote, ExternalLink, UserCheck, X, Printer, Keyboard,
} from "lucide-react";
import { Breadcrumb } from "@/components/crm/layout";
import { CaseTypeBadge } from "@/components/crm/ui/CaseTypeBadge";
import { RichTimeline } from "@/components/crm/clm/RichTimeline";
import { IPGeoPopover } from "@/components/crm/clm/popovers/IPGeoPopover";
import { IBSummaryHover } from "@/components/crm/clm/popovers/IBSummaryHover";
import { lookupIPGeo, lookupIB } from "@/lib/clm/mock";
import { useCurrentStaff, useCurrentStaffId } from "@/hooks/useCurrentStaff";
import { caseService } from "@/lib/clm/services";
import { useToast } from "@/components/ui/use-toast";
import {
  InfoRow, fmtDate, SLA_TONE,
} from "@/components/crm/clm/case-detail/bits";
import {
  PrivateNotesPanel,
  makePrivateNote,
  revokeNoteAttachments,
  type PrivateNote,
  type NoteAttachment,
} from "@/components/crm/notes/PrivateNotesPanel";

import { useCaseDetail } from "@/components/crm/clm/case-detail/use-case-detail";
import { TypeBasedContent } from "@/components/crm/clm/case-detail/content-renderers";
import {
  StatusBadge, AccountStatusBadge, CountryFlag, RiskLevelChip,
  ReviewerHoverChip, CustomerHover,
  CompositeRiskCard, ReplyComposer,
} from "@/components/crm/clm/case-detail/shared-components";
import {
  ApproveDialog, RejectDialog, ResubmitDialog, EscalateDialog, ReassignDialog,
} from "@/components/crm/clm/case-detail/dialogs";
import { getNextPendingCaseId } from "@/components/crm/clm/case-detail/case-queue-utils";
import { CustomerCaseHistory } from "@/components/crm/clm/case-detail/customer-case-history";
import { AiAdviceCard } from "@/components/crm/clm/case-detail/ai-advice-card";
import { RiskTrendCard } from "@/components/crm/clm/case-detail/risk-trend-card";
import { CollabPresence } from "@/components/crm/clm/case-detail/collab-presence";
import { DualApprovalBanner } from "@/components/crm/clm/case-detail/dual-approval-banner";
import { NetworkRelationshipsPanel } from "@/components/crm/clm/case-detail/network-relationships-panel";

type CenterTab = "review" | "risk" | "customer" | "notes";

const MIN_TIMELINE_WIDTH = 320;
const DEFAULT_TIMELINE_WIDTH = 384;
const MAX_TIMELINE_WIDTH = 560;

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const D = useCaseDetail(caseId);
  const currentStaff = useCurrentStaff();
  const currentStaffId = useCurrentStaffId();
  const toast = useToast();

  /* ─── Tabs（按 case.type 动态裁剪） ─── */
  const c = D.caseItem;
  const visibleTabs = useMemo<CenterTab[]>(() => {
    if (!c) return ["review", "risk", "customer", "notes"];
    if (c.type === "agreement_signing") {
      // 协议签署本身没有 risk 维度，省掉 Risk Tab
      return ["review", "customer", "notes"];
    }
    return ["review", "risk", "customer", "notes"];
  }, [c]);

  const [centerTabRaw, setCenterTab] = useState<CenterTab>("review");
  // 派生的"实际显示 Tab" —— 当前 raw 不在可见列表里就回退到 review。
  // 在 render 期 derive 而非 useEffect，避免 react-hooks/set-state-in-effect。
  const centerTab: CenterTab = visibleTabs.includes(centerTabRaw) ? centerTabRaw : "review";

  /* ─── Notes 状态 ─── */
  const [notes, setNotes] = useState<PrivateNote[]>([]);

  /* ─── Reassign Dialog ─── */
  const [reassignOpen, setReassignOpen] = useState(false);

  /* ─── Mobile Timeline Drawer (P2-F1) ─── */
  const [mobileTimelineOpen, setMobileTimelineOpen] = useState(false);

  /* ─── Right column width (P2-F4 拖拽) ─── */
  const [timelineWidth, setTimelineWidth] = useState<number>(DEFAULT_TIMELINE_WIDTH);
  const dragState = useRef<{ startX: number; startW: number } | null>(null);
  const onResizeStart = (e: React.PointerEvent) => {
    dragState.current = { startX: e.clientX, startW: timelineWidth };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onResizeMove = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    // 鼠标右移 → 列变窄；左移 → 列变宽
    const delta = dragState.current.startX - e.clientX;
    const next = Math.max(MIN_TIMELINE_WIDTH, Math.min(MAX_TIMELINE_WIDTH, dragState.current.startW + delta));
    setTimelineWidth(next);
  };
  const onResizeEnd = (e: React.PointerEvent) => {
    dragState.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  /* ─── Keyboard shortcuts (P0-A1) ─── */
  useEffect(() => {
    if (!c || !D.canOperate) return;
    const onKey = (e: KeyboardEvent) => {
      // 输入元素聚焦时不响应（避免抢键）
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const tag = t.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (t.isContentEditable) return;
      // 修饰键组合让给浏览器
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const k = e.key.toLowerCase();
      if (k === "a" && D.isReviewing)  { e.preventDefault(); D.setOpenDialog("approve"); }
      if (k === "r" && D.isReviewing)  { e.preventDefault(); D.setOpenDialog("reject"); }
      if (k === "s" && D.isReviewing)  { e.preventDefault(); D.setOpenDialog("resubmit"); }
      if (k === "e" && D.isReviewing && D.canEscalate) {
        e.preventDefault();
        D.setEscalateSteps(new Set()); D.setEscalateNote("");
        D.setOpenDialog("escalate");
      }
      if (k === "n") { e.preventDefault(); setCenterTab("notes"); }
      if (k === "t") { e.preventDefault(); setMobileTimelineOpen((v) => !v); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [c, D]);

  /* ─── Approve & Next 公共逻辑 ─── */
  const goToNextOrList = useCallback(async () => {
    try {
      const next = await getNextPendingCaseId(caseId, currentStaffId);
      if (next) {
        router.push(`/crm/clm/cases/${next}`);
      } else {
        toast.success("Queue cleared 🎉");
        router.push("/crm/clm/cases");
      }
    } catch (err) {
      console.error(err);
      router.push("/crm/clm/cases");
    }
  }, [caseId, currentStaffId, router, toast]);

  if (D.loading || !c) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  const isHighStakes = c.riskLevel === "critical" || c.riskLevel === "high" || c.amlStatus === "hit";
  const isCritical = c.riskLevel === "critical";

  /* ─── Notes 调用方实现 ─── */
  const addNote = (content: string, attachments: NoteAttachment[]) => {
    setNotes((prev) => [
      makePrivateNote({
        author: currentStaff?.username ?? "Operator",
        authorRole: currentStaff?.role?.name ?? undefined,
        content,
        attachments,
      }),
      ...prev,
    ]);
  };
  const removeNote = (id: string) => {
    setNotes((prev) => {
      const removed = prev.find((n) => n.id === id);
      revokeNoteAttachments(removed?.attachments);
      return prev.filter((n) => n.id !== id);
    });
  };

  /* ─── Reassign handler ─── */
  const handleReassign = async (assigneeId: string, note: string) => {
    try {
      await caseService.assign(caseId, assigneeId, currentStaffId);
      if (note.trim()) {
        await D.onAddComment(`Reassigned: ${note.trim()}`);
      }
      setReassignOpen(false);
      toast.success("Case reassigned");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Please try again.", {
        title: "Failed to reassign case",
      });
    }
  };

  return (
    <div className="-mx-3 lg:-mx-4 -my-3 lg:-my-4 bg-slate-50 px-3 py-2 min-h-[calc(100vh-64px)] print:bg-white">
      <Breadcrumb items={[
        { label: "CLM Center", href: "/crm/clm/cases" },
        { label: "Cases", href: "/crm/clm/cases" },
        { label: c.caseNo },
      ]} />

      {/* Critical / AML banner — 比 Hero border 更显眼 */}
      {(c.riskLevel === "critical" || c.amlStatus === "hit") && D.canOperate && (
        <div className="mt-3 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 print:hidden">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-semibold text-red-800">
              {c.riskLevel === "critical" ? "Critical risk profile" : ""}
              {c.riskLevel === "critical" && c.amlStatus === "hit" ? " · " : ""}
              {c.amlStatus === "hit" ? "AML watchlist hit" : ""}
            </p>
            <p className="text-red-700 mt-0.5">
              Manual escalation is recommended. Approving requires explicit justification.
            </p>
          </div>
        </div>
      )}

      {/* ─── HERO ────────────────────────────────────────────────────── */}
      <section
        className={`sticky top-0 z-20 mt-3 bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm print:static print:bg-white ${
          isCritical ? "border-l-4 border-l-red-500" : ""
        }`}
      >
        {/* L1 */}
        <div className="px-4 pt-2.5 pb-2 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Case</span>
            <p className="text-base font-bold text-slate-900 font-mono tabular-nums leading-none">
              {c.caseNo}
            </p>
            <span className="h-4 w-px bg-slate-200" />
            <CaseTypeBadge type={c.type} />
            <StatusBadge status={c.status} />
            <RiskLevelChip level={c.riskLevel} />
          </div>

          {/* 主操作 + 转交 + 打印 */}
          <div className="flex items-center gap-2 flex-shrink-0 print:hidden">
            {D.canOperate && c.assigneeId && (
              <button
                onClick={() => setReassignOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 h-8 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg text-[11px] font-semibold transition-colors"
                title="Reassign to another reviewer"
              >
                <UserCheck className="w-3 h-3" />
                Reassign
              </button>
            )}

            {D.isPending && (
              <button
                onClick={D.handlers.accept}
                className="px-3 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                title="Take over this case (assign to me)"
              >
                Take over
              </button>
            )}
            {D.isReviewing && (
              <>
                {D.canEscalate && (
                  <button
                    onClick={() => { D.setEscalateSteps(new Set()); D.setEscalateNote(""); D.setOpenDialog("escalate"); }}
                    className="px-2.5 h-8 bg-white border border-slate-200 text-orange-600 hover:bg-orange-50 rounded-lg text-[11px] font-semibold transition-colors"
                    title="Escalate (E)"
                  >
                    Escalate
                  </button>
                )}
                <button
                  onClick={() => D.setOpenDialog("resubmit")}
                  className="px-2.5 h-8 bg-white border border-slate-200 text-amber-600 hover:bg-amber-50 rounded-lg text-[11px] font-semibold transition-colors"
                  title="Resubmit (S)"
                >
                  Resubmit
                </button>
                <button
                  onClick={() => D.setOpenDialog("reject")}
                  className="px-2.5 h-8 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-[11px] font-semibold transition-colors"
                  title="Reject (R)"
                >
                  Reject
                </button>
                <button
                  onClick={() => D.setOpenDialog("approve")}
                  className="px-3 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                  title="Approve (A)"
                >
                  Approve
                </button>
              </>
            )}

            {/* 打印 */}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              title="Print decision sheet"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            {/* 快捷键提示 */}
            <KeyboardHintButton canOperate={D.canOperate} isReviewing={D.isReviewing} canEscalate={D.canEscalate} />
          </div>
        </div>

        {/* L2 */}
        <div className="px-4 pb-2.5 pt-1 border-t border-slate-100 flex items-center gap-x-4 gap-y-1 flex-wrap text-[11px]">
          <CustomerHover caseItem={c}>
            <span className="inline-flex items-center gap-1.5 cursor-default group">
              <UserIcon className="w-3 h-3 text-slate-400 group-hover:text-primary" />
              <span className="text-slate-400">Submitted by</span>
              <span className="font-medium text-slate-800 group-hover:text-primary">
                {c.customerName}
              </span>
              <CountryFlag code={c.country} />
              {c.kycLevel && (
                <span className="text-slate-500">KYC {c.kycLevel.toUpperCase()}</span>
              )}
            </span>
          </CustomerHover>

          <span className="h-3 w-px bg-slate-200" />

          {D.canOperate && (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-medium border whitespace-nowrap ${SLA_TONE[D.slaInfo.status]}`}>
              {D.slaInfo.urgent ? <Clock className="w-3 h-3" /> : <Timer className="w-3 h-3" />}
              {D.slaInfo.label}
            </span>
          )}

          <span className="inline-flex items-center gap-1 text-slate-600">
            <Shield className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400">Risk</span>
            <span className="font-semibold text-slate-800 tabular-nums">
              {c.riskAssessment?.riskScore ?? "—"}
            </span>
            {c.riskAssessment?.amlStatus === "hit" && (
              <span className="text-red-600 font-semibold">· AML hit</span>
            )}
          </span>

          {c.assigneeName && (
            <span className="inline-flex items-center gap-1 text-slate-600">
              <span className="text-slate-400">Assignee</span>
              <ReviewerHoverChip name={c.assigneeName} id={c.assigneeId} />
            </span>
          )}

          {c.priority && c.priority.toLowerCase() !== "normal" && (
            <span className="inline-flex items-center gap-1 text-slate-600">
              <span className="text-slate-400">Priority</span>
              <span className="font-medium text-slate-700">{c.priority}</span>
            </span>
          )}

          {c.sourceChannel && (
            <span className="inline-flex items-center gap-1 text-slate-600">
              <span className="text-slate-400">Source</span>
              <span className="text-slate-700">{c.sourceChannel}</span>
            </span>
          )}

          <span className="inline-flex items-center gap-1 text-slate-500 ml-auto">
            <span className="text-slate-400">Created</span>
            <span className="font-mono tabular-nums">{fmtDate(c.createdAt)}</span>
          </span>
        </div>
      </section>

      {/* Collab presence + Dual approval — 在 Hero 下方 */}
      <div className="mt-2 flex items-center gap-2 flex-wrap print:hidden">
        <CollabPresence caseId={c.id} currentStaffId={currentStaffId} />
      </div>

      {(c.riskLevel === "critical" || c.amlStatus === "hit") && D.canOperate && (
        <div className="mt-2 print:hidden">
          <DualApprovalBanner caseItem={c} />
        </div>
      )}

      {/* ─── BODY 两列：中央内容 + 右栏 Timeline ────────────────────── */}
      <div className="flex gap-3 mt-3 print:flex-col">
        {/* CENTER — Tab + 内容 */}
        <main className="flex-1 min-w-0 space-y-3">
          {/* 动态 Tabs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1 flex items-center gap-1 print:hidden">
            {visibleTabs.includes("review") && (
              <TabButton label="Review" icon={FileText} active={centerTab === "review"} onClick={() => setCenterTab("review")} />
            )}
            {visibleTabs.includes("risk") && (
              <TabButton label="Risk" icon={Shield} active={centerTab === "risk"} onClick={() => setCenterTab("risk")} badge={c.riskAssessment?.factors?.length} />
            )}
            {visibleTabs.includes("customer") && (
              <TabButton label="Customer" icon={UserIcon} active={centerTab === "customer"} onClick={() => setCenterTab("customer")} />
            )}
            {visibleTabs.includes("notes") && (
              <TabButton label="Notes" icon={StickyNote} active={centerTab === "notes"} onClick={() => setCenterTab("notes")} badge={notes.length} />
            )}
            {/* 移动端：底部固定按钮"打开 Timeline 抽屉" */}
            <button
              onClick={() => setMobileTimelineOpen(true)}
              className="ml-auto inline-flex 2xl:hidden items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-50"
              title="Timeline (T)"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Timeline</span>
              <span className="text-[10px] text-slate-400 tabular-nums">{D.timelineEvents.length}</span>
            </button>
          </div>

          {centerTab === "review" && (
            <TypeBasedContent caseItem={c} docMaterials={D.docMaterials} isKYC={D.isKYC} />
          )}
          {centerTab === "risk" && visibleTabs.includes("risk") && (
            <div className="space-y-3">
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <CompositeRiskCard caseItem={c} />
              </section>
              {/* P1-B3 同 IP/设备客户网络 */}
              <NetworkRelationshipsPanel caseItem={c} />
              {/* P2-B5 风险趋势 */}
              <RiskTrendCard
                customerId={c.customerId}
                currentScore={c.riskAssessment?.riskScore ?? 0}
              />
            </div>
          )}
          {centerTab === "customer" && (
            <CustomerTab caseItem={c} />
          )}
          {centerTab === "notes" && (
            <PrivateNotesPanel
              notes={notes}
              canEdit={D.canOperate}
              onAdd={addNote}
              onRemove={removeNote}
              author={{
                name: currentStaff?.username ?? "Operator",
                role: currentStaff?.role?.name,
              }}
            />
          )}
        </main>

        {/* RIGHT — Timeline (2xl 才在主流程显示；<2xl 走底部抽屉) */}
        <aside
          className="hidden 2xl:block flex-shrink-0 sticky top-[140px] self-start print:hidden"
          style={{ width: timelineWidth }}
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-160px)] relative">
            {/* 拖拽手柄 (P2-F4) — 左边缘 4px */}
            <div
              onPointerDown={onResizeStart}
              onPointerMove={onResizeMove}
              onPointerUp={onResizeEnd}
              className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-200 active:bg-blue-400 z-10"
              title="Drag to resize"
            />

            {/* AI advice + Trend 放右栏顶（P2-B1 / P2-B5） */}
            <div className="p-3 border-b border-slate-100 space-y-2 flex-shrink-0">
              <AiAdviceCard caseItem={c} />
            </div>

            <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <p className="text-[11px] uppercase tracking-wider text-slate-700 font-bold">Timeline</p>
              </div>
              <p className="text-[10px] text-slate-400">{D.timelineEvents.length} events</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <RichTimeline
                events={D.timelineEvents}
                onReply={D.canOperate ? (pid) => { D.setReplyingTo(pid); D.setReplyText(""); } : undefined}
                replyingTo={D.replyingTo}
                replyInput={
                  <ReplyComposer
                    value={D.replyText}
                    onChange={D.setReplyText}
                    onCancel={() => { D.setReplyingTo(null); D.setReplyText(""); }}
                    onSubmit={async () => {
                      if (D.replyingTo) await D.onAddComment(D.replyText, D.replyingTo);
                    }}
                  />
                }
              />
            </div>
          </div>
        </aside>
      </div>

      {/* 移动 / 笔记本 — Timeline 抽屉 (P2-F1) */}
      {mobileTimelineOpen && (
        <MobileTimelineDrawer onClose={() => setMobileTimelineOpen(false)}>
          <RichTimeline
            events={D.timelineEvents}
            onReply={D.canOperate ? (pid) => { D.setReplyingTo(pid); D.setReplyText(""); } : undefined}
            replyingTo={D.replyingTo}
            replyInput={
              <ReplyComposer
                value={D.replyText}
                onChange={D.setReplyText}
                onCancel={() => { D.setReplyingTo(null); D.setReplyText(""); }}
                onSubmit={async () => {
                  if (D.replyingTo) await D.onAddComment(D.replyText, D.replyingTo);
                }}
              />
            }
          />
        </MobileTimelineDrawer>
      )}

      {/* ─── Decision Dialogs ──────────────────────────────────────────── */}
      <ApproveDialog
        open={D.openDialog === "approve"}
        onOpenChange={(v) => !v && D.setOpenDialog(null)}
        isHighStakes={isHighStakes}
        amlHit={c.amlStatus === "hit"}
        onConfirm={async (reason, andNext) => {
          await D.handlers.approve(reason || undefined);
          if (andNext) await goToNextOrList();
        }}
      />
      <RejectDialog
        open={D.openDialog === "reject"}
        onOpenChange={(v) => !v && D.setOpenDialog(null)}
        onConfirm={async (reason, bl, andNext) => {
          await D.handlers.reject(reason, bl);
          if (andNext) await goToNextOrList();
        }}
      />
      <ResubmitDialog
        open={D.openDialog === "resubmit"}
        onOpenChange={(v) => !v && D.setOpenDialog(null)}
        onConfirm={async (reason, andNext) => {
          await D.handlers.resubmit(reason);
          if (andNext) await goToNextOrList();
        }}
      />
      <EscalateDialog
        open={D.openDialog === "escalate"}
        onOpenChange={(v) => !v && D.setOpenDialog(null)}
        escalatableSteps={D.escalatableSteps}
        escalateSteps={D.escalateSteps}
        setEscalateSteps={D.setEscalateSteps}
        escalateNote={D.escalateNote}
        setEscalateNote={D.setEscalateNote}
        onConfirm={async () => {
          await D.handlers.escalate(Array.from(D.escalateSteps), D.escalateNote);
        }}
      />
      <ReassignDialog
        open={reassignOpen}
        onOpenChange={setReassignOpen}
        currentAssigneeId={c.assigneeId}
        onConfirm={handleReassign}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Tab button                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

function TabButton({
  label, icon: Icon, active, onClick, badge,
}: {
  label: string;
  icon: typeof FileText;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium transition-colors ${
        active
          ? "bg-blue-50 text-primary"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
      {badge != null && badge > 0 && (
        <span className={`text-[10px] tabular-nums ${active ? "text-primary" : "text-slate-400"}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Mobile timeline drawer (P2-F1)                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

function MobileTimelineDrawer({
  children, onClose,
}: { children: React.ReactNode; onClose: () => void }) {
  // Esc 关闭
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm" />
      <div className="fixed top-0 right-0 bottom-0 z-50 w-[440px] max-w-[90vw] bg-white shadow-2xl flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <p className="text-sm font-bold text-slate-900">Timeline</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Keyboard hint button                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

function KeyboardHintButton({
  canOperate, isReviewing, canEscalate,
}: {
  canOperate: boolean;
  isReviewing: boolean;
  canEscalate: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!canOperate) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        title="Keyboard shortcuts"
      >
        <Keyboard className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="absolute right-0 top-full mt-1 w-60 z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs"
        >
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">
            Keyboard shortcuts
          </p>
          <dl className="space-y-1">
            {isReviewing && (
              <>
                <ShortcutRow keys={["A"]} label="Approve" />
                <ShortcutRow keys={["R"]} label="Reject" />
                <ShortcutRow keys={["S"]} label="Resubmit" />
                {canEscalate && <ShortcutRow keys={["E"]} label="Escalate" />}
              </>
            )}
            <ShortcutRow keys={["N"]} label="Open Notes tab" />
            <ShortcutRow keys={["T"]} label="Toggle Timeline drawer" />
            <ShortcutRow keys={["⌘/Ctrl", "Enter"]} label="Submit dialog" />
            <ShortcutRow keys={["@"]} label="Mention staff (in textarea)" />
          </dl>
        </div>
      )}
    </div>
  );
}

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-700">{label}</span>
      <span className="flex items-center gap-1">
        {keys.map((k, i) => (
          <kbd key={i} className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[10px] font-mono text-slate-700">
            {k}
          </kbd>
        ))}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Customer Tab                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */

function CustomerTab({ caseItem }: { caseItem: ReturnType<typeof useCaseDetail>["caseItem"] }) {
  if (!caseItem) return null;
  const c = caseItem;
  return (
    <div className="space-y-3">
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xl flex-shrink-0">
            {c.customerName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-slate-900 truncate">{c.customerName}</p>
            <p className="text-xs text-slate-500 font-mono">{c.customerUid}</p>
          </div>
          <Link
            href={`/crm/clients/${c.customerId}`}
            className="inline-flex items-center gap-1 px-3 h-8 rounded-md text-xs font-medium text-primary border border-blue-200 hover:bg-blue-50"
          >
            <ExternalLink className="w-3 h-3" />
            Open Customer
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
          <InfoRow label="Account" value={<AccountStatusBadge status={c.customerSnapshot?.accountStatus} />} />
          <InfoRow label="Country" value={<CountryFlag code={c.country} />} />
          <InfoRow label="KYC Level" value={c.kycLevel?.toUpperCase() || "—"} />
          <InfoRow label="Registered" value={fmtDate(c.customerSnapshot?.registrationDate || c.createdAt)} />
          {c.personalInfo?.registrationIp && (
            <InfoRow label="Reg. IP" value={
              <IPGeoPopover
                ip={c.personalInfo.registrationIp}
                geo={lookupIPGeo(c.personalInfo.registrationIp)}
              />
            } />
          )}
          {c.personalInfo?.registrationDevice && (
            <InfoRow label="Reg. Device" value={c.personalInfo.registrationDevice} />
          )}
          {c.personalInfo?.ibName && (
            <InfoRow label="Referred by IB" value={(() => {
              const ib = c.personalInfo?.ibReferral
                ? lookupIB(c.personalInfo.ibReferral) : null;
              return ib
                ? <IBSummaryHover ib={ib} />
                : `${c.personalInfo.ibName} (${c.personalInfo.ibId ?? "—"})`;
            })()} />
          )}
          {c.sourceChannel && (
            <InfoRow label="Source" value={c.sourceChannel} />
          )}
        </div>
      </section>

      {/* 历史 case 迷你时间线 (P1-B4) */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Prior Cases by this customer
        </h3>
        <CustomerCaseHistory customerId={c.customerId} currentCaseId={c.id} />
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Jump to customer module</p>
        <div className="grid grid-cols-4 gap-2">
          <JumpLink href={`/crm/clients/${c.customerId}`}              label="Profile"  icon={UserIcon} />
          <JumpLink href={`/crm/clients/${c.customerId}?tab=funds`}    label="Funds"    icon={Wallet} />
          <JumpLink href={`/crm/clients/${c.customerId}?tab=trading`}  label="Orders"   icon={TrendingUp} />
          <JumpLink href={`/crm/clients/${c.customerId}?tab=risk`}     label="Risk"     icon={Shield} />
        </div>
      </section>
    </div>
  );
}

function JumpLink({
  href, label, icon: Icon,
}: { href: string; label: string; icon: typeof FileText }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-slate-100 text-xs text-slate-600 hover:text-primary hover:border-blue-200 hover:bg-blue-50 transition-colors"
    >
      <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary flex-shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
