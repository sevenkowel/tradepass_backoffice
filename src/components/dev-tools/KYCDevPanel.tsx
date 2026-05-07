"use client";

/**
 * KYC DevPanel - 开发调试面板
 * 悬浮在页面层级之上，用于：
 * 1. 一键切换 KYC 状态快照
 * 2. 地区/配置热切换
 * 3. Mock 行为控制
 * 4. KYC 等级快捷演示
 */

import { useRouter } from "next/navigation";
import { useKYCStore } from "@/lib/kyc/store";
import { useKYCMockConfig } from "@/lib/kyc/dev-mock-config";
import { regionKYCConfigs, getRegionConfig } from "@/lib/kyc/region-config";
import type { RegionCode } from "@/lib/kyc/region-config";
import type { ReviewResult } from "@/lib/kyc/mock-service";
import type { KYCTierLevel, VerificationStage } from "@/lib/kyc/config-types";
import {
  RotateCcw,
  FileCheck,
  ScanFace,
  UserCheck,
  FileSignature,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  Database,
  ChevronDown,
  Globe,
  Zap,
  Smartphone,
  Mail,
  Shield,
  Layers,
  Crown,
  BadgeCheck,
  CircleDashed,
  ShieldCheck,
  ArrowRight,
  Home,
  ClipboardList,
} from "lucide-react";
import { useDevConfig } from "@/lib/dev-config";
import { useKYCSystemConfig } from "@/lib/kyc/use-kyc-system-config";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

// ─── 状态快照定义 ────────────────────────────────────────────

interface KYCSnapshot {
  id: string;
  label: string;
  icon: React.ElementType;
  iconBg: string;
  apply: () => void;
  navigateTo: string;
}

// ─── KYC 等级定义 ────────────────────────────────────────────

interface KYCTierDemo {
  level: KYCTierLevel;
  name: string;
  stages: VerificationStage[];
  icon: React.ElementType;
  iconBg: string;
}

const KYC_TIERS: KYCTierDemo[] = [
  {
    level: 0,
    name: "未认证",
    stages: [],
    icon: CircleDashed,
    iconBg: "bg-gray-100 text-gray-600",
  },
  {
    level: 1,
    name: "基础认证",
    stages: ["identity"],
    icon: Shield,
    iconBg: "bg-blue-100 text-blue-600",
  },
  {
    level: 2,
    name: "标准认证",
    stages: ["identity", "liveness"],
    icon: ShieldCheck,
    iconBg: "bg-green-100 text-green-600",
  },
  {
    level: 3,
    name: "高级认证",
    stages: ["identity", "liveness", "address"],
    icon: BadgeCheck,
    iconBg: "bg-purple-100 text-purple-600",
  },
  {
    level: 4,
    name: "完整认证",
    stages: ["identity", "liveness", "address", "questionnaire"],
    icon: Crown,
    iconBg: "bg-amber-100 text-amber-600",
  },
];

const STAGE_ICONS: Record<VerificationStage, React.ElementType> = {
  identity: FileCheck,
  liveness: ScanFace,
  address: Home,
  questionnaire: ClipboardList,
};

const STAGE_COLORS: Record<VerificationStage, string> = {
  identity: "blue",
  liveness: "purple",
  address: "green",
  questionnaire: "orange",
};

// ─── 地区选项 ────────────────────────────────────────────────

const REGIONS = Object.values(regionKYCConfigs);

// ─── 审核结果选项 ────────────────────────────────────────────

const REVIEW_OPTIONS: { value: "auto" | ReviewResult; label: string }[] = [
  { value: "auto", label: "自动" },
  { value: "approved", label: "通过" },
  { value: "manual_review", label: "人工审核" },
  { value: "rejected", label: "拒绝" },
];

// ─── 面板组件 ────────────────────────────────────────────────

