"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/crm";
import { useCrmSidebarStore } from "@/store/crmSidebarStore";
import { BrandConfig } from "@/lib/brand";
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Moon,
  Sun,
  Monitor,
  Menu,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";

interface TopBarProps {
  brand?: BrandConfig;
  brandInitials?: string;
}

export function TopBar({ brand, brandInitials }: TopBarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed } = useCrmSidebarStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Ctrl+K 快捷键聚焦搜索框
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K 或 Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // ESC 关闭搜索
      if (e.key === "Escape") {
        setSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header
      className={cn(
        "h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 transition-all duration-300",
        sidebarCollapsed ? "lg:left-[80px]" : "lg:left-[260px]"
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Environment Badge */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
            LIVE
          </span>
        </div>

        {/* Mobile Search Toggle */}
        <button
          onClick={() => setSearchOpen(true)}
          className="md:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Search - Desktop - 固定在中间偏右位置 */}
      <div className="hidden md:block flex-1 max-w-md mx-4">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users, orders, MT accounts... (Ctrl+K)"
              className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        </form>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Back to Console */}
        <Link
          href="/console"
          className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回控制台</span>
        </Link>

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
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
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
                  View All Notifications
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
              {user?.username || "Admin"}
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
                    Profile
                  </Link>
                  <Link
                    href="/crm/settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden">
          <div className="bg-white p-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-base"
                  autoFocus
                />
              </div>
            </form>
            <button
              onClick={() => setSearchOpen(false)}
              className="mt-4 w-full py-3 text-center text-sm text-gray-500 bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
