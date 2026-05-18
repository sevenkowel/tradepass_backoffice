"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Copy,
  Brain,
  Network,
  BarChart3,
  Shield,
  Monitor,
  Puzzle,
  ArrowRight,
  Trash2,
  Loader2,
  Check,
  Settings,
  Info,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/crm/ui";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  Copy,
  Brain,
  Network,
  BarChart3,
  Shield,
  Monitor,
};

const APP_LABEL_MAP: Record<string, string> = {
  copy_trading: "Copy Trading",
  ai_signals: "AI Signals",
  ib_referral: "IB / Referral",
  advanced_reports: "Advanced Reports",
  risk_enhanced: "Risk Enhanced",
  multi_terminal: "Multi Terminal",
};

const APP_ROUTE_MAP: Record<string, string> = {
  copy_trading: "/crm/copy-trading/traders",
  ai_signals: "/crm/ai-signals",
  ib_referral: "/crm/ib",
  advanced_reports: "/crm/reports/financial",
  risk_enhanced: "/crm/risk",
  multi_terminal: "/crm/accounts",
};

interface AppDetail {
  id: string;
  appId: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  isInstalled: boolean;
  installedAt: string | null;
}

export default function AppDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.appId as string;

  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApp();
  }, [appId]);

  const fetchApp = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/apps");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error ${res.status}: ${text.slice(0, 200)}`);
      }
      const data = await res.json();
      // Flatten groups.modules into app-like structure
      const apps: AppDetail[] = [];
      for (const group of data.groups || []) {
        for (const mod of group.modules || []) {
          apps.push({
            id: mod.id,
            appId: mod.id,
            name: mod.name,
            description: mod.description,
            icon: mod.icon,
            category: group.productName,
            isInstalled: mod.isAvailable,
            installedAt: mod.isAvailable ? new Date().toISOString() : null,
          });
        }
      }
      const found = apps.find((a) => a.appId === appId);
      setApp(found || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const uninstall = async () => {
    if (!app) return;
    setActionLoading(true);
    await fetch(`/api/apps/${app.appId}/uninstall`, { method: "POST" });
    await fetchApp();
    setActionLoading(false);
  };

  const Icon = app ? ICON_MAP[app.icon] || Puzzle : Puzzle;
  const appRoute = APP_ROUTE_MAP[appId] || "#";

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <PageHeader title="应用详情" description="" />
        <div className="mt-10 flex flex-col items-center justify-center text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mb-4 text-red-400" />
          <p className="text-lg font-medium text-red-600">加载失败</p>
          <p className="text-sm mt-1 max-w-md text-center">{error}</p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => router.push("/crm/apps")}>
              返回应用中心
            </Button>
            <Button onClick={fetchApp}>重试</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-6">
        <PageHeader title="应用详情" description="" />
        <div className="mt-10 flex flex-col items-center justify-center text-muted-foreground">
          <Puzzle className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">应用不存在</p>
          <p className="text-sm mt-1">未找到 ID 为 {appId} 的应用</p>
          <Button className="mt-4" onClick={() => router.push("/crm/apps")}>
            返回应用中心
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={app.name}
        description="应用详情与管理"
      />

      {/* App Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-6 rounded-xl border",
          app.isInstalled
            ? "bg-green-50/30 border-green-200"
            : "bg-surface border-border"
        )}
      >
        <div className="flex items-start gap-5">
          <div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0",
              app.isInstalled
                ? "bg-green-100 text-green-600"
                : "bg-primary/10 text-primary"
            )}
          >
            <Icon className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">{app.name}</h2>
              {app.isInstalled && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                  <Check className="w-3.5 h-3.5" /> 已安装
                </span>
              )}
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                {app.category}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              {app.description}
            </p>
            {app.isInstalled && app.installedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                安装时间：{new Date(app.installedAt).toLocaleString("zh-CN")}
              </p>
            )}

            <div className="flex items-center gap-3 mt-4">
              {app.isInstalled ? (
                <>
                  <Button onClick={() => router.push(appRoute)}>
                    <ArrowRight className="w-4 h-4 mr-1.5" />
                    进入应用
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={uninstall}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-1.5" />
                    )}
                    卸载
                  </Button>
                </>
              ) : (
                <Button
                  onClick={async () => {
                    setActionLoading(true);
                    await fetch(`/api/apps/${app.appId}/install`, { method: "POST" });
                    await fetchApp();
                    setActionLoading(false);
                  }}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-1.5" />
                  )}
                  安装应用
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Config Section */}
      {app.isInstalled && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-xl bg-surface border border-border"
        >
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">应用配置</h3>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50/50 border border-amber-200">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 font-medium">配置功能开发中</p>
              <p className="text-sm text-amber-700/80 mt-1">
                该应用的详细配置选项将在后续版本提供。您可以直接「进入应用」进行管理操作。
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
