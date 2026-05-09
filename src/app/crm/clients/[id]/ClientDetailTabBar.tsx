"use client";

/**
 * Tab navigation for /crm/clients/[id].
 *
 * The detail page has 14 tabs — too many to lay out flat. This bar
 * keeps the most-used 11 visible and tucks the 3 system-level tabs
 * behind a "更多" dropdown.
 */

import { useState, useMemo } from "react";
import {
  LayoutDashboard,
  ShieldCheck,
  Briefcase,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Monitor,
  ClipboardList,
  Ticket,
  Shield,
  FileText,
  History,
  MessageSquare,
  ClipboardList as LogsIcon,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/LocaleProvider";

export type ClientTabKey =
  | "overview" | "kyc" | "accounts" | "funds" | "trading"
  | "risk" | "devices" | "cases" | "tickets"
  | "permissions" | "agreements" | "timeline" | "notes" | "logs";

interface TabSpec {
  key: ClientTabKey;
  icon: typeof LayoutDashboard;
  group: "core" | "compliance" | "ops" | "system";
}

const TABS: TabSpec[] = [
  { key: "overview",    icon: LayoutDashboard, group: "core" },
  { key: "accounts",    icon: Briefcase,        group: "core" },
  { key: "funds",       icon: Wallet,           group: "core" },
  { key: "trading",     icon: TrendingUp,       group: "core" },
  { key: "risk",        icon: AlertTriangle,    group: "core" },

  { key: "kyc",         icon: ShieldCheck,      group: "compliance" },
  { key: "cases",       icon: ClipboardList,    group: "compliance" },
  { key: "agreements",  icon: FileText,         group: "compliance" },

  { key: "tickets",     icon: Ticket,           group: "ops" },
  { key: "devices",     icon: Monitor,          group: "ops" },
  { key: "notes",       icon: MessageSquare,    group: "ops" },

  { key: "permissions", icon: Shield,           group: "system" },
  { key: "timeline",    icon: History,          group: "system" },
  { key: "logs",        icon: LogsIcon,         group: "system" },
];

interface Props {
  activeTab: ClientTabKey;
  onChange: (key: ClientTabKey) => void;
}

export function ClientDetailTabBar({ activeTab, onChange }: Props) {
  const { t } = useT();
  const [moreOpen, setMoreOpen] = useState(false);

  const { primaryTabs, systemTabs } = useMemo(() => {
    return {
      primaryTabs: TABS.filter((tab) => tab.group !== "system"),
      systemTabs: TABS.filter((tab) => tab.group === "system"),
    };
  }, []);

  const activeSpec = TABS.find((tab) => tab.key === activeTab);
  const moreActive = activeSpec?.group === "system";
  const labelOf = (key: ClientTabKey) => t(`clients.detail.tabs.${key}`);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-1 sticky top-0 z-10">
      <div className="flex flex-wrap items-center gap-1">
        {primaryTabs.map((tab) => (
          <TabButton
            key={tab.key}
            tab={tab}
            label={labelOf(tab.key)}
            isActive={activeTab === tab.key}
            onClick={() => onChange(tab.key)}
          />
        ))}

        {/* System tabs collapsed under "更多" / "More" */}
        <div className="relative">
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              moreActive
                ? "bg-blue-50 text-primary"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <span className="hidden lg:inline">{t("clients.detail.tabs.more")}</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", moreOpen && "rotate-180")} />
          </button>

          {moreOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMoreOpen(false)} />
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg border border-slate-200 shadow-lg z-30 py-1">
                {systemTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        onChange(tab.key);
                        setMoreOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-blue-50 text-primary"
                          : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {labelOf(tab.key)}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  tab,
  label,
  isActive,
  onClick,
}: {
  tab: TabSpec;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-blue-50 text-primary"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}
