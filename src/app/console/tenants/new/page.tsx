"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  Building2,
  Briefcase,
  CreditCard,
  Rocket,
  Check,
  ChevronRight,
  ChevronLeft,
  Globe,
  Landmark,
  Palette,
  Wallet,
  Banknote,
  CircleDollarSign,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  BusinessTemplate,
  BusinessTemplateId,
  PaymentMethodConfig,
  BrandConfig,
  PaymentConfig,
  BrokerConfig,
} from "@/lib/mock/types";

// ============================================
// 步骤定义
// ============================================
const STEPS = [
  { id: 1, title: "品牌基础", icon: Building2, description: "配置品牌标识" },
  { id: 2, title: "业务模板", icon: Briefcase, description: "选择业务模式" },
  { id: 3, title: "支付配置", icon: CreditCard, description: "设置资金渠道" },
  { id: 4, title: "确认创建", icon: Rocket, description: "完成初始化" },
];

// ============================================
// 业务模板定义
// ============================================
const businessTemplates: BusinessTemplate[] = [
  {
    id: "standard_fx",
    name: "标准外汇经纪商",
    description: "传统外汇业务模式，适合大多数经纪商",
    icon: "🏆",
    preset: {
      instruments: ["forex", "metals", "indices"],
      accountTypes: ["standard", "ecn"],
      leverageOptions: ["1:100", "1:200", "1:500"],
      regulationType: "offshore",
      baseCurrencies: ["USD", "EUR"],
      minDeposit: 100,
      spreadType: "variable",
      islamicAccount: false,
      copyTrading: false,
      mamPamm: false,
    },
    paymentPreset: {
      depositMethods: ["bank_transfer", "crypto", "card"],
      withdrawalMethods: ["bank_transfer", "crypto"],
    },
  },
  {
    id: "crypto_focus",
    name: "加密优先",
    description: "专注加密货币交易，新兴市场的选择",
    icon: "🚀",
    preset: {
      instruments: ["crypto", "forex", "metals"],
      accountTypes: ["ecn", "standard"],
      leverageOptions: ["1:50", "1:100", "1:200"],
      regulationType: "tier2",
      baseCurrencies: ["USD", "USDT"],
      minDeposit: 50,
      spreadType: "raw",
      islamicAccount: false,
      copyTrading: true,
      mamPamm: true,
    },
    paymentPreset: {
      depositMethods: ["crypto", "ewallet", "card"],
      withdrawalMethods: ["crypto", "ewallet"],
    },
  },
  {
    id: "sea_local",
    name: "东南亚本地化",
    description: "印尼/马来西亚本地化，支持本地支付",
    icon: "🌏",
    preset: {
      instruments: ["forex", "metals", "indices", "commodities", "crypto"],
      accountTypes: ["standard", "micro"],
      leverageOptions: ["1:100", "1:200", "1:500", "1:1000"],
      regulationType: "tier3",
      baseCurrencies: ["USD", "IDR"],
      minDeposit: 10,
      spreadType: "variable",
      islamicAccount: true,
      copyTrading: false,
      mamPamm: false,
    },
    paymentPreset: {
      depositMethods: ["ewallet", "bank_transfer", "crypto"],
      withdrawalMethods: ["ewallet", "bank_transfer"],
    },
  },
  {
    id: "custom",
    name: "自定义配置",
    description: "从零开始，逐项自定义所有配置",
    icon: "⚙️",
    preset: {
      instruments: ["forex"],
      accountTypes: ["standard"],
      leverageOptions: ["1:100"],
      regulationType: "offshore",
      baseCurrencies: ["USD"],
      minDeposit: 100,
      spreadType: "variable",
      islamicAccount: false,
      copyTrading: false,
      mamPamm: false,
    },
    paymentPreset: {
      depositMethods: ["bank_transfer"],
      withdrawalMethods: ["bank_transfer"],
    },
  },
];

