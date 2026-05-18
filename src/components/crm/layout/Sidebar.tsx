"use client";

import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  /* Group-level icons (used by TopNav). */
  Home,
  LayoutDashboard,
  Users,
  ShieldCheck,
  Wallet,
  TrendingUp,
  Network,
  AlertTriangle,
  Headphones,
  Megaphone,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Shield,
  UserCog,
  Puzzle,
  Building,
  SlidersHorizontal,
  ClipboardCheck,
  /* Submenu (level-2) icons — chosen to be distinct per item so each
     row reads as its own affordance rather than a column of the same
     glyph. */
  Activity,
  Filter,
  UserCheck,
  Inbox,
  ListChecks,
  LineChart,
  History,
  GitBranch,
  Workflow,
  Timer,
  BellRing,
  Tag,
  PieChart,
  Repeat,
  NotebookPen,
  Share2,
  FolderSearch,
  FileQuestion,
  FileText,
  FileSignature,
  UserX,
  ShieldAlert,
  Radar,
  Smartphone,
  Fingerprint,
  Ban,
  CheckCircle2,
  Calculator,
  FileWarning,
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  CreditCard,
  ListOrdered,
  Coins,
  Box,
  Ticket,
  Mail,
  MessageSquare,
  Bell,
  MessageCircle,
  Image as ImageIcon,
  Newspaper,
  DollarSign,
  GitMerge,
  BookOpen,
  KeyRound,
  Code2,
  type LucideIcon,
} from "lucide-react";
import { useCrmSidebarStore } from "@/store/crmSidebarStore";
import { useAuthStore } from "@/store/crm";
import { useReviewQueueCount } from "@/hooks/useReviewQueueCount";
import { useApprovalCount } from "@/hooks/useApprovalCount";
import { LinkPending } from "./LinkPending";
import { useT } from "@/lib/i18n/LocaleProvider";
import { shellLabel } from "@/lib/i18n/crm-shell";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Locale } from "@/lib/i18n/config";
import type { PermissionModule } from "@/types/backoffice/role";

// 菜单项类型 - 支持三级菜单 + 分割线 + 数字徽章 + 分组小标题
export interface MenuItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  permission?: PermissionModule;
  children?: MenuItem[];
  isSeparator?: boolean;
  /**
   * Render as a non-interactive section header (uppercase, faint).
   * Used to introduce a sub-group of related links (e.g. "Configuration"
   * under CLM Center) without nesting them in a collapsible.
   */
  isSectionLabel?: boolean;
  /**
   * Optional badge shown as a chip on the right of the row. Numbers
   * `> 0` render as a count pill; strings render as a label chip;
   * falsy values hide the chip. Sidebar's renderer injects dynamic
   * values (e.g. Review Queue active count) before rendering.
   */
  badge?: number | string | null;
}

export interface MenuGroup {
  group: string;
  icon: LucideIcon;
  permission: PermissionModule;
  items: MenuItem[];
  appId?: string; // 关联的应用ID，未安装时不显示
}

/* Pinned 7 — shown as horizontal tabs in TopNav. The remaining 7
 * groups live in TopNav's "More ▾" dropdown. See
 * docs/Top-Plus-Side-Nav.md §2. */
export const PINNED_GROUPS = [
  "Home",
  "Approval Center",
  "Clients",
  "CLM Center",
  "Risk Center",
  "Trading",
  "Funds",
] as const;

/* Sidebar menu — reverted to the v1 module-grouped layout (14 groups).
 *
 * The IA-v2 "7 doors" experiment was rolled back per operator
 * feedback. Module-named groups proved more navigable than the
 * functional doors abstraction — operators find pages by knowing
 * which subsystem owns them, not by job-stage. The Settings hub
 * page is left in place but no longer linked from the sidebar
 * (the TopBar user menu still surfaces user preferences at
 * /crm/settings, which falls back to that page).
 *
 * v3 Approval Center additions (Analytics + 4 config items + section
 * label) are retained — they predate the sidebar revert. */
