"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Bot,
  Users,
  Share2,
  Briefcase,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ChevronDown,
  Newspaper,
  Calendar,
  Video,
  Sparkles,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  History,
  CreditCard,
  Landmark,
  HelpCircle,
  Gift,
  Bell,
} from "lucide-react";
import { usePortalStore } from "@/store/portalStore";
import { clsx, type ClassValue } from "clsx";
import { BrandConfig, DEFAULT_BRAND } from "@/lib/brand";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface NavItem {
  href: string;
  icon: any;
  label: string;
  children?: NavItem[];
}

// 扁平化菜单结构 - 用分割线分组代替标题
const navItems: NavItem[] = [
  // Main
  { href: "/portal/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  {
    href: "/portal/fund",
    icon: DollarSign,
    label: "Fund",
    children: [
      { href: "/portal/fund/deposit", icon: ArrowDownLeft, label: "Deposit" },
      { href: "/portal/fund/withdraw", icon: ArrowUpRight, label: "Withdraw" },
      { href: "/portal/fund/transfer", icon: ArrowLeftRight, label: "Transfer" },
      { href: "/portal/fund/history", icon: History, label: "History" },
      { href: "/portal/fund/wallet", icon: Wallet, label: "Wallet" },
      { href: "/portal/fund/accounts", icon: CreditCard, label: "Payment Accounts" },
    ],
  },
  {
    href: "/portal/markets",
    icon: TrendingUp,
    label: "Markets",
    children: [
      { href: "/portal/markets", icon: BarChart3, label: "Quotes" },
      { href: "/portal/markets/signals", icon: Sparkles, label: "AI Signals" },
      { href: "/portal/markets/alerts", icon: Bell, label: "Price Alerts" },
    ],
  },
  {
    href: "/portal/accounts",
    icon: Briefcase,
    label: "Accounts",
    children: [
      { href: "/portal/accounts", icon: Briefcase, label: "Dashboard" },
      { href: "/portal/accounts/accounts", icon: Briefcase, label: "My Accounts" },
      { href: "/portal/accounts/positions", icon: TrendingUp, label: "Positions" },
      { href: "/portal/accounts/orders", icon: TrendingUp, label: "Orders" },
      { href: "/portal/accounts/history", icon: History, label: "History" },
      { href: "/portal/accounts/mt5", icon: Briefcase, label: "MT5 Access" },
    ],
  },
  {
    href: "/portal/copy-trading",
    icon: Users,
    label: "Copy Trading",
    children: [
      { href: "/portal/copy-trading/discover", icon: Briefcase, label: "Discover" },
      { href: "/portal/copy-trading/my-copy", icon: Briefcase, label: "My Copy" },
      { href: "/portal/copy-trading/become-trader", icon: Briefcase, label: "Become Trader" },
    ],
  },
  { href: "/portal/pamm", icon: TrendingUp, label: "PAMM" },
  { href: "/portal/mamm", icon: TrendingUp, label: "MAMM" },
  
  // Divider marker
  { href: "#divider-1", icon: () => null, label: "" },
  
  // Insights
  { href: "/portal/insights/news", icon: Newspaper, label: "News & Analysis" },
  { href: "/portal/insights/data", icon: Calendar, label: "Data & Calendar" },
  { href: "/portal/insights/media", icon: Video, label: "Media" },
  { href: "/portal/ai-signals", icon: Bot, label: "AI Insights" },
  
  // Divider marker
  { href: "#divider-2", icon: () => null, label: "" },
  
  // IB & Support
  { href: "/portal/ib", icon: Share2, label: "IB Program" },
  { href: "/portal/activity", icon: Gift, label: "Activity" },
  { href: "/portal/support", icon: HelpCircle, label: "Support" },
  { href: "/portal/settings", icon: Settings, label: "Settings" },
];

interface NavItemRendererProps {
  item: NavItem;
  isActive: (href: string) => boolean;
  expandedItems: Set<string>;
  toggleExpanded: (href: string) => void;
  sidebarCollapsed: boolean;
  hoveredItem: string | null;
  setHoveredItem: (href: string | null) => void;
  tenantId?: string;
}

