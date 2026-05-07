/**
 * KYC 状态管理 (Zustand)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  UserKYC,
  KYCStatus,
  OCRResult,
  PersonalInfo,
  AgreementSignature,
  DocumentType,
  RegionCode,
} from "./types";

interface KYCState {
  // 当前 KYC 记录
  kycData: Partial<UserKYC> | null;
  
  // 当前步骤 (1-4)
  currentStep: number;
  
  // 地区配置
  regionCode: RegionCode | null;
  
  // 加载状态
  isLoading: boolean;
  error: string | null;
  
  // Hydration 状态（persist 恢复完成后为 true）
  hasHydrated: boolean;
  
  // Actions
  setRegion: (region: RegionCode) => void;
  setKYCData: (data: Partial<UserKYC>) => void;
  setCurrentStep: (step: number) => void;
  setDocumentType: (type: DocumentType) => void;
  setDocumentImages: (frontUrl: string, backUrl?: string) => void;
  setOCRResult: (result: OCRResult) => void;
  setLivenessResult: (passed: boolean, videoUrl?: string) => void;
  setPersonalInfo: (info: PersonalInfo) => void;
  setAgreementSignatures: (signatures: AgreementSignature[]) => void;
  setStatus: (status: KYCStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  updateKYCData: (data: Partial<UserKYC>) => void;
  resetKYC: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  
  // 流程控制
  canProceedToStep: (step: number) => boolean;
  getProgress: () => number;
}

const initialState = {
  kycData: null,
  currentStep: 1,
  regionCode: null,
  isLoading: false,
  error: null,
  hasHydrated: false,
};

export const useKYCStore = create<KYCState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setRegion: (region) => set({ regionCode: region }),
      
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
      
      updateKYCData: (data) => set((state) => ({
        kycData: state.kycData ? { ...state.kycData, ...data } : data as UserKYC,
      })),
      
      resetKYC: () => set(initialState),
      
      setLivenessResult: (passed, videoUrl) => set((state) => ({
        kycData: { 
          ...state.kycData, 
          livenessPassed: passed,
          livenessVideoUrl: videoUrl,
        },
      })),
      
      setPersonalInfo: (info) => set((state) => ({
        kycData: { ...state.kycData, personalInfo: info },
      })),
      
      setAgreementSignatures: (signatures) => set((state) => ({
        kycData: { ...state.kycData, agreementsSigned: signatures },
      })),
      
      setStatus: (status) => set((state) => ({
        kycData: { ...state.kycData, status },
      })),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      
      reset: () => set(initialState),
      
      canProceedToStep: (step) => {
        const { kycData, regionCode } = get();
        if (!regionCode) return false;
        
        // Step 1: Document - always can start
        if (step === 1) return true;
        
        // Step 2: Liveness - need document uploaded
        if (step === 2) {
          return !!kycData?.documentFrontUrl && !!kycData?.ocrData;
        }
        
        // Step 3: Personal Info - need liveness passed (if required)
        if (step === 3) {
          // TODO: Check region config if liveness is required
          return !!kycData?.livenessPassed || step === 3;
        }
        
        // Step 4: Agreement - need personal info
        if (step === 4) {
          return !!kycData?.personalInfo;
        }
        
        return false;
      },
      
      getProgress: () => {
        const { kycData } = get();
        let progress = 0;
        
        // Document: 25%
        if (kycData?.documentFrontUrl) progress += 25;
        
        // Liveness: 25%
        if (kycData?.livenessPassed) progress += 25;
        
        // Personal Info: 25%
        if (kycData?.personalInfo) progress += 25;
        
        // Agreement: 25%
        if (kycData?.agreementsSigned && kycData.agreementsSigned.length > 0) {
          progress += 25;
        }
        
        return progress;
      },
    }),
    {
      name: "kyc-storage",
      partialize: (state) => ({
        kycData: state.kycData,
        currentStep: state.currentStep,
        regionCode: state.regionCode,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
