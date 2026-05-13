"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useClientDetail } from "./ClientDetailContext";
import ClientDetailHeader from "./ClientDetailHeader";
import { ClientDetailTabBar, type ClientTabKey } from "./ClientDetailTabBar";

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

// Tab metadata + nav rendering live in ClientDetailTabBar.tsx

const VALID_TABS: ClientTabKey[] = [
  "overview", "kyc", "accounts", "funds", "trading", "risk",
  "devices", "cases", "tickets", "permissions", "agreements",
  "timeline", "notes", "logs",
];

function isValidTab(v: string | null): v is ClientTabKey {
  return v !== null && (VALID_TABS as string[]).includes(v);
}

export default function ClientDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <ClientDetailPageInner />
    </Suspense>
  );
}

function ClientDetailPageInner() {
  const { t } = useT();
  const { detail, loading } = useClientDetail();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get("tab");
  const initialTab: ClientTabKey = isValidTab(tabParam) ? tabParam : "overview";
  const [activeTab, setActiveTab] = useState<ClientTabKey>(initialTab);

  // Reflect URL changes (e.g. user navigates back) into local state.
  useEffect(() => {
    if (isValidTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  // Mirror tab changes into the URL so deep-links and back-button work.
  const handleTabChange = (next: ClientTabKey) => {
    setActiveTab(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "overview") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">{t("clients.detail.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sticky Header */}
      <ClientDetailHeader user={detail.user} />

      {/* Tab Navigation */}
      <ClientDetailTabBar activeTab={activeTab} onChange={handleTabChange} />

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
