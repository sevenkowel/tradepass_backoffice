"use client";

/**
 * 决策对话框 — Approve / Reject / Resubmit / Escalate / Reassign.
 *
 * 升级点（2026-05-17 P0/P1）：
 *   - Reject / Resubmit / Escalate 加常用理由模板（P0-A2）
 *   - 所有 reason / note textarea 接 MentionTextarea，支持 @同事（P0-C1）
 *   - Approve：critical / AML hit 时强制双确认（reason ≥ 20 字 + 复核 checkbox）(P0-E3)
 *   - Approve & Next / Reject & Next / Resubmit & Next 自动跳下一个 case（P1-A3）
 *   - Reassign Dialog 新增（P1-C2）
 */

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle, MessageSquare, UserCheck } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import type { KYCFlowStepInfo } from "@/types/clm";
import { KYC_FLOW_STEP_LABELS } from "@/types/clm";
import { MentionTextarea } from "@/components/crm/notes/MentionTextarea";
import { mockStaff } from "@/lib/backoffice/mock-staff";

/* ─────────────────────────────────────────────────────────────────────────── */
/* Templates                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

const REJECT_TEMPLATES = [
  { tag: "资料不齐",      text: "提交的资料不完整，缺少必要文件。" },
  { tag: "图片模糊",      text: "提交的证件照片不清晰，无法识别关键信息。" },
  { tag: "国家不匹配",    text: "申报国家与证件签发国不一致，无法通过合规要求。" },
  { tag: "风险过高",      text: "综合风险评分超出可接受阈值，根据合规策略拒绝。" },
  { tag: "疑似多账户",    text: "检测到共享 IP / 设备的多个账户，存在重复注册嫌疑。" },
  { tag: "制裁名单",      text: "AML 筛查命中制裁/PEP 名单，依法不予办理。" },
  { tag: "证件过期",      text: "提交的证件已过期，无法作为有效身份证明。" },
  { tag: "信息伪造",      text: "证件存在 P 图或伪造嫌疑，已转交风控复查。" },
];

const RESUBMIT_TEMPLATES = [
  { tag: "重拍证件",     text: "证件照片模糊，请在光线充足处重新拍摄一张清晰的，确保四角完整、信息可读。" },
  { tag: "证件缺角",     text: "上传的证件有缺角或裁切到关键信息，请重新拍摄完整证件。" },
  { tag: "地址证明过期", text: "地址证明文件已过期（超过 3 个月），请上传 3 个月内的水电账单 / 银行月结单。" },
  { tag: "姓名不一致",   text: "申报姓名与证件不一致，请确认并修改填写的姓名信息。" },
  { tag: "证件类型不符", text: "提交的证件类型不被支持。请上传护照 / 身份证 / 驾驶执照 之一。" },
  { tag: "需补充自拍",   text: "请补充手持证件的清晰自拍，与证件一同入镜。" },
];

const ESCALATE_TEMPLATES = [
  { tag: "高金额复核",   text: "涉及金额较大，按双人复核规则上报。" },
  { tag: "AML 复查",     text: "AML 筛查命中疑似项，需要合规组进一步核查。" },
  { tag: "多账户疑似",   text: "检测到共享 IP / 设备的多账户，建议关系网络复核。" },
  { tag: "证件真伪存疑", text: "证件存在伪造嫌疑，需专业鉴定。" },
];

function TemplateChips({
  templates, onPick,
}: {
  templates: { tag: string; text: string }[];
  onPick: (text: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {templates.map((t) => (
        <button
          key={t.tag}
          type="button"
          onClick={() => onPick(t.text)}
          className="px-2 h-6 rounded-md text-[11px] font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 transition-colors"
          title={t.text}
        >
          {t.tag}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Approve                                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

const HIGH_STAKES_MIN_REASON = 20;

export function ApproveDialog({
  open, onOpenChange, isHighStakes, amlHit, onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isHighStakes: boolean;
  amlHit: boolean;
  /** When `andNext` is true, caller should advance to the next case after success. */
  onConfirm: (reason: string, andNext: boolean) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [doubleCheck, setDoubleCheck] = useState(false);
  const [loading, setLoading] = useState<null | "ok" | "ok-next">(null);
  const reasonRequired = isHighStakes;
  const reasonLengthOk = !reasonRequired || reason.trim().length >= HIGH_STAKES_MIN_REASON;
  const checkboxOk = !isHighStakes || doubleCheck;
  const canSubmit = reasonLengthOk && checkboxOk;

  useEffect(() => {
    if (!open) { setReason(""); setDoubleCheck(false); setLoading(null); }
  }, [open]);

  const submit = async (andNext: boolean) => {
    setLoading(andNext ? "ok-next" : "ok");
    try { await onConfirm(reason, andNext); }
    finally { setLoading(null); }
  };

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
              <div className="text-xs text-amber-800 space-y-0.5">
                <p className="font-semibold">
                  {amlHit ? "AML hit — explicit justification required." : "High-risk case — please document your reasoning."}
                </p>
                <p>Reason ≥ {HIGH_STAKES_MIN_REASON} 字，并须勾选下方复核确认。</p>
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Reason {reasonRequired && <span className="text-red-600">*</span>}</span>
              {reasonRequired && (
                <span className={`text-[10px] tabular-nums ${reasonLengthOk ? "text-emerald-600" : "text-slate-400"}`}>
                  {reason.trim().length} / {HIGH_STAKES_MIN_REASON}
                </span>
              )}
            </p>
            <MentionTextarea
              value={reason}
              onChange={setReason}
              placeholder={reasonRequired
                ? "Required: justification for approving despite risk signals (@ to mention)"
                : "Optional notes for the audit trail (@ to mention)"}
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          {isHighStakes && (
            <label className="flex items-start gap-2 cursor-pointer px-3 py-2 bg-red-50 border border-red-200 rounded-md">
              <input
                type="checkbox"
                checked={doubleCheck}
                onChange={(e) => setDoubleCheck(e.target.checked)}
                className="rounded mt-0.5"
              />
              <div>
                <p className="text-sm font-semibold text-red-700">I have reviewed all risk factors</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Confirms you have read AML hits, risk score and device/IP signals before approving.
                </p>
              </div>
            </label>
          )}
        </div>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
            Cancel
          </button>
          <button
            onClick={() => submit(false)}
            disabled={!!loading || !canSubmit}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === "ok" ? "Approving…" : "Approve"}
          </button>
          <button
            onClick={() => submit(true)}
            disabled={!!loading || !canSubmit}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Approve then open the next pending case"
          >
            {loading === "ok-next" ? "Approving…" : "Approve & Next →"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Reject                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

export function RejectDialog({
  open, onOpenChange, onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (reason: string, blacklist: boolean, andNext: boolean) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [blacklist, setBlacklist] = useState(false);
  const [loading, setLoading] = useState<null | "ok" | "ok-next">(null);

  useEffect(() => {
    if (!open) { setReason(""); setBlacklist(false); setLoading(null); }
  }, [open]);

  const submit = async (andNext: boolean) => {
    setLoading(andNext ? "ok-next" : "ok");
    try { await onConfirm(reason, blacklist, andNext); }
    finally { setLoading(null); }
  };

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
              <span className="text-slate-400 font-normal ml-2">点击模板快速填充</span>
            </p>
            <TemplateChips
              templates={REJECT_TEMPLATES}
              onPick={(text) => setReason((cur) => cur ? cur + "\n" + text : text)}
            />
            <div className="mt-2">
              <MentionTextarea
                value={reason}
                onChange={setReason}
                placeholder="Required: why is the application rejected? (@ to mention)"
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </div>
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
            onClick={() => submit(false)}
            disabled={!!loading || !reason.trim()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === "ok" ? "Rejecting…" : (blacklist ? "Reject + Blacklist" : "Reject")}
          </button>
          <button
            onClick={() => submit(true)}
            disabled={!!loading || !reason.trim()}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === "ok-next" ? "Rejecting…" : "Reject & Next →"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Resubmit                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

export function ResubmitDialog({
  open, onOpenChange, onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (reason: string, andNext: boolean) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState<null | "ok" | "ok-next">(null);

  useEffect(() => {
    if (!open) { setReason(""); setLoading(null); }
  }, [open]);

  const submit = async (andNext: boolean) => {
    setLoading(andNext ? "ok-next" : "ok");
    try { await onConfirm(reason, andNext); }
    finally { setLoading(null); }
  };

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
              <span className="text-slate-400 font-normal ml-2">点击模板快速填充</span>
            </p>
            <TemplateChips
              templates={RESUBMIT_TEMPLATES}
              onPick={(text) => setReason((cur) => cur ? cur + "\n" + text : text)}
            />
            <div className="mt-2">
              <MentionTextarea
                value={reason}
                onChange={setReason}
                placeholder="e.g. The document is blurry — please re-upload a sharp photo of the same ID. (@ to mention)"
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
            Cancel
          </button>
          <button
            onClick={() => submit(false)}
            disabled={!!loading || !reason.trim()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === "ok" ? "Sending…" : "Send back"}
          </button>
          <button
            onClick={() => submit(true)}
            disabled={!!loading || !reason.trim()}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === "ok-next" ? "Sending…" : "Send & Next →"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Escalate                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

export function EscalateDialog({
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
          <DialogTitle>Escalate review</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">Add verification steps</p>
            {escalatableSteps.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">All verification steps are already part of this flow — nothing left to add.</p>
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
            <p className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>
                Note {escalatableSteps.length === 0
                  ? <span className="text-red-600">*</span>
                  : <span className="text-slate-400 font-normal">(optional)</span>}
              </span>
              <span className="text-slate-400 font-normal text-[10.5px]">点击模板填充</span>
            </p>
            <TemplateChips
              templates={ESCALATE_TEMPLATES}
              onPick={(text) => setEscalateNote(escalateNote ? escalateNote + "\n" + text : text)}
            />
            <div className="mt-2">
              <MentionTextarea
                value={escalateNote}
                onChange={setEscalateNote}
                placeholder={
                  escalatableSteps.length === 0
                    ? "Required — explain why this case needs escalation. (@ to mention)"
                    : "Reason or additional context for the escalation… (@ to mention)"
                }
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              loading ||
              (escalatableSteps.length > 0 && escalateSteps.size === 0) ||
              (escalatableSteps.length === 0 && !escalateNote.trim())
            }
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Escalating…" : "Confirm Escalate"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Reassign (P1-C2) — 一键转交                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

export function ReassignDialog({
  open, onOpenChange, currentAssigneeId, onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentAssigneeId?: string;
  onConfirm: (assigneeId: string, note: string) => Promise<void>;
}) {
  const [assigneeId, setAssigneeId] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) { setAssigneeId(""); setNote(""); setLoading(false); }
  }, [open]);

  const candidates = mockStaff.filter((s) => s.id !== currentAssigneeId);

  const submit = async () => {
    if (!assigneeId) return;
    setLoading(true);
    try { await onConfirm(assigneeId, note); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            Reassign case
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1.5">
              New assignee <span className="text-red-600">*</span>
            </p>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="">— Pick a colleague —</option>
              {candidates.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} {s.nickname ? `(@${s.nickname})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1.5">
              Note <span className="text-slate-400 font-normal">(optional)</span>
            </p>
            <MentionTextarea
              value={note}
              onChange={setNote}
              placeholder="Why are you reassigning? (@ to mention)"
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading || !assigneeId}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Reassigning…" : "Reassign"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
