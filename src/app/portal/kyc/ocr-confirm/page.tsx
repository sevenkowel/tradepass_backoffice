"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OCRResultEditor } from "@/components/kyc/OCRResultEditor";
import { useKYCStore } from "@/lib/kyc/store";
import { useOCRValidation } from "@/lib/kyc/hooks/useOCRValidation";
import type { OCRResult, DocumentType } from "@/lib/kyc/types";

// 验证错误类型
interface ValidationError {
  field: string;
  message: string;
}

export default function OCRCConfirmPage() {
  const router = useRouter();
  const { kycData, updateKYCData, resetKYC, hasHydrated } = useKYCStore();

  // 本地状态
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [nameSimilarity, setNameSimilarity] = useState<number | undefined>();

  // 检查是否有 OCR 数据（等待 persist hydrate 完成后）
  useEffect(() => {
    if (!hasHydrated) return;
    if (!kycData?.ocrData) {
      // 没有 OCR 数据，跳转到文档上传页
      router.replace("/portal/kyc/document");
    }
  }, [kycData?.ocrData, router, hasHydrated]);

  // 如果还在 hydrate 或没有数据，显示加载中
  if (!hasHydrated || !kycData?.ocrData) {
    return (
      <div className="min-h-screen bg-[rgb(var(--tp-bg-rgb))] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[rgb(var(--tp-accent-rgb))] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[rgba(var(--tp-fg-rgb),0.6)]">加载中...</p>
        </div>
      </div>
    );
  }

  // 处理确认
  const handleConfirm = async (
    data: Partial<OCRResult>,
    editedFields: string[]
  ) => {
    setIsProcessing(true);
    setValidationErrors([]);

    try {
      // 调用确认 API
      const response = await fetch("/api/kyc/ocr/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: kycData?.documentType,
          originalData: kycData?.ocrData,
          editedData: data,
          editedFields,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        // 验证失败
        if (result.errors) {
          setValidationErrors(result.errors);
        }
        return;
      }

      // 更新 KYC 数据
      updateKYCData({
        ocrData: result.data,
        status: "ocr_completed",
      });

      // 跳转到活体检测
      router.push("/portal/kyc/liveness");
    } catch (error) {
      console.error("Confirm error:", error);
      setValidationErrors([
        { field: "global", message: "确认失败，请重试" },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理重新拍摄
  const handleRetry = () => {
    router.push("/portal/kyc/document");
  };

  // 处理返回
  const handleBack = () => {
    router.push("/portal/kyc/document");
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--tp-bg-rgb))]">
      {/* Header */}
      <header className="sticky top-[72px] z-10 bg-[rgb(var(--tp-bg-rgb))] border-b border-[rgba(var(--tp-fg-rgb),0.1)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-[rgba(var(--tp-fg-rgb),0.6)]"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
            <h1 className="text-base font-medium text-[rgb(var(--tp-fg-rgb))]">
              身份验证
            </h1>
            <div className="w-16" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Step Indicator */}
        <div className="mb-8">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="h-2 bg-[rgba(var(--tp-fg-rgb),0.1)] rounded-full overflow-hidden">
              <div className="h-full w-1/4 bg-[rgb(var(--tp-accent-rgb))] rounded-full" />
            </div>
            <div className="flex justify-between mt-2 text-xs text-[rgba(var(--tp-fg-rgb),0.5)]">
              <span className="text-[rgb(var(--tp-accent-rgb))] font-medium">Document</span>
              <span>Liveness</span>
              <span>Personal Info</span>
              <span>Agreement</span>
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[rgba(var(--tp-accent-rgb),0.1)]">
                <Shield className="w-6 h-6 text-[rgb(var(--tp-accent-rgb))]" />
              </div>
              <h2 className="text-lg font-semibold text-[rgb(var(--tp-fg-rgb))]">
                确认证件信息
              </h2>
            </div>
            <p className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)]">
              请核对 OCR 识别的信息，如有错误请修正
            </p>
          </div>
        </div>

        {/* OCR Result Editor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <OCRResultEditor
            result={kycData!.ocrData}
            frontImage={kycData!.documentFrontUrl || ""}
            backImage={kycData!.documentBackUrl}
            onConfirm={handleConfirm}
            onRetry={handleRetry}
            isProcessing={isProcessing}
            externalErrors={validationErrors}
            nameSimilarity={nameSimilarity}
          />
        </motion.div>

        {/* 底部提示 */}
        <div className="mt-8 p-4 rounded-xl bg-[rgba(var(--tp-fg-rgb),0.03)] border border-[rgba(var(--tp-fg-rgb),0.08)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[rgba(var(--tp-fg-rgb),0.4)] mt-0.5" />
            <div className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)]">
              <p className="font-medium text-[rgb(var(--tp-fg-rgb))] mb-1">
                信息保护说明
              </p>
              <p>
                您的证件信息将加密存储，仅用于身份验证。我们严格遵守 GDPR
                和国际数据保护标准。
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
