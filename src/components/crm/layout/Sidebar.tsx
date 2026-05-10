"use client";

import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
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
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Shield,
  UserCog,
  Puzzle,
  Building,
  Briefcase,
  ClipboardList,
  FileSearch,
  Gauge,
  ScrollText,
  SlidersHorizontal,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { useCrmSidebarStore } from "@/store/crmSidebarStore";
import { useAuthStore } from "@/store/crm";
import { useReviewQueueCount } from "@/hooks/useReviewQueueCount";
import type { PermissionModule } from "@/types/backoffice/role";

// 菜单项类型 - 支持三级菜单 + 分割线 + 数字徽章 + 分组小标题
interface MenuItem {
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

interface MenuGroup {
  group: string;
  icon: LucideIcon;
  permission: PermissionModule;
  items: MenuItem[];
  appId?: string; // 关联的应用ID，未安装时不显示
}

// 菜单配置 - 所有菜单项（v2 重构版）
// 设计原则：配置去中心化 · 专业视图独立 · 聚合引导入口
const menuGroups: MenuGroup[] = [
  {
    group: "Dashboard",
    icon: LayoutDashboard,
    permission: "dashboard",
    items: [
      { label: "Overview", href: "/crm", icon: LayoutDashboard, permission: "dashboard" },
      { label: "Real-time Monitor", href: "/crm/monitor", icon: TrendingUp, permission: "dashboard" },
      { label: "Conversion Funnel", href: "/crm/funnel", icon: BarChart3, permission: "dashboard" },
      { label: "Client 360", href: "/crm/client-360", icon: Users, permission: "dashboard" },
    ],
  },
  {
    group: "Clients",
    icon: Users,
    permission: "accounts",
    items: [
      { label: "Client List", href: "/crm/clients", icon: Users, permission: "accounts" },
      { label: "Tags", href: "/crm/clients/tags", icon: Users, permission: "accounts" },
      { label: "Segments", href: "/crm/clients/segments", icon: Users, permission: "accounts" },
      { label: "Lifecycle", href: "/crm/clients/lifecycle", icon: Users, permission: "accounts" },
      { label: "Notes", href: "/crm/clients/notes", icon: Users, permission: "accounts" },
      { label: "Relationships", href: "/crm/clients/relationships", icon: Network, permission: "accounts" },
    ],
  },
  {
    // CLM Center — operations on top, configuration below an
    // uppercase "Configuration" section label. Two visual tricks
    // signal the lower priority of the config items without hiding
    // them behind a click:
    //   1. The "Configuration" section label introduces the group.
    //   2. Items still render as normal SubMenuItems, but the section
    //      header sets reader expectations (these are settings).
    group: "CLM Center",
    icon: ShieldCheck,
    permission: "compliance",
    items: [
      { label: "Workspace", href: "/crm/clm/workspace", icon: Briefcase, permission: "compliance" },
      { label: "Review Queue", href: "/crm/clm/review-queue", icon: ClipboardList, permission: "compliance" },
      { label: "Cases", href: "/crm/clm/cases", icon: FileSearch, permission: "compliance" },
      { label: "SLA & Monitoring", href: "/crm/clm/sla-monitoring", icon: Gauge, permission: "compliance" },
      { label: "Audit Trail", href: "/crm/clm/audit-trail", icon: ScrollText, permission: "compliance" },
      { label: "Configuration", icon: Settings, isSectionLabel: true },
      { label: "KYC Policies", href: "/crm/clm/policies", icon: SlidersHorizontal, permission: "compliance" },
      { label: "KYC Levels", href: "/crm/clm/levels", icon: Layers, permission: "compliance" },
      { label: "Forms & Fields", href: "/crm/clm/forms", icon: Settings, permission: "compliance" },
      { label: "Templates", href: "/crm/clm/templates", icon: Shield, permission: "compliance" },
      { label: "Agreements", href: "/crm/clm/agreements", icon: ScrollText, permission: "compliance" },
      { label: "Workflows", href: "/crm/clm/workflows", icon: Settings, permission: "compliance" },
    ],
  },
  {
    group: "Risk Center",
    icon: AlertTriangle,
    permission: "risk",
    items: [
      { label: "Risk Dashboard", href: "/crm/risk", icon: AlertTriangle, permission: "risk" },
      { label: "High-Risk Clients", href: "/crm/risk/high-risk", icon: AlertTriangle, permission: "risk" },
      { label: "AML Hits", href: "/crm/risk/aml", icon: AlertTriangle, permission: "risk" },
      { label: "Relationship Graph", href: "/crm/risk/graph", icon: Network, permission: "risk" },
      { label: "Anomaly Detection", href: "/crm/risk/anomalies", icon: AlertTriangle, permission: "risk" },
      { label: "Device & Security", href: "/crm/risk/device", icon: AlertTriangle, permission: "risk" },
      { label: "Blacklist", href: "/crm/risk/blacklist", icon: AlertTriangle, permission: "risk" },
      { label: "Whitelist", href: "/crm/risk/whitelist", icon: AlertTriangle, permission: "risk" },
      { label: "", icon: AlertTriangle, isSeparator: true },
      { label: "Scoring Policy", href: "/crm/risk/scoring", icon: SlidersHorizontal, permission: "risk" },
      { label: "Risk Rules", href: "/crm/risk/rules", icon: AlertTriangle, permission: "risk" },
      { label: "Margin Alerts", href: "/crm/risk/margin", icon: AlertTriangle, permission: "risk" },
      { label: "NBP Protection", href: "/crm/risk/nbp", icon: AlertTriangle, permission: "risk" },
    ],
  },
  {
    group: "Funds",
    icon: Wallet,
    permission: "funds",
    items: [
      { label: "Deposits", href: "/crm/funds/deposits", icon: Wallet, permission: "funds" },
      { label: "Withdrawal Review", href: "/crm/funds/withdrawal-review", icon: Wallet, permission: "funds" },
      { label: "Transactions", href: "/crm/funds/transactions", icon: Wallet, permission: "funds" },
      { label: "Payment Channels", href: "/crm/funds/channels", icon: Wallet, permission: "funds" },
      { label: "", icon: Wallet, isSeparator: true },
      { label: "Fund Policy", href: "/crm/funds/policy", icon: Settings, permission: "funds" },
    ],
  },
  {
    group: "Trading",
    icon: TrendingUp,
    permission: "trading",
    items: [
      { label: "Orders", href: "/crm/trading/orders", icon: TrendingUp, permission: "trading" },
      { label: "Positions", href: "/crm/trading/positions", icon: TrendingUp, permission: "trading" },
      { label: "Instruments", href: "/crm/trading/instruments", icon: TrendingUp, permission: "trading" },
      { label: "", icon: TrendingUp, isSeparator: true },
      { label: "Trading Settings", href: "/crm/trading/settings", icon: Settings, permission: "trading" },
      { label: "Product Config", href: "/crm/trading/instruments/config", icon: Settings, permission: "trading" },
    ],
  },
  {
    group: "Support",
    icon: Headphones,
    permission: "accounts",
    items: [
      { label: "Tickets", href: "/crm/support/tickets", icon: Headphones, permission: "accounts" },
      { label: "Email Log", href: "/crm/support/emails", icon: Headphones, permission: "accounts" },
      { label: "SMS Log", href: "/crm/support/sms", icon: Headphones, permission: "accounts" },
      { label: "Push Log", href: "/crm/support/push", icon: Headphones, permission: "accounts" },
      { label: "Chat History", href: "/crm/support/chat", icon: Headphones, permission: "accounts" },
    ],
  },
  {
    group: "Marketing",
    icon: Megaphone,
    permission: "marketing",
    items: [
      { label: "Campaigns", href: "/crm/marketing/campaigns", icon: Megaphone, permission: "marketing" },
      { label: "Messages", href: "/crm/marketing/messages", icon: Megaphone, permission: "marketing" },
      { label: "Banners", href: "/crm/marketing/banners", icon: Megaphone, permission: "marketing" },
      { label: "News / Insights", href: "/crm/marketing/news", icon: Megaphone, permission: "marketing" },
    ],
  },
  {
    group: "Reports",
    icon: BarChart3,
    permission: "reports",
    items: [
      { label: "Financial Reports", href: "/crm/reports/financial", icon: BarChart3, permission: "reports" },
      { label: "Trading Reports", href: "/crm/reports/trading", icon: BarChart3, permission: "reports" },
      { label: "User Reports", href: "/crm/reports/users", icon: BarChart3, permission: "reports" },
      { label: "Conversion Reports", href: "/crm/reports/conversion", icon: BarChart3, permission: "reports" },
      { label: "Compliance Reports", href: "/crm/reports/compliance", icon: BarChart3, permission: "reports" },
    ],
  },
  {
    group: "IB",
    icon: Network,
    permission: "accounts",
    items: [
      { label: "IB Dashboard", href: "/crm/ib", icon: Network, permission: "accounts" },
    ],
  },
  {
    group: "Setup Guide",
    icon: Sparkles,
    permission: "system",
    items: [
      { label: "Setup Checklist", href: "/crm/setup-guide", icon: Sparkles, permission: "system" },
      { label: "Manuals & Docs", href: "/crm/setup-guide/manuals", icon: Sparkles, permission: "system" },
    ],
  },
  {
    group: "System",
    icon: Settings,
    permission: "system",
    items: [
      { label: "Staff Management", href: "/crm/system/staff", icon: UserCog, permission: "system" },
      { label: "Departments", href: "/crm/system/departments", icon: Building, permission: "system" },
      { label: "Roles & Permissions", href: "/crm/system/roles", icon: Settings, permission: "system" },
      { label: "Security Settings", href: "/crm/system/security", icon: Shield, permission: "system" },
      { label: "Operation Logs", href: "/crm/system/logs", icon: Settings, permission: "system" },
      { label: "API Management", href: "/crm/system/api", icon: Settings, permission: "system" },
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

// 二级菜单项组件
interface SubMenuItemProps {
  item: MenuItem;
  isActive: (href?: string) => boolean;
}

const SubMenuItem = memo(function SubMenuItem({ item, isActive }: SubMenuItemProps) {
  // Section label — small uppercase header, non-interactive
  if (item.isSectionLabel) {
    return (
      <div className="pt-3 pb-1 pl-[48px] pr-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {item.label}
        </span>
      </div>
    );
  }

  // 分割线渲染
  if (item.isSeparator) {
    return (
      <div className="py-2 px-3">
        <div className="h-px bg-slate-200 ml-[36px] mr-3" />
      </div>
    );
  }

  const active = isActive(item.href);

  // Badge — render only when truthy (skip 0 / empty / null)
  const showBadge = item.badge !== undefined && item.badge !== null && item.badge !== 0 && item.badge !== "";

  return (
    <Link href={item.href || "#"}>
      <div
        className={cn(
          "flex items-center justify-between py-2.5 pl-[48px] pr-3 rounded-lg transition-all duration-200 group",
          active
            ? "bg-blue-50 text-blue-700"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        )}
      >
        <span className={cn("text-sm font-medium truncate", active && "font-semibold")}>
          {item.label}
        </span>
        {showBadge && (
          <span
            className={cn(
              "ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold tabular-nums flex-shrink-0",
              active
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
            )}
          >
            {item.badge}
          </span>
        )}
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
}

const SubMenuGroup = memo(function SubMenuGroup({ item, isActive, pathname, expanded, onToggle }: SubMenuGroupProps) {
  return (
    <div>
      {/* 应用入口 - 可展开 */}
      <div
        onClick={onToggle}
        className={cn(
          "flex items-center py-2.5 pl-[48px] pr-3 rounded-lg transition-all duration-200 cursor-pointer group",
          isActive(item.href)
            ? "bg-blue-50 text-blue-700"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        )}
      >
        <span className={cn("text-sm font-medium flex-1", isActive(item.href) && "font-semibold")}>
          {item.label}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "transition-transform duration-200 flex-shrink-0",
            isActive(item.href) ? "text-blue-500" : "text-slate-400",
            expanded ? "rotate-180" : ""
          )}
        />
      </div>
      {/* 子页面列表 */}
      {expanded && (
        <div className="mt-0.5 space-y-0.5">
          {item.children?.map((child) => (
            <Link key={child.href || child.label} href={child.href || "#"}>
              <div
                className={cn(
                  "flex items-center py-2 pl-[64px] pr-3 rounded-lg transition-all duration-200",
                  pathname === child.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                <span className={cn("text-sm font-medium", pathname === child.href && "font-semibold")}>
                  {child.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
});

// 一级菜单项组件
interface MenuItemProps {
  group: MenuGroup;
  isExpanded: boolean;
  onToggle: () => void;
  isActive: (href?: string) => boolean;
  pathname: string;
  collapsed: boolean;
}

const MenuItem = memo(function MenuItem({ group, isExpanded, onToggle, isActive, pathname, collapsed }: MenuItemProps) {
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
        onClick={() => !collapsed ? onToggle() : onToggle()}
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
              {group.group}
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
          {group.group}
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
                />
              );
            }
            return <SubMenuItem key={item.href || item.label} item={item} isActive={isActive} />;
          })}
        </div>
      )}
    </div>
  );
});

interface SidebarProps {
  brandInitials?: string;
}

const BRAND_NAME = "TradePass";
const BRAND_COLOR = "#2563eb";

export function Sidebar({ brandInitials }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useCrmSidebarStore();
  const { user } = useAuthStore();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  // Live active-cases count for the Review Queue badge.
  const { count: reviewQueueCount } = useReviewQueueCount();

  const initials = brandInitials || "TP";

  // Filter menu groups based on permissions
  // Super admin bypasses expensive permission filtering entirely
  const filteredMenuGroups = useMemo(() => {
    // Inject dynamic badges into the static menu config. Doing this
    // here (vs. inside menuGroups) keeps configuration declarative and
    // hooks out of the static array.
    const withBadges = menuGroups.map((g) => {
      if (g.group !== "CLM Center") return g;
      return {
        ...g,
        items: g.items.map((item) =>
          item.href === "/crm/clm/review-queue"
            ? { ...item, badge: reviewQueueCount }
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
  }, [user, reviewQueueCount]);

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

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-50 bg-gradient-to-b from-slate-50 to-white border-r border-slate-200/80 transition-all duration-300 flex flex-col shadow-sm no-scrollbar",
          sidebarCollapsed ? "w-[80px]" : "w-[260px]",
          sidebarMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo + Collapse Button */}
        <div className="h-[64px] flex items-center border-b border-slate-100/80 relative px-3">
          <Link href="/crm" className="flex items-center gap-2.5 flex-1 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
              style={{ backgroundColor: BRAND_COLOR }}
            >
              <span className="text-white font-bold text-sm">{initials}</span>
            </div>
            {!sidebarCollapsed && (
              <span className="text-sm font-bold text-slate-800 tracking-tight truncate">
                {BRAND_NAME}
              </span>
            )}
          </Link>
          
          {/* Collapse Toggle Button - 固定在侧边栏竖线正中间 */}
          <button
            onClick={toggleSidebar}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 hover:border-blue-300 transition-all duration-200 z-[60]"
            )}
            style={{ right: "-13px" }}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={12} className="text-slate-500" />
            ) : (
              <ChevronLeft size={12} className="text-slate-500" />
            )}
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-4 no-scrollbar">
          {filteredMenuGroups.map((group) => (
            <div key={group.group} className="mb-1">
              <MenuItem
                group={group}
                isExpanded={expandedGroup === group.group}
                onToggle={() => toggleGroup(group.group)}
                isActive={isActive}
                pathname={pathname}
                collapsed={sidebarCollapsed}
              />
            </div>
          ))}
        </nav>

        {/* Bottom Help */}
        <div className="p-3 border-t border-slate-100/80">
          {!sidebarCollapsed ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100/50">
              <p className="text-xs font-semibold text-blue-900 mb-0.5">Need help?</p>
              <p className="text-[11px] text-blue-600">Contact support</p>
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
