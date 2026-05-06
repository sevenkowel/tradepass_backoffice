"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Briefcase,
  Wallet,
  TrendingUp,
  Network,
  Copy,
  Brain,
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
  Monitor,
  SlidersHorizontal,
  Building,
  type LucideIcon,
} from "lucide-react";
import { useCrmSidebarStore } from "@/store/crmSidebarStore";
import { useAuthStore } from "@/store/crm";
import { useDepartmentStore } from "@/store/crm/departmentStore";
import { mockStaff } from "@/lib/backoffice/mock-staff";
import type { PermissionModule } from "@/types/backoffice/role";
import { BrandConfig } from "@/lib/brand";

// 菜单项类型 - 支持三级菜单
interface MenuItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  permission?: PermissionModule;
  children?: MenuItem[];
}

interface MenuGroup {
  group: string;
  icon: LucideIcon;
  permission: PermissionModule;
  items: MenuItem[];
  appId?: string; // 关联的应用ID，未安装时不显示
}

// 应用子页面配置
const APP_SUB_PAGES: Record<string, { label: string; href: string }[]> = {
  ai_signals: [
    { label: "Signal List", href: "/crm/ai-signals" },
    { label: "Usage Control", href: "/crm/ai-signals/usage" },
    { label: "Signal Pool", href: "/crm/ai-signals/pool" },
  ],
  copy_trading: [
    { label: "Traders", href: "/crm/copy-trading/traders" },
    { label: "Followers", href: "/crm/copy-trading/followers" },
    { label: "Settings", href: "/crm/copy-trading/settings" },
    { label: "Profit Sharing", href: "/crm/copy-trading/profits" },
  ],
  ib_referral: [
    { label: "IB List", href: "/crm/ib" },
    { label: "Referral Tree", href: "/crm/ib/tree" },
    { label: "Commission Records", href: "/crm/ib/commissions" },
    { label: "Commission Settings", href: "/crm/ib/settings" },
  ],
  advanced_reports: [
    { label: "Financial Reports", href: "/crm/reports/financial" },
    { label: "Trading Reports", href: "/crm/reports/trading" },
    { label: "User Reports", href: "/crm/reports/users" },
  ],
  risk_enhanced: [
    { label: "Risk Dashboard", href: "/crm/risk" },
    { label: "Risk Rules", href: "/crm/risk/rules" },
    { label: "Margin Alerts", href: "/crm/risk/margin" },
    { label: "NBP Protection", href: "/crm/risk/nbp" },
  ],
  multi_terminal: [
    { label: "MT Accounts", href: "/crm/accounts" },
    { label: "Account Groups", href: "/crm/accounts/groups" },
    { label: "Leverage Settings", href: "/crm/accounts/leverage" },
  ],
};