// ============================================
// 支付渠道定义
// ============================================
const paymentProviders: PaymentMethodConfig[] = [
  {
    method: "bank_transfer",
    provider: "local_bank",
    providerName: "本地银行转账",
    icon: "🏦",
    enabled: false,
    minAmount: 50,
    maxAmount: 50000,
    fee: 0,
    feeType: "fixed",
    processingTime: "1-2工作日",
    currencies: ["USD", "EUR", "IDR"],
  },
  {
    method: "bank_transfer",
    provider: "bca",
    providerName: "BCA (印尼)",
    icon: "🇮🇩",
    enabled: false,
    minAmount: 100000,
    maxAmount: 1000000000,
    fee: 0,
    feeType: "fixed",
    processingTime: "即时-1小时",
    currencies: ["IDR"],
  },
  {
    method: "bank_transfer",
    provider: "mandiri",
    providerName: "Mandiri (印尼)",
    icon: "🇮🇩",
    enabled: false,
    minAmount: 100000,
    maxAmount: 1000000000,
    fee: 0,
    feeType: "fixed",
    processingTime: "即时-1小时",
    currencies: ["IDR"],
  },
  {
    method: "ewallet",
    provider: "dana",
    providerName: "DANA",
    icon: "💳",
    enabled: false,
    minAmount: 10000,
    maxAmount: 10000000,
    fee: 1.5,
    feeType: "percentage",
    processingTime: "即时",
    currencies: ["IDR"],
  },
  {
    method: "ewallet",
    provider: "ovo",
    providerName: "OVO",
    icon: "💳",
    enabled: false,
    minAmount: 10000,
    maxAmount: 10000000,
    fee: 1.5,
    feeType: "percentage",
    processingTime: "即时",
    currencies: ["IDR"],
  },
  {
    method: "crypto",
    provider: "usdt_trc20",
    providerName: "USDT (TRC20)",
    icon: "₿",
    enabled: false,
    minAmount: 50,
    maxAmount: 100000,
    fee: 1,
    feeType: "fixed",
    processingTime: "即时",
    currencies: ["USDT"],
  },
  {
    method: "crypto",
    provider: "usdt_erc20",
    providerName: "USDT (ERC20)",
    icon: "₿",
    enabled: false,
    minAmount: 100,
    maxAmount: 100000,
    fee: 10,
    feeType: "fixed",
    processingTime: "即时",
    currencies: ["USDT"],
  },
  {
    method: "card",
    provider: "visa_mastercard",
    providerName: "Visa / Mastercard",
    icon: "💳",
    enabled: false,
    minAmount: 50,
    maxAmount: 10000,
    fee: 3.5,
    feeType: "percentage",
    processingTime: "即时",
    currencies: ["USD", "EUR"],
  },
];

// ============================================
// 品牌色预设
// ============================================
const BRAND_COLORS = [
  { name: "经典蓝", value: "#1E40AF" },
  { name: "专业绿", value: "#059669" },
  { name: "奢华紫", value: "#7C3AED" },
  { name: "活力橙", value: "#EA580C" },
  { name: "深空黑", value: "#1F2937" },
  { name: "玫瑰红", value: "#BE123C" },
];