function addTenantParam(href: string, tenantId?: string) {
  if (!tenantId || href.startsWith("#")) return href;
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}tenant=${tenantId}`;
}

function NavItemRenderer({
  item,
  isActive,
  expandedItems,
  toggleExpanded,
  sidebarCollapsed,
  hoveredItem,
  setHoveredItem,
  tenantId,
}: NavItemRendererProps) {
  // 渲染分割线
  if (item.href.startsWith("#divider")) {
    return sidebarCollapsed ? (
      <div className="my-3 mx-auto w-6 h-px bg-[var(--tp-border)]" />
    ) : (
      <div className="my-3 mx-4 h-px bg-[var(--tp-border)]" />
    );
  }

  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.has(item.href);
  const active = isActive(item.href);
  const childActive = hasChildren && item.children!.some((c) => isActive(c.href));

  return (
    <div className="relative">
      {/* 一级菜单项 */}
      <div
        className={cn(
          "group relative flex items-center gap-3 transition-all duration-200 cursor-pointer rounded-xl",
          sidebarCollapsed
            ? "w-11 h-11 mx-auto justify-center hover:bg-[var(--tp-surface)]"
            : "px-3 py-2 hover:bg-[var(--tp-surface)]",
          (active || childActive) && "bg-[var(--tp-accent)]/10"
        )}
        onClick={() => {
          if (hasChildren && !sidebarCollapsed) {
            toggleExpanded(item.href);
          }
        }}
        onMouseEnter={() => setHoveredItem(item.href)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        {/* 图标容器 */}
        <Link href={addTenantParam(item.href, tenantId)} className="contents">
          <div
            className={cn(
              "flex items-center justify-center rounded-lg transition-all duration-200 shrink-0",
              active || childActive
                ? "bg-[var(--tp-accent)] text-white"
                : "bg-[var(--tp-surface)] text-[var(--tp-muted)] group-hover:bg-[var(--tp-accent)]/10 group-hover:text-[var(--tp-accent)]",
              sidebarCollapsed ? "w-9 h-9" : "w-8 h-8"
            )}
          >
            <item.icon size={sidebarCollapsed ? 18 : 16} />
          </div>
        </Link>

        {/* 文字区域（展开时显示） */}
        {!sidebarCollapsed && (
          <>
            <Link href={addTenantParam(item.href, tenantId)} className="flex-1 min-w-0">
              <span
                className={cn(
                  "text-sm font-medium transition-colors block truncate",
                  active || childActive ? "text-[var(--tp-accent)]" : "text-[var(--tp-fg)]"
                )}
              >
                {item.label}
              </span>
            </Link>
            {hasChildren && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(item.href);
                }}
                className="p-1 hover:bg-[var(--tp-bg)] rounded-md transition-colors"
              >
                <ChevronDown
                  size={14}
                  className={cn(
                    "text-[var(--tp-muted)] transition-transform duration-200",
                    isExpanded ? "rotate-180" : ""
                  )}
                />
              </div>
            )}
          </>
        )}

        {/* 左侧选中指示器 */}
        {(active || childActive) && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--tp-accent)] rounded-r-full" />
        )}
      </div>

      {/* 二级菜单 - 更紧凑的缩进 */}
      {hasChildren && isExpanded && !sidebarCollapsed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-0.5 ml-7 space-y-0.5"
        >
          {item.children!.map((child) => (
            <Link key={child.href} href={addTenantParam(child.href, tenantId)}>
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 group",
                  isActive(child.href)
                    ? "bg-[var(--tp-accent)]/10 text-[var(--tp-accent)] font-medium"
                    : "text-[var(--tp-muted)] hover:text-[var(--tp-fg)]"
                )}
                onMouseEnter={() => setHoveredItem(child.href)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div
                  className={cn(
                    "w-1 h-1 rounded-full transition-colors",
                    isActive(child.href) ? "bg-[var(--tp-accent)]" : "bg-[var(--tp-muted)]/50"
                  )}
                />
                <span className="text-[13px]">{child.label}</span>
              </div>
            </Link>
          ))}
        </motion.div>
      )}

      {/* 折叠状态下的悬浮菜单 */}
      {sidebarCollapsed && hoveredItem === item.href && hasChildren && (
        <div className="absolute left-full top-0 ml-2 bg-[var(--tp-surface)] border border-[var(--tp-border)] rounded-xl shadow-xl p-2 min-w-[160px] z-50">
          <div className="absolute right-full top-5 border-6 border-transparent border-r-[var(--tp-surface)]" />
          <p className="text-xs font-semibold text-[var(--tp-fg)] px-2 py-1 mb-1">
            {item.label}
          </p>
          {item.children!.map((child) => (
            <Link key={child.href} href={addTenantParam(child.href, tenantId)}>
              <div
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors",
                  isActive(child.href)
                    ? "bg-[var(--tp-accent)]/10 text-[var(--tp-accent)]"
                    : "text-[var(--tp-muted)] hover:bg-[var(--tp-bg)] hover:text-[var(--tp-fg)]"
                )}
              >
                <child.icon size={14} />
                <span className="text-xs">{child.label}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Tooltip for collapsed state - 无子菜单时 */}
      {sidebarCollapsed && hoveredItem === item.href && !hasChildren && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-slate-800 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-50 shadow-lg">
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-800" />
          {item.label}
        </div>
      )}
    </div>
  );
}

interface PortalSidebarProps {
  tenantId?: string;
  brand?: BrandConfig;
}

export function PortalSidebar({ tenantId, brand }: PortalSidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = usePortalStore();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // 使用传入的品牌配置或默认值
  const brandConfig = brand || DEFAULT_BRAND;

  // 计算品牌首字母（用于无 Logo 时的 fallback）
  const brandInitials = useMemo(() => {
    return brandConfig.brandName
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [brandConfig.brandName]);

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(href)) {
        next.delete(href);
      } else {
        next.add(href);
      }
      return next;
    });
  };

  const isActive = (href: string) => pathname?.startsWith(href);

  // 根据当前路由自动展开父菜单
  useEffect(() => {
    if (!pathname) return;
    const toExpand = new Set(expandedItems);
    let changed = false;
    for (const item of navItems) {
      if (item.children?.some((c) => pathname.startsWith(c.href))) {
        if (!toExpand.has(item.href)) { toExpand.add(item.href); changed = true; }
      }
    }
    if (changed) setExpandedItems(toExpand);
  }, [pathname]);

  // 从 localStorage 加载展开状态
  useEffect(() => {
    try {
      const saved = localStorage.getItem("portal_sidebar_expanded");
      if (saved) setExpandedItems(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  // 展开状态持久化
  useEffect(() => {
    try {
      localStorage.setItem("portal_sidebar_expanded", JSON.stringify(Array.from(expandedItems)));
    } catch {}
  }, [expandedItems]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-[var(--tp-surface)] border-r border-[var(--tp-border)] flex flex-col z-40 transition-all duration-300 ease-out",
        sidebarCollapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      {/* Logo 区域 - 使用租户品牌配置 */}
      <div className="h-[72px] flex items-center border-b border-[var(--tp-border)] relative">
        {sidebarCollapsed ? (
          <Link href={addTenantParam("/portal/dashboard", tenantId)} className="mx-auto">
            {brandConfig.logoUrl ? (
              <img
                src={brandConfig.logoUrl}
                alt={brandConfig.brandName}
                className="w-10 h-10 rounded-xl object-contain"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto shadow-lg"
                style={{ backgroundColor: brandConfig.primaryColor }}
              >
                <span className="text-white text-sm font-bold">{brandInitials}</span>
              </div>
            )}
          </Link>
        ) : (
          <Link href={addTenantParam("/portal/dashboard", tenantId)} className="flex items-center gap-3 px-4">
            {brandConfig.logoUrl ? (
              <img
                src={brandConfig.logoUrl}
                alt={brandConfig.brandName}
                className="w-9 h-9 rounded-xl object-contain"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: brandConfig.primaryColor }}
              >
                <span className="text-white text-sm font-bold">{brandInitials}</span>
              </div>
            )}
            <span className="text-lg font-bold text-[var(--tp-fg)] tracking-tight truncate max-w-[140px]">
              {brandConfig.brandName}
            </span>
          </Link>
        )}
        
        {/* 折叠按钮 */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--tp-bg)] border border-[var(--tp-border)] shadow-sm flex items-center justify-center hover:bg-[var(--tp-surface)] hover:border-[var(--tp-accent)] transition-all duration-200 z-10",
            sidebarCollapsed ? "right-1/2 translate-x-1/2" : "-right-3"
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={12} className="text-[var(--tp-muted)]" />
          ) : (
            <ChevronLeft size={12} className="text-[var(--tp-muted)]" />
          )}
        </button>
      </div>

      {/* Navigation - 更紧凑的间距 */}
      <nav className="flex-1 overflow-y-auto py-3 no-scrollbar">
        <div className={cn("space-y-0.5", sidebarCollapsed && "px-2")}>
          {navItems.map((item) => (
            <NavItemRenderer
              key={item.href}
              item={item}
              isActive={isActive}
              expandedItems={expandedItems}
              toggleExpanded={toggleExpanded}
              sidebarCollapsed={sidebarCollapsed}
              hoveredItem={hoveredItem}
              setHoveredItem={setHoveredItem}
              tenantId={tenantId}
            />
          ))}
        </div>
      </nav>

      {/* Bottom Info - 更简洁 */}
      <div className="p-3 border-t border-[var(--tp-border)]">
        {!sidebarCollapsed ? (
          <Link href={addTenantParam("/portal/support", tenantId)}>
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--tp-bg)] transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--tp-accent)]/10 to-[var(--tp-accent)]/5 flex items-center justify-center border border-[var(--tp-accent)]/20">
                <Sparkles size={14} className="text-[var(--tp-accent)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--tp-fg)] truncate">Need help?</p>
                <p className="text-[11px] text-[var(--tp-muted)] truncate">Contact support</p>
              </div>
            </div>
          </Link>
        ) : (
          <Link href={addTenantParam("/portal/support", tenantId)}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[var(--tp-accent)]/10 to-[var(--tp-accent)]/5 flex items-center justify-center mx-auto border border-[var(--tp-accent)]/20 hover:scale-105 transition-transform cursor-pointer">
              <Sparkles size={16} className="text-[var(--tp-accent)]" />
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}
