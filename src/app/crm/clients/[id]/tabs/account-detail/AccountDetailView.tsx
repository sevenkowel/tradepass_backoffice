"use client";

/**
 * AccountDetailView — Trading Account Operating Workspace
 *
 * 设计原则：
 *   1. **多维状态徽章** — 运营 / 风险 / 保证金 / 控制 / 标签 五条独立维度同时呈现。
 *   2. **Header 仅作信息展示 + 关闭入口** — 任何状态修改全部统一到 Risk & Controls Tab
 *      完成（带强制原因 + 操作日志 + 二次确认），列表层和 Header 都不直接修改状态。
 *   3. **6 Tab 结构** — Overview / Trading / Funds / Risk & Controls / Activity / Settings。
 *   4. **风控为灵魂** — Risk & Controls 是独立数据模型 (AccountControls)，每个开关都
 *      记录操作员、时间、原因；变更前弹二次确认。
 *
 * 容器要求：
 *   - 必须放在能撑出明确高度的父级里（如 Drawer fullBleed / CenterModal fullBleed）。
 *   - 自身用 `h-full + flex-col` 把 Header / TabBar / 内容区分层固定。
 *   - 内容区是唯一的滚动源（`overflow-y-auto`），TabBar 在其上方常驻。
 */

import { useMemo, useState } from "react";
import { Lock, X } from "lucide-react";
import type {
  TradingAccount, TradeRecord,
  AccountStatusBadge, AccountControls, AccountControlLog,
} from "@/types/backoffice/client-detail";
import {
  mockAccountFlow, mockOpenPositions, mockPendingOrders,
  mockStatusBadge, mockRiskMetrics, mockFinancialMetrics,
  mockTradingPerformance, mockBehavioralSignals,
  mockAccountControls, mockControlLog,
  mockAccountActivity, mockAccountPermissions, mockAccountSecurity,
} from "@/lib/crm/clients/mock-detail-data";
import { OverviewTab } from "./tabs/OverviewTab";
import { TradingTab } from "./tabs/TradingTab";
import { FundsTab } from "./tabs/FundsTab";
import { ControlsTab } from "./tabs/ControlsTab";
import { ActivityTab } from "./tabs/ActivityTab";
import { SettingsTab } from "./tabs/SettingsTab";

/** Account detail tab keys — exported so list pages can deep-link to a tab. */
export type AccountDetailTab =
  | "overview" | "trading" | "funds" | "controls" | "activity" | "settings";
type TabKey = AccountDetailTab;

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview",   label: "Overview" },
  { key: "trading",    label: "Trading" },
  { key: "funds",      label: "Funds" },
  { key: "controls",   label: "Risk & Controls" },
  { key: "activity",   label: "Activity" },
  { key: "settings",   label: "Settings" },
];

interface Props {
  account: TradingAccount;
  history: TradeRecord[];
  /** 初始 Tab — 列表行的 ⋯ 下拉用这个直接深链到指定 Tab。 */
  initialTab?: AccountDetailTab;
  /** 关闭工作台 — 由父级 (Drawer/Modal) 注入。Header 右上角 X 按钮调用。 */
  onClose?: () => void;
}

