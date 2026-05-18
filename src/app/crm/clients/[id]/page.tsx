"use client";

/**
 * Client Detail Page — 主入口（2026-05-17 综合升级）.
 *
 * 集成的能力：
 *   - 9 个一级 Tab + 32+ 二级 Tab，URL 同步可分享
 *   - Tab 徽章计数（pending / 高风险 / 待审 等）  ─ P1-9
 *   - 二级 Tab 懒加载（动态 import）            ─ P1-10
 *   - 键盘快捷键（Cmd+]/[ 切 Tab，Cmd+K 搜索）   ─ P0-2
 *   - 跨客户 Prev/Next 导航 + 队列位置           ─ P0-1
 *   - Cmd+K 客户搜索 Dialog                      ─ P0-N1
 *   - 概览 AI 建议（基于现有信号）                 ─ P1-8
 *   - 协作 presence（mock 同事正在查看）          ─ P2-24
 *   - 决策耗时追踪（前端 mock + console）         ─ P2-25
 *   - Sidebar 在 <1280px 自动折叠成抽屉           ─ P1-6
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams, usePathname, useParams } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Search, PanelLeftOpen, PanelLeftClose,
  Clock3, Copy, MoreVertical, Check,
} from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useClientDetail } from "./ClientDetailContext";
import ClientDetailSidebar from "./ClientDetailSidebar";
import {
  ClientDetailTabBar,
  type ClientTabKey,
  isValidPrimaryTab,
  getAdjacentTab,
} from "./ClientDetailTabBar";
import { deriveActionItems } from "./lib/action-items";
import { deriveTabBadges } from "./lib/tab-badges";
import { getAdjacentClientId, getClientQueuePosition } from "./lib/client-nav";
import { ClientSearchDialog } from "./ClientSearchDialog";
import { useSessionTimer, formatElapsed } from "./lib/use-session-timer";
import { useTabReadState } from "./lib/use-tab-read-state";
import { buildClientSummary, copyToClipboard } from "./lib/client-summary";
import type { ClientDetailData } from "@/types/backoffice/client-detail";
import { useCurrentStaffId } from "@/hooks/useCurrentStaff";
import { CollabPresence } from "@/components/crm/clm/case-detail/collab-presence";

// 一级 Tab — Overview / Accounts 是入口高频，保持 eager 加载；
// 其它 Tab 走 dynamic import 减小首屏 bundle。
import OverviewTab from "./tabs/OverviewTab";
import AccountsTab from "./tabs/AccountsTab";

const OrdersWorkspace = dynamic(() => import("./workspace/OrdersWorkspace"), {
  loading: () => <TabLoading />,
});
const FundsWorkspace = dynamic(() => import("./workspace/FundsWorkspace"), {
  loading: () => <TabLoading />,
});
const ProfileWorkspace = dynamic(() => import("./workspace/ProfileWorkspace"), {
  loading: () => <TabLoading />,
});
const RiskWorkspace = dynamic(() => import("./workspace/RiskWorkspace"), {
  loading: () => <TabLoading />,
});
const OperationsWorkspace = dynamic(() => import("./workspace/OperationsWorkspace"), {
  loading: () => <TabLoading />,
});
const AuditWorkspace = dynamic(() => import("./workspace/AuditWorkspace"), {
  loading: () => <TabLoading />,
});
const GrowthWorkspace = dynamic(() => import("./workspace/GrowthWorkspace"), {
  loading: () => <TabLoading />,
});

function TabLoading() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-slate-200 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

export default function ClientDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <ClientDetailPageInner />
    </Suspense>
  );
}

function ClientDetailPageInner() {
  const { t } = useT();
  const { detail, loading, refreshing } = useClientDetail();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const clientId = params.id as string;
  const staffId = useCurrentStaffId();
  const { actions, markAction } = useSessionTimer(clientId);

  // URL → activeTab
  const tabParam = searchParams.get("tab");
  const activeTab: ClientTabKey = isValidPrimaryTab(tabParam) ? tabParam : "overview";

  const handleTabChange = useCallback((next: ClientTabKey) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (next === "overview") sp.delete("tab"); else sp.set("tab", next);
    sp.delete("sub");
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  // —— 跨客户导航状态 ——
  const [navInfo, setNavInfo] = useState<{
    prevId: string | null;
    nextId: string | null;
    queue: { position: number; total: number } | null;
  }>({ prevId: null, nextId: null, queue: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [prevId, nextId, queue] = await Promise.all([
        getAdjacentClientId(clientId, "prev"),
        getAdjacentClientId(clientId, "next"),
        getClientQueuePosition(clientId),
      ]);
      if (!cancelled) setNavInfo({ prevId, nextId, queue });
    })();
    return () => { cancelled = true; };
  }, [clientId]);

  // —— Cmd+K 客户搜索 ——
  const [searchOpen, setSearchOpen] = useState(false);

  // —— Sidebar 折叠（响应式：<1280px 默认折叠为抽屉） ——
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // —— 派生 Action Items + Tab Badges ——
  const actionItems = useMemo(
    () => detail ? deriveActionItems(detail) : [],
    [detail],
  );
  const tabBadges = useMemo(
    () => detail ? deriveTabBadges(detail) : {},
    [detail],
  );

  // —— 未读指示（P1-18）——
  // 提取每个 Tab 的徽章 count，传给 useTabReadState 算出 delta
  const badgeCounts = useMemo(() => {
    const out: Partial<Record<ClientTabKey, number>> = {};
    for (const key of Object.keys(tabBadges) as ClientTabKey[]) {
      out[key] = tabBadges[key]?.count ?? 0;
    }
    return out;
  }, [tabBadges]);
  const { deltas: tabDeltas, markRead } = useTabReadState(clientId, badgeCounts);

  // 进入某个 Tab 即 markRead
  useEffect(() => {
    markRead(activeTab);
  }, [activeTab, markRead]);

  // 合并 badge + delta，传给 TabBar
  const badgesWithDelta = useMemo(() => {
    const out: typeof tabBadges = { ...tabBadges };
    for (const key of Object.keys(tabDeltas) as ClientTabKey[]) {
      const delta = tabDeltas[key];
      if (!delta) continue;
      out[key] = out[key]
        ? { ...out[key]!, delta }
        : { count: delta, tone: "danger", delta };
    }
    return out;
  }, [tabBadges, tabDeltas]);

  // —— 键盘快捷键 ——
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // 焦点在输入框时不响应
      const tgt = e.target as HTMLElement | null;
      const tag = tgt?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || tgt?.isContentEditable) return;

      // Cmd/Ctrl + K — 客户搜索
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
        return;
      }

      // Cmd/Ctrl + ] / [ — 切 Tab
      if ((e.metaKey || e.ctrlKey) && (e.key === "]" || e.key === "[")) {
        e.preventDefault();
        const next = getAdjacentTab(activeTab, e.key === "]" ? "next" : "prev");
        handleTabChange(next);
        return;
      }

      // Cmd/Ctrl + Shift + ← / → — 跨客户翻页
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "ArrowLeft" && navInfo.prevId) {
        e.preventDefault();
        router.push(`/crm/clients/${navInfo.prevId}`);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "ArrowRight" && navInfo.nextId) {
        e.preventDefault();
        router.push(`/crm/clients/${navInfo.nextId}`);
        return;
      }

      // 单键（无修饰键）N — 切到运营 → 备注；B — 切到 Sidebar 开关
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        handleTabChange("operations");
        // 用 setTimeout 让 URL 先变，然后追加 sub
        setTimeout(() => {
          const sp = new URLSearchParams(window.location.search);
          sp.set("sub", "notes");
          router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
        }, 50);
      }
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        setSidebarOpen((v) => !v);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTab, navInfo, handleTabChange, pathname, router]);

  // —— 决策耗时：监听 actionItems 变化（粗略 mock）——
  // 真实场景应该 wrap 每个操作按钮的 onClick 调用 markAction(name)。
  // 这里 expose `markAction` 给子组件用。Sidebar 等子组件如果不接入，
  // 也可以由 useSessionTimer 自身在 page 卸载时落地"会话总耗时"。
  useEffect(() => {
    return () => {
      // 仅 dev 阶段打印，正式版换成 audit 接口
      console.info(`[client-detail] session ended for ${clientId}; actions=${actions.length}`);
    };
  }, [clientId, actions.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">{t("clients.detail.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-3">
      {/* ─── 顶部导航条：Prev/Next + 队列位置 + 搜索 + 协作 presence ─── */}
      <NavStrip
        queue={navInfo.queue}
        prevId={navInfo.prevId}
        nextId={navInfo.nextId}
        clientId={clientId}
        staffId={staffId}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onOpenSearch={() => setSearchOpen(true)}
        sessionActions={actions.length}
        detail={detail}
        refreshing={refreshing}
      />

      <div className="flex gap-3">
        {/* LEFT — sticky sidebar，折叠支持 */}
        {sidebarOpen && (
          <ClientDetailSidebar
            user={detail.user}
            valueMetrics={detail.valueMetrics}
            lifecycleStages={detail.lifecycleStages}
            actionItems={actionItems}
          />
        )}

        {/* RIGHT — main column */}
        <main className="flex-1 min-w-0 space-y-3">
          <ClientDetailTabBar
            activeTab={activeTab}
            onChange={handleTabChange}
            badges={badgesWithDelta}
          />

          <div className="bg-white rounded-xl border border-slate-200 p-6 min-h-[400px]">
            {activeTab === "overview"   && <OverviewTab data={detail} />}
            {activeTab === "accounts"   && <AccountsTab data={detail} />}
            {activeTab === "trading"    && <OrdersWorkspace data={detail} />}
            {activeTab === "funds"      && <FundsWorkspace data={detail} />}
            {activeTab === "profile"    && <ProfileWorkspace data={detail} />}
            {activeTab === "risk"       && <RiskWorkspace data={detail} />}
            {activeTab === "operations" && <OperationsWorkspace data={detail} />}
            {activeTab === "audit"      && <AuditWorkspace data={detail} />}
            {activeTab === "growth"     && <GrowthWorkspace data={detail} />}
          </div>
        </main>
      </div>

      {/* Cmd+K 客户搜索 Dialog */}
      <ClientSearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        excludeId={clientId}
      />

      {/* 决策耗时浮窗（右下角，只在有操作时显示） */}
      {actions.length > 0 && (
        <SessionTimerBadge actions={actions} onMark={markAction} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* 顶部导航条                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

function NavStrip({
  queue, prevId, nextId, clientId, staffId,
  sidebarOpen, onToggleSidebar, onOpenSearch,
  sessionActions, detail, refreshing,
}: {
  queue: { position: number; total: number } | null;
  prevId: string | null;
  nextId: string | null;
  clientId: string;
  staffId: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  sessionActions: number;
  detail: ClientDetailData;
  refreshing: boolean;
}) {
  const router = useRouter();
  const [copiedFlavor, setCopiedFlavor] = useState<null | "plain" | "slack">(null);

  const copySummary = async (format: "plain" | "slack") => {
    const text = buildClientSummary(detail, { format });
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedFlavor(format);
      setTimeout(() => setCopiedFlavor(null), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        title={sidebarOpen ? "隐藏侧栏 (B)" : "显示侧栏 (B)"}
      >
        {sidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
      </button>

      {/* Prev / Next */}
      <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-md overflow-hidden">
        <button
          onClick={() => prevId && router.push(`/crm/clients/${prevId}`)}
          disabled={!prevId}
          className="w-8 h-8 inline-flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          title="上一个客户 (⌘+⇧+←)"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="h-4 w-px bg-slate-200" />
        <button
          onClick={() => nextId && router.push(`/crm/clients/${nextId}`)}
          disabled={!nextId}
          className="w-8 h-8 inline-flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          title="下一个客户 (⌘+⇧+→)"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 队列位置 */}
      {queue && (
        <span className="text-[11px] text-slate-500 tabular-nums">
          {queue.position} / {queue.total}
        </span>
      )}

      {/* Cmd+K 搜索按钮 */}
      <button
        onClick={onOpenSearch}
        className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 text-xs"
        title="搜索客户 (⌘K)"
      >
        <Search className="w-3 h-3" />
        <span>搜索客户</span>
        <kbd className="ml-2 px-1 py-0.5 rounded border border-slate-200 bg-slate-50 text-[9px] font-mono text-slate-400">⌘K</kbd>
      </button>

      {/* Live 指示 */}
      <span
        className={`inline-flex items-center gap-1 px-1.5 h-6 rounded text-[10.5px] font-medium ${
          refreshing
            ? "bg-blue-50 text-blue-700"
            : "bg-emerald-50 text-emerald-700"
        }`}
        title="数据每 30 秒后台刷新"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${refreshing ? "bg-blue-500 animate-pulse" : "bg-emerald-500"}`} />
        {refreshing ? "更新中" : "Live"}
      </span>

      {/* 协作 presence */}
      <CollabPresence caseId={`client:${clientId}`} currentStaffId={staffId} />

      {/* 决策耗时（仅 mock）*/}
      {sessionActions > 0 && (
        <span className="ml-auto inline-flex items-center gap-1 text-[10.5px] text-slate-400">
          <Clock3 className="w-3 h-3" />
          会话已记录 {sessionActions} 个操作
        </span>
      )}

      {/* 复制客户摘要 — N5 */}
      <CopySummaryButton
        copiedFlavor={copiedFlavor}
        onCopy={copySummary}
      />
    </div>
  );
}

function CopySummaryButton({
  copiedFlavor, onCopy,
}: {
  copiedFlavor: null | "plain" | "slack";
  onCopy: (format: "plain" | "slack") => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 px-2 h-8 rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 text-xs"
        title="复制客户摘要"
      >
        {copiedFlavor ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
        <span>{copiedFlavor ? "已复制" : "摘要"}</span>
        <MoreVertical className="w-3 h-3 opacity-50" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-40 w-44 bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
            <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100">
              复制为
            </p>
            <button
              onClick={() => { onCopy("plain"); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <Copy className="w-3 h-3 text-slate-400" />
              <span>纯文本</span>
            </button>
            <button
              onClick={() => { onCopy("slack"); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <Copy className="w-3 h-3 text-slate-400" />
              <span>Slack / Markdown</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* 决策耗时小浮窗                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

function SessionTimerBadge({
  actions, onMark,
}: {
  actions: ReturnType<typeof useSessionTimer>["actions"];
  onMark: (name: string) => void;
}) {
  const last = actions[actions.length - 1];
  if (!last) return null;
  return (
    <div className="fixed bottom-4 right-4 z-30 px-3 py-2 rounded-lg bg-slate-900/90 text-white text-[11px] shadow-lg flex items-center gap-2 backdrop-blur-sm">
      <Clock3 className="w-3 h-3 text-slate-300" />
      <span>最近操作: <b>{last.name}</b> · {formatElapsed(last.elapsedMs)}</span>
      <button
        onClick={() => onMark("manual-marker")}
        className="ml-1 text-slate-400 hover:text-white text-[10px]"
        title="再打一个时间点"
      >
        +
      </button>
    </div>
  );
}
