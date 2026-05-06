"use client";

import { Bell, Search, Moon, Sun, Monitor, ChevronDown, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ui/ThemeProvider";
import { useState } from "react";
import { usePortalStore } from "@/store/portalStore";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface PortalTopbarProps {
  breadcrumbs?: Array<{ label: string; href: string }>;
  tenantName?: string;
}

export function PortalTopbar({ breadcrumbs, tenantName }: PortalTopbarProps) {
  const { theme, setTheme } = useTheme();
  const { sidebarCollapsed } = usePortalStore();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header
      className="fixed top-0 right-0 h-[72px] bg-[var(--tp-surface)] border-b border-[var(--tp-border)] flex items-center justify-between px-6 z-30 transition-all duration-300 ease-out"
      style={{ left: sidebarCollapsed ? '72px' : '240px' }}
    >
      {/* Left: Search */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 bg-[var(--tp-bg)] rounded-xl px-4 py-2.5 w-80 border border-[var(--tp-border)] focus-within:border-[var(--tp-accent)] focus-within:ring-2 focus-within:ring-[var(--tp-accent)]/10 transition-all">
          <Search size={18} className="text-[var(--tp-muted)]" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-[var(--tp-fg)] placeholder:text-[var(--tp-muted)] flex-1 w-full"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="hover:bg-[var(--tp-surface)] rounded p-0.5 transition-colors"
            >
              <X size={14} className="text-[var(--tp-muted)]" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Back to Console */}
        <Link
          href="/console"
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--tp-surface)] text-[var(--tp-muted)] hover:text-[var(--tp-fg)] transition-colors border border-transparent hover:border-[var(--tp-border)] text-sm"
        >
          <ArrowLeft size={16} />
          <span>返回控制台</span>
        </Link>

        {/* Theme Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="w-10 h-10 rounded-xl hover:bg-[var(--tp-surface)] flex items-center justify-center transition-colors border border-transparent hover:border-[var(--tp-border)]"
          >
            {theme === "light" && <Sun size={18} className="text-[var(--tp-fg)]" />}
            {theme === "dark" && <Moon size={18} className="text-[var(--tp-fg)]" />}
            {theme === "system" && <Monitor size={18} className="text-[var(--tp-fg)]" />}
          </button>
          <AnimatePresence>
            {showThemeMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 top-12 bg-[var(--tp-surface)] border border-[var(--tp-border)] rounded-xl shadow-lg py-1 min-w-[140px] z-50"
              >
                <button
                  onClick={() => { setTheme("light"); setShowThemeMenu(false); }}
                  className="w-full px-4 py-2.5 text-sm text-left hover:bg-[var(--tp-bg)] flex items-center gap-3 text-[var(--tp-fg)]"
                >
                  <Sun size={16} className="text-[var(--tp-muted)]" />
                  Light
                </button>
                <button
                  onClick={() => { setTheme("dark"); setShowThemeMenu(false); }}
                  className="w-full px-4 py-2.5 text-sm text-left hover:bg-[var(--tp-bg)] flex items-center gap-3 text-[var(--tp-fg)]"
                >
                  <Moon size={16} className="text-[var(--tp-muted)]" />
                  Dark
                </button>
                <button
                  onClick={() => { setTheme("system"); setShowThemeMenu(false); }}
                  className="w-full px-4 py-2.5 text-sm text-left hover:bg-[var(--tp-bg)] flex items-center gap-3 text-[var(--tp-fg)]"
                >
                  <Monitor size={16} className="text-[var(--tp-muted)]" />
                  System
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <button className="w-10 h-10 rounded-xl hover:bg-[var(--tp-surface)] flex items-center justify-center transition-colors border border-transparent hover:border-[var(--tp-border)] relative">
          <Bell size={18} className="text-[var(--tp-fg)]" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[var(--tp-surface)]" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-[var(--tp-border)]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--tp-accent)] to-[var(--tp-accent)]/80 flex items-center justify-center shadow-lg shadow-[var(--tp-accent)]/20">
            <span className="text-white text-sm font-medium">JD</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <span className="text-sm font-medium text-[var(--tp-fg)]">John Doe</span>
            <ChevronDown size={14} className="text-[var(--tp-muted)]" />
          </div>
        </div>
      </div>
    </header>
  );
}
