"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Copy,
  Brain,
  Network,
  BarChart3,
  Shield,
  Monitor,
  Globe,
  LayoutDashboard,
  Wallet,
  Briefcase,
  Users,
  Headphones,
  Gift,
  Database,
  Megaphone,
  Plug,
  Route,
  Ban,
  Calendar,
  Newspaper,
  MessageSquare,
  Cpu,
  Search,
  FileText,
  AlertTriangle,
  Lock,
  ArrowRight,
  Check,
  Loader2,
  Puzzle,
  Zap,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/crm/ui";
import { cn } from "@/lib/utils";

// Icon mapping for modules
const ICON_MAP: Record<string, React.ElementType> = {
  Copy,
  Brain,
  Network,
  BarChart3,
  Shield,
  Monitor,
  Globe,
  LayoutDashboard,
  Wallet,
  Briefcase,
  Users,
  Headphones,
  Gift,
  Database,
  Megaphone,
  Plug,
  Route,
  Ban,
  Calendar,
  Newspaper,
  MessageSquare,
  Cpu,
  Search,
  FileText,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Lock,
  Zap,
  Puzzle,
};

interface ModuleItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  route?: string;
  isAvailable: boolean;
  isAddOn: boolean;
  addOnPrice?: number;
}

interface ProductGroup {
  productCode: string;
  productName: string;
  shortName: string;
  isBaseLayer: boolean;
  isSubscribed: boolean;
  basePrice: number;
  currency: string;
  modules: ModuleItem[];
}

interface AppStats {
  installedModules: number;
  totalModules: number;
  subscribedProducts: number;
  totalProducts: number;
}

export default function AppsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    setLoading(true);
    const res = await fetch("/api/apps");
    const data = await res.json();
    setGroups(data.groups || []);
    setStats(data.stats || null);
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="模块控制台"
        description="管理您的产品模块与功能权限"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-surface border border-border">
          <p className="text-sm text-muted-foreground">已解锁模块</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {stats?.installedModules ?? 0}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              / {stats?.totalModules ?? 0}
            </span>
          </p>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-border">
          <p className="text-sm text-muted-foreground">已订阅产品</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {stats?.subscribedProducts ?? 0}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              / {stats?.totalProducts ?? 0}
            </span>
          </p>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-border">
          <p className="text-sm text-muted-foreground">扩展产品</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {(stats?.subscribedProducts ?? 1) - 1}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-border">
          <p className="text-sm text-muted-foreground">锁定模块</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {(stats?.totalModules ?? 0) - (stats?.installedModules ?? 0)}
          </p>
        </div>
      </div>

      {/* Product Groups */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group, groupIndex) => (
            <motion.div
              key={group.productCode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.05 }}
            >
              {/* Product group container */}
              <div>
                {/* Group Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {group.isBaseLayer ? (
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                    ) : group.isSubscribed ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                    <h2 className="font-semibold text-foreground">
                      {group.productName}
                    </h2>
                    {group.isBaseLayer && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                        基础层
                      </span>
                    )}
                    {group.isSubscribed && !group.isBaseLayer && (
                      <span className="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium">
                        已订阅
                      </span>
                    )}
                    {!group.isSubscribed && !group.isBaseLayer && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded font-medium">
                        未订阅
                      </span>
                    )}
                  </div>
                  {!group.isBaseLayer && (
                    <span className="text-sm text-muted-foreground">
                      {group.currency} {group.basePrice.toFixed(2)}/月
                    </span>
                  )}
                </div>

                {/* Module Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.modules.map((mod) => {
                    const Icon = ICON_MAP[mod.icon] || Puzzle;

                    return (
                      <div
                        key={mod.id}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all duration-200",
                        mod.isAvailable
                          ? "bg-surface border-border hover:border-primary/30 hover:shadow-sm cursor-pointer"
                          : "bg-white border-dashed border-slate-300 opacity-75"
                        )}
                        onClick={() => {
                          if (mod.isAvailable && mod.route) {
                            router.push(mod.route);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                              mod.isAvailable
                                ? "bg-primary/10 text-primary"
                                : "bg-slate-100 border border-slate-200 text-slate-400"
                            )}
                          >
                            {mod.isAvailable ? (
                              <Icon className="w-5 h-5" />
                            ) : (
                              <Lock className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3
                                className={cn(
                                  "font-medium text-sm",
                                  mod.isAvailable
                                    ? "text-foreground"
                                    : "text-slate-700"
                                )}
                              >
                                {mod.name}
                              </h3>
                              {mod.isAddOn && !mod.isAvailable && (
                                <span className="text-xs px-1 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded font-medium">
                                  Add-on
                                </span>
                              )}
                            </div>
                            <p
                              className={cn(
                                "text-xs mt-0.5",
                                mod.isAvailable
                                  ? "text-muted-foreground"
                                  : "text-slate-500"
                              )}
                            >
                              {mod.description}
                            </p>

                            {/* Lock message */}
                            {!mod.isAvailable && (
                              <div className="mt-2 flex items-center gap-1.5 text-xs">
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-400">
                                  订阅 {group.shortName} 后解锁
                                </span>
                              </div>
                            )}

                            {/* Action area */}
                            <div className="mt-2">
                              {mod.isAvailable ? (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                                  <Check className="w-3 h-3" /> 可用
                                </span>
                              ) : mod.isAddOn && mod.addOnPrice ? (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-amber-600 font-medium">
                                    {group.currency} {mod.addOnPrice.toFixed(2)}/月 单独购买
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs text-amber-700 hover:bg-amber-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      alert(
                                        `购买 ${mod.name} Add-on 流程待实现`
                                      );
                                    }}
                                  >
                                    <Zap className="w-3 h-3 mr-1" />
                                    购买
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
