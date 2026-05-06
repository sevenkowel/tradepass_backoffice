"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import {
  LogOut,
  Loader2,
  Menu,
  X,
  LucideIcon,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title: string;
  sidebarBg?: string; // e.g. "bg-slate-900"
  redirectTo?: string;
  portalUrl?: string; // 租户官网入口 URL
  consoleUrl?: string; // 返回控制台 URL
}

export default function DashboardLayout({
  children,
  navItems,
  title,
  sidebarBg = "bg-slate-900",
  redirectTo,
  portalUrl,
  consoleUrl,
}: DashboardLayoutProps) {
  // Demo 模式：禁用认证检查
  const { user, loading } = useUser({ redirectTo: undefined });
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const activeLabel =
    navItems.find(
      (n) => pathname === n.href || pathname.startsWith(`${n.href}/`)
    )?.label || title;

  const SidebarContent = (
    <>
      <div className="p-6">
        <Link href="/" className="text-xl font-bold">
          TradePass
        </Link>
        <p className="text-xs text-slate-400 mt-1">{title}</p>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        {consoleUrl && (
          <Link
            href={consoleUrl}
            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors w-full mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回控制台
          </Link>
        )}
        {portalUrl && (
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors w-full mb-2"
          >
            <ExternalLink className="w-4 h-4" />
            前往租户官网
          </a>
        )}
        <div className="px-4 py-2 text-sm text-slate-300 truncate">
          {user?.email || "Demo User"}
        </div>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/auth/login";
          }}
          className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex w-64 text-white flex-col",
          sidebarBg
        )}
      >
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className={cn(
              "fixed inset-y-0 left-0 w-64 text-white flex-col z-50 lg:hidden flex",
              sidebarBg
            )}
          >
            <div className="flex items-center justify-between p-4">
              <Link href="/" className="text-xl font-bold">
                TradePass
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {SidebarContent}
          </aside>
        </>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900 truncate">
              {activeLabel}
            </h1>
          </div>
          <div className="text-sm text-slate-500 truncate hidden sm:block">
            {user?.name || user?.email || "Demo User"}
          </div>
        </header>
        <div className="flex-1 p-4 lg:p-8 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
