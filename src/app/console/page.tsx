"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Building2,
  Package,
  CreditCard,
  Plus,
  Loader2,
  ArrowUpRight,
  Rocket,
  Check,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useMockStore } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  onboardingCompleted: boolean;
  onboardingStatus: string;
}

export default function ConsoleDashboard() {
  const router = useRouter();
  const mockStore = useMockStore();
  const currentUser = mockStore.currentUser;
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    // 使用 mock store 获取租户
    const userTenants = mockStore.getUserTenants(currentUser.id);
    const list = userTenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      status: t.status,
      createdAt: t.createdAt,
      onboardingCompleted: t.onboardingCompleted,
      onboardingStatus: t.onboardingStatus,
    }));
    
    setTenants(list);
    setLoading(false);

    // 没有租户 → 引导到初始化
    if (list.length === 0) {
      router.replace("/console/onboarding");
    }
  }, [currentUser]);

  // 统计初始化状态
  const activeTenant = tenants[0];
  const onboardingProgress = activeTenant && !activeTenant.onboardingCompleted
    ? (() => {
        const tenant = mockStore.getTenantById(activeTenant.id);
        if (!tenant) return null;
        const phases = tenant.onboardingPhases;
        const completed = Object.values(phases).filter(Boolean).length;
        // Map phases to readable names
        const phaseNames = [
          { key: "branding", label: "创建品牌" },
          { key: "auth", label: "配置注册登录" },
          { key: "kyc", label: "设置KYC流程" },
          { key: "payments", label: "配置收款方式" },
          { key: "trading", label: "设置交易参数" },
          { key: "accounts", label: "创建交易账户" },
        ];
        const phaseItems = phaseNames.map((p) => ({
          ...p,
          completed: phases[p.key as keyof typeof phases],
        }));
        return { completed, total: 6, items: phaseItems };
      })()
    : null;

  return (
    <div className="space-y-6 w-full">
      {/* ============================================ */}
      {/* Onboarding 引导 Banner */}
      {/* ============================================ */}
      <AnimatePresence>
        {!loading && tenants.length > 0 && onboardingProgress && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Rocket className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-emerald-800">
                          启动你的经纪商
                        </h3>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          进度 {onboardingProgress.completed}/{onboardingProgress.total}
                        </p>
                      </div>
                      {/* 进度条 */}
                      <div className="w-32 h-2 bg-emerald-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${(onboardingProgress.completed / onboardingProgress.total) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* 检查清单 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
                      {onboardingProgress.items.map((item) => (
                        <div
                          key={item.key}
                          className={cn(
                            "flex items-center gap-2 text-xs px-2 py-1 rounded",
                            item.completed
                              ? "text-emerald-700"
                              : "text-emerald-600/70"
                          )}
                        >
                          <div
                            className={cn(
                              "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                              item.completed
                                ? "bg-emerald-500"
                                : "border border-emerald-300 bg-transparent"
                            )}
                          >
                            {item.completed && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className={item.completed ? "line-through opacity-60" : "font-medium"}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* 下一步引导 */}
                    {(() => {
                      const nextPhase = onboardingProgress.items.find((i) => !i.completed);
                      return nextPhase ? (
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-emerald-700">
                            <Clock className="w-3 h-3 inline-block mr-1" />
                            下一步：{nextPhase.label}
                          </p>
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() =>
                              router.push(`/console/onboarding?tenant=${activeTenant.id}`)
                            }
                          >
                            继续配置 <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* Page Header */}
      {/* ============================================ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--tp-fg-rgb))]">仪表盘</h1>
          <p className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)] mt-1">
            管理您的租户和产品订阅
          </p>
        </div>
        <Link href="/console/tenants/new">
          <Button className="bg-[rgb(var(--tp-accent-rgb))] hover:opacity-90 text-white">
            <Plus className="w-4 h-4 mr-2" /> 创建租户
          </Button>
        </Link>
      </div>

      {/* ============================================ */}
      {/* Stats Cards */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[var(--tp-border)] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[rgba(var(--tp-fg-rgb),0.6)]">
                  租户数量
                </p>
                <p className="text-3xl font-bold text-[rgb(var(--tp-fg-rgb))] mt-2">
                  {tenants.length}
                </p>
              </div>
              <div className="p-3 bg-[rgba(var(--tp-accent-rgb),0.1)] rounded-xl">
                <Building2 className="w-6 h-6 text-[rgb(var(--tp-accent-rgb))]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--tp-border)] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[rgba(var(--tp-fg-rgb),0.6)]">
                  已订阅产品
                </p>
                <p className="text-3xl font-bold text-[rgb(var(--tp-fg-rgb))] mt-2">
                  0
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--tp-border)] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[rgba(var(--tp-fg-rgb),0.6)]">
                  待支付账单
                </p>
                <p className="text-3xl font-bold text-[rgb(var(--tp-fg-rgb))] mt-2">
                  0
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <CreditCard className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* Tenants Section */}
      {/* ============================================ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[rgb(var(--tp-fg-rgb))]">
            我的租户
          </h2>
          <Link
            href="/console/tenants"
            className="text-sm text-[rgb(var(--tp-accent-rgb))] hover:underline flex items-center gap-1"
          >
            查看全部 <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[rgba(var(--tp-fg-rgb),0.4)] mr-2" />
            <span className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)]">加载中...</span>
          </div>
        ) : tenants.length === 0 ? (
          <Card className="border-[var(--tp-border)]">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-[rgba(var(--tp-accent-rgb),0.1)] flex items-center justify-center mb-4">
                  <Rocket className="w-8 h-8 text-[rgb(var(--tp-accent-rgb))]" />
                </div>
                <h3 className="text-lg font-semibold text-[rgb(var(--tp-fg-rgb))] mb-2">
                  启动你的经纪商
                </h3>
                <p className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)] mb-6 max-w-sm">
                  创建你的第一个租户，开始管理交易业务。仅需 2 分钟即可完成初始化。
                </p>
                <Link href="/console/onboarding">
                  <Button className="bg-[rgb(var(--tp-accent-rgb))] hover:opacity-90 text-white">
                    <Rocket className="w-4 h-4 mr-2" /> 开始（2分钟）
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenants.map((t) => (
              <Link key={t.id} href={`/console/tenants/${t.id}`}>
                <Card className="border-[var(--tp-border)] shadow-sm hover:border-[rgb(var(--tp-accent-rgb))] hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[rgb(var(--tp-accent-rgb))] flex items-center justify-center text-white font-bold text-sm">
                          {t.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-[rgb(var(--tp-fg-rgb))] group-hover:text-[rgb(var(--tp-accent-rgb))] transition-colors">
                            {t.name}
                          </h3>
                          <p className="text-sm text-[rgba(var(--tp-fg-rgb),0.5)]">
                            {t.slug}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!t.onboardingCompleted && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-600 border border-amber-200">
                            初始化中
                          </span>
                        )}
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            t.status === "active"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : t.status === "trial"
                              ? "bg-blue-50 text-[rgb(var(--tp-accent-rgb))] border border-blue-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {t.status === "active"
                            ? "运行中"
                            : t.status === "trial" || t.status === "pending"
                            ? "试用中"
                            : t.status === "suspended"
                            ? "已暂停"
                            : t.status}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