// 菜单配置 - 所有菜单项
const menuGroups: MenuGroup[] = [
  {
    group: "Dashboard",
    icon: LayoutDashboard,
    permission: "dashboard",
    items: [
      { label: "Overview", href: "/crm", icon: LayoutDashboard, permission: "dashboard" },
      { label: "Real-time Monitor", href: "/crm/monitor", icon: TrendingUp, permission: "dashboard" },
      { label: "Conversion Funnel", href: "/crm/funnel", icon: BarChart3, permission: "dashboard" },
    ],
  },
  {
    group: "Users",
    icon: Users,
    permission: "accounts",
    items: [
      { label: "User List", href: "/crm/users", icon: Users, permission: "accounts" },
      { label: "User Tags", href: "/crm/users/tags", icon: Users, permission: "accounts" },
      { label: "User Levels", href: "/crm/users/levels", icon: Users, permission: "accounts" },
    ],
  },
  {
    group: "Compliance",
    icon: ShieldCheck,
    permission: "compliance",
    items: [
      { label: "KYC Review", href: "/crm/compliance/kyc-review", icon: ShieldCheck, permission: "compliance" },
      { label: "Supplemental KYC", href: "/crm/compliance/supplemental-review", icon: ShieldCheck, permission: "compliance" },
      { label: "Risk Control", href: "/crm/compliance/risk", icon: AlertTriangle, permission: "compliance" },
      { label: "Blacklist", href: "/crm/compliance/blacklist", icon: ShieldCheck, permission: "compliance" },
      { label: "Audit Logs", href: "/crm/compliance/audit", icon: ShieldCheck, permission: "compliance" },
    ],
  },
  {
    group: "Accounts",
    icon: Briefcase,
    permission: "accounts",
    items: [
      { label: "MT Accounts", href: "/crm/accounts", icon: Briefcase, permission: "accounts" },
      { label: "Account Groups", href: "/crm/accounts/groups", icon: Briefcase, permission: "accounts" },
      { label: "Leverage Settings", href: "/crm/accounts/leverage", icon: Briefcase, permission: "accounts" },
    ],
  },
  {
    group: "Funds",
    icon: Wallet,
    permission: "funds",
    items: [
      { label: "Deposit Orders", href: "/crm/funds/deposits", icon: Wallet, permission: "funds" },
      { label: "Withdrawal Requests", href: "/crm/funds/withdrawal-review", icon: Wallet, permission: "funds" },
      { label: "Transactions", href: "/crm/funds/transactions", icon: Wallet, permission: "funds" },
      { label: "Payment Channels", href: "/crm/funds/channels", icon: Wallet, permission: "funds" },
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
      { label: "Trading Settings", href: "/crm/trading/settings", icon: TrendingUp, permission: "trading" },
    ],
  },

  {
    group: "Risk",
    icon: AlertTriangle,
    permission: "risk",
    items: [
      { label: "Risk Dashboard", href: "/crm/risk", icon: AlertTriangle, permission: "risk" },
      { label: "Risk Rules", href: "/crm/risk/rules", icon: AlertTriangle, permission: "risk" },
      { label: "Margin Alerts", href: "/crm/risk/margin", icon: AlertTriangle, permission: "risk" },
      { label: "NBP Protection", href: "/crm/risk/nbp", icon: AlertTriangle, permission: "risk" },
    ],
  },
  {
    group: "CRM / Support",
    icon: Headphones,
    permission: "accounts",
    items: [
      { label: "Tickets", href: "/crm/crm/tickets", icon: Headphones, permission: "accounts" },
      { label: "Interaction Logs", href: "/crm/crm/logs", icon: Headphones, permission: "accounts" },
      { label: "Feedback", href: "/crm/crm/feedback", icon: Headphones, permission: "accounts" },
    ],
  },
  {
    group: "Marketing",
    icon: Megaphone,
    permission: "marketing",
    items: [
      { label: "Campaigns", href: "/crm/marketing/campaigns", icon: Megaphone, permission: "marketing" },
      { label: "Messages", href: "/crm/marketing/messages", icon: Megaphone, permission: "marketing" },
      { label: "Banner Management", href: "/crm/marketing/banners", icon: Megaphone, permission: "marketing" },
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
    ],
  },
  {
    group: "Business Config",
    icon: SlidersHorizontal,
    permission: "system",
    items: [
      { label: "Dashboard", href: "/crm/business-config", icon: SlidersHorizontal, permission: "system" },
    ],
  },
  {
    group: "System",
    icon: Settings,
    permission: "system",
    items: [
      { label: "Roles & Permissions", href: "/crm/system/roles", icon: Settings, permission: "system" },
      { label: "Staff Management", href: "/crm/system/staff", icon: UserCog, permission: "system" },
      { label: "Departments", href: "/crm/system/departments", icon: Building, permission: "system" },
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

function SubMenuItem({ item, isActive }: SubMenuItemProps) {
  const active = isActive(item.href);
  
  return (
    <Link href={item.href || "#"}>
      <div
        className={cn(
          "flex items-center py-2.5 pl-[48px] pr-3 rounded-lg transition-all duration-200 group",
          active
            ? "bg-blue-50 text-blue-700"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        )}
      >
        <span className={cn("text-sm font-medium", active && "font-semibold")}>
          {item.label}
        </span>
      </div>
    </Link>
  );
}

// 三级菜单分组组件（可展开的应用项）
interface SubMenuGroupProps {
  item: MenuItem;
  isActive: (href?: string) => boolean;
  pathname: string;
  expanded: boolean;
  onToggle: () => void;
}

function SubMenuGroup({ item, isActive, pathname, expanded, onToggle }: SubMenuGroupProps) {
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
}

// 一级菜单项组件
interface MenuItemProps {
  group: MenuGroup;
  isExpanded: boolean;
  onToggle: () => void;
  isActive: (href?: string) => boolean;
  pathname: string;
  collapsed: boolean;
}

function MenuItem({ group, isExpanded, onToggle, isActive, pathname, collapsed }: MenuItemProps) {
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

  const toggleAppItem = (label: string) => {
    setExpandedAppItems(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

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
}

interface SidebarProps {
  brand?: BrandConfig;
  brandInitials?: string;
}

export function Sidebar({ brand, brandInitials }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useCrmSidebarStore();
  const { hasPermission, user } = useAuthStore();
  const { departments, fetchDepartments } = useDepartmentStore();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [installedApps, setInstalledApps] = useState<string[]>([]);

  // 使用传入的品牌配置或默认值
  const brandName = brand?.brandName || "TradePass";
  const brandLogo = brand?.logoUrl;
  const brandColor = brand?.primaryColor || "#2563eb";
  const initials = brandInitials || "TP";

  // Fetch installed apps
  useEffect(() => {
    fetch("/api/tenant/apps")
      .then((r) => r.json())
      .then((data) => {
        setInstalledApps(data.installedApps || []);
      })
      .catch(() => {});
    fetchDepartments();
  }, [fetchDepartments]);

  const APP_ICON_MAP: Record<string, LucideIcon> = {
    copy_trading: Copy,
    ai_signals: Brain,
    ib_referral: Network,
    advanced_reports: BarChart3,
    risk_enhanced: Shield,
    multi_terminal: Monitor,
  };

  const APP_ROUTE_MAP: Record<string, string> = {
    copy_trading: "/crm/copy-trading/traders",
    ai_signals: "/crm/ai-signals",
    ib_referral: "/crm/ib",
    advanced_reports: "/crm/reports/financial",
    risk_enhanced: "/crm/risk",
    multi_terminal: "/crm/accounts",
  };

  const APP_LABEL_MAP: Record<string, string> = {
    copy_trading: "Copy Trading",
    ai_signals: "AI Signals",
    ib_referral: "IB / Referral",
    advanced_reports: "Advanced Reports",
    risk_enhanced: "Risk Enhanced",
    multi_terminal: "Multi Terminal",
  };

  // Filter menu groups based on permissions, installed apps, and department module access
  const filteredMenuGroups = useMemo(() => {
    // Get current user's department module access (union of all departments)
    let allowedModules: string[] | null = null;
    if (user?.email) {
      const staffMember = mockStaff.find((s) => s.email === user.email);
      if (staffMember?.departmentIds && staffMember.departmentIds.length > 0) {
        const userModules = new Set<string>();
        for (const deptId of staffMember.departmentIds) {
          const dept = departments.find((d) => d.id === deptId || d.name === deptId);
          if (dept) {
            dept.moduleAccess.forEach((m) => userModules.add(m));
          }
        }
        if (userModules.size > 0) {
          allowedModules = Array.from(userModules);
        }
      }
    }

    const groups = menuGroups
      .map((group) => {
        // Hide groups that require an app not installed
        if (group.appId && !installedApps.includes(group.appId)) {
          return null;
        }

        // Filter by department module access
        if (allowedModules && !allowedModules.includes(group.group as any)) {
          return null;
        }

        // Filter items based on permissions
        const filteredItems = group.items.filter((item) => {
          if (!item.permission) return true;
          return hasPermission(item.permission, "view");
        });

        // Only return group if it has visible items
        if (filteredItems.length === 0) return null;

        return {
          ...group,
          items: filteredItems,
        };
      })
      .filter(Boolean) as MenuGroup[];

    // Inject installed apps into Apps group as expandable sub-menu items
    const appsGroupIndex = groups.findIndex((g) => g.group === "Apps");
    if (appsGroupIndex >= 0 && installedApps.length > 0) {
      const appItems = installedApps
        .map((appId) => {
          const icon = APP_ICON_MAP[appId] || Puzzle;
          const route = APP_ROUTE_MAP[appId] || "#";
          const label = APP_LABEL_MAP[appId] || appId;
          const subPages = APP_SUB_PAGES[appId] || [];
          const children = subPages.map((sub) => ({
            label: sub.label,
            href: sub.href,
            icon,
            permission: undefined as PermissionModule | undefined,
          }));
          return {
            label,
            href: route,
            icon,
            permission: undefined as PermissionModule | undefined,
            children,
          };
        })
        .filter((item) => item.href !== "#");

      groups[appsGroupIndex] = {
        ...groups[appsGroupIndex],
        items: [...groups[appsGroupIndex].items, ...appItems],
      };
    }

    return groups;
  }, [hasPermission, installedApps]);

  const toggleGroup = (group: string) => {
    setExpandedGroup((prev) => (prev === group ? null : group));
  };

  const isActive = (href?: string) => {
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
  };

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
  }, [pathname, filteredMenuGroups]);

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
        {/* Logo + Collapse Button - 使用租户品牌配置 */}
        <div className="h-[64px] flex items-center border-b border-slate-100/80 relative px-3">
          <Link href="/crm" className="flex items-center gap-2.5 flex-1 min-w-0">
            {brandLogo ? (
              <img
                src={brandLogo}
                alt={brandName}
                className="w-10 h-10 rounded-xl object-contain flex-shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                style={{ backgroundColor: brandColor }}
              >
                <span className="text-white font-bold text-sm">{initials}</span>
              </div>
            )}
            {!sidebarCollapsed && (
              <span className="text-sm font-bold text-slate-800 tracking-tight truncate">
                {brandName}
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
