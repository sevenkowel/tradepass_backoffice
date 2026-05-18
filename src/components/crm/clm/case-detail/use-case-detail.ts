"use client";

/**
 * useCaseDetail — 把原 page.tsx 主组件里的 state / service / handlers 全部
 * 打包成一个 hook，A/D 两个 preview 布局都用它。
 *
 * 这样布局组件可以专心做 layout / Hero / Tab / Sidebar 等视觉，逻辑完全
 * 重用，不会跟原 page.tsx 漂移。
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { caseService } from "@/lib/clm/services";
import type { CLMCase, CaseComment, CaseDetail } from "@/types/clm";
import { useCurrentStaff, useCurrentStaffId } from "@/hooks/useCurrentStaff";
import { useToast } from "@/components/ui/use-toast";
import { computeSLA as computeSLAShared } from "@/components/crm/clm/case-detail/bits";

export type DialogKind = "approve" | "reject" | "resubmit" | "escalate" | null;

export interface UseCaseDetailResult {
  caseItem: (CLMCase & Partial<CaseDetail>) | null;
  loading: boolean;
  slaInfo: ReturnType<typeof computeSLAShared>;
  staffId: string;

  /* Flags */
  isFinal: boolean;
  isPending: boolean;
  isReviewing: boolean;
  canOperate: boolean;
  isKYC: boolean;
  canEscalate: boolean;
  docMaterials: NonNullable<CaseDetail["submittedMaterials"]>;
  escalatableSteps: NonNullable<CaseDetail["kycFlowSteps"]>;
  timelineEvents: NonNullable<CaseDetail["timeline"]>;

  /* Dialogs */
  openDialog: DialogKind;
  setOpenDialog: (k: DialogKind) => void;

  /* Escalate dialog data */
  escalateSteps: Set<string>;
  setEscalateSteps: React.Dispatch<React.SetStateAction<Set<string>>>;
  escalateNote: string;
  setEscalateNote: (v: string) => void;

  /* Reply (inline timeline reply) */
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyText: string;
  setReplyText: (s: string) => void;

  /* Quick-note composer */
  quickNote: string;
  setQuickNote: (s: string) => void;

  /* Handlers */
  handlers: {
    approve:  (n?: string) => Promise<void>;
    reject:   (r: string, bl: boolean) => Promise<void>;
    resubmit: (r: string) => Promise<void>;
    escalate: (steps: string[], note: string) => Promise<void>;
    accept:   () => Promise<void>;
  };

  /* Comments */
  onAddComment: (content: string, parentId?: string) => Promise<void>;
}

