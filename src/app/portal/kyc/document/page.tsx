"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Shield, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocumentUpload } from "@/components/kyc/DocumentUpload";
import { OCRResultEditor } from "@/components/kyc/OCRResultEditor";
import { useKYCStore } from "@/lib/kyc/store";
import { useKYCGuard } from "@/lib/kyc/guard-client";
import { devFetch } from "@/lib/kyc/dev-fetch";
import type { DocumentType, OCRResult, PersonalInfo } from "@/lib/kyc/types";

interface ValidationError {
  field: string;
  message: string;
}

export default function DocumentPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBackImage, setLastBackImage] = useState<string | null>(null);
  
  // 阶段：upload | confirming | done
  const [stage, setStage] = useState<"upload" | "confirming" | "done">("upload");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const {
    setDocumentType,
    setDocumentImages,
    setOCRResult: saveOCRResult,
    setPersonalInfo,
    setStatus,
    kycData,
    regionCode,
    updateKYCData,
  } = useKYCStore();

  // Step guard
  const { allowed, checking } = useKYCGuard("document");

  if (checking) {
    return (
      <div className="min-h-screen bg-[rgb(var(--tp-bg-rgb))] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--tp-accent-rgb))]" />
      </div>
    );
  }

  const handleUpload = (frontImage: string, backImage: string | null, type: DocumentType) => {
    setDocumentType(type);
    setDocumentImages(frontImage, backImage || undefined);
    setLastBackImage(backImage);
    setError(null);
  };

  const handleOCR = async (frontImage: string, type: DocumentType) => {
    setIsProcessing(true);
    setError(null);
    try {
      const response = await devFetch("/api/kyc/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: type, imageBase64: frontImage }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "OCR processing failed");
      }

      const data = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || "OCR recognition failed");
      }

      saveOCRResult(data.data);
      setStage("confirming");

      try {
        await devFetch("/api/kyc/save-step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: 1,
            data: { documentType: type, documentFrontUrl: frontImage, documentBackUrl: lastBackImage, ocrConfidence: data.data.confidence, ocrData: data.data },
          }),
        });
      } catch { /* non-blocking */ }
    } catch (e) {
      console.error("OCR error:", e);
      setError(e instanceof Error ? e.message : "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async (data: Partial<OCRResult>, editedFields: string[]) => {
    setIsProcessing(true);
    setValidationErrors([]);

    try {
      const response = await devFetch("/api/kyc/ocr/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: kycData?.documentType, originalData: kycData?.ocrData, editedData: data, editedFields }),
      });

      const result = await response.json();

      if (!result.success) {
        if (result.errors?.length) {
          setValidationErrors(result.errors);
        } else {
          setValidationErrors([{ field: "global", message: result.message || result.error || "确认失败，请重试" }]);
        }
        return;
      }

      // 保存 OCR + 基础个人信息
      const personalInfo = {
        fullName: (result.data?.fullName || data.fullName || "") as string,
        dateOfBirth: (result.data?.dateOfBirth || data.dateOfBirth || "") as string,
        nationality: (result.data?.nationality || data.nationality || "") as string,
        phone: "",
        email: "",
        address: (result.data?.address || data.address || "") as string,
        city: "",
        country: regionCode || "",
      } as PersonalInfo;
      updateKYCData({ ocrData: result.data, personalInfo, status: "ocr_completed" });
      setStage("done");

      // 延迟跳转到下一步
      setTimeout(() => {
        const steps = useKYCStore.getState().getEnabledSteps();
        const nextStep = useKYCStore.getState().getNextStep();
        if (nextStep) router.push(`/portal/kyc/${nextStep}`);
      }, 800);
    } catch (e) {
      console.error("Confirm error:", e);
      setValidationErrors([{ field: "global", message: "确认失败，请重试" }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setStage("upload");
    setError(null);
  };

  if (stage === "done") {
    return (
      <div className="min-h-screen bg-[rgb(var(--tp-bg-rgb))] flex items-center justify-center">
        <div className="text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <p className="text-[rgb(var(--tp-fg-rgb))]">验证完成，正在跳转...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--tp-bg-rgb))] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" onClick={() => router.push("/portal/kyc")} className="mb-4 -ml-4 text-[rgba(var(--tp-fg-rgb),0.7)]">
            <ChevronLeft className="w-4 h-4 mr-1" />Back
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[rgba(var(--tp-accent-rgb),0.1)]">
              <Shield className="w-6 h-6 text-[rgb(var(--tp-accent-rgb))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--tp-fg-rgb))]">{stage === "confirming" ? "确认信息" : "证件认证"}</h1>
              <p className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)]">Step 2 • {stage === "confirming" ? "核对 OCR 识别结果" : "上传证件照片"}</p>
            </div>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-start gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Upload Stage */}
        {stage === "upload" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle>Upload Document</CardTitle>
                <CardDescription>Please upload a clear photo of your government-issued ID.</CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentUpload onUpload={handleUpload} onOCR={handleOCR} isProcessing={isProcessing} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Confirm Stage - inline OCR editing */}
        {stage === "confirming" && kycData?.ocrData && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <OCRResultEditor
              result={kycData.ocrData}
              frontImage={kycData.documentFrontUrl || ""}
              backImage={kycData.documentBackUrl}
              onConfirm={handleConfirm}
              onRetry={handleRetry}
              isProcessing={isProcessing}
              externalErrors={validationErrors}
            />
          </motion.div>
        )}

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center text-xs text-[rgba(var(--tp-fg-rgb),0.4)] mt-6">
          Your information is encrypted and securely stored.
        </motion.p>
      </div>
    </div>
  );
}
