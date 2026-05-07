/**
 * KYC 状态管理 (Zustand) — 支持 6 步动态流程
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getRegionConfig } from "./region-config";
import type {
  UserKYC,
  KYCStatus,
  OCRResult,
  PersonalInfo,
  ExperienceInfo,
  AgreementSignature,
  DocumentType,
  RegionCode,
} from "./types";

interface KYCState {
  // 当前 KYC 记录
  kycData: Partial<UserKYC> | null;
  
  // 当前步骤 (1-6)
  currentStep: number;
  // 当前步骤名
  currentStepName: string;
  
  // 地区配置
  regionCode: RegionCode | null;
  
  // 总步骤数（根据地区动态计算）
  totalSteps: number;
  
  // 加载状态
  isLoading: boolean;
  error: string | null;
  
  // Hydration 状态
  hasHydrated: boolean;
  
  // Actions
  setRegion: (region: RegionCode) => void;
  setKYCData: (data: Partial<UserKYC>) => void;
  setCurrentStep: (step: number) => void;
  setDocumentType: (type: DocumentType) => void;
  setDocumentImages: (frontUrl: string, backUrl?: string) => void;
  setOCRResult: (result: OCRResult) => void;
  setLivenessResult: (passed: boolean, videoUrl?: string) => void;
  setAddressProof: (url: string, type: string) => void;
  setPersonalInfo: (info: PersonalInfo) => void;
  setExperienceInfo: (info: ExperienceInfo) => void;
  setAgreementSignatures: (signatures: AgreementSignature[], signatureType?: "handwritten" | "text") => void;
  setStatus: (status: KYCStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  updateKYCData: (data: Partial<UserKYC>) => void;
  resetKYC: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  
  // 流程控制
  getEnabledSteps: () => string[];
  getNextStep: () => string | null;
  canProceedToStep: (stepName: string) => boolean;
  getProgress: () => number;
}

const initialState = {
  kycData: null,
  currentStep: 1,
  currentStepName: "region",
  regionCode: null,
  totalSteps: 6,
  isLoading: false,
  error: null,
  hasHydrated: false,
};

export const useKYCStore = create<KYCState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setRegion: (region) => {
        const cfg = getRegionConfig(region);
        const steps = 2
          + (cfg.features.livenessRequired ? 1 : 0)
          + (cfg.features.addressProofRequired ? 1 : 0)
          + 2; // experience + agreements
        set({ regionCode: region, totalSteps: steps });
      },
      
      setKYCData: (data) => set((state) => ({
        kycData: { ...state.kycData, ...data },
      })),
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      setDocumentType: (type) => set((state) => ({
        kycData: { ...state.kycData, documentType: type },
      })),
      
      setDocumentImages: (frontUrl, backUrl) => set((state) => ({
        kycData: { 
          ...state.kycData, 
          documentFrontUrl: frontUrl,
          documentBackUrl: backUrl,
        },
      })),
      
      setOCRResult: (result) => set((state) => ({
        kycData: { 
          ...state.kycData, 
          ocrData: result,
          ocrConfidence: result.confidence ?? 0.85,
          status: "ocr_completed" as const,
        },
      })),
      
      setLivenessResult: (passed, videoUrl) => set((state) => ({
        kycData: { 
          ...state.kycData, 
          livenessPassed: passed,
          livenessVideoUrl: videoUrl,
        },
      })),
      
      setAddressProof: (url, type) => set((state) => ({
        kycData: {
          ...state.kycData,
          addressProofUrl: url,
          addressProofType: type,
          addressProofUploadedAt: new Date().toISOString(),
        },
      })),
      
      setPersonalInfo: (info) => set((state) => ({
        kycData: { ...state.kycData, personalInfo: info },
      })),
      
      setExperienceInfo: (info) => set((state) => ({
        kycData: { ...state.kycData, experienceInfo: info },
      })),
      
      setAgreementSignatures: (signatures, signatureType) => set((state) => ({
        kycData: { 
          ...state.kycData, 
          agreementsSigned: signatures,
          signatureType: signatureType || (state.kycData?.signatureType as "handwritten" | "text"),
        },
      })),
      
      setStatus: (status) => set((state) => ({
        kycData: { ...state.kycData, status },
      })),
      
      updateKYCData: (data) => set((state) => ({
        kycData: state.kycData ? { ...state.kycData, ...data } : data as UserKYC,
      })),
      
      resetKYC: () => set(initialState),
      
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      reset: () => set(initialState),
      
      // ===== 流程控制 =====
      
      getEnabledSteps: () => {
        const { regionCode } = get();
        if (!regionCode) return ["region"];
        const cfg = getRegionConfig(regionCode);
        const steps = ["region", "document"];
        if (cfg.features.livenessRequired) steps.push("liveness");
        if (cfg.features.addressProofRequired) steps.push("address-proof");
        steps.push("experience", "agreement");
        return steps;
      },
      
      getNextStep: () => {
        const steps = get().getEnabledSteps();
        const currentIdx = steps.indexOf(get().currentStepName);
        if (currentIdx >= 0 && currentIdx < steps.length - 1) {
          return steps[currentIdx + 1];
        }
        return null;
      },
      
      canProceedToStep: (stepName) => {
        const { kycData, regionCode } = get();
        if (!regionCode && stepName !== "region") return false;
        if (!kycData) return false;
        
        switch (stepName) {
          case "region":       return true;
          case "document":     return !!kycData.regionCode;
          case "liveness":     return !!kycData.ocrData;
          case "address-proof": return !!kycData.livenessPassed;
          case "experience":   return true; // 始终可进入
          case "agreement":    return !!kycData.experienceInfo;
          default:             return false;
        }
      },
      
      getProgress: () => {
        const { kycData } = get();
        const steps = get().getEnabledSteps();
        const completed = steps.filter((s) => {
          switch (s) {
            case "region":       return true;
            case "document":     return !!kycData?.ocrData && !!kycData?.personalInfo;
            case "liveness":     return !!kycData?.livenessPassed;
            case "address-proof": return !!kycData?.addressProofUrl;
            case "experience":   return !!kycData?.experienceInfo;
            case "agreement":    return !!(kycData?.agreementsSigned?.length ?? 0 > 0);
            default:             return false;
          }
        }).length;
        return Math.round((completed / steps.length) * 100);
      },
    }),
    {
      name: "kyc-storage",
      partialize: (state) => ({
        kycData: state.kycData,
        currentStep: state.currentStep,
        currentStepName: state.currentStepName,
        regionCode: state.regionCode,
        totalSteps: state.totalSteps,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
