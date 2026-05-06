"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Gamepad2,
  ChevronRight,
  Check,
  Sparkles,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { PageHeader } from "@/components/portal/widgets/PageHeader";
import { usePortalStore } from "@/store/portalStore";
import type { TradingAccount } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ─── Mock Data ─────────────────────────────────────────────
const accountModes = [
  {
    id: "real",
    title: "真实账户",
    subtitle: "实盘交易",
    description: "使用真实资金在实盘市场交易，可使用全部交易工具和功能。",
    icon: Briefcase,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    borderColor: "border-blue-200",
    features: [
      "真实市场执行",
      "全部交易品种",
      "存取款功能",
      "跟单交易",
      "7×24 客服支持",
    ],
    requirements: ["最低入金 $100", "需要 KYC 认证"],
    recommended: true,
  },
  {
    id: "demo",
    title: "模拟账户",
    subtitle: "模拟交易",
    description: "使用虚拟资金无风险练习交易，适合学习和测试策略。",
    icon: Gamepad2,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    borderColor: "border-purple-200",
    features: [
      "$100,000 虚拟资金",
      "真实市场环境",
      "全部交易品种",
      "零风险练习",
      "无时间限制",
    ],
    requirements: ["无需入金", "即时开通"],
    recommended: false,
  },
];

const accountSubTypes = [
  { id: "standard", label: "Standard", server: "TradePass-Standard", desc: "适合大多数交易者，低点差" },
  { id: "ecn", label: "ECN", server: "TradePass-ECN", desc: "原始点差 + 低手续费，适合高频交易" },
  { id: "pro", label: "Pro", server: "TradePass-Pro", desc: "机构级执行，最低成本" },
];

const leverageOptions = ["1:50", "1:100", "1:200", "1:500"];
const currencyOptions = ["USD", "EUR", "JPY", "USC"];