export function AccountDetailView({ account, history, initialTab, onClose }: Props) {
  // `initialTab` 只在 mount 时生效；当父级需要"换 Tab 深链"时通过修改 React `key`
  // 强制 remount 来对齐——这样不需要 effect 同步 prop→state，避开 React 19
  // 的 react-hooks/set-state-in-effect 规则。
  const [tab, setTab] = useState<TabKey>(initialTab ?? "overview");

  // 本地可编辑状态 — 操作员的开关变更立刻反映到 UI（仅用于演示，真实场景由 API 写回）。
  const [controls, setControls] = useState<AccountControls>(() => mockAccountControls(account));
  const [controlLogs, setControlLogs] = useState<AccountControlLog[]>(() => mockControlLog(account, 8));

  const flow      = useMemo(() => mockAccountFlow(account, 30), [account]);
  const positions = useMemo(() => mockOpenPositions(account),    [account]);
  const pending   = useMemo(() => mockPendingOrders(account),    [account]);

  const badge          = useMemo(() => mockStatusBadge(account, controls), [account, controls]);
  const riskMetrics    = useMemo(() => mockRiskMetrics(account),           [account]);
  const finMetrics     = useMemo(() => mockFinancialMetrics(account),      [account]);
  const performance    = useMemo(() => mockTradingPerformance(account, history), [account, history]);
  const behavioral     = useMemo(() => mockBehavioralSignals(account, history),  [account, history]);
  const activity       = useMemo(
    () => mockAccountActivity(account, history, flow, controlLogs),
    [account, history, flow, controlLogs],
  );
  const permissions    = useMemo(() => mockAccountPermissions(account),    [account]);
  const security       = useMemo(() => mockAccountSecurity(account),       [account]);

  const handleControlChange = (
    next: AccountControls,
    log: Omit<AccountControlLog, "id" | "timestamp" | "accountId">,
  ) => {
    setControls(next);
    setControlLogs((prev) => [
      {
        ...log,
        id: `live_ctrl_${Date.now()}`,
        accountId: account.id,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header (1 row) ─────────────────────────────────────────── */}
      <AccountHeader account={account} badge={badge} onClose={onClose} />

      {/* ── Tab bar ────────────────────────────────────────────────── */}
      <div className="border-b border-slate-100 px-6 bg-white shrink-0">
        <nav className="flex items-center gap-1 -mb-px">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-baseline gap-1.5 ${
                  active
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <span>{t.label}</span>
                {t.key === "controls" && riskMetrics.alerts.length > 0 && (
                  <span className="ml-0.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-semibold bg-red-100 text-red-700 rounded">
                    {riskMetrics.alerts.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Tab content (the only scrolling region) ─────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
        {tab === "overview"  && (
          <OverviewTab
            account={account}
            badge={badge}
            risk={riskMetrics}
            financial={finMetrics}
            performance={performance}
            behavioral={behavioral}
          />
        )}
        {tab === "trading"   && (
          <TradingTab
            account={account}
            positions={positions}
            pending={pending}
            history={history}
          />
        )}
        {tab === "funds"     && (
          <FundsTab
            account={account}
            flow={flow}
          />
        )}
        {tab === "controls"  && (
          <ControlsTab
            account={account}
            controls={controls}
            logs={controlLogs}
            riskAlerts={riskMetrics.alerts}
            onChange={handleControlChange}
          />
        )}
        {tab === "activity"  && (
          <ActivityTab
            activity={activity}
            currency={account.currency}
          />
        )}
        {tab === "settings"  && (
          <SettingsTab
            account={account}
            permissions={permissions}
            security={security}
          />
        )}
      </div>
    </div>
  );
}

/* ===================================================================== */
/* AccountHeader — single row, info-only, with close button               */
/* ===================================================================== */

function AccountHeader({
  account, badge, onClose,
}: {
  account: TradingAccount;
  badge: AccountStatusBadge;
  onClose?: () => void;
}) {
  return (
    <div className="px-6 py-3 border-b border-slate-100 bg-gradient-to-b from-slate-50/60 to-white shrink-0">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Account number */}
        <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
          {account.mtAccount}
        </span>

        {/* Identity chips */}
        <Chip>{account.platform}</Chip>
        <Chip>{account.accountType}</Chip>

        {/* Metadata strip */}
        <span className="text-slate-300 mx-0.5">·</span>
        <span className="text-xs text-slate-500 font-mono">{account.server}</span>
        <span className="text-xs text-slate-400">{account.currency}</span>
        <span className="text-xs text-slate-400">{account.tradingMode}</span>

        {/* Spacer */}
        <span className="text-slate-300 mx-0.5">·</span>

        {/* Status badges — only render non-default values */}
        <BadgeChip dim="operational" value={badge.operational} />
        <BadgeChip dim="risk"        value={badge.risk} />
        <BadgeChip dim="margin"      value={badge.margin} />
        <BadgeChip dim="control"     value={badge.control} />
        {badge.flags?.map((f) => <BadgeChip key={f} dim="flag" value={f} />)}

        {/* Close button - pushed to far right */}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* Chips & badges                                                        */
/* --------------------------------------------------------------------- */

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
      {children}
    </span>
  );
}

/**
 * 多维徽章 — 每条状态线独立颜色。
 *  operational: 绿 (active) / 黄 (restricted) / 红 (disabled)
 *  risk:        灰 (normal) / 蓝 (watch) / 黄 (warning) / 红 (critical)
 *  margin:      绿 (healthy) / 黄 (warning) / 橙 (call) / 红 (stopout)
 *  control:     灰 (open) / 紫 (锁定状态)
 *  flag:        中性配色
 */
function BadgeChip({ dim, value }: { dim: string; value: string }) {
  const labelMap: Record<string, string> = {
    active: "Active",
    restricted: "Restricted",
    disabled: "Disabled",
    normal: "Risk Normal",
    watch: "Risk Watch",
    warning: dim === "margin" ? "Margin Warning" : "Risk Warning",
    critical: "Risk Critical",
    healthy: "Margin Healthy",
    call: "Margin Call",
    stopout: "Stopout",
    open: "Open",
    withdrawal_locked: "Withdrawal Locked",
    trading_locked: "Trading Locked",
    fully_locked: "Fully Locked",
    readonly: "Read-only",
    trial: "Trial",
    expiring_soon: "Expiring Soon",
    high_priority: "High Priority",
    under_review: "Under Review",
  };
  const toneMap: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    restricted: "bg-amber-50 text-amber-700 border-amber-200",
    disabled: "bg-red-50 text-red-700 border-red-200",
    normal: "bg-slate-100 text-slate-600 border-slate-200",
    watch: "bg-sky-50 text-sky-700 border-sky-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    critical: "bg-red-50 text-red-700 border-red-200",
    healthy: "bg-emerald-50 text-emerald-700 border-emerald-200",
    call: "bg-orange-50 text-orange-700 border-orange-200",
    stopout: "bg-red-50 text-red-700 border-red-200",
    open: "bg-slate-100 text-slate-600 border-slate-200",
    withdrawal_locked: "bg-violet-50 text-violet-700 border-violet-200",
    trading_locked: "bg-violet-50 text-violet-700 border-violet-200",
    fully_locked: "bg-violet-100 text-violet-800 border-violet-300",
    readonly: "bg-violet-50 text-violet-700 border-violet-200",
    trial: "bg-blue-50 text-blue-700 border-blue-200",
    expiring_soon: "bg-amber-50 text-amber-700 border-amber-200",
    high_priority: "bg-pink-50 text-pink-700 border-pink-200",
    under_review: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };
  // 默认（如 open / normal / healthy）不渲染，避免噪音
  const noisy = ["open", "normal", "healthy"];
  if (noisy.includes(value)) return null;
  const showLock = value.includes("locked") || value === "readonly";
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium border ${toneMap[value] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
    >
      {showLock && <Lock className="w-2.5 h-2.5" />}
      {labelMap[value] ?? value}
    </span>
  );
}