export function KYCDevPanel() {
  const router = useRouter();
  const kycStore = useKYCStore();
  const mockConfig = useKYCMockConfig();
  const devConfig = useDevConfig();
  const { config: unifiedConfig, loading: configLoading } = useKYCSystemConfig();
  const [activeTab, setActiveTab] = useState<"snapshots" | "tiers" | "config">("snapshots");

  const currentRegionConfig = (() => {
    try {
      return getRegionConfig(mockConfig.regionCode);
    } catch {
      return null;
    }
  })();
  const currentUnifiedRegion = unifiedConfig?.regions?.[mockConfig.regionCode];

  // ── 快照应用函数 ──

  const snapshots: KYCSnapshot[] = [
    {
      id: "fresh",
      label: "全新用户",
      icon: RotateCcw,
      iconBg: "bg-gray-100 text-gray-600",
      apply: () => {
        kycStore.reset();
        kycStore.setRegion(mockConfig.regionCode);
      },
      navigateTo: "/portal/kyc",
    },
    {
      id: "document-uploaded",
      label: "证件已上传",
      icon: FileCheck,
      iconBg: "bg-blue-100 text-blue-600",
      apply: () => {
        kycStore.reset();
        kycStore.setRegion(mockConfig.regionCode);
        kycStore.setDocumentType("id_card");
        kycStore.setDocumentImages("/mock/id-front.jpg", "/mock/id-back.jpg");
        kycStore.setOCRResult({
          documentType: "id_card",
          fullName: "NGUYEN VAN A",
          idNumber: "012345678901",
          dateOfBirth: "1990-01-01",
          nationality: "Vietnamese",
          expiryDate: "2030-01-01",
          address: "123 Le Loi Street, District 1, Ho Chi Minh City",
          confidence: mockConfig.ocrConfidence,
          rawData: { processingTime: 1200, engineVersion: "mock-v1.0", imageQuality: "good" },
        });
        kycStore.setStatus("ocr_completed");
        kycStore.setCurrentStep(2);
      },
      navigateTo: "/portal/kyc/liveness",
    },
    {
      id: "liveness-passed",
      label: "活体通过",
      icon: ScanFace,
      iconBg: "bg-purple-100 text-purple-600",
      apply: () => {
        kycStore.reset();
        kycStore.setRegion(mockConfig.regionCode);
        kycStore.setDocumentType("id_card");
        kycStore.setDocumentImages("/mock/id-front.jpg", "/mock/id-back.jpg");
        kycStore.setOCRResult({
          documentType: "id_card",
          fullName: "NGUYEN VAN A",
          idNumber: "012345678901",
          dateOfBirth: "1990-01-01",
          nationality: "Vietnamese",
          expiryDate: "2030-01-01",
          address: "123 Le Loi Street, District 1, Ho Chi Minh City",
          confidence: mockConfig.ocrConfidence,
          rawData: { processingTime: 1200, engineVersion: "mock-v1.0", imageQuality: "good" },
        });
        kycStore.setLivenessResult(true, "/mock/liveness-video.mp4");
        kycStore.setStatus("liveness_completed");
        kycStore.setCurrentStep(3);
      },
      navigateTo: "/portal/kyc/personal-info",
    },
    {
      id: "info-filled",
      label: "信息已填",
      icon: UserCheck,
      iconBg: "bg-cyan-100 text-cyan-600",
      apply: () => {
        kycStore.reset();
        kycStore.setRegion(mockConfig.regionCode);
        kycStore.setDocumentType("id_card");
        kycStore.setDocumentImages("/mock/id-front.jpg", "/mock/id-back.jpg");
        kycStore.setOCRResult({
          documentType: "id_card",
          fullName: "NGUYEN VAN A",
          idNumber: "012345678901",
          dateOfBirth: "1990-01-01",
          nationality: "Vietnamese",
          expiryDate: "2030-01-01",
          address: "123 Le Loi Street, District 1, Ho Chi Minh City",
          confidence: mockConfig.ocrConfidence,
          rawData: { processingTime: 1200, engineVersion: "mock-v1.0", imageQuality: "good" },
        });
        kycStore.setLivenessResult(true, "/mock/liveness-video.mp4");
        kycStore.setPersonalInfo({
          fullName: "NGUYEN VAN A",
          dateOfBirth: "1990-01-01",
          nationality: "Vietnamese",
          phone: "+84901234567",
          email: "nguyenvana@example.com",
          address: "123 Le Loi Street, District 1, Ho Chi Minh City",
          city: "Ho Chi Minh City",
          country: "Vietnam",
          education: { highestLevel: "bachelor", fieldOfStudy: "Business", institution: "HCMUT" },
          investmentExperience: {
            yearsOfExperience: "1_to_3",
            tradingFrequency: "weekly",
            productsTraded: ["forex", "stocks"],
            riskTolerance: "medium",
          },
          financialStatus: {
            annualIncome: "50k_to_100k",
            netWorth: "100k_to_500k",
            sourceOfFunds: "employment",
            investmentObjectives: ["capital_growth"],
          },
          declarations: {
            isUSPerson: false,
            isPEP: false,
            isMilitary: false,
            isFinancialProfessional: false,
            hasCriminalRecord: false,
          },
        });
        kycStore.setStatus("personal_info_completed");
        kycStore.setCurrentStep(4);
      },
      navigateTo: "/portal/kyc/agreements",
    },
    {
      id: "submitted",
      label: "已提交",
      icon: Send,
      iconBg: "bg-yellow-100 text-yellow-600",
      apply: () => {
        kycStore.reset();
        kycStore.setRegion(mockConfig.regionCode);
        kycStore.setDocumentType("id_card");
        kycStore.setDocumentImages("/mock/id-front.jpg", "/mock/id-back.jpg");
        kycStore.setOCRResult({
          documentType: "id_card",
          fullName: "NGUYEN VAN A",
          idNumber: "012345678901",
          dateOfBirth: "1990-01-01",
          nationality: "Vietnamese",
          expiryDate: "2030-01-01",
          address: "123 Le Loi Street, District 1, Ho Chi Minh City",
          confidence: mockConfig.ocrConfidence,
          rawData: { processingTime: 1200, engineVersion: "mock-v1.0", imageQuality: "good" },
        });
        kycStore.setLivenessResult(true, "/mock/liveness-video.mp4");
        kycStore.setPersonalInfo({
          fullName: "NGUYEN VAN A",
          dateOfBirth: "1990-01-01",
          nationality: "Vietnamese",
          phone: "+84901234567",
          email: "nguyenvana@example.com",
          address: "123 Le Loi Street, District 1, Ho Chi Minh City",
          city: "Ho Chi Minh City",
          country: "Vietnam",
        });
        kycStore.setAgreementSignatures([
          {
            agreementId: "tpa-001",
            agreementName: "Trading Platform Agreement",
            version: "1.0",
            signedAt: new Date().toISOString(),
            signature: "NGUYEN VAN A",
            ipAddress: "127.0.0.1",
            userAgent: "DevTool",
          },
          {
            agreementId: "rp-001",
            agreementName: "Risk Disclosure",
            version: "1.0",
            signedAt: new Date().toISOString(),
            signature: "NGUYEN VAN A",
            ipAddress: "127.0.0.1",
            userAgent: "DevTool",
          },
        ]);
        kycStore.setStatus("submitted");
        kycStore.setCurrentStep(4);
      },
      navigateTo: "/portal/kyc/status",
    },
    {
      id: "under-review",
      label: "审核中",
      icon: Clock,
      iconBg: "bg-orange-100 text-orange-600",
      apply: () => {
        // 先应用 submitted 快照的状态
        snapshots.find(s => s.id === "submitted")?.apply();
        kycStore.setStatus("under_review");
      },
      navigateTo: "/portal/kyc/status",
    },
    {
      id: "approved",
      label: "已通过",
      icon: CheckCircle2,
      iconBg: "bg-green-100 text-green-600",
      apply: () => {
        snapshots.find(s => s.id === "submitted")?.apply();
        kycStore.setStatus("approved");
      },
      navigateTo: "/portal/kyc/status",
    },
    {
      id: "rejected",
      label: "已拒绝",
      icon: XCircle,
      iconBg: "bg-red-100 text-red-600",
      apply: () => {
        snapshots.find(s => s.id === "submitted")?.apply();
        kycStore.setStatus("rejected");
        kycStore.setKYCData({
          rejectionReason: "Document appears to be fraudulent",
          rejectionDetails: "The uploaded document has been flagged by our verification system.",
        } as Record<string, string>);
      },
      navigateTo: "/portal/kyc/status",
    },
  ];

  // ── 等级演示应用函数 ──

  const applyTierDemo = useCallback((tier: KYCTierDemo) => {
    // 重置 KYC 状态
    kycStore.reset();
    kycStore.setRegion(mockConfig.regionCode);

    // 根据等级应用对应阶段
    if (tier.stages.includes("identity")) {
      kycStore.setDocumentType("id_card");
      kycStore.setDocumentImages("/mock/id-front.jpg", "/mock/id-back.jpg");
      kycStore.setOCRResult({
        documentType: "id_card",
        fullName: "NGUYEN VAN A",
        idNumber: "012345678901",
        dateOfBirth: "1990-01-01",
        nationality: "Vietnamese",
        expiryDate: "2030-01-01",
        address: "123 Le Loi Street, District 1, Ho Chi Minh City",
        confidence: mockConfig.ocrConfidence,
        rawData: { processingTime: 1200, engineVersion: "mock-v1.0", imageQuality: "good" },
      });
    }

    if (tier.stages.includes("liveness")) {
      kycStore.setLivenessResult(true, "/mock/liveness-video.mp4");
    }

    if (tier.stages.includes("address")) {
      // 地址阶段需要个人信息作为基础
      kycStore.setPersonalInfo({
        fullName: "NGUYEN VAN A",
        dateOfBirth: "1990-01-01",
        nationality: "Vietnamese",
        phone: "+84901234567",
        email: "nguyenvana@example.com",
        address: "123 Le Loi Street, District 1, Ho Chi Minh City",
        city: "Ho Chi Minh City",
        country: "Vietnam",
      });
    }

    if (tier.stages.includes("questionnaire")) {
      kycStore.setPersonalInfo({
        fullName: "NGUYEN VAN A",
        dateOfBirth: "1990-01-01",
        nationality: "Vietnamese",
        phone: "+84901234567",
        email: "nguyenvana@example.com",
        address: "123 Le Loi Street, District 1, Ho Chi Minh City",
        city: "Ho Chi Minh City",
        country: "Vietnam",
        education: { highestLevel: "bachelor", fieldOfStudy: "Business", institution: "HCMUT" },
        investmentExperience: {
          yearsOfExperience: "1_to_3",
          tradingFrequency: "weekly",
          productsTraded: ["forex", "stocks"],
          riskTolerance: "medium",
        },
        financialStatus: {
          annualIncome: "50k_to_100k",
          netWorth: "100k_to_500k",
          sourceOfFunds: "employment",
          investmentObjectives: ["capital_growth"],
        },
        declarations: {
          isUSPerson: false,
          isPEP: false,
          isMilitary: false,
          isFinancialProfessional: false,
          hasCriminalRecord: false,
        },
      });
      kycStore.setAgreementSignatures([
        {
          agreementId: "tpa-001",
          agreementName: "Trading Platform Agreement",
          version: "1.0",
          signedAt: new Date().toISOString(),
          signature: "NGUYEN VAN A",
          ipAddress: "127.0.0.1",
          userAgent: "DevTool",
        },
        {
          agreementId: "rp-001",
          agreementName: "Risk Disclosure",
          version: "1.0",
          signedAt: new Date().toISOString(),
          signature: "NGUYEN VAN A",
          ipAddress: "127.0.0.1",
          userAgent: "DevTool",
        },
      ]);
    }

    // 设置最终状态
    if (tier.level === 0) {
      kycStore.setStatus("not_started");
    } else if (tier.level >= 1 && tier.level <= 3) {
      kycStore.setStatus("approved");
    } else {
      kycStore.setStatus("approved");
    }

    // 跳转到状态页面
    router.push("/portal/kyc/status");
  }, [kycStore, mockConfig.regionCode, mockConfig.ocrConfidence, router]);

  // ── 快照切换处理 ──

  const handleSnapshotClick = useCallback(
    (snapshot: KYCSnapshot) => {
      snapshot.apply();
      router.push(snapshot.navigateTo);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, mockConfig.regionCode, mockConfig.ocrConfidence]
  );

  // ── 清空 KYC 数据 ──

  const handleClearAll = useCallback(() => {
    kycStore.reset();
    router.push("/portal/kyc");
  }, [kycStore, router]);

  return (
    <div className="space-y-4">
      {/* ── Tab 切换 ── */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {[
          { id: "snapshots", label: "状态快照", icon: Zap },
          { id: "tiers", label: "等级演示", icon: Layers },
          { id: "config", label: "配置控制", icon: Database },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all",
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: 状态快照 ── */}
      {activeTab === "snapshots" && (
        <div>
          <SectionTitle icon={<Zap size={14} />} label="状态快照" />
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {snapshots.map((snap) => {
              const Icon = snap.icon;
              return (
                <button
                  key={snap.id}
                  onClick={() => handleSnapshotClick(snap)}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-2 rounded-lg text-left",
                    "text-xs font-medium transition-all duration-150",
                    "hover:shadow-sm border border-gray-100 hover:border-gray-200",
                    "bg-white hover:bg-gray-50 active:scale-[0.97]"
                  )}
                >
                  <div className={cn("p-1 rounded-md shrink-0", snap.iconBg)}>
                    <Icon size={12} />
                  </div>
                  <span className="text-gray-700 truncate">{snap.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab: 等级演示 ── */}
      {activeTab === "tiers" && (
        <div>
          <SectionTitle icon={<Layers size={14} />} label="KYC 等级快捷演示" />
          <p className="text-[10px] text-gray-400 mt-1 mb-2">点击等级快速设置对应认证状态</p>
          
          <div className="space-y-1.5">
            {KYC_TIERS.map((tier) => {
              const Icon = tier.icon;
              return (
                <button
                  key={tier.level}
                  onClick={() => applyTierDemo(tier)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left",
                    "text-xs font-medium transition-all duration-150",
                    "hover:shadow-sm border border-gray-100 hover:border-gray-200",
                    "bg-white hover:bg-gray-50 active:scale-[0.98]"
                  )}
                >
                  <div className={cn("p-1.5 rounded-md shrink-0", tier.iconBg)}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">Level {tier.level}</span>
                      <span className="text-gray-500">{tier.name}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {tier.stages.length === 0 ? (
                        <span className="text-[10px] text-gray-400">未认证</span>
                      ) : (
                        tier.stages.map((stage) => {
                          const StageIcon = STAGE_ICONS[stage];
                          return (
                            <span
                              key={stage}
                              className={cn(
                                "inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px]",
                                `bg-${STAGE_COLORS[stage]}-50 text-${STAGE_COLORS[stage]}-600`
                              )}
                            >
                              <StageIcon size={8} />
                              <span className="capitalize">{stage.slice(0, 3)}</span>
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-gray-300" />
                </button>
              );
            })}
          </div>

          {/* 当前等级状态 */}
          <div className="mt-3 p-2.5 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">当前状态</span>
              <span className="font-mono text-gray-700">{kycStore.kycData?.status || "not_started"}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: 配置控制 ── */}
      {activeTab === "config" && (
        <>
          {/* ── Section 2: 地区配置 ── */}
          <div>
            <SectionTitle icon={<Globe size={14} />} label="地区配置" />
            <div className="mt-2 space-y-2">
              {/* 地区选择器 */}
              <div className="relative">
                <select
                  value={mockConfig.regionCode}
                  onChange={(e) => mockConfig.setRegionCode(e.target.value as RegionCode)}
                  className={cn(
                    "w-full px-3 py-2 pr-8 rounded-lg text-sm appearance-none",
                    "bg-white border border-gray-200 text-gray-800",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400",
                    "cursor-pointer transition-colors"
                  )}
                >
                  {REGIONS.map((r) => (
                    <option key={r.regionCode} value={r.regionCode}>
                      {r.regionName} ({r.regionCode})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>

              {/* 当前地区特性展示 */}
              {currentRegionConfig && (
                <div className="p-2.5 bg-gray-50 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">KYC 级别</span>
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      currentRegionConfig.kycLevel === "enhanced"
                        ? "bg-purple-100 text-purple-700"
                        : currentRegionConfig.kycLevel === "standard"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    )}>
                      {currentRegionConfig.kycLevel}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <FeatureTag label="OCR" enabled={currentRegionConfig.features.ocrEnabled} />
                    <FeatureTag label="活体" enabled={currentRegionConfig.features.livenessRequired} />
                    <FeatureTag label="地址证明" enabled={currentRegionConfig.features.addressProofRequired} />
                    <FeatureTag label="视频KYC" enabled={currentRegionConfig.features.videoKYCRequired} />
                  </div>
                  <div className="text-xs text-gray-400 pt-1 border-t border-gray-100">
                    证件类型: {currentRegionConfig.allowedDocuments.join(", ")}
                  </div>
                </div>
              )}

              {/* 统一配置预览 */}
              {currentUnifiedRegion && !configLoading && (
                <div className="p-2.5 bg-blue-50/50 rounded-lg space-y-1.5 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600 font-medium">统一配置预览</span>
                    <span className="text-[10px] text-blue-400">
                      v{unifiedConfig?.version}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">开户步骤:</span>
                      <span className="text-gray-700">
                        {Object.entries(currentUnifiedRegion.opening.steps)
                          .filter(([, s]) => s.enabled)
                          .length} 个启用
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">默认等级:</span>
                      <span className="text-gray-700">
                        Tier {currentUnifiedRegion.opening.defaultTierOnComplete}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">升级路径:</span>
                      <span className="text-gray-700">
                        {Object.values(currentUnifiedRegion.kyc.upgradePaths).flat().length} 条
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">补充规则:</span>
                      <span className="text-gray-700">
                        {currentUnifiedRegion.kyc.supplementalTriggers.largeWithdrawal.enabled ? 1 : 0} 条
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Section 3: Mock 控制 ── */}
          <div>
            <SectionTitle icon={<Database size={14} />} label="Mock 控制" />
            <div className="mt-2 space-y-3">
              {/* OCR 置信度 */}
              <SliderControl
                label="OCR 置信度"
                value={mockConfig.ocrConfidence}
                min={0.7}
                max={0.99}
                step={0.01}
                displayValue={`${Math.round(mockConfig.ocrConfidence * 100)}%`}
                onChange={mockConfig.setOcrConfidence}
                color={mockConfig.ocrConfidence >= 0.9 ? "green" : mockConfig.ocrConfidence >= 0.8 ? "yellow" : "red"}
              />

              {/* OCR 模拟失败 */}
              <ToggleRow
                label="OCR 失败"
                checked={mockConfig.ocrSimulateError}
                onChange={mockConfig.setOcrSimulateError}
              />

              {/* 活体通过率 */}
              <SliderControl
                label="活体通过率"
                value={mockConfig.livenessPassRate}
                min={0}
                max={1}
                step={0.1}
                displayValue={`${Math.round(mockConfig.livenessPassRate * 100)}%`}
                onChange={mockConfig.setLivenessPassRate}
                color={mockConfig.livenessPassRate >= 0.8 ? "green" : mockConfig.livenessPassRate >= 0.5 ? "yellow" : "red"}
              />

              {/* 活体强制结果 */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">活体强制</span>
                <div className="flex gap-1">
                  {(["auto", "pass", "fail"] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => mockConfig.setLivenessForceResult(opt)}
                      className={cn(
                        "text-xs px-2 py-1 rounded-md transition-colors",
                        mockConfig.livenessForceResult === opt
                          ? "bg-gray-800 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      )}
                    >
                      {opt === "auto" ? "自动" : opt === "pass" ? "通过" : "失败"}
                    </button>
                  ))}
                </div>
              </div>

              {/* 审核结果锁定 */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">审核结果</span>
                <div className="flex gap-1">
                  {REVIEW_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => mockConfig.setReviewForceResult(opt.value)}
                      className={cn(
                        "text-xs px-2 py-1 rounded-md transition-colors",
                        mockConfig.reviewForceResult === opt.value
                          ? "bg-gray-800 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 4: OTP 验证控制 ── */}
          <div>
            <SectionTitle icon={<Shield size={14} />} label="OTP 验证" />
            <div className="mt-2 space-y-3">
              {/* 跳过 OTP 验证 */}
              <ToggleRow
                label="跳过 OTP 验证"
                checked={devConfig.skipOtpVerification}
                onChange={devConfig.setSkipOtpVerification}
              />

              {/* 预验证手机号 */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Smartphone size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-500">预验证手机号</span>
                </div>
                <input
                  type="tel"
                  value={devConfig.preVerifiedPhone}
                  onChange={(e) => devConfig.setPreVerifiedPhone(e.target.value)}
                  placeholder="+84 901 234 567"
                  className={cn(
                    "w-full px-2.5 py-1.5 rounded-lg text-xs",
                    "bg-white border border-gray-200 text-gray-800",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400",
                    "placeholder:text-gray-400"
                  )}
                />
              </div>

              {/* 预验证邮箱 */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Mail size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-500">预验证邮箱</span>
                </div>
                <input
                  type="email"
                  value={devConfig.preVerifiedEmail}
                  onChange={(e) => devConfig.setPreVerifiedEmail(e.target.value)}
                  placeholder="user@example.com"
                  className={cn(
                    "w-full px-2.5 py-1.5 rounded-lg text-xs",
                    "bg-white border border-gray-200 text-gray-800",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400",
                    "placeholder:text-gray-400"
                  )}
                />
              </div>

              {devConfig.skipOtpVerification && (
                <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-200">
                  <p className="text-[10px] text-yellow-700">
                    <strong>Dev Mode:</strong> OTP verification is bypassed. Any code will be accepted.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Section 5: 快捷操作 ── */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={handleClearAll}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg",
            "text-xs font-medium text-red-600",
            "bg-red-50 hover:bg-red-100 transition-colors"
          )}
        >
          <Trash2 size={13} />
          清空数据
        </button>
        <button
          onClick={() => mockConfig.reset()}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg",
            "text-xs font-medium text-gray-600",
            "bg-gray-100 hover:bg-gray-200 transition-colors"
          )}
        >
          <RotateCcw size={13} />
          重置 Mock
        </button>
      </div>
    </div>
  );
}

// ─── 子组件 ──────────────────────────────────────────────────

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
      {icon}
      {label}
    </div>
  );
}

function FeatureTag({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        enabled ? "bg-green-500" : "bg-gray-300"
      )} />
      <span className="text-gray-600">{label}</span>
    </div>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
  color,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (v: number) => void;
  color: "green" | "yellow" | "red";
}) {
  const pct = ((value - min) / (max - min)) * 100;

  const trackColor =
    color === "green"
      ? "bg-green-500"
      : color === "yellow"
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <span className={cn(
          "text-xs font-mono font-medium",
          color === "green" ? "text-green-700" : color === "yellow" ? "text-yellow-700" : "text-red-700"
        )}>
          {displayValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-200 accent-gray-800"
        style={{
          background: `linear-gradient(to right, #22c55e 0%, #22c55e ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`,
        }}
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-9 h-5 rounded-full transition-colors duration-200",
          checked ? "bg-red-500" : "bg-gray-200"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
            checked && "translate-x-4"
          )}
        />
      </button>
    </div>
  );
}