export const menuGroups: MenuGroup[] = [
  {
    /* Home is the consolidated landing group — original Dashboard
       items, plus Reports and Support folded in under section labels.
       Reports/Support used to be standalone top-level groups; merging
       them here trims the overflow dropdown to 5 entries and gives
       operators a single "everything-overview" door. */
    group: "Home",
    icon: Home,
    permission: "dashboard",
    items: [
      /* Dashboard subsection */
      { label: "Dashboard", icon: Settings, isSectionLabel: true },
      { label: "Overview",          href: "/crm",             icon: LayoutDashboard, permission: "dashboard" },
      { label: "Real-time Monitor", href: "/crm/monitor",     icon: Activity,        permission: "dashboard" },
      { label: "Conversion Funnel", href: "/crm/funnel",      icon: Filter,          permission: "dashboard" },
      { label: "Client 360",        href: "/crm/client-360",  icon: UserCheck,       permission: "dashboard" },
      /* Reports subsection */
      { label: "Reports", icon: Settings, isSectionLabel: true },
      { label: "Financial Reports",  href: "/crm/reports/financial",  icon: DollarSign,  permission: "reports" },
      { label: "Trading Reports",    href: "/crm/reports/trading",    icon: LineChart,   permission: "reports" },
      { label: "User Reports",       href: "/crm/reports/users",      icon: Users,       permission: "reports" },
      { label: "Conversion Reports", href: "/crm/reports/conversion", icon: TrendingUp,  permission: "reports" },
      { label: "Compliance Reports", href: "/crm/reports/compliance", icon: ShieldCheck, permission: "reports" },
      /* Support subsection */
      { label: "Support", icon: Settings, isSectionLabel: true },
      { label: "Tickets",      href: "/crm/support/tickets", icon: Ticket,         permission: "accounts" },
      { label: "Email Log",    href: "/crm/support/emails",  icon: Mail,           permission: "accounts" },
      { label: "SMS Log",      href: "/crm/support/sms",     icon: MessageSquare,  permission: "accounts" },
      { label: "Push Log",     href: "/crm/support/push",    icon: Bell,           permission: "accounts" },
      { label: "Chat History", href: "/crm/support/chat",    icon: MessageCircle,  permission: "accounts" },
    ],
  },
  {
    group: "Approval Center",
    icon: ClipboardCheck,
    permission: "compliance",
    items: [
      { label: "Inbox",         href: "/crm/approvals/inbox",       icon: Inbox,       permission: "compliance" },
      { label: "All",           href: "/crm/approvals/all",         icon: ListChecks,  permission: "compliance" },
      { label: "Analytics",     href: "/crm/approvals/analytics",   icon: LineChart,   permission: "compliance" },
      { label: "Audit Trail",   href: "/crm/approvals/audit-trail", icon: History,     permission: "compliance" },
      { label: "Configuration", icon: Settings, isSectionLabel: true },
      { label: "Workflows",     href: "/crm/approvals/config/workflows",     icon: GitBranch, permission: "compliance" },
      { label: "Routing Rules", href: "/crm/approvals/config/routing",       icon: Workflow,  permission: "compliance" },
      { label: "SLA",           href: "/crm/approvals/config/sla",           icon: Timer,     permission: "compliance" },
      { label: "Notifications", href: "/crm/approvals/config/notifications", icon: BellRing,  permission: "compliance" },
    ],
  },
  {
    /* Clients group — reorganized into 4 subsections (Phase 4):
       Directory / Segmentation / Relationship & Risk / Collaboration.
       Old `/crm/clients/clusters` was folded into Relationships with
       `?view=clusters`; that path now redirects. */
    group: "Clients",
    icon: Users,
    permission: "accounts",
    items: [
      /* — Client Directory ———————————————— */
      { label: "Client Directory", icon: Settings, isSectionLabel: true },
      { label: "Client List",        href: "/crm/clients",               icon: Users,       permission: "accounts" },

      /* — Segmentation ————————————————————— */
      { label: "Segmentation", icon: Settings, isSectionLabel: true },
      { label: "Tags",               href: "/crm/clients/tags",          icon: Tag,         permission: "accounts" },
      { label: "Segments",           href: "/crm/clients/segments",      icon: PieChart,    permission: "accounts" },
      { label: "Lifecycle",          href: "/crm/clients/lifecycle",     icon: Repeat,      permission: "accounts" },
      { label: "Dynamic Rules",      href: "/crm/clients/rules",         icon: Workflow,    permission: "accounts" },

      /* — Relationship & Risk —————————————— */
      { label: "Relationship & Risk", icon: Settings, isSectionLabel: true },
      { label: "Relationships",      href: "/crm/clients/relationships",     icon: Share2,      permission: "accounts" },
      { label: "Device Clusters",    href: "/crm/clients/device-clusters",   icon: Smartphone,  permission: "accounts" },
      { label: "Shared Accounts",    href: "/crm/clients/shared-accounts",   icon: CreditCard,  permission: "accounts" },
      { label: "Linked Identities",  href: "/crm/clients/linked-identities", icon: Fingerprint, permission: "accounts" },

      /* — Collaboration ———————————————————— */
      { label: "Collaboration", icon: Settings, isSectionLabel: true },
      { label: "Notes",              href: "/crm/clients/notes",            icon: NotebookPen, permission: "accounts" },
      { label: "Follow-ups",         href: "/crm/clients/followups",        icon: ListChecks,  permission: "accounts" },
      { label: "Assignments",        href: "/crm/clients/assignments",      icon: UserCog,     permission: "accounts" },
      { label: "Team Activities",    href: "/crm/clients/team-activities",  icon: Activity,    permission: "accounts" },
    ],
  },
  {
    group: "CLM Center",
    icon: ShieldCheck,
    permission: "compliance",
    items: [
      { label: "Cases", href: "/crm/clm/cases", icon: FolderSearch, permission: "compliance" },
      { label: "Re-Verification", icon: Settings, isSectionLabel: true },
      { label: "Requests",  href: "/crm/clm/re-verification/requests",  icon: FileQuestion, permission: "compliance" },
      { label: "Templates", href: "/crm/clm/re-verification/templates", icon: FileText,     permission: "compliance" },
      { label: "History",   href: "/crm/clm/re-verification/history",   icon: History,      permission: "compliance" },
      { label: "Operations", icon: Settings, isSectionLabel: true },
      { label: "SLA & Monitoring", href: "/crm/clm/sla-monitoring", icon: Activity, permission: "compliance" },
      { label: "Configuration", icon: Settings, isSectionLabel: true },
      { label: "KYC Flows",           href: "/crm/clm/kyc-flows",      icon: GitBranch,         permission: "compliance" },
      { label: "Routing & Rules",     href: "/crm/clm/rules",          icon: Workflow,          permission: "compliance" },
      { label: "Agreement Documents", href: "/crm/clm/agreements",     icon: FileSignature,     permission: "compliance" },
      { label: "System Modules",      href: "/crm/clm/system-modules", icon: SlidersHorizontal, permission: "compliance" },
    ],
  },
  {
    group: "Risk Center",
    icon: AlertTriangle,
    permission: "risk",
    items: [
      { label: "Risk Dashboard",     href: "/crm/risk",            icon: Activity,     permission: "risk" },
      { label: "High-Risk Clients",  href: "/crm/risk/high-risk",  icon: UserX,        permission: "risk" },
      { label: "AML Hits",           href: "/crm/risk/aml",        icon: ShieldAlert,  permission: "risk" },
      { label: "Relationship Graph", href: "/crm/risk/graph",      icon: Share2,       permission: "risk" },
      { label: "Anomaly Detection",  href: "/crm/risk/anomalies",  icon: Radar,        permission: "risk" },
      { label: "Device & Security",  href: "/crm/risk/device",     icon: Smartphone,   permission: "risk" },
      { label: "Blacklist",          href: "/crm/risk/blacklist",  icon: Ban,          permission: "risk" },
      { label: "Whitelist",          href: "/crm/risk/whitelist",  icon: CheckCircle2, permission: "risk" },
      { label: "", icon: Settings, isSeparator: true },
      { label: "Scoring Policy",  href: "/crm/risk/scoring", icon: Calculator,  permission: "risk" },
      { label: "Risk Rules",      href: "/crm/risk/rules",   icon: FileWarning, permission: "risk" },
      { label: "Margin Alerts",   href: "/crm/risk/margin",  icon: AlertCircle, permission: "risk" },
      { label: "NBP Protection",  href: "/crm/risk/nbp",     icon: ShieldCheck, permission: "risk" },
    ],
  },
  {
    /* Funds — v2.2 推倒重建。23 项二级 + 7 个 section.
       完整设计见 docscc/产品文档/2026-05-17-funds-module-design-v2.1.md */
    group: "Funds",
    icon: Wallet,
    permission: "funds",
    items: [
      { label: "Overview",            href: "/crm/funds",                       icon: LayoutDashboard,   permission: "funds" },

      /* — Money Flow ———————————————————— */
      { label: "Money Flow",          icon: Settings, isSectionLabel: true },
      { label: "Transactions",        href: "/crm/funds/transactions",          icon: ArrowRightLeft,    permission: "funds" },
      { label: "Wallet Deposits",     href: "/crm/funds/wallet-deposits",       icon: ArrowDownCircle,   permission: "funds" },
      { label: "Wallet Withdrawals",  href: "/crm/funds/wallet-withdrawals",    icon: ArrowUpCircle,     permission: "funds" },
      { label: "Trading Deposits",    href: "/crm/funds/trading-deposits",      icon: ArrowDownCircle,   permission: "funds" },
      { label: "Trading Withdrawals", href: "/crm/funds/trading-withdrawals",   icon: ArrowUpCircle,     permission: "funds" },

      /* — Internal Transfer ——————————— */
      { label: "Internal Transfer",   icon: Settings, isSectionLabel: true },
      { label: "Transfers",           href: "/crm/funds/transfers",             icon: ArrowRightLeft,    permission: "funds" },

      /* — Money Assets —————————————————— */
      { label: "Money Assets",        icon: Settings, isSectionLabel: true },
      { label: "Wallets",             href: "/crm/funds/wallets",               icon: Wallet,            permission: "funds" },
      { label: "Beneficiaries",       href: "/crm/funds/beneficiaries",         icon: UserCheck,         permission: "funds" },
      { label: "Treasury",            href: "/crm/funds/treasury",              icon: Calculator,        permission: "funds" },

      /* — Channels ——————————————————— */
      { label: "Channels",            icon: Settings, isSectionLabel: true },
      { label: "Wallet Channels",     href: "/crm/funds/channels/wallet",       icon: CreditCard,        permission: "funds" },
      { label: "Trading Channels",    href: "/crm/funds/channels/trading",      icon: CreditCard,        permission: "funds" },
      { label: "Routing & Rules",     href: "/crm/funds/routing",               icon: Workflow,          permission: "funds" },
      { label: "Fees & Pricing",      href: "/crm/funds/channels/fees",         icon: DollarSign,        permission: "funds" },
      { label: "Bank Master Data",    href: "/crm/funds/channels/banks",        icon: Building,          permission: "funds" },

      /* — Rate Center ——————————————— */
      { label: "Rate Center",         icon: Settings, isSectionLabel: true },
      { label: "Rate Center",         href: "/crm/funds/rate-center",           icon: TrendingUp,        permission: "funds" },

      /* — Monitor & Recon —————————— */
      { label: "Monitor & Recon",     icon: Settings, isSectionLabel: true },
      { label: "Fund Monitoring",     href: "/crm/funds/monitoring",            icon: Activity,          permission: "funds" },
      { label: "Reconciliation",      href: "/crm/funds/reconciliation",        icon: GitMerge,          permission: "funds" },
      { label: "Adjustments",         href: "/crm/funds/adjustments",           icon: FileSignature,     permission: "funds" },

      /* — Governance ————————————————— */
      { label: "Governance",          icon: Settings, isSectionLabel: true },
      { label: "Policies & Limits",   href: "/crm/funds/policies",              icon: Settings,          permission: "funds" },
      { label: "Risk & Compliance",   href: "/crm/funds/risk",                  icon: ShieldCheck,       permission: "funds" },
      { label: "Approval Workflow",   href: "/crm/funds/workflow",              icon: GitBranch,         permission: "funds" },

      /* — Reports ——————————————————— */
      { label: "", icon: Settings, isSeparator: true },
      { label: "Reports",             href: "/crm/funds/reports",               icon: BarChart3,         permission: "funds" },
    ],
  },
  {
    group: "Trading",
    icon: TrendingUp,
    permission: "trading",
    items: [
      { label: "Orders",      href: "/crm/trading/orders",      icon: ListOrdered, permission: "trading" },
      { label: "Positions",   href: "/crm/trading/positions",   icon: LineChart,   permission: "trading" },
      { label: "Instruments", href: "/crm/trading/instruments", icon: Coins,       permission: "trading" },
      { label: "Accounts", icon: Settings, isSectionLabel: true },
      { label: "Account List",   href: "/crm/accounts",          icon: Wallet,            permission: "trading" },
      { label: "Account Groups", href: "/crm/accounts/groups",   icon: UserCog,           permission: "trading" },
      { label: "Leverage Config", href: "/crm/accounts/leverage", icon: SlidersHorizontal, permission: "trading" },
      { label: "", icon: Settings, isSeparator: true },
      { label: "Trading Settings", href: "/crm/trading/settings",            icon: Settings, permission: "trading" },
      { label: "Product Config",   href: "/crm/trading/instruments/config",  icon: Box,      permission: "trading" },
    ],
  },
  {
    group: "Marketing",
    icon: Megaphone,
    permission: "marketing",
    items: [
      { label: "Campaigns",         href: "/crm/marketing/campaigns", icon: Megaphone,     permission: "marketing" },
      { label: "Messages",          href: "/crm/marketing/messages",  icon: MessageSquare, permission: "marketing" },
      { label: "Banners",           href: "/crm/marketing/banners",   icon: ImageIcon,     permission: "marketing" },
      { label: "News / Insights",   href: "/crm/marketing/news",      icon: Newspaper,     permission: "marketing" },
    ],
  },
  {
    group: "IB",
    icon: Network,
    permission: "accounts",
    items: [
      { label: "IB Dashboard", href: "/crm/ib",              icon: LayoutDashboard, permission: "accounts" },
      { label: "IB Tree",      href: "/crm/ib/tree",         icon: GitMerge,        permission: "accounts" },
      { label: "Commissions",  href: "/crm/ib/commissions",  icon: DollarSign,      permission: "accounts" },
      { label: "IB Settings",  href: "/crm/ib/settings",     icon: Settings,        permission: "accounts" },
    ],
  },
  {
    group: "Setup Guide",
    icon: Sparkles,
    permission: "system",
    items: [
      { label: "Setup Checklist", href: "/crm/setup-guide",         icon: ListChecks, permission: "system" },
      { label: "Manuals & Docs",  href: "/crm/setup-guide/manuals", icon: BookOpen,   permission: "system" },
    ],
  },
  {
    group: "System",
    icon: Settings,
    permission: "system",
    items: [
      { label: "Staff Management",     href: "/crm/system/staff",       icon: UserCog,  permission: "system" },
      { label: "Departments",          href: "/crm/system/departments", icon: Building, permission: "system" },
      { label: "Roles & Permissions",  href: "/crm/system/roles",       icon: KeyRound, permission: "system" },
      { label: "Security Settings",    href: "/crm/system/security",    icon: Shield,   permission: "system" },
      { label: "Operation Logs",       href: "/crm/system/logs",        icon: History,  permission: "system" },
      { label: "API Management",       href: "/crm/system/api",         icon: Code2,    permission: "system" },
    ],
  },
  {
    group: "Apps",
    icon: Puzzle,
    permission: "system",
    items: [
      { label: "App Center", href: "/crm/apps", icon: Puzzle, permission: "system" },
    ],
  },
];