// ─── Components ────────────────────────────────────────────
function AccountModeCard({
  mode,
  selected,
  onSelect,
}: {
  mode: (typeof accountModes)[0];
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = mode.icon;
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onSelect}
      className={cn(
        "relative rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200",
        selected
          ? "border-blue-500 bg-blue-50/30"
          : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
      )}
    >
      {mode.recommended && (
        <div className="absolute -top-3 left-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">
          推荐
        </div>
      )}
      {selected && (
        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
          <Check size={14} className="text-white" />
        </div>
      )}
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
            mode.iconBg,
            mode.borderColor,
            "border-2"
          )}
        >
          <Icon size={26} className={mode.iconColor} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-800">{mode.title}</h3>
          <p className="text-sm text-blue-600 font-medium">{mode.subtitle}</p>
          <p className="text-sm text-gray-500 mt-2">{mode.description}</p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {mode.features.map((feature, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center">
              <Check size={12} className="text-emerald-600" />
            </div>
            <span className="text-sm text-gray-600">{feature}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-2">要求：</p>
        <div className="flex flex-wrap gap-2">
          {mode.requirements.map((req, idx) => (
            <span
              key={idx}
              className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-lg border border-gray-200"
            >
              {req}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function OpenAccountPage() {
  const { user, tradingAccounts, setTradingAccounts } = usePortalStore();
  const [selectedMode, setSelectedMode] = useState<string>("real");
  const [selectedSubType, setSelectedSubType] = useState<string>("standard");
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    accountName: "",
    leverage: "1:100",
    currency: "USD",
    tradingPassword: "",
  });
  const [created, setCreated] = useState(false);

  const handleCreateAccount = () => {
    const subType = accountSubTypes.find((s) => s.id === selectedSubType);
    const leverageNum = Number(formData.leverage.replace("1:", ""));
    const newAccount: TradingAccount = {
      id: `ta_${Date.now()}`,
      userId: user?.id ?? "u_001",
      accountNumber: `MT5-${Math.floor(100000 + Math.random() * 900000)}`,
      type: selectedMode === "real" ? "Real" : "Demo",
      server: subType?.server ?? "TradePass-Standard",
      leverage: leverageNum,
      balance: selectedMode === "demo" ? 100000 : 0,
      equity: selectedMode === "demo" ? 100000 : 0,
      margin: 0,
      freeMargin: selectedMode === "demo" ? 100000 : 0,
      marginLevel: 0,
      currency: formData.currency,
      profit: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setTradingAccounts([...tradingAccounts, newAccount]);
    setCreated(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="开通交易账户"
        description="选择账户类型并配置您的交易偏好"
      />

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-4">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors",
                step >= s
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-400"
              )}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={cn(
                  "w-16 h-1 rounded-full transition-colors",
                  step > s ? "bg-blue-500" : "bg-gray-200"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Select Account Type */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="font-bold text-gray-800">1. 选择账户类型</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {accountModes.map((mode) => (
                <AccountModeCard
                  key={mode.id}
                  mode={mode}
                  selected={selectedMode === mode.id}
                  onSelect={() => setSelectedMode(mode.id)}
                />
              ))}
            </div>

            {/* Real 账户子类型选择 */}
            {selectedMode === "real" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3"
              >
                <h3 className="font-semibold text-gray-700">选择账户等级</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {accountSubTypes.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubType(sub.id)}
                      className={cn(
                        "rounded-xl border-2 p-4 text-left transition-all",
                        selectedSubType === sub.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-800">{sub.label}</span>
                        {selectedSubType === sub.id && (
                          <Check size={14} className="text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{sub.desc}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                下一步 <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Configure Account */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="font-bold text-gray-800">2. 配置账户</h2>
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 max-w-2xl">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    账户名称
                  </label>
                  <input
                    type="text"
                    placeholder="我的交易账户"
                    value={formData.accountName}
                    onChange={(e) =>
                      setFormData({ ...formData, accountName: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    交易币种
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {currencyOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() =>
                          setFormData({ ...formData, currency: opt })
                        }
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium transition-all border-2",
                          formData.currency === opt
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.currency === "USC" && "US Cent（美分）账户，1 USD = 100 USC"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    杠杆倍数
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {leverageOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() =>
                          setFormData({ ...formData, leverage: opt })
                        }
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium transition-all border-2",
                          formData.leverage === opt
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    交易密码
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="设置交易密码"
                      value={formData.tradingPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, tradingPassword: e.target.value })
                      }
                      className="w-full pl-11 pr-12 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none transition-colors"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">交易密码用于 MT5 平台登录，请妥善保管</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="text-gray-600 font-medium px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors"
              >
                返回
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!formData.tradingPassword || formData.tradingPassword.length < 6}
                className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors flex items-center gap-2"
              >
                下一步 <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Review & Create */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="font-bold text-gray-800">3. 确认并创建</h2>
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 max-w-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">账户类型</span>
                  <span className="font-semibold text-gray-800">
                    {selectedMode === "real"
                      ? `真实账户 · ${accountSubTypes.find((s) => s.id === selectedSubType)?.label ?? "Standard"}`
                      : "模拟账户"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">账户名称</span>
                  <span className="font-semibold text-gray-800">
                    {formData.accountName || "我的交易账户"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">交易币种</span>
                  <span className="font-semibold text-gray-800">
                    {formData.currency}
                    {formData.currency === "USC" && (
                      <span className="text-xs text-gray-400 ml-1">(US Cent)</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">杠杆倍数</span>
                  <span className="font-semibold text-gray-800">
                    {formData.leverage}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-500">交易密码</span>
                  <span className="font-semibold text-gray-800">
                    {"*".repeat(formData.tradingPassword.length)}
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <Sparkles size={20} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">
                      创建后将发生什么？
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      您的账户将立即创建。{selectedMode === "demo" ? "您可以立即使用 $100,000 虚拟资金开始交易。" : "您可以立即开始交易或先进行入金。"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="text-gray-600 font-medium px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors"
              >
                返回
              </button>
              {created ? (
                <Link href="/portal/accounts/accounts">
                  <button className="bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2">
                    <Check size={18} />
                    创建成功，查看账户
                  </button>
                </Link>
              ) : (
                <button
                  onClick={handleCreateAccount}
                  className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  创建账户 <Check size={18} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
