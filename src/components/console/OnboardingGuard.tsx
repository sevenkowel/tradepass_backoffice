"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Lock, Rocket, ChevronRight, X } from "lucide-react";
import { useMockStore } from "@/lib/mock/store";
import { OnboardingStatus } from "@/lib/mock/types";
import { cn } from "@/lib/utils";

/**
 * OnboardingGuard
 * 
 * 当用户在初始化未完成时尝试访问被限制的功能时，显示拦截弹窗。
 * 
 * 使用方式：
 * ```tsx
 * <OnboardingGuard allowedStatuses={['completed']}>
 *   <MyFeatureComponent />
 * </OnboardingGuard>
 * ```
 * 
 * 或者在任意地方使用 hook：
 * ```tsx
 * const { isBlocked, showBlocked, dismissBlocked } = useOnboardingBlock(['completed']);
 * ```
 */

interface OnboardingGuardProps {
  /** 允许访问的初始化状态列表，默认只允许 completed */
  allowedStatuses?: OnboardingStatus[];
  /** 弹窗标题 */
  title?: string;
  /** 弹窗描述 */
  description?: string;
  /** 自定义 CTA 文案 */
  ctaText?: string;
  /** 何时显示弹窗：'mount' (组件挂载时) 或 'click' (手动触发) */
  trigger?: 'mount' | 'manual';
  /** 子组件（当状态允许时渲染） */
  children?: React.ReactNode;
  /** 替代内容（当状态不允许时显示） */
  fallback?: React.ReactNode;
  className?: string;
}

export function OnboardingGuard({
  allowedStatuses = ['completed'],
  title = "功能已锁定",
  description = "完成初始化后即可使用此功能。仅需 2 分钟即可解锁全部功能。",
  ctaText = "立即完成初始化",
  trigger = 'mount',
  children,
  fallback,
  className,
}: OnboardingGuardProps) {
  const router = useRouter();
  const store = useMockStore();
  
  // 获取当前租户的初始化状态
  const currentTenantId = store.currentTenantId;
  const tenant = currentTenantId ? store.getTenantById(currentTenantId) : null;
  const status = tenant?.onboardingStatus || 'not_started';
  const isBlocked = !allowedStatuses.includes(status);

  if (!isBlocked) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const handleContinue = () => {
    router.push('/console/onboarding');
  };

  return (
    <div className={cn("relative", className)}>
      {/* 半透明遮罩 + 锁定内容 */}
      <div className="relative opacity-40 pointer-events-none filter blur-[2px] select-none">
        {children || (
          <div className="h-40 rounded-xl bg-[var(--tp-bg)] border border-dashed border-[var(--tp-border)] flex items-center justify-center">
            <span className="text-sm text-[rgba(var(--tp-fg-rgb),0.3)]">功能暂不可用</span>
          </div>
        )}
      </div>

      {/* 锁定提示覆盖层 */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute inset-0 flex items-center justify-center z-10"
        >
          <div className="bg-[var(--tp-surface)] border border-[var(--tp-border)] rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-sm font-semibold text-[rgb(var(--tp-fg-rgb))] mb-1">
                {title}
              </h3>
              <p className="text-xs text-[rgba(var(--tp-fg-rgb),0.6)] mb-5">
                {description}
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleContinue}
                  className="w-full bg-[rgb(var(--tp-accent-rgb))] hover:bg-[rgb(var(--tp-accent-dark))] text-white h-10"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  {ctaText}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <p className="text-[10px] text-[rgba(var(--tp-fg-rgb),0.4)]">
                  5/5 步检查清单完成后即可解锁
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * useOnboardingBlock Hook
 * 
 * 在任何组件中使用此 hook 来判断功能是否被拦截
 */
export function useOnboardingBlock(allowedStatuses: OnboardingStatus[] = ['completed']) {
  const store = useMockStore();
  const currentTenantId = store.currentTenantId;
  const tenant = currentTenantId ? store.getTenantById(currentTenantId) : null;
  const status = tenant?.onboardingStatus || 'not_started';
  const isBlocked = !allowedStatuses.includes(status);

  return {
    isBlocked,
    status,
    tenant,
    phases: tenant?.onboardingPhases,
  };
}

/**
 * OnboardingBanner
 * 
 * 页面顶部的固定引导条，显示初始化进度，替代弹窗式拦截
 */
export function OnboardingBanner() {
  const router = useRouter();
  const store = useMockStore();
  const currentTenantId = store.currentTenantId;
  const tenant = currentTenantId ? store.getTenantById(currentTenantId) : null;
  
  if (!tenant || tenant.onboardingStatus === 'completed') {
    return null;
  }

  const phases = tenant.onboardingPhases;
  const completed = Object.values(phases).filter(Boolean).length;
  const total = 6;
  const percentage = Math.round((completed / total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800">
              你还未完成初始化（{completed}/{total}）
            </p>
            <p className="text-xs text-amber-700">
              完成配置后即可使用全部功能
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* 进度条 */}
          <div className="w-20 h-1.5 bg-amber-200 rounded-full overflow-hidden hidden sm:block">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <Button
            size="sm"
            className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => router.push('/console/onboarding')}
          >
            继续配置
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
