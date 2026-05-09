"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clientService } from "@/lib/crm/services/client.service";
import type { ClientDetailData } from "@/types/backoffice/client-detail";
import ClientDetailHeader from "./ClientDetailHeader";

// Tabs
import OverviewTab from "./tabs/OverviewTab";
import KYCTab from "./tabs/KYCTab";
import AccountsTab from "./tabs/AccountsTab";
import FundsTab from "./tabs/FundsTab";
import TradingTab from "./tabs/TradingTab";
import RiskTab from "./tabs/RiskTab";
import DevicesTab from "./tabs/DevicesTab";
import CasesTab from "./tabs/CasesTab";
import TicketsTab from "./tabs/TicketsTab";
import PermissionsTab from "./tabs/PermissionsTab";
import AgreementsTab from "./tabs/AgreementsTab";
import TimelineTab from "./tabs/TimelineTab";
import NotesTab from "./tabs/NotesTab";
import LogsTab from "./tabs/LogsTab";

const tabs = [
  { key: "overview", label: "概览", icon: LayoutDashboard },
  { key: "kyc", label: "KYC", icon: ShieldCheck },
  { key: "accounts", label: "账户", icon: Briefcase },
  { key: "funds", label: "资金", icon: Wallet },
  { key: "trading", label: "交易", icon: TrendingUp },
  { key: "risk", label: "风险", icon: AlertTriangle },
  { key: "devices", label: "设备", icon: Monitor },
  { key: "cases", label: "审批", icon: ClipboardList },
  { key: "tickets", label: "工单", icon: Ticket },
  { key: "permissions", label: "权限", icon: Shield },
  { key: "agreements", label: "协议", icon: FileText },
  { key: "timeline", label: "时间线", icon: History },
  { key: "notes", label: "笔记", icon: MessageSquare },
  { key: "logs", label: "日志", icon: LogsIcon },
];

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");
  const [detail, setDetail] = useState<ClientDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    clientService.getDetail(clientId).then((data) => {
      setDetail(data);
      setLoading(false);
    });
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">客户不存在</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sticky Header */}
      <ClientDetailHeader user={detail.user} />

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-1 sticky top-0 z-10">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden lg:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 min-h-[400px]">
        {activeTab === "overview" && <OverviewTab data={detail} />}
        {activeTab === "kyc" && <KYCTab data={detail} />}
        {activeTab === "accounts" && <AccountsTab data={detail} />}
        {activeTab === "funds" && <FundsTab data={detail} />}
        {activeTab === "trading" && <TradingTab data={detail} />}
        {activeTab === "risk" && <RiskTab data={detail} />}
        {activeTab === "devices" && <DevicesTab data={detail} />}
        {activeTab === "cases" && <CasesTab data={detail} />}
        {activeTab === "tickets" && <TicketsTab data={detail} />}
        {activeTab === "permissions" && <PermissionsTab data={detail} />}
        {activeTab === "agreements" && <AgreementsTab data={detail} />}
        {activeTab === "timeline" && <TimelineTab data={detail} />}
        {activeTab === "notes" && <NotesTab data={detail} />}
        {activeTab === "logs" && <LogsTab data={detail} />}
      </div>
    </div>
  );
}
