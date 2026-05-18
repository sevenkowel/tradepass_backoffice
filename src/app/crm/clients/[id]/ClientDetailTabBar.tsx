"use client";

/**
 * ClientDetailTabBar — 9 一级 Tab 横向导航.
 *
 * 9 个一级 Tab（按运营场景域组织，按业务动线 账户 → 钱 → 交易 → 合规 排序）：
 *   1. 概览 / 2. 账户 / 3. 订单 / 4. 资金 / 5. 档案与合规
 *   6. 风险与安全 / 7. 运营 / 8. 审计 / 9. 增长
 *
 * 设计变更：
 *   - 2026-05-15：删除右侧「操作」下拉。所有快捷操作收纳到左侧 Sidebar 的
 *     QuickControls 卡，让操作入口只有一个集中位置。
 *   - 2026-05-16：新增「订单」「资金」两个一级 Tab。
 *   - 2026-05-17：Tab 支持 badge 计数（待处理事项 / 高风险等），
 *     徽章颜色按"是否紧急"分级（红 = critical，琥珀 = warning，蓝 = info）。
 */

import {
  LayoutDashboard, Briefcase, IdCard, Shield, ClipboardList,
  History, TrendingUp, LineChart, Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ClientTabKey =
  | "overview" | "accounts" | "trading" | "funds" | "profile"
  | "risk" | "operations" | "audit" | "growth";

interface TabSpec {
  key: ClientTabKey;
  label: string;
  icon: LucideIcon;
}

/** 单个 Tab 的徽章配置。tone 决定红/橙/蓝。 */
export interface TabBadge {
  count: number;
  tone: "danger" | "warning" | "info";
  /** Hover 提示文案。 */
  title?: string;
  /** 自上次访问以来"新增的告警数"（P1-18 未读指示）。 */
  delta?: number;
}

export type TabBadges = Partial<Record<ClientTabKey, TabBadge>>;

const TABS: TabSpec[] = [
  { key: "overview",   label: "概览",       icon: LayoutDashboard },
  { key: "accounts",   label: "账户",       icon: Briefcase },
  { key: "trading",    label: "订单",       icon: LineChart },
  { key: "funds",      label: "资金",       icon: Wallet },
  { key: "profile",    label: "档案与合规", icon: IdCard },
  { key: "risk",       label: "风险与安全", icon: Shield },
  { key: "operations", label: "运营",       icon: ClipboardList },
  { key: "audit",      label: "审计",       icon: History },
  { key: "growth",     label: "增长",       icon: TrendingUp },
];

interface Props {
  activeTab: ClientTabKey;
  onChange: (key: ClientTabKey) => void;
  /** 每个 Tab 上要显示的徽章（pending KYC / 待审申请 / 风险告警 等）。 */
  badges?: TabBadges;
}

export function ClientDetailTabBar({ activeTab, onChange, badges }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-1 sticky top-0 z-10">
      <div className="flex items-center gap-1 flex-wrap">
        {TABS.map((tab) => (
          <TabButton
            key={tab.key}
            tab={tab}
            isActive={activeTab === tab.key}
            badge={badges?.[tab.key]}
            onClick={() => onChange(tab.key)}
          />
        ))}
      </div>
    </div>
  );
}

function TabButton({
  tab, isActive, onClick, badge,
}: {
  tab: TabSpec;
  isActive: boolean;
  onClick: () => void;
  badge?: TabBadge;
}) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      title={badge?.title}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
        isActive
          ? "bg-blue-50 text-primary"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{tab.label}</span>
      {badge && badge.count > 0 && <Badge {...badge} />}
      {/* 未读小红点（新增告警 > 0 时） */}
      {badge && badge.delta && badge.delta > 0 && (
        <span
          className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse"
          title={`新增 ${badge.delta} 个告警`}
        />
      )}
    </button>
  );
}

function Badge({ count, tone }: TabBadge) {
  const tone_ = tone === "danger" ? "bg-red-500 text-white"
    : tone === "warning" ? "bg-amber-500 text-white"
    : "bg-blue-500 text-white";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold tabular-nums",
        tone_,
      )}
      aria-label={`${count} items need attention`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** 合法一级 Tab key 数组 — 用于 URL 校验。 */
export const VALID_PRIMARY_TABS: readonly ClientTabKey[] = TABS.map((t) => t.key);

export function isValidPrimaryTab(v: string | null): v is ClientTabKey {
  return v !== null && (VALID_PRIMARY_TABS as readonly string[]).includes(v);
}

/** Tab 切换的下一个/上一个 — 用于 Cmd+]/[ 快捷键。 */
export function getAdjacentTab(current: ClientTabKey, direction: "next" | "prev"): ClientTabKey {
  const idx = VALID_PRIMARY_TABS.indexOf(current);
  if (idx === -1) return "overview";
  const len = VALID_PRIMARY_TABS.length;
  const next = direction === "next" ? (idx + 1) % len : (idx - 1 + len) % len;
  return VALID_PRIMARY_TABS[next];
}
