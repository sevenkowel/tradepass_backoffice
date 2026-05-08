"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  AlertTriangle,
  Briefcase,
  Wallet,
  TrendingUp,
  Monitor,
  ClipboardList,
  FileText,
  History,
  MessageSquare,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "kyc", label: "KYC", icon: ShieldCheck },
  { key: "risk", label: "Risk", icon: AlertTriangle },
  { key: "accounts", label: "Accounts", icon: Briefcase },
  { key: "funds", label: "Funds", icon: Wallet },
  { key: "trades", label: "Trades", icon: TrendingUp },
  { key: "device", label: "Device", icon: Monitor },
  { key: "audit", label: "Audit", icon: ClipboardList },
  { key: "agreements", label: "Agreements", icon: FileText },
  { key: "logs", label: "Logs", icon: History },
  { key: "notes", label: "Notes", icon: MessageSquare },
  { key: "relationships", label: "Relations", icon: Network },
];

export default function ClientProfilePage() {
  const params = useParams();
  const clientId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-1">
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
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {activeTab === "overview" && <OverviewTab clientId={clientId} />}
        {activeTab === "kyc" && <KYCTab clientId={clientId} />}
        {activeTab === "risk" && <RiskTab clientId={clientId} />}
        {activeTab === "accounts" && <PlaceholderTab title="Accounts" />}
        {activeTab === "funds" && <PlaceholderTab title="Funds" />}
        {activeTab === "trades" && <PlaceholderTab title="Trades" />}
        {activeTab === "device" && <PlaceholderTab title="Device & Security" />}
        {activeTab === "audit" && <PlaceholderTab title="Audit Records" />}
        {activeTab === "agreements" && <PlaceholderTab title="Agreements" />}
        {activeTab === "logs" && <PlaceholderTab title="Operation Logs" />}
        {activeTab === "notes" && <PlaceholderTab title="Notes" />}
        {activeTab === "relationships" && <PlaceholderTab title="Relationships" />}
      </div>
    </div>
  );
}

// === Tab Components ===

function OverviewTab({ clientId }: { clientId: string }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Overview</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Account Balance" value="$20,840.70" color="blue" />
        <StatCard label="Net Deposit" value="$55,000" color="emerald" />
        <StatCard label="Trading Volume" value="$1,250,000" color="violet" />
        <StatCard label="Total P&L" value="+$3,250" color="amber" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Recent Activity</h4>
          <div className="space-y-2">
            {[
              { action: "Login", time: "2 hours ago", ip: "192.168.1.100" },
              { action: "Deposit", time: "5 hours ago", amount: "+$5,000" },
              { action: "Trade", time: "1 day ago", detail: "XAUUSD Buy 0.5" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{item.action}</span>
                <span className="text-slate-500">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Lifecycle</h4>
          <div className="space-y-3">
            {[
              { stage: "Registered", date: "2024-01-15", done: true },
              { stage: "KYC Verified", date: "2024-01-20", done: true },
              { stage: "First Deposit", date: "2024-01-20", done: true },
              { stage: "Active Trader", date: "2024-02-01", done: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${item.done ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className="text-sm text-slate-700">{item.stage}</span>
                <span className="text-xs text-slate-400 ml-auto">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KYCTab({ clientId }: { clientId: string }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">KYC Information</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl space-y-3">
          <h4 className="text-sm font-medium text-slate-700">KYC Status</h4>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Verified</p>
              <p className="text-xs text-slate-500">2024-01-20</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl space-y-3">
          <h4 className="text-sm font-medium text-slate-700">Documents</h4>
          <div className="space-y-2">
            {["ID Card", "Address Proof", "Selfie"].map((doc) => (
              <div key={doc} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{doc}</span>
                <span className="text-emerald-600 text-xs">Verified</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 bg-slate-50 rounded-xl">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Personal Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-slate-500">Full Name:</span> <span className="text-slate-900">Zhang Wei</span></div>
          <div><span className="text-slate-500">ID Number:</span> <span className="text-slate-900">310***********1234</span></div>
          <div><span className="text-slate-500">Date of Birth:</span> <span className="text-slate-900">1990-05-15</span></div>
          <div><span className="text-slate-500">Nationality:</span> <span className="text-slate-900">China</span></div>
          <div><span className="text-slate-500">Address:</span> <span className="text-slate-900">Shanghai, China</span></div>
        </div>
      </div>
    </div>
  );
}

function RiskTab({ clientId }: { clientId: string }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Risk Assessment</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-emerald-50 rounded-xl text-center">
          <p className="text-sm text-slate-500">Risk Score</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">15</p>
          <p className="text-xs text-emerald-600 mt-1">Low Risk</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl text-center">
          <p className="text-sm text-slate-500">Risk Flags</p>
          <p className="text-3xl font-bold text-slate-700 mt-1">0</p>
          <p className="text-xs text-slate-500 mt-1">No flags</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl text-center">
          <p className="text-sm text-slate-500">Related Users</p>
          <p className="text-3xl font-bold text-slate-700 mt-1">2</p>
          <p className="text-xs text-slate-500 mt-1">Same IP/Device</p>
        </div>
      </div>
      <div className="p-4 bg-slate-50 rounded-xl">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Risk Factors</h4>
        <div className="space-y-2">
          {[
            { factor: "Geographic Risk", score: 5, level: "low" },
            { factor: "Behavioral Pattern", score: 3, level: "low" },
            { factor: "Transaction Velocity", score: 4, level: "low" },
            { factor: "Device Fingerprint", score: 2, level: "low" },
            { factor: "IP Reputation", score: 1, level: "low" },
          ].map((item) => (
            <div key={item.factor} className="flex items-center gap-3">
              <span className="text-sm text-slate-700 w-40">{item.factor}</span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    item.score <= 3 ? 'bg-emerald-500' : item.score <= 6 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(item.score / 10) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 w-8">{item.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <p className="text-slate-400 text-sm">{title} - Coming Soon</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className={`p-4 rounded-xl ${colorMap[color] || "bg-slate-50 text-slate-700"}`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}