/* Resolve which group "owns" a given pathname.
 *
 * The first item with a longest-prefix match wins — so
 * `/crm/clm/cases/case-001` resolves to CLM Center via `/crm/clm/cases`,
 * not to Dashboard via the bare `/crm`. Used by both TopNav (to
 * highlight the active tab) and Sidebar (to filter visible items). */
export function findGroupForPath(pathname: string): MenuGroup | undefined {
  let best: { group: MenuGroup; depth: number } | undefined;
  for (const g of menuGroups) {
    for (const item of g.items) {
      const href = item.href;
      if (!href) continue;
      // Exact match wins always
      if (pathname === href) return g;
      // Don't let "/crm" match every sub-page — only its own
      if (href === "/crm") continue;
      if (pathname.startsWith(href + "/")) {
        if (!best || href.length > best.depth) best = { group: g, depth: href.length };
      }
    }
  }
  return best?.group;
}

// 二级菜单项组件
interface SubMenuItemProps {
  item: MenuItem;
  isActive: (href?: string) => boolean;
  locale: Locale;
}

const SubMenuItem = memo(function SubMenuItem({ item, isActive, locale }: SubMenuItemProps) {
  // Section label — small uppercase header, non-interactive
  if (item.isSectionLabel) {
    return (
      <div className="pt-3 pb-1 px-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {shellLabel(locale, item.label)}
        </span>
      </div>
    );
  }

  // 分割线渲染
  if (item.isSeparator) {
    return (
      <div className="py-2 px-3">
        <div className="h-px bg-slate-200" />
      </div>
    );
  }

  const active = isActive(item.href);
  const Icon = item.icon;

  // Badge — render only when truthy (skip 0 / empty / null)
  const showBadge = item.badge !== undefined && item.badge !== null && item.badge !== 0 && item.badge !== "";

  return (
    // `prefetch={false}` defeats Next's default per-link prefetch on this
    // ~30-item nav. In dev that prefetch was triggering parallel route
    // compilation across the whole CRM and starving the active page's
    // own requests, which is what made menu clicks feel laggy. Next will
    // still warm the route on hover/click — we just don't pre-warm every
    // entry up-front.
    //
    // `LinkPending` lives as a child so it can call `useLinkStatus()`
    // (which only works under a `<Link>` ancestor) and render a tiny
    // spinner exactly while *this* link's navigation is pending.
    <Link href={item.href || "#"} prefetch={false}>
      <div
        className={cn(
          "flex items-center justify-between gap-2 py-2 px-3 rounded-lg transition-all duration-200 group",
          active
            ? "bg-blue-50 text-blue-700"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <Icon
            size={16}
            className={cn(
              "flex-shrink-0",
              active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
            )}
          />
          <span className={cn("text-sm font-medium truncate", active && "font-semibold")}>
            {shellLabel(locale, item.label)}
          </span>
        </span>
        <span className="ml-2 inline-flex items-center gap-1.5 flex-shrink-0">
          <LinkPending />
          {showBadge && (
            <span
              className={cn(
                "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold tabular-nums",
                active
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
              )}
            >
              {item.badge}
            </span>
          )}
        </span>
      </div>
    </Link>
  );
});

// 三级菜单分组组件（可展开的应用项）
interface SubMenuGroupProps {
  item: MenuItem;
  isActive: (href?: string) => boolean;
  pathname: string;
  expanded: boolean;
  onToggle: () => void;
  locale: Locale;
}

const SubMenuGroup = memo(function SubMenuGroup({ item, isActive, pathname, expanded, onToggle, locale }: SubMenuGroupProps) {
  const Icon = item.icon;
  const groupActive = isActive(item.href);
  return (
    <div>
      {/* 应用入口 - 可展开 */}
      <div
        onClick={onToggle}
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-lg transition-all duration-200 cursor-pointer group",
          groupActive
            ? "bg-blue-50 text-blue-700"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <Icon
          size={16}
          className={cn(
            "flex-shrink-0",
            groupActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
          )}
        />
        <span className={cn("text-sm font-medium flex-1", groupActive && "font-semibold")}>
          {shellLabel(locale, item.label)}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "transition-transform duration-200 flex-shrink-0",
            groupActive ? "text-blue-500" : "text-slate-400",
            expanded ? "rotate-180" : ""
          )}
        />
      </div>
      {/* 子页面列表 — same prefetch suppression as SubMenuItem; the
          submenu only renders when expanded, so the cost was already
          bounded, but `prefetch={false}` keeps the dev compiler from
          firing on every render of an expanded submenu. */}
      {expanded && (
        <div className="mt-0.5 space-y-0.5">
          {item.children?.map((child) => {
            const ChildIcon = child.icon;
            const childActive = pathname === child.href;
            return (
              <Link
                key={child.href || child.label}
                href={child.href || "#"}
                prefetch={false}
              >
                <div
                  className={cn(
                    "flex items-center justify-between gap-2 py-2 pl-9 pr-3 rounded-lg transition-all duration-200 group",
                    childActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <ChildIcon
                      size={14}
                      className={cn(
                        "flex-shrink-0",
                        childActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    <span className={cn("text-sm font-medium truncate", childActive && "font-semibold")}>
                      {shellLabel(locale, child.label)}
                    </span>
                  </span>
                  <LinkPending />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
});

// 一级菜单项组件
interface MenuItemProps {
  group: MenuGroup;
  isExpanded: boolean;
  /** Receives the group name so Sidebar can keep a single stable
   *  callback reference instead of allocating a fresh arrow per group
   *  on every render — `MenuItem`'s `memo` is otherwise bypassed and
   *  every group re-renders on every Sidebar render. */
  onToggle: (groupName: string) => void;
  isActive: (href?: string) => boolean;
  pathname: string;
  collapsed: boolean;
  locale: Locale;
}

const MenuItem = memo(function MenuItem({ group, isExpanded, onToggle, isActive, pathname, collapsed, locale }: MenuItemProps) {
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const iconRef = useRef<HTMLDivElement>(null);
  // 管理 Apps 分组中各应用的展开状态
  const [expandedAppItems, setExpandedAppItems] = useState<Set<string>>(new Set());
  // 检查是否有子菜单被选中
  const hasActiveChild = group.items.some(item => isActive(item.href));
  // 检查是否有三级菜单被选中（用于 Apps 分组）
  const hasActiveGrandChild = group.items.some(item =>
    item.children?.some(child => pathname === child.href)
  );

  // 判断是否为选中状态（优先级最高）
  const isSelected = hasActiveChild || hasActiveGrandChild;
  // 判断是否为 hover 状态（选中状态下不应用 hover 样式）
  const isHovered = hovered && !isSelected;

  // 计算 tooltip 位置
  useEffect(() => {
    if (collapsed && hovered && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top + rect.height / 2,
        left: rect.right + 12,
      });
    }
  }, [collapsed, hovered]);

  const toggleAppItem = useCallback((label: string) => {
    setExpandedAppItems(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }, []);

  return (
    <div className="relative">
      <div
        className={cn(
          "group flex items-center gap-3 transition-all duration-200 rounded-xl cursor-pointer",
          collapsed
            ? "w-12 h-12 mx-auto justify-center"
            : "px-3 py-2.5",
          // 优先级：选中 > hover > 默认
          isSelected 
            ? "bg-blue-50/60" 
            : isHovered 
              ? "bg-slate-100/80" 
              : ""
        )}
        onClick={() => onToggle(group.group)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* 图标容器 */}
        <div
          ref={iconRef}
          className={cn(
            "flex items-center justify-center rounded-lg transition-all duration-200",
            // 优先级：选中 > hover > 默认
            isSelected
              ? "bg-blue-100 text-blue-600"
              : isHovered
                ? "bg-blue-50 text-blue-600"
                : "bg-slate-100 text-slate-500",
            collapsed ? "w-10 h-10" : "w-9 h-9"
          )}
        >
          <group.icon size={18} />
        </div>

        {/* 文字区域 - 收起时不显示 */}
        {!collapsed && (
          <div className="flex items-center flex-1 min-w-0">
            <span
              className={cn(
                "text-sm font-medium flex-1 transition-colors truncate",
                isSelected 
                  ? "text-blue-700" 
                  : isHovered 
                    ? "text-slate-900" 
                    : "text-slate-700"
              )}
            >
              {shellLabel(locale, group.group)}
            </span>
            <ChevronDown
              size={14}
              className={cn(
                "transition-transform duration-200 flex-shrink-0 ml-2",
                isSelected 
                  ? "text-blue-500" 
                  : "text-slate-400",
                isExpanded ? "rotate-180" : ""
              )}
            />
          </div>
        )}
      </div>

      {/* Tooltip for collapsed state - 使用 Portal 避免被裁剪 */}
      {collapsed && hovered && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed z-[9999] bg-slate-800 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-xl pointer-events-none"
          style={{ 
            top: tooltipPos.top, 
            left: tooltipPos.left,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full border-[6px] border-transparent border-r-slate-800" />
          {shellLabel(locale, group.group)}
        </div>,
        document.body
      )}

      {/* 二级菜单 - 展开时显示，二级菜单文字与一级菜单文字对齐 */}
      {isExpanded && !collapsed && (
        <div className="mt-1 space-y-0.5">
          {group.items.map((item) => {
            if (item.children && item.children.length > 0) {
              return (
                <SubMenuGroup
                  key={item.href || item.label}
                  item={item}
                  isActive={isActive}
                  pathname={pathname}
                  expanded={expandedAppItems.has(item.label)}
                  onToggle={() => toggleAppItem(item.label)}
                  locale={locale}
                />
              );
            }
            return <SubMenuItem key={item.href || item.label} item={item} isActive={isActive} locale={locale} />;
          })}
        </div>
      )}
    </div>
  );
});

interface SidebarProps {
  brandInitials?: string;
}

export function Sidebar(_props: SidebarProps) {
  const pathname = usePathname();
  // Slice-level Zustand subscriptions — destructuring the whole store
  // (`const { x, y } = useStore()`) makes the component re-render on
  // any slice change in the store, even unrelated ones. Splitting into
  // per-field selectors confines re-renders to the exact slices we use.
  const sidebarCollapsed = useCrmSidebarStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useCrmSidebarStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const { locale } = useT();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  // Live active-cases count for the Review Queue badge. Gated by a
  // permissions check: operators without compliance view rights would
  // never see the badge anyway, so we shouldn't be polling the case
  // service for them every 60 s.
  const canSeeComplianceBadge = useMemo(() => {
    if (!user) return false;
    const perms = user.role.permissions;
    return perms.some(
      (p) =>
        (p.module === "compliance" || p.module === "*") &&
        (p.actions as readonly string[]).some((a) => a === "view" || a === "*")
    );
  }, [user]);
  const { count: reviewQueueCount } = useReviewQueueCount({
    enabled: canSeeComplianceBadge,
  });
  const { count: approvalCount, overdue: approvalOverdue } = useApprovalCount({
    enabled: canSeeComplianceBadge,
  });

  // Filter menu groups based on permissions
  // Super admin bypasses expensive permission filtering entirely
  const filteredMenuGroups = useMemo(() => {
    // Inject dynamic badges into the static menu config. Doing this
    // here (vs. inside menuGroups) keeps configuration declarative and
    // hooks out of the static array.
    const withBadges = menuGroups.map((g) => {
      if (g.group === "Approval Center") {
        return {
          ...g,
          items: g.items.map((item) =>
            item.href === "/crm/approvals/inbox"
              ? {
                  ...item,
                  badge: approvalCount > 0
                    ? (approvalOverdue > 0 ? `${approvalCount} · ${approvalOverdue} ${shellLabel(locale, "overdue")}` : approvalCount)
                    : null,
                }
              : item
          ),
        };
      }
      if (g.group !== "CLM Center") return g;
      // CLM Review Queue was removed in v2; the equivalent badge now
      // lives on Approval Center → Inbox above. CLM Cases is a deep
      // specialist list, not a queue, so it doesn't get the live count.
      return {
        ...g,
        items: g.items.map((item) =>
          item.href === "/crm/clm/cases"
            ? { ...item, badge: reviewQueueCount > 0 ? reviewQueueCount : null }
            : item
        ),
      };
    });

    const isSuperAdmin = user?.role.id === 'super_admin' ||
      user?.role.permissions.some(p => p.module === '*' && p.actions.includes('*'));
    if (isSuperAdmin) return withBadges;

    const hasPermission = (module: string, action?: string): boolean => {
      if (!user) return false;
      const permissions = user.role.permissions;
      const modulePermission = permissions.find(p => p.module === module);
      if (!modulePermission) return false;
      if (action) {
        const actions = modulePermission.actions as readonly string[];
        return actions.includes('*') || actions.includes(action);
      }
      return true;
    };

    const groups = withBadges
      .map((group) => {
        const filteredItems = group.items.filter((item) => {
          if (!item.permission) return true;
          return hasPermission(item.permission, "view");
        });
        if (filteredItems.length === 0) return null;
        return { ...group, items: filteredItems };
      })
      .filter(Boolean) as MenuGroup[];

    return groups;
  }, [user, reviewQueueCount, approvalCount, approvalOverdue, locale]);

  const toggleGroup = useCallback((group: string) => {
    setExpandedGroup((prev) => (prev === group ? null : group));
  }, []);

  const isActive = useCallback((href?: string) => {
    if (!href) return false;
    // 精确匹配
    if (pathname === href) return true;
    // 子路径匹配：href 必须以 "/" 结尾，或者 pathname 在 href 后紧跟 "/"
    // 避免 /crm 匹配 /crm/xxx，但允许 /crm/accounts 匹配 /crm/accounts/groups
    if (href === "/crm") {
      // /crm 只精确匹配首页，不匹配子路径
      return pathname === "/crm";
    }
    return pathname.startsWith(href + "/");
  }, [pathname]);

  // 根据当前路径自动展开对应的分组（仅在 pathname 变化时执行）
  useEffect(() => {
    const currentGroup = filteredMenuGroups.find((g) =>
      g.items.some((item) => isActive(item.href) ||
        (item.children?.some(child => pathname === child.href))
      )
    );
    if (currentGroup) {
      setExpandedGroup(currentGroup.group);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps -- filteredMenuGroups stable for super_admin

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}

      {/* Sidebar — the brand logo lives in TopBar now, so the sidebar
          starts beneath the 64px TopBar row. This gives logo + 一级
          导航 a unified header band and lets the sidebar focus purely
          on the active group's items. */}
      <aside
        className={cn(
          "fixed top-[64px] left-0 h-[calc(100vh-64px)] z-40 bg-gradient-to-b from-slate-50 to-white border-r border-slate-200/80 transition-all duration-300 flex flex-col shadow-sm no-scrollbar",
          sidebarCollapsed ? "w-[80px]" : "w-[220px]",
          sidebarMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >

        {/* Menu — TopNav owns first-level navigation; the sidebar
            renders only the children of the currently active group.
            See docs/Top-Plus-Side-Nav.md.

            Collapse toggle is rendered inline at the top of <nav>:
            - expanded: on the group header row, right-aligned
            - collapsed: as the first rail item, centered
            …so it never floats half-off the sidebar edge — it lives
            inside the sidebar's left column. */}
        <nav className="flex-1 overflow-y-auto py-4 no-scrollbar">
          {(() => {
            const current = findGroupForPath(pathname);
            const activeGroup = current
              ? filteredMenuGroups.find((g) => g.group === current.group)
              : undefined;

            /* Toggle button reused across all three branches. Hidden
               on mobile (the mobile drawer uses the TopBar hamburger
               instead). */
            const collapseToggle = (
              <TooltipProvider delayDuration={80}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={toggleSidebar}
                      aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                      className="hidden lg:flex flex-shrink-0 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm items-center justify-center hover:bg-slate-50 hover:border-blue-300 transition-colors"
                    >
                      {sidebarCollapsed
                        ? <ChevronRight size={14} className="text-slate-500" />
                        : <ChevronLeft  size={14} className="text-slate-500" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {sidebarCollapsed ? shellLabel(locale, "Expand sidebar") : shellLabel(locale, "Collapse sidebar")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );

            if (!activeGroup) {
              return (
                <div>
                  <div className="px-3 pb-3 flex justify-end">{collapseToggle}</div>
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs text-slate-400">
                      {shellLabel(locale, "Choose a section from the top menu")}
                    </p>
                  </div>
                </div>
              );
            }
            if (sidebarCollapsed) {
              /* Collapsed rail — toggle sits at the top as the first
                 row, then every navigable child renders as an icon-only
                 square. Section labels become a thin slate divider.
                 Hover reveals the label via a Radix tooltip. */
              return (
                <TooltipProvider delayDuration={80} skipDelayDuration={120}>
                  <div className="px-2 space-y-1">
                    <div className="flex justify-center pb-2">{collapseToggle}</div>
                    {activeGroup.items.map((item, idx) => {
                      if (item.isSectionLabel || item.isSeparator) {
                        return (
                          <div
                            key={`divider-${idx}`}
                            className="my-2 mx-2 border-t border-slate-200/80"
                          />
                        );
                      }
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Tooltip key={item.href || item.label}>
                          <TooltipTrigger asChild>
                            <Link
                              href={item.href || "#"}
                              prefetch={false}
                              aria-label={shellLabel(locale, item.label)}
                              className={cn(
                                "flex items-center justify-center w-12 h-10 mx-auto rounded-lg transition-colors",
                                active
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                              )}
                            >
                              <Icon size={18} />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={8}>
                            {shellLabel(locale, item.label)}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>
              );
            }
            return (
              <div className="space-y-0.5">
                {/* Group header row — text on the left, toggle button
                    on the right. `pb-1` (vs the old pb-3) tightens the
                    gap between the group title and the first section
                    label below it; section label's own pt-3 still
                    provides enough breathing room. */}
                <div className="px-3 pb-1 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-700 truncate">
                    {shellLabel(locale, activeGroup.group)}
                  </span>
                  {collapseToggle}
                </div>
                {activeGroup.items.map((item) => {
                  if (item.children && item.children.length > 0) {
                    return (
                      <SubMenuGroup
                        key={item.href || item.label}
                        item={item}
                        isActive={isActive}
                        pathname={pathname}
                        expanded={expandedGroup === item.label}
                        onToggle={() => toggleGroup(item.label)}
                        locale={locale}
                      />
                    );
                  }
                  return (
                    <SubMenuItem
                      key={item.href || item.label}
                      item={item}
                      isActive={isActive}
                      locale={locale}
                    />
                  );
                })}
              </div>
            );
          })()}
        </nav>

        {/* Bottom Help */}
        <div className="p-3 border-t border-slate-100/80">
          {!sidebarCollapsed ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100/50">
              <p className="text-xs font-semibold text-blue-900 mb-0.5">{shellLabel(locale, "Need help?")}</p>
              <p className="text-[11px] text-blue-600">{shellLabel(locale, "Contact support")}</p>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center mx-auto border border-blue-100/50">
              <Headphones size={16} className="text-blue-600" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
