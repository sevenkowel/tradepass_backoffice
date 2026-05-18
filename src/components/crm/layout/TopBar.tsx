"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/crm";
import { useCrmSidebarStore } from "@/store/crmSidebarStore";
import { useT } from "@/lib/i18n/LocaleProvider";
import { shellLabel } from "@/lib/i18n/crm-shell";
import { locales, localeNames, localeFlags } from "@/lib/i18n/config";
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Menu,
  Check,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { TopNavTabs } from "./TopNav";

const BRAND_NAME = "TradePass";

export function TopBar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const sidebarCollapsed = useCrmSidebarStore((s) => s.sidebarCollapsed);
  const { locale, setLocale } = useT();
  const tt = (label: string) => shellLabel(locale, label);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  // Mock notifications
  const notifications = [
    { id: 1, type: "kyc", title: "New KYC Review", message: "3 new KYC applications pending", time: "5m ago" },
    { id: 2, type: "risk", title: "Risk Alert", message: "User USR12345 margin level low", time: "12m ago" },
    { id: 3, type: "withdrawal", title: "Large Withdrawal", message: "$50,000 withdrawal request pending", time: "1h ago" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/crm/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/crm/login");
  };

  // Ctrl+K opens the search modal (the only input lives inside it now
  // that the inline search field is removed). ESC closes it.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header
      className={cn(
        /* Fixed (not sticky) so the chrome stays pinned regardless of
           the page's scroll container — sticky failed when an ancestor
           had `overflow` set, which a few page layouts do. ClientLayout
           compensates with `pt-16` on `<main>` to clear this 64px row. */
        "fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 z-30"
      )}
    >
      {/* Left Section — brand mark + name. The logo used to live in
          the Sidebar's 64px header; moving it here unifies logo and
          first-level tabs into a single chrome row and lets the
          Sidebar focus purely on second-level navigation. The brand
          area's width matches the Sidebar (220px) so the logo lines
          up visually with the column below it. */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link
          href="/crm"
          className={cn(
            "flex items-center gap-2.5 min-w-0 transition-[width] duration-300",
            sidebarCollapsed ? "lg:w-[48px]" : "lg:w-[188px]"
          )}
        >
          <Logo size={36} />
          {!sidebarCollapsed && (
            <span className="text-sm font-bold text-slate-800 tracking-tight truncate">
              {BRAND_NAME}
            </span>
          )}
        </Link>
        {/* Sidebar collapse toggle now lives on the Sidebar's right
            edge (a small floating chevron pill), not in TopBar. */}
      </div>

      {/* Center tabs — absolute-centered on the TopBar so they sit at
          the geometric middle of the viewport, independent of how
          much room the left/right clusters take. TopBar spans the full
          viewport width (sidebar overlays the left 260px via fixed
          positioning), so `left-1/2` resolves to the viewport center. */}
      <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <TopNavTabs />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Search — collapsed to an icon button on every breakpoint.
            Ctrl+K still opens the same modal, so power users are unaffected. */}
        <button
          onClick={() => setSearchOpen(true)}
          title={tt("Search...")}
          aria-label={tt("Search...")}
          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Locale Switcher moved into the user menu dropdown below
            to declutter the TopBar right cluster. */}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">{tt("Notifications")}</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-2 h-2 mt-2 rounded-full",
                            notification.type === "kyc" && "bg-blue-500",
                            notification.type === "risk" && "bg-red-500",
                            notification.type === "withdrawal" && "bg-amber-500"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/crm/notifications"
                  className="block px-4 py-3 text-center text-sm text-blue-600 hover:bg-blue-50 font-medium"
                >
                  {tt("View All Notifications")}
                </Link>
              </div>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">
              {user?.username || tt("Admin")}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded">
                    {user?.role?.name}
                  </span>
                </div>
                <div className="py-1">
                  <Link
                    href="/crm/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="w-4 h-4" />
                    {tt("Profile")}
                  </Link>
                  <Link
                    href="/crm/settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="w-4 h-4" />
                    {tt("Settings")}
                  </Link>
                </div>
                {/* Language section — was a standalone widget in the
                    TopBar; relocated here to keep the right cluster
                    icon-only. Each locale is a single-click radio
                    item with a check mark for the active one. */}
                <div className="border-t border-gray-100 py-1">
                  <p className="px-4 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {tt("Language")}
                  </p>
                  {locales.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setLocale(loc);
                        setUserMenuOpen(false);
                      }}
                      className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="text-base leading-none">{localeFlags[loc]}</span>
                        <span>{localeNames[loc]}</span>
                      </span>
                      {locale === loc && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    {tt("Sign Out")}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search Modal — opened by the icon button or Ctrl+K. Sits at
          the top of the viewport so it stays anchored under the search
          icon visually. Same surface for mobile and desktop.

          `z-[60]` puts the overlay above the fixed Sidebar (`z-50`)
          so the dim layer covers the whole screen, sidebar included. */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="bg-white p-4 mx-auto mt-16 max-w-xl rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={tt("Search users, orders, MT accounts... (Ctrl+K)")}
                  className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  autoFocus
                />
              </div>
            </form>
            <button
              onClick={() => setSearchOpen(false)}
              className="mt-4 w-full py-3 text-center text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl"
            >
              {tt("Cancel")}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
