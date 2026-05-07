"use client";

import { Loader2 } from "lucide-react";
import {
  OnboardingFunnel,
  AccountOverview,
  TradingAccounts,
  Promotions,
  ToolsDownload,
  Announcements,
  TrustBanner,
  AISignals,
  MarketNews,
  HelpCenter,
  CustomerService,
  DashboardBannerList,
} from "@/components/dashboard";
import { useDevConfig } from "@/lib/dev-config";
import { getDashboardConfig } from "@/lib/user-perspectives";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function DashboardPage() {
  // 使用开发者配置中的视角
  const { currentPerspective } = useDevConfig();

  // 获取 Dashboard 配置（基于用户阶段）
  const config = getDashboardConfig(currentPerspective);

  // 获取真实数据
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Main Content - 宽屏布局 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* 0. Banner 横幅 - 全宽（最上方） */}
        <DashboardBannerList />

        {/* 1. 用户引导（新用户显示）- 全宽 */}
        {config.showOnboarding && <OnboardingFunnel user={currentPerspective} />}

        {/* 2. 运营 Banner - 全宽 */}
        <section className="mb-6">
          <AccountOverview />
        </section>

        {/* 3. 交易账户 - 全宽 */}
        {config.showAccounts && (
          <section className="mb-6">
            <TradingAccounts user={currentPerspective} />
          </section>
        )}

        {/* 4. 数据模块行 - AI Signals(3列宽度) + 市场快讯 */}
        <section className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* AI Signals - 核心转化模块，占3列宽度 */}
            <div className="lg:col-span-3">
              <AISignals />
            </div>
            {/* 市场快讯 - 简化版 */}
            <div className="lg:col-span-1">
              <MarketNews />
            </div>
          </div>
        </section>

        {/* 5. 热门活动 - 全宽 */}
        {config.showPromotions && (
          <section className="mb-6">
            <Promotions />
          </section>
        )}

        {/* 6. 帮助中心 + 专属客服 - 并排布局 */}
        <section className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HelpCenter />
            <CustomerService />
          </div>
        </section>

        {/* 7. 底部区域 - 公告 + 工具下载（两列等宽） */}
        <section className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <div className="h-full">
              <Announcements />
            </div>
            <div className="h-full">
              <ToolsDownload />
            </div>
          </div>
        </section>

        {/* 8. 信任背书横幅 - 全宽放最底部 */}
        <section>
          <TrustBanner />
        </section>
      </main>
    </div>
  );
}