// ============================================
// 动画配置
// ============================================
const pageTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" as const },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// ============================================
// 主组件
// ============================================
export default function CreateTenantPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Step 1: 品牌基础
  const [brandForm, setBrandForm] = useState<BrandConfig & { logoUrl?: string; faviconUrl?: string }>({
    brandName: "",
    companyName: "",
    slug: "",
    primaryColor: "#1E40AF",
    logoUrl: "",
    faviconUrl: "",
  });

  // Step 2: 业务模板
  const [selectedTemplate, setSelectedTemplate] = useState<BusinessTemplateId>("standard_fx");

  // Step 3: 支付配置
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    depositMethods: [],
    withdrawalMethods: [],
  });

  // ============================================
  // 工具函数
  // ============================================
  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, "-")
      .replace(/[\u4e00-\u9fa5]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleNameChange(value: string) {
    setBrandForm((prev) => ({
      ...prev,
      brandName: value,
      slug: prev.slug || generateSlug(value),
      companyName: prev.companyName || value,
    }));
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "favicon") {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setBrandForm((prev) => ({
        ...prev,
        [type === "logo" ? "logoUrl" : "faviconUrl"]: result,
      }));
    };
    reader.readAsDataURL(file);
  }

  function handleTemplateSelect(templateId: BusinessTemplateId) {
    setSelectedTemplate(templateId);
    const template = businessTemplates.find((t) => t.id === templateId);
    if (template) {
      const depositMethods = paymentProviders
        .filter((p) => template.paymentPreset.depositMethods.includes(p.method))
        .slice(0, 3)
        .map((p) => ({ ...p, enabled: true }));
      const withdrawalMethods = paymentProviders
        .filter((p) => template.paymentPreset.withdrawalMethods.includes(p.method))
        .slice(0, 2)
        .map((p) => ({ ...p, enabled: true }));
      setPaymentConfig({
        depositMethods,
        withdrawalMethods,
      });
    }
  }

  function validateStep(step: number): boolean {
    setError("");
    if (step === 1) {
      if (!brandForm.brandName.trim()) {
        setError("请输入品牌名称");
        return false;
      }
      if (!brandForm.slug.trim()) {
        setError("请输入租户标识");
        return false;
      }
      if (!brandForm.companyName.trim()) {
        setError("请输入公司全称");
        return false;
      }
    }
    if (step === 3) {
      const enabledDeposits = paymentConfig.depositMethods.filter((m) => m.enabled);
      const enabledWithdrawals = paymentConfig.withdrawalMethods.filter((m) => m.enabled);
      if (enabledDeposits.length === 0) {
        setError("请至少启用一种入金方式");
        return false;
      }
      if (enabledWithdrawals.length === 0) {
        setError("请至少启用一种出金方式");
        return false;
      }
    }
    return true;
  }

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setSaving(true);
      setTimeout(() => {
        setCurrentStep((prev) => Math.min(prev + 1, 4));
        setSaving(false);
      }, 300);
    }
  }, [currentStep, brandForm, paymentConfig]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError("");
  }, []);

  function getSelectedTemplate(): BusinessTemplate {
    return businessTemplates.find((t) => t.id === selectedTemplate)!;
  }

  function buildBrokerConfig(template: BusinessTemplate): BrokerConfig {
    return { ...template.preset };
  }

  async function onSubmit() {
    setLoading(true);
    setError("");

    const template = getSelectedTemplate();
    const brokerConfig = buildBrokerConfig(template);

    const res = await fetch("/api/console/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: brandForm.brandName,
        slug: brandForm.slug,
        region: "VN",
        plan: "starter",
        settings: {
          kycLevel: "standard",
          features: ["portal", "crm", "broker"],
          branding: {
            primaryColor: brandForm.primaryColor,
            companyName: brandForm.companyName,
            logoUrl: brandForm.logoUrl,
            faviconUrl: brandForm.faviconUrl,
          },
        },
        brandConfig: brandForm,
        businessTemplate: template,
        paymentConfig,
        brokerConfig,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "创建失败");
      return;
    }

    router.push(`/console/tenants/${data.data.id}`);
  }

  // ============================================
  // 渲染步骤指示器
  // ============================================
  function renderStepIndicator() {
    return (
      <div className="mb-10">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = s.id === currentStep;
            const isCompleted = s.id < currentStep;
            const isLast = i === STEPS.length - 1;

            return (
              <div key={s.id} className="flex items-center flex-1">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.05 : 1,
                  }}
                  className={cn(
                    "relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                    isCompleted
                      ? "bg-[rgb(var(--tp-accent-rgb))] text-white"
                      : isActive
                      ? "bg-[rgb(var(--tp-accent-rgb))] text-white ring-4 ring-[rgba(var(--tp-accent-rgb),0.2)]"
                      : "bg-[rgba(var(--tp-fg-rgb),0.08)] text-[rgba(var(--tp-fg-rgb),0.4)]"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                  
                  {/* 步骤标签 */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <p
                      className={cn(
                        "text-xs font-medium transition-colors",
                        isActive || isCompleted
                          ? "text-[rgb(var(--tp-fg-rgb))]"
                          : "text-[rgba(var(--tp-fg-rgb),0.4)]"
                      )}
                    >
                      {s.title}
                    </p>
                    <p className="text-[10px] text-[rgba(var(--tp-fg-rgb),0.4)] hidden sm:block">
                      {s.description}
                    </p>
                  </div>
                </motion.div>

                {!isLast && (
                  <div
                    className={cn(
                      "flex-1 h-1 mx-3 rounded-full transition-all duration-500",
                      isCompleted
                        ? "bg-[rgb(var(--tp-accent-rgb))]"
                        : "bg-[rgba(var(--tp-fg-rgb),0.08)]"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ============================================
  // 渲染步骤内容
  // ============================================
  function renderStepContent() {
    switch (currentStep) {
      case 1:
        return (
          <Step1Brand
            brandForm={brandForm}
            setBrandForm={setBrandForm}
            handleNameChange={handleNameChange}
            handleLogoUpload={handleLogoUpload}
          />
        );
      case 2:
        return (
          <Step2Template
            selectedTemplate={selectedTemplate}
            handleTemplateSelect={handleTemplateSelect}
          />
        );
      case 3:
        return (
          <Step3Payment
            paymentConfig={paymentConfig}
            setPaymentConfig={setPaymentConfig}
            template={getSelectedTemplate()}
          />
        );
      case 4:
        return (
          <Step4Confirm
            brandForm={brandForm}
            template={getSelectedTemplate()}
            paymentConfig={paymentConfig}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-[var(--tp-bg)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link href="/console">
            <Button variant="outline" size="sm" className="h-9">
              <ChevronLeft className="w-4 h-4 mr-1" /> 返回控制台
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--tp-fg-rgb))]">
              创建新租户
            </h1>
            <p className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)]">
              配置您的外汇经纪商业务
            </p>
          </div>
        </motion.div>

        {/* 步骤指示器 */}
        {renderStepIndicator()}

        {/* 全局错误提示 */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2"
            >
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                <X className="w-3 h-3" />
              </div>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 步骤内容 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            {...pageTransition}
            className="bg-[var(--tp-surface)] rounded-2xl border border-[var(--tp-border)] p-8 min-h-[500px]"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* 操作按钮 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between mt-8"
        >
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1 || saving}
            className={cn(
              "h-11 px-6",
              currentStep === 1 ? "invisible" : ""
            )}
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> 上一步
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={nextStep}
              disabled={saving}
              className="h-11 px-6 bg-[rgb(var(--tp-accent-rgb))] hover:bg-[rgb(var(--tp-accent-dark))] text-white"
            >
              {saving ? "保存中..." : "下一步"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={onSubmit}
              disabled={loading}
              className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  创建中...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" /> 确认创建
                </>
              )}
            </Button>
          )}
        </motion.div>

        {/* 保存指示器 */}
        {saving && (
          <p className="text-center text-sm text-[rgba(var(--tp-fg-rgb),0.5)] mt-4">
            保存中...
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================
// Step 1: 品牌基础
// ============================================
function Step1Brand({
  brandForm,
  setBrandForm,
  handleNameChange,
  handleLogoUpload,
}: {
  brandForm: BrandConfig & { logoUrl?: string; faviconUrl?: string };
  setBrandForm: React.Dispatch<React.SetStateAction<any>>;
  handleNameChange: (value: string) => void;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "favicon") => void;
}) {
  return (
    <div className="space-y-8">
      {/* 标题 */}
      <motion.div {...fadeInUp}>
        <h2 className="text-xl font-semibold text-[rgb(var(--tp-fg-rgb))] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[rgb(var(--tp-accent-rgb))]" />
          品牌与身份
        </h2>
        <p className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)] mt-1">
          配置您的品牌标识，这些将展示在 Portal 和 CRM 系统中
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* Logo & Favicon 上传 */}
        <motion.div {...fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Logo 上传 */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--tp-fg-rgb))] mb-3">
              品牌 Logo
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleLogoUpload(e, "logo")}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className={cn(
                  "flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden",
                  brandForm.logoUrl
                    ? "border-[rgb(var(--tp-accent-rgb))] bg-[rgba(var(--tp-accent-rgb),0.05)]"
                    : "border-[var(--tp-border)] bg-[var(--tp-bg)] hover:border-[rgb(var(--tp-accent-rgb))]"
                )}
              >
                {brandForm.logoUrl ? (
                  <img
                    src={brandForm.logoUrl}
                    alt="Logo preview"
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-[rgba(var(--tp-fg-rgb),0.08)] flex items-center justify-center mb-3">
                      <Upload className="w-5 h-5 text-[rgba(var(--tp-fg-rgb),0.4)]" />
                    </div>
                    <span className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)]">点击上传 Logo</span>
                    <span className="text-xs text-[rgba(var(--tp-fg-rgb),0.4)] mt-1">支持 PNG, JPG, SVG</span>
                  </>
                )}
              </label>
              {brandForm.logoUrl && (
                <button
                  onClick={() => setBrandForm((prev: any) => ({ ...prev, logoUrl: "" }))}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Favicon 上传 */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--tp-fg-rgb))] mb-3">
              网站 Favicon
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleLogoUpload(e, "favicon")}
                className="hidden"
                id="favicon-upload"
              />
              <label
                htmlFor="favicon-upload"
                className={cn(
                  "flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed cursor-pointer transition-all",
                  brandForm.faviconUrl
                    ? "border-[rgb(var(--tp-accent-rgb))] bg-[rgba(var(--tp-accent-rgb),0.05)]"
                    : "border-[var(--tp-border)] bg-[var(--tp-bg)] hover:border-[rgb(var(--tp-accent-rgb))]"
                )}
              >
                {brandForm.faviconUrl ? (
                  <img
                    src={brandForm.faviconUrl}
                    alt="Favicon preview"
                    className="w-16 h-16 object-contain"
                  />
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-[rgba(var(--tp-fg-rgb),0.08)] flex items-center justify-center mb-3">
                      <Globe className="w-5 h-5 text-[rgba(var(--tp-fg-rgb),0.4)]" />
                    </div>
                    <span className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)]">点击上传 Favicon</span>
                    <span className="text-xs text-[rgba(var(--tp-fg-rgb),0.4)] mt-1">建议 32x32px</span>
                  </>
                )}
              </label>
              {brandForm.faviconUrl && (
                <button
                  onClick={() => setBrandForm((prev: any) => ({ ...prev, faviconUrl: "" }))}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* 品牌名称 */}
        <motion.div {...fadeInUp}>
          <label className="block text-sm font-medium text-[rgb(var(--tp-fg-rgb))] mb-2">
            品牌名称 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(var(--tp-fg-rgb),0.4)]" />
            <input
              type="text"
              value={brandForm.brandName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="例如：Alpha Broker"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[var(--tp-border)] bg-[var(--tp-bg)] text-[rgb(var(--tp-fg-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--tp-accent-rgb),0.2)] focus:border-[rgb(var(--tp-accent-rgb))] transition-all"
            />
          </div>
          <p className="text-xs text-[rgba(var(--tp-fg-rgb),0.5)] mt-1.5">
            这将显示在您的客户门户和交易平台上
          </p>
        </motion.div>

        {/* 租户标识 */}
        <motion.div {...fadeInUp}>
          <label className="block text-sm font-medium text-[rgb(var(--tp-fg-rgb))] mb-2">
            租户标识（slug） <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center">
            <span className="h-11 px-4 flex items-center rounded-l-xl border border-r-0 border-[var(--tp-border)] bg-[rgba(var(--tp-fg-rgb),0.05)] text-[rgba(var(--tp-fg-rgb),0.5)] text-sm">
              tradepass.io/t/
            </span>
            <input
              type="text"
              value={brandForm.slug}
              onChange={(e) =>
                setBrandForm((prev: any) => ({ ...prev, slug: e.target.value }))
              }
              placeholder="alpha-broker"
              className="flex-1 h-11 px-4 rounded-r-xl border border-[var(--tp-border)] bg-[var(--tp-bg)] text-[rgb(var(--tp-fg-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--tp-accent-rgb),0.2)] focus:border-[rgb(var(--tp-accent-rgb))] transition-all"
            />
          </div>
          <p className="text-xs text-[rgba(var(--tp-fg-rgb),0.5)] mt-1.5">
            用于生成唯一URL，仅限字母、数字和连字符
          </p>
        </motion.div>

        {/* 公司全称 */}
        <motion.div {...fadeInUp}>
          <label className="block text-sm font-medium text-[rgb(var(--tp-fg-rgb))] mb-2">
            公司全称 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(var(--tp-fg-rgb),0.4)]" />
            <input
              type="text"
              value={brandForm.companyName}
              onChange={(e) =>
                setBrandForm((prev: any) => ({ ...prev, companyName: e.target.value }))
              }
              placeholder="例如：Alpha Broker Limited"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[var(--tp-border)] bg-[var(--tp-bg)] text-[rgb(var(--tp-fg-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--tp-accent-rgb),0.2)] focus:border-[rgb(var(--tp-accent-rgb))] transition-all"
            />
          </div>
        </motion.div>

        {/* 品牌主色 */}
        <motion.div {...fadeInUp}>
          <label className="block text-sm font-medium text-[rgb(var(--tp-fg-rgb))] mb-3">
            <Palette className="w-4 h-4 inline-block mr-1" />
            品牌主色
          </label>
          <div className="flex flex-wrap gap-3">
            {BRAND_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() =>
                  setBrandForm((prev: any) => ({ ...prev, primaryColor: color.value }))
                }
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all",
                  brandForm.primaryColor === color.value
                    ? "border-[rgb(var(--tp-accent-rgb))] bg-[rgba(var(--tp-accent-rgb),0.05)]"
                    : "border-[var(--tp-border)] hover:border-[rgba(var(--tp-fg-rgb),0.3)]"
                )}
              >
                <div
                  className="w-5 h-5 rounded-full border border-[rgba(0,0,0,0.1)]"
                  style={{ backgroundColor: color.value }}
                />
                <span className="text-sm text-[rgb(var(--tp-fg-rgb))]">{color.name}</span>
                {brandForm.primaryColor === color.value && (
                  <Check className="w-3.5 h-3.5 text-[rgb(var(--tp-accent-rgb))]" />
                )}
              </button>
            ))}
          </div>
          
          {/* 自定义颜色 */}
          <div className="flex items-center gap-3 mt-4">
            <input
              type="color"
              value={brandForm.primaryColor}
              onChange={(e) =>
                setBrandForm((prev: any) => ({ ...prev, primaryColor: e.target.value }))
              }
              className="w-10 h-10 rounded-lg border border-[var(--tp-border)] cursor-pointer"
            />
            <input
              type="text"
              value={brandForm.primaryColor}
              onChange={(e) =>
                setBrandForm((prev: any) => ({ ...prev, primaryColor: e.target.value }))
              }
              className="flex-1 h-10 px-3 rounded-lg border border-[var(--tp-border)] bg-[var(--tp-bg)] text-[rgb(var(--tp-fg-rgb))] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[rgba(var(--tp-accent-rgb),0.2)]"
            />
            <div
              className="w-10 h-10 rounded-lg border border-[var(--tp-border)]"
              style={{ backgroundColor: brandForm.primaryColor }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ============================================
// Step 2: 业务模板
// ============================================
function Step2Template({
  selectedTemplate,
  handleTemplateSelect,
}: {
  selectedTemplate: BusinessTemplateId;
  handleTemplateSelect: (id: BusinessTemplateId) => void;
}) {
  return (
    <div className="space-y-8">
      {/* 标题 */}
      <motion.div {...fadeInUp}>
        <h2 className="text-xl font-semibold text-[rgb(var(--tp-fg-rgb))] flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-[rgb(var(--tp-accent-rgb))]" />
          选择业务模板
        </h2>
        <p className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)] mt-1">
          模板将自动配置交易产品、账户类型和支付渠道
        </p>
      </motion.div>

      {/* 模板卡片 */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {businessTemplates.map((template, index) => {
          const isSelected = selectedTemplate === template.id;
          return (
            <motion.button
              key={template.id}
              {...fadeInUp}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleTemplateSelect(template.id)}
              className={cn(
                "relative flex flex-col p-5 rounded-2xl border-2 transition-all text-left group",
                isSelected
                  ? "border-[rgb(var(--tp-accent-rgb))] bg-[rgba(var(--tp-accent-rgb),0.03)]"
                  : "border-[var(--tp-border)] hover:border-[rgba(var(--tp-fg-rgb),0.3)] hover:shadow-lg"
              )}
            >
              {/* 选中标记 */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[rgb(var(--tp-accent-rgb))] flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              <div className="flex items-start gap-4">
                <span className="text-4xl">{template.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-[rgb(var(--tp-fg-rgb))] text-lg">{template.name}</h3>
                  <p className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)] mt-1">{template.description}</p>
                </div>
              </div>

              {/* 配置预览 */}
              <div className="mt-5 pt-4 border-t border-[var(--tp-border)] space-y-3">
                <div>
                  <span className="text-xs text-[rgba(var(--tp-fg-rgb),0.5)]">交易产品</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {template.preset.instruments.slice(0, 4).map((inst) => (
                      <span
                        key={inst}
                        className={cn(
                          "px-2.5 py-1 text-xs rounded-full",
                          isSelected
                            ? "bg-[rgba(var(--tp-accent-rgb),0.1)] text-[rgb(var(--tp-accent-rgb))]"
                            : "bg-[rgba(var(--tp-fg-rgb),0.06)] text-[rgba(var(--tp-fg-rgb),0.7)]"
                        )}
                      >
                        {inst === "forex" && "外汇"}
                        {inst === "metals" && "贵金属"}
                        {inst === "indices" && "指数"}
                        {inst === "commodities" && "大宗商品"}
                        {inst === "crypto" && "加密货币"}
                        {inst === "stocks" && "股票"}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-xs text-[rgba(var(--tp-fg-rgb),0.5)]">杠杆选项</span>
                    <p className="text-[rgb(var(--tp-fg-rgb))] font-medium mt-0.5">
                      {template.preset.leverageOptions.join(", ")}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-[rgba(var(--tp-fg-rgb),0.5)]">最低入金</span>
                    <p className="text-[rgb(var(--tp-fg-rgb))] font-medium mt-0.5">
                      ${template.preset.minDeposit}
                    </p>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* 提示 */}
      <motion.div
        {...fadeInUp}
        className="p-4 rounded-xl bg-[rgba(var(--tp-accent-rgb),0.05)] border border-[rgba(var(--tp-accent-rgb),0.2)]"
      >
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-[rgb(var(--tp-accent-rgb))] mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[rgb(var(--tp-fg-rgb))]">模板说明</p>
            <p className="text-xs text-[rgba(var(--tp-fg-rgb),0.6)] mt-1">
              选择模板后，系统将自动为您配置推荐的交易参数和支付渠道。您可以在创建后随时调整这些设置。
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// Step 3: 支付配置
// ============================================
function Step3Payment({
  paymentConfig,
  setPaymentConfig,
  template,
}: {
  paymentConfig: PaymentConfig;
  setPaymentConfig: React.Dispatch<React.SetStateAction<PaymentConfig>>;
  template: BusinessTemplate;
}) {
  const toggleMethod = (
    type: "deposit" | "withdrawal",
    index: number
  ) => {
    const key = type === "deposit" ? "depositMethods" : "withdrawalMethods";
    setPaymentConfig((prev) => {
      const methods = [...prev[key]];
      methods[index] = { ...methods[index], enabled: !methods[index].enabled };
      return { ...prev, [key]: methods };
    });
  };

  return (
    <div className="space-y-8">
      {/* 标题 */}
      <motion.div {...fadeInUp}>
        <h2 className="text-xl font-semibold text-[rgb(var(--tp-fg-rgb))] flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[rgb(var(--tp-accent-rgb))]" />
          配置支付方式
        </h2>
        <p className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)] mt-1">
          基于「{template.name}」模板预选了推荐渠道
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* 入金渠道 */}
        <motion.div {...fadeInUp}>
          <h3 className="text-sm font-semibold text-[rgb(var(--tp-fg-rgb))] flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-emerald-600" />
            入金方式
            <span className="text-xs font-normal text-[rgba(var(--tp-fg-rgb),0.5)]">
              ({paymentConfig.depositMethods.filter((m) => m.enabled).length} 个已启用)
            </span>
          </h3>
          <div className="space-y-3">
            {paymentConfig.depositMethods.map((method, index) => (
              <motion.div
                key={`${method.provider}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => toggleMethod("deposit", index)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",
                  method.enabled
                    ? "border-emerald-500 bg-emerald-50/50"
                    : "border-[var(--tp-border)] bg-[var(--tp-bg)] hover:border-[rgba(var(--tp-fg-rgb),0.3)]"
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{method.icon}</span>
                  <div>
                    <div className="font-medium text-[rgb(var(--tp-fg-rgb))]">{method.providerName}</div>
                    <div className="text-xs text-[rgba(var(--tp-fg-rgb),0.5)] mt-0.5 flex items-center gap-2">
                      <span>限额: ${method.minAmount.toLocaleString()} - ${method.maxAmount.toLocaleString()}</span>
                      <span>·</span>
                      <span>手续费: {method.fee}{method.feeType === "percentage" ? "%" : "$"}</span>
                      <span>·</span>
                      <span>{method.processingTime}</span>
                    </div>
                  </div>
                </div>
                <div
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    method.enabled
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-[rgba(var(--tp-fg-rgb),0.3)]"
                  )}
                >
                  {method.enabled && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 出金渠道 */}
        <motion.div {...fadeInUp}>
          <h3 className="text-sm font-semibold text-[rgb(var(--tp-fg-rgb))] flex items-center gap-2 mb-4">
            <Banknote className="w-4 h-4 text-blue-600" />
            出金方式
            <span className="text-xs font-normal text-[rgba(var(--tp-fg-rgb),0.5)]">
              ({paymentConfig.withdrawalMethods.filter((m) => m.enabled).length} 个已启用)
            </span>
          </h3>
          <div className="space-y-3">
            {paymentConfig.withdrawalMethods.map((method, index) => (
              <motion.div
                key={`${method.provider}-w-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => toggleMethod("withdrawal", index)}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",
                  method.enabled
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-[var(--tp-border)] bg-[var(--tp-bg)] hover:border-[rgba(var(--tp-fg-rgb),0.3)]"
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{method.icon}</span>
                  <div>
                    <div className="font-medium text-[rgb(var(--tp-fg-rgb))]">{method.providerName}</div>
                    <div className="text-xs text-[rgba(var(--tp-fg-rgb),0.5)] mt-0.5 flex items-center gap-2">
                      <span>限额: ${method.minAmount.toLocaleString()} - ${method.maxAmount.toLocaleString()}</span>
                      <span>·</span>
                      <span>手续费: {method.fee}{method.feeType === "percentage" ? "%" : "$"}</span>
                      <span>·</span>
                      <span>{method.processingTime}</span>
                    </div>
                  </div>
                </div>
                <div
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    method.enabled
                      ? "border-blue-500 bg-blue-500"
                      : "border-[rgba(var(--tp-fg-rgb),0.3)]"
                  )}
                >
                  {method.enabled && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 提示 */}
        <motion.div
          {...fadeInUp}
          className="p-4 rounded-xl bg-amber-50 border border-amber-200"
        >
          <div className="flex items-start gap-3">
            <CircleDollarSign className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">支付渠道说明</p>
              <p className="text-xs text-amber-700 mt-1">
                以上支付方式为演示配置。实际开通需要与支付服务商签约并配置 API 密钥。
                创建租户后可在「设置-支付管理」中完善。
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ============================================
// Step 4: 确认创建
// ============================================
function Step4Confirm({
  brandForm,
  template,
  paymentConfig,
}: {
  brandForm: BrandConfig & { logoUrl?: string; faviconUrl?: string };
  template: BusinessTemplate;
  paymentConfig: PaymentConfig;
}) {
  const enabledDeposits = paymentConfig.depositMethods.filter((m) => m.enabled);
  const enabledWithdrawals = paymentConfig.withdrawalMethods.filter((m) => m.enabled);

  const sections = [
    {
      title: "品牌信息",
      icon: Building2,
      items: [
        { label: "品牌名称", value: brandForm.brandName },
        { label: "公司全称", value: brandForm.companyName },
        { label: "租户标识", value: brandForm.slug },
        {
          label: "品牌色",
          value: (
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border border-[rgba(0,0,0,0.1)]"
                style={{ backgroundColor: brandForm.primaryColor }}
              />
              <span className="text-xs font-mono">{brandForm.primaryColor}</span>
            </div>
          ),
        },
        {
          label: "Logo",
          value: brandForm.logoUrl ? (
            <span className="text-emerald-600 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> 已上传
            </span>
          ) : (
            "未上传"
          ),
        },
      ],
    },
    {
      title: "业务模板",
      icon: Briefcase,
      items: [
        { label: "模板", value: `${template.icon} ${template.name}` },
        {
          label: "交易产品",
          value: template.preset.instruments
            .map((i) =>
              i === "forex"
                ? "外汇"
                : i === "metals"
                ? "贵金属"
                : i === "indices"
                ? "指数"
                : i === "commodities"
                ? "大宗商品"
                : i === "crypto"
                ? "加密货币"
                : i
            )
            .join(", "),
        },
        { label: "杠杆选项", value: template.preset.leverageOptions.join(", ") },
        { label: "最低入金", value: `$${template.preset.minDeposit}` },
      ],
    },
    {
      title: "支付配置",
      icon: CreditCard,
      items: [
        { label: "入金渠道", value: `${enabledDeposits.length} 个: ${enabledDeposits.map((m) => m.providerName).join(", ")}` },
        { label: "出金渠道", value: `${enabledWithdrawals.length} 个: ${enabledWithdrawals.map((m) => m.providerName).join(", ")}` },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* 标题 */}
      <motion.div {...fadeInUp}>
        <h2 className="text-xl font-semibold text-[rgb(var(--tp-fg-rgb))] flex items-center gap-2">
          <Rocket className="w-5 h-5 text-[rgb(var(--tp-accent-rgb))]" />
          确认配置
        </h2>
        <p className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)] mt-1">
          请检查以下配置，确认无误后创建租户
        </p>
      </motion.div>

      {/* 配置摘要 */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-4"
      >
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.title}
              {...fadeInUp}
              transition={{ delay: index * 0.1 }}
              className="p-5 rounded-xl bg-[var(--tp-bg)] border border-[var(--tp-border)]"
            >
              <h3 className="text-sm font-semibold text-[rgb(var(--tp-accent-rgb))] flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4" />
                {section.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {section.items.map((item) => (
                  <div key={item.label} className="flex flex-col gap-1">
                    <span className="text-xs text-[rgba(var(--tp-fg-rgb),0.5)]">{item.label}</span>
                    <span className="text-sm text-[rgb(var(--tp-fg-rgb))] font-medium">
                      {typeof item.value === "string" ? item.value || "-" : item.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* MVP 试用提示 */}
      <motion.div
        {...fadeInUp}
        className="p-5 rounded-xl border border-amber-200 bg-amber-50"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-800">MVP 试用模式</h4>
            <p className="text-xs text-amber-700 mt-1.5">
              当前处于 14 天 MVP 试用阶段，部分功能受限：
            </p>
            <ul className="text-xs text-amber-700 mt-2 space-y-1 list-disc list-inside">
              <li>最大 10 个用户、5 个交易账户</li>
              <li>存款单笔上限 $100，提款单笔上限 $50</li>
              <li>MT5 仅支持 Demo 账户</li>
              <li>部分三方通道为 TradePass 默认服务</li>
            </ul>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => {
                window.location.href = "/console/billing?upgrade=starter";
              }}
            >
              升级至 Starter 套餐
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* 预计开通时间 */}
      <motion.div
        {...fadeInUp}
        className="p-4 rounded-xl bg-emerald-50 border border-emerald-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-800">预计开通时间: 即时</p>
            <p className="text-xs text-emerald-700">
              创建后您将获得 Portal/CRM/Broker 三个业务系统的完整访问权限
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
