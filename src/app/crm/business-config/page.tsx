"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  UserPlus,
  Wallet,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  FileCheck,
  FileWarning,
} from "lucide-react";

// 配置项类型
interface ConfigItem {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  status: "configured" | "pending" | "not_started";
  statusLabel: string;
  summary?: string;
}

export default function BusinessConfigPage() {
  const [loading, setLoading] = useState(true);

  // 配置项状态（从 API 获取）
  const configItems: ConfigItem[] = useMemo(() => [
    {
      key: "kyc",
      title: "KYC Configuration",
      description: "Configure identity verification levels, document types, and region-specific KYC requirements for your brokers.",
      icon: <ShieldCheck className="w-6 h-6" />,
      href: "/crm/system/kyc-config",
      status: "not_started",
      statusLabel: "Not Configured",
    },
    {
      key: "account_opening",
      title: "Account Opening",
      description: "Set up registration flows, account types, default settings, and onboarding rules for new clients.",
      icon: <UserPlus className="w-6 h-6" />,
      href: "/crm/system/config",
      status: "not_started",
      statusLabel: "Not Configured",
    },
    {
      key: "payment_channels",
      title: "Payment Channels",
      description: "Manage deposit and withdrawal methods, channel fees, processing times, and currency support.",
      icon: <Wallet className="w-6 h-6" />,
      href: "#",
      status: "not_started",
      statusLabel: "Coming Soon",
    },
    {
      key: "trading_products",
      title: "Trading Products",
      description: "Define instrument specifications, spreads, commissions, trading hours, and margin requirements.",
      icon: <TrendingUp className="w-6 h-6" />,
      href: "#",
      status: "not_started",
      statusLabel: "Coming Soon",
    },
  ], []);

  // 模拟 API 获取配置完成状态
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const configuredCount = configItems.filter(i => i.status === "configured").length;
  const progressPercent = Math.round((configuredCount / configItems.length) * 100);

  const statusIcon = (status: string) => {
    switch (status) {
      case "configured": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "pending": return <Clock className="w-5 h-5 text-amber-500" />;
      default: return <AlertCircle className="w-5 h-5 text-slate-300" />;
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Business Config" }, { label: "Dashboard" }]} />

      <PageHeader
        title="Business Config"
        description="Configure and manage your brokerage operations — from KYC and account opening to payments and trading products."
        actions={
          <Button variant="secondary" size="sm" onClick={() => setLoading(true)}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        }
      />

      {/* Progress Bar */}
      <Card className="!p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Broker Onboarding Progress</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {configuredCount} of {configItems.length} items configured
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-900">{progressPercent}%</span>
          </div>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              progressPercent === 100 ? "bg-emerald-500" : "bg-blue-500"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Card>

      {/* Config Item Cards */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="!p-6 animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-slate-100 rounded w-full mb-2" />
              <div className="h-4 bg-slate-100 rounded w-2/3" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {configItems.map((item) => (
            <Link key={item.key} href={item.href} className={cn(item.href === "#" && "pointer-events-none")}>
              <Card className="!p-5 h-full transition-all duration-200 hover:shadow-md hover:border-blue-200 cursor-pointer group">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                    item.status === "configured" ? "bg-emerald-100 text-emerald-600" :
                    item.status === "pending" ? "bg-amber-100 text-amber-600" :
                    "bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600"
                  )}>
                    {item.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                      {statusIcon(item.status)}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Status bar */}
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
                        item.status === "configured" ? "bg-emerald-50 text-emerald-700" :
                        item.status === "pending" ? "bg-amber-50 text-amber-700" :
                        item.href === "#" ? "bg-slate-100 text-slate-400" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {item.status === "configured" ? <FileCheck className="w-3.5 h-3.5" /> :
                         item.status === "pending" ? <FileWarning className="w-3.5 h-3.5" /> : null}
                        {item.statusLabel}
                      </span>
                      {item.href !== "#" && (
                        <span className="text-xs text-blue-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Configure
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && configuredCount === 0 && (
        <Card className="!p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <ArrowRight className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">Get started with broker configuration</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Complete the items above to enable core brokerage operations. Start with KYC Configuration.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Completed state */}
      {!loading && configuredCount === configItems.length && (
        <Card className="!p-6 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-900">All systems configured</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Your brokerage is fully set up. Use this dashboard to monitor and manage configurations as your business evolves.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
