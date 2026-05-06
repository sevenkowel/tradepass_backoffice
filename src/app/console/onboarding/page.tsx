"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Rocket, Sparkles, Clock, Globe, Shield, CreditCard, TrendingUp, Users } from "lucide-react";
import { useMockStore } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

const WHATS_INCLUDED = [
  { icon: Globe, title: "品牌 Portal", description: "客户注册、KYC、交易、出入金的完整门户" },
  { icon: Shield, title: "管理后台", description: "用户管理、资金审核、风控配置的运营后台" },
  { icon: TrendingUp, title: "交易引擎", description: "MT5 对接、点差/杠杆/账户类型的交易配置" },
  { icon: CreditCard, title: "支付集成", description: "银行转账、电子钱包、加密货币等多种入金方式" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const store = useMockStore();
  const [started, setStarted] = useState(false);

  // 检查是否已有租户 - 有则直接跳转到控制台
  useEffect(() => {
    const currentUser = store.currentUser;
    if (currentUser) {
      const tenants = store.getUserTenants(currentUser.id);
      const pendingTenants = tenants.filter((t) => t.onboardingStatus !== "completed");
      if (pendingTenants.length > 0) {
        // 有进行中的租户，设置为当前
        store.setCurrentTenant(pendingTenants[0].id);
      }
    }
  }, []);

  const handleStart = () => {
    setStarted(true);
    // 跳转到租户创建向导
    router.push("/console/tenants/new");
  };

  return (
    <div className="min-h-screen bg-[var(--tp-bg)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-20 h-20 rounded-2xl bg-[rgba(var(--tp-accent-rgb),0.1)] flex items-center justify-center mx-auto mb-6">
            <Rocket className="w-10 h-10 text-[rgb(var(--tp-accent-rgb))]" />
          </div>
          <h1 className="text-3xl font-bold text-[rgb(var(--tp-fg-rgb))] mb-3">
            启动你的经纪商
          </h1>
          <p className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)] max-w-md mx-auto leading-relaxed">
            创建品牌、选择业务模板、配置收款方式。
            仅需 2 分钟，即可拥有一个专业的外汇经纪商平台。
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[var(--tp-surface)] rounded-3xl border border-[var(--tp-border)] p-8 shadow-sm"
        >
          {/* CTA Button */}
          <div className="text-center mb-8">
            <Button
              onClick={handleStart}
              className="h-14 px-10 text-base bg-[rgb(var(--tp-accent-rgb))] hover:bg-[rgb(var(--tp-accent-dark))] text-white rounded-2xl shadow-lg shadow-[rgba(var(--tp-accent-rgb),0.2)]"
            >
              <Rocket className="w-5 h-5 mr-2" />
              开始（约 2 分钟）
            </Button>
            <p className="text-xs text-[rgba(var(--tp-fg-rgb),0.4)] mt-3">
              <Clock className="w-3 h-3 inline-block mr-1" />
              免费创建，无需信用卡
            </p>
          </div>

          {/* Included Features */}
          <div className="border-t border-[var(--tp-border)] pt-6">
            <h3 className="text-sm font-semibold text-[rgb(var(--tp-fg-rgb))] mb-4 text-center">
              你将获得
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WHATS_INCLUDED.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[var(--tp-bg)]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[rgba(var(--tp-accent-rgb),0.1)] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[rgb(var(--tp-accent-rgb))]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[rgb(var(--tp-fg-rgb))]">{item.title}</p>
                      <p className="text-xs text-[rgba(var(--tp-fg-rgb),0.5)] mt-0.5">{item.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Bottom Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs text-[rgba(var(--tp-fg-rgb),0.4)] mt-8"
        >
          或 <button onClick={() => router.push("/console")} className="underline hover:text-[rgb(var(--tp-accent-rgb))]">返回控制台</button>
        </motion.p>
      </div>
    </div>
  );
}
