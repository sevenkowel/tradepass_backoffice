"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Shield, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocumentUpload } from "@/components/kyc/DocumentUpload";
import { useKYCStore } from "@/lib/kyc/store";
import { useKYCGuard } from "@/lib/kyc/guard-client";
import { devFetch } from "@/lib/kyc/dev-fetch";
import type { DocumentType } from "@/lib/kyc/types";

export default function DocumentPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBackImage, setLastBackImage] = useState<string | null>(null);

  const {
    setDocumentType,
    setDocumentImages,
    setOCRResult: saveOCRResult,
    regionCode,
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
        body: JSON.stringify({
          documentType: type,
          imageBase64: frontImage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "OCR processing failed");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "OCR recognition failed");
      }

      if (!data.data) {
        throw new Error("Invalid OCR response data");
      }

      // 保存 OCR 结果到 store
      saveOCRResult(data.data);

      // 自动保存步骤到数据库
      try {
        await devFetch("/api/kyc/save-step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: 1,
            data: {
              documentType: type,
              documentFrontUrl: frontImage,
              documentBackUrl: lastBackImage,
              ocrConfidence: data.data.confidence,
              ocrData: data.data,
            },
          }),
        });
      } catch (saveErr) {
        console.warn("Auto-save step 1 failed:", saveErr);
        // 不阻塞流程，继续跳转
      }

      // 跳转到 OCR 确认页面
      router.push("/portal/kyc/ocr-confirm");
    } catch (error) {
      console.error("OCR error:", error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };



  return (
    <div className="min-h-screen bg-[rgb(var(--tp-bg-rgb))] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.push("/portal/kyc")}
            className="mb-4 -ml-4 text-[rgba(var(--tp-fg-rgb),0.7)]"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[rgba(var(--tp-accent-rgb),0.1)]">
              <Shield className="w-6 h-6 text-[rgb(var(--tp-accent-rgb))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--tp-fg-rgb))]">
                Identity Verification
              </h1>
              <p className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)]">
                Step 1 of 4 • Upload your identification document
              </p>
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          className="mb-8"
        >
          <div className="h-2 bg-[rgba(var(--tp-fg-rgb),0.1)] rounded-full overflow-hidden">
            <div className="h-full w-1/4 bg-[rgb(var(--tp-accent-rgb))] rounded-full" />
          </div>
          <div className="flex justify-between mt-2 text-xs text-[rgba(var(--tp-fg-rgb),0.5)]">
            <span className="text-[rgb(var(--tp-accent-rgb))] font-medium">Document</span>
            <span>Liveness</span>
            <span>Personal Info</span>
            <span>Agreement</span>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-start gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm">{error}</p>
                {error.includes("OCR engine error") && (
                  <p className="text-xs mt-2 text-red-600">
                    💡 提示：这是开发环境的模拟错误。请打开 DevTools 悬浮工具箱，关闭 &quot;Simulate OCR Error&quot; 开关。
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
              <CardDescription>
                Please upload a clear photo of your government-issued ID. Make sure all details are visible and the document is not expired.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUpload
                onUpload={handleUpload}
                onOCR={handleOCR}
                isProcessing={isProcessing}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-[rgba(var(--tp-fg-rgb),0.4)] mt-6"
        >
          Your information is encrypted and securely stored. We comply with GDPR and international data protection standards.
        </motion.p>
      </div>
    </div>
  );
}