export function useCaseDetail(caseId: string): UseCaseDetailResult {
  const staffId = useCurrentStaffId();
  const currentStaff = useCurrentStaff();
  const toast = useToast();

  const [caseItem, setCaseItem] = useState<(CLMCase & Partial<CaseDetail>) | null>(null);
  const [slaInfo, setSlaInfo] = useState<ReturnType<typeof computeSLAShared>>({
    status: "normal", label: "", urgent: false, overdue: false,
  });
  const [loading, setLoading] = useState(true);

  const [openDialog, setOpenDialog] = useState<DialogKind>(null);
  const [escalateSteps, setEscalateSteps] = useState<Set<string>>(new Set());
  const [escalateNote, setEscalateNote] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [quickNote, setQuickNote] = useState("");

  /* Load case once + poll SLA */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await caseService.getById(caseId);
        const item = data as (CLMCase & Partial<CaseDetail>);
        setCaseItem(item);
        if (item) setSlaInfo(computeSLAShared(item.slaDueAt));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [caseId]);

  useEffect(() => {
    if (!caseItem) return;
    const t = setInterval(
      () => setSlaInfo(computeSLAShared(caseItem.slaDueAt)),
      15000,
    );
    return () => clearInterval(t);
  }, [caseItem]);

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

  /* Handlers */
  const handlers = useMemo(() => ({
    approve: async (n?: string) => {
      try {
        await caseService.approve(caseId, staffId, n);
        setOpenDialog(null);
        await refresh();
        toast.success("Case approved");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Please try again.", {
          title: "Failed to approve case",
        });
        throw err;
      }
    },
    reject: async (r: string, bl: boolean) => {
      try {
        await caseService.reject(caseId, staffId, bl ? `BLACKLIST: ${r}` : r);
        setOpenDialog(null);
        await refresh();
        toast.success(bl ? "Case rejected + blacklisted" : "Case rejected");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Please try again.", {
          title: "Failed to reject case",
        });
        throw err;
      }
    },
    resubmit: async (r: string) => {
      try {
        await caseService.requestResubmission(caseId, staffId, r);
        setOpenDialog(null);
        await refresh();
        toast.success("Resubmission requested");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Please try again.", {
          title: "Failed to request resubmission",
        });
        throw err;
      }
    },
    escalate: async (steps: string[], note: string) => {
      try {
        // 升级消息把附加 KYC step + note 组合成一段文字（与原 page 一致）
        const msg = steps.length
          ? `Escalate: add [${steps.join(", ")}]. Note: ${note}`
          : note;
        await caseService.escalate(caseId, staffId, msg);
        setOpenDialog(null);
        await refresh();
        toast.success("Case escalated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Please try again.", {
          title: "Failed to escalate case",
        });
        throw err;
      }
    },
    accept: async () => {
      try {
        // "Accept" = 把自己设为 assignee；原 page 使用 caseService.assign(caseId, me, me)
        await caseService.assign(caseId, staffId, staffId);
        await refresh();
        toast.success("Case assigned to you");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Please try again.", {
          title: "Failed to assign case",
        });
        throw err;
      }
    },
  }), [caseId, staffId, refresh, toast]);

  /* Comments */
  const onAddComment = useCallback(async (content: string, parentId?: string) => {
    const text = content.trim();
    if (!text) return;
    const nc: CaseComment = {
      id: typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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

  /* Derived flags */
  const isFinal = !!caseItem && ["approved", "rejected", "auto_approved", "auto_rejected", "cancelled", "expired"].includes(caseItem.status);
  const isPending = caseItem?.status === "pending";
  const isReviewing = !!caseItem && ["reviewing", "resubmission", "escalated"].includes(caseItem.status);
  const canOperate = !!caseItem && !isFinal;

  const isKYC = !!caseItem && ["kyc", "edd", "source_of_wealth", "manual_review", "re_verification"].includes(caseItem.type);
  const kycSteps = caseItem?.kycFlowSteps ?? [];
  const escalatableSteps = kycSteps.filter((s) => !s.included);
  const canEscalate = isKYC && escalatableSteps.length > 0;

  const docMaterials = useMemo(
    () => caseItem?.submittedMaterials?.filter(
      (m) => m.type !== "liveness_image" && m.type !== "liveness_video"
    ) ?? [],
    [caseItem?.submittedMaterials],
  );

  /* Timeline events are sorted oldest → newest by the service. The RichTimeline
   * component expects newest first. Pure derivation in render is fine — it's
   * just a sort/reverse. */
  const timelineEvents = useMemo(() => {
    const raw = caseItem?.timeline ?? [];
    return raw.slice().reverse();
  }, [caseItem?.timeline]);

  return {
    caseItem,
    loading,
    slaInfo,
    staffId,
    isFinal,
    isPending,
    isReviewing,
    canOperate,
    isKYC,
    canEscalate,
    docMaterials,
    escalatableSteps,
    timelineEvents,
    openDialog,
    setOpenDialog,
    escalateSteps,
    setEscalateSteps,
    escalateNote,
    setEscalateNote,
    replyingTo,
    setReplyingTo,
    replyText,
    setReplyText,
    quickNote,
    setQuickNote,
    handlers,
    onAddComment,
  };
}
